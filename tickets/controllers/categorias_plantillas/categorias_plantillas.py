from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import get_query, set_notification
from tickets.models import Plantilla_categoria


@login_required(login_url="/login/")
def index(request):
	obj_categorias = Plantilla_categoria.objects.all().order_by('orden')
	data = {
		'categorias': obj_categorias
	}
	
	return render(request, 'categorias_plantillas/categorias_plantillas.html', data)


@login_required(login_url="/login/")
def edit(request, pk):

	str_texto_titulo = "Editar" if pk > 0 else "Crear"

	categoria = Plantilla_categoria.objects.filter(id=pk).first()

	int_key = categoria.id if categoria else 0

	data = {
		"id": int_key,
		"texto_titulo": str_texto_titulo,
		"categoria" : categoria
	}

	return render(request, 'categorias_plantillas/categorias_plantillas_edit.html', data)


@login_required(login_url="/login/")
def save(request, pk):
	
	obj_categoria = Plantilla_categoria.objects.filter(id=pk).first()

	nombre = request.POST.get("nombre", None) if len(request.POST.get("nombre")) > 0 else ''
	orden = request.POST.get("orden", None) if len(request.POST.get("orden")) > 0 else 0
	orden = int(orden)
	activo = request.POST.get("activo", None) if len(request.POST.get("activo")) > 0 else 0
	activo =  True if activo == '1' else False

	if obj_categoria:
		obj_categoria.nombre=nombre
		obj_categoria.orden=orden
		obj_categoria.activo=activo

		obj_categoria.save()
	else:
		Plantilla_categoria.objects.create(
			nombre=nombre,
			orden=orden,
			activo=activo
		)

	set_notification(request, True, "Categoría guardada exitosamente.", "add_alert", "success")

	return redirect("tickets-categorias_plantillas")