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
    strQuery = """
        SELECT a.*, case b.Descripcion when 'S' then 'Soltero(a)' when 'C' then 'Casado(a)' when 'U' then 'Unido(a)' end as EstadoCivil
        FROM NOVA..rrhh_datos_empleado as a
        JOIN NominaGB..EstadoCivil as b ON a.estado_civil = b.No_EstadoCivil
        WHERE bool_cambio_datos = 1
        AND bool_actualizados = 0
    """
    
    objDatos = get_query(strQuery)

    data = {
        "datos": objDatos
    }

    return render(request, 'confirmar_datos/confirmar_datos.html', data)


@login_required(login_url="/login/")
def get_info(request):

    intId = request.POST.get("id")
    strQuery = """
        SELECT a.*, b.Descripcion, case b.Descripcion when 'S' then 'Soltero(a)' when 'C' then 'Casado(a)' when 'U' then 'Unido(a)' else '-' end as EstadoCivil
        FROM NOVA..rrhh_datos_empleado as a
        JOIN NominaGB..EstadoCivil as b ON a.estado_civil = b.No_EstadoCivil
        WHERE a.id = %s
    """ % intId

    objInfo = get_query(strQuery)

    if len(objInfo) == 0:
        return False
    
    strQuery = """
        SELECT TOP 1 b.Nombres, b.Apellidos, b.DUI, b.Estado_Civil, b.direccion, b.cedulamunicipio, b.CedulaDepto, case b.Estado_Civil when 'S' then 'Soltero(a)' when 'C' then 'Casado(a)' when 'U' then 'Unido(a)' else '-' end as EstadoCivil
        FROM ares..empleados_base as a
        JOIN NominaGB..Empleados as b
        ON a.no_empleado = b.no_empleado
        WHERE a.empleado_id = %s
        ORDER BY b.fecha_alta DESC
    """ % str(objInfo[0]["empleado_id"])

    objInfoVieja = get_query(strQuery)

    objJson = {
        "status": True,
        "msj": 'Se guardó la información del empleado exitosamente.',
        "info_nueva": objInfo[0],
        "info_vieja": objInfoVieja[0]
    }

    return JsonResponse(objJson, safe=False)

@login_required(login_url="/login/")
def save(request):

    strId = str(request.POST.get("id"))
    strQuery = """
        SELECT a.*, b.Descripcion
        FROM NOVA..rrhh_datos_empleado as a
        JOIN NominaGB..EstadoCivil as b ON a.estado_civil = b.No_EstadoCivil
        WHERE a.id = %s
    """ % strId

    objInfo = get_query(strQuery)

    if len(objInfo) == 0:
        return False

    strQuery = """
        UPDATE
            NominaGB..Empleados
        SET
            Nombres = c.nombres,
            Apellidos = c.apellidos,
            DUI = c.dpi,
            Estado_Civil = d.Descripcion,
            direccion = c.direccion,
            cedulamunicipio = c.municipio_dpi,
            CedulaDepto = c.departamento_dpi
        FROM
            ares..empleados_base AS a
            JOIN NominaGB..Empleados AS b ON a.no_empleado = b.no_empleado
            JOIN NOVA..rrhh_datos_empleado AS c ON a.empleado_id = c.empleado_id
            JOIN NominaGB..EstadoCivil AS d ON c.estado_civil = d.No_EstadoCivil
        WHERE c.id = %s
    """ % (strId)
    boolEjecuto = execute_query(strQuery)

    strQuery = """
        UPDATE
            NOVA..rrhh_datos_empleado
        SET
            bool_cambio_datos = 0,
            bool_actualizados = 1
        WHERE id = %s
    """ % (strId)
    boolEjecuto2 = execute_query(strQuery)

    if boolEjecuto and boolEjecuto2:
        objJson = {
            "status": True,
            "msj": 'Se confirmó la información del empleado exitosamente.'
        }
        set_notification(request, True, "Se confirmó la información del empleado exitosamente.", "add_alert", "success")
    else:
        objJson = {
            "status": False,
            "msj": 'Falló guardar la información, contacte con TI.'
        }

    return JsonResponse(objJson, safe=False)