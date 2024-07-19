from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query
from tickets.models import Ticket_iniciativas, Ticket_ponderacion, Estado, Prioridad
from user_auth.models import User


@login_required(login_url="/login/")
def index(request):

    arr_tickets = get_tickets_mejora()
    arr_reglas = get_reglas()

    data = {
        "tickets": arr_tickets,
        "reglas": arr_reglas,
        "estados": Estado.objects.filter(activo=True),
        "prioridades": Prioridad.objects.filter(activo=True),
    }
    return render(request, 'reporte_prioridades/reporte_prioridades.html', data)


@login_required(login_url="/login/")
def save_ponderacion(request):

    int_ticket = request.POST.get('ticket_id', 0)
    int_ponderacion = request.POST.get('ponderacion', 0)
    arr_valores = request.POST.getlist('regla[]')

    try:
        for arr_valor in arr_valores:
            arr_split = arr_valor.split('_')
            int_regla = int(arr_split[0])
            int_valor = float(arr_split[1])
            ponderaciones = Ticket_ponderacion.objects.filter(grupo_id=int_ticket, regla_id=int_regla).first()

            if ponderaciones:
                ponderaciones.valor = int_valor
                ponderaciones.save()

            else:
                arr_regla = get_reglas(int_regla)[0]
                Ticket_ponderacion.objects.create(
                    grupo_id=int_ticket,
                    regla_id=int_regla,
                    valor=int_valor,
                    nombre=arr_regla['nombre'],
                    porcentaje=arr_regla['porcentaje'],
                    valor_maximo=arr_regla['valor_maximo'],
                    valor_ascendente=arr_regla['valor_ascendente'],
                    activo=True
                )

        ticket = Ticket_iniciativas.objects.filter(grupo_id=int_ticket).first()
        if ticket:
            ticket.ponderacion = int_ponderacion
            ticket.save()

        else:
            Ticket_iniciativas.objects.create(
                grupo_id=int_ticket,
                departamento_afectado=None,
                ponderacion=int_ponderacion,
                comentario=None,
                activo=True
            )

        bool_status = True

    except ValueError:
        bool_status = False

    data = {
        "status": bool_status
    }
    return JsonResponse(data=data, safe=False)


@login_required(login_url="/login/")
def save_datos(request):

    int_grupo = request.POST.get('grupo_id', 0)
    str_field = request.POST.get('field')
    str_value = request.POST.get('value')

    try:

        ticket = Ticket_iniciativas.objects.filter(grupo_id=int_grupo).first()

        if ticket:
            if str_field == "area_proceso":
                ticket.area_proceso = str_value
            elif str_field == "origen":
                ticket.origen = str_value
            elif str_field == "solucion":
                ticket.solucion = str_value
            elif str_field == "user_creador_id":
                ticket.user_creador_id = str_value
            elif str_field == "user_asignado_id":
                ticket.user_asignado_id = str_value
            elif str_field == "estado_id":
                ticket.estado_id = str_value
            elif str_field == "prioridad_id":
                ticket.prioridad_id = str_value

            ticket.save()

        else:
            Ticket_iniciativas.objects.create(
                grupo_id=int_grupo,
                area_proceso=str_value if str_field == "area_proceso" else None,
                origen=str_value if str_field == "origen" else None,
                solucion=str_value if str_field == "solucion" else None,
                user_creador_id=str_value if str_field == "user_creador_id" else None,
                user_asignado_id=str_value if str_field == "user_asignado_id" else None,
                estado_id=str_value if str_field == "estado_id" else None,
                prioridad_id=str_value if str_field == "prioridad_id" else None,
                activo=True
            )

        bool_status = True

    except ValueError:
        bool_status = False

    data = {
        "status": bool_status
    }
    return JsonResponse(data=data, safe=False)


def get_tickets_mejora():
    str_sql_tickets = """
        SELECT
            A.id,
            TI.area_proceso AS departamento,
            A.nombre AS titulo,
            AU.name,
            A.created_at,
            TI.estado_id,
            TI.prioridad_id,
            TI.comentario AS comentarios,
            US.id AS user_creador_id,
            US.name AS user_creador,
            AU.id AS user_asignado_id,
            AU.name AS user_asignado,
            TI.ponderacion,
            TPO.regla_id,
            TPO.valor,
            TI.origen,
            TI.solucion,
            W.nombre AS workspace,
            A.workspace_id
        FROM
            NOVA..tickets_agrupacion A
        LEFT JOIN NOVA..tickets_workspace AS W ON W.id = A.workspace_id
        LEFT JOIN NOVA..tickets_ticket_iniciativas TI ON TI.grupo_id = A.id
        LEFT JOIN NOVA..auth_user AU ON AU.id = TI.user_asignado_id
        LEFT JOIN NOVA..auth_user US ON US.id = TI.user_creador_id
        LEFT JOIN NOVA..tickets_ticket_ponderacion TPO ON TPO.grupo_id = A.id
        WHERE
            A.activo = 1
        AND W.departamento_id = 11
        GROUP BY A.id,
            TI.area_proceso,
            A.nombre,
            AU.name,
            A.created_at,
            TI.estado_id,
            TI.prioridad_id,
            TI.comentario,
            US.id,
            US.name,
            AU.id,
            AU.name,
            TI.ponderacion,
            TPO.regla_id,
            TPO.valor,
            TI.origen,
            TI.solucion,
            W.nombre,
            A.workspace_id
        ORDER BY A.workspace_id DESC, A.id DESC
    """
    arr_tickets = get_query(str_sql=str_sql_tickets)
    arr_return = {}

    for arr_ticket in arr_tickets:
        if not arr_ticket['id'] in arr_return:
            arr_return[arr_ticket['id']] = {
                "id": arr_ticket['id'],
                "departamento": arr_ticket['departamento'],
                "titulo": arr_ticket['titulo'],
                "name": arr_ticket['name'],
                "created_at": arr_ticket['created_at'],
                "estado_id": arr_ticket['estado_id'],
                "prioridad_id": arr_ticket['prioridad_id'],
                "comentarios": arr_ticket['comentarios'],
                "user_creador_id": arr_ticket['user_creador_id'],
                "user_creador": arr_ticket['user_creador'],
                "user_asignado_id": arr_ticket['user_asignado_id'],
                "user_asignado": arr_ticket['user_asignado'],
                "ponderacion": arr_ticket['ponderacion'],
                "origen": arr_ticket['origen'],
                "solucion": arr_ticket['solucion'],
                "workspace": arr_ticket['workspace'],
                "valores_reglas": [],
            }

        arr_return[arr_ticket['id']]['valores_reglas'].append({
            "valor": arr_ticket['valor'],
            "regla_id": arr_ticket['regla_id'],
        })

    return arr_return


def get_reglas(int_regla=None):

    str_filter = "AND id = %s" % int_regla if int_regla else ''

    str_sql_reglas = """
        SELECT 
            id,
            nombre,
            descripcion,
            porcentaje,
            valor_maximo,
            valor_ascendente
        FROM 
            NOVA..tickets_regla
        WHERE
            activo = 1
        %s    
    """ % str_filter

    return get_query(str_sql=str_sql_reglas)


@login_required(login_url="/login/")
def get_users(request, search):
    users = User.objects.values('name', 'id').filter(name__contains=search)
    data = {
        "users": list(users)
    }
    return JsonResponse(data=data, safe=False)
