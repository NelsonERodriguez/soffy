from django import forms
from presupuestos.models import Departamentos as Departamentos_presupuestos
from core.models import Empresas
from user_auth.models import User
from rrhh.models import Departamentos, Puestos, Solicitud_vacaciones


# Create your models here.
class DepartamentosForm(forms.Form):
    nombre = forms.CharField(max_length=255, required=True)
    activo = forms.BooleanField(required=False)
    departamento_presupuesto = forms.ModelChoiceField(Departamentos_presupuestos.objects.filter(activo=True),
                                                      required=False)


class PuestosForm(forms.Form):
    nombre = forms.CharField(max_length=255, required=True)
    departamento = forms.ModelChoiceField(Departamentos.objects.filter(activo=True))
    activo = forms.BooleanField(required=False)


class UsersConfiguracionForm(forms.Form):
    user = forms.ModelChoiceField(User.objects.filter(active=True))
    departamento = forms.ModelChoiceField(Departamentos.objects.filter(activo=True))
    puesto = forms.ModelChoiceField(Puestos.objects.filter(activo=True))
    user_jefe = forms.ModelChoiceField(User.objects.filter(active=True))


class Solicitud_vacaciones_form(forms.Form):
    usuario = forms.ModelChoiceField(User.objects.filter(active=True))
    empresa = forms.ModelChoiceField(Empresas.objects.filter(activo=True))
    cantidad_dias = forms.IntegerField(required=True)
    vacaciones_tomadas = forms.BooleanField(required=False)
    comentarios_usuario = forms.CharField(max_length=255, required=False)
    comentarios_jefe = forms.CharField(max_length=255, required=False)


class Solicitud_vacaciones_detalle_form(forms.Form):
    solicitud = forms.ModelChoiceField(Solicitud_vacaciones.objects.all())
    fecha = forms.DateTimeField()
    periodo = forms.CharField(required=False)


class Empleados_suspensiones_form(forms.Form):
    empleado = forms.CharField(max_length=255, required=True)
    activo = forms.BooleanField(required=True)
    estado = forms.CharField(max_length=50, required=True)
    fecha_inicio = forms.DateTimeField()
    fecha_regreso = forms.DateTimeField()