from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.core.mail import EmailMessage
from django.core.files.storage import FileSystemStorage
from django.db.models import F, Func, Value, CharField, ExpressionWrapper, Q
from core.functions import get_query
from core.models import User_departamento, Departamento
from user_auth.models import User
from tickets.models import Workspace, Agrupacion, Ticket, Estado, Prioridad, Ticket_comentario, \
    Ticket_comentario_adjunto, Ticket_usuario, Ticket_etiqueta, Ticket_adjunto, Etiqueta, Tipo_log, Ticket_log, \
    Workspace_usuarios, Ticket_notificacion, Ticket_iniciativas, Ticket_ponderacion, Ticket_tiempo
from datetime import datetime, date
from mergedeep import merge
from soffybiz.debug import DEBUG, IMAGEN_GB


@login_required(login_url="/login/")
def index(request):
    departamento = User_departamento.objects.filter(user_id=request.user.id).first()
    int_departamento = departamento.departamento_id if departamento else 0
    arr_departamentos = Departamento.objects.filter(activo=True)

    data = {
        "departamento": int_departamento,
        "bool_director": True if request.user.id in (1, 7, 54, 56, 55) else False,
        "arr_departamentos": arr_departamentos,
        "user_id": request.user.id
    }

    return render(request, 'dashboard/dashboard.html', data)


@login_required(login_url="/login/")
def get_data_for_dashboard(request):
    str_type = request.POST.get('tipo', 'departamento')
    arr_workspaces = {}
    arr_agrupaciones = {}
    arr_usuarios = {}
    arr_usuarios_workspace = {}

    departamento = request.POST.get('departamento')
    if departamento:
        int_departamento = departamento

    else:
        departamento = User_departamento.objects.filter(user_id=request.user.id).first()
        int_departamento = departamento.departamento_id if departamento else 0
        if request.user.id == 1:
            int_departamento = 18

    if str_type == "departamento":

        arr_workspaces = get_arr_for_json_from_workspace(
            int_departamento=int_departamento,
        )

    elif str_type == "asignado":

        arr_workspaces = get_arr_for_json_from_workspace(
            bool_asignacion=True,
            int_user=request.user.id,
        )

    elif str_type == "personal":
        arr_workspaces = get_arr_for_json_from_workspace(
            int_user=request.user.id,
            es_personal=True,
        )

    arr_etiquetas = list(Etiqueta.objects.values('id', 'nombre').filter(activo=True))
    arr_users_departamento = list(User_departamento.objects.annotate(nombre=F('user__name'), avatar=F('user__avatar'),
                                                                     email=F('user__email')).
                                  values('user_id', 'nombre', 'avatar', 'email').filter(activo=True))

    obj_estados = list(Estado.objects.values('id', 'nombre', 'color').filter(activo=True).order_by('orden'))
    obj_prioridades = list(Prioridad.objects.values('id', 'nombre', 'color').filter(activo=True).order_by('orden'))

    arr_datos = {
        "workspaces": arr_workspaces,
        "agrupaciones": arr_agrupaciones,
        "etiquetas": arr_etiquetas,
        "users_departamento": arr_users_departamento,
        "estados": obj_estados,
        "prioridades": obj_prioridades,
        "usuarios_asignados": arr_usuarios,
        "usuarios_workspaces": arr_usuarios_workspace,
    }

    return JsonResponse(data=arr_datos, safe=False)


@login_required(login_url="/login/")
def get_api_tickets(request):
    int_agrupacion = request.POST.get('agrupacion')
    int_padre = request.POST.get('padre_id', 0)
    str_type = request.POST.get('tipo', 'departamento')
    bool_asignado = True if str_type == "asignado" else False

    arr_tickets = get_arr_for_json_from_tickets(int_agrupacion=int_agrupacion, int_tickets_padre_id=int_padre,
                                                int_user=request.user.id, bool_asignado=bool_asignado)

    return JsonResponse(data=arr_tickets, safe=False)


@login_required(login_url="/login/")
def get_api_agrupaciones(request):
    int_workspace = request.POST.get('workspace')
    arr_agrupaciones = get_arr_for_json_from_agrupacion(int_workspace=int_workspace)

    return JsonResponse(data=arr_agrupaciones, safe=False)


@login_required(login_url="/login/")
def get_api_info_ticket(request):
    int_ticket = request.POST.get('ticket')
    arr_data = get_info_ticket(int_ticket)

    return JsonResponse(data=arr_data, safe=False)


@login_required(login_url="/login/")
def post_create_comentario(request):
    int_ticket = request.POST.get('ticket_id')
    str_comentario = request.POST.get('comentario')
    int_comentario_padre_id = request.POST.get('comentario_padre_id')

    try:
        bool_status = True

        if "data-mention" in str_comentario:
            arr_split = str_comentario.split('data-mention=')

            for str_valor in arr_split:
                arr_split_2 = str_valor.split('_')

                for int_user in arr_split_2:

                    try:
                        tipo_mencion = Tipo_log.objects.filter(identificador='ticket_mencion_comentario').first()
                        int_user = int(int_user)
                        if tipo_mencion:
                            Ticket_log.objects.create(
                                ticket_id=int_ticket,
                                tipo_log_id=tipo_mencion.id,
                                activo=True,
                                afectado_id=None,
                                valor_anterior=None,
                                valor_nuevo=int_user,
                                user_id=request.user.id
                            )

                    except ValueError:
                        pass

        tipo = Tipo_log.objects.filter(identificador='insert_ticket_comentario').first()

        comentario = Ticket_comentario.objects.create(
            ticket_id=int_ticket,
            comentario=str_comentario,
            comentario_padre_id=int_comentario_padre_id,
            user_id=request.user.id,
            activo=True
        )
        int_comentario_id = comentario.id

        file = request.FILES.get('adjunto')
        if file:
            fs = FileSystemStorage()
            str_path = 'tickets/%s/comentarios/%s/%s' % (int_ticket, int_comentario_id, file.name)
            fs.save(str_path, file)
            Ticket_comentario_adjunto.objects.create(
                ticket_comentario_id=int_comentario_id,
                file=str_path,
                activo=True
            )

        if tipo:
            Ticket_log.objects.create(
                ticket_id=int_ticket,
                tipo_log_id=tipo.id,
                activo=True,
                afectado_id=None,
                valor_anterior=None,
                valor_nuevo=str_comentario,
                user_id=request.user.id
            )

    except ValueError:
        bool_status = False
        int_comentario_id = 0

    arr_data = {
        "status": bool_status,
        "comentario_id": int_comentario_id
    }

    return JsonResponse(data=arr_data, safe=False)


@login_required(login_url="/login/")
def post_insert_adjunto_ticket(request):
    int_ticket = request.POST.get('ticket_id')

    try:
        bool_status = True
        int_adjunto = 0

        file = request.FILES.get('adjunto')
        if file:
            fs = FileSystemStorage()
            str_path = 'tickets/%s/adjuntos/%s' % (int_ticket, file.name)
            fs.save(str_path, file)
            str_descripcion = request.POST.get('descripcion')

            if not str_descripcion:
                str_descripcion = file.name

            adjunto = Ticket_adjunto.objects.create(
                ticket_id=int_ticket,
                file=str_path,
                descripcion=str_descripcion,
                activo=True
            )
            int_adjunto = adjunto.id
            tipo = Tipo_log.objects.filter(identificador='insert_ticket_adjunto').first()

            if tipo:
                Ticket_log.objects.create(
                    ticket_id=int_ticket,
                    tipo_log_id=tipo.id,
                    activo=True,
                    afectado_id=None,
                    valor_anterior=None,
                    valor_nuevo=str_descripcion,
                    user_id=request.user.id
                )

    except ValueError:
        bool_status = False
        int_adjunto = 0

    arr_data = {
        "status": bool_status,
        "adjunto_id": int_adjunto
    }

    return JsonResponse(data=arr_data, safe=False)


@login_required(login_url="/login/")
def post_update_ticket(request):
    int_ticket_id = request.POST.get('id')

    try:
        bool_status = True
        str_titulo = request.POST.get('titulo')
        str_descripcion = request.POST.get('descripcion')
        str_causa = request.POST.get('causa')
        str_posible_solucion = request.POST.get('posible_solucion')
        str_fecha_inicio = request.POST.get('fecha_inicio')
        str_fecha_fin = request.POST.get('fecha_fin')
        int_orden = request.POST.get('orden')

        ticket = Ticket.objects.get(id=int_ticket_id)
        tipo = Tipo_log.objects.filter(identificador='update_ticket').first()

        if str_titulo:
            if tipo:
                Ticket_log.objects.create(
                    ticket_id=int_ticket_id,
                    tipo_log_id=tipo.id,
                    activo=True,
                    afectado_id=None,
                    valor_anterior=ticket.titulo,
                    valor_nuevo=str_titulo,
                    user_id=request.user.id
                )
            ticket.titulo = str_titulo

        if str_causa:
            if tipo:
                Ticket_log.objects.create(
                    ticket_id=int_ticket_id,
                    tipo_log_id=tipo.id,
                    activo=True,
                    afectado_id=None,
                    valor_anterior=ticket.causa,
                    valor_nuevo=str_causa,
                    user_id=request.user.id
                )
            ticket.causa = str_causa

        if str_descripcion:
            if tipo:
                Ticket_log.objects.create(
                    ticket_id=int_ticket_id,
                    tipo_log_id=tipo.id,
                    activo=True,
                    afectado_id=None,
                    valor_anterior=ticket.descripcion,
                    valor_nuevo=str_descripcion,
                    user_id=request.user.id
                )
            ticket.descripcion = str_descripcion

        if str_posible_solucion:
            if tipo:
                Ticket_log.objects.create(
                    ticket_id=int_ticket_id,
                    tipo_log_id=tipo.id,
                    activo=True,
                    afectado_id=None,
                    valor_anterior=ticket.posible_solucion,
                    valor_nuevo=str_posible_solucion,
                    user_id=request.user.id
                )
            ticket.posible_solucion = str_posible_solucion

        if str_fecha_inicio:
            if tipo:
                str_fecha = ticket.fecha_hora_inicio.strftime("%d/%m/%Y %H:%M:%S") if ticket.fecha_hora_inicio else None
                arr_split = str_fecha_inicio.split('T')
                arr_split_2 = arr_split[0].split('-')
                str_fecha_log = "%s/%s/%s %s" % (arr_split_2[2], arr_split_2[1], arr_split_2[0], arr_split[1])
                Ticket_log.objects.create(
                    ticket_id=int_ticket_id,
                    tipo_log_id=tipo.id,
                    activo=True,
                    afectado_id=None,
                    valor_anterior=str_fecha,
                    valor_nuevo=str_fecha_log,
                    user_id=request.user.id
                )
            ticket.fecha_hora_inicio = str_fecha_inicio

        if str_fecha_fin:
            if tipo:
                str_fecha = ticket.fecha_hora_fin.strftime("%d/%m/%Y %H:%M:%S") if ticket.fecha_hora_fin else None
                arr_split = str_fecha_fin.split('T')
                arr_split_2 = arr_split[0].split('-')
                str_fecha_log = "%s/%s/%s %s" % (arr_split_2[2], arr_split_2[1], arr_split_2[0], arr_split[1])
                Ticket_log.objects.create(
                    ticket_id=int_ticket_id,
                    tipo_log_id=tipo.id,
                    activo=True,
                    afectado_id=None,
                    valor_anterior=str_fecha,
                    valor_nuevo=str_fecha_log,
                    user_id=request.user.id
                )
            ticket.fecha_hora_fin = str_fecha_fin

        if int_orden:
            if tipo:
                Ticket_log.objects.create(
                    ticket_id=int_ticket_id,
                    tipo_log_id=tipo.id,
                    activo=True,
                    afectado_id=None,
                    valor_anterior=ticket.orden,
                    valor_nuevo=int_orden,
                    user_id=request.user.id
                )
            ticket.orden = int_orden

        ticket.save()

    except Ticket.DoesNotExist:
        bool_status = False

    except ValueError:
        bool_status = False

    data = {
        "status": bool_status
    }
    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_create_ticket(request):
    try:
        bool_status = True
        str_titulo = request.POST.get('titulo', '')
        str_descripcion = request.POST.get('descripcion', '')
        str_posible_solucion = request.POST.get('posible_solucion', '')
        str_fecha_inicio = request.POST.get('fecha_inicio')
        str_fecha_fin = request.POST.get('fecha_fin')
        int_orden = request.POST.get('orden')
        int_estado = request.POST.get('estado')
        int_prioridad = request.POST.get('prioridad')
        int_ticket_padre = request.POST.get('ticket_padre')
        int_agrupacion = request.POST.get('agrupacion')
        grupo = Agrupacion.objects.filter(id=int_agrupacion).first()
        bool_es_personal = True if request.POST.get('es_personal', "0") == "1" else False
        tipo = Tipo_log.objects.filter(identificador='insert_ticket').first()

        if not int_estado:
            estado = Estado.objects.filter(activo=True, orden=1).first()
            int_estado = estado.id

        if not int_prioridad:
            prioridad = Prioridad.objects.filter(activo=True, orden=1).first()
            int_prioridad = prioridad.id

        str_fecha_creacion = datetime.now()

        ticket = Ticket.objects.create(
            titulo=str_titulo,
            descripcion=str_descripcion,
            posible_solucion=str_posible_solucion,
            fecha_hora_inicio=str_fecha_inicio,
            fecha_hora_fin=str_fecha_fin,
            orden=int_orden,
            user_create_id=request.user.id,
            estado_id=int_estado,
            prioridad_id=int_prioridad,
            ticket_padre_id=int_ticket_padre,
            agrupacion_id=int_agrupacion,
            departamento_id=grupo.departamento_id,
            fecha_creacion=str_fecha_creacion,
            es_personal=bool_es_personal,
        )

        if tipo:
            Ticket_log.objects.create(
                ticket_id=ticket.id,
                tipo_log_id=tipo.id,
                activo=False,
                afectado_id=None,
                valor_anterior=None,
                valor_nuevo=str_titulo,
                user_id=request.user.id
            )

    except ValueError:
        bool_status = False

    data = {
        "status": bool_status
    }
    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_delete_ticket(request):
    try:
        bool_status = True
        int_ticket = request.POST.get('ticket_id')

        ticket = Ticket.objects.get(id=int_ticket)
        ticket.activo = False
        ticket.save()

        ticket_log = Ticket_log.objects.filter(ticket_id=ticket.id)

        for log in ticket_log:
            log.activo = False
            log.save()

        tipo = Tipo_log.objects.filter(identificador='delete_ticket').first()

        if tipo:
            Ticket_log.objects.create(
                ticket_id=ticket.id,
                tipo_log_id=tipo.id,
                activo=False,
                afectado_id=None,
                valor_anterior=None,
                valor_nuevo=ticket.titulo,
                user_id=request.user.id
            )

    except ValueError:
        bool_status = False

    data = {
        "status": bool_status
    }
    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_create_agrupacion(request):
    try:
        bool_status = True
        int_workspace = request.POST.get('workspace')
        obj_worskpace = Workspace.objects.values('departamento_id').filter(id=int_workspace).first()
        str_nombre = request.POST.get('nombre')
        str_color = request.POST.get('color')
        int_orden = request.POST.get('orden', 1)
        bool_es_personal = True if request.POST.get('es_personal', "0") == "1" else False

        agrupacion = Agrupacion.objects.create(
            workspace_id=int_workspace,
            departamento_id=obj_worskpace['departamento_id'] if obj_worskpace else None,
            nombre=str_nombre,
            color=str_color,
            orden=int_orden,
            activo=True,
            es_personal=bool_es_personal,
            user_create_id=request.user.id,
        )

        int_agrupacion = agrupacion.id

    except ValueError:
        bool_status = False
        int_agrupacion = 0

    data = {
        "status": bool_status,
        "agrupacion_id": int_agrupacion,
    }
    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_delete_adjunto_ticket(request):
    try:
        bool_status = True
        adjunto_id = request.POST.get('adjunto_id')

        adjunto = Ticket_adjunto.objects.get(id=adjunto_id)
        adjunto.activo = False
        adjunto.save()
        tipo = Tipo_log.objects.filter(identificador='delete_ticket_adjunto').first()

        if tipo:
            Ticket_log.objects.create(
                ticket_id=adjunto.ticket_id,
                tipo_log_id=tipo.id,
                activo=True,
                afectado_id=None,
                valor_anterior=None,
                valor_nuevo=adjunto.descripcion,
                user_id=request.user.id
            )

    except Ticket_adjunto.DoesNotExist:
        bool_status = False
    except ValueError:
        bool_status = False

    data = {
        "status": bool_status
    }
    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_save_asignacion(request):
    int_ticket = request.POST.get('ticket_id', '')
    try:
        bool_status = True
        str_personas = request.POST.get('personas', '')
        arr_personas = str_personas.split(',')
        tipo = Tipo_log.objects.filter(identificador='insert_ticket_usuario').first()

        obj_asignaciones = Ticket_usuario.objects.filter(ticket_id=int_ticket)

        for asignacion in obj_asignaciones:
            key = arr_personas.index(str(asignacion.usuario_id)) if str(
                asignacion.usuario_id) in arr_personas else None

            if key is not None and asignacion.activo is False:
                if tipo:
                    Ticket_log.objects.create(
                        ticket_id=int_ticket,
                        tipo_log_id=tipo.id,
                        activo=True,
                        afectado_id=None,
                        valor_anterior=None,
                        valor_nuevo=asignacion.usuario_id,
                        user_id=request.user.id
                    )

                asignacion.activo = True
                asignacion.save()

            elif key is None and asignacion.activo is True:
                if tipo:
                    Ticket_log.objects.create(
                        ticket_id=int_ticket,
                        tipo_log_id=tipo.id,
                        activo=True,
                        afectado_id=None,
                        valor_anterior=asignacion.usuario_id,
                        valor_nuevo=None,
                        user_id=request.user.id
                    )

                asignacion.activo = False
                asignacion.save()

            if key is not None and key >= 0:
                arr_personas.pop(key)

        for a in arr_personas:
            if len(a) > 0:
                Ticket_usuario.objects.create(
                    ticket_id=int_ticket,
                    usuario_id=a,
                    activo=True
                )

                if tipo:
                    Ticket_log.objects.create(
                        ticket_id=int_ticket,
                        tipo_log_id=tipo.id,
                        activo=True,
                        afectado_id=None,
                        valor_anterior=None,
                        valor_nuevo=a,
                        user_id=request.user.id
                    )

    except ValueError:
        bool_status = False

    obj_asignados = get_usuarios_asignados(int_ticket)

    str_color = get_color_ticket(int_ticket)

    data = {
        "status": bool_status,
        "asignaciones": obj_asignados,
        "color": str_color
    }
    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_save_etiquetas(request):
    int_ticket = request.POST.get('ticket_id', '')
    try:
        bool_status = True
        str_etiquetas = request.POST.get('etiquetas', '')
        arr_etiquetas = str_etiquetas.split(',')

        obj_etiquetas = Ticket_etiqueta.objects.filter(ticket_id=int_ticket)
        tipo = Tipo_log.objects.filter(identificador='update_ticket_etiqueta').first()

        for etiqueta in obj_etiquetas:
            key = arr_etiquetas.index(str(etiqueta.etiqueta_id)) if str(
                etiqueta.etiqueta_id) in arr_etiquetas else None

            if key is not None and etiqueta.activo is False:

                if tipo:
                    Ticket_log.objects.create(
                        ticket_id=int_ticket,
                        tipo_log_id=tipo.id,
                        activo=True,
                        afectado_id=None,
                        valor_anterior=None,
                        valor_nuevo=etiqueta.etiqueta_id,
                        user_id=request.user.id
                    )

                etiqueta.activo = True
                etiqueta.save()

            elif key is None and etiqueta.activo is True:

                if tipo:
                    Ticket_log.objects.create(
                        ticket_id=int_ticket,
                        tipo_log_id=tipo.id,
                        activo=True,
                        afectado_id=None,
                        valor_anterior=etiqueta.etiqueta_id,
                        valor_nuevo=None,
                        user_id=request.user.id
                    )

                etiqueta.activo = 0
                etiqueta.save()

            if key is not None and key >= 0:
                arr_etiquetas.pop(key)

        for a in arr_etiquetas:
            if len(a) > 0:
                Ticket_etiqueta.objects.create(
                    ticket_id=int_ticket,
                    etiqueta_id=a,
                    activo=1
                )

                if tipo:
                    Ticket_log.objects.create(
                        ticket_id=int_ticket,
                        tipo_log_id=tipo.id,
                        activo=True,
                        afectado_id=None,
                        valor_anterior=None,
                        valor_nuevo=a,
                        user_id=request.user.id
                    )

    except ValueError:
        bool_status = False

    obj_etiquetas = get_etiquetas_asignadas(int_ticket)

    str_color = get_color_ticket(int_ticket)

    data = {
        "status": bool_status,
        "etiquetas": obj_etiquetas,
        "color": str_color
    }
    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_update_ticket_estado(request):
    int_ticket_id = request.POST.get('ticket_id')
    int_estado_id = request.POST.get('estado_id')

    try:
        bool_status = True
        tipo = Tipo_log.objects.filter(identificador='update_ticket_estado').first()
        ticket = Ticket.objects.get(id=int_ticket_id)

        if tipo:
            Ticket_log.objects.create(
                ticket_id=int_ticket_id,
                tipo_log_id=tipo.id,
                activo=True,
                afectado_id=None,
                valor_anterior=ticket.estado_id,
                valor_nuevo=int_estado_id,
                user_id=request.user.id
            )

        ticket.estado_id = int_estado_id

        ticket.save()

    except Ticket.DoesNotExist:
        bool_status = False

    except ValueError:
        bool_status = False

    data = {
        "status": bool_status
    }
    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_update_ticket_prioridad(request):
    int_ticket_id = request.POST.get('ticket_id')
    int_prioridad_id = request.POST.get('prioridad_id')

    try:
        bool_status = True
        tipo = Tipo_log.objects.filter(identificador='update_ticket_prioridad').first()
        ticket = Ticket.objects.get(id=int_ticket_id)

        if tipo:
            Ticket_log.objects.create(
                ticket_id=int_ticket_id,
                tipo_log_id=tipo.id,
                activo=True,
                afectado_id=None,
                valor_anterior=ticket.prioridad_id,
                valor_nuevo=int_prioridad_id,
                user_id=request.user.id
            )

        ticket.prioridad_id = int_prioridad_id

        ticket.save()

    except Ticket.DoesNotExist:
        bool_status = False

    except ValueError:
        bool_status = False

    data = {
        "status": bool_status
    }
    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_update_ticket_fechas(request):
    int_ticket_id = request.POST.get('ticket_id')
    str_fecha_inicio = request.POST.get('fecha_inicio')
    str_fecha_fin = request.POST.get('fecha_fin')

    try:
        bool_status = True

        ticket = Ticket.objects.get(id=int_ticket_id)

        if ticket:
            ticket.fecha_hora_inicio = str_fecha_inicio
            ticket.fecha_hora_fin = str_fecha_fin
            ticket.save()

    except Ticket.DoesNotExist:
        bool_status = False

    except ValueError:
        bool_status = False

    data = {
        "status": bool_status
    }
    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def get_data_for_workspace(request):
    int_workspace = request.POST.get('workspace', None)
    str_type = request.POST.get('tipo', 'departamento')
    arr_agrupaciones = {}
    arr_usuarios = {}
    arr_usuarios_workspace = {}

    if int_workspace:

        if str_type == "departamento":
            arr_agrupaciones = get_arr_for_json_from_agrupacion(int_workspace=int_workspace)

        elif str_type == "asignado":
            bool_asignado = Workspace.objects.values('vista_privada').get(id=int_workspace)['vista_privada']
            arr_agrupaciones = get_arr_for_json_from_agrupacion(
                int_workspace=int_workspace,
                bool_asignacion=bool_asignado,
                int_user=request.user.id
            )

        elif str_type == "personal":
            arr_agrupaciones = get_arr_for_json_from_agrupacion(int_workspace=int_workspace, es_personal=True)

        arr_usuarios = get_user_workspace(int_workspace)
        arr_usuarios_workspace = list(Workspace_usuarios.objects.annotate(nombre=F('user__name'),
                                                                          avatar=F('user__avatar')).
                                      values('user_id', 'nombre', 'avatar', 'is_admin').
                                      filter(workspace_id=int_workspace, activo=True))

    arr_datos = {
        "agrupaciones": arr_agrupaciones,
        "usuarios_asignados": arr_usuarios,
        "miembros": arr_usuarios_workspace,
    }

    return JsonResponse(data=arr_datos, safe=False)


@login_required(login_url="/login/")
def post_create_workspace(request):
    bool_status = True

    str_type = request.POST.get('tipo', 'departamento')
    int_workspace = request.POST.get('workspace')
    obj_user_departamento = User_departamento.objects.filter(user_id=request.user.id).first()
    int_departamento = obj_user_departamento.departamento_id if obj_user_departamento else None
    if request.user.id == 1:
        int_departamento = 18

    try:
        str_nombre = request.POST.get('nombre')
        str_color = request.POST.get('color')
        int_orden = request.POST.get('orden', 1)
        int_padre = request.POST.get('padre')
        int_padre = int_padre if int_padre != "null" else None
        bool_es_personal = True if request.POST.get('es_personal', "0") == "1" else False
        bool_vista_privada = True if request.POST.get('vista_privada', "false") == "true" else False

        obj_workspace = Workspace.objects.filter(id=int_workspace).first()

        if obj_workspace:
            if str_nombre:
                obj_workspace.nombre = str_nombre

            if str_color:
                obj_workspace.color = str_color

            obj_workspace.vista_privada = bool_vista_privada

            obj_workspace.save()
        else:
            obj_workspace = Workspace.objects.create(
                departamento_id=int_departamento,
                nombre=str_nombre,
                color=str_color,
                orden=int_orden,
                workspace_id=int_padre,
                activo=True,
                es_personal=bool_es_personal,
                user_create_id=request.user.id,
                vista_privada=bool_vista_privada,
            )

            int_workspace = obj_workspace.id

    except ValueError:
        bool_status = False

    arr_workspaces = {}
    if str_type == "departamento":

        arr_workspaces = get_arr_for_json_from_workspace(
            int_departamento=int_departamento
        )

    elif str_type == "asignado":

        arr_workspaces = get_arr_for_json_from_workspace(
            bool_asignacion=True,
            int_user=request.user.id,
        )

    elif str_type == "personal":
        arr_workspaces = get_arr_for_json_from_workspace(
            int_user=request.user.id,
            es_personal=True,
        )

    data = {
        "status": bool_status,
        "workspaces": arr_workspaces,
        "int_workspace": int_workspace
    }

    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_deshabilitar_workspace(request):
    bool_status = True

    str_type = request.POST.get('tipo', 'departamento')

    int_workspace = request.POST.get('workspace')
    bool_es_personal = True if request.POST.get('es_personal', False) else False

    try:
        obj_workspace = Workspace.objects.filter(id=int_workspace).first()

        if obj_workspace:
            obj_workspace.activo = False
            obj_workspace.save()

    except ValueError:
        bool_status = False

    arr_workspaces = {}
    if str_type == "departamento":
        obj_user_departamento = User_departamento.objects.filter(user_id=request.user.id).first()
        int_departamento = obj_user_departamento.departamento_id if obj_user_departamento else None
        if request.user.id == 1:
            int_departamento = 18

        arr_workspaces = get_arr_for_json_from_workspace(
            int_departamento=int_departamento
        )

    elif str_type == "asignado":

        arr_workspaces = get_arr_for_json_from_workspace(
            bool_asignacion=True,
            int_user=request.user.id,
        )

    data = {
        "status": bool_status,
        "workspaces": arr_workspaces
    }

    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_miembros_workspace(request):
    int_workspace = request.POST.get('workspace_id')
    int_user_id = request.POST.get('user_id')
    bool_eliminar = request.POST.get('bool_eliminar')

    try:
        bool_status = True
        obj_user = Workspace_usuarios.objects.filter(user_id=int_user_id, workspace_id=int_workspace).first()

        if obj_user:
            obj_user.activo = True if not bool_eliminar else False
            obj_user.save()

        else:
            Workspace_usuarios.objects.create(
                workspace_id=int_workspace,
                user_id=int_user_id,
                activo=True if not bool_eliminar else False
            )

        arr_usuarios_workspace = list(Workspace_usuarios.objects.annotate(nombre=F('user__name'),
                                                                          avatar=F('user__avatar')).
                                      values('user_id', 'nombre', 'avatar', 'is_admin').
                                      filter(workspace_id=int_workspace, activo=True))

    except ValueError:
        bool_status = False
        arr_usuarios_workspace = {}

    data = {
        "status": bool_status,
        "miembros": arr_usuarios_workspace
    }

    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_save_admin_workspace(request):
    int_workspace = request.POST.get('workspace_id')
    int_user_id = request.POST.get('user_id')
    bool_admin = request.POST.get('bool_admin')

    try:
        bool_status = True
        obj_user = Workspace_usuarios.objects.filter(user_id=int_user_id, workspace_id=int_workspace).first()

        if obj_user:
            obj_user.is_admin = True if bool_admin else False
            obj_user.save()

        else:
            Workspace_usuarios.objects.create(
                workspace_id=int_workspace,
                user_id=int_user_id,
                is_admin=True if bool_admin else False,
                activo=True
            )

        arr_usuarios_workspace = list(Workspace_usuarios.objects.annotate(nombre=F('user__name'),
                                                                          avatar=F('user__avatar')).
                                      values('user_id', 'nombre', 'avatar', 'is_admin').
                                      filter(workspace_id=int_workspace, activo=True))

    except ValueError:
        bool_status = False
        arr_usuarios_workspace = {}

    data = {
        "status": bool_status,
        "miembros": arr_usuarios_workspace
    }

    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def send_notificaciones_ticket(request):
    arr_logs = Ticket_log.objects.values('ticket_id', 'tipo_log__identificador', 'valor_anterior', 'valor_nuevo',
                                         'user__name', 'id'). \
        filter(tipo_log__identificador__in=('insert_ticket_usuario', 'insert_ticket_comentario',
                                            'ticket_mencion_comentario'), activo=True). \
        exclude(id__in=Ticket_notificacion.objects.values('ticket_log_id').filter(activo=True))

    for arr_log in arr_logs:

        ticket = Ticket.objects.values('id', 'titulo', 'user_create__email', 'user_create_id',
                                       'agrupacion__workspace__nombre',
                                       'agrupacion__nombre', 'departamento_id').get(id=arr_log['ticket_id'])

        # arr_users_notificados = [ticket['user_create_id']]
        # arr_emails = [ticket['user_create__email']]
        arr_users_notificados = []
        arr_emails = []

        users = Ticket_usuario.objects.values('usuario__email', 'usuario_id'). \
            filter(ticket_id=arr_log['ticket_id'], activo=True)
        for user in users:
            if ticket['user_create__email'] != user['usuario__email']:
                arr_emails.append(user['usuario__email'])
            arr_users_notificados.append(user['usuario_id'])

        if arr_log['tipo_log__identificador'] == "insert_ticket":
            str_subject = 'Ingreso de ticket #%s' % arr_log['ticket_id']
            str_body = '%s ingreso el ticket <b>"%s"</b> ' \
                       '<br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           arr_log['user__name'], arr_log['valor_nuevo'], ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "update_ticket":
            str_subject = 'Actualización de datos en ticket #%s' % arr_log['ticket_id']
            str_body = '%s actualizo <b>"%s"</b> por <b>"%s..."</b> ' \
                       '<br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           arr_log['user__name'], (arr_log['valor_anterior'] if arr_log['valor_anterior'] else '-'),
                           arr_log['valor_nuevo'], ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "insert_ticket_comentario":
            str_subject = 'Ingreso de comentario en ticket #%s' % arr_log['ticket_id']
            str_body = '%s ingreso un comentario: "%s" ' \
                       '<br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           arr_log['user__name'], arr_log['valor_nuevo'], ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "ticket_mencion_comentario":
            user_mencion = User.objects.filter(id=arr_log['valor_nuevo']).first()
            arr_emails = [user_mencion.email]
            str_subject = 'Has sido mencionado en el ticket #%s' % arr_log['ticket_id']
            str_body = '%s te menciono en un comentario de un ticket. ' \
                       '<br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           arr_log['user__name'], ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "insert_ticket_usuario":
            if arr_log['valor_nuevo']:
                str_subject = 'Asigno usuario en ticket #%s' % arr_log['ticket_id']
                user = User.objects.get(id=arr_log['valor_nuevo'])
            else:
                str_subject = 'Desasigno usuario en ticket #%s' % arr_log['ticket_id']
                user = User.objects.get(id=arr_log['valor_anterior'])
            str_body = '%s cambio asignación <b>"%s"</b> <br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                arr_log['user__name'], user.name, ticket['agrupacion__workspace__nombre'], ticket['agrupacion__nombre'],
                ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "insert_ticket_adjunto":
            str_subject = 'Agrego un adjunto en ticket #%s' % arr_log['ticket_id']
            str_body = '%s agrego el adjunto <b>"%s"</b>  <br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                arr_log['user__name'], arr_log['valor_nuevo'], ticket['agrupacion__workspace__nombre'],
                ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "delete_ticket_adjunto":
            str_subject = 'Elimino un adjunto en ticket #%s' % arr_log['ticket_id']
            str_body = '%s elimino el adjunto <b>"%s"</b> <br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                arr_log['user__name'], arr_log['valor_anterior'], ticket['agrupacion__workspace__nombre'],
                ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "update_ticket_estado":
            str_subject = 'Cambio de estado en ticket #%s' % arr_log['ticket_id']

            if not arr_log['valor_anterior']:
                str_estado_anterior = '-'

            else:
                estado = Estado.objects.get(id=arr_log['valor_anterior'])
                str_estado_anterior = estado.nombre

            if arr_log['valor_nuevo']:
                estado = Estado.objects.get(id=arr_log['valor_nuevo'])
                str_estado_nuevo = estado.nombre

            else:
                str_estado_nuevo = '-'

            str_body = '%s cambio de estado <b>"%s"</b> a <b>"%s"</b>' \
                       ' <br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           arr_log['user__name'], str_estado_anterior, str_estado_nuevo,
                           ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "update_ticket_prioridad":
            str_subject = 'Cambio de prioridad en ticket'

            if arr_log['valor_anterior']:
                prioridad = Prioridad.objects.get(id=arr_log['valor_anterior'])
                str_prioridad_anterior = prioridad.nombre

            else:
                str_prioridad_anterior = '-'

            if arr_log['valor_nuevo']:
                prioridad = Prioridad.objects.get(id=arr_log['valor_nuevo'])
                str_prioridad_nuevo = prioridad.nombre

            else:
                str_prioridad_nuevo = '-'

            str_body = '%s cambio de prioridad <b>"%s"</b> a "%s"' \
                       ' <br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           arr_log['user__name'], str_prioridad_anterior, str_prioridad_nuevo,
                           ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "update_ticket_etiqueta":
            str_subject = 'Se agrego etiqueta en ticket' if arr_log['valor_anterior'] else 'Se quito etiqueta en ticket'

            etiqueta = Etiqueta.objects. \
                get(id=arr_log['valor_anterior'] if arr_log['valor_anterior'] else arr_log['valor_nuevo'])
            str_etiqueta = etiqueta.nombre

            str_body = '%s cambio de etiqueta <b>"%s"</b> <br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                arr_log['user__name'], str_etiqueta, ticket['agrupacion__workspace__nombre'],
                ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        else:
            str_subject = 'Notificación de ticket'
            str_body = 'Notificación de ticket'

        str_html = """
            <table style="width: 100%%;">
                <tbody>
                    <tr>
                        <td width="25%%">&nbsp;</td>
                        <td width="50%%">
                            <table style="width: 100%%; border: 1px solid #dddddd; border-radius: 3px;">
                                <tbody>
                                    <tr>
                                        <td style="text-align: center; padding: 20px;">
                                            <img src="%s" 
                                            alt="No se puedo cargar la imagen" style="width: 100%%" width="100%%">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="background: #333333; color: white; text-align:center;">
                                            <h2>Notificación del modulo de My Day.</h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center; padding: 20px;">
                                            %s
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                        <td width="35%%">&nbsp;</td>
                    </tr>
                </tbody>
            </table> 
        """ % (IMAGEN_GB, str_body)

        if not DEBUG and len(arr_emails):
            msg = EmailMessage(str_subject, str_html, 'nova@grupobuena.com', arr_emails)
            msg.content_subtype = "html"  # Main content is now text/html
            msg.send()

            for arr_user in arr_users_notificados:
                Ticket_notificacion.objects.create(
                    ticket_log_id=arr_log['id'],
                    user_notificado_id=arr_user,
                )

    # envio de correos de tickets por vencer el dia de hoy o vencidos todos los dias a las 10 am
    int_hour = datetime.now().hour
    if int_hour == 10:
        today = date.today()
        tickets_por_vencer = Ticket.objects.select_related('agrupacion', 'agrupacion__workspace'). \
            filter(activo=True, archivado=False, fecha_hora_fin__day=today.day, fecha_hora_fin__month=today.month,
                   fecha_hora_fin__year=today.year, aviso_por_vencer=False, agrupacion__activo=True,
                   agrupacion__workspace__activo=True).exclude(estado_id=5)

        for ticket in tickets_por_vencer:
            str_subject = 'Ticket por vencer'
            str_body = 'Se te informa que el ticket <b>"%s -> %s -> #%s %s"</b> vence el día de hoy.' % (
                ticket.agrupacion.workspace.nombre, ticket.agrupacion.nombre, ticket.id, ticket.titulo
            )
            str_html = """
                <table style="width: 100%%;">
                    <tbody>
                        <tr>
                            <td width="25%%">&nbsp;</td>
                            <td width="50%%">
                                <table style="width: 100%%; border: 1px solid #dddddd; border-radius: 3px;">
                                    <tbody>
                                        <tr>
                                            <td style="text-align: center; padding: 20px;">
                                                <img src="%s" 
                                                alt="No se puedo cargar la imagen" style="width: 100%%" width="100%%">
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="background: #333333; color: white; text-align:center;">
                                                <h2>Notificación del modulo de My Day.</h2>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center; padding: 20px;">
                                                %s
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td width="35%%">&nbsp;</td>
                        </tr>
                    </tbody>
                </table>
            """ % (IMAGEN_GB, str_body)

            users_por_vencer = Ticket_usuario.objects.values('usuario__email').filter(ticket_id=ticket.id,
                                                                                      activo=True)

            arr_emails_por_vencer = []
            for user in users_por_vencer:
                arr_emails_por_vencer.append(user['usuario__email'])

            if not DEBUG and arr_emails_por_vencer:
                msg = EmailMessage(str_subject, str_html, 'nova@grupobuena.com', arr_emails_por_vencer)
                msg.content_subtype = "html"
                msg.send()

                ticket.aviso_por_vencer = True
                ticket.save()

        tickets_vencidos = Ticket.objects.select_related('agrupacion', 'agrupacion__workspace'). \
            filter(activo=True, archivado=False, fecha_hora_fin__lt=today, agrupacion__activo=True,
                   agrupacion__workspace__activo=True). \
            filter(Q(fecha_aviso_vencido__lt=today) | Q(fecha_aviso_vencido__isnull=True)).exclude(estado_id=5)

        str_subject = 'Ticket vencido'
        if tickets_vencidos:

            arr_correos = {}
            for ticket in tickets_vencidos:
                users_por_vencer = Ticket_usuario.objects.values('usuario__email').filter(ticket_id=ticket.id,
                                                                                          activo=True)

                ticket.fecha_aviso_vencido = today
                ticket.save()

                for user in users_por_vencer:
                    if user['usuario__email'] not in arr_correos:
                        arr_correos[user['usuario__email']] = {
                            "correo": ""
                        }

                    arr_correos[user['usuario__email']]["correo"] += '<b>"%s -> %s -> #%s %s"</b>. <br><br>' % (
                        ticket.agrupacion.workspace.nombre, ticket.agrupacion.nombre, ticket.id, ticket.titulo
                    )

            for correo in arr_correos:
                str_html = """
                    <table style="width: 100%%;">
                        <tbody>
                            <tr>
                                <td width="25%%">&nbsp;</td>
                                <td width="50%%">
                                    <table style="width: 100%%; border: 1px solid #dddddd; border-radius: 3px;">
                                        <tbody>
                                            <tr>
                                                <td style="text-align: center; padding: 20px;">
                                                    <img src="%s" alt="No se puedo cargar la imagen" 
                                                    style="width: 100%%" width="100%%">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="background: #333333; color: white; text-align:center;">
                                                    <h2>Notificación del modulo de My Day.</h2>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: center; padding: 20px;">
                                                    Se te informa que los siguientes tickets están vencidos: <br> %s
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td width="35%%">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                """ % (IMAGEN_GB, arr_correos[correo]['correo'])

                if not DEBUG:
                    msg = EmailMessage(str_subject, str_html, 'nova@grupobuena.com', [correo])
                    msg.content_subtype = "html"
                    msg.send()

    data = {
        "status": True,
    }

    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_update_grupo(request):
    arr_grupo = request.POST.getlist('grupo_id[]')
    arr_delete = request.POST.getlist('deshabilitar_grupo[]')
    arr_nombre = request.POST.getlist('nombre_grupo[]')
    arr_color = request.POST.getlist('color_grupo[]')
    arr_orden = request.POST.getlist('orden_grupo[]')
    arr_workspace = request.POST.getlist('workspace_grupo[]')

    try:
        bool_status = True
        int_count = 0
        for int_grupo in arr_grupo:
            grupo = Agrupacion.objects.get(id=int_grupo)
            bool_delete = arr_delete[int_count]
            str_nombre = arr_nombre[int_count]
            str_color = arr_color[int_count]
            int_orden = arr_orden[int_count]
            int_workspace = arr_workspace[int_count]

            grupo.nombre = str_nombre
            grupo.color = str_color
            grupo.orden = int_orden
            grupo.workspace_id = int_workspace

            if bool_delete == '1':
                grupo.activo = False
            else:
                grupo.activo = True

            grupo.save()
            int_count += 1

    except ValueError:
        bool_status = False

    data = {
        "status": bool_status,
    }

    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def post_update_agrupacion_ticket(request):
    int_ticket = request.POST.get('ticket_id')
    int_agrupacion = request.POST.get('agrupacion_id')

    try:
        bool_status = True

        tipo = Tipo_log.objects.filter(identificador='update_ticket_agrupacion').first()
        ticket = Ticket.objects.get(id=int_ticket)

        if tipo:
            Ticket_log.objects.create(
                ticket_id=int_ticket,
                tipo_log_id=tipo.id,
                activo=True,
                afectado_id=None,
                valor_anterior=ticket.agrupacion_id,
                valor_nuevo=int_agrupacion,
                user_id=request.user.id
            )

        update_recursivo_agrupacion(int_ticket, int_agrupacion)

    except ValueError:
        bool_status = False

    data = {
        "status": bool_status,
    }

    return JsonResponse(data=data, safe=False)


def update_recursivo_agrupacion( int_padre, int_agrupacion ):
    ticket = Ticket.objects.get(id=int_padre)
    ticket.agrupacion_id = int_agrupacion
    ticket.save()

    tickets_hijos = Ticket.objects.filter(ticket_padre_id=int_padre)
    if tickets_hijos:
        for hijo in tickets_hijos:
            update_recursivo_agrupacion(hijo.id, int_agrupacion)

    return True


@login_required(login_url="/login/")
def post_duplicate_agrupacion(request):
    try:
        bool_status = True
        arr_grupos = request.POST.getlist('duplicar_agrupacion[]')

        for int_agrupacion in arr_grupos:
            grupo = Agrupacion.objects.get(id=int_agrupacion)

            grupo_duplicado = Agrupacion.objects.create(
                nombre=grupo.nombre,
                departamento_id=grupo.departamento_id,
                color=grupo.color,
                orden=grupo.orden,
                activo=grupo.activo,
                workspace_id=grupo.workspace_id,
                es_personal=grupo.es_personal,
                user_create_id=grupo.user_create_id
            )

            # busco los tickets padres para duplicarlos y luego sigo con los hijos
            tickets = Ticket.objects.filter(agrupacion_id=grupo.id, ticket_padre_id__isnull=True)
            for ticket in tickets:
                duplicate_ticket(ticket, grupo_duplicado.id)

    except ValueError:
        bool_status = False

    data = {
        "status": bool_status,
    }

    return JsonResponse(data=data, safe=False)


def duplicate_ticket(ticket, int_grupo, int_padre=None):
    # duplico el ticket
    ticket_duplicado = Ticket.objects.create(
        titulo=ticket.titulo,
        descripcion=ticket.descripcion,
        causa=ticket.causa,
        posible_solucion=ticket.posible_solucion,
        estado_id=ticket.estado_id,
        prioridad_id=ticket.prioridad_id,
        fecha_creacion=ticket.fecha_creacion,
        user_create_id=ticket.user_create_id,
        ticket_padre_id=int_padre,
        es_personal=ticket.es_personal,
        ticket_dependiente_id=ticket.ticket_dependiente_id,
        fecha_hora_inicio=ticket.fecha_hora_inicio,
        fecha_hora_fin=ticket.fecha_hora_fin,
        activo=ticket.activo,
        archivado=ticket.archivado,
        orden=ticket.orden,
        plantilla_id=ticket.plantilla_id,
        agrupacion_id=int_grupo,
        aviso_por_vencer=ticket.aviso_por_vencer,
        fecha_aviso_vencido=ticket.fecha_aviso_vencido,
        departamento_id=ticket.departamento_id,
    )

    # duplico la iniciativa, esto es para MC
    ticket_iniciativa = Ticket_iniciativas.objects.filter(ticket_id=ticket.id).first()
    if ticket_iniciativa:
        Ticket_iniciativas.objects.create(
            ticket_id=ticket_duplicado.id,
            departamento_afectado_id=ticket_iniciativa.departamento_afectado_id,
            ponderacion=ticket_iniciativa.ponderacion,
            comentario=ticket_iniciativa.comentario,
            activo=ticket_iniciativa.activo,
        )

    # duplico la ponderación, esto es para MC
    ticket_ponderacion = Ticket_ponderacion.objects.filter(ticket_id=ticket.id).first()
    if ticket_ponderacion:
        Ticket_ponderacion.objects.create(
            ticket_id=ticket_duplicado.id,
            regla_id=ticket_ponderacion.regla_id,
            valor=ticket_ponderacion.valor,
            nombre=ticket_ponderacion.nombre,
            porcentaje=ticket_ponderacion.porcentaje,
            valor_maximo=ticket_ponderacion.valor_maximo,
            valor_ascendente=ticket_ponderacion.valor_ascendente,
            activo=ticket_ponderacion.activo,
        )

    # duplico el tiempo (no se donde se usa esta tabla)
    ticket_tiempo = Ticket_tiempo.objects.filter(ticket_id=ticket.id).first()
    if ticket_tiempo:
        Ticket_tiempo.objects.create(
            ticket_id=ticket_duplicado.id,
            fecha_hora_inicio=ticket_tiempo.fecha_hora_inicio,
            fecha_hora_fin=ticket_tiempo.fecha_hora_fin,
            hora_total=ticket_tiempo.hora_total,
            activo=ticket_tiempo.activo,
        )

    # duplico las etiquetas del ticket
    ticket_etiquetas = Ticket_etiqueta.objects.filter(ticket_id=ticket.id)
    for etiqueta in ticket_etiquetas:
        Ticket_etiqueta.objects.create(
            ticket_id=ticket_duplicado.id,
            etiqueta_id=etiqueta.etiqueta_id,
            activo=etiqueta.activo,
        )

    # duplico la asignacion del ticket
    ticket_usuarios = Ticket_usuario.objects.filter(ticket_id=ticket.id)
    for usuario in ticket_usuarios:
        Ticket_usuario.objects.create(
            ticket_id=ticket_duplicado.id,
            usuario_id=usuario.usuario_id,
            activo=usuario.activo,
        )

    # duplico los adjuntos del ticket
    ticket_adjuntos = Ticket_adjunto.objects.filter(ticket_id=ticket.id)
    for adjunto in ticket_adjuntos:
        Ticket_adjunto.objects.create(
            ticket_id=ticket_duplicado.id,
            file=adjunto.file.name,
            descripcion=adjunto.descripcion,
            activo=adjunto.activo,
        )

    # duplico los comentarios padres
    ticket_comentarios = Ticket_comentario.objects.filter(ticket_id=ticket.id, comentario_padre_id__isnull=True)
    for comentario in ticket_comentarios:
        ticket_comentario = Ticket_comentario.objects.create(
            ticket_id=ticket_duplicado.id,
            comentario_padre_id=None,
            comentario=comentario.comentario,
            user_id=comentario.user_id,
            activo=comentario.activo,
        )

        # duplico los adjuntos de los comentarios
        ticket_comentario_adjuntos = Ticket_comentario_adjunto.objects.filter(
            ticket_comentario_id=comentario.id)
        for comentario_adjunto in ticket_comentario_adjuntos:
            Ticket_comentario_adjunto.objects.create(
                ticket_comentario_id=ticket_comentario.id,
                file=comentario_adjunto.file.name,
                activo=comentario_adjunto.activo,
            )

        # busco y duplico las respuestas de los comentarios (comentarios hijos)
        comentario_hijos = Ticket_comentario.objects.filter(ticket_id=ticket.id, comentario_padre_id=comentario.id)
        for comentario_hijo in comentario_hijos:
            ticket_comentario_hijo = Ticket_comentario.objects.create(
                ticket_id=ticket_duplicado.id,
                comentario_padre_id=ticket_comentario.id,
                comentario=comentario.comentario,
                user_id=comentario.user_id,
                activo=comentario.activo,
            )

            # duplico los adjuntos las respuestas de los comentarios (comentarios hijos)
            ticket_comentario_hijo_adjuntos = Ticket_comentario_adjunto.objects.filter(
                ticket_comentario_id=comentario_hijo.id)
            for comentario_hijo_adjunto in ticket_comentario_hijo_adjuntos:
                Ticket_comentario_adjunto.objects.create(
                    ticket_comentario_id=ticket_comentario_hijo.id,
                    file=comentario_hijo_adjunto.file.name,
                    activo=comentario_hijo_adjunto.activo,
                )

    # duplico el log del ticket
    ticket_logs = Ticket_log.objects.filter(ticket_id=ticket.id)
    for log in ticket_logs:
        ticket_log = Ticket_log.objects.create(
            ticket_id=ticket_duplicado.id,
            tipo_log_id=log.tipo_log_id,
            afectado_id=log.afectado_id,
            activo=True,
            valor_anterior=log.valor_anterior,
            valor_nuevo=log.valor_nuevo,
            user_id=log.user_id,
        )

        # duplico las notificaciones del ticket para que no notifique pero si muestre el log
        Ticket_notificacion.objects.create(
            ticket_log_id=ticket_log.id,
            user_notificado_id=log.user_id,
            activo=True,
        )
        # ticket_notificaciones = Ticket_notificacion.objects.filter(ticket_log_id=log.id)
        # for notificacion in ticket_notificaciones:
        #     Ticket_notificacion.objects.create(
        #         ticket_log_id=ticket_log.id,
        #         user_notificado_id=notificacion.user_notificado_id,
        #         activo=notificacion.activo,
        #     )

    # ahora busco a los hijos del ticket duplicado para hacer lo mismo con ellos
    ticket_hijos = Ticket.objects.filter(ticket_padre_id=ticket.id)
    for hijos in ticket_hijos:
        duplicate_ticket(hijos, int_grupo, ticket_duplicado.id)


def get_user_workspace(int_workspace):
    return list(Ticket_usuario.objects.annotate(nombre=F('usuario__name'), foto=F('usuario__avatar'),
                                                user_id=F('usuario__id')).
                values('nombre', 'user_id', 'foto').
                filter(ticket__agrupacion__workspace_id=int_workspace, activo=True).distinct())


def get_info_ticket(int_ticket):
    try:
        bool_status = True

        ticket = Ticket.objects.get(id=int_ticket)
        arr_general = {
            "id": ticket.id,
            "titulo": ticket.titulo,
            "descripcion": ticket.descripcion,
            "causa": ticket.causa,
            "posible_solucion": ticket.posible_solucion,
            "fecha_creacion": ticket.created_at.strftime("%d/%m/%Y %H:%M:%S"),
            "fecha_inicio": ticket.fecha_hora_inicio.strftime("%Y-%m-%dT%H:%M") if ticket.fecha_hora_inicio else None,
            "fecha_fin": ticket.fecha_hora_fin.strftime("%Y-%m-%dT%H:%M") if ticket.fecha_hora_fin else None,
            "usuario_creador": ticket.user_create.name,
            "estado_id": ticket.estado_id,
            "estado": ticket.estado.nombre,
            "estado_color": ticket.estado.color,
            "prioridad_id": ticket.prioridad_id,
            "prioridad": ticket.prioridad.nombre,
            "prioridad_color": ticket.prioridad.color,
            "agrupacion_id": ticket.agrupacion_id,
            "user_create": ticket.user_create_id,
        }

        arr_asignados = list(Ticket_usuario.objects.annotate(nombre=F('usuario__name'), avatar=F('usuario__avatar')).
                             values('usuario_id', 'nombre', 'avatar').filter(activo=True, ticket_id=int_ticket))

        arr_adjuntos = list(Ticket_adjunto.objects.annotate(adjunto_id=F('id'), adjunto=F('file')).
                            values('adjunto_id', 'adjunto', 'descripcion').filter(activo=True, ticket_id=int_ticket))

        sql_comentario = """
            SELECT
                C.id,
                C.comentario,
                C.comentario_padre_id,
                A.[file] AS adjunto,
                U.name,
                IIF(U.avatar = '', 'default-avatar.png', U.avatar) AS avatar,
                FORMAT(C.created_at, 'dd/MM/yy hh:mm:ss') AS fecha_creacion 
            FROM NOVA..tickets_ticket_comentario C
            INNER JOIN NOVA..auth_user U ON U.id = C.user_id
            LEFT JOIN NOVA..tickets_ticket_comentario_adjunto A ON A.ticket_comentario_id = C.id AND A.activo = 1
            WHERE
                C.activo = 1
            AND C.ticket_id = %s
            ORDER BY
                C.comentario_padre_id
        """
        arr_comentarios = get_query(str_sql=sql_comentario, params=(int_ticket,), print_debug=False, print_result=False)

        arr_logs = list(Ticket_log.objects.
                        annotate(titulo=F('tipo_log__nombre'), nombre=F('user__name'), avatar=F('user__avatar'),
                                 identificador=F('tipo_log__identificador'),
                                 fecha=ExpressionWrapper(Func(F('created_at'), Value('dd/MM/yyyy HH:mm:ss'),
                                                              function='FORMAT'), output_field=CharField())).
                        values('titulo', 'valor_anterior', 'valor_nuevo', 'nombre', 'avatar', 'fecha',
                               'identificador').
                        filter(ticket_id=int_ticket, ticket__activo=True, activo=True).order_by('-id'))

        arr_logs_nuevo = []
        for log in arr_logs:
            if log["identificador"] == "update_ticket_agrupacion":
                obj_agrupacion_ant = Agrupacion.objects.annotate(workspace_nombre=F('workspace__nombre')). \
                    values('workspace_nombre', 'nombre').filter(id=log["valor_anterior"]).first()
                log["agrupacion_anterior"] = obj_agrupacion_ant["workspace_nombre"] + " - " + \
                                             obj_agrupacion_ant["nombre"]

                obj_agrupacion_nue = Agrupacion.objects.annotate(workspace_nombre=F('workspace__nombre')). \
                    values('workspace_nombre', 'nombre').filter(id=log["valor_nuevo"]).first()
                log["agrupacion_nueva"] = obj_agrupacion_nue["workspace_nombre"] + " - " + \
                                          obj_agrupacion_nue["nombre"]
            arr_logs_nuevo.append(log)

        arr_logs = arr_logs_nuevo

    except ValueError:
        bool_status = False
        arr_general = {}
        arr_comentarios = {}
        arr_asignados = {}
        arr_adjuntos = {}
        arr_logs = {}

    arr_return = {
        "status": bool_status,
        "general": arr_general,
        "comentarios": arr_comentarios,
        "asignados": arr_asignados,
        "adjuntos": arr_adjuntos,
        "logs": arr_logs,
    }
    return arr_return


def get_arr_for_json_from_tickets(int_agrupacion, int_tickets_padre_id=0, int_user=0, bool_asignado=False):
    obj_agrupacion = Agrupacion.objects.get(id=int_agrupacion)

    obj_permiso = Workspace_usuarios.objects. \
        values('user_id', 'is_admin'). \
        filter(workspace_id=obj_agrupacion.workspace_id, activo=True, user_id=int_user, is_admin=True).first()

    bool_is_admin = False

    if obj_permiso and obj_permiso["is_admin"]:
        bool_is_admin = True

    arr_tickest = {}
    tickets = get_tickets(
        int_grupo=int_agrupacion,
        int_tickets_padre_id=int_tickets_padre_id,
        bool_asignado=bool_asignado,
        int_user=int_user,
        bool_is_admin=bool_is_admin,
    )
    today = datetime.now()

    int_count = 0
    for ticket in tickets:

        int_estado = ticket['estado_id']
        str_estado_color = ticket['estado_color']
        str_estado = ticket['estado']
        if ticket['fecha_fin'] and int_estado != 5 and int_estado != 4 and ticket['fecha_fin'] < today:
            int_estado = 4
            str_estado_color = '#e2445c'
            str_estado = 'Estancado'
            obj_ticket = Ticket.objects.get(id=ticket['id'])
            obj_ticket.estado_id = 4
            obj_ticket.save()

        arr_hijos = {}
        if not bool_asignado and ticket['hijos']:
            arr_hijos = get_arr_for_json_from_tickets(
                int_agrupacion=int_agrupacion,
                int_tickets_padre_id=ticket['id'],
                int_user=int_user,
                bool_asignado=bool_asignado
            )

        arr_personas = {}
        if ticket['usuarios_name']:
            arr_split_usuarios = ticket['usuarios_name'].split('|_|')
            arr_split_fotos = ticket['usuarios_fotos'].split('|_|')
            arr_split_ids = ticket['usuarios_id'].split('|_|')

            int_count_personas = 0
            for usuario in arr_split_usuarios:
                arr_personas[int_count_personas] = {
                    "id": arr_split_ids[int_count_personas],
                    "nombre": usuario,
                    "foto": arr_split_fotos[int_count_personas],
                }
                int_count_personas += 1

        arr_etiquetas = {}
        if ticket['etiquetas']:
            arr_split_etiquetas = ticket['etiquetas'].split('|_|')
            arr_split_ids = ticket['etiquetas_id'].split('|_|')

            int_count_etiqueta = 0
            for etiqueta in arr_split_etiquetas:
                arr_etiquetas[int_count_etiqueta] = {
                    "id": arr_split_ids[int_count_etiqueta],
                    "nombre": etiqueta,
                }
                int_count_etiqueta += 1

        arr_tickest[int_count] = {
            "id": ticket['id'],
            "nombre": ticket['titulo'],
            "estado": str_estado,
            "estado_color": str_estado_color,
            "estado_id": int_estado,
            "prioridad": ticket['prioridad'],
            "prioridad_color": ticket['prioridad_color'],
            "prioridad_id": ticket['prioridad_id'],
            "fecha_inicio": ticket['fecha_inicio'].strftime("%Y-%m-%d %H:%M:%S") if ticket['fecha_inicio'] else '',
            "fecha_fin": ticket['fecha_fin'].strftime("%Y-%m-%d %H:%M:%S") if ticket['fecha_fin'] else '',
            "user_create": ticket['user_id'],
            "fecha_creacion": ticket['fecha_creacion'].strftime("%Y-%m-%d %H:%M:%S"),
            "personas": arr_personas,
            "hijos": arr_hijos,
            "count_hijos": ticket['hijos'],
            "etiquetas": arr_etiquetas,
            "comentarios": ticket['comentarios'],
            "ponderacion": ticket['ponderacion'],
            "orden": ticket['orden'],
            "padre_id": int_tickets_padre_id,
        }
        int_count += 1

    return arr_tickest


def get_arr_for_json_from_agrupacion(int_workspace=0, int_departamento=0, int_user=0, es_personal=False,
                                     bool_all=False, bool_asignacion=False):
    arr_agrupacion = {}
    agrupaciones = get_agrupaciones(
        int_workspace=int_workspace,
        int_departamento=int_departamento,
        int_user=int_user,
        es_personal=es_personal,
        bool_all=bool_all
    )

    int_count = 0
    for agrupacion in agrupaciones:
        arr_tickets = get_arr_for_json_from_tickets(agrupacion.id, bool_asignado=bool_asignacion, int_user=int_user)
        int_count_tickets = Ticket.objects.filter(agrupacion_id=agrupacion.id, activo=True, archivado=False,
                                                  es_personal=es_personal).count()
        if not bool_asignacion or bool_asignacion and len(arr_tickets):
            ponderacion = agrupacion.ticket_iniciativas_set.values('ponderacion')

            int_ponderacion = ponderacion[0]['ponderacion'] if ponderacion else 0

            # print('\n', int_ponderacion, '\n')
            arr_agrupacion[int_count] = {
                "id": agrupacion.id,
                "workspace_id": agrupacion.workspace_id,
                "nombre": agrupacion.nombre,
                "ponderacion": int_ponderacion,
                "color": agrupacion.color,
                "count_tickets": int_count_tickets if not bool_asignacion else len(arr_tickets),
                "tickets": arr_tickets,
                "orden": agrupacion.orden,
            }
            int_count += 1

    return arr_agrupacion


def get_arr_for_json_from_workspace(int_departamento=0, int_user=0, es_personal=False, bool_asignacion=False):
    arr_workspaces = {}
    workspaces = get_workspaces(int_departamento=int_departamento, int_user=int_user, es_personal=es_personal,
                                bool_asignacion=bool_asignacion)

    if bool_asignacion:
        return generate_array_workspace_personal(workspaces=workspaces, int_user=int_user)

    int_count = 0
    for workspace in workspaces:

        if not workspace.workspace_id:
            arr_hijos = get_hijos_workspace(int_id=workspace.id)
            int_agrupacion = Agrupacion.objects.filter(workspace_id=workspace.id).count()

            arr_workspaces[int_count] = {
                "hijos": arr_hijos,
                "nombre": workspace.nombre,
                "color": workspace.color,
                "id": workspace.id,
                "orden": workspace.orden,
                "padre": workspace.workspace_id,
                "vista_privada": workspace.vista_privada,
                "agrupaciones": int_agrupacion,
            }
            int_count += 1

    return arr_workspaces


def generate_array_workspace_personal(workspaces, int_user=0):
    arr_workspaces = {}

    for workspace in workspaces:

        int_agrupacion = Agrupacion.objects.filter(workspace_id=workspace.id).count()
        if not workspace.workspace_id:
            bool_admin = Workspace_usuarios.objects.values('is_admin').filter(workspace_id=workspace.id,
                                                                              user_id=int_user, activo=True).first()
            arr_workspaces[workspace.id] = {
                "hijos": {},
                "nombre": workspace.nombre,
                "color": workspace.color,
                "id": workspace.id,
                "orden": workspace.orden,
                "padre": workspace.workspace_id,
                "vista_privada": workspace.vista_privada,
                "agrupaciones": int_agrupacion,
                "is_admin": bool_admin['is_admin'] if bool_admin else False,
            }

        else:
            arr_workspaces_tmp = get_workspace_padre(workspace.id, int_user=int_user)
            merge(arr_workspaces, arr_workspaces_tmp)

    return arr_workspaces


def get_workspace_padre(int_id, int_user=0, arr_hijo=None):
    if arr_hijo is None:
        arr_hijo = {}
    workspace = Workspace.objects.get(id=int_id)
    int_agrupacion = Agrupacion.objects.filter(workspace_id=workspace.id).count()
    bool_admin = Workspace_usuarios.objects.values('is_admin').filter(workspace_id=workspace.id, user_id=int_user,
                                                                      activo=True).first()

    if not workspace.workspace_id:
        return {workspace.id: {
            "hijos": arr_hijo,
            "nombre": workspace.nombre,
            "color": workspace.color,
            "id": workspace.id,
            "orden": workspace.orden,
            "padre": workspace.workspace_id,
            "vista_privada": workspace.vista_privada,
            "agrupaciones": int_agrupacion,
            "is_admin": bool_admin['is_admin'] if bool_admin else False,
        }}

    else:
        arr_padre = {workspace.id: {
            "hijos": arr_hijo,
            "nombre": workspace.nombre,
            "color": workspace.color,
            "id": workspace.id,
            "orden": workspace.orden,
            "padre": workspace.workspace_id,
            "vista_privada": workspace.vista_privada,
            "agrupaciones": int_agrupacion,
            "is_admin": bool_admin['is_admin'] if bool_admin else False,
        }}
        return get_workspace_padre(int_id=workspace.workspace_id, int_user=int_user, arr_hijo=arr_padre)


def get_hijos_workspace(int_id):
    workspaces = get_workspaces(workspace_padre_id=int_id)

    if workspaces:

        arr_workspaces = {}
        int_count = 0
        for workspace in workspaces:
            int_agrupacion = Agrupacion.objects.filter(workspace_id=workspace.id).count()
            arr_hijos = get_hijos_workspace(workspace.id)
            arr_workspaces[int_count] = {
                "hijos": arr_hijos,
                "nombre": workspace.nombre,
                "color": workspace.color,
                "id": workspace.id,
                "orden": workspace.orden,
                "padre": workspace.workspace_id,
                "vista_privada": workspace.vista_privada,
                "agrupaciones": int_agrupacion,
            }
            int_count += 1

        return arr_workspaces

    else:
        return {}


def get_workspaces(int_departamento=0, es_personal=False, workspace_padre_id=0, bool_all=False, int_user=0,
                   bool_activo=True, bool_asignacion=False):
    workspaces = None
    if bool_all:
        workspaces = Workspace.objects.filter(activo=bool_activo).order_by('orden')
    elif int_departamento:
        workspaces = Workspace.objects.filter(departamento_id=int_departamento, activo=bool_activo,
                                              es_personal=False).order_by('orden')
    elif es_personal and int_user:
        workspaces = Workspace.objects.filter(es_personal=True, user_create_id=int_user, activo=bool_activo). \
            order_by('orden')
    elif bool_asignacion and int_user:
        workspaces_asignados = Workspace_usuarios.objects.values_list('workspace_id').filter(user_id=int_user,
                                                                                             activo=True)
        workspaces = Workspace.objects.filter(id__in=workspaces_asignados, activo=bool_activo).order_by('orden')
    elif workspace_padre_id:
        workspaces = Workspace.objects.filter(workspace_id=workspace_padre_id, activo=bool_activo).order_by('orden')

    return workspaces


def get_agrupaciones(int_departamento=0, int_workspace=0, bool_all=False, bool_activo=True, int_user=0,
                     es_personal=False):
    agrupaciones = None
    if bool_all:
        agrupaciones = Agrupacion.objects.filter(activo=bool_activo).order_by('orden')
    elif int_workspace:
        agrupaciones = Agrupacion.objects.filter(workspace_id=int_workspace, activo=bool_activo).order_by('orden')
    elif int_departamento:
        agrupaciones = Agrupacion.objects.filter(departamento_id=int_departamento, activo=bool_activo).order_by('orden')
    elif es_personal and int_user:
        agrupaciones = Agrupacion.objects.filter(user_create_id=int_user, es_personal=es_personal, activo=bool_activo). \
            order_by('orden')

    return agrupaciones


def get_tickets(int_departamento=0, int_user=0, es_personal=False, bool_activo=True, int_grupo=0,
                int_tickets_padre_id=0, bool_asignado=False, int_not_estado=0, bool_sin_fecha=False,
                bool_vencido=False, bool_hoy=False, bool_is_admin=False):
    str_filter = ''
    str_table = ''
    if int_departamento:
        str_filter += """ AND T.departamento_id = %s """ % int_departamento
    if es_personal and int_user:
        str_filter += """ AND T.user_create_id = %s AND T.es_personal = %s """ % (int_user, (1 if es_personal else 0))
    if int_grupo:
        str_filter += """ AND T.agrupacion_id = %s """ % int_grupo

    if int_tickets_padre_id and int(int_tickets_padre_id) > 0:
        str_filter += """ AND T.ticket_padre_id = %s """ % int_tickets_padre_id
    else:
        if not bool_asignado:
            str_filter += """ AND T.ticket_padre_id IS NULL """

    if bool_asignado and int_user:
        str_table = f"""INNER JOIN NOVA..tickets_ticket_usuario TA ON TA.ticket_id = T.id 
                            AND TA.usuario_id = {int_user} AND TA.activo = 1
                        INNER JOIN NOVA..tickets_workspace_usuarios WA ON WA.workspace_id = W.id 
                            AND WA.user_id = {int_user} AND WA.activo = 1"""

    if bool_is_admin is True:
        str_table = ""

    if int_not_estado:
        str_filter += """ AND T.estado_id != %s """ % int_not_estado

    if bool_sin_fecha:
        str_filter += """ AND T.fecha_hora_inicio IS NULL AND T.fecha_hora_fin IS NULL """

    if bool_vencido:
        str_filter += """ AND CAST(T.fecha_hora_fin AS DATE) < CAST(GETDATE() AS DATE) """

    if bool_hoy:
        str_filter += """ AND GETDATE() BETWEEN fecha_hora_inicio AND fecha_hora_fin """

    str_sql_ticket = f"""
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
            T.ticket_padre_id AS padre_id,
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
            W.departamento_id,
            T.es_personal
        FROM
            NOVA..tickets_ticket T
        LEFT JOIN NOVA..tickets_estado ES ON ES.id = T.estado_id AND ES.activo = 1
        LEFT JOIN NOVA..tickets_prioridad PR ON PR.id = T.prioridad_id AND PR.activo = 1
        LEFT JOIN NOVA..tickets_ticket_iniciativas TI ON TI.ticket_id = T.id AND TI.activo = 1
        LEFT JOIN NOVA..tickets_agrupacion A ON A.id = T.agrupacion_id
        LEFT JOIN NOVA..tickets_workspace W ON W.id = A.workspace_id 
        {str_table}
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
            T.activo = %s
        AND A.activo = 1
        AND W.activo = 1
        {str_filter}
        ORDER BY
            T.orden
    """

    return get_query(str_sql=str_sql_ticket, params=((1 if bool_activo else 0),), print_debug=False, print_result=False)


def get_usuarios_asignados(int_ticket_id):
    str_query = """
        SELECT
            TTU.usuario_id AS id,
            AU.name AS nombre,
            IIF(AU.avatar = '', 'default-avatar.png', AU.avatar) as foto
        FROM NOVA..tickets_ticket_usuario TTU
        LEFT JOIN NOVA..auth_user AU ON TTU.usuario_id = AU.id
        WHERE TTU.ticket_id = %s
        AND TTU.activo = 1
    """
    return get_query(str_sql=str_query, params=(int_ticket_id,), print_debug=False, print_result=False)


def get_color_ticket(int_ticket_id):
    obj_color = Ticket.objects.annotate(color=F('agrupacion__color')).values('color'). \
        filter(id=int_ticket_id).first()

    str_color = obj_color['color'] if obj_color else "#ffffff"

    return str_color


def get_etiquetas_asignadas(int_ticket_id):
    str_query = """
        SELECT
            TE.id,
            TE.nombre
        FROM NOVA..tickets_ticket_etiqueta TTE
        LEFT JOIN NOVA..tickets_etiqueta TE ON TTE.etiqueta_id = TE.id
        WHERE TTE.ticket_id = %s
        AND TTE.activo = 1
    """
    return get_query(str_sql=str_query, params=(int_ticket_id,), print_result=False, print_debug=False)
