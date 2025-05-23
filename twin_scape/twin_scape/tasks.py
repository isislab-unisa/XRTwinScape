import requests
from celery import shared_task
from twin_scape_core.models import Lesson, MinioStorage, Status
from django.core.mail import send_mail
import os
import json
import time
import redis
from redis.exceptions import LockError
from redis.lock import Lock
from dotenv import load_dotenv
from django.utils import timezone
from datetime import timedelta

load_dotenv()

redis_client = redis.StrictRedis.from_url(os.getenv("REDIS_URL", "redis://redis:6379"))

@shared_task(bind=True, max_retries=20, default_retry_delay=10)
def call_api_and_save(self, lesson_id, training_type):
    storage = MinioStorage()
    response = None
    lock = Lock(redis_client, "build_lock", timeout=24 * 60 * 60)

    try:
        lesson = Lesson.objects.get(pk=lesson_id)
        print("Lesson:", lesson.pk, lesson.title)

        print("Tentativo di acquisizione lock...")
        try:
            acquired = lock.acquire(blocking=True, blocking_timeout=24 * 60 * 60)
            print(f"Acquired: {acquired}")
            if not acquired:
                print(f"Could not acquire lock for lesson {lesson_id}, retrying...")
                raise self.retry(exc=Exception("Could not acquire build lock"), countdown=10)
        except Exception as lock_error:
            print(f"Errore nell'acquisizione del lock: {lock_error}")
            raise self.retry(exc=lock_error, countdown=10)
        
        print("Lock acquisito, procedo con la build...")
        try:
            payload = {
                "lesson_name": lesson.title,
                "lesson_id": str(lesson.id),
                "video_url": lesson.video_file.name,
                "training_type": training_type
            }

            url = f"http://full_gaussian_pipe:8090/extract_ply"
            headers = {"Content-type": "application/json"}
            response = requests.post(url, headers=headers, json=payload)
            
            print("Response status code:", response.status_code)
            print(response)
            
            # Simulazione della build
            # print("Simulazione build in corso...")
            # time.sleep(30)
            
            # response = requests.Response()
            # response.status_code = 200

            if response.status_code == 200:
                lesson.status = Status.BUILDING
                lesson.build_started_at = timezone.now()
                lesson.save()
                send_mail(
                    'Build in corso',
                    f"Lezione {lesson.title} in fase di build.",
                    os.environ.get('EMAIL_HOST_USER'),
                    [lesson.user.email],
                    fail_silently=False,
                )
                return f"Lezione {lesson_id} in building"
            else:
                status = Status.FAILED
                lesson.status = status
                lesson.save()
                send_mail(
                    'Build Fallita',
                    f"Lezione: {lesson.title} fallita. Errore interno del server",
                    os.environ.get('EMAIL_HOST_USER'),
                    [lesson.user.email],
                    fail_silently=False,
                )
                if lock.locked():
                    print("Rilascio il lock...")
                    lock.release()
                return f"Build failed for lesson {lesson_id}"  

        finally:
            pass
            # if lock.locked():
            #     print("Rilascio il lock...")
            #     lock.release()

    except Lesson.DoesNotExist:
        return f"Lesson {lesson_id} does not exist."

    except Exception as e:
        print(f"Errore generale: {e}")
        if response is not None and response.status_code != 200:
            status = Status.FAILED
            lesson.status = status
            lesson.save()
            send_mail(
                'Build Fallita',
                f"Lezione: {lesson.title} fallita. Errore interno del server",
                os.environ.get('EMAIL_HOST_USER'),
                [lesson.user.email],
                fail_silently=False,
            )
        return str(e)

@shared_task(queue='api_tasks')
def fail_stuck_builds():
    try:
        redis_client = redis.StrictRedis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        build_lock = Lock(redis_client, "build_lock")
    except Exception as e:
        print(f"Errore nell'acquisizione del lock: {e}")
            
    lesson = None
    try:
        timeout_minutes = 18 * 60 # 24 hours
        threshold = timezone.now() - timedelta(minutes=timeout_minutes)

        lesson = Lesson.objects.filter(status=Status.BUILDING, build_started_at__lt=threshold).first()
    except Lesson.DoesNotExist:
        print("Lesson does not exist")
    except Exception as e:
        print(f"Errore: {e}")
        
    if lesson is None:
        return
    try:
        lesson.status = Status.FAILED
        lesson.save()
        send_mail(
            'Build Fallita',
            f"Lezione: {lesson.title} è fallita automaticamente per superamento del tempo massimo di build.",
            os.environ.get('EMAIL_HOST_USER'),
            [lesson.user.email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Errore nell'acquisizione del lock: {e}")
    
    try:
        if build_lock.locked():
            build_lock.release()
    except Exception as e:
        print(f"Errore nell'acquisizione del lock: {e}")