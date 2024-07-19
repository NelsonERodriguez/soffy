from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query
from rrhh.models import Planificacion_vacaciones, Planificacion_vacaciones_detalle


@login_required(login_url="/login/")
def index(request):
    return render(request, 'planificacion_vacaciones/planificacion_vacaciones.html')


@login_required(login_url="/login/")
def get_empresas(request):
    str_base = request.POST.get('base', 'NominaGB')
    str_empresa = request.POST.get('empresa', '')

    str_sql = """
        SELECT
            No_Empresa AS id,
            Razon_Social AS name
        FROM
            %s..Empresas
        WHERE
            (No_Empresa LIKE '%%%s%%' OR Razon_Social LIKE '%%%s%%')
    """ % (str_base, str_empresa, str_empresa)

    arr_empresas = get_query(str_sql)

    data = {
        "empresas": arr_empresas
    }
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_empleados(request):

    str_base = request.POST.get('base', 'NominaGB')
    str_empresa = request.POST.get('empresa', '')
    str_empleado = request.POST.get('empleado', '')
    str_sql = """
        SELECT 
            STRING_AGG(departamento, ', ') AS departamentos 
        FROM 
            NominaGB..jefes_departamentos 
        WHERE 
            jefe = %s
    """ % request.user.id

    arr_departamentos = get_query(str_sql)

    if arr_departamentos[0]['departamentos']:
        str_ids_departamentos = arr_departamentos[0]['departamentos']
        str_filter = " AND E.No_Depto IN (%s) " % str_ids_departamentos
    else:
        str_filter = ''

    str_sql = """
        SELECT
            E.No_Empleado AS id,
            CONCAT(E.Nombres, ', ', E.Apellidos) AS name,
            P.Descripcion AS Puesto
        FROM
            %s..Empleados AS E
        INNER JOIN %s..Puestos AS P ON P.No_Puesto = E.No_Puesto
        WHERE
            (E.Nombres LIKE '%%%s%%' OR E.Apellidos LIKE '%%%s%%')
        AND E.No_Empresa = %s
        %s
        AND E.Fecha_Baja IS NULL
    """ % (str_base, str_base, str_empleado, str_empleado, str_empresa, str_filter)

    arr_empleados = get_query(str_sql)

    data = {
        "empleados": arr_empleados
    }
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_dias_disponibles(request):

    str_base = request.POST.get('base', 'NominaGB')
    str_codigo_empleado = request.POST.get('empleado_id', '')
    str_empresa = request.POST.get('empresa', '')

    str_sql = """
        SELECT
            COUNT(D.id) AS dias_planificados,
            V.empleado,
            V.user_id
        FROM
            NOVA..rrhh_planificacion_vacaciones V
        INNER JOIN NOVA..rrhh_planificacion_vacaciones_detalle D ON D.planificacion_id = V.id
        WHERE
            V.empleado = '%s'
        AND D.fecha > GETDATE()
        GROUP BY
            V.empleado, V.user_id
    """ % str_codigo_empleado

    arr_dias_planificados = get_query(str_sql)

    str_sql = """
        exec %s..StatusVacaciones '%s', %s
    """ % (str_base, str_codigo_empleado, str_empresa)

    arr_dias = get_query(str_sql)

    data = {
        "dias": arr_dias,
        "dias_planificados": arr_dias_planificados
    }
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_vacaciones(request):

    str_base = request.POST.get('base', 'NominaGB')
    str_sql = """
        SELECT 
            STRING_AGG(departamento, ', ') AS departamentos 
        FROM 
            NominaGB..jefes_departamentos 
        WHERE 
            jefe = %s
    """ % request.user.id

    arr_departamentos = get_query(str_sql)

    str_filter = " AND V.user_id = %s " % request.user.id if arr_departamentos[0]['departamentos'] else ''

    str_start = request.POST.get('start', '')
    str_end = request.POST.get('end', '')

    str_sql = """
        SELECT
            E.No_Empleado,
            CONCAT(E.Nombres, ', ' ,E.Apellidos) AS empleado,
            D.fecha AS fecha_inicio,
            D.fecha AS fecha_fin,
            D.periodo,
            CASE WHEN DATEDIFF(DAY, D.fecha, GETDATE()) < 0 THEN 1 ELSE 0 END AS validar
        FROM
            NOVA..rrhh_planificacion_vacaciones AS V
        INNER JOIN NOVA..rrhh_planificacion_vacaciones_detalle AS D ON D.planificacion_id = V.id
        INNER JOIN %s..Empleados AS E ON E.No_Empleado = V.empleado
        WHERE
            D.fecha BETWEEN '%s' AND '%s'
        %s
        GROUP BY
            D.id, E.No_Empleado, E.nombres, E.Apellidos, D.fecha, D.periodo
        """ % (str_base, str_start, str_end, str_filter)

    arr_vacaciones_tmp = get_query(str_sql)

    arr_vacaciones = []
    for vacaciones_tmp in arr_vacaciones_tmp:
        arr_vacaciones.append(
            {
                "start": vacaciones_tmp['fecha_inicio'],
                "end": vacaciones_tmp['fecha_fin'],
                "title": "%s" % vacaciones_tmp['empleado'],
                "no_empleado": vacaciones_tmp['No_Empleado'],
                "periodo": vacaciones_tmp['periodo'],
                "validar": vacaciones_tmp['validar']
            }
        )

    return JsonResponse(arr_vacaciones, safe=False)


@login_required(login_url="/login/")
def save_vacaciones(request):
    empleado_id = request.POST.get('empleado_id', None)

    bool_status = False
    if empleado_id:
        planificacion = Planificacion_vacaciones.objects.filter(
            user_id=request.user.id,
            empleado=empleado_id
        )

        if planificacion:
            planificacion = planificacion[0]
        else:
            planificacion = Planificacion_vacaciones.objects.create(
                user_id=request.user.id,
                empleado=empleado_id
            )

        str_fechas = request.POST.get('fechas', '')

        arr_split = str_fechas.split(',')

        for fecha in arr_split:
            Planificacion_vacaciones_detalle.objects.create(
                planificacion_id=planificacion.id,
                fecha=fecha
            )

        bool_status = True

    data = {
        "status": bool_status
    }

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def delete_vacaciones(request):
    empleado_id = request.POST.get('empleado_id', '')

    planificacion = Planificacion_vacaciones.objects.filter(
        user_id=request.user.id,
        empleado=empleado_id
    )

    if planificacion:
        planificacion = planificacion[0]

    str_fecha = request.POST.get('fechas', '')

    Planificacion_vacaciones_detalle.objects.filter(
        planificacion_id=planificacion.id,
        fecha=str_fecha
    )[0].delete()

    data = {
        "status": True
    }

    return JsonResponse(data, safe=False)
