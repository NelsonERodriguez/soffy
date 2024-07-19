from datetime import datetime, timedelta

from django.core.mail import EmailMessage

from django.db import transaction
from django.db.models import CharField, Func, Value, Sum
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from core.ares_models import EmpleadosBase
from core.nominagb_models import EmpleadosconceptosNominaGB
from core.models import User_departamento, Autorizadores_vacaciones
from core.functions import get_query, obtener_rangos_fechas, encriptar_datos
from soffybiz.debug import DEBUG, IMAGEN_GB, clave_compartida
from rrhh.models import Empleado_solicitud_vacaciones, Empleado_solicitud_vacaciones_detalle, Estatus
from django.http import JsonResponse


class DateFormatHistorial(Func):
    function = 'FORMAT'
    template = "%(function)s(%(expressions)s, 'yyyy-MM-dd')"


@login_required(login_url="/login/")
def index(request):
    empleado = EmpleadosBase.objects.filter(empleado_id=request.user.empleado_id, base_id=46,
                                            fecha_baja__isnull=True).first()
    arr_periodos_disponibles = get_query(str_sql="EXEC [NominaGB]..[StatusVacaciones] %s, %s",
                                         params=(empleado.no_empleado, empleado.no_empresa), print_debug=False,
                                         print_result=False) if empleado else []

    int_total_dias_disponibles_periodos = sum(
        periodo['DiasPendientes'] for periodo in arr_periodos_disponibles if
        periodo['DiasPendientes'] > 0) if arr_periodos_disponibles else 0

    dias_solicitados = (Empleado_solicitud_vacaciones.objects
                        .filter(trasladada_info_nomina=False, id_empleado=request.user.empleado_id,
                                eliminado=False,
                                estatus_id__in=Estatus.objects.exclude(orden=3))
                        .aggregate(total_dias=Sum('dias_solicitados')))
    total_dias_solicitados = dias_solicitados['total_dias'] if dias_solicitados and dias_solicitados[
        'total_dias'] else 0

    int_total_dias_disponibles = int_total_dias_disponibles_periodos - total_dias_solicitados

    arr_periodos = []
    # Variable temporal para almacenar el valor restante de total_dias_solicitados
    dias_solicitados_restantes = total_dias_solicitados

    # Restar la cantidad solicitada de total_dias_solicitados a cada periodo['DiasPendientes']
    for periodo in arr_periodos_disponibles:
        if periodo['DiasPendientes'] > 0:
            dias_pendientes_restantes = periodo['DiasPendientes'] - dias_solicitados_restantes
            if dias_pendientes_restantes > 0:
                arr_periodos.append({
                    'Periodo': periodo['Periodo'],
                    'DiasPendientes': dias_pendientes_restantes,
                })
                dias_solicitados_restantes = 0
            else:
                dias_solicitados_restantes -= periodo['DiasPendientes']

    no_empleado = list(EmpleadosBase.objects
                       .filter(empleado_id=request.user.empleado_id, base_id=46).values_list('no_empleado', flat=True))
    vacaciones = list(EmpleadosconceptosNominaGB.objects
                      .filter(noempleado__in=no_empleado, noestado=1, monto__isnull=True)
                      .annotate(start=DateFormatHistorial('fechainicio'),
                                end=DateFormatHistorial('fechafin'),
                                title=Value('Vacaciones', output_field=CharField()),
                                backgroundColor=Value('#02C028', output_field=CharField()))
                      .values('start', 'end', 'cantidad', 'title', 'backgroundColor'))

    # Obtener todos los registros de Estatus con activo=True
    estados_activos = Estatus.objects.filter(activo=True)

    # Lista para almacenar todas las vacaciones nuevas
    vacaciones_nuevas = []

    bool_vacaciones_no_firmadas = False
    # Para cada estado activo
    for estatus in estados_activos:
        # Filtrar los detalles de las vacaciones para este estado
        detalles = (Empleado_solicitud_vacaciones_detalle.objects
                    .filter(empleado_solicitud_vacaciones__id_empleado=request.user.empleado_id,
                            eliminado=False,
                            empleado_solicitud_vacaciones__trasladada_info_nomina=False,
                            empleado_solicitud_vacaciones__eliminado=False,
                            empleado_solicitud_vacaciones__estatus=estatus)
                    .values_list('fecha', flat=True)
                    .order_by('fecha'))

        if estatus.orden != 3 and estatus.orden != 6 and detalles.count() > 0:
            bool_vacaciones_no_firmadas = True

        # Obtener los rangos de fechas para estos detalles
        rangos = obtener_rangos_fechas(detalles)

        # Crear las vacaciones con colores específicos según el estado
        for rango in rangos:
            vacaciones_nuevas.append({
                "estatus_id": estatus.id,
                "title": estatus.estatus,
                "start": rango[0].strftime('%Y-%m-%d'),
                "end": (rango[1] + timedelta(days=1)).strftime('%Y-%m-%d'),
                "backgroundColor": estatus.color,
                "textColor": 'black' if estatus.color == '#FFFF00' else '',
                "classNames": ['cursorPointer'],
            })

    data = {
        "periodos_disponibles": arr_periodos,
        "historico_vacaciones": vacaciones + vacaciones_nuevas,
        "vacaciones_nuevas": vacaciones_nuevas,
        "total_dias_disponibles": int_total_dias_disponibles,
        "vacaciones_no_firmadas": bool_vacaciones_no_firmadas,
    }
    return render(request, 'solicitud_vacaciones/solicitud_vacaciones.html', data)


@login_required(login_url="/login/")
def save_solicitud_vacaciones(request):
    departamento = User_departamento.objects.filter(user_id=request.user.id).values('departamento_id').first()
    arr_fecha_inicio = request.POST.getlist('fecha_inicio[]')
    arr_fecha_fin = request.POST.getlist('fecha_fin[]')
    arr_periodos = request.POST.getlist('periodos[]')

    list_vacaciones = []
    list_fechas = []

    int_row = 0
    for fecha_inicio, fecha_fin in zip(arr_fecha_inicio, arr_fecha_fin):
        fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d') - timedelta(days=1)

        arr_split_periodos = arr_periodos[int_row].split(';')
        delta = fecha_fin - fecha_inicio
        int_count = 0
        for i in range(delta.days + 1):
            fecha = fecha_inicio + timedelta(days=i)
            if fecha.weekday() < 5:
                list_vacaciones.append({"fecha": fecha, "periodo": arr_split_periodos[int_count]})
                list_fechas.append(fecha)
                int_count = int_count + 1

        int_row = int_row + 1

    fecha_mas_baja = min(list_fechas)
    fecha_mas_alta = max(list_fechas)

    try:
        with transaction.atomic():
            solicitud = Empleado_solicitud_vacaciones.objects.create(
                id_empleado=request.user.empleado_id,
                estatus_id=Estatus.objects.filter(orden=2).first().id,
                departamento_id=departamento['departamento_id'] if departamento else None,
                dias_solicitados=request.POST.get('dias_solicitados'),
                fecha_inicio=fecha_mas_baja,
                fecha_fin=fecha_mas_alta,
                id_jefe_autorizo=None,
                medio_dia=request.POST.get('medio_dia', 0),
            )

            detalles = []
            for detalle in list_vacaciones:
                vacacion_detalle = Empleado_solicitud_vacaciones_detalle(
                    empleado_solicitud_vacaciones_id=solicitud.id,
                    fecha=detalle['fecha'],
                    periodo=detalle['periodo']
                )
                detalles.append(vacacion_detalle)

            Empleado_solicitud_vacaciones_detalle.objects.bulk_create(detalles)

            str_fecha = ', '.join([str(item.strftime('%d/%m/%Y')) for item in list_fechas])
            if not DEBUG:
                user_autoriza = (
                    Autorizadores_vacaciones.objects
                    .select_related('autorizador')
                    .filter(
                        departamento_id=User_departamento.objects.filter(user_id=request.user.id,
                                                                         activo=True).first().departamento_id,
                        activo=True
                    ).values_list('autorizador__email', 'autoriza')
                )
                if user_autoriza:
                    for email, autoriza in user_autoriza:
                        str_button = ""
                        if autoriza:
                            datos_originales = (f"rrhh/aprobar_vacaciones/vacacion/?solicitud_id={solicitud.id}"
                                                f"&usuario={email}")
                            datos_encriptados = encriptar_datos(datos_originales, clave_compartida)

                            str_button = F"""
                            <a type="button" style="padding: 10px 15px; margin: 15px; background-color: #4caf50; 
                                color: white; cursor: pointer; border-radius: 10px; text-decoration: none;"
                                target="_blank" 
                                href="https://nova.ffinter.com/login/?encrypt_vacaciones={datos_encriptados.decode()}">
                                Aprobar vacaciones
                            </a>
                            """
                        str_html = f"""
                            <table style="width: 100%%;">
                                <tbody>
                                    <tr>
                                        <td width="25%%">&nbsp;</td>
                                        <td width="50%%">
                                            <table style="width: 100%%; border: 1px solid #dddddd; border-radius: 3px;">
                                                <tbody>
                                                    <tr>
                                                        <td style="text-align: center; padding: 20px;">
                                                            <img src="{IMAGEN_GB}" alt="No se puedo cargar la imagen" 
                                                            style="width: 100%%" width="100%%">
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="background: #333333;color: white;text-align:center;">
                                                            <h2>Notificación de solicitud de vacaciones.</h2>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align: center; padding: 20px;">
                                                            {request.user.name} solícita vacaciones para la(s) fecha(s): 
                                                            <br>
                                                            {str_fecha}
                                                            <br><br>
                                                            {str_button}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                        <td width="35%%">&nbsp;</td>
                                    </tr>
                                </tbody>
                            </table>
                        """
                        arr_emails = [email]
                        str_subject = "Solicitud de vacaciones" if solicitud.medio_dia else ("Solicitud de medio día "
                                                                                             "de vacación")
                        msg = EmailMessage(subject=str_subject, body=str_html,
                                           from_email='nova@grupobuena.com', to=arr_emails)
                        msg.content_subtype = "html"
                        msg.send()

        return JsonResponse({
            'status': True,
            'msg': 'Solicitud ingresada',
            'msj': 'Solicitud ingresada',
        }, safe=False)

    except Exception as e:

        return JsonResponse({
            'status': False,
            'msg': f'Error al grabar la solicitud: {str(e)}',
            'msj': f'Error al grabar la solicitud: {str(e)}',
        }, safe=False)
