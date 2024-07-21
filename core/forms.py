from django import forms
from .models import Empresas, Paises, DepartamentosPaises


class InterfazForm(forms.Form):
    app_label = forms.CharField(max_length=100, required=True)
    model = forms.CharField(max_length=100, required=True)
    modulo = forms.CharField(max_length=100, required=True)
    sub_modulo = forms.CharField(max_length=100, required=False)
    ventana = forms.CharField(max_length=100, required=True)
    link = forms.CharField(max_length=100, required=True)
    icono = forms.CharField(max_length=100, required=True)


class EmpresasForm(forms.Form):
    codigo = forms.CharField(max_length=60, required=False)
    nit = forms.CharField(max_length=255, required=True)
    nombre = forms.CharField(max_length=255, required=True)
    short_name = forms.CharField(max_length=255, required=False)
    direccion = forms.CharField(max_length=255, required=False)
    telefono = forms.CharField(max_length=255, required=False)
    activo = forms.BooleanField(required=False)
    email = forms.CharField(max_length=255, required=False)
    direccion_comercial = forms.CharField(max_length=255, required=False)
    nombre_comercial = forms.CharField(max_length=255, required=False)
    fel = forms.BooleanField(required=False)
    usuario = forms.CharField(max_length=255, required=False)
    apikey = forms.CharField(max_length=255, required=False)


class LocalidadesForm(forms.Form):
    empresa = forms.ModelChoiceField(queryset=Empresas.objects.filter(activo=True))
    codigo = forms.CharField(max_length=50, required=False)
    nombre = forms.CharField(max_length=255, required=True)
    direccion = forms.CharField(max_length=255, required=False)
    telefono = forms.CharField(max_length=255, required=False)
    activo = forms.BooleanField(required=False)


class PaisesForm(forms.Form):
    nombre = forms.CharField(max_length=100, required=True)
    activo = forms.BooleanField(required=False)
    prefijo_telefono = forms.CharField(max_length=8)


class DepartamentosPaisesForm(forms.Form):
    nombre = forms.CharField(max_length=100)
    activo = forms.BooleanField(required=False)
    pais = forms.ModelChoiceField(queryset=Paises.objects.filter(activo=True))


class MunicipiosDepForm(forms.Form):
    nombre = forms.CharField(max_length=100)
    activo = forms.BooleanField(required=False)
    departamento = forms.ModelChoiceField(queryset=DepartamentosPaises.objects.filter(activo=True))
