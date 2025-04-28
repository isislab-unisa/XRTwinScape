import json
from django.contrib import admin
from django.urls import path
from django.views.generic import TemplateView
import base64
from unfold.admin import ModelAdmin
from unfold.views import UnfoldModelAdminViewMixin
from twin_scape_core.models import Lesson

# Custom dasboard view
admin.site.index_title = 'Dashboard'

class DashboardView(UnfoldModelAdminViewMixin, TemplateView):
    title = "Dashboard"
    permission_required = ()
    template_name = "admin/index.html"

def dashboard_callback(request, context):
    if request.user.is_superuser:
        running_lesson = Lesson.objects.filter(status="RUNNING").count()
        failed_lesson = Lesson.objects.filter(status="FAILED").count()
        building_lesson = Lesson.objects.filter(status="BUILDING").count()
        lessons = Lesson.objects.all()
    else:
        running_lesson = Lesson.objects.filter(user=request.user, status="RUNNING").count()
        failed_lesson = Lesson.objects.filter(user=request.user, status="FAILED").count()
        building_lesson = Lesson.objects.filter(user=request.user, status="BUILDING").count()
        lessons = Lesson.objects.filter(user=request.user)
    
    for lesson in lessons:
        if lesson.ref_ply:
            lesson.ref_ply = base64.b64encode(lesson.ref_ply.encode('utf-8')).decode('utf-8')
        if lesson.ref_annotations:
            lesson.ref_annotations = base64.b64encode(lesson.ref_annotations.encode('utf-8')).decode('utf-8')

    kpis = [
        {"title": "Running Lessons", "metric": running_lesson},
        {"title": "Failed Lessons", "metric": failed_lesson},
        {"title": "Building Lessons", "metric": building_lesson},
    ]

    context.update({
        "kpis": kpis,
        "lessons": lessons,
    })
    
    return context
