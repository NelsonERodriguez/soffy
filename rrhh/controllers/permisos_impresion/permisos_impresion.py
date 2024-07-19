from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string
from sqlescapy import sqlescape
from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration

from core.ares_models import EmpleadosMaster, EmpleadosBase, Puestos
from core.models import Autorizadores_vacaciones
from core.functions import get_query
from core.nominagb_models import EmpresasNominaGB
from nova.debug import IMAGEN_GB
from rrhh.models import Permisos_empleados
from django.http import JsonResponse, HttpResponse


@login_required(login_url="/login/")
def index(request):
    departamentos = (Autorizadores_vacaciones.objects.select_related('departamento')
                     .filter(autorizador_id=request.user.id, autoriza=True, activo=True)
                     .values('departamento__nombre', 'departamento_id'))
    data = {
        "departamentos": departamentos,
    }
    return render(request, 'permisos_impresion/permisos_impresion.html', data)


@login_required(login_url="/login/")
def listado_permisos_impresion(request):
    str_departamento = request.POST.get("strDepartamento")

    str_query = f"""
            SELECT
                [rrhh_permisos_empleados].[id], [core_departamento].[nombre] [nombre_depto],
                [auth_user].[name] [nombre_completo], [rrhh_permisos_empleados].[fecha_inicio],
                [rrhh_permisos_empleados].[fecha_fin], [rrhh_estatus].[estatus], [rrhh_permisos_empleados].[estatus_id]
            FROM [NOVA]..[rrhh_permisos_empleados]
                INNER JOIN [NOVA]..[auth_user]
                    ON [auth_user].[id] = [rrhh_permisos_empleados].[usuario_id]
                INNER JOIN [NOVA]..[core_departamento] 
                    ON [core_departamento].[id] = [rrhh_permisos_empleados].[departamento_id]
                INNER JOIN [NOVA]..[rrhh_estatus]
                    ON [rrhh_estatus].[id] = [rrhh_permisos_empleados].[estatus_id]
            WHERE
                [rrhh_permisos_empleados].[estatus_id] IN (4, 5)
            AND [auth_user].[id] = {request.user.id}
        """

    if str_departamento:
        str_filtro = ""
        if str_departamento != "0":
            str_filtro = f"AND [rrhh_permisos_empleados].[departamento_id] = {sqlescape(str_departamento)}"

        str_query += f"""
                UNION
            SELECT
                [rrhh_permisos_empleados].[id], [core_departamento].[nombre] [nombre_depto], 
                [auth_user].[name] [nombre_completo], [rrhh_permisos_empleados].[fecha_inicio], 
                [rrhh_permisos_empleados].[fecha_fin], 
                [rrhh_permisos_empleados].[dias_solicitados], [rrhh_estatus].[estatus], 
                [rrhh_permisos_empleados].[estatus_id]
            FROM [NOVA]..[rrhh_permisos_empleados]
                INNER JOIN [NOVA]..[auth_user] 
                    ON [auth_user].[empleado_id] = [rrhh_permisos_empleados].[id_empleado]
                INNER JOIN [NOVA]..[core_departamento] 
                    ON [core_departamento].[id] = [rrhh_permisos_empleados].[departamento_id]
                INNER JOIN [NOVA]..[rrhh_estatus] 
                    ON [rrhh_estatus].[id] = [rrhh_permisos_empleados].[estatus_id]
            WHERE 
                [rrhh_permisos_empleados].[estatus_id] IN (4, 5)
            {str_filtro}
            """

    listado = get_query(str_sql=str_query)

    json_return = {
        "data": listado,
        "status": True,
        "msg": "Se muestran las solicitudes de permisos laborales por imprimir.",
        "msj": "Se muestran las solicitudes de permisos laborales por imprimir.",
    }

    return JsonResponse(json_return, safe=False)


@login_required(login_url="/login/")
def imprimir(request, int_id):
    solicitud = Permisos_empleados.objects.select_related('tipo').get(id=int(int_id))

    if not solicitud.usuario_imprimio_id:
        solicitud.estatus_id = 5

    solicitud.usuario_imprimio_id = request.user.id

    solicitud.save()

    empleado = EmpleadosMaster.objects.get(id=int(solicitud.id_empleado))
    empleado_base = EmpleadosBase.objects.filter(
        empleado_id=int(solicitud.id_empleado),
        fecha_alta__isnull=False,
        fecha_baja__isnull=True,
        base_id=46,
    ).order_by("-fecha_alta").first()
    puesto = Puestos.objects.filter(codigo=empleado_base.no_puesto).first()
    empresa = EmpresasNominaGB.objects.get(no_empresa=empleado_base.no_empresa)

    user_autoriza = (
        Autorizadores_vacaciones.objects
        .select_related('autorizador')
        .filter(
            departamento_id=solicitud.departamento_id,
            activo=True
        ).values('autorizador__name').first()
    )

    encargado = user_autoriza['autorizador__name'] if user_autoriza else ""

    data = {
        "IMAGEN_GB": IMAGEN_GB,
        "fecha": solicitud.fecha_solicitud,
        "nombre_encargado": encargado,
        "solicitud": solicitud,
        "empleado": empleado,
        "empleado_base": empleado_base,
        "empresa": empresa,
        "puesto": puesto,
    }

    html = render_to_string("permisos_impresion/pdf/solicitud_permisos_laborales_2024.html", data)

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; Solicitud Permiso Laboral.pdf"

    font_config = FontConfiguration()
    HTML(string=html).write_pdf(response, font_config=font_config)

    return response
