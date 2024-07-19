from django.core.mail import EmailMessage
from django.db.models import Value
from django.db.models.functions import Concat
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.utils.timezone import now
from sqlescapy import sqlescape

from core.ares_models import EmpleadosBase
from core.models import Departamento
from core.functions import get_query
from core.nominagb_models import EmpleadosNominaGB, EmpleadosconceptosNominaGB, ConceptosNominaGB
from nova.debug import IMAGEN_GB, DEBUG
from rrhh.models import Permisos_empleados
from django.http import JsonResponse


@login_required(login_url="/login/")
def index(request):
    no_empleados = list(EmpleadosNominaGB.objects.filter(
        fecha_alta__isnull=False,
        fecha_baja__isnull=True
    ).values_list('no_empleado', flat=True))

    empleados = EmpleadosBase.objects.filter(
        no_empleado__in=no_empleados,
        base_id=46
    ).annotate(
        nombre_completo=Concat('empleado_id__nombre', Value(' '), 'empleado_id__apellido')
    ).values('nombre_completo', 'no_empleado', 'empleado_id')

    data = {
        "departamentos": Departamento.objects.filter(activo=True),
        "empleados_master": empleados,
    }

    return render(request, 'permisos_revision/permisos_revision.html', data)


@login_required(login_url="/login/")
def listado_permisos(request):
    str_departamento = request.POST.get("strDepartamento")
    str_empleado = request.POST.get("strEmpleado")
    bool_finalizada = int(request.POST.get("boolFinalizadas", "0"))
    estados = (4, 5)

    # Crear filtros dinámicos
    filtros = []
    if str_departamento != "0":
        filtros.append(f"[rrhh_permisos_empleados].[departamento_id] = {sqlescape(str_departamento)}")
    if str_empleado != "0":
        filtros.append(f"[rrhh_permisos_empleados].[id_empleado] = {sqlescape(str_empleado)}")
    if bool_finalizada == 1:
        estados = (6,)

    # Unir estados en el formato adecuado
    params = ",".join(["%s"] * len(estados))
    filtros.append(f"[rrhh_permisos_empleados].[estatus_id] IN ({params})")

    # Unir todos los filtros con 'AND'
    str_filtros = " AND ".join(filtros)

    str_sql = f"""
        SELECT [rrhh_permisos_empleados].[id],
               [rrhh_permisos_empleados].[fecha_inicio],
               [rrhh_permisos_empleados].[fecha_fin],
               [rrhh_permisos_empleados].[estatus_id],
               [core_departamento].[nombre] [departamento],
               [rrhh_permisos_estatus].[estatus],
               [auth_user].[name] [nombre_completo],
               [no_emp].[no_empleado],
               [rrhh_permisos_tipos].[dias_permitidos]
        FROM [NOVA]..[rrhh_permisos_empleados]
             INNER JOIN [NOVA]..[rrhh_permisos_tipos] 
                ON [rrhh_permisos_tipos].[id] = [rrhh_permisos_empleados].[tipo_id]
             INNER JOIN [NOVA]..[auth_user] ON [auth_user].[id] = [rrhh_permisos_empleados].[usuario_id]
             INNER JOIN [NOVA]..[core_departamento]
                        ON [core_departamento].[id] = [rrhh_permisos_empleados].[departamento_id]
             INNER JOIN [NOVA]..[rrhh_permisos_estatus]
                        ON [rrhh_permisos_estatus].[id] = [rrhh_permisos_empleados].[estatus_id]
             LEFT JOIN [ares]..[empleados_master] ON [empleados_master].[id] = [rrhh_permisos_empleados].[id_empleado]
             LEFT JOIN (SELECT *
                        FROM (SELECT [empleado_id],
                                     [no_empleado],
                                     ROW_NUMBER() OVER (
                                         PARTITION BY [empleado_id] ORDER BY [fecha_alta] DESC, [no_empleado]) [rn]
                              FROM [ares]..[empleados_base]
                              WHERE [base_id] = 46
                                AND [fecha_alta] IS NOT NULL
                                AND [fecha_baja] IS NULL) [d]
                        WHERE [d].[rn] = 1) [no_emp] ON [rrhh_permisos_empleados].[id_empleado] = [no_emp].[empleado_id]
        WHERE {str_filtros}
    """
    arr_listado = get_query(str_sql=str_sql, params=(*estados, ))
    data = {
        "status": True if arr_listado else False,
        "permisos": arr_listado,
        "msj": "Listado de permisos" if arr_listado else "No hay permisos que mostrar",
        "msg": "Listado de permisos" if arr_listado else "No hay permisos que mostrar",
    }
    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def finalizar_permiso(request):
    solicitud = Permisos_empleados.objects.select_related('usuario', 'tipo').get(id=int(request.POST.get("intId", 0)))

    empleados = list(EmpleadosBase.objects.filter(
        empleado_id=solicitud.id_empleado,
        base_id=46
    ).values_list('no_empleado', flat=True))

    no_empleados = EmpleadosNominaGB.objects.filter(
        fecha_alta__isnull=False,
        fecha_baja__isnull=True,
        no_empleado__in=empleados
    ).order_by('-fecha_alta').first()

    if no_empleados:
        periodo = "{:,.0f} - {:,.0f}".format(now().year - 1, now().year)
        # concepto = ConceptosNominaGB.objects.filter(noconcepto=10).first()
        inserted = EmpleadosconceptosNominaGB.objects.create(
            noempleado=no_empleados,
            noconcepto=ConceptosNominaGB.objects.filter(noconcepto=10).first(),
            fechainicio=solicitud.fecha_inicio,
            fechafin=solicitud.fecha_fin,
            cantidad=solicitud.tipo.dias_permitidos,
            fechapago=now(),
            numerocheque=None,
            observaciones=solicitud.observacion,
            nousuario=request.user.id,
            operado=now(),
            periodo=periodo,
            noestado=1
        )

        # str_query = f"""
        # INSERT INTO NominaGB..EmpleadosConceptos
        # (NoEmpleado, NoConcepto, FechaInicio, FechaFin, Monto, Cantidad, FechaPago, NumeroCheque, Observaciones,
        # NoUsuario, Operado, Periodo, FormaPago, NoEstado)
        # VALUES
        # (%s, 10, %s, %s, NULL, %s, GETDATE(), NULL, NULL, %s, GETDATE(), %s, NULL, 1)"""
        # inserted = insert_query(
        #     sql=str_query,
        #     params=(no_empleados.no_empleado,
        #             solicitud.fecha_inicio.strftime('%Y-%m-%d %H:%M:%S'),
        #             solicitud.fecha_fin.strftime('%Y-%m-%d %H:%M:%S'),
        #             solicitud.tipo.dias_permitidos, request.user.id, now().year)
        # )

        if inserted:
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
                                                    {solicitud.usuario.name}, el proceso de tu solicitud de permiso 
                                                    laboral fue finalizado correctamente.
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
                arr_emails = [solicitud.usuario.email]
                msg = EmailMessage(subject="Solicitud de permiso laboral finalizado", body=str_html,
                                   from_email='nrodriguez@grupobuena.com', to=arr_emails,
                                   cc=['nrodriguez@grupobuena.com'])
                msg.content_subtype = "html"
                msg.send()
            solicitud.estatus_id = 6
            solicitud.trasladada_info_nomina = True
            solicitud.save()

        json = {
            "data": {},
            "status": True,
            "msj": "Se finalizó exitosamente la solicitud de permiso laboral y se removió de este listado."
        }
    else:
        json = {
            "data": {},
            "status": False,
            "msj": "No se pudo finalizar el proceso de solicitud de permiso laboral ya que no esta bien configurado "
                   "este empleado. Comunicarse a IT."
        }

    return JsonResponse(json, safe=False)
