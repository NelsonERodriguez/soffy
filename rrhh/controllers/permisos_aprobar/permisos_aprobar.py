from django.core.mail import EmailMessage
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from core.functions import get_query
from core.models import User_departamento
from nova.debug import IMAGEN_GB, DEBUG
from rrhh.models import Permisos_empleados, Permisos_estatus


@login_required(login_url="/login/")
def index(request):
    departamento = User_departamento.objects.filter(user_id=request.user.id).first()
    str_sql = """
        SELECT [auth_user].[name], [rrhh_permisos_empleados].[observacion], [rrhh_permisos_empleados].[fecha_inicio],
            [rrhh_permisos_empleados].[fecha_fin], [rrhh_permisos_empleados].[fecha_solicitud],
            [rrhh_permisos_tipos].[nombre] [tipo], [rrhh_permisos_empleados].[id]
        FROM [NOVA]..[rrhh_permisos_empleados]
            INNER JOIN [NOVA]..[rrhh_permisos_tipos] ON [rrhh_permisos_tipos].[id]= [rrhh_permisos_empleados].[tipo_id]
            INNER JOIN [NOVA]..[auth_user] ON [auth_user].[id] = [rrhh_permisos_empleados].[usuario_id]
        WHERE [rrhh_permisos_empleados].[estatus_id] = %s
            AND [rrhh_permisos_empleados].[departamento_id] = %s
    """
    arr_permiso = get_query(str_sql=str_sql,
                            params=(Permisos_estatus.objects.filter(orden=2).first().id, departamento.departamento_id))

    data = {
        "permisos": arr_permiso,
    }
    return render(request, 'permisos_aprobar/permisos_aprobar.html', data)


@login_required(login_url="/login/")
def aprobar_permiso(request):
    try:
        permiso = Permisos_empleados.objects.select_related('usuario').get(id=request.POST.get('permiso_id'))
        permiso.estatus_id = Permisos_estatus.objects.filter(orden=4).first().id
        permiso.save()

        if not DEBUG:
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
                                                <h2>Notificación de solicitud de permiso laboral.</h2>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center; padding: 20px;">
                                                {permiso.usuario.name} tu solicitud de permiso fue aprobada por 
                                                {request.user.name}, puedes ir a oficinas de RRHH a firmar tu carta de 
                                                permiso.
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

            arr_emails = [permiso.usuario.email]
            msg = EmailMessage(subject="Solicitud de permiso aprobada", body=str_html,
                               from_email='nrodriguez@grupobuena.com', to=arr_emails,
                               cc=['nrodriguez@grupobuena.com'])
            msg.content_subtype = "html"
            msg.send()

        return JsonResponse({
            'status': True,
            'msg': 'Permiso aprobada',
            'msj': 'Permiso aprobada'
        }, safe=False)
    except Permisos_empleados.DoesNotExist:
        return JsonResponse({
            'status': False,
            'msg': 'Solicitud de permiso no existente',
            'msj': 'Solicitud de permiso no existente'
        }, safe=False)
    except Exception as e:
        return JsonResponse({'status': False, 'msg': str(e), 'msj': str(e)}, safe=False)


@login_required(login_url="/login/")
def rechazar_permiso(request):
    permiso_id = request.POST.get('permiso_id')
    motivo_rechazo = request.POST.get('motivo_rechazo')
    try:
        permiso = Permisos_empleados.objects.get(id=permiso_id)
        permiso.motivo_rechazo = motivo_rechazo
        permiso.estatus_id = Permisos_estatus.objects.filter(orden=3).first().id
        permiso.save()

        if not DEBUG:
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
                                                <h2>Notificación de solicitud de permiso laboral.</h2>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center; padding: 20px;">
                                                {permiso.usuario.name} tu solicitud de permiso fue rechazada por 
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

            arr_emails = [permiso.usuario.email]
            msg = EmailMessage("Solicitud de permiso rechazada", str_html, 'nova@grupobuena.com', arr_emails)
            msg.content_subtype = "html"
            msg.send()

        return JsonResponse({
            'status': True,
            'msg': 'Permiso rechazada',
            'msj': 'Permiso rechazada'
        }, safe=False)
    except Permisos_empleados.DoesNotExist:
        return JsonResponse({
            'status': False,
            'msg': 'Solicitud de permiso no existente',
            'msj': 'Solicitud de permiso no existente'
        }, safe=False)
    except Exception as e:
        return JsonResponse({
            'status': False,
            'msg': str(e),
            'msj': str(e)
        }, safe=False)
