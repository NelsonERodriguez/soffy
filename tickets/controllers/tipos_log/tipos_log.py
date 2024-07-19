from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import set_notification
from tickets.models import Tipo_log


@login_required(login_url="/login/")
def index(request):
	obj_tipos_log = Tipo_log.objects.all().order_by('id')
	data = {
		'tipos_log': obj_tipos_log
	}
	
	return render(request, 'tipos_log/tipos_log.html', data)


@login_required(login_url="/login/")
def edit(request, pk):

	str_texto_titulo = "Editar" if pk > 0 else "Crear"

	tipo_log = Tipo_log.objects.filter(id=pk).first()

	int_key = tipo_log.id if tipo_log else 0

	data = {
		"id": int_key,
		"texto_titulo": str_texto_titulo,
		"tipo_log": tipo_log
	}

	return render(request, 'tipos_log/tipos_log_edit.html', data)


@login_required(login_url="/login/")
def save(request, pk):

	obj_tipo_log = Tipo_log.objects.filter(id=pk).first()

	nombre = request.POST.get("nombre", '')
	tabla = request.POST.get("tabla", '')
	identificador = request.POST.get("identificador", '')
	activo = 1 if request.POST.get("activo", None) else 0

	if obj_tipo_log:
		obj_tipo_log.nombre = nombre
		obj_tipo_log.tabla = tabla
		obj_tipo_log.identificador = identificador
		obj_tipo_log.activo = activo

		obj_tipo_log.save()
	else:
		Tipo_log.objects.create(
			nombre=nombre,
			tabla=tabla,
			identificador=identificador,
			activo=activo
		)

	set_notification(request, True, "Tipo de log guardado exitosamente.", "add_alert", "success")

	return redirect("tickets-tipos_log")
