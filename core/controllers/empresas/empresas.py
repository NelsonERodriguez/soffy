# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.models import Empresas
from core.forms import EmpresasForm


@login_required(login_url="/login/")
def index(request):
    empresas = Empresas.objects.all()
    bool_add = request.user.has_perm('core.add_empresas')
    bool_view = request.user.has_perm('core.view_empresas')

    return render(request, 'empresas/empresas.html', {"empresas": empresas, "bool_add": bool_add,
                                                      "bool_view": bool_view})


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = EmpresasForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            empresas = Empresas.objects.create()
            save(empresas, data)
            return redirect('core-empresas')
    else:
        form = EmpresasForm()

    return render(request, 'empresas/empresas_create.html', {"form": form})


@login_required(login_url="/login/")
def edit(request, pk):
    empresa = Empresas.objects.get(id=pk)
    bool_change = request.user.has_perm('core.change_empresas')
    bool_delete = request.user.has_perm('core.delete_empresas')

    if request.method == 'POST':
        form = EmpresasForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            save(empresa, data)
            return redirect('core-empresas')

    return render(request, 'empresas/empresas_edit.html', {"form": empresa, "bool_change": bool_change,
                                                           "bool_delete": bool_delete})


def save(empresa, data):
    empresa.nombre = data['nombre']
    empresa.codigo = data['codigo']
    empresa.nit = data['nit']
    empresa.short_name = data['short_name']
    empresa.direccion = data['direccion']
    empresa.telefono = data['telefono']
    empresa.activo = data['activo']
    empresa.email = data['email']
    empresa.direccion_comercial = data['direccion_comercial']
    empresa.nombre_comercial = data['nombre_comercial']
    empresa.fel = data['fel']
    empresa.usuario = data['usuario']
    empresa.apikey = data['apikey']
    empresa.save()


@login_required(login_url="/login/")
def delete(request, pk):
    Empresas.objects.get(id=pk).delete()
    return redirect('core-empresas')
