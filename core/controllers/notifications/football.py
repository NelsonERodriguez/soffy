from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import QueryDict, JsonResponse
from core.functions import get_query, insert_query


@login_required(login_url="/login/")
def index(request):
    arr_return = {
        'status': True,
        'data': [],
        'message': 'Datos obtenidos correctamente'
    }
    user = request.user.id
    str_query = """SELECT n.id, n.titulo, ni.url_imagen, nu.usuario_id
                        FROM nova..core_notificaciones n
                    JOIN nova..core_notificaciones_imagenes ni
                        ON n.id = ni.notificacion_id
                    LEFT JOIN nova..core_notificaciones_usuarios nu
                        ON n.id = nu.notificacion_id AND nu.usuario_id = %s
                        WHERE n.activo = 1 AND n.fecha_vencimiento >= GETDATE()""" % user
    try:
        arr_data = get_query(str_query, True)
        if len(arr_data) > 0:
            arr_return['data'] = arr_data
    except ValueError:
        arr_return['status'] = False
        arr_return['message'] = "Ocurrió un error en obtener los datos solicitados, contacta con soporte."
    return JsonResponse(arr_return, safe=False)


@login_required(login_url="/login/")
def mark_as_done(request):
    notification_id = request.POST.get('notification', '')
    user_id = request.user.id
    arr_return = {
        'status': True,
        'message': 'Datos guardados correctamente'
    }
    str_query = """INSERT INTO nova..core_notificaciones_usuarios (created_at, updated_at, notificacion_id,
                    usuario_id) VALUES (GETDATE(), GETDATE(), %s, %s)""" % (notification_id, user_id)
    try:
        bool_insert = insert_query(str_query)
        if not bool_insert:
            arr_return['message'] = "Ocurrió un error al guardar la información."
    except ValueError:
        arr_return['status'] = False
        arr_return['message'] = "No se puede guardar la información, contacta con soporte."
    return JsonResponse(arr_return, safe=False)
