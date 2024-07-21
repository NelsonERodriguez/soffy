from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import set_notification
from core.models import MunicipiosDep as M, DepartamentosPaises
from core.forms import MunicipiosDepForm as F


@login_required(login_url="/login/")
def index(request):
    data = {
        "data": M.objects.all()
    }
    return render(request, 'municipios_dep/municipios_dep.html', data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = F(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            M.objects.create(
                nombre=data['nombre'],
                activo=data['activo'],
                departamento_id=data['departamento'].id
            )
            set_notification(request, True, "Guardado exitosamente.", "add_alert", "success")
            return redirect('core-municipios')
    else:
        form = F()

    solo_uno = False
    deptos = DepartamentosPaises.objects.filter(activo=True)
    if len(deptos) == 1:
        solo_uno = True
    arr_return = {
        "form": form,
        "departamentos": deptos,
        'solo_uno': solo_uno
    }
    return render(request, 'municipios_dep/municipios_dep_create.html', arr_return)


@login_required(login_url="/login/")
def edit(request, pk):
    modelo = M.objects.get(id=pk)
    bool_change = request.user.has_perm('core.change_municipios')
    bool_delete = request.user.has_perm('core.delete_municipios')

    if request.method == 'POST':
        form = F(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            modelo.nombre=data['nombre']
            modelo.activo=data['activo']
            modelo.departamento_id=data['departamento'].id
            modelo.save()
            set_notification(request, True, "Guardado exitosamente.", "add_alert", "success")
            return redirect('core-municipios')

    solo_uno = False
    deptos = DepartamentosPaises.objects.filter(activo=True)
    if len(deptos) == 1:
        solo_uno = True
    data_return = {
        "form": modelo,
        "departamentos": deptos,
        'solo_uno': solo_uno,
        "bool_change": bool_change,
        "bool_delete": bool_delete
    }
    return render(request, 'municipios_dep/municipios_dep_edit.html', data_return)


@login_required(login_url="/login/")
def delete(request, pk):
    data = M.objects.get(id=pk)
    data.activo = False
    data.save()
    set_notification(request, True, "Borrado exitosamente.", "add_alert", "success")
    return redirect('core-municipios')
