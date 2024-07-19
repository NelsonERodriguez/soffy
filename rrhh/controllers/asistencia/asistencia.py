from django.db.models import F
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

from core.foxcore_models import EmpleadosFoxcore, FeriadosFoxcore
from core.functions import get_query, DIAS
from datetime import datetime, timedelta


@login_required(login_url="/login/")
def index(request):
    return render(request, 'asistencia/asistencia.html')


@login_required(login_url="/login/")
def empleados(request):
    arr_empleados = get_query(
        "SELECT No_Empleado, Nombres, Apellidos FROM Nominagb..Empleados WHERE Fecha_Baja IS NULL")
    data = {
        "empleados": arr_empleados,
    }

    return render(request, 'asistencia/empleados.html', data)


@login_required(login_url="/login/")
def horas_empleados(request):
    codigo = request.POST.get('codigo')
    str_fecha_inicio = request.POST.get('fecha_inicio')
    str_fecha_fin = request.POST.get('fecha_fin')

    str_sql = """
        SELECT
            CONVERT(VARCHAR, fecha, 103) AS fecha,
            FORMAT(MIN(fecha), 'HH:mm:ss') AS entrada,
            FORMAT(MAX(fecha), 'HH:mm:ss') AS salida 
        FROM
            foxcore..empleado_asistencias
        WHERE
            codigo = '%s'
        AND fecha BETWEEN '%s 00:00:01' AND '%s 23:59:59'
        GROUP BY CONVERT(VARCHAR, fecha, 103)
    """ % (codigo, str_fecha_inicio, str_fecha_fin)
    arr_asistencias = get_query(str_sql=str_sql)

    reporte = []
    if arr_asistencias:
        arr_empleado = get_query(
            "SELECT No_Empleado, Nombres, Apellidos FROM Nominagb..Empleados WHERE No_Empleado = '%s'" % codigo)[0]

        arr_horario = (EmpleadosFoxcore.objects
                       .annotate(descanso=F('departamento__departamentohorariofoxcore__descanso'),
                                 minutos=F('departamento__departamentohorariofoxcore__minutos'),
                                 lunes=F('departamento__departamentohorariofoxcore__lunes'),
                                 martes=F('departamento__departamentohorariofoxcore__martes'),
                                 miercoles=F('departamento__departamentohorariofoxcore__miercoles'),
                                 jueves=F('departamento__departamentohorariofoxcore__jueves'),
                                 viernes=F('departamento__departamentohorariofoxcore__viernes'),
                                 sabado=F('departamento__departamentohorariofoxcore__sabado'),
                                 domingo=F('departamento__departamentohorariofoxcore__domingo')).filter(codigo=codigo)
                       .prefetch_related('departamento__departamentohorariofoxcore_set')
                       .values('descanso', 'minutos', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado',
                               'domingo')
                       .first())

        fecha_inicio = datetime.strptime(str_fecha_inicio, "%Y-%m-%d")
        fecha_fin = datetime.strptime(str_fecha_fin, "%Y-%m-%d")

        arr_feriados = FeriadosFoxcore.objects.values('nombre', 'dia', 'mes', 'completo', 'hora')
        # get_query("SELECT nombre, dia, mes, completo, hora FROM foxcore..feriados")

        # int_hour = 13  # arr_empleado['descanso'].hour
        # int_hour = ("0%s" % int_hour) if len(str(int_hour)) == 1 else int_hour
        # int_minute = 0  # arr_empleado['descanso'].minute
        # int_minute = ("0%s" % int_minute) if len(str(int_minute)) == 1 else int_minute
        # int_second = 0  # arr_empleado['descanso'].second
        # int_second = ("0%s" % int_second) if len(str(int_second)) == 1 else int_second
        # str_descanso = "%s:%s:%s" % (int_hour, int_minute, int_second)
        # descanso = datetime.strptime(str_descanso, "%H:%M:%S")
        descanso = arr_horario['descanso']
        minutos_descando = arr_horario['minutos']
        lunes = arr_horario['lunes']
        martes = arr_horario['martes']
        miercoles = arr_horario['miercoles']
        jueves = arr_horario['jueves']
        viernes = arr_horario['viernes']
        sabado = arr_horario['sabado']
        domingo = arr_horario['domingo']

        fecha_inicio_tmp = fecha_inicio
        while fecha_inicio_tmp <= fecha_fin:
            trabaja = False
            feriado = list(filter(lambda item: item['dia'] == fecha_inicio_tmp.day and item['mes'] ==
                                               fecha_inicio_tmp.month, arr_feriados))
            filtro = list(filter(lambda item: item['fecha'] == fecha_inicio_tmp.strftime('%d/%m/%Y'), arr_asistencias))
            day_of_week = fecha_inicio_tmp.isoweekday()

            if day_of_week == 7 and domingo:
                trabaja = True
            elif day_of_week == 1 and lunes:
                trabaja = True
            elif day_of_week == 2 and martes:
                trabaja = True
            elif day_of_week == 3 and miercoles:
                trabaja = True
            elif day_of_week == 4 and jueves:
                trabaja = True
            elif day_of_week == 5 and viernes:
                trabaja = True
            elif day_of_week == 6 and sabado:
                trabaja = True

            if not filtro and trabaja:
                if not feriado:
                    reporte.append({
                        'codigo': arr_empleado['No_Empleado'],
                        'nombre': arr_empleado['Nombres'] + ' ' + arr_empleado['Apellidos'],
                        'fecha': fecha_inicio_tmp.strftime('%d/%m/%Y'),
                        'dia': DIAS[fecha_inicio_tmp.strftime('%w')],
                        'entrada': None,
                        'salida': None,
                        'horas': None,
                        'simples': None,
                        'dobles': None,
                    })

            elif filtro:
                entrada = datetime.strptime(filtro[0]['entrada'], "%H:%M:%S").time()
                salida = datetime.strptime(filtro[0]['salida'], "%H:%M:%S").time()
                entrada_dt = convertir_a_datetime(entrada)
                salida_dt = convertir_a_datetime(salida)
                descanso_dt = convertir_a_datetime(descanso)

                if entrada == salida:
                    if entrada <= descanso:
                        salida = None
                    else:
                        entrada = None
                    horas = None
                else:
                    delta = salida_dt - entrada_dt
                    horas = delta

                    if salida_dt > descanso_dt:
                        descando_a_salida = (salida_dt - descanso_dt).total_seconds() / 60

                        if descando_a_salida > minutos_descando:
                            horas -= timedelta(hours=1)
                        else:
                            horas -= timedelta(minutes=descando_a_salida)

                reporte.append({
                    'codigo': arr_empleado['No_Empleado'],
                    'nombre': arr_empleado['Nombres'] + ' ' + arr_empleado['Apellidos'],
                    'fecha': fecha_inicio_tmp.strftime('%d/%m/%Y'),
                    'dia': DIAS[fecha_inicio_tmp.strftime('%w')],
                    'entrada': entrada.strftime("%H:%M:%S") if entrada else None,
                    'salida': salida.strftime("%H:%M:%S") if salida else None,
                    'horas': horas.__str__() if horas else None,
                    'simples': None,
                    'dobles': None,
                })

            fecha_inicio_tmp = fecha_inicio_tmp + timedelta(days=1)

    data = {
        "status": True,
        "reporte": reporte,
    }

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def departamento(request):
    arr_departamentos = get_query("SELECT * FROM NominaGB..Deptos")
    data = {
        "departamentos": arr_departamentos,
    }

    return render(request, 'asistencia/departamento.html', data)


@login_required(login_url="/login/")
def horas_departamento(request):
    departamento = request.POST.get('departamento')
    str_fecha_inicio = request.POST.get('fecha_inicio')
    str_fecha_fin = request.POST.get('fecha_fin')

    str_extra_empleados = """
    AND E.No_Empleado <> 201312003
    """
    if departamento == "10":
        str_extra_empleados = """
        UNION ALL
        SELECT 
            E.No_Empleado AS codigo,
            E.Nombres AS nombres,
            E.Apellidos AS apellidos
        FROM 
            NominaGB..Empleados E
        INNER JOIN NominaGB..Deptos D ON D.No_Depto = E.No_Depto
        WHERE
            E.Fecha_Baja IS NULL
        AND E.No_Empleado = 201312003
        """

    str_sql = """
        SELECT 
            E.No_Empleado AS codigo,
            E.Nombres AS nombres,
            E.Apellidos AS apellidos
        FROM 
            NominaGB..Empleados E
        INNER JOIN NominaGB..Deptos D ON D.No_Depto = E.No_Depto
        WHERE
            E.Fecha_Baja IS NULL
        AND D.No_Depto = %s
        %s
    """ % (departamento, str_extra_empleados)

    arr_empleados = get_query(str_sql=str_sql)

    arr_feriados = get_query("SELECT nombre, dia, mes, completo, hora FROM foxcore..feriados")

    str_extra_empleados = """
    AND E.No_Empleado <> 201312003
    """
    if departamento == "10":
        str_extra_empleados = """
        GROUP BY CONVERT(VARCHAR, a.fecha, 103), e.No_Empleado, e.nombres, e.apellidos
        
        UNION ALL
        SELECT 
            E.No_Empleado AS codigo,
            CONVERT(VARCHAR, A.fecha, 103) AS fecha, 
            FORMAT(MIN(A.fecha), 'HH:mm:ss') AS entrada, 
            FORMAT(MAX(A.fecha), 'HH:mm:ss') AS salida 
        FROM 
            foxcore..empleado_asistencias A
        INNER JOIN NominaGB..Empleados E ON A.codigo = E.No_Empleado
        INNER JOIN NominaGB..Deptos D ON E.No_Depto = D.No_Depto
        WHERE
            E.No_Empleado = 201312003
        AND A.fecha BETWEEN '%s 00:00:01' AND '%s 23:59:59'
        
        """ % (str_fecha_inicio, str_fecha_fin)

    str_sql = """
        SELECT 
            E.No_Empleado AS codigo,
            CONVERT(VARCHAR, A.fecha, 103) AS fecha, 
            FORMAT(MIN(A.fecha), 'HH:mm:ss') AS entrada, 
            FORMAT(MAX(A.fecha), 'HH:mm:ss') AS salida 
        FROM 
            foxcore..empleado_asistencias A
        INNER JOIN NominaGB..Empleados E ON A.codigo = E.No_Empleado
        INNER JOIN NominaGB..Deptos D ON E.No_Depto = D.No_Depto
        WHERE
            D.No_Depto = %s
        AND A.fecha BETWEEN '%s 00:00:01' AND '%s 23:59:59'
        %s
        GROUP BY CONVERT(VARCHAR, a.fecha, 103), e.No_Empleado, e.nombres, e.apellidos
    """ % (departamento, str_fecha_inicio, str_fecha_fin, str_extra_empleados)

    arr_asistencias = get_query(str_sql=str_sql)
    fecha_inicio = datetime.strptime(str_fecha_inicio, "%Y-%m-%d")
    fecha_fin = datetime.strptime(str_fecha_fin, "%Y-%m-%d")

    reporte = {}

    for arr_empleado in arr_empleados:

        arr_horario = (EmpleadosFoxcore.objects
                       .annotate(descanso=F('departamento__departamentohorariofoxcore__descanso'),
                                 minutos=F('departamento__departamentohorariofoxcore__minutos'),
                                 lunes=F('departamento__departamentohorariofoxcore__lunes'),
                                 martes=F('departamento__departamentohorariofoxcore__martes'),
                                 miercoles=F('departamento__departamentohorariofoxcore__miercoles'),
                                 jueves=F('departamento__departamentohorariofoxcore__jueves'),
                                 viernes=F('departamento__departamentohorariofoxcore__viernes'),
                                 sabado=F('departamento__departamentohorariofoxcore__sabado'),
                                 domingo=F('departamento__departamentohorariofoxcore__domingo'))
                       .filter(codigo=arr_empleado['codigo'])
                       .prefetch_related('departamento__departamentohorariofoxcore_set')
                       .values('descanso', 'minutos', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado',
                               'domingo')
                       .first())

        if arr_empleado['codigo'] not in reporte:
            reporte[arr_empleado['codigo']] = {
                "codigo": arr_empleado['codigo'],
                "nombre": arr_empleado['nombres'] + ' ' + arr_empleado['apellidos'],
                "fechas": [],
            }

        descanso = arr_horario['descanso'] if arr_horario else datetime.strptime("13:00", "%H:%M").time()
        minutos_descando = arr_horario['minutos'] if arr_horario else 60
        lunes = arr_horario['lunes'] if arr_horario else True
        martes = arr_horario['martes'] if arr_horario else True
        miercoles = arr_horario['miercoles'] if arr_horario else True
        jueves = arr_horario['jueves'] if arr_horario else True
        viernes = arr_horario['viernes'] if arr_horario else True
        sabado = arr_horario['sabado'] if arr_horario else False
        domingo = arr_horario['domingo'] if arr_horario else False

        marcas = (list(filter(lambda item: item['codigo'] == arr_empleado['codigo'], arr_asistencias)))
        fecha_inicio_tmp = fecha_inicio
        while fecha_inicio_tmp <= fecha_fin:
            trabaja = False
            feriado = list(filter(lambda item: item['dia'] == fecha_inicio_tmp.day and item['mes'] ==
                                               fecha_inicio_tmp.month, arr_feriados))

            day_of_week = fecha_inicio_tmp.isoweekday()

            if day_of_week == 7 and domingo:
                trabaja = True
            elif day_of_week == 1 and lunes:
                trabaja = True
            elif day_of_week == 2 and martes:
                trabaja = True
            elif day_of_week == 3 and miercoles:
                trabaja = True
            elif day_of_week == 4 and jueves:
                trabaja = True
            elif day_of_week == 5 and viernes:
                trabaja = True
            elif day_of_week == 6 and sabado:
                trabaja = True

            filtro = list(filter(lambda item: item['fecha'] == fecha_inicio_tmp.strftime('%d/%m/%Y'), marcas))

            if not filtro and trabaja:
                if not feriado:
                    reporte[arr_empleado['codigo']]['fechas'].append({
                        'fecha': fecha_inicio_tmp.strftime('%d/%m/%Y'),
                        'dia': DIAS[fecha_inicio_tmp.strftime('%w')],
                        'entrada': None,
                        'salida': None,
                        'horas': None,
                        'simples': None,
                        'dobles': None,
                    })

            elif filtro:
                entrada = datetime.strptime(filtro[0]['entrada'], "%H:%M:%S").time()
                salida = datetime.strptime(filtro[0]['salida'], "%H:%M:%S").time()

                entrada_dt = convertir_a_datetime(entrada)
                salida_dt = convertir_a_datetime(salida)
                descanso_dt = convertir_a_datetime(descanso)

                if entrada == salida:
                    if entrada <= descanso:
                        salida = None
                    else:
                        entrada = None
                    horas = None
                else:
                    delta = salida_dt - entrada_dt
                    horas = delta

                    if salida_dt > descanso_dt:
                        descando_a_salida = (salida_dt - descanso_dt).total_seconds() / 60  # Convertir a minutos

                        if descando_a_salida > minutos_descando:
                            horas -= timedelta(hours=1)
                        else:
                            horas -= timedelta(minutes=descando_a_salida)

                reporte[arr_empleado['codigo']]['fechas'].append({
                    'fecha': fecha_inicio_tmp.strftime('%d/%m/%Y'),
                    'dia': DIAS[fecha_inicio_tmp.strftime('%w')],
                    'entrada': entrada.strftime("%H:%M:%S") if entrada else None,
                    'salida': salida.strftime("%H:%M:%S") if salida else None,
                    'horas': horas.__str__() if horas else None,
                    'simples': None,
                    'dobles': None,
                })

            fecha_inicio_tmp = fecha_inicio_tmp + timedelta(days=1)

    data = {
        "status": True,
        "reporte": reporte,
    }

    return JsonResponse(data, safe=False)


def convertir_a_datetime(hora):
    fecha_base = datetime(2000, 1, 1)
    return datetime.combine(fecha_base, hora)
