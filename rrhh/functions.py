from collections import namedtuple
from user_auth.models import User
from rrhh.models import Departamentos, Puestos
from django.db import connection
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required


@login_required(login_url='/login/')
def get_departamento(request, search):
    data= []
    if bool(search):
        departamentos = Departamentos.objects.filter(activo=True, nombre__contains=search)
    
        for row in departamentos:
            data.append({
                "id": row.id,
                'name': row.nombre,
            })
    
    return JsonResponse(data, safe=False)


@login_required(login_url='/login/')
def get_puesto(request, search, departamento_id):
    data= []
    if bool(search):
        departamentos = Puestos.objects.filter(activo=True, nombre__contains=search,
                            departamento_id=departamento_id)
    
        for row in departamentos:
            data.append({
                "id": row.id,
                'name': row.nombre,
            })
    
    return JsonResponse(data, safe=False)