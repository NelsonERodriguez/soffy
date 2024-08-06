from django.db import models

from contabilidad.models import Mcuentas
from mantenimiento.models import Msocios, Mbancos, Mmoneda


class Mcuadratica(models.Model):
    descri = models.CharField(db_column='Descri', max_length=100, blank=True, null=True)
    ctacontable = models.ForeignKey(Mcuentas, db_column='CtaContable', max_length=10, blank=True, null=True,
                                    on_delete=models.CASCADE)

    def __str__(self):
        return self.descri


class Tpago01(models.Model):
    serie = models.CharField(db_column='Serie', max_length=20, blank=True, null=True)
    numero = models.IntegerField(db_column='Numero', blank=True, null=True)
    idsocio = models.ForeignKey(Msocios, db_column='IdSocio', blank=True, null=True, on_delete=models.CASCADE)
    fechapago = models.DateField(db_column='FechaPago', blank=True, null=True)
    fechasys = models.DateField(db_column='FechaSys', blank=True, null=True)
    fechaconta = models.DateField(db_column='FechaConta', blank=True, null=True)
    tipopago = models.CharField(db_column='TipoPago', max_length=20, blank=True, null=True)
    ref1 = models.CharField(db_column='Ref1', max_length=20, blank=True, null=True)
    ref2 = models.CharField(db_column='Ref2', max_length=20, blank=True, null=True)
    cueban = models.ForeignKey(Mbancos, db_column='Cueban', blank=True, null=True, on_delete=models.CASCADE)
    comentario = models.CharField(db_column='Comentario', max_length=400, blank=True, null=True)
    montorecibo = models.DecimalField(db_column='MontoRecibo', max_digits=18, decimal_places=2, blank=True, null=True)
    status = models.BooleanField(db_column='Status', blank=True, null=True)
    partida = models.IntegerField(blank=True, null=True)
    letras = models.CharField(db_column='Letras', max_length=200, blank=True, null=True)
    pagafacturas = models.BooleanField(db_column='PagaFacturas', blank=True, null=True)
    ctacontableban = models.ForeignKey(Mcuentas, db_column='CtaContableBan', blank=True, null=True,
                                       on_delete=models.CASCADE)
    tcusd = models.DecimalField(db_column='TcUsd', max_digits=18, decimal_places=6, blank=True, null=True)
    moneda = models.ForeignKey(Mmoneda, db_column='Moneda', max_length=3, blank=True, null=True,
                               on_delete=models.CASCADE)
    login = models.CharField(db_column='Login', max_length=20, blank=True, null=True)
    horasys = models.TimeField(db_column='HoraSys', blank=True, null=True)
    nonegociable = models.BooleanField(db_column='NoNegociable', blank=True, null=True)

    def __str__(self):
        return self.numero


class Tpago02(models.Model):
    tpago01 = models.ForeignKey(Tpago01, db_column='Tpago01', on_delete=models.CASCADE)
    baseentry = models.IntegerField(db_column='BaseEntry', blank=True, null=True)
    serie = models.CharField(db_column='Serie', max_length=20, blank=True, null=True)
    numero = models.CharField(db_column='Numero', max_length=20, blank=True, null=True)
    ctacontable = models.ForeignKey(Mcuentas, db_column='CtaContable', max_length=10, blank=True, null=True,
                                    on_delete=models.CASCADE)
    fecha = models.DateField(db_column='Fecha', blank=True, null=True)
    doctotal = models.DecimalField(db_column='DocTotal', max_digits=18, decimal_places=2, blank=True, null=True)
    abonos = models.DecimalField(db_column='Abonos', max_digits=18, decimal_places=2, blank=True, null=True)
    pago = models.DecimalField(db_column='Pago', max_digits=18, decimal_places=2, blank=True, null=True)
    tcusd = models.DecimalField(db_column='TcUsd', max_digits=18, decimal_places=6, blank=True, null=True)

    def __str__(self):
        return self.numero
