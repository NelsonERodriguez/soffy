from django.db import models


class cola_facturacion(models.Model):
    tabla = models.CharField(max_length=255)
    campo = models.CharField(max_length=255)
    valor_campo = models.CharField(max_length=255)
    firmado = models.BooleanField(default=False)
    numero_autorizacion = models.CharField(max_length=255, null=True)
    serie = models.CharField(max_length=255, null=True)
    numero = models.CharField(max_length=255, null=True)
    fecha_autorizacion = models.DateTimeField(null=True)
    anulado = models.BooleanField(default=False, null=True)
    fecha_anulado = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class cola_facturacion_detalle(models.Model):
    cola = models.ForeignKey(cola_facturacion, on_delete=models.CASCADE)
    paso = models.SmallIntegerField()
    data_enviada = models.TextField()
    data_recibida = models.TextField()
    fecha_envio = models.DateTimeField()
    fecha_recibido = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
