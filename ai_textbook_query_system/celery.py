from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_textbook_query_system.settings')

app = Celery('ai_textbook_query_system')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related config keys should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Update with Redis configuration for broker and backend
"""app.conf.update(
    CELERY_BROKER_URL='redis://red-ctg4fpm8ii6s73ckcrg0:6379/0',  # Broker (task queue)
    CELERY_RESULT_BACKEND='redis://red-ctg4fpm8ii6s73ckcrg0:6379/0',  # Backend (store task results)
    CELERY_ACCEPT_CONTENT=['json'],
    CELERY_TASK_SERIALIZER='json',
)"""
