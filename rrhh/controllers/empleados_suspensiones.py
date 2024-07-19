from django.http.response import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import get_query, set_notification
from rrhh.models import Empleados_suspensiones
from rrhh.forms import Empleados_suspensiones_form
from datetime import datetime
from django.core.mail import EmailMultiAlternatives
from django.conf import settings


file_index = 'empleados_suspensiones/empleados_suspensiones.html'
file_create = 'empleados_suspensiones/empleados_suspensiones_create.html'
file_edit = 'empleados_suspensiones/empleados_suspensiones_edit.html'

@login_required(login_url="/login/")
def index(request):
    str_query = """SELECT e.DUI, e.No_Empleado as codigo, e.Nombres + ' ' + e.Apellidos as empleado, 
                        m.Razon_Social as empresa, d.Descripcion as departamento, es.estado
                    FROM nominagb..empleados e
                        INNER JOIN nominagb..deptos d ON e.No_Depto = d.No_Depto
                        INNER JOIN nominagb..Empresas m ON e.No_Empresa = m.No_Empresa
                        INNER JOIN nominagb..puestos p ON e.no_puesto = p.No_Puesto
                        LEFT JOIN nova..rrhh_empleados_suspensiones es
                        ON e.No_Empleado = es.empleado and es.activo = 1
                    WHERE e.Fecha_Baja IS NULL 
                        OR es.estado = 'despido' OR es.estado = 'fallecimiento' OR es.estado = 'renuncia'
                    ORDER BY e.Nombres, e.Apellidos"""
    arr = []
    users = get_query(str_query)

    for user in users:
        estado = user['estado']
        estado_usuario = 'disponible'
        if estado:
            estado_usuario = estado.replace('_', ' ')
        
        arr.append({
            'DUI': user['DUI'] ,
            'codigo': user['codigo'],
            'empresa': user['empresa'],
            'departamento': user['departamento'],
            'empleado': user['empleado'],
            'estado': estado_usuario

        })


    return render(request, 'empleados_suspensiones/empleados_suspensiones.html', {"users": arr})


@login_required(login_url="/login/")
def create(request):
    empleado = request.POST.get('empleado', 0)
    estado = request.POST.get('motivo', 0)
    fecha_inicio = request.POST.get('inicio', '')
    fecha_fin = request.POST.get('fin', '')
    activo = False if request.POST.get('ready', '') == 'on' else True
    existente = request.POST.get('existente', 0)
    str_error = ''
    try:
        if existente:
            empleado_existente = Empleados_suspensiones.objects.get(id=existente)
            if empleado_existente:
                empleado_existente.estado = estado
                empleado_existente.activo = activo
                empleado_existente.fecha_inicio = fecha_inicio
                if fecha_fin != '':
                    empleado_existente.fecha_fin = fecha_fin
                empleado_existente.save()
        else:
            if fecha_fin != '':
                Empleados_suspensiones.objects.create(
                    empleado = empleado,
                    estado = estado,
                    fecha_inicio = fecha_inicio,
                    fecha_regreso = fecha_fin,
                )
            else:
                Empleados_suspensiones.objects.create(
                    empleado=empleado,
                    estado=estado,
                    fecha_inicio=fecha_inicio,
                )
    except ValueError:
        str_error = ValueError

    if str_error != '':
        data = {
            'status': False,
            'msj': 'Ocurrió un error al guardar la información.'
        }
    else:
        str_query = """SELECT e.Nombres + ' ' + e.Apellidos as empleado, d.Descripcion as area
                            FROM nominagb..empleados e
                                INNER JOIN nominagb..deptos d ON e.No_Depto = d.No_Depto
                            WHERE e.No_Empleado = '%s'""" % empleado
        result = get_query(str_query)
        nombre_empleado = result[0]['empleado']
        area = result[0]['area']
        if activo:
            str_msj = 'El colaborador %s, del area de %s, se encuentra suspendido por el siguiente motivo: "%s", ' \
                      'abarcando desde la fecha: %s, hasta: %s' % (nombre_empleado, area, estado.upper(), fecha_inicio,
                                                                   fecha_fin)
        else:
            str_msj = 'El colaborador %s, del area de %s, Ya se encuentra disponible y trabajando'
        email = EmailMultiAlternatives(
            'Notificacion suspension de colaboradores',
            str_msj,
            settings.EMAIL_HOST_USER,
            ['nrodriguez@grupobuena.com']
        )
        # email.send()
        data = {
            'status': True,
            'msj': 'Guardado Correctamente.'
        }
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def edit(request, pk):
    str_query = """SELECT e.Nombres + ' ' + e.Apellidos as empleado, es.id, es.fecha_inicio, es.fecha_regreso, es.estado
                    FROM nominagb..empleados e
                        LEFT JOIN nova..rrhh_empleados_suspensiones es
                            ON e.No_Empleado = es.empleado
                    WHERE e.No_Empleado = '%s' AND es.activo = 1""" % pk
    result = get_query(str_query)
    empleado = ''
    if result and result[0]: # si no estoy activo es por que no tengo nada
        empleado = result[0]['empleado']
        inicio = format(result[0]['fecha_inicio'])
        fin = format(result[0]['fecha_regreso'])
        fecha_inicio = datetime.strptime(inicio, '%Y-%m-%d %H:%M:%S').date()
        fecha_fin = ''
        if fin != 'None':
            fecha_fin = datetime.strptime(fin, '%Y-%m-%d %H:%M:%S').date()
        estado = result[0]['estado']
        existente = result[0]['id']
    else:
        str_query = """SELECT e.Nombres + ' ' + e.Apellidos as empleado
                            FROM nominagb..empleados e
                            WHERE e.No_Empleado = '%s'""" % pk
        result_empleado = get_query(str_query)
        empleado = result_empleado[0]['empleado']
        fecha_inicio = ''
        fecha_fin = ''
        estado = ''
        existente = ''
    
    bool_estado = True
    if estado == 'fallecimiento' or estado == 'despido' or estado == 'renuncia':
        bool_estado = False

    data = {
        'nombre_empleado': empleado,
        'codigo_empleado': pk,
        'suspension': {
            'fecha_inicio': format(fecha_inicio),
            'fecha_regreso': format(fecha_fin),
            'estado': format(estado),
            'existente': format(existente),
        },
        'error': False,
        'bool_estado': bool_estado
    }

    return render(request, file_edit, data)

