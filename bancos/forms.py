from django import forms

from bancos.models import Tpago01
from contabilidad.forms import Mcuentas
from mantenimiento.models import Msocios, Mbancos, Mmoneda


class McuadraticaForm(forms.Form):
    descri = forms.CharField(max_length=100, required=True)
    ctacontable = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                         required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                         empty_label='Cuenta contable')


class Tpago01Form(forms.Form):
    serie = forms.CharField(max_length=20, required=False)
    numero = forms.IntegerField(required=True)
    idsocio = forms.ModelChoiceField(queryset=Msocios.objects.filter(activo=True), to_field_name='id',
                                     required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                     empty_label='Paguese a')
    fechapago = forms.DateField(required=True)
    fechasys = forms.DateField(required=False)
    fechaconta = forms.DateField(required=True)
    TIPO_PAGO = (
        ("CHEQUE", "CHEQUE"),
        ("TRANSFERENCIA", "TRANSFERENCIA"),
    )
    tipopago = forms.ChoiceField(choices=TIPO_PAGO, required=True, widget=forms.Select(attrs={'class': 'form-control'}))
    ref1 = forms.CharField(max_length=20, required=False)
    ref2 = forms.CharField(max_length=20, required=False)
    cueban = forms.ModelChoiceField(queryset=Mbancos.objects.all(), to_field_name='id',
                                    required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                    empty_label='Cuenta Banco')
    comentario = forms.CharField(max_length=400, required=False)
    montorecibo = forms.DecimalField(max_digits=18, decimal_places=2, required=True)
    status = forms.BooleanField(required=False)
    partida = forms.IntegerField(required=False)
    letras = forms.CharField(max_length=200, required=False)
    pagafacturas = forms.BooleanField(required=False)
    ctacontableban = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                            required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                            empty_label='Cuenta contable banco')
    tcusd = forms.DecimalField(max_digits=18, decimal_places=6, required=True)
    moneda = forms.ModelChoiceField(queryset=Mmoneda.objects.all(), to_field_name='id',
                                    required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                    empty_label='Moneda')
    login = forms.CharField(max_length=20, required=False)
    horasys = forms.TimeField(required=False)
    nonegociable = forms.BooleanField(required=False)


class Tpago02Form(forms.Form):
    tpago01 = forms.ModelChoiceField(Tpago01.objects.all(), required=True,
                                     widget=forms.Select(attrs={'class': 'form-control'}),
                                     empty_label='Pago proveedor')
    baseentry = forms.IntegerField(required=False)
    serie = forms.CharField(max_length=20, required=True)
    numero = forms.CharField(max_length=20, required=True)
    ctacontable = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                         required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                         empty_label='Cuenta contable')
    fecha = forms.DateField(required=False)
    doctotal = forms.DecimalField(max_digits=18, decimal_places=2, required=True)
    abonos = forms.DecimalField(max_digits=18, decimal_places=2, required=False)
    pago = forms.DecimalField(max_digits=18, decimal_places=2, required=False)
    tcusd = forms.DecimalField(max_digits=18, decimal_places=6, required=False)
