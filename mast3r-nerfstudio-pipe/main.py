import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from full_pipe import full_pipe
from fastapi.middleware.cors import CORSMiddleware
import time
import boto3
from urllib.parse import urlparse
import shutil
import requests
import threading
import subprocess
import dotenv
import os

dotenv.load_dotenv()

MINIO_EDNPOINT = "http://minio:9000"
MINIO_ROOT_USER = os.getenv("MINIO_ROOT_USER")
MINIO_ROOT_PASSWORD = os.getenv("MINIO_ROOT_PASSWORD")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
CALLBACK_ENDPOINT = "http://web:8001/complete_build/"
TOKEN_REQUEST_ENDPOINT = "http://web:8001/api/token/"


class CustomHTTPException(HTTPException):
    def __init__(self, status_code: int, detail: str, error_code: int):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code


class Response(BaseModel):
    ply_url: str | None = None
    message: str | None = None


class Request(BaseModel):
    lesson_id: str | None = None
    lesson_name: str | None = None
    video_url: str | None = None
    training_type: str | None = None
    token: str | None = None


RETRY_LIMIT = 3
RETRY_COUNTER = 0
RETRY_COOLDOWN = 180  # seconds


app = FastAPI()

# origins = ["http://localhost", "http://localhost:8000", "*"]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


s3 = boto3.client(
    "s3",
    endpoint_url=MINIO_EDNPOINT,
    aws_access_key_id=MINIO_ROOT_USER,
    aws_secret_access_key=MINIO_ROOT_PASSWORD,
)


def read_s3_file(file_name):
    try:
        video_key = file_name
        response = s3.get_object(Bucket=AWS_STORAGE_BUCKET_NAME, Key=video_key)
        print("RESPONSE:" + str(response))
        data = response["Body"].read()
        return data, video_key
    except Exception as e:
        print(f"Error reading file from S3: {e}")
        return None


def write_s3_file(file_path, remote_path):
    try:
        s3.upload_file(
            file_path,
            AWS_STORAGE_BUCKET_NAME,
            remote_path,
        )
        print(f"File {remote_path} written to S3")
    except Exception as e:
        print(f"Error writing file {file_path} to S3: {e}")


def run_pipeline_subproc(
    video_path: str,
    output_dir: str,
    frame_count: int,
    max_num_iterations: int,
    nerfstudio_model: str,
    advanced_training: bool,
    use_mcmc: bool,
    num_downscales: int,
    start_over: bool,
):
    for attempt in range(1, RETRY_LIMIT + 1):
        print(f"Attempt {attempt} to run pipeline")
        try:
            cmd = [
                "python",
                "full_pipe.py",
                "--video-path",
                video_path,
                "--output-dir",
                output_dir,
                "--frame-count",
                str(frame_count if attempt == 1 else 400),
                "--max-num-iterations",
                str(max_num_iterations),
                "--nerfstudio-model",
                nerfstudio_model,
                "--num-downscales",
                str(num_downscales if attempt == 1 and num_downscales < 8 else 4),
                "--start-over",
                "True" if start_over else "False",
            ]
            if advanced_training:
                cmd.append("--advanced-training")
            if use_mcmc:
                cmd.append("--use-mcmc")
            print("Running command:", " ".join(cmd))

            subprocess.run(cmd, check=True)
            return
        except subprocess.CalledProcessError as e:
            print(f"Attempt {attempt} failed: {e}")
        except Exception as e:
            print(f"Attempt {attempt} failed: {e}")

        if attempt < RETRY_LIMIT:
            print(f"Retrying in {RETRY_COOLDOWN} seconds...")
            time.sleep(RETRY_COOLDOWN)
        else:
            raise RuntimeError("Max attempts reached. Exiting.")


def process_full_pipe(request: Request, lesson_dir: str, video_path: str):
    output_dir = f"{lesson_dir}/images"
    frame_count = 600
    max_num_iterations = 100000 if request.training_type == "full" else 30000
    nerfstudio_model = (
        "splatfacto-big" if request.training_type == "full" else "splatfacto"
    )
    num_downscales = 2 if request.training_type == "full" else 8

    try:
        # RUN THE FULL PIPELINE
        run_pipeline_subproc(
            video_path=video_path,
            output_dir=output_dir,
            frame_count=frame_count,
            max_num_iterations=max_num_iterations,
            nerfstudio_model=nerfstudio_model,
            advanced_training=True if request.training_type == "full" else False,
            use_mcmc=True if request.training_type == "full" else False,
            num_downscales=num_downscales,
            start_over=True,
        )

        splat_path = (
            f"/lessons/{request.lesson_name}_{request.lesson_id}/splat/splat.ply"
        )

        # LOAD ON MINIO
        write_s3_file(
            splat_path, f"{request.lesson_name}_{request.lesson_id}/splat.ply"
        )

        # DELETE FOLDER
        shutil.rmtree(lesson_dir, ignore_errors=True)
        print("Folder deleted")

        # print("Running full pipeline...")
        # time.sleep(5)  # Simulate processing time
        # # Simulate successful completion of the pipeline

        # REQUEST TOKEN
        token_payload = {
            "username": "root",
            "password": "root",
        }

        token_response = requests.post(
            TOKEN_REQUEST_ENDPOINT,
            json=token_payload,
        )
        print(
            "Token response:",
            token_response.status_code,
            token_response.text,
            flush=True,
        )
        token_access = token_response.json().get("access")

        callback_payload = {
            "lesson_id": request.lesson_id,
            "lesson_name": request.lesson_name,
            "ply_path": f"{request.lesson_name}_{request.lesson_id}/splat.ply",
            "status": "COMPLETED",
        }

        headers = {
            "Authorization": f"Bearer {token_access}",
        }

        try:
            response = requests.post(
                CALLBACK_ENDPOINT,
                json=callback_payload,
                headers=headers,
            )
            print("Callback response:", response.status_code, response.text, flush=True)
        except requests.RequestException as e:
            print(f"Error sending callback: {e}")

    except Exception as e:
        print(f"Error processing full pipeline: {e}", flush=True)
        callback_payload = {
            "lesson_id": request.lesson_id,
            "lesson_name": request.lesson_name,
            "ply_path": None,
            "status": "FAILED",
        }

        token_payload = {
            "username": "root",
            "password": "root",
        }

        try:
            token_response = requests.post(
                TOKEN_REQUEST_ENDPOINT,
                json=token_payload,
            )
            print("Token response:", token_response.status_code, token_response.text)
            token_access = token_response.json().get("access")
            headers = {
                "Authorization": f"Bearer {token_access}",
            }

            response = requests.post(
                CALLBACK_ENDPOINT,
                json=callback_payload,
                headers=headers,
            )
            print("Callback response:", response.status_code, response.text)
        except requests.RequestException as e:
            print(f"Error sending callback: {e}")


@app.get("/")
async def read_root():
    return {"Hello": "World"}


@app.post("/extract_ply")
async def extract_ply(request: Request) -> Response:
    try:
        print(f"REQUEST: {request}")
        # CREATE A DIRECTORY FOR THE LESSON
        lesson_dir = f"/lessons/{request.lesson_name}_{request.lesson_id}"
        os.makedirs(lesson_dir, exist_ok=True)
        # RETRIEVE THE VIDEO FROM MINIO
        video, video_key = read_s3_file(request.video_url)
        if not video:
            raise CustomHTTPException(
                status_code=404, detail="Video not found", error_code=1000
            )

        print("VIDEO FOUND")
        # SAVE THE VIDEO TO THE LESSON DIRECTORY
        video_path = f"{lesson_dir}/{video_key.split('/')[-1]}"
        with open(video_path, "wb") as video_file:
            video_file.write(video)

        worker_thread = threading.Thread(
            target=process_full_pipe,
            args=(request, lesson_dir, video_path),
            daemon=True,
        )
        worker_thread.start()

        # return Response(
        #     message="Processing started. You will be notified once it is completed."
        # )

        # time.sleep(20)
        if worker_thread.is_alive():
            return Response(
                message="Processing started. You will be notified once it is completed."
            )
        else:
            raise CustomHTTPException(
                status_code=500, detail="Processing failed", error_code=1002
            )

    except Exception as e:
        raise CustomHTTPException(status_code=500, detail=str(e), error_code=1001)
