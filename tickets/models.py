from django.db import models


class Estado(models.Model):
    nombre = models.CharField(max_length=15)
    orden = models.SmallIntegerField()
    color = models.CharField(max_length=7)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Prioridad(models.Model):
    nombre = models.CharField(max_length=10)
    orden = models.SmallIntegerField()
    color = models.CharField(max_length=7)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Etiqueta(models.Model):
    nombre = models.CharField(max_length=15)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Tipo_log(models.Model):
    nombre = models.CharField(max_length=35)
    tabla = models.CharField(max_length=35, blank=True, null=True)
    identificador = models.CharField(max_length=35, blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Plantilla_categoria(models.Model):
    nombre = models.CharField(max_length=35)
    orden = models.SmallIntegerField()
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Workspace(models.Model):
    nombre = models.CharField(max_length=50)
    departamento = models.ForeignKey("core.Departamento", on_delete=models.CASCADE, blank=True, null=True)
    workspace_id = models.IntegerField(blank=True, null=True)
    color = models.CharField(max_length=7)
    orden = models.SmallIntegerField()
    es_personal = models.BooleanField(default=False)
    user_create = models.ForeignKey("user_auth.User", on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    vista_privada = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Agrupacion(models.Model):
    nombre = models.CharField(max_length=50)
    departamento = models.ForeignKey("core.Departamento", on_delete=models.CASCADE, blank=True, null=True)
    color = models.CharField(max_length=7)
    orden = models.SmallIntegerField()
    activo = models.BooleanField(default=True)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    es_personal = models.BooleanField(default=False)
    user_create = models.ForeignKey("user_auth.User", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Plantilla(models.Model):
    plantilla_categoria = models.ForeignKey(Plantilla_categoria, on_delete=models.CASCADE)
    departamento = models.ForeignKey("core.Departamento", on_delete=models.CASCADE)
    agrupacion = models.ForeignKey(Agrupacion, on_delete=models.CASCADE, blank=True, null=True)
    titulo = models.CharField(max_length=35)
    descripcion = models.TextField(max_length=200)
    icono = models.CharField(max_length=30)
    color = models.CharField(max_length=7)
    activo = models.BooleanField(default=True)
    correo_notificacion = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Plantilla_etiqueta(models.Model):
    plantilla = models.ForeignKey(Plantilla, on_delete=models.CASCADE)
    etiqueta = models.ForeignKey(Etiqueta, on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Ticket(models.Model):
    titulo = models.CharField(max_length=70)
    descripcion = models.TextField(max_length=2000, blank=True, null=True)
    causa = models.TextField(max_length=2000, blank=True, null=True)
    posible_solucion = models.TextField(max_length=2000, blank=True, null=True)
    estado = models.ForeignKey(Estado, on_delete=models.CASCADE)
    prioridad = models.ForeignKey(Prioridad, on_delete=models.CASCADE)
    fecha_creacion = models.DateTimeField()
    user_create = models.ForeignKey("user_auth.User", on_delete=models.CASCADE)
    ticket_padre_id = models.IntegerField(blank=True, null=True)
    es_personal = models.BooleanField()
    ticket_dependiente_id = models.IntegerField(blank=True, null=True)
    fecha_hora_inicio = models.DateTimeField(blank=True, null=True)
    fecha_hora_fin = models.DateTimeField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    archivado = models.BooleanField(default=False)
    orden = models.SmallIntegerField(blank=True, null=True)
    plantilla = models.ForeignKey(Plantilla, on_delete=models.CASCADE, blank=True, null=True)
    agrupacion = models.ForeignKey(Agrupacion, on_delete=models.CASCADE)
    aviso_por_vencer = models.BooleanField(default=False)
    fecha_aviso_vencido = models.DateField(blank=True, null=True)
    departamento = models.ForeignKey("core.Departamento", on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Ticket_iniciativas(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, null=True, blank=True)
    departamento_afectado = models.ForeignKey("core.Departamento", on_delete=models.CASCADE, blank=True, null=True)
    ponderacion = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    comentario = models.CharField(max_length=2000, blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    grupo = models.ForeignKey(Agrupacion, on_delete=models.CASCADE, null=True, blank=True)
    area_proceso = models.CharField(max_length=100, blank=True, null=True)
    origen = models.CharField(max_length=100, blank=True, null=True)
    solucion = models.CharField(max_length=2000, blank=True, null=True)
    user_creador = models.ForeignKey("user_auth.User", on_delete=models.CASCADE, blank=True, null=True,
                                     related_name="creador")
    user_asignado = models.ForeignKey("user_auth.User", on_delete=models.CASCADE, blank=True, null=True,
                                      related_name="asignado")
    estado = models.ForeignKey(Estado, on_delete=models.CASCADE, blank=True, null=True)
    prioridad = models.ForeignKey(Prioridad, on_delete=models.CASCADE, blank=True, null=True)


class Regla(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=200)
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    valor_maximo = models.SmallIntegerField()
    valor_ascendente = models.BooleanField(default=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Ticket_ponderacion(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, null=True, blank=True)
    regla = models.ForeignKey(Regla, on_delete=models.CASCADE)
    valor = models.SmallIntegerField()
    nombre = models.CharField(max_length=50)
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    valor_maximo = models.SmallIntegerField()
    valor_ascendente = models.BooleanField(default=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    grupo = models.ForeignKey(Agrupacion, on_delete=models.CASCADE, null=True, blank=True)


class Ticket_tiempo(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    fecha_hora_inicio = models.DateTimeField(auto_now_add=True)
    fecha_hora_fin = models.DateTimeField(blank=True, null=True)
    hora_total = models.TimeField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Ticket_log(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    tipo_log = models.ForeignKey(Tipo_log, on_delete=models.CASCADE)
    afectado_id = models.IntegerField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    valor_anterior = models.TextField(max_length=2000, blank=True, null=True)
    valor_nuevo = models.TextField(max_length=2000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey("user_auth.User", on_delete=models.CASCADE, default=None)


class Ticket_etiqueta(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    etiqueta = models.ForeignKey(Etiqueta, on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Ticket_usuario(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    usuario = models.ForeignKey("user_auth.User", on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Ticket_adjunto(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    file = models.FileField(upload_to='tickets', max_length=500)
    descripcion = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Ticket_comentario(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    comentario_padre_id = models.IntegerField(blank=True, null=True)
    comentario = models.CharField(max_length=2000)
    user = models.ForeignKey("user_auth.User", on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Ticket_comentario_adjunto(models.Model):
    ticket_comentario = models.ForeignKey(Ticket_comentario, on_delete=models.CASCADE)
    file = models.FileField(upload_to='tickets', max_length=500)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Ticket_notificacion(models.Model):
    ticket_log = models.ForeignKey(Ticket_log, on_delete=models.CASCADE)
    user_notificado = models.ForeignKey("user_auth.User", on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Workspace_usuarios(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    user = models.ForeignKey("user_auth.User", on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Ticket_minuta_jsa(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
