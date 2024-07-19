# Create your views here.
import json
from io import BytesIO
from xhtml2pdf import pisa
from datetime import datetime
from django.db.models import Q
from django.db import connection
from django.conf import settings
from django.http.response import JsonResponse, HttpResponse
from django.shortcuts import render, redirect
from django.template.loader import get_template
from django.core.mail import EmailMultiAlternatives
from django.contrib.auth.decorators import login_required
from user_auth.models import User
from core.functions import set_notification, get_query
from rrhh.forms import Solicitud_vacaciones_form
from rrhh.models import Solicitud_vacaciones, Users_configuracion, Solicitud_vacaciones_detalle


@login_required(login_url="/login/")
def index(request):
    solicitudes = []
    # usuario = request.user.id
    usuario = 4
    bool_acceso = False

    # if request.user.has_perm('solicitud_vacaciones_ver_todas'):
    #     solicitudes = Solicitud_vacaciones.objects.all()
    # else:
    collection_users = Users_configuracion.objects.filter(Q(user_jefe_id=usuario) | Q(user_id=usuario))
    arr_users = []
    if not collection_users:
        arr_users = [] # no tenemos nada, pero no encontre la negacion del not jaja, soy malo
    else:
        for user in collection_users:
            arr_users.append(user.user_id)
        
    print(arr_users)
    print('\n')
    solicitudes = Solicitud_vacaciones.objects.filter(usuario__in=arr_users)
    collection = {
        'vacaciones': solicitudes,
        'empleado': usuario,
        'acceso': bool_acceso,
    }

    return render(request, 'vacaciones/vacaciones.html', collection)


@login_required(login_url="/login/")
def create(request):
    form = Solicitud_vacaciones_form()
    data = {"status": 'fail'}
    if request.method == 'POST':
        # empleado_id = request.user.empleado_id
        # user_id = request.user.id
        empleado_id = '108'
        user_id = 4

        str_vtomadas = 0
        email_jefe = ''
        no_empleado = get_no_empleado(request, empleado_id)
        arr_jefe = get_jefe(request, user_id)
        
        if arr_jefe:
            email_jefe = arr_jefe[0]
        else:
            str_vtomadas = 1
        str_send = request.POST['strSend']
        list_vacaciones = str_send.split(',')
        arr_dias = get_vacaciones_a_tomar(request, no_empleado, list_vacaciones)

        if len(arr_dias) > 0:
            request.POST._mutable = True
            request.POST['usuario'] = request.user.id
            request.POST['empresa'] = '8'
            request.POST['cantidad_dias'] = len(list_vacaciones)
            request.POST['vacaciones_tomadas'] = str_vtomadas
            request.POST._mutable = False
            form = Solicitud_vacaciones_form(request.POST)

            if form.is_valid():
                data = form.cleaned_data
                solicitud = Solicitud_vacaciones.objects.create(
                    usuario_id = data['usuario'].id,
                    empresa_id = data['empresa'].id,
                    cantidad_dias = data['cantidad_dias'],
                    vacaciones_tomadas = data['vacaciones_tomadas'],
                    comentarios_usuario = data['comentarios_usuario'],
                )

                id_solicitud = solicitud.id
                int_dias = 0
                for detalle in arr_dias:
                    i = 1
                    while i <= detalle['dias']:
                        dtime = datetime.strptime(list_vacaciones[int_dias], '%Y-%m-%d')
                        Solicitud_vacaciones_detalle.objects.create(
                            solicitud_id = id_solicitud,
                            fecha = dtime,
                            periodo = detalle['periodo'],
                        )
                        int_dias += 1
                        i += 1

                name_empleado = request.user.get_full_name()
                send_email_approved(request, email_jefe, name_empleado)

                set_notification(request, True, 'Registro grabado.', 'add_alert', 'success')
                data = {"status": 'ok'}
                return JsonResponse(data, safe=False)
                # return redirect('rrhh-solicitud_vacaciones')
            else:
                set_notification(request, True, 'Error al grabar.', 'warning', 'danger')
                return JsonResponse(data, safe=False)
        else:
            set_notification(request, True, 'Registro no grabado.', 'warning', 'danger')
            return JsonResponse(data, safe=False)
    
    return render(request, 'vacaciones/vacaciones_create.html')


@login_required(login_url="/login/")
def aprobar(request, pk):
    collection = {}
    return render(request, 'vacaciones/vacaciones_aprobar.html', collection)


@login_required(login_url="/login/")
def imprimir(request, pk):
    collection = {}



    solicitud = Solicitud_vacaciones.objects.get(id=pk)

    data = {
        "solicitud": solicitud,
    }
    pdf = render_to_pdf('vacaciones/vacaciones_pdf.html', data)
    return HttpResponse(pdf, content_type='application/pdf')


def render_to_pdf(template_src, context_dict=None):
    if context_dict is None:
        context_dict = {}
    template = get_template(template_src)
    html = template.render(context_dict)
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    if not pdf.err:
        return HttpResponse(result.getvalue(), content_type='application/pdf')
    return None


def get_vacaciones_a_tomar(request, no_empleado, list_vacaciones):
    int_empresa = 1234 # de momento la empresa no se usa en el store procedure
    
    cursor = connection.cursor()
    str_query_vacaciones = "EXEC NominaGB..StatusVacaciones '%s', %s " % (no_empleado, int_empresa)
    cursor.execute(str_query_vacaciones)
    int_dias_disponibles = 0
    # NominaGB..StatusVacaciones return
    # Inicio, Fin, Periodo, DiasGozados, Calculo, DiasPendientes, Valor, Status
    list_vdisponibles = cursor.fetchall()
    for row in list_vdisponibles:
        int_dias_disponibles += row[5]
    cursor.close()

    int_dias_pedidos = len(list_vacaciones)
    arr = []
    if int_dias_disponibles >= int_dias_pedidos:
        intKey = 1
        for disponible in list_vdisponibles:
            dias_a_tomar = 0
            if int_dias_pedidos > 0:
                if disponible[5] >= int_dias_pedidos:
                    dias_a_tomar = int_dias_pedidos
                    int_dias_pedidos = 0
                else:
                    dias_a_tomar = disponible[5]
                    int_dias_pedidos -= disponible[5]
                arr.append({
                    'dias': dias_a_tomar,
                    'periodo': disponible[2],
                })
    else:
        arr = []
        # no hay los suficientes dias para poder ir de vacaciones

    return arr


def get_no_empleado(request, empleado_id):
    no_empleado = 0
    cursor = connection.cursor()
    sql_query_empleado = """
                        SELECT no_empleado 
                            FROM ares..empleados_base
                            WHERE empleado_id = '%s'
                            AND fecha_baja IS NULL
                            AND no_empresa = '4'
                        """ % empleado_id
    cursor.execute(sql_query_empleado)
    
    arr_empleado = cursor.fetchone()
    if arr_empleado:
        no_empleado = arr_empleado[0]
    cursor.close()
    return no_empleado


def get_jefe(request, user_id):
    jefe = []
    cursor = connection.cursor()
    sql_query_jefe = """
                        SELECT u.email
                            FROM auth_user u
                                WHERE u.id = (
                                    SELECT user_jefe_id 
                                        FROM rrhh_users_configuracion WHERE user_id = %s
                                )
                        """ % user_id
    cursor.execute(sql_query_jefe)

    arr_jefe = cursor.fetchone()
    if arr_jefe:
        jefe.append(arr_jefe)
    cursor.close()
    return jefe


def send_email_approved(request, email_jefe, name_empleado):
    email = EmailMultiAlternatives(
                'Solicitud de vacaciones',
                'El usuario %s solicita autorizacion para tomar vacaciones.' % name_empleado,
                settings.EMAIL_HOST_USER,
                ['nrodriguez@grupobuena.com']
                # [email_jefe]
            )
    email.send()
    return True


@login_required(login_url="/login/")
def edit(request):
    return render(request, 'vacaciones/vacaciones.html')


@login_required(login_url="/login/")
def delete(request):
    return render(request, 'vacaciones/vacaciones.html')


@login_required(login_url="/login/")
def index_reporte(request):

    str_query = """
        SELECT cast(EC.FechaInicio as date) as FechaInicio, cast(EC.FechaFin as date) as FechaFin, E.No_Empleado,
            CONCAT(E.Nombres, ' ', E.Apellidos) as NombreCompleto
        FROM NominaGB..EmpleadosConceptos as EC
        INNER JOIN NominaGB..Empleados as E
            ON E.No_Empleado = EC.NoEmpleado
        WHERE NoConcepto = 1 and NoEstado <> 3
        AND (YEAR(EC.FechaInicio) = 2024 OR YEAR(EC.FechaFin) = 2024)
    """

    obj_query = get_query(str_query)

    obj_json = []
    for row in obj_query:
        dic_fila = {
            "title": str(row["No_Empleado"]) + " - " + row["NombreCompleto"],
            "start": str(row["FechaInicio"]),
            "end": str(row["FechaFin"]),
        }
        obj_json.append(dic_fila)

    data = {
        'eventos': json.dumps(obj_json)
    }

    return render(request, 'vacaciones/reporte_vacaciones.html', data)
