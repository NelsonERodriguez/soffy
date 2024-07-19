from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import set_notification
from tickets.models import Prioridad


@login_required(login_url="/login/")
def index(request):
	obj_prioridades = Prioridad.objects.all().order_by('orden')
	data = {
		'prioridades': obj_prioridades
	}
	
	return render(request, 'prioridades/prioridades.html', data)


@login_required(login_url="/login/")
def edit(request, pk):

	str_texto_titulo = "Editar" if pk > 0 else "Crear"

	prioridad = Prioridad.objects.filter(id=pk).first()

	int_key = prioridad.id if prioridad else 0

	data = {
		"id": int_key,
		"texto_titulo": str_texto_titulo,
		"prioridad": prioridad
	}

	return render(request, 'prioridades/prioridades_edit.html', data)


@login_required(login_url="/login/")
def save(request, pk):
	
	obj_prioridad = Prioridad.objects.filter(id=pk).first()

	nombre = request.POST.get("nombre", None) if len(request.POST.get("nombre")) > 0 else ''
	color = request.POST.get("color", None) if len(request.POST.get("color")) > 0 else ''
	orden = request.POST.get("orden", None) if len(request.POST.get("orden")) > 0 else 0
	orden = int(orden)
	activo = request.POST.get("activo", None) if len(request.POST.get("activo")) > 0 else 0
	activo = True if activo == '1' else False

	if obj_prioridad:
		obj_prioridad.nombre = nombre
		obj_prioridad.orden = orden
		obj_prioridad.color = color
		obj_prioridad.activo = activo

		obj_prioridad.save()
	else:
		Prioridad.objects.create(
			nombre=nombre,
			orden=orden,
			color=color,
			activo=activo
		)

	set_notification(request, True, "Prioridad guardada exitosamente.", "add_alert", "success")

	return redirect("tickets-prioridades")
