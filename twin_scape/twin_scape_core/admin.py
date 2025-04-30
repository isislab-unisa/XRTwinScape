from django.contrib import admin
from .models import Lesson, Tag
from unfold.admin import ModelAdmin
from django.db.models import Q

class TagAdmin(ModelAdmin):
    pass
admin.site.register(Tag, TagAdmin)

class LessonAdmin(ModelAdmin):
    list_display = ['title', 'description', 'creation_time', 'ref_ply', 'ref_annotations', 'lesson_visibility', 'user', 'status', 'get_tags']
    # list_filter = ('status', 'user')
    search_fields = ['title', 'description']
    date_hierarchy = 'creation_time'
    readonly_fields = ['user', 'status']

    def get_tags(self, obj):
        return ", ".join(tag.name for tag in obj.tag.all())
    get_tags.short_description = 'Tags'
    
    # class Media:
    #     js = ('/static/viewer/file.js',)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(Q(user=request.user) | Q(status='BUILT'))

    def get_fields(self, request, obj=None):
        fields = ['title', 'description', 'images', 'video_file', 'lesson_visibility', 'tag'] # 'user', 'status',
        return fields

    def get_readonly_fields(self, request, obj=None):
        base = super().get_readonly_fields(request, obj)
        if not request.user.is_superuser:
            return base + ['user']
        return base

    def save_model(self, request, obj, form, change):
        if not change:
            obj.user = request.user
        # if change and obj.status == "FAILED":
        #     obj.status = "READY"
            # initial = super().get_changeform_initial_data(request)
            # initial['status'] = "READY"
            
        obj.save()
        super().save_model(request, obj, form, change)

    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)
        if not request.user.is_superuser:
            initial['user'] = request.user.pk
        return initial
    
    def has_change_permission(self, request, obj=None):
        has_permission = super().has_change_permission(request, obj)
        if not has_permission:
            return False
        if obj is None:
            return True
        if obj.status in ['BUILT', 'BUILDING', 'RUNNING']:
            return False
        return True
    
    def has_delete_permission(self, request, obj=None):
        has_permission = super().has_delete_permission(request, obj)
        if not has_permission:
            return False
        if obj is None:
            return True
        if obj.status in ['RUNNING', 'BUILDING']:
            return False
        
        if obj.user != request.user:
            return False
        return True
    
admin.site.register(Lesson, LessonAdmin)
