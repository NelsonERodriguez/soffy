from django.db import models

from contabilidad.models import Mccos, Mcuentas
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
    todas = models.DecimalField(db_column='Todas', max_digits=1, decimal_places=0, blank=True, null=True)
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
