from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse, Http404
from django.shortcuts import render
from .models import MinioStorage
from django.http import JsonResponse
import base64
from django.http import FileResponse
from .models import Lesson, Status
from django.shortcuts import redirect
from twin_scape.tasks import call_api_and_save
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
import os
import redis
from redis.lock import Lock

# Redis client
redis_client = redis.StrictRedis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
build_lock = Lock(redis_client, "build_lock")

@login_required
@require_http_methods(['GET'])
def pick_data_from_minio(request, resource):
    try:
        file_name = base64.b64decode(resource).decode('utf-8')
        print(f"[DEBUG] Decoded file_name from base64: {file_name}")
    except Exception as e:
        return JsonResponse({"error": f"Invalid base64 encoding: {str(e)}"}, status=400)

    if not file_name:
        return JsonResponse({"error": "File name not provided"}, status=400)

    minio_storage = MinioStorage()

    try:
        file = minio_storage.open(file_name, mode='rb')
        response = FileResponse(file, as_attachment=True, filename=file_name)
        response['Content-Type'] = 'application/octet-stream'
        return response
    except FileNotFoundError:
        return JsonResponse({"error": "File not found"}, status=404)

@login_required
@require_http_methods(['GET'])
def pick_annotation_from_minio(request, annotation):
    try:
        file_name = base64.b64decode(annotation).decode('utf-8')
        print(f"[DEBUG] Decoded file_name from base64: {file_name}")
    except Exception as e:
        return JsonResponse({"error": f"Invalid base64 encoding: {str(e)}"}, status=400)

    if not file_name:
        return JsonResponse({"error": "File name not provided"}, status=400)

    minio_storage = MinioStorage()

    try:
        file = minio_storage.open(file_name, mode='rb')
        response = FileResponse(file, as_attachment=True, filename=file_name)
        response['Content-Type'] = 'application/json'
        return response
    except FileNotFoundError:
        return JsonResponse({"error": "File not found"}, status=404)

@login_required
@require_http_methods(['POST'])
def render_xrts_viewer(request):
    return render(request, 'viewer/xrts-viewer.html', context={'resource': request.POST.get('resource'),
                                                               'title': request.POST.get('title'),
                                                               'annotation': request.POST.get('annotation')})

@login_required
@require_http_methods(['POST'])
def build(request):
    lesson_id = request.POST.get('lesson_id')
    lesson = Lesson.objects.get(pk=lesson_id)
    value = request.POST.get('training_type')
    if lesson.status == "READY":
        lesson.status = Status.ENQUEUED
        lesson.save()
        call_api_and_save.apply_async(args=[lesson.id, value], queue='api_tasks')
    return redirect('/admin/')

@require_http_methods(['POST'])
def complete_build(request):
    try:
        status = request.POST.get('status')
        lesson_id = request.POST.get('lesson_id')
        ply_path = request.POST.get('ply_path')
        
        lesson = Lesson.objects.get(pk=lesson_id)

        if status == "COMPLETED":
            lesson.ref_ply = ply_path
            lesson.status = "BUILDED"
        else:
            lesson.status = "FAILED"

        lesson.save()

        send_mail(
            'Build status aggiornato',
            f"Lezione {lesson.title} ha ora stato {lesson.status}.",
            os.environ.get('EMAIL_HOST_USER'),
            [lesson.user.email],
            fail_silently=False,
        )

        if build_lock.locked():
            build_lock.release()

        return JsonResponse({"status": "success"}, status=200)

    except Exception as e:
        print(f"[ERROR] Exception in complete_build: {str(e)}")
        return JsonResponse({"error": "An error occurred"}, status=500)
