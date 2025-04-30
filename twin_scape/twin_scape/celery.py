from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'twin_scape.settings')

app = Celery('twin_scape')
app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks(lambda: ['twin_scape'])

app.conf.task_queues = {
    'api_tasks': {
        'exchange': 'api_tasks',
        'routing_key': 'api_tasks',
    }
}

app.conf.beat_schedule = {
    'fail-stuck-builds': {
        'task': 'twin_scape.tasks.fail_stuck_builds',
        'schedule': timedelta(minutes=10),
    },
}

# docker-compose exec web celery -A twin_scape.celery worker -Q api_tasks --concurrency=1 --loglevel=info
