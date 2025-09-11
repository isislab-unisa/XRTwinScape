from .models import Lesson
from rest_framework import serializers

class LessonSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    video_file = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        exclude = ("splat_ply", "annotation_ply")

    def get_images(self, obj):
        return obj.images.name if obj.images else None

    def get_video_file(self, obj):
        return obj.video_file.name if obj.video_file else None