from django.contrib import admin
from .models import Lesson, Tag
from unfold.admin import ModelAdmin


class TagAdmin(ModelAdmin):
    pass
admin.site.register(Tag, TagAdmin)

class LessonAdmin(ModelAdmin):
    list_display = ('title', 'description', 'creation_time', 'status', 'user', 'ref_ply', 'ref_annotations', 'lesson_visibility')
    list_filter = ('status', 'user')
    search_fields = ('title', 'description')
    date_hierarchy = 'creation_time'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)

    def get_fields(self, request, obj=None):
        fields = ['title', 'description', 'images', 'video_file', 'lesson_visibility']

        if obj and request.user.is_superuser:
            fields.append('status')
            fields.append('ref_ply')
            fields.append('ref_annotations')

        if request.user.is_superuser:
            fields.append('user')

        return fields

    def get_readonly_fields(self, request, obj=None):
        base = super().get_readonly_fields(request, obj)
        if not request.user.is_superuser:
            return base + ('user',)
        return base

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser and not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)

    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)
        if not request.user.is_superuser:
            initial['user'] = request.user.pk
        return initial
    
admin.site.register(Lesson, LessonAdmin)
