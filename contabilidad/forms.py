from django import forms

from contabilidad.models import Mgrupoitm, Mcuentas, Mccos, Mpresu01


class MccosForm(forms.Form):
    idccos = forms.CharField(max_length=50, required=True)
    ccosnombre = forms.CharField(max_length=100, required=True)
    codccos = forms.CharField(max_length=10, required=False)
    dim = forms.DecimalField(max_digits=1, decimal_places=0, required=True)
    activo = forms.BooleanField(required=False)


class MgrupoitmForm(forms.Form):
    codigogrupo = forms.CharField(max_length=10, required=True)
    grupo = forms.CharField(max_length=50, required=True)
    ctaingresos = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                         required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                         empty_label='Cta Ingresos')
    ctainventario = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                           required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                           empty_label='Cta Inventario')
    ctainventariorp = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                             required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                             empty_label='Cta Inventariop RP')
    ctacostovta = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                         required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                         empty_label='Cta Costo VTA')
    ctaennofac = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                        required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                        empty_label='Cta Enno Fac')
    ctadevinv = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                       required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                       empty_label='Cta De Inv')
    ctadevventa = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                         required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                         empty_label='Cta Dev Venta')
    almacen = forms.IntegerField(required=False, max_value=32767)
    ctacostofab = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                         required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                         empty_label='Cta Costo Fab')
    ctainventario2 = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                            required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                            empty_label='Cta Inventario2')
    ctainvtran = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                        required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                        empty_label='Cta Inv Tran')
    activo = forms.BooleanField(required=False)


class McuentasForm(forms.Form):
    ctacontable = forms.CharField(max_length=10, required=True)
    ctanombre = forms.CharField(required=True, max_length=100)
    ctanombre2 = forms.CharField(required=False, max_length=100)
    EFECTO_CHOICES = (
        ("S", "Suma"),
        ("R", "Resta"),
    )
    efecto = forms.ChoiceField(choices=EFECTO_CHOICES, required=True,
                               widget=forms.Select(attrs={'class': 'form-control'}))
    NIVEL_CHOICES = (
        ("0", "0"),
        ("1", "1"),
        ("2", "2"),
        ("3", "3"),
        ("4", "4"),
        ("5", "5"),
        ("6", "6"),
        ("7", "7"),
        ("8", "8"),
        ("9", "9"),
    )
    nivel = forms.ChoiceField(choices=NIVEL_CHOICES, required=True,
                              widget=forms.Select(attrs={'class': 'form-control'}))
    referencia = forms.CharField(max_length=10, required=False)
    MONEDA_CHOICES = (
        ("QTZ", "QTZ"),
    )
    moneda = forms.ChoiceField(choices=MONEDA_CHOICES, required=True,
                               widget=forms.Select(attrs={'class': 'form-control'}))
    grupo = forms.ModelChoiceField(queryset=Mgrupoitm.objects.filter(activo=True), to_field_name='id',
                                   required=True, widget=forms.Select(attrs={'class': 'form-control'}),
                                   empty_label='Grupo')
    ctapadre = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id', required=False,
                                      widget=forms.Select(attrs={'class': 'form-control'}), empty_label='Cuenta padre')
    mccos = forms.ModelChoiceField(queryset=Mccos.objects.filter(activo=True), to_field_name='id', required=False,
                                   widget=forms.Select(attrs={'class': 'form-control'}), empty_label='Centro de costo')
    activo = forms.BooleanField(required=False)


class Mpresu01Form(forms.Form):
    fecha = forms.DateField(required=True)
    descripcion = forms.CharField(max_length=100, required=True)


class Mpresu02Form(forms.Form):
    presu01 = forms.ModelChoiceField(queryset=Mpresu01.objects.all(), required=True, to_field_name='id',
                                     widget=forms.Select(attrs={'class': 'form-control'}))
    ctacontable = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), required=True,
                                         to_field_name='id', widget=forms.Select(attrs={'class': 'form-control'}))
    ene = forms.DecimalField(max_digits=18, decimal_places=2, required=False,
                             widget=forms.NumberInput(attrs={'class': 'form-control'}))
    feb = forms.DecimalField(max_digits=18, decimal_places=2, required=False,
                             widget=forms.NumberInput(attrs={'class': 'form-control'}))
    mar = forms.DecimalField(max_digits=18, decimal_places=2, required=False,
                             widget=forms.NumberInput(attrs={'class': 'form-control'}))
    abr = forms.DecimalField(max_digits=18, decimal_places=2, required=False,
                             widget=forms.NumberInput(attrs={'class': 'form-control'}))
    may = forms.DecimalField(max_digits=18, decimal_places=2, required=False,
                             widget=forms.NumberInput(attrs={'class': 'form-control'}))
    jun = forms.DecimalField(max_digits=18, decimal_places=2, required=False,
                             widget=forms.NumberInput(attrs={'class': 'form-control'}))
    jul = forms.DecimalField(max_digits=18, decimal_places=2, required=False,
                             widget=forms.NumberInput(attrs={'class': 'form-control'}))
    ago = forms.DecimalField(max_digits=18, decimal_places=2, required=False,
                             widget=forms.NumberInput(attrs={'class': 'form-control'}))
    sep = forms.DecimalField(max_digits=18, decimal_places=2, required=False,
                             widget=forms.NumberInput(attrs={'class': 'form-control'}))
    oct = forms.DecimalField(max_digits=18, decimal_places=2, required=False,
                             widget=forms.NumberInput(attrs={'class': 'form-control'}))
    nov = forms.DecimalField(max_digits=18, decimal_places=2, required=False,
                             widget=forms.NumberInput(attrs={'class': 'form-control'}))
    dic = forms.DecimalField(max_digits=18, decimal_places=2, required=False,
                             widget=forms.NumberInput(attrs={'class': 'form-control'}))
