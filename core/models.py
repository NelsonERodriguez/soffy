from django.db import models


class Logs(models.Model):
    navegador = models.CharField(max_length=100, null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    post = models.TextField(null=True, blank=True)
    get = models.TextField(null=True, blank=True)
    url = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.url} {self.ip} {self.navegador}"


class Query_logs(models.Model):
    email = models.CharField(max_length=255)
    query = models.TextField()
    ruta = models.TextField()
    ip = models.CharField(max_length=255)
    query_error = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Empresas(models.Model):
    codigo = models.CharField(max_length=50)
    nit = models.CharField(max_length=255)
    nombre = models.CharField(max_length=255)
    short_name = models.CharField(max_length=255)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=255)
    activo = models.BooleanField(default=True, blank=True)
    email = models.CharField(max_length=255)
    direccion_comercial = models.CharField(max_length=255)
    nombre_comercial = models.CharField(max_length=255)
    fel = models.BooleanField(default=False, blank=True)
    usuario = models.CharField(max_length=255)
    apikey = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    no_empresa_conta = models.SmallIntegerField(null=True, default=None)

    def __str__(self):
        return self.nombre


class Localidades(models.Model):
    empresa = models.ForeignKey('Empresas', models.CASCADE, default=1, blank=True)
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=255)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=255)
    activo = models.BooleanField(default=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Monedas(models.Model):
    codigo = models.CharField(max_length=255)
    nombre = models.CharField(max_length=255)
    simbolo = models.CharField(max_length=3)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Departamento(models.Model):
    nombre = models.CharField(max_length=70)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class User_departamento(models.Model):
    user = models.ForeignKey("user_auth.User", on_delete=models.CASCADE)
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE)
    es_admin = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'departamento')


class Menu_colores_fondo(models.Model):
    color = models.CharField(max_length=50)
    activo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Menu_colores_opciones(models.Model):
    color = models.CharField(max_length=50)
    activo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Menu_imagenes(models.Model):
    url = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Menu_configuracion_usuarios(models.Model):
    usuario = models.ForeignKey("user_auth.User", on_delete=models.CASCADE)
    color_fondo = models.ForeignKey(Menu_colores_fondo, on_delete=models.CASCADE)
    color_opciones = models.ForeignKey(Menu_colores_opciones, on_delete=models.CASCADE)
    colapsado = models.BooleanField(default=True)
    ver_imagen = models.BooleanField(default=True)
    imagen = models.ForeignKey(Menu_imagenes, on_delete=models.CASCADE)
    modo_noche = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Notificaciones(models.Model):
    titulo = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=500)
    activo = models.BooleanField(default=True)
    fecha_vencimiento = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Notificaciones_imagenes(models.Model):
    url_imagen = models.CharField(max_length=200)
    notificacion = models.ForeignKey(Notificaciones, on_delete=models.CASCADE, null=True)
    descripcion = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Notificaciones_usuarios(models.Model):
    usuario = models.ForeignKey("user_auth.User", on_delete=models.CASCADE)
    notificacion = models.ForeignKey(Notificaciones, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Emulacion_usuarios(models.Model):
    usuario_emulo = models.ForeignKey("user_auth.User", on_delete=models.CASCADE, related_name='emulo')
    usuario_emulado = models.ForeignKey("user_auth.User", on_delete=models.CASCADE, related_name='emulado')
    date_finished = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Autorizadores_vacaciones(models.Model):
    autorizador = models.ForeignKey("user_auth.User", on_delete=models.CASCADE)
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE)
    autoriza = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Token_two_factor_authentication(models.Model):
    user = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
    token = models.CharField(max_length=700)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Paises(models.Model):
    nombre = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)
    prefijo_telefono = models.CharField(max_length=8)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class DepartamentosPaises(models.Model):
    nombre = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)
    pais = models.ForeignKey(Paises, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class MunicipiosDep(models.Model):
    nombre = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)
    departamento = models.ForeignKey(DepartamentosPaises, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
