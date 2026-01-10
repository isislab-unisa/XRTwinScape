import json
from django.contrib import admin
from django.urls import path
from django.views.generic import TemplateView
import base64
from unfold.admin import ModelAdmin
from unfold.views import UnfoldModelAdminViewMixin
from twin_scape_core.models import Lesson
from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Count
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

admin.site.index_title = 'Dashboard'


class DashboardView(UnfoldModelAdminViewMixin, TemplateView):
    title = "Dashboard"
    permission_required = ()
    template_name = "admin/index.html"

def dashboard_callback(request, context):
    if request.user.is_superuser:
        lessons_queryset = Lesson.objects.all()
        running_lessons = Lesson.objects.filter(status="RUNNING").count()
        failed_lessons = Lesson.objects.filter(status="FAILED").count()
        building_lessons = Lesson.objects.filter(status="BUILDING").count()
        ready_lessons = Lesson.objects.filter(status="READY").count()
        built_lessons = Lesson.objects.filter(status="BUILT").count()
    else:
        lessons_queryset = Lesson.objects.filter(user=request.user)
        running_lessons = lessons_queryset.filter(status="RUNNING").count()
        failed_lessons = lessons_queryset.filter(status="FAILED").count()
        building_lessons = lessons_queryset.filter(status="BUILDING").count()
        ready_lessons = lessons_queryset.filter(status="READY").count()
        built_lessons = lessons_queryset.filter(status="BUILT").count()
    
    total_lessons = lessons_queryset.count()
    
    lessons_queryset = lessons_queryset.order_by('-creation_time')
    
    page = request.GET.get('page', 1)
    paginator = Paginator(lessons_queryset, 5)
    
    try:
        lessons = paginator.page(page)
    except PageNotAnInteger:
        lessons = paginator.page(1)
    except EmptyPage:
        lessons = paginator.page(paginator.num_pages)
    
    for lesson in lessons:
        if lesson.ref_ply:
            lesson.ref_ply = base64.b64encode(lesson.ref_ply.encode('utf-8')).decode('utf-8')
        if lesson.ref_annotations:
            lesson.ref_annotations = base64.b64encode(lesson.ref_annotations.encode('utf-8')).decode('utf-8')

    context.update({
        "total_lessons": total_lessons,
        "running_lessons": running_lessons,
        "failed_lessons": failed_lessons,
        "building_lessons": building_lessons,
        "ready_lessons": ready_lessons,
        "built_lessons": built_lessons,
        "lessons": lessons,
    })
    
    return context

def home(request):
    lessons = Lesson.objects.filter(status="BUILT")
    
    for lesson in lessons:
        if lesson.ref_ply:
            lesson.ref_ply = base64.b64encode(lesson.ref_ply.encode('utf-8')).decode('utf-8')
        if lesson.ref_annotations:
            lesson.ref_annotations = base64.b64encode(lesson.ref_annotations.encode('utf-8')).decode('utf-8')
    return render(request, "home.html", context={"lessons": lessons})

def health_check(request):
    return JsonResponse({"status": "OK"})