from django.db.models import OuterRef, Subquery, Func, F
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from core.functions import get_query
from tickets.models import Ticket, Ticket_comentario, Ticket_minuta_jsa


class DateFormatComentario(Func):
    function = 'FORMAT'
    template = "%(function)s(%(expressions)s, 'dd/MM/yyyy hh:mm:ss')"


@login_required(login_url="/login/")
def index(request):
    data = {
        "tickets": get_tickets_reporte_minuta_jsa(),
    }

    return render(request, 'reporte_minuta_jsa/reporte_minuta_jsa.html', data)


@login_required(login_url="/login/")
def get_comentarios(request):
    int_ticket = request.POST.get('ticket_id')

    if int_ticket:
        comentarios = (
            Ticket_comentario.objects
            .select_related('user')
            .prefetch_related('ticket_comentario_adjunto_set')
            .filter(ticket_id=int_ticket, activo=True)
            .annotate(fecha_creacion=DateFormatComentario('created_at'), name=F('user__name'), avatar=F('user__avatar'))
            .values('id', 'comentario', 'comentario_padre_id', 'name', 'avatar',
                    'ticket_comentario_adjunto__file', 'fecha_creacion')
        )

        data = {
            "status": True,
            "comentarios": list(comentarios),
        }

        return JsonResponse(data, safe=False)

    else:
        data = {
            "status": False,
            "comentarios": None,
            "msg": 'No se recibió el parámetro necesario para buscar comentarios',
            "msj": 'No se recibió el parámetro necesario para buscar comentarios',
        }

        return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def cerrar_ticket(request):
    int_ticket = request.POST.get('ticket_id')
    try:
        ticket = Ticket.objects.get(pk=int_ticket)

        Ticket_minuta_jsa.objects.create(
            ticket=ticket,
        )
        data = {
            "status": True,
            "msg": 'Ticket cerrado de minuta jsa',
            "msj": 'Ticket cerrado de minuta jsa',
        }

        return JsonResponse(data, safe=False)

    except Ticket.DoesNotExist:
        data = {
            "status": False,
            "msg": 'Ticket no existente',
            "msj": 'Ticket no existente',
        }

        return JsonResponse(data, safe=False)

    except Exception as e:
        data = {
            "status": False,
            "msg": f'Error al cerrar el ticket: {str(e)}',
            "msj": f'Error al cerrar el ticket: {str(e)}',
        }

        return JsonResponse(data, safe=False)


def get_tickets_reporte_minuta_jsa():
    comentario = Ticket_comentario.objects.filter(
        ticket_id=OuterRef('pk')
    ).values('comentario').order_by('-id')

    tickets = (
        Ticket.objects.select_related('agrupacion', 'agrupacion__workspace', 'ticket_etiqueta', 'estado')
        .prefetch_related('ticket_usuario_set', 'ticket_usuario__usuario_set')
        .filter(ticket_etiqueta__etiqueta_id=11, activo=True, ticket_minuta_jsa__isnull=True)
        .annotate(comentarios=Subquery(comentario[:1]))
        .values('titulo', 'agrupacion__workspace__nombre', 'estado__nombre', 'estado__color', 'comentarios',
                'ticket_usuario__usuario__name', 'ticket_usuario__created_at', 'id', 'fecha_hora_fin')
    )

    arr_tickets = {}
    for ticket in tickets:
        if ticket['id'] not in arr_tickets:
            str_query = "SELECT COUNT(id) [total] FROM tickets_ticket_comentario WHERE ticket_id=%s GROUP BY ticket_id"
            count_comentarios = get_query(str_sql=str_query, params=(ticket['id'],))
            arr_tickets[ticket['id']] = {
                'id': ticket['id'],
                'titulo': ticket['titulo'],
                'area': ticket['agrupacion__workspace__nombre'],
                'estado': ticket['estado__nombre'],
                'estado_color': ticket['estado__color'],
                'comentarios': ticket['comentarios'],
                'cantidad_comentarios': count_comentarios[0]['total'] if count_comentarios else 0,
                'fecha_hora_fin': ticket['fecha_hora_fin'].strftime("%d/%m/%Y") if ticket['fecha_hora_fin'] else '',
                'responsables': "",
                'fecha': "",
                'semana': "",
            }

        responsable = ticket['ticket_usuario__usuario__name'] if ticket['ticket_usuario__usuario__name'] else ''
        semana = ticket['ticket_usuario__created_at'].strftime("%V") if ticket['ticket_usuario__created_at'] else ''
        date = ticket['ticket_usuario__created_at'].strftime("%d/%m/%Y") if ticket['ticket_usuario__created_at'] else ''
        str_hr = '<hr>' if arr_tickets[ticket['id']]['responsables'] != "" else ''
        arr_tickets[ticket['id']]['responsables'] += f"{str_hr}{responsable}"
        arr_tickets[ticket['id']]['fecha'] += f"{str_hr}{date}"
        arr_tickets[ticket['id']]['semana'] += f"{str_hr}{semana}"

    return arr_tickets
