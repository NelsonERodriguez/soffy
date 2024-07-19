from django.db import models


# Create your models here.
class Encuestas_sala_ventas(models.Model):
    valor = models.IntegerField()
    ofrecio = models.BooleanField(default=False)
    encontro = models.BooleanField(default=False)
    observacion = models.TextField()
    recomendar = models.BooleanField(default=False)
    observacion_recomendar = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Negociaciones_dci(models.Model):
    semana = models.IntegerField()
    year = models.IntegerField()
    usuario = models.ForeignKey('user_auth.User', on_delete=models.CASCADE, default=0)
    cerrado = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Negociaciones_dci_detalle(models.Model):
    negociaciones = models.ForeignKey(Negociaciones_dci, on_delete=models.CASCADE)
    producto_id = models.IntegerField()
    contenedores_negociados = models.IntegerField()
    fecha_entrega = models.DateField()
    estado = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Encuestas_voz_clientes(models.Model):
    NoCliente = models.IntegerField()
    telefono = models.TextField()

    PREGUNTAEVALUAPERMISO = (
        ('MALO', 'Malo'),
        ('REGULAR', 'Regular'),
        ('MUY_BUENO', "Muy Bueno"),
        ('EXCELENTE', "Excelente"),
    )

    pregunta_evalua_servicio = models.CharField(max_length=9, choices=PREGUNTAEVALUAPERMISO, default='MALO')

    PREGUNTACOMUNICACION = (
        ('TELEFONICAMENTE', 'Telefónicamente'),
        ('PERSONALMENTE', 'Personalmente'),
        ('WHATSAPP', "WhatsApp"),
        ('OTRO', "Otro"),
    )

    pregunta_comunicacion = models.CharField(max_length=15, choices=PREGUNTACOMUNICACION, default='TELEFONICAMENTE')

    detalle_pregunta_comunicacion = models.TextField(null=True)

    PREGUNTAREALIZARPEDIDO = (
        ('VENDEDOR_LLAMA', 'Vendedor le llama'),
        ('USTED_LLAMA', 'Usted llama al vendedor'),
    )

    pregunta_realizar_pedido = models.CharField(max_length=14, choices=PREGUNTAREALIZARPEDIDO, default='VENDEDOR_LLAMA')

    PREGUNTAMETODOPEDIDO = (
        ('TELEFONO', 'Teléfono'),
        ('VISITA', 'Visita'),
        ('OTRO', 'Otro'),
    )

    pregunta_metodo_pedido = models.CharField(max_length=8, choices=PREGUNTAMETODOPEDIDO, default='TELEFONO')

    detalle_pregunta_metodo_pedido = models.TextField(null=True)
    pregunta_vendedor_ofrece = models.BooleanField(default=False)
    pregunta_cambio_precio = models.BooleanField(default=False)

    PREGUNTAVISITASVENDEDOR = (
        ('SEMANAL', 'Semanal'),
        ('QUINCENAL', 'Quincenal'),
        ('MENSUAL', 'Mensual'),
        ('DOS_MESES', 'Dos Meses'),
        ('NUNCA', 'Nunca'),
    )

    pregunta_visitas_vendedor = models.CharField(max_length=9, choices=PREGUNTAVISITASVENDEDOR, default='SEMANAL')

    comentario = models.TextField(null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Cotizaciones(models.Model):
    nocotizacion = models.IntegerField(db_column='NoCotizacion', primary_key=True, unique=True)
    noempresa = models.IntegerField(db_column='NoEmpresa')
    nodocumento = models.IntegerField(db_column='NoDocumento')
    fecha = models.DateTimeField(db_column='Fecha')
    nocliente = models.IntegerField(db_column='NoCliente')
    novendedor = models.IntegerField(db_column='NoVendedor')
    diasvalidez = models.IntegerField(db_column='DiasValidez')
    total = models.DecimalField(db_column='Total', max_digits=14, decimal_places=2)
    iva = models.DecimalField(db_column='Iva', max_digits=14, decimal_places=2)
    excento = models.DecimalField(db_column='Excento', max_digits=14, decimal_places=2)
    porcentajedescuento = models.DecimalField(db_column='PorcentajeDescuento', max_digits=9, decimal_places=6,
                                              blank=True, null=True)
    valordescuento = models.DecimalField(db_column='ValorDescuento', max_digits=14, decimal_places=2)
    nomoneda = models.CharField(db_column='NoMoneda', max_length=3)
    tipocambio = models.DecimalField(db_column='TipoCambio', max_digits=14, decimal_places=6)
    observaciones = models.CharField(db_column='Observaciones', max_length=255, blank=True, null=True)
    nofactura = models.IntegerField(db_column='NoFactura', blank=True, null=True)
    anulado = models.BooleanField(db_column='Anulado')
    noestado = models.IntegerField(db_column='NoEstado')
    nousuario = models.IntegerField(db_column='NoUsuario')
    operado = models.DateTimeField(db_column='Operado')
    nonit = models.CharField(db_column='NoNit', max_length=20, blank=True, null=True)
    nombre = models.CharField(db_column='Nombre', max_length=255, blank=True, null=True)
    direccion = models.CharField(db_column='Direccion', max_length=255, blank=True, null=True)
    nootransporte = models.IntegerField(db_column='NoOTransporte', blank=True, null=True)
    nosucursal = models.IntegerField(db_column='NoSucursal', blank=True, null=True)

    GENERA = (
        ('F', 'Factura'),
        ('E', 'Envio'),
    )
    generafe = models.CharField(db_column='GeneraFE', max_length=1, blank=True, null=True, choices=GENERA)

    escredito = models.BooleanField(db_column='EsCredito', blank=True, null=True)

    DESPACHO = (
        ('E', 'Entregan'),
        ('R', 'Regogen'),
        ('V', 'Vendedor entrega'),
    )
    despachoer = models.CharField(db_column='DespachoER', max_length=1, blank=True, null=True, choices=DESPACHO)

    FECHADESPACHO = (
        ('H', 'Hoy'),
        ('M', 'Mañana'),
    )
    fdespachohm = models.CharField(db_column='FDespachoHM', max_length=1, blank=True, null=True, choices=FECHADESPACHO)

    formapago = models.CharField(db_column='FormaPago', max_length=1, blank=True, null=True)
    direccionentrega = models.CharField(db_column='DireccionEntrega', max_length=255, blank=True, null=True)
    pedidoporcliente = models.BooleanField(db_column='PedidoPorCliente', blank=True, null=True)

    BODEGAS = (
        ('G', 'General'),
        ('S', 'Sala de ventas'),
    )
    bodega = models.CharField(db_column='Bodega', choices=BODEGAS, max_length=1)

    refacturacion = models.BooleanField(db_column='ReFacturacion')

    formaenvio = models.IntegerField(db_column='FormaEnvio', blank=True, null=True)
    nocontenedor = models.CharField(db_column='NoContenedor', max_length=255, blank=True, null=True)

    class Meta:
        unique_together = ('noempresa', 'nodocumento')


class Detalle_cotizaciones(models.Model):
    nocotizacion = models.ForeignKey(Cotizaciones, db_column='NoCotizacion', on_delete=models.CASCADE)
    linea = models.IntegerField(db_column='Linea')
    noproducto = models.IntegerField(db_column='NoProducto')
    nounidad = models.IntegerField(db_column='NoUnidad')
    cantidad = models.DecimalField(db_column='Cantidad', max_digits=14, decimal_places=2)
    porcentajedescuento = models.DecimalField(db_column='PorcentajeDescuento', max_digits=9, decimal_places=6,
                                              blank=True, null=True)
    valordescuento = models.DecimalField(db_column='ValorDescuento', max_digits=14, decimal_places=2)
    total = models.DecimalField(db_column='Total', max_digits=14, decimal_places=2)
    iva = models.DecimalField(db_column='Iva', max_digits=14, decimal_places=2)
    excento = models.DecimalField(db_column='Excento', max_digits=14, decimal_places=2)
    vunitario = models.DecimalField(db_column='VUnitario', max_digits=31, decimal_places=17, blank=True, null=True)
    nolote = models.IntegerField(db_column='NoLote', blank=True, null=True)

    class Meta:
        unique_together = ('nocotizacion', 'linea')


class Facturas(models.Model):
    nofactura = models.IntegerField(db_column='NoFactura', primary_key=True, unique=True)
    noempresa = models.IntegerField(db_column='NoEmpresa')
    tipodocumento = models.CharField(db_column='TipoDocumento', max_length=1)
    serie = models.CharField(db_column='Serie', max_length=15)
    nodocumento = models.BigIntegerField(db_column='NoDocumento', blank=True, null=True)
    fecha = models.DateTimeField(db_column='Fecha')
    nocliente = models.IntegerField(db_column='NoCliente')
    novendedor = models.IntegerField(db_column='NoVendedor')
    diascredito = models.IntegerField(db_column='DiasCredito')
    total = models.DecimalField(db_column='Total', max_digits=14, decimal_places=2)
    iva = models.DecimalField(db_column='Iva', max_digits=14, decimal_places=2)
    excento = models.DecimalField(db_column='Excento', max_digits=14, decimal_places=2)
    porcentajedescuento = models.DecimalField(db_column='PorcentajeDescuento', max_digits=9, decimal_places=6)
    valordescuento = models.DecimalField(db_column='ValorDescuento', max_digits=14, decimal_places=2)
    nomoneda = models.CharField(db_column='NoMoneda', max_length=3)
    tipocambio = models.DecimalField(db_column='TipoCambio', max_digits=14, decimal_places=6)
    observaciones = models.CharField(db_column='Observaciones', max_length=255, blank=True, null=True)
    nomovimientoegreso = models.IntegerField(db_column='NoMovimientoEgreso', blank=True, null=True)
    nomovimientoingreso = models.IntegerField(db_column='NoMovimientoIngreso', blank=True, null=True)
    nonit = models.CharField(db_column='NoNit', max_length=20, blank=True, null=True)
    nombre = models.CharField(db_column='Nombre', max_length=255, blank=True, null=True)
    direccion = models.CharField(db_column='Direccion', max_length=255, blank=True, null=True)
    escredito = models.BooleanField(db_column='EsCredito')
    anulado = models.BooleanField(db_column='Anulado')
    nocierre = models.IntegerField(db_column='NoCierre', blank=True, null=True)
    noestado = models.IntegerField(db_column='NoEstado')
    nousuario = models.IntegerField(db_column='NoUsuario')
    operado = models.DateTimeField(db_column='Operado')

    class Meta:
        unique_together = (('noempresa', 'tipodocumento', 'serie', 'nodocumento'),)


class Detalle_facturas(models.Model):
    nofactura = models.ForeignKey(Facturas, db_column='NoFactura', on_delete=models.CASCADE)
    linea = models.IntegerField(db_column='Linea')
    noproducto = models.IntegerField(db_column='NoProducto')
    nounidad = models.IntegerField(db_column='NoUnidad')
    cantidad = models.DecimalField(db_column='Cantidad', max_digits=14, decimal_places=2)
    porcentajedescuento = models.DecimalField(db_column='PorcentajeDescuento', max_digits=9, decimal_places=6,
                                              blank=True, null=True)
    valordescuento = models.DecimalField(db_column='ValorDescuento', max_digits=14, decimal_places=2)
    total = models.DecimalField(db_column='Total', max_digits=14, decimal_places=2)
    iva = models.DecimalField(db_column='Iva', max_digits=14, decimal_places=2)
    excento = models.DecimalField(db_column='Excento', max_digits=14, decimal_places=2)
    vunitario = models.DecimalField(db_column='VUnitario', max_digits=31, decimal_places=17, blank=True, null=True)

    class Meta:
        unique_together = (('nofactura', 'linea'),)


class Planeacion_demanda(models.Model):
    user = models.ForeignKey('user_auth.User', on_delete=models.CASCADE, default=0)
    cerrado = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Planeacion_demanda_detalle(models.Model):
    planeacion = models.ForeignKey(Planeacion_demanda, on_delete=models.CASCADE)
    noproducto = models.IntegerField()
    cantidad = models.IntegerField()
    descripcion = models.CharField(max_length=2000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Cliente_prospecto(models.Model):
    nit = models.CharField(max_length=15)
    nombre_cliente = models.CharField(max_length=300)
    nombre_contacto = models.CharField(max_length=300)
    direccion_entrega = models.CharField(max_length=300)
    nombre_negocio = models.CharField(max_length=300)
    direccion_fiscal = models.CharField(max_length=500)
    tipo_negocio = models.CharField(max_length=200)
    telefono = models.CharField(max_length=200)
    email = models.CharField(max_length=320, null=True)
    cumpleanios_contacto = models.DateField(null=True)
    observaciones = models.CharField(max_length=1000, null=True)
    rtu_path = models.CharField(max_length=255, null=True)
    dpi_path = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    nombre_vendedor = models.CharField(max_length=100, null=True, default=None)


class Cliente_actualizacion(models.Model):
    codigo_cliente = models.CharField(max_length=30)
    razon_social = models.CharField(max_length=300, null=True)
    nit = models.CharField(max_length=15, null=True)
    direccion_fiscal = models.CharField(max_length=300, null=True)
    direccion_entrega = models.CharField(max_length=300, null=True)
    otra_sucursal = models.CharField(max_length=300, null=True)
    nombre_vendedor = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    rtu_path = models.CharField(max_length=255, null=True)
    dpi_path = models.CharField(max_length=255, null=True)


class Cliente_sv(models.Model):
    codigo_cliente = models.CharField(max_length=20)
    cliente = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20)
    email = models.CharField(max_length=150)
    direccion_fiscal = models.CharField(max_length=300, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, default=None)


class Tipo_producto_sv(models.Model):
    tipo_producto = models.CharField(max_length=30)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, default=None)


class Producto_sv(models.Model):
    tipo_producto_sv = models.ForeignKey(Tipo_producto_sv, on_delete=models.CASCADE)
    codigo_producto = models.CharField(max_length=20)
    producto = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, default=None)


class Producto_sv_igualdad(models.Model):
    producto_sv = models.ForeignKey(Producto_sv, on_delete=models.CASCADE)
    no_producto = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Orden_compra_sv(models.Model):
    cliente_sv = models.ForeignKey(Cliente_sv, on_delete=models.CASCADE)
    fecha = models.DateTimeField()
    total = models.DecimalField(max_digits=14, decimal_places=4)
    path_factura = models.CharField(max_length=255)
    path_recibo = models.CharField(max_length=255)
    path_transferencia = models.CharField(max_length=255)
    anulada = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, default=None)


class Orden_compra_detalle_sv(models.Model):
    orden_compra_sv = models.ForeignKey(Orden_compra_sv, on_delete=models.CASCADE)
    producto_sv = models.ForeignKey(Producto_sv, on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=14, decimal_places=4)
    precio = models.DecimalField(max_digits=14, decimal_places=4)
    total = models.DecimalField(max_digits=14, decimal_places=4)
    porcentaje_comision = models.DecimalField(max_digits=5, decimal_places=2, null=True, default=None)
    valor_comision_dolar = models.DecimalField(max_digits=14, decimal_places=4, null=True, default=None)
    valor_comision_quetzal = models.DecimalField(max_digits=14, decimal_places=4, null=True, default=None)
    cerrado = models.BooleanField(default=False)
    observacion = models.TextField(max_length=500, null=True, blank=True)
    tipo_cambio = models.DecimalField(max_digits=5, decimal_places=2, null=True, default=None)
    path_respaldo = models.CharField(max_length=255, null=True, default=None)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Ingreso_devolucion(models.Model):
    vendedor = models.CharField(max_length=100)
    cliente = models.CharField(max_length=300)
    fecha = models.DateTimeField()
    producto = models.CharField(max_length=300)
    factura = models.CharField(max_length=50)

    MOTIVOS = (
        ('VENDEDOR', 'Error Vendedor'),
        ('CLIENTE', 'Error Cliente'),
        ('PRESENTACION', "Presentación del Producto"),
        ('OTRO', "Otro"),
    )

    motivo = models.CharField(max_length=12, choices=MOTIVOS, default='PRESENTACION')
    otro_motivo = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
