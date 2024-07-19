import django.db as db
import time

from array import array
from tempfile import TemporaryFile
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query, set_notification, insert_query, execute_query
from django.db import connection
from datetime import datetime
from django.core.files.storage import FileSystemStorage
from rrhh.models import Datos_empleado

@login_required(login_url="/login/")
def index(request):

    # data = {"users": "", "departamentos": departamentos_show}
    intEmpleadoId = request.user.empleado_id

    objDatosEmpleado = Datos_empleado.objects.filter(empleado_id=intEmpleadoId)

    strQuery = """
        SELECT No_EstadoCivil as id, case Descripcion when 'S' then 'Soltero(a)' when 'C' then 'Casado(a)' when 'U' then 'Unido(a)' end as EstadoCivil, Descripcion
        FROM NominaGB..EstadoCivil
    """
    
    objEstados = get_query(strQuery)

    objDatos = list(objDatosEmpleado)

    objDatos = {
        "nombres": objDatos[0].nombres if objDatosEmpleado.exists() else '',
        "apellidos": objDatos[0].apellidos if objDatosEmpleado.exists() else '',
        "dpi": objDatos[0].dpi if objDatosEmpleado.exists() else '',
        "departamento_dpi": objDatos[0].departamento_dpi if objDatosEmpleado.exists() else '',
        "municipio_dpi": objDatos[0].municipio_dpi if objDatosEmpleado.exists() else '',
        "direccion": objDatos[0].direccion if objDatosEmpleado.exists() else '',
        "estado_civil": objDatos[0].estado_civil if objDatosEmpleado.exists() else '',
    }

    data = {
        "datos": objDatos,
        "estados": objEstados,
    }

    return render(request, 'actualizacion_datos/actualizacion_datos.html', data)


@login_required(login_url="/login/")
def guardar(request):

    intEmpleadoId = request.user.empleado_id

    objDatos = Datos_empleado.objects.filter(empleado_id=intEmpleadoId)

    strNombre = request.POST.get("txtNombres")
    strApellidos = request.POST.get("txtApellidos")
    strDpi = request.POST.get("txtDpi")
    strDepartamento = request.POST.get("txtDepartamento")
    strMunicipio = request.POST.get("txtMunicipio")
    strDireccion = request.POST.get("txtDireccion")
    intEstadoCivil = request.POST.get("sltEstadoCivil")
    

    if objDatos.exists():
        objDatos = Datos_empleado.objects.get(empleado_id=intEmpleadoId)

        objDatos.nombres=strNombre
        objDatos.apellidos=strApellidos
        objDatos.dpi=strDpi
        objDatos.departamento_dpi=strDepartamento
        objDatos.municipio_dpi=strMunicipio
        objDatos.direccion=strDireccion
        objDatos.estado_civil=intEstadoCivil
        objDatos.bool_cambio_datos=True
        objDatos.bool_actualizados=False

        objDatos.save()
        
    else:
        objDatos = Datos_empleado.objects.create(
            empleado_id=intEmpleadoId,
            nombres=strNombre,
            apellidos=strApellidos,
            dpi=strDpi,
            departamento_dpi=strDepartamento,
            municipio_dpi=strMunicipio,
            direccion=strDireccion,
            estado_civil=intEstadoCivil,
            bool_cambio_datos=True,
            bool_actualizados=False
        )

    return JsonResponse({ "status": True, "msj": 'Se guardó la información del empleado exitosamente.' }, safe=False)