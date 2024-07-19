# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from rrhh.models import Puestos, Departamentos, Users_configuracion as Empleados_puestos
from rrhh.forms import UsersConfiguracionForm as Empleados_puestos_form
from core.functions import set_notification
from user_auth.models import User


@login_required(login_url="/login/")
def index(request):
    empleados = Empleados_puestos.objects.all()
    collection = {
        'empleados': empleados,
    }

    return render(request, 'empleados_puestos/empleados_puestos.html', collection)


@login_required(login_url="/login/")
def create(request):
    departamentos = Departamentos.objects.filter(activo=True)
    usuarios = User.objects.all()
    puestos = Puestos.objects.filter(activo=True)
    if request.method == 'POST':
        form = Empleados_puestos_form(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            empleados = Empleados_puestos.objects.create(
                user_id = data['user'].id,
                departamento_id = data['departamento'].id,
                puesto_id = data['puesto'].id,
                user_jefe_id = data['user_jefe'].id,
            )
            set_notification(request, True, 'Registro grabado.', 'add_alert', 'success')

            return redirect('rrhh-empleados_puestos')

        else:
            set_notification(request, True, 'Registro no grabado.', 'warning', 'danger')

    else:
        form = Empleados_puestos_form()
    
    collection = {
        "form": form,
        'departamentos': departamentos,
        'usuarios': usuarios,
        'puestos': puestos
    }
    return render(request, 'empleados_puestos/empleados_puestos_create.html', collection)


@login_required(login_url="/login/")
def edit(request, pk):
    empleados_puestos = Empleados_puestos.objects.get(id=pk)
    departamentos = Departamentos.objects.filter(activo=True)
    usuarios = User.objects.all()
    puestos = Puestos.objects.filter(activo=True)

    if request.method == 'POST':
        form = PuestosForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            empleados_puestos.user_id = data['user'].id
            empleados_puestos.departamento_id = data['departamento'].id
            empleados_puestos.puesto_id = data['puesto'].id
            empleados_puestos.user_jefe_id = data['user_jefe'].id
            empleados_puestos.save()

            set_notification(request, True, 'Registro actualizado.', 'add_alert', 'success')
            return redirect('rrhh-empleados_puestos')
        else:
            set_notification(request, True, 'Registro no actualizado.', 'warning', 'danger')

    collection = {
        "form": empleados_puestos,
        'departamentos': departamentos,
        'usuarios': usuarios,
        'puestos': puestos
    }
    return render(request, 'empleados_puestos/empleados_puestos_edit.html', collection)


@login_required(login_url="/login/")
def delete(request, pk):
    Empleados_puestos.objects.get(id=pk).delete()
    set_notification(request, True, 'Registro eliminado.', 'add_alert', 'success')
    return redirect('rrhh-empleados_puestos')
