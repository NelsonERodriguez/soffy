import os
from django.core.mail import EmailMessage

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from sqlescapy import sqlescape

from core.models import Autorizadores_vacaciones
from core.functions import get_query
from soffybiz import settings
from soffybiz.debug import DEBUG, IMAGEN_GB
from rrhh.models import Empleado_solicitud_vacaciones
from django.http import JsonResponse, FileResponse, HttpResponse

from user_auth.models import User


@login_required(login_url="/login/")
def index(request):
    departamentos = (Autorizadores_vacaciones.objects.select_related('departamento')
                     .filter(autorizador_id=request.user.id, autoriza=True, activo=True)
                     .values('departamento__nombre', 'departamento_id'))
    data = {
        "departamentos": departamentos,
    }
    return render(request, 'imprimir_vacaciones/imprimir_vacaciones.html', data)


@login_required(login_url="/login/")
def listado_solicitudes_impresion(request):
    str_departamento = request.POST.get("strDepartamento")

    str_query = f"""
            SELECT
                [rrhh_empleado_solicitud_vacaciones].[id], [core_departamento].[nombre] [nombre_depto],
                [auth_user].[name] [nombre_completo], [rrhh_empleado_solicitud_vacaciones].[fecha_inicio],
                [rrhh_empleado_solicitud_vacaciones].[fecha_fin],
                [rrhh_empleado_solicitud_vacaciones].[dias_solicitados], [rrhh_estatus].[estatus],
                [rrhh_empleado_solicitud_vacaciones].[estatus_id]
            FROM [NOVA]..[rrhh_empleado_solicitud_vacaciones]
                INNER JOIN [NOVA]..[auth_user]
                    ON [auth_user].[empleado_id] = [rrhh_empleado_solicitud_vacaciones].[id_empleado]
                INNER JOIN [NOVA]..[core_departamento]
                    ON [core_departamento].[id] = [rrhh_empleado_solicitud_vacaciones].[departamento_id]
                INNER JOIN [NOVA]..[rrhh_estatus]
                    ON [rrhh_estatus].[id] = [rrhh_empleado_solicitud_vacaciones].[estatus_id]
            WHERE
                [rrhh_empleado_solicitud_vacaciones].[estatus_id] IN (4, 5)
            AND [auth_user].[empleado_id] = {request.user.empleado_id}
        """

    if str_departamento:
        str_filtro = ""
        if str_departamento != "0":
            str_filtro = f"AND [rrhh_empleado_solicitud_vacaciones].[departamento_id] = {sqlescape(str_departamento)}"

        str_query += f"""
                UNION
                SELECT
                    [rrhh_empleado_solicitud_vacaciones].[id], [core_departamento].[nombre] [nombre_depto], 
                    [auth_user].[name] [nombre_completo], [rrhh_empleado_solicitud_vacaciones].[fecha_inicio], 
                    [rrhh_empleado_solicitud_vacaciones].[fecha_fin], 
                    [rrhh_empleado_solicitud_vacaciones].[dias_solicitados], [rrhh_estatus].[estatus], 
                    [rrhh_empleado_solicitud_vacaciones].[estatus_id]
                FROM [NOVA]..[rrhh_empleado_solicitud_vacaciones]
                    INNER JOIN [NOVA]..[auth_user] 
                        ON [auth_user].[empleado_id] = [rrhh_empleado_solicitud_vacaciones].[id_empleado]
                    INNER JOIN [NOVA]..[core_departamento] 
                        ON [core_departamento].[id] = [rrhh_empleado_solicitud_vacaciones].[departamento_id]
                    INNER JOIN [NOVA]..[rrhh_estatus] 
                        ON [rrhh_estatus].[id] = [rrhh_empleado_solicitud_vacaciones].[estatus_id]
                WHERE 
                    [rrhh_empleado_solicitud_vacaciones].[estatus_id] IN (4, 5)
                {str_filtro}
            """

    obj_listado = get_query(str_sql=str_query)

    obj_json = {
        "data": obj_listado,
        "status": True,
        "msg": "Se muestran las solicitudes de vacaciones por imprimir.",
        "msj": "Se muestran las solicitudes de vacaciones por imprimir.",
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def imprimir(request, pk):
    pdf_path = os.path.join(settings.MEDIA_ROOT, 'hoja_vacaciones.pdf')

    try:
        obj_solicitud = Empleado_solicitud_vacaciones.objects.get(id=int(pk))

        if not obj_solicitud.usuario_imprimio_id:
            obj_solicitud.estatus_id = 5

        obj_solicitud.usuario_imprimio_id = request.user.id

        obj_solicitud.save()

        empleado = User.objects.filter(empleado_id=obj_solicitud.id_empleado, active=True, is_active=True).first()
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
                                                    {empleado.name} tu solicitud de vacaciones fue impresa.
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

            msg = EmailMessage("Solicitud de vacaciones impresa", str_html, 'nrodriguez@grupobuena.com', arr_emails)
            msg.content_subtype = "html"
            msg.send()

        if os.path.exists(pdf_path):
            response = FileResponse(open(pdf_path, 'rb'), content_type='application/pdf')
            return response
        else:
            return HttpResponse('El archivo PDF no se encontró.', status=404)

    except Empleado_solicitud_vacaciones.DoesNotExist:
        return HttpResponse('Solicitud no encontrada.', status=404)

    except Exception as e:
        return HttpResponse(f'Ocurrió un error: {str(e)}', status=404)
