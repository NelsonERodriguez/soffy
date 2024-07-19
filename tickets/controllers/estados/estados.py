from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import set_notification
from tickets.models import Estado


@login_required(login_url="/login/")
def index(request):
	obj_estados = Estado.objects.all().order_by('orden')
	data = {
		'estados': obj_estados
	}
	
	return render(request, 'estados/estados.html', data)


@login_required(login_url="/login/")
def edit(request, pk):

	str_texto_titulo = "Editar" if pk > 0 else "Crear"

	estado = Estado.objects.filter(id=pk).first()

	int_key = estado.id if estado else 0

	data = {
		"id": int_key,
		"texto_titulo": str_texto_titulo,
		"estado": estado
	}

	return render(request, 'estados/estados_edit.html', data)


@login_required(login_url="/login/")
def save(request, pk):
	
	obj_estado = Estado.objects.filter(id=pk).first()

	nombre = request.POST.get("nombre", None) if len(request.POST.get("nombre")) > 0 else ''
	color = request.POST.get("color", None) if len(request.POST.get("color")) > 0 else ''
	orden = request.POST.get("orden", None) if len(request.POST.get("orden")) > 0 else 0
	orden = int(orden)
	activo = request.POST.get("activo", None) if len(request.POST.get("activo")) > 0 else 0
	activo = True if activo == '1' else False

	if obj_estado:
		obj_estado.nombre = nombre
		obj_estado.color = color
		obj_estado.orden = orden
		obj_estado.activo = activo

		obj_estado.save()
	else:
		Estado.objects.create(
			nombre=nombre,
			color=color,
			orden=orden,
			activo=activo
		)

	set_notification(request, True, "Estado guardado exitosamente.", "add_alert", "success")

	return redirect("tickets-estados")
