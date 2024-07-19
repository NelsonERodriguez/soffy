# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.models import Localidades, Empresas
from core.forms import LocalidadesForm


@login_required(login_url="/login/")
def index(request):
    localidades = Localidades.objects.all()
    return render(request, 'localidades/localidades.html', {"localidades": localidades})


@login_required(login_url="/login/")
def create(request):
    empresas = Empresas.objects.filter(activo=True)
    if request.method == 'POST':
        form = LocalidadesForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            localidades = Localidades.objects.create()
            save(localidades, data)
            return redirect('core-localidades')
    else:
        form = LocalidadesForm()

    return render(request, 'localidades/localidades_create.html', {"form": form, "empresas": empresas})


@login_required(login_url="/login/")
def edit(request, pk):
    localidades = Localidades.objects.get(id=pk)
    empresas = Empresas.objects.filter(activo=True)
    if request.method == 'POST':
        form = LocalidadesForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            save(localidades, data)
            return redirect('core-localidades')

    return render(request, 'localidades/localidades_edit.html', {"form": localidades, "empresas": empresas})


def save(localidades, data):
    localidades.empresa_id = data['empresa']
    localidades.nombre = data['nombre']
    localidades.codigo = data['codigo']
    localidades.direccion = data['direccion']
    localidades.telefono = data['telefono']
    localidades.activo = data['activo']
    localidades.save()


@login_required(login_url="/login/")
def delete(request, pk):
    Localidades.objects.get(id=pk).delete()
    return redirect('core-localidades')
