from django.contrib.auth import authenticate, login as gb_login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import render, redirect
from django.template import loader
from django.http import HttpResponse, JsonResponse
from django import template
from django.db import connection
from django.views.decorators.csrf import csrf_exempt

from core.functions import get_notification, get_query, desencriptar_datos, insert_query, execute_query
from soffybiz.debug import DEBUG, clave_compartida
# from tickets.controllers.dashboard.dashboard import get_tickets
from core.models import User_departamento, Menu_configuracion_usuarios, Menu_colores_fondo, Menu_colores_opciones, \
    Menu_imagenes, Emulacion_usuarios
from datetime import datetime
from user_auth.models import User
import json
import requests


def login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user:
            str_path = request.session.get('REDIRECT_PATH')
            str_get = request.session.get('REDIRECT_GET')
            gb_login(request, user)
            user.last_login = datetime.now()
            user.save()

            if request.session.get('REDIRECT_PATH'):
                del request.session['REDIRECT_PATH']
            if request.session.get('REDIRECT_GET'):
                del request.session['REDIRECT_GET']
            if str_path:
                return redirect(str_path + (f"?{str_get}" if str_get else ''))

            else:
                return redirect('home_core')
        else:
            return render(request, 'accounts/login.html')

    if request.GET.get('ares', None) and request.GET.get('user', None):
        username = request.GET['user']

        user = User.objects.extra(
            where=["CONVERT(VARCHAR(32),HASHBYTES('MD5',CONVERT(VARCHAR(100),email)),2) = '" + username.upper() + "'"]
        ).first()
        if not user.is_superuser:
            gb_login(request, user)
            user.last_login = datetime.now()
            user.save()
            str_ares = request.GET.get('ares', None)
            if str_ares == "quiniela-inscripcion":
                return redirect('quiniela-inscripcion')
            elif str_ares == "rrhh-vales_qr_user":
                return redirect('rrhh-vales_qr_user')
            else:
                return redirect('home_core')

    if request.GET.get('encrypt_vacaciones'):
        datos_encriptados = request.GET.get('encrypt_vacaciones')
        datos_desencriptados = desencriptar_datos(datos_encriptados, clave_compartida)
        arr_params = datos_desencriptados.split('/')
        arr_split = arr_params[-1].replace('?', '').split('&')
        str_params = ""
        for param in arr_split:
            if param.find('usuario') != -1:
                user = User.objects.filter(email=param.split('=')[1]).first()
                gb_login(request, user)
                user.last_login = datetime.now()
                user.save()
            else:
                str_params += param.split('=')[1]

        str_path = '/' + '/'.join(arr_params[:-1]) + "/?vacacion=" + str_params
        return redirect(str_path)

    if not request.user.is_anonymous:
        return redirect('home_core')
    return render(request, 'accounts/login.html')


def primera_carga(request):
    data = { 'cargado': False }
    str_qry = """ALTER TABLE django_content_type
        ADD COLUMN modulo VARCHAR(200) NULL,
        ADD COLUMN ventana VARCHAR(200) NULL,
        ADD COLUMN link VARCHAR(200) NULL,
        ADD COLUMN icono VARCHAR(200) NULL,
        ADD COLUMN sub_modulo VARCHAR(200) NULL;"""
    execute_query(sql=str_qry)

    str_qry = """UPDATE django_content_type
     SET modulo = 'Usuarios', ventana = 'Permisos', link = 'user/permissions/', icono = 'verified_user'
     WHERE app_label = 'auth' AND model = 'permission';"""
    execute_query(sql=str_qry)

    str_qry = """UPDATE django_content_type
     SET modulo = 'Usuarios', ventana = 'Roles', link = 'user/groups/', icono = 'dns'
     WHERE app_label = 'auth' AND model = 'group';"""
    execute_query(sql=str_qry)

    str_qry = """INSERT django_content_type (modulo, ventana, link, icono, app_label, model)
        VALUES ('Usuarios', 'Roles de Usuarios', 'user/users_groups/', 'dns', 'auth', 'users_groups');"""
    insert_query(sql=str_qry)

    str_qry = """INSERT django_content_type (modulo, ventana, link, icono, app_label, model)
        VALUES ('Usuarios', 'Usuarios no Existentes', 'user/users/', 'format_list_numbered', 'auth', 'users');"""
    insert_query(sql=str_qry)


    # 

    # str_qry = """UPDATE django_content_type
    #  SET modulo = 'Core', ventana = 'Empresas', link = 'core/empresas/', icono = 'account_box'
    #  WHERE app_label = 'core' AND model = 'empresas';"""
    # insert_query(sql=str_qry)

    # str_qry = """UPDATE django_content_type
    #  SET modulo = 'Core', ventana = 'Monedas', link = 'core/monedas/', icono = 'paid'
    #  WHERE app_label = 'core' AND model = 'monedas';"""
    # insert_query(sql=str_qry)

    # str_qry = """UPDATE django_content_type
    #  SET modulo = 'Core', ventana = 'Empresas Usuarios', link = 'core/empresas_usuarios/', icono = 'persion_pin'
    #  WHERE app_label = 'core' AND model = 'empresas_usuario';"""
    # insert_query(sql=str_qry)

    # str_qry = """UPDATE django_content_type
    #  SET modulo = 'Usuarios', ventana = 'Mi Cuenta', link = 'user/myaccount/', icono = 'people'
    #  WHERE app_label = 'user_auth' AND model = 'user';"""
    # insert_query(sql=str_qry)

    # str_qry = """UPDATE django_content_type
    #  SET modulo = 'Usuarios', ventana = 'Mi Cuenta', link = 'user/myaccount/', icono = 'people'
    #  WHERE app_label = 'user_auth' AND model = 'user';"""
    # insert_query(sql=str_qry)

    # =====

    

    

    return JsonResponse(data, safe=False)


def logoutRequest(request):
    logout(request)
    return redirect('login')


@login_required(login_url="/login/")
def index(request):
    type_user = 'normal'
    if type_user == 'normal':
        arr_cliente = []

        int_codigo_cliente = arr_cliente[0] if arr_cliente and arr_cliente[0] else ''
        int_limite = int(arr_cliente[1]) if arr_cliente and arr_cliente[1] else 0

        user = User_departamento.objects.filter(user_id=request.user.id).first()

        if int_codigo_cliente:
            sql_saldo = """SELECT SUM(saldo) AS saldo FROM CuentaCorriente..AuxiliarCxC WHERE CodigoCliente = '%s' 
                            AND Saldo > 0""" % int_codigo_cliente
            with connection.cursor() as cursor:
                cursor.execute(sql_saldo)
                arr_saldo = cursor.fetchone()

                sql_detalle_facturas = """SELECT
                            a.TipoDoc, a.NoDocumento, a.Fecha, a.Total, a.Saldo,
                            DATEADD(day, f.DiasCredito, a.Fecha) AS fecha_pago,
                            p.CodigoProducto, p.Descripcion, df.VUnitario,
                            CONCAT(df.Cantidad, ' ', u.abreviatura) AS cantidad
                        FROM
                            CuentaCorriente..AuxiliarCxC a
                            JOIN Inventario..Facturas f ON a.NoDocumento = f.NoDocumento AND a.Serie = f.Serie
                            JOIN Inventario..DetalleFacturas df ON f.NoFactura = df.NoFactura
                            JOIN Inventario..Productos p ON df.NoProducto = p.NoProducto
                            JOIN Inventario..Unidades u ON p.NoUnidad = u.NoUnidad
                        WHERE
                            a.codigocliente = '%s'
                            AND a.Saldo > 0 ORDER BY a.Fecha ASC""" % int_codigo_cliente
                cursor.execute(sql_detalle_facturas)

                data = []
                for row in cursor.fetchall():
                    arr_tmp = {
                        "tipo_doc": row[0],
                        "no_documento": row[1],
                        "fecha": row[2],
                        "total": row[3],
                        "saldo": format(row[4]),
                        "fecha_pago": row[5],
                        "codigo_producto": row[6],
                        "descripcion": row[7],
                        "v_unitario": format(round(row[8], 2)),
                        "cantidad": row[9],
                    }
                    data.append(arr_tmp)

                int_saldo = 0
                if arr_saldo and arr_saldo[0] is not None:
                    int_disponible = int_limite - arr_saldo[0]
                    int_saldo = arr_saldo[0]
                else:
                    int_disponible = int_limite

            return render(request, 'index.html', {
                'data': data,
                'intLimite': format(int_limite),
                'intSaldo': format(int_saldo),
                'intDisponible': format(int_disponible),
                'myday': user,
                "DEBUG": DEBUG
            })
        else:

            return render(request, 'index.html', {
                'data': [],
                'intLimite': format(1000),
                'intSaldo': format(0),
                'intDisponible': format(1000),
                'myday': user,
                "DEBUG": DEBUG
            })
    else:
        return redirect('core-dashboard')


@login_required(login_url="/login/")
def index_dashboard(request):
    return render(request, 'index-dashboard.html', {'test': 'soy gerente'})


@login_required(login_url="/login/")
def pages(request):
    context = {}
    try:
        load_template = request.path.split('/')[-1]
        context['segment'] = load_template

        if load_template == "":
            return redirect("home_core")

        html_template = loader.get_template(load_template)
        return HttpResponse(html_template.render(context, request))

    except template.TemplateDoesNotExist:
        html_template = loader.get_template('layouts/page-404.html')
        return HttpResponse(html_template.render(context, request))

    except:
        html_template = loader.get_template('layouts/page-500.html')
        return HttpResponse(html_template.render(context, request))


def notification(request):
    return JsonResponse(get_notification(request))


@login_required(login_url="/login/")
def get_data_facturas(request):
    # empleado_id = request.user.empleado_id

    str_query_cliente = """
        select STRING_AGG(b.no_empleado, ', ') AS concatenados
        from NOVA..auth_user u join ares..empleados_base b on u.empleado_id = b.empleado_id
        where u.id = %s
        and b.base_id = 41
        """

    obj_cliente = get_query(str_sql=str_query_cliente, params=(request.user.id,), print_result=False, print_debug=False)
    str_concatenados = (
        obj_cliente[0]["concatenados"] if obj_cliente and obj_cliente[0] and obj_cliente[0]['concatenados'] else '0 ')

    str_query_facturas = """
        SELECT
        a.TipoDoc, a.NoDocumento,f.nombre, a.Fecha, a.Total, a.Saldo,
        DATEADD(day, f.DiasCredito, a.Fecha) AS fecha_pago,
        FORMAT(DATEADD(day, f.DiasCredito, a.Fecha),'dd/MM/yyyy') as FechaPagoFormat,
        FORMAT(DATEADD(day, f.DiasCredito, a.Fecha),'yyyyMMdd') as FechaPagoOrder,
        FORMAT(a.Fecha,'dd/MM/yyyy') as FechaFormat,
        FORMAT(a.Fecha,'yyyyMMdd') as FechaOrder
        FROM CuentaCorriente..AuxiliarCxC a
        JOIN Inventario..Facturas f ON a.NoDocumento = f.NoDocumento AND a.Serie = f.Serie
        WHERE f.NoCliente IN(%s)
        AND a.Saldo > 0
        ORDER BY a.Fecha ASC
    """ % str_concatenados

    obj_facturas = get_query(str_sql=str_query_facturas, print_result=False, print_debug=False)

    data_return = {
        "data": obj_facturas
    }

    return JsonResponse(data_return, safe=False)


@login_required(login_url="/login/")
def get_data_vacaciones(request):
    empleado_id = request.user.empleado_id if request.user.empleado_id else 0

    str_query = """
        SELECT DISTINCT no_empleado, fecha_alta 
        FROM ares..empleados_base WHERE empleado_id = %s ORDER BY fecha_alta ASC
    """

    obj_codigo_empleado = get_query(str_sql=str_query, params=(empleado_id,), print_debug=False, print_result=False)

    data_vacaciones = []
    for row in obj_codigo_empleado:
        str_query_vacaciones = "exec NominaGB..ConsultaVacaciones '" + str(row["no_empleado"]) + "';"

        obj_vacaciones = get_query(str_sql=str_query_vacaciones, print_debug=False, print_result=False)
        for row2 in obj_vacaciones:
            # row2["Fecha1"] = datetime.strptime(row2["Fecha1"], '%Y-%m-%d')
            row2["Fecha1"] = row2["Fecha1"].strftime('%Y-%m-%d')
            # row2["Fecha2"] = datetime.strptime(row2["Fecha2"], '%Y-%m-%d')
            row2["Fecha2"] = row2["Fecha2"].strftime('%Y-%m-%d')
            data_vacaciones.append(row2)

    dat_return = {
        "data": data_vacaciones
    }

    return JsonResponse(dat_return, safe=False)


# @login_required(login_url="/login/")
# def get_data_tickets(request):
#     try:
#         arr_vencidos = get_tickets(int_user=request.user.id, bool_asignado=True, int_not_estado=5, bool_vencido=True)

#         arr_hoy = get_tickets(int_user=request.user.id, bool_asignado=True, int_not_estado=5, bool_hoy=True)

#         arr_sin_fecha = get_tickets(int_user=request.user.id, bool_asignado=True, bool_sin_fecha=True)

#         arr_solicitudes = get_tickets_solicitudes(int_user=request.user.id)

#         data = {
#             "status": True,
#             "vencidos": arr_vencidos,
#             "hoy": arr_hoy,
#             "sin_fecha": arr_sin_fecha,
#             "solicitudes": arr_solicitudes,
#         }

#     except ValueError:
#         data = {
#             "status": False,
#         }

#     return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_styles_custom(request):
    user_id = request.user.id
    bool_no_error = True
    str_message = 'Registros obtenidos correctamente'
    arr_return = {
        'background-menu': 1,
        'color-option-menu': 1,
        'collapse': True,
        'show-image': True,
        'image': 1,
    }
    config_user = Menu_configuracion_usuarios.objects.filter(usuario_id=user_id).first()
    arr_colors = Menu_colores_opciones.objects.all().values('color', 'id')
    arr_background = Menu_colores_fondo.objects.all().values('color', 'id')
    arr_images = Menu_imagenes.objects.all().values('url', 'id')
    if not config_user:
        Menu_configuracion_usuarios.objects.create(
            usuario_id=user_id,
            colapsado=0,
            ver_imagen=1,
            modo_noche=0,
            color_fondo_id=1,
            color_opciones_id=3,
            imagen_id=1
        )
    else:
        arr_return['background-menu'] = config_user.color_fondo.id
        arr_return['color-option-menu'] = config_user.color_opciones.id
        arr_return['collapse'] = config_user.colapsado
        arr_return['show-image'] = config_user.ver_imagen
        arr_return['image'] = config_user.imagen.url

    data = {
        'status': bool_no_error,
        'message': str_message,
        'response': arr_return,
        'colors-menu': list(arr_colors),
        'background-menu': list(arr_background),
        'images': list(arr_images),
    }
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def save_custom_styles(request):
    user_id = request.user.id
    shadow = request.POST.get('background_shadow', None)
    color = request.POST.get('background_color', None)
    show_image = request.POST.get('show_image', None)
    image = request.POST.get('image', None)
    data = {
        'status': True,
        'message': 'Cambio realizado correctamente',
    }
    config_user = Menu_configuracion_usuarios.objects.get(usuario_id=user_id)
    if config_user:
        if shadow:
            config_user.color_fondo_id = shadow
        elif color:
            config_user.color_opciones_id = color
        elif show_image:
            config_user.ver_imagen = show_image == '1' if True else False
        elif image:
            config_user.imagen_id = image
        try:
            config_user.save()
        except ValueError:
            data['status'] = False
            data['message'] = 'Ocurrio un problema al guardar tus configuraciones.'
    else:
        data['status'] = False
        data['message'] = 'No se puede encontrar la configuración del usuario.'

    return JsonResponse(data, safe=False)


def get_tickets_solicitudes(int_user):
    departamento = User_departamento.objects.filter(user_id=int_user).first()
    int_departamento = departamento.departamento_id
    str_sql_ticket = """
        SELECT
            T.id,
            CONCAT('#', T.id, ' ', T.titulo) AS titulo,
            ES.nombre AS estado,
            ES.id AS estado_id,
            ES.color AS estado_color,
            PR.nombre AS prioridad,
            PR.id AS prioridad_id,
            PR.color AS prioridad_color,
            T.created_at AS fecha_creacion,
            T.fecha_hora_inicio AS fecha_inicio,
            T.fecha_hora_fin AS fecha_fin,
            T.ticket_padre_id,
            T.ticket_dependiente_id,
            TE.etiquetas,
            TE.etiquetas_id,
            TTE.usuarios_name,
            TTE.usuarios_fotos,
            TTE.usuarios_id,
            IIF(UC.avatar = '', 'default-avatar.png', UC.avatar) AS user_avatar,
            UC.name AS user_name,
            T.orden,
            UC.id AS user_id,
            (SELECT COUNT(id) FROM NOVA..tickets_ticket WHERE ticket_padre_id = T.id AND activo = 1) AS hijos,
            (SELECT COUNT(id) FROM NOVA..tickets_ticket_comentario WHERE ticket_id = T.id AND activo = 1) comentarios,
            TI.ponderacion,
            T.agrupacion_id,
            A.nombre AS nombre_grupo,
            A.color AS color_grupo,
            A.workspace_id,
            W.nombre AS nombre_workspace,
            W.departamento_id
        FROM
            NOVA..tickets_ticket T
        LEFT JOIN NOVA..tickets_estado ES ON ES.id = T.estado_id AND ES.activo = 1
        LEFT JOIN NOVA..tickets_prioridad PR ON PR.id = T.prioridad_id AND PR.activo = 1
        LEFT JOIN NOVA..tickets_ticket_iniciativas TI ON TI.ticket_id = T.id AND TI.activo = 1
        LEFT JOIN NOVA..tickets_agrupacion A ON A.id = T.agrupacion_id
        LEFT JOIN NOVA..tickets_workspace W ON W.id = A.workspace_id 
        LEFT JOIN
               (
                SELECT 
                    TTU.ticket_id,
                    STRING_AGG(TTU.usuario_id,'|_|') AS usuarios_id,
                    STRING_AGG(AU.name,'|_|') AS usuarios_name,
                    STRING_AGG(IIF(AU.avatar = '', 'default-avatar.png', AU.avatar),'|_|') as usuarios_fotos
                FROM NOVA..tickets_ticket_usuario TTU
                LEFT JOIN NOVA..auth_user AU ON TTU.usuario_id = AU.id
                WHERE TTU.activo = 1
                GROUP BY
                    TTU.ticket_id
                ) TTE ON T.id = TTE.ticket_id
        LEFT JOIN NOVA..auth_user UC ON UC.id = T.user_create_id
        LEFT JOIN
                (
                SELECT 
                    TTE.ticket_id, 
                    STRING_AGG(TE.nombre, '|_|') AS etiquetas,
                    STRING_AGG(TE.id, '|_|') AS etiquetas_id
                FROM NOVA..tickets_ticket_etiqueta TTE
                LEFT JOIN NOVA..tickets_etiqueta TE ON TTE.etiqueta_id = TE.id
                WHERE TTE.activo = 1
                GROUP BY 
                    TTE.ticket_id
                ) TE ON T.id = TE.ticket_id
        WHERE
            T.activo = 1
        AND T.user_create_id = %s
        AND T.departamento_id != %s
        AND T.es_personal = 0
        AND 1 = IIF(T.estado_id = 5 AND T.fecha_hora_fin IS NOT NULL, 
                    IIF(DATEADD(DAY, 5, T.fecha_hora_fin) < GETDATE(), 1, 0), 1)
        AND T.plantilla_id IS NOT NULL
        ORDER BY
            T.orden
    """

    return get_query(str_sql=str_sql_ticket, params=(int_user, int_departamento), print_result=False, print_debug=False)


def validate_login(request):
    data = {
        "status": True
    }

    return JsonResponse(data, safe=False)


@csrf_exempt
def login_fetch(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user:
            gb_login(request, user)
            user.last_login = datetime.now()
            user.save()

            data = {
                "status": True,
                "token": request.META.get('CSRF_COOKIE'),
            }

            return JsonResponse(data, safe=False)
        else:

            data = {
                "status": False
            }
            return JsonResponse(data, safe=False)


def public_site(request):
    return render(request, 'public/index.html')


@login_required(login_url="/login/")
def emulate_login(request):
    if request.POST.get('end_emulation') and 'emulate' in request.session:
        user = User.objects.filter(id=request.session['usuario_emula_id']).first()
        Emulacion_usuarios.objects.filter(id=request.session['emulacion_id']).update(date_finished=datetime.now())

        del request.session['emulate']
        del request.session['usuario_emula_id']
        del request.session['usuario_emula']
        del request.session['usuario_emulado_id']
        del request.session['usuario_emulado']
        del request.session['hora_emulada']
        del request.session['emulacion_id']

        gb_login(request, user)

        response = {
            "status": True,
            "msg": "Emulación exitosa",
            "msj": "Emulación exitosa",
        }
        return JsonResponse(data=response)

    user = User.objects.filter(id=request.POST.get('usuario_id')).first()
    try:
        emulacion = Emulacion_usuarios.objects.create(
            usuario_emulo_id=request.user.id,
            usuario_emulado_id=user.id,
        )
        int_user_last = request.user.id
        str_user_last = request.user.name

        gb_login(request, user)

        request.session['emulate'] = True
        request.session['usuario_emula_id'] = int_user_last
        request.session['usuario_emula'] = str_user_last
        request.session['usuario_emulado_id'] = user.id
        request.session['usuario_emulado'] = user.name
        request.session['hora_emulada'] = datetime.now()
        request.session['emulacion_id'] = emulacion.id

        response = {
            "status": True,
            "msg": "Emulación exitosa",
            "msj": "Emulación exitosa",
        }

    except Exception as E:
        user = User.objects.filter(id=request.session['usuario_emula_id']).first()

        gb_login(request, user)

        if 'emulate' in request.session:
            Emulacion_usuarios.objects.filter(id=request.session['emulacion_id']).delete()

            del request.session['emulate']
            del request.session['emulacion_id']
            del request.session['usuario_emula']
            del request.session['usuario_emula_id']
            del request.session['usuario_emulado']
            del request.session['usuario_emulado_id']
            del request.session['hora_emulada']

        response = {
            "status": False,
            "msg": f"Error al emular: {str(E)}",
            "msj": f"Error al emular: {str(E)}",
        }

    return JsonResponse(data=response)


@login_required(login_url="/login/")
def get_user_to_emulate(request):
    search = request.POST.get('search', '')
    try:
        usuarios_lista = list(User.objects.filter(
            Q(email__icontains=search) |
            Q(name__icontains=search)
        ).filter(active=True, is_active=True).exclude(id=1).values('id', 'name'))

        response = {
            "status": True,
            "users": usuarios_lista,
            "msg": f"{len(usuarios_lista)} usuarios encontrados",
            "msj": f"{len(usuarios_lista)} usuarios encontrados",
        }

    except Exception as E:
        response = {
            "status": False,
            "users": [],
            "msg": f"Error al buscar el usuario: {str(E)}",
            "msj": f"Error al buscar el usuario: {str(E)}",
        }

    return JsonResponse(data=response, safe=False)


@login_required(login_url='/login/')
def get_asistencias(request):
    str_query_asistencias = """
        SELECT
            [auth_user].[id],
            [auth_user].[name],
            [auth_user].[email],
            [empleados_base].[no_empleado],
            [puestos].[descripcion],
            CAST([empleado_asistencias].[fecha] AS DATE) AS [fecha],
            MIN(CAST([empleado_asistencias].[fecha] AS TIME)) AS [hora_entrada],
            ISNULL([core_user_departamento].[departamento_id], 0) AS [departamento_id],
            ISNULL([core_departamento].[nombre], 'Sin departamento') AS [departamento],
            (SELECT [hora_entrada]
            FROM [NOVA]..[rrhh_horarios]
            WHERE [dias_semana_id] = (SELECT [id]
                FROM [NOVA]..[rrhh_dias_semana]
                WHERE [dia] = DATEPART(DW, CAST(GETDATE() AS DATE)) - 1)
                AND [rrhh_horarios].[id] IN (SELECT [horario_id]
                FROM [NOVA]..[rrhh_empleados_horarios]
                WHERE [rrhh_empleados_horarios].[usuario_id] = [auth_user].[id])) [horario_entrada]
        FROM [NOVA]..[auth_user]
        INNER JOIN [ares]..[empleados_base] ON [empleados_base].[empleado_id] = [auth_user].[empleado_id]
        INNER JOIN [ares]..[puestos] ON [puestos].[codigo] = [empleados_base].[no_puesto]
        LEFT JOIN [NOVA]..[core_user_departamento] ON [core_user_departamento].[user_id] = [auth_user].[id]
        LEFT JOIN [NOVA]..[core_departamento] ON [core_departamento].[id] = [core_user_departamento].[departamento_id]
        LEFT JOIN [foxcore]..[empleado_asistencias] ON [empleado_asistencias].[codigo] = [empleados_base].[no_empleado]
            AND CAST([empleado_asistencias].[fecha] AS DATE) = CAST(GETDATE() AS DATE)
        WHERE [auth_user].[active] = 1
            AND [auth_user].[is_active] = 1
            AND [empleados_base].[fecha_baja] IS NULL
            AND [empleados_base].[no_empresa] <> 0
            AND [empleados_base].[base_id] = 46
        GROUP BY
            [auth_user].[id],
            [auth_user].[name],
            [auth_user].[email],
            [empleados_base].[no_empleado],
            [puestos].[descripcion],
            CAST([empleado_asistencias].[fecha] AS DATE),
            [core_user_departamento].[departamento_id],
            [core_departamento].[nombre]
        ORDER BY
            [core_departamento].[nombre],
            MIN(CAST([empleado_asistencias].[fecha] AS TIME))
    """
    arr_usuarios = get_query(str_sql=str_query_asistencias, print_debug=False, print_result=False)

    arr_departamentos = {}
    int_count = 0
    for usuario in arr_usuarios:
        if not usuario['departamento_id'] in arr_departamentos:
            arr_departamentos[usuario['departamento_id']] = {
                'id': usuario['departamento_id'],
                'nombre': usuario['departamento'],
                'usuarios': {},
            }

        arr_departamentos[usuario['departamento_id']]['usuarios'][int_count] = {
            'nombre': usuario['name'],
            'email': usuario['email'],
            'no_empleado': usuario['no_empleado'],
            'descripcion': usuario['descripcion'],
            'fecha': usuario['fecha'],
            'hora_entrada': usuario['hora_entrada'],
            'horario_entrada': usuario['horario_entrada'],
        }
        int_count += 1

    return JsonResponse(arr_departamentos, safe=False)
