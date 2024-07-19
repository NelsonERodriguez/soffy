from datetime import datetime

from django.core.mail import EmailMessage
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from core.functions import encriptar_datos
from core.models import Autorizadores_vacaciones, User_departamento
from soffybiz.debug import DEBUG, clave_compartida, IMAGEN_GB
from rrhh.models import Permisos_tipos, Permisos_empleados, Permisos_estatus


@login_required(login_url="/login/")
def index(request):
    tipos = Permisos_tipos.objects.filter(activo=True)
    data = {
        "tipos": tipos,
    }
    return render(request, 'permisos_solicitud/permisos_solicitud.html', data)


@login_required(login_url="/login/")
def get_solicitudes(request):
    draw = int(request.POST.get('draw', 1))
    start = int(request.POST.get('start', 0))
    length = int(request.POST.get('length', 10))

    # Obtener los datos de búsqueda
    search_value = request.POST.get('search[value]', '')

    query_filter = (Q(usuario_id=request.user.id))
    # Filtrar según la búsqueda
    if search_value:
        query_filter += (Q(tipo__nombre__icontains=search_value) | Q(estatus__nombre__icontains=search_value))
        queryset = Permisos_empleados.objects.select_related('tipo', 'estatus').filter(query_filter)
    else:
        queryset = Permisos_empleados.objects.select_related('tipo', 'estatus').filter(query_filter)

    queryset.order_by('-id')
    # Paginar los resultados
    paginator = Paginator(queryset, length)
    page_number = start // length + 1
    page = paginator.get_page(page_number)

    # Preparar la respuesta
    data = []
    for permiso in page.object_list:
        data.append({
            "id": permiso.id,
            "fecha_solicitud": permiso.fecha_solicitud.strftime("%d/%m/%Y"),
            "tipo": permiso.tipo.nombre,
            "estatus": permiso.estatus.estatus,
        })

    response = {
        'draw': draw,
        'recordsTotal': paginator.count,
        'recordsFiltered': paginator.count,
        'data': data,
    }

    return JsonResponse(response)


@login_required(login_url="/login/")
def get_solicitud(request):
    int_id = request.POST.get('id', 0)
    try:
        permiso = Permisos_empleados.objects.get(id=int_id)
        response = {
            'status': True,
            'permiso': {
                "id": permiso.id,
                "tipo_id": permiso.tipo_id,
                "estatus_id": permiso.estatus_id,
                "observacion": permiso.observacion,
                "fecha_solicitud": permiso.fecha_solicitud.strftime("%Y-%m-%d"),
                "str_fecha_solicitud": permiso.fecha_solicitud.strftime("%d/%m/%Y"),
                "fecha_inicio": permiso.fecha_inicio.strftime("%Y-%m-%d %H:%M:%S"),
                "str_fecha_inicio": permiso.fecha_inicio.strftime("%d/%m/%Y %H:%M:%S"),
                "fecha_fin": permiso.fecha_fin.strftime("%Y-%m-%d %H:%M:%S"),
                "str_fecha_fin": permiso.fecha_fin.strftime("%d/%m/%Y %H:%M:%S"),
            },
        }
        return JsonResponse(response)
    except Permisos_empleados.DoesNotExist:
        response = {
            'status': False,
            'tipo': None,
            'msj': 'El permiso no existe',
            'msg': 'El permiso no existe',
        }
        return JsonResponse(response)


@login_required(login_url="/login/")
def save_solicitud(request):
    if request.method == 'POST':
        try:
            bool_status = True
            try:
                departamento = (User_departamento.objects.filter(user_id=request.user.id).values('departamento_id')
                                .first())
                with transaction.atomic():
                    permiso = Permisos_empleados.objects.create(
                        tipo_id=request.POST.get('tipo'),
                        estatus=Permisos_estatus.objects.filter(orden=2).first(),
                        usuario_id=request.user.id,
                        id_empleado=request.user.empleado_id,
                        observacion=request.POST.get('observacion'),
                        fecha_inicio=request.POST.get('fecha_inicio'),
                        fecha_fin=request.POST.get('fecha_fin'),
                        fecha_solicitud=request.POST.get('fecha_solicitud'),
                        departamento_id=departamento['departamento_id'] if departamento else None,
                    )
                str_msj = "Registro grabado"

                if not DEBUG:
                    str_fecha_inicio = (datetime.strptime(permiso.fecha_inicio, '%Y-%m-%dT%H:%M')
                                        .strftime('%d/%m/%Y %H:%M:%S'))
                    str_fecha_fin = (datetime.strptime(permiso.fecha_fin, '%Y-%m-%dT%H:%M')
                                     .strftime('%d/%m/%Y %H:%M:%S'))
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
                                datos_originales = (f"rrhh/permisos_aprobar/?usuario={email}")
                                datos_encriptados = encriptar_datos(datos_originales, clave_compartida)

                                str_button = F"""
                                <a type="button" style="padding: 10px 15px; margin: 15px; background-color: #4caf50; 
                                    color: white; cursor: pointer; border-radius: 10px; text-decoration: none;"
                                    target="_blank" 
                                href="https://nova.ffinter.com/login/?encrypt_vacaciones={datos_encriptados.decode()}">
                                    Aprobar permiso
                                </a>
                                """

                            str_html = f"""
                                <table style="width: 100%%;">
                                    <tbody>
                                        <tr>
                                            <td width="25%%">&nbsp;</td>
                                            <td width="50%%">
                                                <table style="width: 100%%; border: 1px solid #dddddd; 
                                                border-radius: 3px;">
                                                    <tbody>
                                                        <tr>
                                                            <td style="text-align: center; padding: 20px;">
                                                                <img src="{IMAGEN_GB}" alt="No se puedo cargar imagen" 
                                                                style="width: 100%%" width="100%%">
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="background: #333333;color: white; 
                                                            text-align:center;">
                                                                <h2>Notificación de solicitud de permiso laboral.</h2>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="text-align: center; padding: 20px;">
                                                                {request.user.name} solícita un permiso laboral 
                                                                de {str_fecha_inicio} hasta {str_fecha_fin}
                                                                por el motivo: <br>
                                                                {permiso.tipo.nombre}  <br><br>
                                                                Observación: <br> {permiso.observacion}  <br>
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
                            str_subject = "Solicitud de permiso laboral"
                            msg = EmailMessage(subject=str_subject, body=str_html,
                                               from_email='nova@grupobuena.com', to=arr_emails)
                            msg.content_subtype = "html"
                            msg.send()

            except Exception as e:
                bool_status = False
                str_msj = f"Error al grabar el registro: {e}"

            response = {
                'status': bool_status,
                'msj': str_msj,
                'msg': str_msj,
            }
            return JsonResponse(response)
        except Exception as e:
            # El formulario no es válido, devuelve un mensaje de error
            response = {
                'status': False,
                'msj': f'Error al grabar el registro: {str(e)}',
                'msg': f'Error al grabar el registro: {str(e)}',
            }
            return JsonResponse(response)
    else:
        # El método de solicitud no es POST
        response = {
            'status': False,
            'msj': 'Método de solicitud no permitido',
            'msg': 'Método de solicitud no permitido',
        }
        return JsonResponse(response)
