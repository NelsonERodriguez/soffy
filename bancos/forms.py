from django import forms

from contabilidad.forms import Mcuentas


class McuadraticaForm(forms.Form):
    descri = forms.CharField(max_length=100, required=True)
    ctacontable = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                         required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                         empty_label='Cuenta contable')
