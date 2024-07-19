from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import set_notification
from tickets.models import Agrupacion
from core.models import Departamento


@login_required(login_url="/login/")
def index(request):
	obj_agrupaciones = Agrupacion.objects.all().order_by('orden')
	data = {
		'agrupaciones': obj_agrupaciones
	}
	
	return render(request, 'agrupacion/agrupacion.html', data)


@login_required(login_url="/login/")
def edit(request, pk):

	str_texto_titulo = "Editar" if pk > 0 else "Crear"

	agrupacion = Agrupacion.objects.filter(id=pk).first()

	int_key = agrupacion.id if agrupacion else 0
	departamentos = Departamento.objects.filter(activo=True)

	data = {
		"id": int_key,
		"texto_titulo": str_texto_titulo,
		"agrupacion": agrupacion,
		"departamentos": departamentos,
	}

	return render(request, 'agrupacion/agrupacion_edit.html', data)


@login_required(login_url="/login/")
def save(request, pk):
	
	obj_agrupacion = Agrupacion.objects.filter(id=pk).first()

	nombre = request.POST.get("nombre", '')
	orden = int(request.POST.get("orden", 0)) if len(request.POST.get("orden")) > 0 else 0
	activo = request.POST.get("activo", False)
	activo = True if activo else False
	departamento = request.POST.get('departamento', 0)
	color = request.POST.get('color', '')

	if obj_agrupacion:
		obj_agrupacion.nombre = nombre
		obj_agrupacion.orden = orden
		obj_agrupacion.departamento_id = departamento
		obj_agrupacion.color = color
		obj_agrupacion.activo = activo

		obj_agrupacion.save()

	else:
		Agrupacion.objects.create(
			nombre=nombre,
			orden=orden,
			departamento_id=departamento,
			color=color,
			activo=activo
		)

	set_notification(request, True, "Agrupación guardado exitosamente.", "add_alert", "success")

	return redirect("tickets-agrupacion")
