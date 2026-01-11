from django.contrib import admin
from .models import Lesson, Tag
from unfold.admin import ModelAdmin
from django.db.models import Q
from django.utils.safestring import mark_safe
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.urls import reverse

class TagAdmin(ModelAdmin):
    pass
admin.site.register(Tag, TagAdmin)

from django import forms
from django.db import models

class LessonAdmin(ModelAdmin):
    list_display = ['title', 'description', 'creation_time', 'lesson_visibility', 'user', 'status', 'get_tags']
    # list_filter = ('status', 'user')
    search_fields = ['title', 'description']
    date_hierarchy = 'creation_time'
    readonly_fields = ['user', 'status']

    class Media:
        js = ('viewer/file.js',)
    
    def get_tags(self, obj):
        return ", ".join(tag.name for tag in obj.tag.all())
    get_tags.short_description = 'Tags'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(Q(user=request.user) | Q(status='BUILT'))

    def get_fields(self, request, obj=None):
        fields = ['title', 'description', 'images', 'video_file', 'lesson_visibility', 'tag', 'user', 'status', 'splat_ply', 'annotation_ply']
        return fields

    def get_readonly_fields(self, request, obj=None):
        base = super().get_readonly_fields(request, obj)
        if not request.user.is_superuser:
            return base + ['user']
        return base

    def save_model(self, request, obj, form, change):
        if not change:
            obj.user = request.user
        if change and obj.status == "FAILED":
            obj.status = "READY"
            initial = super().get_changeform_initial_data(request)
            initial['status'] = "READY"
            
        obj.save()
        super().save_model(request, obj, form, change)

    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)
        if not request.user.is_superuser:
            initial['user'] = request.user.pk
        return initial
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        try:
            obj = self.get_object(request, object_id)
            if obj and obj.status in ['BUILT', 'BUILDING', 'RUNNING', 'ENQUEUED']:
                messages.error(
                    request, 
                    f"Cannot modify this lesson because it is in the '{obj.status}' state."
                )
                return HttpResponseRedirect(reverse('admin:viewer_lesson_changelist'))
        except Exception:
            pass
        
        return super().change_view(request, object_id, form_url, extra_context)
    
    def delete_view(self, request, object_id, extra_context=None):
        try:
            obj = self.get_object(request, object_id)
            if obj:
                if obj.status in ['RUNNING', 'BUILDING', 'ENQUEUED']:
                    messages.error(
                        request, 
                        f"Cannot delete this lesson because it is in the '{obj.status}' state."
                    )
                    return HttpResponseRedirect(reverse('admin:viewer_lesson_changelist'))
                
                if obj.user != request.user and not request.user.is_superuser:
                    messages.error(
                        request, 
                        "You can't delete this lesson because you're not the owner."
                    )
                    return HttpResponseRedirect(reverse('admin:viewer_lesson_changelist'))
        except Exception:
            pass
        
        return super().delete_view(request, object_id, extra_context)
    
    def has_change_permission(self, request, obj=None):
        has_permission = super().has_change_permission(request, obj)
        if not has_permission:
            return False
        if obj is None:
            return True
        if obj.status in ['BUILT', 'BUILDING', 'RUNNING', 'ENQUEUED']:
            return False
        return True
    
    def has_delete_permission(self, request, obj=None):
        has_permission = super().has_delete_permission(request, obj)
        if not has_permission:
            return False
        if obj is None:
            return True
        if obj.status in ['RUNNING', 'BUILDING', 'ENQUEUED']:
            return False
        
        if obj.user != request.user:
            return False
        return True

admin.site.register(Lesson, LessonAdmin)