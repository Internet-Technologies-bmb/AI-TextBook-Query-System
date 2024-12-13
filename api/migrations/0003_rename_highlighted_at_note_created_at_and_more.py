# Generated by Django 5.1.3 on 2024-12-13 19:59

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_chat_fileupload_message_note'),
    ]

    operations = [
        migrations.RenameField(
            model_name='note',
            old_name='highlighted_at',
            new_name='created_at',
        ),
        migrations.AddField(
            model_name='note',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='note',
            name='user',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='note',
            name='message',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.message'),
        ),
    ]
