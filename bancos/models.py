from django.db import models

from contabilidad.models import Mcuentas


class Mcuadratica(models.Model):
    descri = models.CharField(db_column='Descri', max_length=100, blank=True, null=True)
    ctacontable = models.ForeignKey(Mcuentas, db_column='CtaContable', max_length=10, blank=True, null=True,
                                    on_delete=models.CASCADE)

    def __str__(self):
        return self.descri
