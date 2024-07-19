import json
import os
from datetime import datetime, timedelta
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse, FileResponse
from django.db.models import F, Func, Value, DateField, Q, CharField, Sum, Subquery, OuterRef
from django.db.models.functions import Concat, Cast
from django.template.loader import render_to_string
from sqlescapy import sqlescape

from core.functions import get_query, obtener_rangos_fechas, insert_query, render_to_pdf
from core.models import Departamento, Autorizadores_vacaciones, User_departamento
from nova import settings
from nova.debug import IMAGEN_GB, DEBUG
from rrhh.models import Empleado_solicitud_vacaciones, Estatus, Empleado_solicitud_vacaciones_detalle
from user_auth.models import User
from core.nominagb_models import EmpleadosconceptosNominaGB, EmpleadosNominaGB, EmpresasNominaGB
from core.nominagbf_models import EmpleadosconceptosNominaGBF
from core.nominagbv_models import EmpleadosconceptosNominaGBV
from core.ares_models import EmpleadosBase, EmpleadosMaster
from django.core.mail import EmailMessage
from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration


class DateFormatHistorial(Func):
    function = 'FORMAT'
    template = "%(function)s(%(expressions)s, 'yyyy-MM-dd')"


@login_required(login_url="/login/")
def index(request):
    obj_departamentos = Departamento.objects.all()

    obj_no_empleados = list(EmpleadosNominaGB.objects.filter(
        fecha_alta__isnull=False,
        fecha_baja__isnull=True
    ).values_list('no_empleado', flat=True))

    obj_empleados = EmpleadosBase.objects.filter(
        no_empleado__in=obj_no_empleados,
        base_id=46
    ).annotate(
        nombre_completo=Concat('empleado_id__nombre', Value(' '), 'empleado_id__apellido')
    ).values('nombre_completo', 'no_empleado', 'empleado_id')

    data = {
        "departamentos": obj_departamentos,
        "empleados_master": obj_empleados,
    }

    return render(request, 'vacaciones/autorizacion_rrhh.html', data)


@login_required(login_url="/login/")
def get_empleados(request):
    str_departamento = request.POST.get("strDepartamento")

    obj_users = User.objects.filter(
        empleado_id__isnull=False
    )

    if str_departamento != "":
        obj_users = obj_users.filter(
            user_departamento__departamento_id=int(str_departamento),
            user_departamento__activo=True,
        )

    obj_users = list(obj_users.values_list('empleado_id', flat=True))

    obj_empleados = list(EmpleadosBase.objects.filter(
        empleado_id__in=obj_users,
        fecha_alta__isnull=False,
        fecha_baja__isnull=True,
        base_id=46
    ).annotate(
        nombre_completo=Concat('empleado_id__nombre', Value(' '), 'empleado_id__apellido')
    ).values('nombre_completo', 'no_empleado', 'empleado_id'))

    bool_error = not len(obj_empleados) > 0
    obj_json = {
        "data": {'empleados': obj_empleados},
        "status": True if not bool_error else False,
        "msj": "Se muestran los empleados del departamento seleccionado." if not bool_error
        else "No se encontraron empleados para los departamentos seleccionados."
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def listado_solicitudes(request):
    str_departamento = request.POST.get("strDepartamento")
    str_empleado = request.POST.get("strEmpleado")
    bool_finalizada = int(request.POST.get("boolFinalizadas", "0"))

    str_filtro_departamento = ""
    str_filtro_empleado = ""
    str_estados = "4,5"

    if str_departamento != "0":
        str_filtro_departamento = "AND resv.departamento_id = "+sqlescape(str_departamento)
    if str_empleado != "0":
        str_filtro_empleado = "AND resv.id_empleado = "+sqlescape(str_empleado)
    if bool_finalizada == 1:
        str_estados = "6"

    str_query = f"""
            select resv.id, d.nombre as nombre_depto, no_emp.no_empleado,
            CONCAT(em.nombre, ' ', em.apellido) AS nombre_completo, resv.fecha_inicio,
            resv.fecha_fin, resv.dias_solicitados, re.estatus, resv.estatus_id
            from NOVA..rrhh_empleado_solicitud_vacaciones as resv
            left join ares..empleados_master as em
            on resv.id_empleado = em.id
            left join (select * from (SELECT empleado_id, no_empleado, ROW_NUMBER() OVER (
                        PARTITION BY empleado_id ORDER BY fecha_alta DESC, no_empleado ASC
                    ) AS rn FROM ares..empleados_base WHERE base_id = 46 AND fecha_alta IS NOT NULL AND fecha_baja IS NULL
                ) d where rn = 1) as no_emp
            on resv.id_empleado = no_emp.empleado_id
            inner join NOVA..core_departamento as d
            on d.id = resv.departamento_id
            inner join NOVA..rrhh_estatus as re
            on re.id = resv.estatus_id
            where resv.estatus_id in({str_estados})
            {str_filtro_departamento}
            {str_filtro_empleado}
        """

    obj_listado = get_query(str_query)

    bool_error = not len(obj_listado) > 0
    obj_json = {
        "data": obj_listado,
        "status": True if not bool_error else False,
        "msj": "Se muestran las solicitudes con acciones pendientes por parte de RRHH." if not bool_error
        else "No se encontraron solicitudes con acciones pendientes por parte de RRHH."
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def imprimir(request, pk):
    int_id = pk

    obj_solicitud = Empleado_solicitud_vacaciones.objects.get(id=int(int_id))

    if not obj_solicitud.usuario_imprimio_id:
        obj_solicitud.estatus_id = 5

    obj_solicitud.usuario_imprimio_id = request.user.id

    obj_solicitud.save()

    obj_detalles = (Empleado_solicitud_vacaciones_detalle.objects.
                    filter(empleado_solicitud_vacaciones=int(int_id)).
                    order_by("fecha"))

    obj_empleado = EmpleadosMaster.objects.get(id=int(obj_solicitud.id_empleado))
    obj_empleado_base = EmpleadosBase.objects.filter(
        empleado_id=int(obj_solicitud.id_empleado),
        fecha_alta__isnull=False,
        fecha_baja__isnull=True,
        base_id=46,
    ).order_by("-fecha_alta").first()

    obj_empresa = EmpresasNominaGB.objects.get(no_empresa=obj_empleado_base.no_empresa)

    user_autoriza = (
        Autorizadores_vacaciones.objects
        .select_related('autorizador')
        .filter(
            departamento_id=obj_solicitud.departamento_id,
            activo=True
        ).values_list('autorizador__email', 'autorizador__name')
    ).first()

    encargado = user_autoriza[1] if user_autoriza else ""

    obj_fechas = {}
    int_total_dias = 0
    for detalle in obj_detalles:
        fecha_row = detalle.fecha
        if not detalle.periodo in obj_fechas:
            obj_fechas[detalle.periodo] = {
                "periodo": detalle.periodo,
                "fechas": [],
                "cantidad": 0,
            }

        obj_fechas[detalle.periodo]["cantidad"] = obj_fechas[detalle.periodo]["cantidad"] + 1
        obj_fechas[detalle.periodo]["fechas"].append(fecha_row)

        int_total_dias = int_total_dias + 1

    data = {
        "fecha": obj_solicitud.created_at,
        "fechas_solicitadas": obj_fechas,
        "total_dias": int_total_dias,
        "nombre_encargado": encargado,
        "solicitud": obj_solicitud,
        "detalle": obj_detalles,
        "empleado": obj_empleado,
        "empleado_base": obj_empleado_base,
        "empresa": obj_empresa,
    }

    html = render_to_string("vacaciones/pdf/solicitud_vacaciones_2024.html", data)

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; Solicitud Vacaciones.pdf"

    font_config = FontConfiguration()
    HTML(string=html).write_pdf(response, font_config=font_config)

    return response


@login_required(login_url="/login/")
def imprimir_viejo(request, pk):
    pdf_path = os.path.join(settings.MEDIA_ROOT, 'hoja_vacaciones.pdf')

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
                                     za   <tr>
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
                                                {empleado.name} tu solicitud de vacaciones fue impresa y la puedes ir a firmar a RRHH.
                                   ddd         </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td width="35%%">&nbsp;</td>
                        </tr>
                    </tbody>
                </table>
            """
    # ToDo buscar al jefe para enviar email
    if not DEBUG:
        arr_emails = [empleado.email, "iramirez@grupobuena.com", "marlenef@grupobuena.com"]

        msg = EmailMessage("Solicitud de vacaciones aprobada", str_html, 'nova@grupobuena.com', arr_emails)
        msg.content_subtype = "html"
        msg.send()

    if os.path.exists(pdf_path):
        response = FileResponse(open(pdf_path, 'rb'), content_type='application/pdf')
        return response
    else:
        return HttpResponse('El archivo PDF no se encontró.', status=404)


@login_required(login_url="/login/")
def finalizar(request):
    int_id = request.POST.get("intId", "0")

    obj_solicitud = Empleado_solicitud_vacaciones.objects.get(id=int(int_id))

    obj_detalles = (Empleado_solicitud_vacaciones_detalle.objects.
                    filter(empleado_solicitud_vacaciones=int(int_id)).
                    order_by("fecha"))

    obj_inserts = {}
    fecha_anterior = ''
    str_periodo_anterior = ''
    int_key = 0
    for detalle in obj_detalles:
        fecha_row = detalle.fecha
        if fecha_anterior != '':
            if fecha_row == (fecha_anterior + timedelta(days=1)):
                if detalle.periodo != str_periodo_anterior:
                    int_key = int_key + 1
            else:
                int_key = int_key + 1

        if not int_key in obj_inserts:
            obj_inserts[int_key] = {
                "fecha_inicio": fecha_row,
                "fecha_fin": "",
                "periodo": detalle.periodo,
                "cantidad": 0,
            }

        obj_inserts[int_key]["fecha_fin"] = fecha_row
        obj_inserts[int_key]["cantidad"] = obj_inserts[int_key]["cantidad"] + 1

        fecha_anterior = fecha_row
        str_periodo_anterior = detalle.periodo

    obj_empleados = list(EmpleadosBase.objects.filter(
        empleado_id=obj_solicitud.id_empleado,
        base_id=46
    ).values_list('no_empleado', flat=True))

    obj_no_empleados = EmpleadosNominaGB.objects.filter(
        fecha_alta__isnull=False,
        fecha_baja__isnull=True,
        no_empleado__in=obj_empleados
    ).order_by('-fecha_alta').values('no_empleado')

    if obj_no_empleados:
        for key_ins, value_ins in obj_inserts.items():
            str_query = f"""
            INSERT INTO NominaGB..EmpleadosConceptos(NoEmpleado, NoConcepto, FechaInicio, FechaFin, Monto, Cantidad,
            FechaPago, NumeroCheque, Observaciones, NoUsuario, Operado, Periodo, FormaPago, NoEstado) VALUES(
            {obj_no_empleados[0]["no_empleado"]}, 1, '{value_ins["fecha_inicio"]}', '{value_ins["fecha_fin"]}', NULL,
            {value_ins["cantidad"]}, GETDATE(), NULL, NULL, {request.user.id}, GETDATE(), '{value_ins["periodo"]}',
            NULL, 1)
            """
            obj_inserted = insert_query(str_query)

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
                                            {empleado.name}, el proceso de tu solicitud de vacaciones fue finalizado 
                                            correctamente. Feliz descanso.
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
        # ToDo buscar al jefe para enviar email
        if not DEBUG:
            arr_emails = [empleado.email, "iramirez@grupobuena.com", "marlenef@grupobuena.com"]

            msg = EmailMessage("Solicitud de vacaciones aprobada", str_html, 'nova@grupobuena.com', arr_emails)
            msg.content_subtype = "html"
            msg.send()

        obj_solicitud.estatus_id = 6
        obj_solicitud.trasladada_info_nomina = True
        obj_solicitud.save()

        obj_json = {
            "data": {},
            "status": True,
            "msj": "Se finalizó exitosamente la solicitud de vacaciones y se removió de este listado."
        }
    else:
        obj_json = {
            "data": {},
            "status": False,
            "msj": "No se pudo finalizar el proceso de solicitud de vacaciones ya que no esta bien configurado este "
                   "empleado. Comunicarse a IT."
        }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def ver(request):
    vacacion_id = int(request.POST.get("intId", "0"))
    vacacion = Empleado_solicitud_vacaciones.objects.filter(id=vacacion_id).first()

    str_sql = """
            SELECT [auth_user].[name], [rrhh_empleado_solicitud_vacaciones].[dias_solicitados], 
                [rrhh_empleado_solicitud_vacaciones].[created_at], [rrhh_empleado_solicitud_vacaciones].[id]
            FROM [NOVA]..[rrhh_empleado_solicitud_vacaciones]
                INNER JOIN [NOVA]..[auth_user] 
                    ON [auth_user].[empleado_id] = [rrhh_empleado_solicitud_vacaciones].[id_empleado]
            WHERE [rrhh_empleado_solicitud_vacaciones].[id] = %s 
        """
    arr_vacacion_detalle = get_query(str_sql=str_sql, params=(vacacion_id,), print_debug=False, print_result=False)

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
    estados_activos = Estatus.objects.filter(activo=True, orden__in=[4, 5])

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
                "start": rango[0].strftime('%Y-%m-%d')+" 00:00:00",
                "end": (rango[1]).strftime('%Y-%m-%d')+" 23:59:59",
                "backgroundColor": estatus.color,
                "textColor": 'black' if estatus.color == '#FFFF00' else '',
            })

    data = {
        "vacacion_detalle": arr_vacacion_detalle[0],
        "periodos_disponibles": arr_periodos,
        "historico_vacaciones": vacaciones_nuevas,
    }

    html = render_to_string('vacaciones/autorizacion_rrhh_ver.html', data)

    obj_json = {
        "data": html,
        "periodos_disponibles": arr_periodos,
        "historico_vacaciones": vacaciones_nuevas,
        "status": True if vacacion else False,
        "msj": "Se muestra el detalle de la solicitud." if vacacion
        else "No se encontró la solicitud seleccionado."
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def rechazar(request):
    int_id = request.POST.get("intId", "0")
    str_motivo = request.POST.get("strMotivoRechazo", "0")

    obj_solicitud = Empleado_solicitud_vacaciones.objects.get(id=int(int_id))
    obj_solicitud.estatus_id = 3
    obj_solicitud.motivo_rechazo = str_motivo
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
                                        {empleado.name}, su solicitud de vacaciones fue rechazada por RRHH por el siguiente motivo:
                                        <br>
                                        {str_motivo}
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
        arr_emails = [empleado.email, "iramirez@grupobuena.com", "marlenef@grupobuena.com"]

        msg = EmailMessage("Solicitud de vacaciones rechazada", str_html, 'nova@grupobuena.com', arr_emails)
        msg.content_subtype = "html"
        msg.send()

    obj_json = {
        "data": {},
        "status": True,
        "msj": "Se rechazó exitosamente la solicitud de vacaciones y se removió de este listado."
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def imprimir_constancia(request, pk):
    int_id = pk

    obj_solicitud = Empleado_solicitud_vacaciones.objects.get(id=int(int_id))

    obj_detalles = (Empleado_solicitud_vacaciones_detalle.objects.
                    filter(empleado_solicitud_vacaciones=int(int_id)).
                    order_by("fecha"))

    obj_empleado = EmpleadosMaster.objects.get(id=int(obj_solicitud.id_empleado))
    obj_empleado_base = EmpleadosBase.objects.filter(
        empleado_id=int(obj_solicitud.id_empleado),
        fecha_alta__isnull=False,
        fecha_baja__isnull=True,
        base_id=46,
    ).order_by("-fecha_alta").first()

    obj_empresa = EmpresasNominaGB.objects.get(no_empresa=obj_empleado_base.no_empresa)

    data = {
        "fecha": datetime.now,
        "solicitud": obj_solicitud,
        "detalle": obj_detalles,
        "empleado": obj_empleado,
        "empleado_base": obj_empleado_base,
        "empresa": obj_empresa,
    }

    html = render_to_string("vacaciones/pdf/constancia_vacaciones.html", data)

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; Constancia Vacaciones.pdf"

    font_config = FontConfiguration()
    HTML(string=html).write_pdf(response, font_config=font_config)

    return response
