from django.db import models

class Evento(models.Model):
    nombre = models.TextField()
    activo = models.BooleanField(default=True)
    # fecha_inicio = models.DateTimeField()
    # fecha_fin = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Evento_inscripcion(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE)
    empleado_id = models.IntegerField()
    puntos_totales = models.IntegerField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Equipo(models.Model):
    nombre = models.TextField()
    activo = models.BooleanField()
    icono = models.TextField(null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Tipo_partido(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE)
    nombre = models.TextField()
    orden = models.SmallIntegerField()
    activo = models.BooleanField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Partido(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE)
    tipo_partido = models.ForeignKey(Tipo_partido, on_delete=models.CASCADE)
    fecha = models.DateField()
    hora = models.TimeField()
    equipo_1 = models.ForeignKey(Equipo, related_name='equipo_1_id', on_delete=models.CASCADE)
    equipo_2 = models.ForeignKey(Equipo, related_name='equipo_2_id', on_delete=models.CASCADE)
    goles_equipo_1 = models.SmallIntegerField(null=True)
    goles_equipo_2 = models.SmallIntegerField(null=True)
    penales_equipo_1 = models.SmallIntegerField(null=True)
    penales_equipo_2 = models.SmallIntegerField(null=True)
    activo = models.BooleanField()
    hay_penales = models.BooleanField(default=False)
    resultado_congelado = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Evento_inscripcion_partido(models.Model):
    evento_inscripcion = models.ForeignKey(Evento_inscripcion, on_delete=models.CASCADE)
    partido = models.ForeignKey(Partido, on_delete=models.CASCADE)
    goles_equipo_1 = models.SmallIntegerField(null=True)
    goles_equipo_2 = models.SmallIntegerField(null=True)
    penales_equipo_1 = models.SmallIntegerField(null=True)
    penales_equipo_2 = models.SmallIntegerField(null=True)
    puntos = models.SmallIntegerField(null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Pago_inscripcion(models.Model):
    empleado_id = models.IntegerField()
    pago_realizado = models.BooleanField()
    activo = models.BooleanField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
