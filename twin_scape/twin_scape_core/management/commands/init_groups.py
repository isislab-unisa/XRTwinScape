from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from twin_scape_core.models import Lesson, Tag

class Command(BaseCommand):
    help = 'Crea i gruppi Author e Student con i permessi associati'

    def handle(self, *args, **kwargs):
        author_group, _ = Group.objects.get_or_create(name='Author')
        student_group, _ = Group.objects.get_or_create(name='Student')

        lesson_ct = ContentType.objects.get_for_model(Lesson)
        tag_ct = ContentType.objects.get_for_model(Tag)

        lesson_perms = [
            Permission.objects.get(codename='add_lesson', content_type=lesson_ct),
            Permission.objects.get(codename='view_lesson', content_type=lesson_ct),
            Permission.objects.get(codename='change_lesson', content_type=lesson_ct),
            Permission.objects.get(codename='delete_lesson', content_type=lesson_ct),
        ]

        tag_perms = [
            Permission.objects.get(codename='add_tag', content_type=tag_ct),
            Permission.objects.get(codename='view_tag', content_type=tag_ct),
            Permission.objects.get(codename='change_tag', content_type=tag_ct),
            Permission.objects.get(codename='delete_tag', content_type=tag_ct),
        ]

        author_group.permissions.set(lesson_perms + tag_perms)
        student_group.permissions.set([Permission.objects.get(codename='view_lesson', content_type=lesson_ct)])

        self.stdout.write(self.style.SUCCESS('Gruppi e permessi creati con successo.'))
