from django.db import models
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
import logging
import dotenv
from storages.backends.s3boto3 import S3Boto3Storage
from django.utils.text import slugify
import mimetypes
from django.core.exceptions import ValidationError
import os
from django.core.files.base import ContentFile

class MinioStorage(S3Boto3Storage):
    bucket_name = 'lessons-media'
    custom_domain = False

dotenv.load_dotenv()

logger = logging.getLogger(__name__)

class Tag(models.Model):
    name = models.CharField(max_length=64, null=False, blank=False, primary_key=True)
    
    class Meta:
        db_table = "Tag"
        verbose_name = "Tag"
        verbose_name_plural = "Tag"
        
    def __str__(self):
        return self.name

class Status(models.TextChoices):
    READY = "READY", "Ready"
    FAILED = "FAILED", "Failed"
    BUILDING = "BUILDING", "Building"
    BUILT = "BUILT", "Built"
    RUNNING = "RUNNING", "Running"
    ENQUEUED = "ENQUEUED", "Enqueued"

class LessonQuerySet(models.QuerySet):
    def delete(self, *args, **kwargs):
        for obj in self:
            obj.delete()  # chiama il metodo custom delete
        super().delete(*args, **kwargs)

class Lesson(models.Model):
    title = models.CharField(max_length=64)
    description = models.TextField(null=True, blank=True)
    creation_time = models.DateTimeField(auto_now_add=True)
    images = models.ImageField(upload_to="", storage=MinioStorage(), null=True, blank=True)
    video_file = models.FileField(upload_to="", storage=MinioStorage(), null=False, blank=False)
    tag = models.ManyToManyField('Tag')
    user = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.READY
    )
    splat_ply = models.FileField(upload_to="", storage=MinioStorage(), null=True, blank=True)
    annotation_ply = models.FileField(upload_to="", storage=MinioStorage(), null=True, blank=True)
    ref_ply = models.CharField(max_length=64, null=True, blank=True)
    ref_annotations = models.CharField(max_length=64, null=True, blank=True)
    lesson_visibility = models.BooleanField(default=True)
    build_started_at = models.DateTimeField(null=True, blank=True)
    objects = LessonQuerySet.as_manager()

    class Meta:
        db_table = "Lesson"
        verbose_name = "Lesson"
        verbose_name_plural = "Lesson"
        permissions = [
            ("can_create_lessons", "Can create lessons"),
            ("can_view_lessons", "Can view lessons"),
        ]

    def __str__(self):
        return self.title

    def get_folder_name(self):
        return f"{slugify(self.title)}_{self.pk}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        original_image = self.images
        original_video = self.video_file
        splat_ply = self.splat_ply
        annotation_ply = self.annotation_ply

        if original_video:
            mime_type, _ = mimetypes.guess_type(original_video.name)
            if not mime_type or not mime_type.startswith("video"):
                raise ValidationError("Il file caricato non è un video valido.")
        
        if is_new:
            super().save(*args, **kwargs)

        folder_name = self.get_folder_name()

        storage = MinioStorage()
        keep_path = f"{folder_name}/.keep"
        if not storage.exists(keep_path):
            storage.save(keep_path, ContentFile(b""))

        if original_image and '/' not in str(original_image):
            with original_image.open('rb') as img_file:
                image_content = img_file.read()
                image_name = os.path.basename(original_image.name)
                image_path = f"{folder_name}/{image_name}"
                if storage.exists(image_name):
                    storage.delete(image_name)
                self.images.save(image_path, ContentFile(image_content), save=False)
        
        if splat_ply and '/' not in str(splat_ply):
            with splat_ply.open('rb') as splat_file:
                splat_content = splat_file.read()
                splat_name = os.path.basename(splat_ply.name)
                splat_path = f"{folder_name}/{splat_name}"
                if storage.exists(splat_name):
                    storage.delete(splat_name)
                self.splat_ply.save(splat_path, ContentFile(splat_content), save=False)
                self.ref_ply = f"{folder_name}/{splat_name}"
                self.status = Status.BUILT
        
        if annotation_ply and '/' not in str(annotation_ply):
            with annotation_ply.open('rb') as annotation_file:
                annotation_content = annotation_file.read()
                annotation_name = os.path.basename(annotation_ply.name)
                annotation_path = f"{folder_name}/{annotation_name}"
                if storage.exists(annotation_name):
                    storage.delete(annotation_name)
                self.annotation_ply.save(annotation_path, ContentFile(annotation_content), save=False)
                self.ref_annotations = f"{folder_name}/{annotation_name}" 

        if original_video and '/' not in str(original_video):
            with original_video.open('rb') as vid_file:
                video_content = vid_file.read()
                video_name = os.path.basename(original_video.name)
                video_path = f"{folder_name}/{video_name}"
                if storage.exists(video_name):
                    storage.delete(video_name)
                self.video_file.save(video_path, ContentFile(video_content), save=False)

        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        folder_name = self.get_folder_name() + "/"
        storage = MinioStorage()
        elements = storage.bucket.objects.filter(Prefix=folder_name)
        try:
            for k in elements:
                k.delete()
        except:
            objects = list(storage.bucket.objects.all())
            object_keys = [obj.key for obj in objects]
            raise Exception(f"La cartella {folder_name} non esiste. Oggetti presenti: {object_keys}")
        super().delete(*args, **kwargs)