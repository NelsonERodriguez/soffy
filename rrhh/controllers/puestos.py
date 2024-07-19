# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from rrhh.models import Puestos, Departamentos
from rrhh.forms import PuestosForm
from core.functions import set_notification


@login_required(login_url="/login/")
def index(request):
    puestos = Puestos.objects.all()
    collection = {
        'puestos': puestos,
    }

    return render(request, 'puestos/puestos.html', collection)


@login_required(login_url="/login/")
def create(request):
    departamentos = Departamentos.objects.filter(activo=True)
    if request.method == 'POST':
        form = PuestosForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            puestos = Puestos.objects.create(
                nombre = data['nombre'],
                departamento_id = data['departamento'].id,
                activo = data['activo'],
            )
            set_notification(request, True, 'Registro grabado.', 'add_alert', 'success')

            return redirect('rrhh-puestos')

        else:
            set_notification(request, True, 'Registro no grabado.', 'warning', 'danger')

    else:
        form = PuestosForm()
    
    collection = {
        "form": form,
        'departamentos': departamentos
    }
    return render(request, 'puestos/puestos_create.html', collection)


@login_required(login_url="/login/")
def edit(request, pk):
    puesto = Puestos.objects.get(id=pk)
    departamentos = Departamentos.objects.filter(activo=True)

    if request.method == 'POST':
        form = PuestosForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            puesto.nombre = data['nombre']
            puesto.departamento_id = data['departamento'].id
            puesto.activo = data['activo']
            puesto.save()

            set_notification(request, True, 'Registro actualizado.', 'add_alert', 'success')
            return redirect('rrhh-puestos')
        else:
            set_notification(request, True, 'Registro no actualizado.', 'warning', 'danger')

    collection = {
        "form": puesto,
        'departamentos': departamentos,
    }
    return render(request, 'puestos/puestos_edit.html', collection)


@login_required(login_url="/login/")
def delete(request, pk):
    Puestos.objects.get(id=pk).delete()
    set_notification(request, True, 'Registro eliminado.', 'add_alert', 'success')
    return redirect('rrhh-puestos')
