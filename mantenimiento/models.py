from django.db import models

from contabilidad.models import Mccos, Mcuentas, Mgrupoitm
from user_auth.models import User


class mempresa(models.Model):
    nombreempresa = models.CharField(max_length=100, blank=True, null=True)
    direccion = models.CharField(max_length=200, blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    nitempresa = models.CharField(max_length=20, blank=True, null=True)
    cloud = models.IntegerField(blank=True, null=True)
    logo = models.CharField(max_length=200, blank=True, null=True)
    ctaclientes = models.CharField(max_length=10, blank=True, null=True)
    tasausd = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    ivatasa = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    ctaiva = models.CharField('CtaIva', max_length=10, blank=True, null=True)
    ctaret = models.CharField(max_length=10, blank=True, null=True)
    ctacxp = models.CharField(max_length=10, blank=True, null=True)
    ctaxliq = models.CharField(max_length=10, blank=True, null=True)
    ctaivaxpag = models.CharField(max_length=10, blank=True, null=True)
    ctaexec = models.CharField(max_length=10, blank=True, null=True)
    ctautilidades = models.CharField(max_length=10, blank=True, null=True)
    ctaperdidas = models.CharField(max_length=10, blank=True, null=True)
    usarlector = models.SmallIntegerField(blank=True, null=True)
    rolempresa = models.SmallIntegerField(blank=True, null=True)
    manejainv = models.SmallIntegerField(blank=True, null=True)
    usaconta = models.CharField(max_length=2, blank=True, null=True)
    moneda = models.CharField(max_length=3, blank=True, null=True)
    tipodocto = models.CharField(max_length=10, blank=True, null=True)
    regimen = models.CharField(max_length=3, blank=True, null=True)
    correoemisor = models.CharField(max_length=200, blank=True, null=True)
    postal = models.CharField(max_length=10, blank=True, null=True)
    pais = models.CharField(max_length=5, blank=True, null=True)
    municipio = models.CharField(max_length=30, blank=True, null=True)
    departamento = models.CharField(max_length=30, blank=True, null=True)
    preciomanual = models.SmallIntegerField(blank=True, null=True)
    agretiva = models.CharField(max_length=2, blank=True, null=True)
    razonsocial = models.CharField(max_length=100, blank=True, null=True)
    dirsocial = models.CharField(max_length=100, blank=True, null=True)
    ctaidpimp = models.CharField(max_length=10, blank=True, null=True)
    usafel = models.CharField(max_length=2, blank=True, null=True)
    ctaretiva = models.CharField(max_length=10, blank=True, null=True)
    replegal = models.CharField(max_length=200, blank=True, null=True)
    contadorgeneral = models.CharField(max_length=200, blank=True, null=True)
    certificacion = models.CharField(max_length=400, blank=True, null=True)
    lineasfac = models.SmallIntegerField(blank=True, null=True)
    metodoimporta = models.SmallIntegerField(blank=True, null=True)
    ctaivapgtr = models.CharField(max_length=10, blank=True, null=True)
    ctaivagasto = models.CharField(max_length=10, blank=True, null=True)
    codexport = models.CharField(max_length=15, blank=True, null=True)
    idbodega = models.SmallIntegerField(blank=True, null=True)
    idbodega2 = models.SmallIntegerField(blank=True, null=True)
    descripcion = models.DecimalField(max_digits=1, decimal_places=0, blank=True, null=True)
    noestable = models.DecimalField(max_digits=3, decimal_places=0, blank=True, null=True)
    ctaefectivo = models.CharField(max_length=10, blank=True, null=True)
    ctatransfer = models.CharField(max_length=10, blank=True, null=True)
    ctaebanco1 = models.CharField(max_length=10, blank=True, null=True)
    ctaebanco2 = models.CharField(max_length=10, blank=True, null=True)
    certifica = models.CharField(max_length=2, blank=True, null=True)
    ctaperygan = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombreempresa


class Mbodega(models.Model):
    nbodega = models.CharField(db_column='NBodega', max_length=100, blank=True, null=True)
    ubicacion = models.CharField(db_column='Ubicacion', max_length=100, blank=True, null=True)
    activo = models.BooleanField(db_column='Activo', default=True)
    predet = models.BooleanField(db_column='Predet', default=False)
    ctacontable = models.ForeignKey(Mcuentas, db_column='CtaContable', blank=True, null=True, on_delete=models.CASCADE)
    cencos = models.ForeignKey(Mccos, db_column='CenCos', blank=True, null=True, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.nbodega} - {self.ubicacion}"


class Mdocumentos(models.Model):
    tipodocumento = models.CharField(db_column='TipoDocumento', max_length=50, blank=True, null=True)
    fechainicio = models.DateField(db_column='FechaInicio', blank=True, null=True)
    fechavence = models.DateField(db_column='FechaVence', blank=True, null=True)
    serie = models.CharField(db_column='Serie', max_length=20, blank=True, null=True)
    desde = models.IntegerField(db_column='Desde', blank=True, null=True)
    hasta = models.IntegerField(db_column='Hasta', blank=True, null=True)
    ultimano = models.IntegerField(db_column='UltimaNo', blank=True, null=True)
    resolucion = models.CharField(db_column='Resolucion', max_length=50, blank=True, null=True)
    idsucursal = models.ForeignKey(Mbodega, db_column='IdSucursal', max_length=10, blank=True, null=True,
                                   on_delete=models.CASCADE)
    describedocumento = models.CharField(db_column='DescribeDocumento', max_length=50, blank=True, null=True)
    noestable = models.DecimalField(db_column='NoEstable', max_digits=3, decimal_places=0, blank=True, null=True)
    cortecaja = models.CharField(db_column='CorteCaja', max_length=2, blank=True, null=True)

    def __str__(self):
        return self.serie


class Musers(models.Model):
    iduser = models.OneToOneField(User, db_column='IdUser', unique=True, on_delete=models.CASCADE)
    seriepedido = models.ForeignKey(Mdocumentos, db_column='SeriePedido', max_length=20, blank=True, null=True,
                                    on_delete=models.CASCADE, related_name='seriepedido')
    seriefactura = models.ForeignKey(Mdocumentos, db_column='SerieFactura', max_length=20, blank=True, null=True,
                                     on_delete=models.CASCADE, related_name='seriefactura')
    todas = models.BooleanField(db_column='Todas', default=False)
    anulafacturas = models.BooleanField(db_column='AnulaFacturas', default=False)
    cambiaprecios = models.BooleanField(db_column='CambiaPrecios', default=False)

    def __str__(self):
        return self.iduser.name


class Mbodega02(models.Model):
    iduser = models.ForeignKey(User, db_column='IdUser', on_delete=models.CASCADE)
    idbodega = models.ForeignKey(Mbodega, db_column='IdBodega', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.idbodega.ubicacion} - {self.iduser.name}"


class Mbancos(models.Model):
    cueban = models.CharField(db_column='Cueban', max_length=50)
    nomban = models.CharField(db_column='Nomban', max_length=100, blank=True, null=True)
    chequesigue = models.IntegerField(db_column='ChequeSigue', blank=True, null=True)
    ctacon = models.ForeignKey(Mcuentas, db_column='CtaCon', max_length=10, blank=True, null=True,
                               on_delete=models.CASCADE)
    piecheq = models.CharField(db_column='Piecheq', max_length=20, blank=True, null=True)
    sobregiro = models.BooleanField(db_column='Sobregiro', blank=True, null=True)
    moneda = models.CharField(db_column='Moneda', max_length=10, blank=True, null=True)
    bloqueado = models.BooleanField(db_column='Bloqueado', blank=True, null=True)
    saldoinicial = models.DecimalField(db_column='SaldoInicial', max_digits=18, decimal_places=2, blank=True, null=True)
    fechainicial = models.DateField(db_column='FechaInicial', blank=True, null=True)

    def __str__(self):
        return self.nomban


class Mcanales(models.Model):
    canal = models.CharField(db_column='Canal', unique=True, max_length=50)
    ocrcode = models.CharField(db_column='OcrCode', max_length=10, blank=True, null=True)
    agrupador = models.CharField(db_column='Agrupador', max_length=30, blank=True, null=True)

    def __str__(self):
        return self.canal


class Mgruposocio(models.Model):
    gruposocio = models.CharField(db_column='GrupoSocio', max_length=50, blank=True, null=True)
    ctacontable = models.ForeignKey(Mcuentas, db_column='CtaContable', blank=True, null=True, on_delete=models.CASCADE)

    def __str__(self):
        return self.gruposocio


class Mgtoi(models.Model):
    nombregasto = models.CharField(db_column='NombreGasto', max_length=100, blank=True, null=True)
    ctagasto = models.ForeignKey(Mcuentas, db_column='CtaGasto', max_length=10, blank=True, null=True,
                                 on_delete=models.CASCADE)

    def __str__(self):
        return self.nombregasto


class Mimpuestos(models.Model):
    nombreret = models.CharField(db_column='NombreRet', max_length=100, blank=True, null=True)
    categoria = models.CharField(db_column='Categoria', max_length=10, blank=True, null=True)
    fechavalido = models.DateField(db_column='FechaValido', blank=True, null=True)
    tarifa = models.SmallIntegerField(db_column='Tarifa', blank=True, null=True)
    base = models.CharField(db_column='Base', max_length=10, blank=True, null=True)
    prcimpbase = models.DecimalField(db_column='Prcimpbase', max_digits=18, decimal_places=2, blank=True, null=True)
    ctaconatble = models.ForeignKey(Mcuentas, db_column='CtaConatble', max_length=10, blank=True, null=True,
                                    on_delete=models.CASCADE)

    def __str__(self):
        return self.nombreret


class Mmoneda(models.Model):
    moneda = models.CharField(db_column='Moneda', max_length=3, blank=True, null=True)
    nombre = models.CharField(db_column='Nombre', max_length=20, blank=True, null=True)

    def __str__(self):
        return self.nombre


class Mpais(models.Model):
    pais = models.CharField(db_column='Pais', max_length=50, blank=True, null=True)
    siglas = models.CharField(db_column='Siglas', max_length=2, blank=True, null=True)

    def __str__(self):
        return self.pais


class Mciudades(models.Model):
    idpais = models.ForeignKey(Mpais, db_column='IdPais', on_delete=models.CASCADE)
    ciudad = models.CharField(db_column='Ciudad', max_length=50, blank=True, null=True)

    def __str__(self):
        return self.ciudad


class Mmunicipio(models.Model):
    idciudad = models.ForeignKey(Mciudades, db_column='IdCiudad', on_delete=models.CASCADE)
    municipio = models.CharField(db_column='Municipio', max_length=50, blank=True, null=True)

    def __str__(self):
        return self.municipio


class Mrutas(models.Model):
    nombreruta = models.CharField(db_column='NombreRuta', max_length=50, blank=True, null=True)

    def __str__(self):
        return self.nombreruta


class Msegmento(models.Model):
    idsegmento = models.SmallAutoField(db_column='IdSegmento', primary_key=True)
    codigo = models.CharField(db_column='Codigo', max_length=10, blank=True, null=True)
    segmento = models.CharField(db_column='Segmento', max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.codigo} - {self.segmento}"


class Mvendedores(models.Model):
    nvendedor = models.CharField(db_column='NVendedor', max_length=100, blank=True, null=True)
    comision = models.DecimalField(db_column='Comision', max_digits=10, decimal_places=2, blank=True, null=True)
    ruta = models.ForeignKey(Mrutas, db_column='Ruta', blank=True, null=True, on_delete=models.CASCADE)
    codigovendor = models.CharField(db_column='CodigoVendor', max_length=20, blank=True, null=True)
    correo = models.EmailField(db_column='Correo', max_length=100, blank=True, null=True)
    telefono = models.CharField(db_column='Telefono', max_length=10, blank=True, null=True)
    idbodega = models.ForeignKey(Mbodega, db_column='IdBodega', blank=True, null=True, on_delete=models.CASCADE)
    login = models.CharField(max_length=20, blank=True, null=True)
    segmento = models.ForeignKey(Msegmento, db_column='Segmento', blank=True, null=True, on_delete=models.CASCADE)

    def __str__(self):
        return self.nvendedor


class Mcategoria(models.Model):
    codigocategoria = models.CharField(db_column='CodigoCategoria', max_length=10, blank=True, null=True)
    categoria = models.CharField(db_column='Categoria', max_length=50, blank=True, null=True)

    def __str__(self):
        return self.categoria


class Msubcategoria(models.Model):
    idcategoria = models.ForeignKey(Mcategoria, db_column='IdCategoria', blank=True, null=True,
                                    on_delete=models.CASCADE)
    subcategoria = models.CharField(db_column='SubCategoria', max_length=50, blank=True, null=True)

    def __str__(self):
        return self.subcategoria


class Mmarca(models.Model):
    idcategoria = models.ForeignKey(Mcategoria, db_column='IdCategoria', blank=True, null=True,
                                    on_delete=models.CASCADE)
    marca = models.CharField(db_column='Marca', max_length=50, blank=True, null=True)

    def __str__(self):
        return self.marca


class Mcontactos(models.Model):
    idsocio = models.ForeignKey("Msocios", db_column='IdSocio', blank=True, null=True, on_delete=models.CASCADE)
    nombre = models.CharField(db_column='Nombre', max_length=50, blank=True, null=True)
    puesto = models.CharField(db_column='Puesto', max_length=20, blank=True, null=True)
    correo = models.CharField(max_length=100, blank=True, null=True)
    telefono1 = models.CharField(max_length=10, blank=True, null=True)
    telefono2 = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return self.nombre


class Mlinea(models.Model):
    linea = models.CharField(db_column='Linea', max_length=50, blank=True, null=True)

    def __str__(self):
        return self.linea


class Mmedidas(models.Model):
    umedida = models.CharField(db_column='UMedida', unique=True, max_length=10)
    nmedida = models.CharField(db_column='NMedida', max_length=50, blank=True, null=True)
    unidades = models.DecimalField(db_column='Unidades', max_digits=10, decimal_places=2, blank=True, null=True)

    def __str__(self):
        return self.nmedida


class Marticulos(models.Model):
    idproducto = models.CharField(db_column='IdProducto', unique=True, max_length=20)
    nmproducto = models.CharField(db_column='NmProducto', max_length=100, blank=True, null=True)
    dsproducto = models.CharField(db_column='DsProducto', max_length=100, blank=True, null=True)
    ref1 = models.CharField(db_column='Ref1', max_length=30, blank=True, null=True)
    barcode = models.CharField(db_column='Barcode', max_length=20, blank=True, null=True)
    idgrupo = models.ForeignKey(Mgrupoitm, db_column='IdGrupo', blank=True, null=True, on_delete=models.CASCADE)
    idsegmento = models.ForeignKey(Msegmento, db_column='IdSegmento', blank=True, null=True, on_delete=models.CASCADE)
    idcategoria = models.ForeignKey(Mcategoria, db_column='IdCategoria', blank=True, null=True,
                                    on_delete=models.CASCADE)
    idsubcategoria = models.ForeignKey(Msubcategoria, db_column='IdSubCategoria', blank=True, null=True,
                                       on_delete=models.CASCADE)
    idmarca = models.ForeignKey(Mmarca, db_column='IdMarca', blank=True, null=True, on_delete=models.CASCADE)
    idtipo = models.CharField(db_column='IdTipo', max_length=50, blank=True, null=True)
    idml = models.CharField(db_column='IdML', max_length=10, blank=True, null=True)
    idlinea = models.ForeignKey(Mlinea, db_column='IdLinea', blank=True, null=True, on_delete=models.CASCADE)
    facturanegativo = models.BooleanField(db_column='FacturaNegativo', blank=True, null=True)
    existencia = models.DecimalField(db_column='Existencia', max_digits=18, decimal_places=2, blank=True, null=True)
    activo = models.BooleanField(db_column='Activo', blank=True, null=True)
    idsocio = models.ForeignKey("Msocios", db_column='IdSocio', blank=True, null=True, on_delete=models.CASCADE)
    umedcompra = models.ForeignKey(Mmedidas, db_column='UmedCompra', blank=True, null=True, on_delete=models.CASCADE,
                                   related_name='umedcompra')
    costopromedio = models.DecimalField(db_column='CostoPromedio', max_digits=18, decimal_places=8, blank=True,
                                        null=True)
    ultimacompra = models.DecimalField(db_column='UltimaCompra', max_digits=18, decimal_places=4, blank=True, null=True)
    longitud = models.SmallIntegerField(db_column='Longitud', blank=True, null=True)
    alto = models.DecimalField(db_column='Alto', max_digits=18, decimal_places=2, blank=True, null=True)
    ancho = models.DecimalField(db_column='Ancho', max_digits=18, decimal_places=2, blank=True, null=True)
    volumen = models.DecimalField(db_column='Volumen', max_digits=18, decimal_places=2, blank=True, null=True)
    peso = models.DecimalField(db_column='Peso', max_digits=18, decimal_places=2, blank=True, null=True)
    inventario = models.SmallIntegerField(db_column='Inventario', blank=True, null=True)
    sujetoreten = models.BooleanField(db_column='SujetoReten', blank=True, null=True)
    umedventa = models.ForeignKey(Mmedidas, db_column='UmedVEnta', blank=True, null=True, on_delete=models.CASCADE,
                                  related_name='umedventa')
    sujetoiva = models.BooleanField(db_column='SujetoIva', blank=True, null=True)
    imagen = models.ImageField(upload_to="articulos", db_column='Imagen', blank=True, null=True)
    listaprecio1 = models.DecimalField(db_column='ListaPrecio1', max_digits=18, decimal_places=2, blank=True, null=True)
    listaprecio2 = models.DecimalField(db_column='ListaPrecio2', max_digits=18, decimal_places=2, blank=True, null=True)
    listaprecio3 = models.DecimalField(db_column='ListaPrecio3', max_digits=18, decimal_places=2, blank=True, null=True)
    listaprecio4 = models.DecimalField(db_column='ListaPrecio4', max_digits=18, decimal_places=2, blank=True, null=True)
    listaprecio5 = models.DecimalField(db_column='ListaPrecio5', max_digits=18, decimal_places=2, blank=True, null=True)
    listaprecio6 = models.DecimalField(db_column='ListaPrecio6', max_digits=18, decimal_places=2, blank=True, null=True)
    listaprecio7 = models.DecimalField(db_column='ListaPrecio7', max_digits=18, decimal_places=2, blank=True, null=True)
    listaprecio8 = models.DecimalField(db_column='ListaPrecio8', max_digits=18, decimal_places=2, blank=True, null=True)
    listaprecio9 = models.DecimalField(db_column='ListaPrecio9', max_digits=18, decimal_places=2, blank=True, null=True)
    listaprecio10 = models.DecimalField(db_column='ListaPrecio10', max_digits=18, decimal_places=2, blank=True,
                                        null=True)
    margen = models.DecimalField(db_column='Margen', max_digits=18, decimal_places=2, blank=True, null=True)
    fechacrea = models.DateField(db_column='FechaCrea', blank=True, null=True)
    fechamodifica = models.DateField(db_column='FechaModifica', blank=True, null=True)
    minimo = models.SmallIntegerField(db_column='Minimo', blank=True, null=True)
    maximo = models.SmallIntegerField(db_column='Maximo', blank=True, null=True)
    propiedad1 = models.CharField(db_column='Propiedad1', max_length=20, blank=True, null=True)
    listaprecio = models.SmallIntegerField(db_column='ListaPrecio', blank=True, null=True)

    def __str__(self):
        return self.nmproducto


class Marticulos2(models.Model):
    marticulo = models.ForeignKey(Marticulos, db_column='Marticulo', on_delete=models.CASCADE)
    idcombo = models.CharField(db_column='IdCombo', max_length=20, blank=True, null=True)
    idproducto = models.CharField(db_column='IdProducto', max_length=20, blank=True, null=True)
    cantidad = models.DecimalField(db_column='Cantidad', max_digits=18, decimal_places=2, blank=True, null=True)
    preciouni = models.DecimalField(db_column='PrecioUni', max_digits=18, decimal_places=2, blank=True, null=True)


class Mlistapre01(models.Model):
    nombrelista = models.CharField(db_column='NombreLista', max_length=30, blank=True, null=True)
    listapadre = models.ForeignKey('self', db_column='ListaPadre', blank=True, null=True, on_delete=models.CASCADE)
    variacion = models.DecimalField(db_column='Variacion', max_digits=18, decimal_places=2, blank=True, null=True)
    fechainicio = models.DateField(db_column='FechaInicio', blank=True, null=True)
    tipolista = models.CharField(db_column='TipoLista', max_length=10, blank=True, null=True)
    fechafin = models.DateField(db_column='FechaFin', blank=True, null=True)

    def __str__(self):
        return self.nombrelista


class Mlistapre02(models.Model):
    lista = models.ForeignKey(Mlistapre01, db_column='Lista', blank=True, null=True, on_delete=models.CASCADE)
    idproducto = models.CharField(db_column='IdProducto', max_length=20, blank=True, null=True)
    preciouni = models.DecimalField(db_column='PrecioUni', max_digits=18, decimal_places=2, blank=True, null=True)
    registro = models.AutoField(db_column='Registro', primary_key=True)


class Msocios(models.Model):
    codsocio = models.CharField(db_column='CodSocio', max_length=10, blank=True, null=True)
    tiposocio = models.CharField(db_column='TipoSocio', max_length=10, blank=True, null=True)
    nombresocio = models.CharField(db_column='NombreSocio', max_length=200, blank=True, null=True)
    direccion = models.CharField(db_column='Direccion', max_length=200, blank=True, null=True)
    nit = models.CharField(db_column='Nit', max_length=15, blank=True, null=True)
    telefono1 = models.CharField(db_column='Telefono1', max_length=15, blank=True, null=True)
    telefono2 = models.CharField(db_column='Telefono2', max_length=15, blank=True, null=True)
    correo = models.EmailField(db_column='Correo', max_length=100, blank=True, null=True)
    idpais = models.ForeignKey(Mpais, db_column='IdPais', blank=True, null=True, on_delete=models.CASCADE)
    idciudad = models.ForeignKey(Mciudades, db_column='IdCiudad', blank=True, null=True, on_delete=models.CASCADE)
    idmunicipio = models.ForeignKey(Mmunicipio, db_column='IdMunicipio', blank=True, null=True,
                                    on_delete=models.CASCADE)
    activo = models.BooleanField(db_column='Activo', blank=True, null=True)
    idruta = models.ForeignKey(Mrutas, db_column='IdRuta', blank=True, null=True, on_delete=models.CASCADE)
    idvendedor = models.ForeignKey(Mvendedores, db_column='IdVendedor', blank=True, null=True, on_delete=models.CASCADE)
    contacto = models.CharField(db_column='Contacto', max_length=50, blank=True, null=True)
    idgruposocio = models.ForeignKey(Mgruposocio, db_column='IdGrupoSocio', on_delete=models.CASCADE)
    listaprecio = models.SmallIntegerField(db_column='ListaPrecio', blank=True, null=True)
    descto = models.DecimalField(db_column='Descto', max_digits=10, decimal_places=2, blank=True, null=True)
    moneda = models.ForeignKey(Mmoneda, db_column='Moneda', blank=True, null=True, on_delete=models.CASCADE)
    diascredito = models.SmallIntegerField(db_column='DiasCredito', blank=True, null=True)
    limitecredito = models.DecimalField(db_column='LimiteCredito', max_digits=18, decimal_places=2, blank=True,
                                        null=True)
    pagaiva = models.CharField(db_column='PagaIva', max_length=2, blank=True, null=True)
    ctacontable = models.ForeignKey(Mcuentas, db_column='CtaContable', blank=True, null=True, on_delete=models.CASCADE)
    sujetoretencion = models.CharField(db_column='SujetoRetencion', max_length=2, blank=True, null=True)
    ctagasto = models.CharField(db_column='CtaGasto', max_length=10, blank=True, null=True)
    nombrenegocio = models.CharField(db_column='NombreNegocio', max_length=200, blank=True, null=True)
    postal = models.CharField(db_column='Postal', max_length=10, blank=True, null=True)
    fechacrea = models.DateField(db_column='FechaCrea', blank=True, null=True)
    fechamodifica = models.DateField(db_column='FechaModifica', blank=True, null=True)
    agenteret = models.CharField(db_column='AgenteRet', max_length=2, blank=True, null=True)
    propi1 = models.CharField(db_column='Propi1', max_length=100, blank=True, null=True)
    propi2 = models.CharField(db_column='Propi2', max_length=100, blank=True, null=True)
    propi3 = models.CharField(db_column='Propi3', max_length=100, blank=True, null=True)
    propi4 = models.CharField(db_column='Propi4', max_length=100, blank=True, null=True)
    propi5 = models.CharField(db_column='Propi5', max_length=100, blank=True, null=True)
    propi6 = models.CharField(db_column='Propi6', max_length=100, blank=True, null=True)
    propi7 = models.CharField(db_column='Propi7', max_length=100, blank=True, null=True)
    propi8 = models.CharField(db_column='Propi8', max_length=100, blank=True, null=True)
    propi9 = models.CharField(db_column='Propi9', max_length=100, blank=True, null=True)
    propi10 = models.CharField(db_column='Propi10', max_length=100, blank=True, null=True)
    dpi = models.CharField(max_length=20, blank=True, null=True)
    fecha = models.DateField(db_column='Fecha', blank=True, null=True)
    idpaciente = models.CharField(db_column='IdPaciente', max_length=20, blank=True, null=True)
    dirnegocio = models.CharField(db_column='DirNegocio', max_length=100, blank=True, null=True)
    incoterm = models.CharField(max_length=3, blank=True, null=True)

    def __str__(self):
        return self.nombresocio
