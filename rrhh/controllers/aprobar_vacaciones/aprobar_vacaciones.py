from datetime import timedelta

from django.core.mail import EmailMessage
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from core.ares_models import EmpleadosBase
from core.functions import get_query, obtener_rangos_fechas, get_single_query
from core.models import User_departamento
from nova.debug import IMAGEN_GB, DEBUG
from rrhh.models import Empleado_solicitud_vacaciones, Estatus, Empleado_solicitud_vacaciones_detalle
from user_auth.models import User


@login_required(login_url="/login/")
def index(request):
    departamento = User_departamento.objects.filter(user_id=request.user.id).first()
    str_sql = """
        SELECT [auth_user].[name], [rrhh_empleado_solicitud_vacaciones].[dias_solicitados], 
            [rrhh_empleado_solicitud_vacaciones].[created_at], [rrhh_empleado_solicitud_vacaciones].[id],
            [rrhh_empleado_solicitud_vacaciones].[medio_dia]
        FROM [NOVA]..[rrhh_empleado_solicitud_vacaciones]
            INNER JOIN [NOVA]..[auth_user] 
                ON [auth_user].[empleado_id] = [rrhh_empleado_solicitud_vacaciones].[id_empleado]
        WHERE [rrhh_empleado_solicitud_vacaciones].[departamento_id] = %s
            AND [rrhh_empleado_solicitud_vacaciones].[eliminado] = 0
            AND [rrhh_empleado_solicitud_vacaciones].[estatus_id] = %s 
    """
    arr_vacaciones = get_query(str_sql=str_sql,
                               params=(departamento.departamento_id, Estatus.objects.filter(orden=2).first().id),
                               print_debug=False, print_result=False)

    data = {
        "vacaciones": arr_vacaciones,
    }
    return render(request, 'aprobar_vacaciones/aprobar_vacaciones.html', data)


@login_required(login_url="/login/")
def vacacion(request):
    vacacion_id = request.GET.get('vacacion')
    vacacion = Empleado_solicitud_vacaciones.objects.filter(id=vacacion_id).first()

    str_sql = """
        SELECT [auth_user].[name], [rrhh_empleado_solicitud_vacaciones].[dias_solicitados], 
            [rrhh_empleado_solicitud_vacaciones].[created_at], [rrhh_empleado_solicitud_vacaciones].[id]
        FROM [NOVA]..[rrhh_empleado_solicitud_vacaciones]
            INNER JOIN [NOVA]..[auth_user] 
                ON [auth_user].[empleado_id] = [rrhh_empleado_solicitud_vacaciones].[id_empleado]
        WHERE [rrhh_empleado_solicitud_vacaciones].[id] = %s 
    """
    arr_vacacion = get_single_query(str_sql=str_sql, params=(vacacion_id,), print_debug=False,
                                    print_result=False)

    empleado = EmpleadosBase.objects.filter(empleado_id=vacacion.id_empleado, base_id=46,
                                            fecha_baja__isnull=True).first()
    arr_periodos_disponibles = get_query(str_sql="EXEC [NominaGB]..[StatusVacaciones] %s, %s",
                                         params=(empleado.no_empleado, empleado.no_empresa), print_debug=False,
                                         print_result=False)
    arr_periodos = []
    # Restar la cantidad solicitada de total_dias_solicitados a cada periodo['DiasPendientes']
    for periodo in arr_periodos_disponibles:
        if periodo['DiasPendientes'] > 0:
            arr_periodos.append({
                'Periodo': periodo['Periodo'],
                'DiasPendientes': periodo['DiasPendientes'],
            })

    # Obtener todos los registros de Estatus con activo=True
    estados_activos = Estatus.objects.filter(activo=True, orden=2)

    # Lista para almacenar todas las vacaciones nuevas
    vacaciones_nuevas = []

    # Para cada estado activo
    for estatus in estados_activos:
        # Filtrar los detalles de las vacaciones para este estado
        detalles = (Empleado_solicitud_vacaciones_detalle.objects
                    .filter(empleado_solicitud_vacaciones__id_empleado=vacacion.id_empleado,
                            eliminado=False,
                            empleado_solicitud_vacaciones__trasladada_info_nomina=False,
                            empleado_solicitud_vacaciones__eliminado=False,
                            empleado_solicitud_vacaciones__estatus=estatus,
                            empleado_solicitud_vacaciones_id=vacacion_id)
                    .values_list('fecha', flat=True)
                    .order_by('fecha'))

        # Obtener los rangos de fechas para estos detalles
        rangos = obtener_rangos_fechas(detalles)

        # Crear las vacaciones con colores específicos según el estado
        for rango in rangos:
            vacaciones_nuevas.append({
                "estatus_id": estatus.id,
                "title": estatus.estatus,
                "fecha_inicio": rango[0].strftime('%d/%m/%Y'),
                "fecha_fin": rango[1].strftime('%d/%m/%Y'),
                "start": rango[0].strftime('%Y-%m-%d'),
                "end": (rango[1] + timedelta(days=1)).strftime('%Y-%m-%d'),
                "backgroundColor": estatus.color,
                "textColor": 'black' if estatus.color == '#FFFF00' else '',
            })

    data = {
        "vacacion_detalle": arr_vacacion,
        "periodos_disponibles": arr_periodos,
        "historico_vacaciones": vacaciones_nuevas,
    }
    return render(request, 'aprobar_vacaciones/vacacion.html', data)


@login_required(login_url="/login/")
def aprobar_vacacion(request):
    try:
        vacaciones = Empleado_solicitud_vacaciones.objects.get(id=request.POST.get('vacacion_id'))
        vacaciones.estatus_id = Estatus.objects.filter(orden=4).first().id
        vacaciones.id_jefe_autorizo_id = request.user.id
        vacaciones.save()

        empleado = User.objects.filter(empleado_id=vacaciones.id_empleado, active=True, is_active=True).first()
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
                                            {empleado.name} tu solicitud de vacaciones fue aprobada por 
                                            {request.user.name}, puedes ir a oficinas de RRHH a firmar tu carta de 
                                            vacaciones.
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
        if not DEBUG:
            arr_emails = [empleado.email]
            msg = EmailMessage(subject="Solicitud de vacaciones aprobada", body=str_html,
                               from_email='nova@grupobuena.com', to=arr_emails,
                               cc=['nrodriguez@grupobuena.com'])
            msg.content_subtype = "html"
            msg.send()

        return JsonResponse({
            'status': True,
            'msg': 'Solicitud aprobada',
            'msj': 'Solicitud aprobada'
        }, safe=False)
    except Empleado_solicitud_vacaciones.DoesNotExist:
        return JsonResponse({
            'status': False,
            'msg': 'Solicitud de vacación no existente',
            'msj': 'Solicitud de vacación no existente'
        }, safe=False)
    except Exception as e:
        return JsonResponse({'status': False, 'msg': str(e), 'msj': str(e)}, safe=False)


@login_required(login_url="/login/")
def rechazar_vacacion(request):
    vacacion_id = request.POST.get('vacacion_id')
    motivo_rechazo = request.POST.get('motivo_rechazo')
    try:
        vacaciones = Empleado_solicitud_vacaciones.objects.get(id=vacacion_id)
        vacaciones.estatus_id = Estatus.objects.filter(orden=3).first().id
        vacaciones.motivo_rechazo = motivo_rechazo
        vacaciones.save()

        empleado = User.objects.filter(empleado_id=vacaciones.id_empleado, active=True, is_active=True).first()
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
                                            {empleado.name} tu solicitud de vacaciones fue rechazada por 
                                            {request.user.name} con el motivo siguiente: <br>
                                            {motivo_rechazo}
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
        if not DEBUG:
            arr_emails = [empleado.email]
            msg = EmailMessage("Solicitud de vacaciones rechazada", str_html, 'nova@grupobuena.com', arr_emails)
            msg.content_subtype = "html"
            msg.send()

        return JsonResponse({
            'status': True,
            'msg': 'Solicitud rechazada',
            'msj': 'Solicitud rechazada'
        }, safe=False)
    except Empleado_solicitud_vacaciones.DoesNotExist:
        return JsonResponse({
            'status': False,
            'msg': 'Solicitud de vacación no existente',
            'msj': 'Solicitud de vacación no existente'
        }, safe=False)
    except Exception as e:
        return JsonResponse({
            'status': False,
            'msg': str(e),
            'msj': str(e)
        }, safe=False)
