from django.db import migrations
from django.contrib.auth.hashers import PBKDF2PasswordHasher
from ..hashers import PBKDF2WrappedSHA1PasswordHasher


def forwards_func(apps, schema_editor):
    User = apps.get_model('user_auth', 'User')
    users = User.objects.all()
    hasher = PBKDF2PasswordHasher()
    for user in users:
        # algorithm, salt, sha1_hash = user.password.split('$2y$10', 2)
        user.password = hasher.encode('123456', 'sha')
        user.save(update_fields=['password'])


class Migration(migrations.Migration):

    dependencies = [
        ('user_auth', '0002_auto_20210527_0809'),
        # replace this with the latest migration in contrib.auth
        # ('auth', '0011_update_proxy_permissions'),
    ]

    operations = [
        migrations.RunPython(forwards_func),
    ]
