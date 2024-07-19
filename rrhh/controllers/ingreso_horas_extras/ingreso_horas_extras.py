from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from core.functions import get_query, set_notification
from soffybiz.debug import DEBUG
from rrhh.models import Horas_extras, Horas_extras_detalle
import datetime


@login_required(login_url="/login/")
def index(request):
    str_sql = """
        SELECT
            NE.No_Depto
        FROM
            NominaGB..Empleados NE
        INNER JOIN ares..empleados_base AE ON AE.no_empleado = NE.No_Empleado
        INNER JOIN ares..users AU ON AU.empleado_id = AE.empleado_id
        WHERE
            AU.id = %s
        GROUP BY
            NE.No_Depto
    """ % request.user.id

    arr_departamentos = get_query(str_sql)
    int_departamento = arr_departamentos[0]['No_Depto'] if arr_departamentos else None

    date = datetime.datetime.now()
    int_year = date.year
    int_month = date.month
    int_day = date.day
    int_quincena = 1 if int_day < 16 else 2
    int_last_quincena = 1 if int_quincena == 2 else 2
    int_last_year = int_year - 1 if int_month == 1 else int_year
    int_last_month = int_month - 1 if int_month > 1 else 12

    horas_quincena_anterior = Horas_extras.objects.filter(
        user_id=request.user.id,
        year=int_last_year,
        month=int_last_month,
        departamento=int_departamento,
        quincena=int_last_quincena
    )

    if request.method == "POST":

        id = int(request.POST.get('id', 0))
        bool_cerrar = True if request.POST.get('cerrado', False) else False
        arr_detalle_id = request.POST.getlist('detalle_id[]', None)
        user_id = request.POST.get('empleado_id', None)
        int_user_id = int(user_id)
        arr_fecha = request.POST.getlist('fecha[]', None)
        arr_hora_entrada = request.POST.getlist('hora_entrada[]', None)
        arr_hora_salida = request.POST.getlist('hora_salida[]', None)
        arr_horas_simples = request.POST.getlist('horas_simples[]', None)
        arr_horas_dobles = request.POST.getlist('horas_dobles[]', None)

        if id == 0:
            if horas_quincena_anterior and not horas_quincena_anterior[0].cerrado:
                horas = horas_quincena_anterior[0]
                id = horas.id
            else:
                horas = Horas_extras.objects.create(
                    user_id=request.user.id,
                    year=int_year,
                    month=int_month,
                    departamento=int_departamento,
                    quincena=int_quincena,
                    cerrado=bool_cerrar,
                    procesado=False
                )
                id = horas.id

        else:
            horas = Horas_extras.objects.get(id=id)
            horas.cerrado = bool_cerrar
            horas.save()

        int_row = 0
        for detalle_id in arr_detalle_id:
            str_fecha = arr_fecha[int_row]
            str_hora_entrada = arr_hora_entrada[int_row]
            str_hora_salida = arr_hora_salida[int_row]
            float_horas_simples = float(arr_horas_simples[int_row]) if arr_horas_simples[int_row] else None
            float_horas_dobles = float(arr_horas_dobles[int_row]) if arr_horas_dobles[int_row] else None
            int_row += 1

            if int(detalle_id):
                detalle = Horas_extras_detalle.objects.get(id=detalle_id)
                detalle.user_id = int_user_id
                detalle.fecha = str_fecha
                detalle.hora_entrada = str_hora_entrada
                detalle.hora_salida = str_hora_salida
                detalle.horas_simples = float_horas_simples
                detalle.horas_dobles = float_horas_dobles
                detalle.save()

            else:
                if str_fecha == date.strftime('%Y-%m-%d') and str_hora_entrada == str_hora_salida and \
                        not float_horas_simples and not float_horas_dobles:
                    continue

                Horas_extras_detalle.objects.create(
                    hora_extra_id=id,
                    user_id=int_user_id,
                    fecha=str_fecha,
                    hora_entrada=str_hora_entrada,
                    hora_salida=str_hora_salida,
                    horas_simples=float_horas_simples,
                    horas_dobles=float_horas_dobles
                )


        # set_notification(request, True, "Registros grabados.", "add_alert", "success")

        data = {
            "status": True
        }

        return JsonResponse(data, safe=False)

    return render(request, 'ingreso_horas_extras/ingreso_horas_extras.html')


@login_required(login_url="/login/")
def get_horarios(request):
    str_sql = """
        SELECT
            NE.No_Depto
        FROM
            NominaGB..Empleados NE
        INNER JOIN ares..empleados_base AE ON AE.no_empleado = NE.No_Empleado
        INNER JOIN ares..users AU ON AU.empleado_id = AE.empleado_id
        WHERE
            AU.id = %s
        GROUP BY
            NE.No_Depto
    """ % request.user.id

    arr_departamentos = get_query(str_sql)
    int_departamento = arr_departamentos[0]['No_Depto'] if arr_departamentos else None

    date = datetime.datetime.now()
    int_year = date.year
    int_month = date.month
    int_day = date.day

    int_last_year = int_year - 1 if int_month == 1 and int_day < 16 else int_year
    if int_day < 16:
        int_last_month = int_month - 1 if int_month > 1 else 12
    else:
        int_last_month = int_month

    int_quincena = 1 if int_day < 16 else 2
    int_last_quincena = 1 if int_quincena == 2 else 2

    horas_quincena_anterior = Horas_extras.objects.filter(
        user_id=request.user.id,
        year=int_last_year,
        month=int_last_month,
        departamento=int_departamento,
        quincena=int_last_quincena
    ).first()

    horas = Horas_extras.objects.filter(
        user_id=request.user.id,
        year=int_year,
        month=int_month,
        departamento=int_departamento,
        quincena=int_quincena
    ).first()

    if horas_quincena_anterior and not horas_quincena_anterior.cerrado:
        id = horas_quincena_anterior.id
        year = horas_quincena_anterior.year
        month = horas_quincena_anterior.month
        quincena = horas_quincena_anterior.quincena

        if int_last_quincena == 2:
            end_date = datetime.date(int_last_year, int_last_month + 1 if int_last_month < 12 else 1, 1) - \
                       datetime.timedelta(days=1)
            str_date_start = datetime.date(int_last_year, int_last_month, 16).strftime("%Y-%m-%d")
            str_date_end = end_date.strftime("%Y-%m-%d")
        else:
            str_date_start = datetime.date(int_year, int_month, 1).strftime("%Y-%m-%d")
            str_date_end = datetime.date(int_year, int_month, 15).strftime("%Y-%m-%d")

    else:
        id = horas.id if horas and not horas.cerrado else 0
        year = horas.year if horas and not horas.cerrado else int_year
        month = horas.month if horas and not horas.cerrado else int_month
        quincena = horas.quincena if horas and not horas.cerrado else int_quincena

        if int_quincena == 2:
            end_date = datetime.date(int_year, int_month + 1 if int_month < 12 else 12, 1) - datetime.timedelta(days=1)
            str_date_start = datetime.date(int_last_year, int_last_month, 16).strftime("%Y-%m-%d")
            str_date_end = end_date.strftime("%Y-%m-%d")
        else:
            str_date_start = datetime.date(int_year, int_month, 1).strftime("%Y-%m-%d")
            str_date_end = datetime.date(int_year, int_month, 15).strftime("%Y-%m-%d")

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
        str_filter = " AND NE.No_Depto IN (%s) " % str_ids_departamentos
    else:
        str_filter = ''

    str_sql = """
        (
            SELECT
                AU.id,
                NE.No_Empleado AS CodigoEmpleado,
                NE.No_Depto, 
                CONCAT(NE.Nombres, ', ', NE.Apellidos) AS name,
                CONVERT(VARCHAR, A.fecha, 103) AS fecha, 
                FORMAT(MIN(A.fecha), 'HH:mm:ss') AS entrada, 
                FORMAT(MAX(A.fecha), 'HH:mm:ss') AS salida,
                HRD.id AS detalle_id,
                HRD.hora_entrada,
                HRD.hora_salida,
                HRD.horas_simples,
                HRD.horas_dobles,
                HR.cerrado
            FROM 
                ares..users AU
            INNER JOIN ares..empleados_base AE ON ae.empleado_id = AU.empleado_id
            INNER JOIN NominaGB..Empleados NE ON NE.no_empleado = AE.no_empleado
            INNER JOIN NominaGB..Puestos NP ON NP.No_Puesto = NE.no_puesto
            INNER JOIN NominaGB..empresas NEM ON NEM.No_Empresa = NE.No_Empresa
            LEFT JOIN foxcore..empleado_asistencias A ON A.codigo = NE.No_Empleado AND (YEAR(A.fecha) = YEAR(GETDATE()) 
                OR 
                YEAR(A.fecha) = IIF(DAY(GETDATE()) < 16 AND MONTH(GETDATE()) = 1, YEAR(GETDATE()) - 1, YEAR(GETDATE())))
                AND (MONTH(A.fecha) = MONTH(GETDATE()) AND YEAR(A.fecha) = YEAR(GETDATE()) OR 
                MONTH(A.fecha) = CASE 
                    WHEN DAY(GETDATE()) < 16 AND MONTH(GETDATE()) > 1 
                    THEN MONTH(GETDATE()) - 1 
                    WHEN DAY(GETDATE()) < 16 AND MONTH(GETDATE()) = 1 
                    THEN 12 ELSE MONTH(GETDATE()) END)
            -- LEFT JOIN NOVA..rrhh_horas_extras HR ON HR.user_id = AU.id
            LEFT JOIN NOVA..rrhh_horas_extras_detalle HRD ON HRD.user_id = AU.id AND 
                CAST(HRD.fecha AS DATE) = CAST(A.fecha AS DATE)
            LEFT JOIN NOVA..rrhh_horas_extras HR ON HR.id = HRD.hora_extra_id
            WHERE 
                NE.fecha_baja IS NULL
            -- AND A.codigo = '201202001'
            %s
            -- AND YEAR(A.fecha) = YEAR(GETDATE())
            -- AND MONTH(A.fecha) = MONTH(GETDATE())
            AND AE.base_id = 46
            -- AND AU.first_login = 0
            GROUP BY 
                CONVERT(VARCHAR, A.fecha, 103), NE.No_Empleado, NE.Nombres, NE.Apellidos, NE.No_Depto, HR.cerrado,
                HRD.id, HRD.fecha, HRD.hora_entrada, HRD.hora_salida, HRD.horas_simples, HRD.horas_dobles, AU.id
        )
        UNION
        (
            SELECT
                AU.id,
                NE.No_Empleado AS CodigoEmpleado,
                NE.No_Depto, 
                CONCAT(NE.Nombres, ', ', NE.Apellidos) AS name,
                CONVERT(VARCHAR, HRD.fecha, 103) AS fecha, 
                CAST(HRD.hora_entrada AS TIME) AS entrada, 
                CAST(HRD.hora_salida AS TIME) AS salida,
                HRD.id AS detalle_id,
                HRD.hora_entrada,
                HRD.hora_salida,
                HRD.horas_simples,
                HRD.horas_dobles,
                HR.cerrado
            FROM 
                ares..users AU
            INNER JOIN ares..empleados_base AE ON ae.empleado_id = AU.empleado_id
            INNER JOIN NominaGB..Empleados NE ON NE.no_empleado = AE.no_empleado
            INNER JOIN NominaGB..Puestos NP ON NP.No_Puesto = NE.no_puesto
            INNER JOIN NominaGB..empresas NEM ON NEM.No_Empresa = NE.No_Empresa
            INNER JOIN NOVA..rrhh_horas_extras_detalle HRD ON HRD.user_id = AU.id
            INNER JOIN NOVA..rrhh_horas_extras HR ON HR.id = HRD.hora_extra_id
            WHERE 
                NE.fecha_baja IS NULL
            -- AND NE.No_Empleado = '201202001'
            %s
            AND (YEAR(HRD.fecha) = YEAR(GETDATE()) OR YEAR(HRD.fecha) = YEAR(GETDATE()) - 1)
            AND (MONTH(HRD.fecha) = MONTH(GETDATE()) OR 
            MONTH(HRD.fecha) = CASE WHEN MONTH(GETDATE()) = 1 THEN 12 ELSE MONTH(GETDATE()) - 1 END)
            AND AE.base_id = 46
            -- AND AU.first_login = 0
            AND HR.procesado = 0
            AND HR.cerrado = 0
            AND HR.quincena = %s
            GROUP BY 
                CONVERT(VARCHAR, HRD.fecha, 103), NE.No_Empleado, NE.Nombres, NE.Apellidos, NE.No_Depto, HR.cerrado, 
                HRD.id, HRD.fecha, HRD.hora_entrada, HRD.hora_salida, HRD.horas_simples, HRD.horas_dobles, AU.id
        )
        ORDER BY name
    """ % (
        str_filter,
        str_filter,
        int_last_quincena if horas_quincena_anterior and not horas_quincena_anterior.cerrado else int_quincena
    )

    arr_empleados_tmp = get_query(str_sql)

    arr_reporte = {}
    for arr_tmp in arr_empleados_tmp:

        if not arr_tmp['CodigoEmpleado'] in arr_reporte:
            arr_reporte[arr_tmp['CodigoEmpleado']] = {
                'id': arr_tmp['id'],
                'name': arr_tmp['name'],
                'CodigoEmpleado': arr_tmp['CodigoEmpleado'],
                'No_Depto': arr_tmp['No_Depto'],
                'fechas': {}
            }

        str_hora_entrada = format(arr_tmp['hora_entrada']) if arr_tmp['hora_entrada'] else format(arr_tmp['entrada'])
        str_hora_salida = format(arr_tmp['hora_salida']) if arr_tmp['hora_salida'] else format(arr_tmp['salida'])

        if arr_tmp['hora_entrada']:
            str_hora_entrada = format(arr_tmp['hora_entrada'])
            arr_split = str_hora_entrada.split(':')
            time_1 = datetime.timedelta(hours=int(arr_split[0]), minutes=int(arr_split[1]), seconds=int(arr_split[2]))
        elif arr_tmp['entrada']:
            str_hora_entrada = format(arr_tmp['entrada'])
            arr_split = str_hora_entrada.split(':')
            time_1 = datetime.timedelta(hours=int(arr_split[0]), minutes=int(arr_split[1]), seconds=int(arr_split[2]))
        else:
            time_1 = None

        if arr_tmp['hora_salida']:
            str_hora_salida = format(arr_tmp['hora_salida'])
            arr_split = str_hora_salida.split(':')
            time_2 = datetime.timedelta(hours=int(arr_split[0]), minutes=int(arr_split[1]), seconds=int(arr_split[2]))
        elif arr_tmp['salida']:
            str_hora_salida = format(arr_tmp['salida'])
            arr_split = str_hora_salida.split(':')
            time_2 = datetime.timedelta(hours=int(arr_split[0]), minutes=int(arr_split[1]), seconds=int(arr_split[2]))
        else:
            time_2 = None

        horas_trabajadas = time_2 - time_1 if time_2 and time_1 else 0

        if not arr_tmp['fecha'] in arr_reporte[arr_tmp['CodigoEmpleado']]['fechas']:

            str_fecha = arr_tmp['fecha']
            if str_fecha:
                arr_split = arr_tmp['fecha'].split('/')
                int_day = int(arr_split[0])
                if int_quincena == 1 and int_day < 16 and \
                        (horas_quincena_anterior and horas_quincena_anterior.cerrado or not horas_quincena_anterior) \
                        and int_month == int(arr_split[1]) or horas_quincena_anterior \
                        and not horas_quincena_anterior.cerrado \
                        and int_last_quincena == 1 and int_day < 16:

                    bool_add = True

                elif int_quincena == 2 and int_day > 15 and \
                        (horas_quincena_anterior and horas_quincena_anterior.cerrado or not horas_quincena_anterior) \
                        and int_month == int(arr_split[1]) or horas_quincena_anterior \
                        and not horas_quincena_anterior.cerrado \
                        and int_last_quincena == 2 and int_day > 15:

                    bool_add = True

                else:
                    bool_add = False

            else:
                bool_add = True

            if bool_add:
                if not horas or horas and not horas.cerrado:
                    arr_reporte[arr_tmp['CodigoEmpleado']]['fechas'][arr_tmp['fecha']] = {
                        'detalle_id': arr_tmp['detalle_id'] if arr_tmp['detalle_id'] else 0,
                        'fecha': arr_tmp['fecha'],
                        'hora_entrada': str_hora_entrada,
                        'hora_salida': str_hora_salida,
                        'horas_simples': format(arr_tmp['horas_simples']) if arr_tmp['horas_simples'] else 0,
                        'horas_dobles': format(arr_tmp['horas_dobles']) if arr_tmp['horas_dobles'] else 0,
                        'horas_trabajadas': format(horas_trabajadas)
                    }

    for reporte in arr_reporte:
        if not arr_reporte[reporte]['fechas']:
            arr_reporte[reporte]['fechas'][None] = {
                'detalle_id': 0,
                'fecha': None,
                'hora_entrada': None,
                'hora_salida': None,
                'horas_simples': 0,
                'horas_dobles': 0,
                'horas_trabajadas': 0
            }

    str_sql = """
        SELECT 
            D.Descripcion,
            D.No_Depto
        FROM 
            NominaGB..jefes_departamentos J
        INNER JOIN NominaGB..Deptos D ON D.No_Depto = J.departamento
        WHERE 
            J.jefe = %s 
    """ % request.user.id

    arr_departamentos = get_query(str_sql)

    data = {
        'id': id,
        'reporte': arr_reporte,
        "departamentos": arr_departamentos,
        "date_start": str_date_start,
        "date_end": str_date_end,
        "year": year,
        "month": month,
        "quincena": quincena,
    }
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def cerrar_quincena(request):
    id = request.POST.get('id', 0)
    horas = Horas_extras.objects.get(id=id)
    horas.cerrado = True
    horas.save()
    set_notification(request, True, "Quincena cerrada.", "add_alert", "success")

    if not request.user.is_superuser:
        emails = None
        if request.user.id == 69:
            emails = ['nrodriguez@grupobuena.com',]
        elif request.user.id == 8:
            emails = ['nrodriguez@grupobuena.com']

        if emails:
            body = 'El usuario %s cerro la quincena %s' % (request.user.name, horas.quincena)
            email = EmailMultiAlternatives(
                'Periodo %s/%s quincena %s cerrada' % (horas.year, horas.month, horas.quincena),
                body,
                settings.EMAIL_HOST_USER,
                ['nrodriguez@grupobuena.com'] if DEBUG else emails
            )
            email.send()

    data = {
        "status": True
    }
    return JsonResponse(data, safe=False)
