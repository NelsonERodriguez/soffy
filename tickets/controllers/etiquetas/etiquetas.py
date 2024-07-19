from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import set_notification
from tickets.models import Etiqueta


@login_required(login_url="/login/")
def index(request):
	obj_etiquetas = Etiqueta.objects.all().order_by('id')
	data = {
		'etiquetas': obj_etiquetas
	}
	
	return render(request, 'etiquetas/etiquetas.html', data)


@login_required(login_url="/login/")
def edit(request, pk):

	str_texto_titulo = "Editar" if pk > 0 else "Crear"

	etiqueta = Etiqueta.objects.filter(id=pk).first()

	int_key = etiqueta.id if etiqueta else 0

	data = {
		"id": int_key,
		"texto_titulo": str_texto_titulo,
		"etiqueta": etiqueta
	}

	return render(request, 'etiquetas/etiquetas_edit.html', data)


@login_required(login_url="/login/")
def save(request, pk):
	
	obj_etiqueta = Etiqueta.objects.filter(id=pk).first()

	nombre = request.POST.get("nombre", None) if len(request.POST.get("nombre")) > 0 else ''
	activo = request.POST.get("activo", None) if len(request.POST.get("activo")) > 0 else 0
	activo = True if activo == '1' else False

	if obj_etiqueta:
		obj_etiqueta.nombre=nombre
		obj_etiqueta.activo=activo

		obj_etiqueta.save()
	else:
		Etiqueta.objects.create(
			nombre=nombre,
			activo=activo
		)

	set_notification(request, True, "Etiqueta guardada exitosamente.", "add_alert", "success")

	return redirect("tickets-etiquetas")
