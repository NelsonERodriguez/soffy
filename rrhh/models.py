from django.db import models
from core.models import Empresas, Departamento


# Create your models here.
class Areas(models.Model):
    codigo = models.CharField(max_length=255)
    nombre = models.CharField(max_length=255)
    activo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Departamentos(models.Model):
    area = models.ForeignKey(Areas, on_delete=models.CASCADE, null=True)
    nombre = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)
    codigo = models.CharField(max_length=255, null=True)
    departamento_presupuesto = models.ForeignKey('presupuestos.Departamentos', on_delete=models.CASCADE, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Puestos(models.Model):
    nombre = models.CharField(max_length=255)
    departamento = models.ForeignKey(Departamentos, on_delete=models.CASCADE, null=True)
    activo = models.BooleanField(default=True)
    codigo = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Users_configuracion(models.Model):
    user = models.ForeignKey('user_auth.User', on_delete=models.CASCADE, related_name='user')
    departamento = models.ForeignKey(Departamentos, on_delete=models.CASCADE, null=True)
    puesto = models.ForeignKey(Puestos, on_delete=models.CASCADE, null=True)
    user_jefe = models.ForeignKey('user_auth.User', on_delete=models.CASCADE, related_name='user_jefe', blank=True,
                                  null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Solicitud_vacaciones(models.Model):
    usuario = models.ForeignKey('user_auth.User', on_delete=models.CASCADE, related_name='usuario')
    empresa = models.ForeignKey(Empresas, on_delete=models.CASCADE, null=True)
    cantidad_dias = models.IntegerField(default=0)
    vacaciones_tomadas = models.BooleanField(default=False)
    comentarios_usuario = models.CharField(max_length=255, null=True)
    comentarios_jefe = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Solicitud_vacaciones_detalle(models.Model):
    solicitud = models.ForeignKey(Solicitud_vacaciones, on_delete=models.CASCADE)
    fecha = models.DateTimeField()
    periodo = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Vales(models.Model):
    user = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
    empleado = models.CharField(max_length=255)
    pavo_pierna = models.CharField(max_length=255)
    estado = models.IntegerField()
    year = models.IntegerField(default=0)
    correlativo = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Empleados_suspensiones(models.Model):
    empleado = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)
    estado = models.CharField(max_length=50)
    fecha_inicio = models.DateTimeField()
    fecha_regreso = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Horas_extras(models.Model):
    user = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
    departamento = models.IntegerField(null=True)
    area = models.IntegerField(null=True)
    year = models.IntegerField(null=True)
    month = models.IntegerField(null=True)
    quincena = models.SmallIntegerField(null=True)
    cerrado = models.BooleanField(default=False)
    procesado = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Horas_extras_detalle(models.Model):
    hora_extra = models.ForeignKey(Horas_extras, on_delete=models.CASCADE)
    user = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
    fecha = models.DateTimeField(null=True)
    hora_entrada = models.TimeField(null=True)
    hora_salida = models.TimeField(null=True)
    horas_simples = models.FloatField(null=True)
    horas_dobles = models.FloatField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Planificacion_vacaciones(models.Model):
    user = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
    empleado = models.CharField(max_length=255)
    departamento = models.IntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Planificacion_vacaciones_detalle(models.Model):
    planificacion = models.ForeignKey(Planificacion_vacaciones, on_delete=models.CASCADE)
    fecha = models.DateField(null=True)
    periodo = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Datos_empleado(models.Model):
    # usuario = models.ForeignKey('user_auth.User', on_delete=models.CASCADE, null=True)
    empleado_id = models.IntegerField()
    nombres = models.CharField(max_length=100, null=False)
    apellidos = models.CharField(max_length=100, null=False)
    dpi = models.CharField(max_length=25, null=False)
    departamento_dpi = models.CharField(max_length=70, null=False)
    municipio_dpi = models.CharField(max_length=70, null=False)
    direccion = models.CharField(max_length=150, null=False)
    estado_civil = models.SmallIntegerField()
    bool_cambio_datos = models.BooleanField(default=False)
    bool_actualizados = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    mail = models.CharField(max_length=100, null=True)
    telefono = models.CharField(max_length=100, null=True)
    nit = models.CharField(max_length=12, null=True)
    # nacimiento = models.DateField(null=True)
    # GENERO = (
    #     ('F', 'Femenino'),
    #     ('M', 'Masculino'),
    # )
    # genero = models.CharField(max_length=1, choices=GENERO, null=True)
    # no_hijos = models.IntegerField(default=0)


class Pagos_programados_empleados(models.Model):
    cod_empleado = models.CharField(max_length=255, null=True)
    dpi = models.CharField(max_length=255, null=True)
    no_credito = models.CharField(max_length=255)
    nombres = models.CharField(max_length=255, null=True)
    apellidos = models.CharField(max_length=255, null=True)
    empresa = models.CharField(max_length=255, null=True)
    deudor = models.CharField(max_length=255, null=True)
    monto = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    capital = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    interes = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    cuota = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    movido_nomina = models.BooleanField(default=False, null=True)
    saldo_pendiente = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    tipo_movimiento = models.CharField(max_length=150, null=True)
    nomina = models.CharField(max_length=150, null=True)


class Comision_Regla(models.Model):
    no_cliente = models.IntegerField(null=True)

    TIPO_PRODUCTO = (
        ('C', 'Cuadril'),
        ('M', 'Mixto'),
    )

    tipo_producto = models.CharField(max_length=1, choices=TIPO_PRODUCTO, null=True)

    no_producto = models.IntegerField(null=True)
    comision_base = models.DecimalField(max_digits=5, decimal_places=2)
    comision_fuera_rango = models.DecimalField(max_digits=5, decimal_places=2)
    es_porcentaje = models.BooleanField(default=True)

    descuento_precio = models.DecimalField(max_digits=5, decimal_places=2, null=True)

    no_vendedor = models.IntegerField(null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    archivo_respaldo = models.FileField(upload_to='respaldo_reglas_comisiones', max_length=500, null=True, default=None)

    fecha_inicio = models.DateField(null=True, default=None)
    fecha_fin = models.DateField(null=True, default=None)


class Comision_Regla_Rangos(models.Model):
    regla = models.ForeignKey(Comision_Regla, on_delete=models.CASCADE)
    inicio_rango_dias = models.SmallIntegerField()
    fin_rango_dias = models.SmallIntegerField()
    comision = models.DecimalField(max_digits=5, decimal_places=2)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Comision_Vendedor_Datos(models.Model):
    no_vendedor = models.IntegerField(null=False)
    codigo_empresa = models.IntegerField(null=True)
    no_area = models.IntegerField(null=True)
    nombre_personalizado = models.CharField(max_length=110, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Libreria_tipo(models.Model):
    tipo = models.CharField(max_length=50)
    clave = models.CharField(max_length=10)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Libreria_producto(models.Model):
    tipo = models.ForeignKey(Libreria_tipo, on_delete=models.CASCADE, null=True)
    codigo = models.CharField(max_length=50, null=True)
    producto = models.CharField(max_length=100)
    unidad_medida = models.CharField(max_length=30, null=True)
    activo = models.BooleanField(default=True)
    existencia = models.IntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Libreria_ingreso_bodega(models.Model):
    orden_compra = models.ForeignKey("compras.Orden_compra", on_delete=models.CASCADE, blank=True, null=True)
    user = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
    tipo = models.ForeignKey(Libreria_tipo, on_delete=models.CASCADE, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Libreria_producto_movimiento(models.Model):
    producto = models.ForeignKey(Libreria_producto, on_delete=models.CASCADE)
    orden_compra = models.ForeignKey("compras.Orden_compra", on_delete=models.CASCADE, blank=True, null=True)
    ingreso_bodega = models.ForeignKey(Libreria_ingreso_bodega, on_delete=models.CASCADE, blank=True, null=True)

    TIPO_MOVIMIENTO = (
        ('I', 'Ingreso'),
        ('E', 'Egreso'),
    )

    tipo_movimiento = models.CharField(max_length=1, choices=TIPO_MOVIMIENTO, null=True)
    cantidad = models.IntegerField()
    user = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Telefono(models.Model):
    user = models.ForeignKey('user_auth.User', on_delete=models.CASCADE, blank=True, null=True)
    numero = models.IntegerField()
    subsidio = models.DecimalField(max_digits=10, decimal_places=2)
    cuenta_subsidio = models.IntegerField(blank=True, null=True)
    cuenta_descuento = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True, null=True)


class Telefono_descuento(models.Model):
    telefono = models.ForeignKey(Telefono, on_delete=models.CASCADE)
    empresa = models.ForeignKey('core.Empresas', on_delete=models.CASCADE, blank=True, null=True)
    subsidio = models.DecimalField(max_digits=10, decimal_places=2)
    facturado = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Comision_respaldo_modificacion(models.Model):
    id_comision_datos = models.IntegerField()
    archivo_respaldo = models.FileField(upload_to='respaldo_comisiones', max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)


class Comision_regla_respaldo_modificacion(models.Model):
    comision_regla = models.ForeignKey(Comision_Regla, on_delete=models.CASCADE, null=True)
    archivo_respaldo = models.FileField(upload_to='respaldo_reglas_comisiones', max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)


class Empleado_jerarquia(models.Model):
    id_empleado = models.IntegerField()
    id_superior = models.IntegerField(null=True)
    notificar = models.BooleanField(default=False, null=False)
    autorizador_auxiliar = models.BooleanField(default=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Estatus(models.Model):
    orden = models.IntegerField()
    estatus = models.CharField(max_length=50)
    color = models.CharField(max_length=20)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


# 1. Ingresado amarillo
# 2. Enviado a autorizar naranja
# 3. Rechazado rojo
# 4. Autorizado por Encargado azul
# 5. Firma Pendiente morado
# 6. Finalizado verde

class Empleado_solicitud_vacaciones(models.Model):
    id_empleado = models.IntegerField()
    id_jefe_autorizo = models.ForeignKey('user_auth.User', on_delete=models.CASCADE, null=True, related_name='jefe')
    estatus = models.ForeignKey(Estatus, on_delete=models.CASCADE)
    trasladada_info_nomina = models.BooleanField(default=False, null=False)
    hoja_impresa = models.BooleanField(default=False, null=False)
    usuario_imprimio = models.ForeignKey('user_auth.User', on_delete=models.CASCADE, null=True)
    departamento = models.ForeignKey('core.Departamento', on_delete=models.CASCADE, null=True)
    dias_solicitados = models.SmallIntegerField()
    observacion = models.TextField(max_length=500, null=True, blank=True)
    motivo_rechazo = models.TextField(max_length=500, null=True, blank=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    eliminado = models.BooleanField(default=False, null=False)
    medio_dia = models.BooleanField(default=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Empleado_solicitud_vacaciones_detalle(models.Model):
    empleado_solicitud_vacaciones = models.ForeignKey(Empleado_solicitud_vacaciones, on_delete=models.CASCADE)
    periodo = models.TextField(max_length=20)
    fecha = models.DateField()
    id_database = models.IntegerField(null=True)
    eliminado = models.BooleanField(default=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Dias_habiles(models.Model):
    fecha = models.DateField()
    es_inhabil = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Dias_semana(models.Model):
    dia = models.IntegerField()
    nombre = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Horarios(models.Model):
    dias_semana = models.ForeignKey(Dias_semana, on_delete=models.CASCADE)
    hora_entrada = models.TimeField()
    hora_salida = models.TimeField()
    hora_almuerzo = models.TimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Empleados_horarios(models.Model):
    horario = models.ForeignKey(Horarios, on_delete=models.CASCADE)
    usuario = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Permisos_estatus(models.Model):
    orden = models.IntegerField()
    estatus = models.CharField(max_length=50)
    color = models.CharField(max_length=20)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Permisos_tipos(models.Model):
    nombre = models.CharField(max_length=100)
    dias_permitidos = models.IntegerField()
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Permisos_empleados(models.Model):
    id_empleado = models.IntegerField()
    usuario = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
    tipo = models.ForeignKey(Permisos_tipos, on_delete=models.CASCADE)
    estatus = models.ForeignKey(Permisos_estatus, on_delete=models.CASCADE)
    observacion = models.TextField(max_length=500, null=True, blank=True)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    fecha_solicitud = models.DateField()
    trasladada_info_nomina = models.BooleanField(default=False, null=False)
    hoja_impresa = models.BooleanField(default=False, null=False)
    usuario_imprimio = models.ForeignKey('user_auth.User', on_delete=models.CASCADE, null=True,
                                         related_name='usuario_imprimio')
    departamento = models.ForeignKey('core.Departamento', on_delete=models.CASCADE, null=True)
    motivo_rechazo = models.TextField(max_length=500, null=True, blank=True)
    eliminado = models.BooleanField(default=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Log_reprocesar_comisiones(models.Model):
    mes = models.SmallIntegerField()
    anio = models.SmallIntegerField()
    usuario = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Tipos_bonos(models.Model):
    nombre = models.CharField(max_length=20)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Bonificaciones_empleados(models.Model):
    usuario = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
    tipos = models.ForeignKey(Tipos_bonos, on_delete=models.CASCADE)
    year = models.IntegerField()
    tipo_periodo = models.CharField(max_length=20)
    no_periodo = models.IntegerField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    nomina = models.CharField(max_length=20)
    no_empresa = models.IntegerField()
    empresa = models.CharField(max_length=50)
    no_depto = models.IntegerField()
    departamento = models.CharField(max_length=50)
    no_empleado = models.IntegerField()
    empleado = models.CharField(max_length=50)
    fecha_alta = models.DateField()
    julio = models.DecimalField(max_digits=8, decimal_places=2)
    agosto = models.DecimalField(max_digits=8, decimal_places=2)
    septiembre = models.DecimalField(max_digits=8, decimal_places=2)
    octubre = models.DecimalField(max_digits=8, decimal_places=2)
    noviembre = models.DecimalField(max_digits=8, decimal_places=2)
    diciembre = models.DecimalField(max_digits=8, decimal_places=2)
    enero = models.DecimalField(max_digits=8, decimal_places=2)
    febrero = models.DecimalField(max_digits=8, decimal_places=2)
    marzo = models.DecimalField(max_digits=8, decimal_places=2)
    abril = models.DecimalField(max_digits=8, decimal_places=2)
    mayo = models.DecimalField(max_digits=8, decimal_places=2)
    junio = models.DecimalField(max_digits=8, decimal_places=2)
    promedio_mes = models.DecimalField(max_digits=8, decimal_places=2)
    dias = models.IntegerField()
    bono = models.DecimalField(max_digits=8, decimal_places=2)
    bono_ley = models.DecimalField(max_digits=8, decimal_places=2)
    total_1 = models.DecimalField(max_digits=8, decimal_places=2)
    iva = models.DecimalField(max_digits=8, decimal_places=2)
    isr = models.DecimalField(max_digits=8, decimal_places=2)
    reten_iva = models.DecimalField(max_digits=8, decimal_places=2)
    total_2 = models.DecimalField(max_digits=8, decimal_places=2)
    descuento = models.DecimalField(max_digits=8, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


# class Enfermeria_ficha_medica(models.Model):
#     usuario = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
#     id_empleado = models.IntegerField()
#     fecha_ficha = models.DateField(auto_now_add=True)
#     enfermedades_padecidas = models.CharField(max_length=250, null=True, blank=True)
#     alergias = models.CharField(max_length=250, null=True, blank=True)
#     talla = models.CharField(max_length=4, null=True, blank=True)
#     peso = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
#     imc = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#
#
# class Enfermeria_contactos_emergencia(models.Model):
#     usuario = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
#     nombre = models.CharField(max_length=250)
#     parentesco = models.CharField(max_length=15, null=True, blank=True)
#     tel = models.CharField(max_length=100, null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#
#
# class Enfermeria_visitas(models.Model):
#     usuario = models.ForeignKey('user_auth.User', on_delete=models.CASCADE)
#     motivo_visita = models.TextField(max_length=500, null=True, blank=True)
#     observaciones = models.TextField(max_length=1000, null=True, blank=True)
#     plan_trabajo = models.TextField(max_length=1000, null=True, blank=True)
#     talla = models.CharField(max_length=4, null=True, blank=True)
#     peso = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
#     imc = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
#     fecha_visita = models.DateTimeField()
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#
#
# class Enfermeria_visitas_receta(models.Model):
#     visita = models.ForeignKey(Enfermeria_visitas, on_delete=models.CASCADE)
#     medicamento = models.ForeignKey(Libreria_producto, on_delete=models.CASCADE)
#     cantidad = models.IntegerField(default=0)
#     observacion = models.TextField(max_length=500, null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
