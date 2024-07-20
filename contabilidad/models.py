from django.db import models


class Mccos(models.Model):
    idccos = models.CharField(db_column='IdCcos', unique=True, max_length=50)
    ccosnombre = models.CharField(db_column='CcosNombre', max_length=100)
    codccos = models.CharField(db_column='CodCcos', max_length=10, blank=True, null=True)
    dim = models.DecimalField(db_column='Dim', max_digits=1, decimal_places=0)
    activo = models.BooleanField(db_column='Activo', default=True)

    def __str__(self):
        return f"{self.idccos} - {self.ccosnombre}"


class Mgrupoitm(models.Model):
    codigogrupo = models.CharField(db_column='CodigoGrupo', max_length=10, unique=True, blank=True, null=True)
    grupo = models.CharField(db_column='Grupo', max_length=50, blank=True, null=True)
    ctaingresos = models.ForeignKey('Mcuentas', db_column='CtaIngresos', max_length=10, blank=True, null=True,
                                    on_delete=models.CASCADE, related_name='ctaingresos')
    ctainventario = models.ForeignKey('Mcuentas', db_column='CtaInventario', max_length=10, blank=True, null=True,
                                      on_delete=models.CASCADE, related_name='ctainventario')
    ctainventariorp = models.ForeignKey('Mcuentas', db_column='CtaInventarioRp', max_length=10, blank=True, null=True,
                                        on_delete=models.CASCADE, related_name='ctaingresorp')
    ctacostovta = models.ForeignKey('Mcuentas', db_column='CtaCostoVta', max_length=10, blank=True, null=True,
                                    on_delete=models.CASCADE, related_name='ctacostovta')
    ctaennofac = models.ForeignKey('Mcuentas', db_column='CtaEnnofac', max_length=10, blank=True, null=True,
                                   on_delete=models.CASCADE, related_name='ctaennofac')
    ctadevinv = models.ForeignKey('Mcuentas', db_column='CtaDevInv', max_length=10, blank=True, null=True,
                                  on_delete=models.CASCADE, related_name='ctadevinv')
    ctadevventa = models.ForeignKey('Mcuentas', db_column='CtaDevVenta', max_length=10, blank=True, null=True,
                                    on_delete=models.CASCADE, related_name='ctadevventa')
    almacen = models.SmallIntegerField(db_column='Almacen', blank=True, null=True)
    ctacostofab = models.ForeignKey('Mcuentas', db_column='CtaCostoFab', max_length=10, blank=True, null=True,
                                    on_delete=models.CASCADE, related_name='ctacostofab')
    ctainventario2 = models.ForeignKey('Mcuentas', db_column='CtaInventario2', max_length=10, blank=True, null=True,
                                       on_delete=models.CASCADE, related_name='ctainventario2')
    ctainvtran = models.ForeignKey('Mcuentas', db_column='CtaInvTran', max_length=10, blank=True, null=True,
                                   on_delete=models.CASCADE, related_name='ctainvtran')
    activo = models.BooleanField(db_column='Activo', default=True)

    def __str__(self):
        return f"{self.codigogrupo} - {self.grupo}"


class Mcuentas(models.Model):
    ctacontable = models.CharField(db_column='CtaContable', unique=True, max_length=10)
    ctanombre = models.CharField(db_column='CtaNombre', max_length=100, blank=True, null=True)
    ctanombre2 = models.CharField(db_column='CtaNombre2', max_length=100, blank=True, null=True)
    efecto = models.CharField(db_column='Efecto', max_length=1, blank=True, null=True)
    nivel = models.CharField(db_column='Nivel', max_length=1, blank=True, null=True)
    referencia = models.CharField(db_column='Referencia', max_length=10, blank=True, null=True)
    moneda = models.CharField(db_column='Moneda', max_length=3, blank=True, null=True)
    grupo = models.ForeignKey(Mgrupoitm, db_column='Grupo', blank=True, null=True, on_delete=models.SET_NULL)
    ctapadre = models.ForeignKey('self', db_column='CtaPadre', blank=True, null=True, on_delete=models.SET_NULL)
    mccos = models.ForeignKey(Mccos, max_length=10, blank=True, null=True, on_delete=models.SET_NULL)
    activo = models.BooleanField(db_column='Activo', default=True)

    def __str__(self):
        return f"{self.ctacontable} - {self.ctanombre}"


class Mpresu01(models.Model):
    fecha = models.DateField(db_column='Fecha', blank=True, null=True)
    descripcion = models.CharField(db_column='Descripcion', max_length=100, blank=True, null=True)

    def __str__(self):
        return self.descripcion


class Mpresu02(models.Model):
    presu01 = models.ForeignKey(Mpresu01, db_column='idPre', on_delete=models.CASCADE)
    ctacontable = models.ForeignKey(Mcuentas, db_column='CtaContable', on_delete=models.CASCADE)
    ene = models.DecimalField(db_column='Ene', max_digits=18, decimal_places=2, blank=True, null=True)
    feb = models.DecimalField(db_column='Feb', max_digits=18, decimal_places=2, blank=True, null=True)
    mar = models.DecimalField(db_column='Mar', max_digits=18, decimal_places=2, blank=True, null=True)
    abr = models.DecimalField(db_column='Abr', max_digits=18, decimal_places=2, blank=True, null=True)
    may = models.DecimalField(db_column='May', max_digits=18, decimal_places=2, blank=True, null=True)
    jun = models.DecimalField(db_column='Jun', max_digits=18, decimal_places=2, blank=True, null=True)
    jul = models.DecimalField(db_column='Jul', max_digits=18, decimal_places=2, blank=True, null=True)
    ago = models.DecimalField(db_column='Ago', max_digits=18, decimal_places=2, blank=True, null=True)
    sep = models.DecimalField(db_column='Sep', max_digits=18, decimal_places=2, blank=True, null=True)
    oct = models.DecimalField(db_column='Oct', max_digits=18, decimal_places=2, blank=True, null=True)
    nov = models.DecimalField(db_column='Nov', max_digits=18, decimal_places=2, blank=True, null=True)
    dic = models.DecimalField(db_column='Dic', max_digits=18, decimal_places=2, blank=True, null=True)
