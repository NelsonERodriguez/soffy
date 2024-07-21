from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import set_notification
from core.models import DepartamentosPaises as M, Paises
from core.forms import DepartamentosPaisesForm as F


@login_required(login_url="/login/")
def index(request):
    data = {
        "data": M.objects.all()
    }
    return render(request, 'departamentos_paises/departamentos_paises.html', data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = F(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            M.objects.create(
                nombre=data['nombre'],
                activo=data['activo'],
                pais_id=data['pais'].id
            )
            set_notification(request, True, "Guardado exitosamente.", "add_alert", "success")
            return redirect('core-departamentos')
    else:
        form = F()

    solo_uno = False
    paises = Paises.objects.filter(activo=True)
    if len(paises) == 1:
        solo_uno = True
    arr_return = {
        "form": form,
        "paises": paises,
        'solo_uno': solo_uno
    }
    return render(request, 'departamentos_paises/departamentos_paises_create.html', arr_return)


@login_required(login_url="/login/")
def edit(request, pk):
    modelo = M.objects.get(id=pk)
    bool_change = request.user.has_perm('core.change_departamentos')
    bool_delete = request.user.has_perm('core.delete_departamentos')

    if request.method == 'POST':
        form = F(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            modelo.nombre=data['nombre']
            modelo.activo=data['activo']
            modelo.pais_id=data['pais'].id
            modelo.save()
            set_notification(request, True, "Guardado exitosamente.", "add_alert", "success")
            return redirect('core-departamentos')

    solo_uno = False
    paises = Paises.objects.filter(activo=True)
    if len(paises) == 1:
        solo_uno = True
    data_return = {
        "form": modelo,
        "paises": paises,
        'solo_uno': solo_uno,
        "bool_change": bool_change,
        "bool_delete": bool_delete
    }
    return render(request, 'departamentos_paises/departamentos_paises_edit.html', data_return)


@login_required(login_url="/login/")
def delete(request, pk):
    data = M.objects.get(id=pk)
    data.activo = False
    data.save()
    set_notification(request, True, "Borrado exitosamente.", "add_alert", "success")
    return redirect('core-departamentos')
