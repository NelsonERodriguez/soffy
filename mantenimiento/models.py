from django.db import models



class mempresa(models.Model):
    nombreempresa = models.CharField(max_length=100, blank=True, null=True)  # Field name made lowercase.
    direccion = models.CharField(max_length=200, blank=True, null=True)  # Field name made lowercase.
    telefono = models.CharField(max_length=50, blank=True, null=True)  # Field name made lowercase.
    nitempresa = models.CharField(max_length=20, blank=True, null=True)  # Field name made lowercase.
    cloud = models.IntegerField(blank=True, null=True)  # Field name made lowercase.
    logo = models.CharField(max_length=200, blank=True, null=True)  # Field name made lowercase.
    ctaclientes = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    tasausd = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)  # Field name made lowercase.
    ivatasa = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # Field name made lowercase.ctaiva = models.CharField('CtaIva', max_length=10, blank=True, null=True)  # Field name made lowercase.
    ctaret = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    ctacxp = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    ctaxliq = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    ctaivaxpag = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    ctaexec = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    ctautilidades = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    ctaperdidas = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    usarlector = models.SmallIntegerField(blank=True, null=True)  # Field name made lowercase.
    rolempresa = models.SmallIntegerField(blank=True, null=True)  # Field name made lowercase.
    manejainv = models.SmallIntegerField(blank=True, null=True)  # Field name made lowercase.
    usaconta = models.CharField(max_length=2, blank=True, null=True)  # Field name made lowercase.
    moneda = models.CharField(max_length=3, blank=True, null=True)  # Field name made lowercase.
    tipodocto = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    regimen = models.CharField(max_length=3, blank=True, null=True)  # Field name made lowercase.
    correoemisor = models.CharField(max_length=200, blank=True, null=True)  # Field name made lowercase.
    postal = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    pais = models.CharField(max_length=5, blank=True, null=True)  # Field name made lowercase.
    municipio = models.CharField(max_length=30, blank=True, null=True)  # Field name made lowercase.
    departamento = models.CharField(max_length=30, blank=True, null=True)  # Field name made lowercase.
    preciomanual = models.SmallIntegerField(blank=True, null=True)  # Field name made lowercase.
    agretiva = models.CharField(max_length=2, blank=True, null=True)  # Field name made lowercase.
    razonsocial = models.CharField(max_length=100, blank=True, null=True)  # Field name made lowercase.
    dirsocial = models.CharField(max_length=100, blank=True, null=True)  # Field name made lowercase.
    ctaidpimp = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    usafel = models.CharField(max_length=2, blank=True, null=True)  # Field name made lowercase.
    ctaretiva = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    replegal = models.CharField(max_length=200, blank=True, null=True)  # Field name made lowercase.
    contadorgeneral = models.CharField(max_length=200, blank=True, null=True)  # Field name made lowercase.
    certificacion = models.CharField(max_length=400, blank=True, null=True)  # Field name made lowercase.
    lineasfac = models.SmallIntegerField(blank=True, null=True)  # Field name made lowercase.
    metodoimporta = models.SmallIntegerField(blank=True, null=True)  # Field name made lowercase.
    ctaivapgtr = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    ctaivagasto = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    codexport = models.CharField(max_length=15, blank=True, null=True)  # Field name made lowercase.
    idbodega = models.SmallIntegerField(blank=True, null=True)  # Field name made lowercase.
    idbodega2 = models.SmallIntegerField(blank=True, null=True)  # Field name made lowercase.
    descripcion = models.DecimalField(max_digits=1, decimal_places=0, blank=True, null=True)  # Field name made lowercase.
    noestable = models.DecimalField(max_digits=3, decimal_places=0, blank=True, null=True)  # Field name made lowercase.
    ctaefectivo = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    ctatransfer = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    ctaebanco1 = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    ctaebanco2 = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    certifica = models.CharField(max_length=2, blank=True, null=True)  # Field name made lowercase.
    ctaperygan = models.CharField(max_length=10, blank=True, null=True)  # Field name made lowercase.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)



    