from django.db import models


class Log_consultas(models.Model):
    usuario = models.CharField(max_length=30)
    query = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    db_table = 'log_consultas'
