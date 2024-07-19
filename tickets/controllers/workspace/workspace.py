from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import set_notification
from tickets.models import Workspace
from core.models import Departamento


@login_required(login_url="/login/")
def index(request):
	obj_workspaces = Workspace.objects.all().order_by('orden')
	data = {
		'workspaces': obj_workspaces
	}
	
	return render(request, 'workspace/workspace.html', data)


@login_required(login_url="/login/")
def edit(request, pk):

	str_texto_titulo = "Editar" if pk > 0 else "Crear"

	workspace = Workspace.objects.filter(id=pk).first()

	int_key = workspace.id if workspace else 0
	departamentos = Departamento.objects.filter(activo=True)

	data = {
		"id": int_key,
		"texto_titulo": str_texto_titulo,
		"workspace": workspace,
		"departamentos": departamentos,
	}

	return render(request, 'workspace/workspace_edit.html', data)


@login_required(login_url="/login/")
def save(request, pk):
	
	obj_workspace = Workspace.objects.filter(id=pk).first()

	nombre = request.POST.get("nombre", '')
	orden = int(request.POST.get("orden", 0)) if len(request.POST.get("orden")) > 0 else 0
	activo = request.POST.get("activo", False)
	activo = True if activo else False
	departamento = request.POST.get('departamento', 0)
	color = request.POST.get('color', '')

	if obj_workspace:
		obj_workspace.nombre = nombre
		obj_workspace.orden = orden
		obj_workspace.departamento_id = departamento
		obj_workspace.color = color
		obj_workspace.activo = activo
		obj_workspace.user_create_id = request.user.id

		obj_workspace.save()

	else:
		Workspace.objects.create(
			nombre=nombre,
			orden=orden,
			departamento_id=departamento,
			color=color,
			activo=activo,
			user_create_id=request.user.id
		)

	set_notification(request, True, "Worksapce guardado exitosamente.", "add_alert", "success")

	return redirect("tickets-workspace")
