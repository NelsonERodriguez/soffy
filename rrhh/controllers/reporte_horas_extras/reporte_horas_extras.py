from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import get_query, set_notification
from rrhh.models import Horas_extras


@login_required(login_url="/login/")
def index(request):

    horas = Horas_extras.objects.filter(
        user_id=request.user.id,
        cerrado=True
    )

    if not horas:

        str_sql = """
            SELECT 
                STRING_AGG(departamento, ', ') AS departamentos 
            FROM 
                NominaGB..jefes_departamentos 
            WHERE 
                jefe = %s
        """ % request.user.id

        arr_departamentos = get_query(str_sql)

        if not arr_departamentos[0]['departamentos']:
            horas = Horas_extras.objects.filter(
                cerrado=True
            )

    data = {
        "horas": horas
    }
    return render(request, 'reporte_horas_extras/reporte_horas_extras.html', data)


@login_required(login_url="/login/")
def ver_reporte(request, id):

    try:
        horas = Horas_extras.objects.get(id=id)
        str_sql = """
            SELECT 
                NH.year,
                NH.month,
                NH.quincena,
                NE.No_Empleado AS CodigoEmpleado,
                AU.name AS Empleado,
                NP.Descripcion AS Puesto,
                SUM(NHD.horas_simples) AS Simples,
                SUM(NHD.horas_dobles) AS Dobles
            FROM
                NOVA..rrhh_horas_extras NH
            INNER JOIN NOVA..rrhh_horas_extras_detalle NHD ON NHD.hora_extra_id = NH.id
            INNER JOIN ares..users AU ON AU.id = NHD.user_id
            INNER JOIN ares..empleados_base AEB ON AEB.empleado_id = AU.empleado_id
            INNER JOIN NominaGB..Empleados NE ON NE.No_Empleado = AEB.no_empleado
            INNER JOIN NominaGB..Puestos NP ON NP.No_Puesto = NE.No_Puesto
            WHERE
                NH.id = %s
            AND NH.cerrado = 1
            AND NE.Fecha_Baja IS NULL
            AND AEB.base_id = 46
            AND AEB.fecha_baja IS NULL
            GROUP BY
                NH.year, NH.month, NH.quincena, AU.id, AU.name, NE.No_Empleado, NP.Descripcion
        """ % id
        arr_detalles_tmp = get_query(str_sql)
        arr_detalles = []

        for detalle_tmp in arr_detalles_tmp:
            arr_detalles.append(
                {
                    "Year": detalle_tmp['year'],
                    "Month": detalle_tmp['month'],
                    "Quincena": detalle_tmp['quincena'],
                    "CodigoEmpleado": detalle_tmp['CodigoEmpleado'],
                    "Empleado": detalle_tmp['Empleado'],
                    "Puesto": detalle_tmp['Puesto'],
                    "Simples": format(detalle_tmp['Simples']) if detalle_tmp['Simples'] else None,
                    "Dobles": format(detalle_tmp['Dobles']) if detalle_tmp['Dobles'] else None
                }
            )

    except Horas_extras.DoesNotExist:
        set_notification(request, True, "Registro no encontrado.", "warning", "danger")
        return redirect('rrhh-reporte_horas_extras')

    data = {
        "horas": horas,
        "detalles": arr_detalles
    }
    return render(request, 'reporte_horas_extras/reporte_horas_extras_detalle.html', data)


@login_required(login_url="/login/")
def abrir(request, id):

    try:
        horas = Horas_extras.objects.get(id=id)
        horas.cerrado = False
        horas.save()
        set_notification(request, True, "Quincena abierta correctamente.", "add_alert", "success")

    except Horas_extras.DoesNotExist:
        set_notification(request, True, "Registro no encontrado.", "warning", "danger")
        return redirect('rrhh-reporte_horas_extras')

    return redirect('rrhh-reporte_horas_extras')