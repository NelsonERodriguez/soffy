# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from rrhh.models import Departamentos
from rrhh.forms import DepartamentosForm
from presupuestos.models import Departamentos as Departamentos_presupuestos


@login_required(login_url="/login/")
def index(request):
    departamentos = Departamentos.objects.all()
    return render(request, 'departamentos/rrhh_departamentos.html', {"departamentos": departamentos})


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = DepartamentosForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            departamentos = Departamentos.objects.create()
            save(departamentos, data)
            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Registro grabado."
            request.session['notificacion_icon'] = "add_alert"
            request.session['notificacion_color'] = "success"

            return redirect('rrhh-departamentos')

        else:
            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Registro no grabado."
            request.session['notificacion_icon'] = "warning"
            request.session['notificacion_color'] = "danger"

    else:
        form = DepartamentosForm()

    return render(request, 'departamentos/rrhh_departamentos_create.html',
                  {"form": form, "Departamentos_presupuestos": Departamentos_presupuestos})


@login_required(login_url="/login/")
def edit(request, pk):
    return redirect('rrhh-departamentos')


@login_required(login_url="/login/")
def delete(request, pk):
    return redirect('rrhh-departamentos')


def save(departamentos, data):
    departamentos.nombre = data['nombre']
    departamentos.activo = data['activo']
    departamentos.save()

