from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import set_notification
from core.models import Paises as M
from core.forms import PaisesForm as F


@login_required(login_url="/login/")
def index(request):
    data = {
        "data": M.objects.all()
    }
    return render(request, 'paises/paises.html', data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = F(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            M.objects.create(
                nombre=data['nombre'],
                activo=data['activo'],
                prefijo_telefono=data['prefijo_telefono']
            )
            set_notification(request, True, "Guardado exitosamente.", "add_alert", "success")
            return redirect('core-paises')
    else:
        form = F()
    return render(request, 'paises/paises_create.html', {"form": form})


@login_required(login_url="/login/")
def edit(request, pk):
    modelo = M.objects.get(id=pk)
    bool_change = request.user.has_perm('core.change_paises')
    bool_delete = request.user.has_perm('core.delete_paises')

    if request.method == 'POST':
        form = F(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            modelo.nombre=data['nombre']
            modelo.activo=data['activo']
            modelo.prefijo_telefono=data['prefijo_telefono']
            modelo.save()
            set_notification(request, True, "Guardado exitosamente.", "add_alert", "success")
            return redirect('core-paises')

    data_return = {
        "form": modelo,
        "bool_change": bool_change,
        "bool_delete": bool_delete
    }
    return render(request, 'paises/paises_edit.html', data_return)


@login_required(login_url="/login/")
def delete(request, pk):
    data = M.objects.get(id=pk)
    data.activo = False
    data.save()
    set_notification(request, True, "Borrado exitosamente.", "add_alert", "success")
    return redirect('core-paises')
