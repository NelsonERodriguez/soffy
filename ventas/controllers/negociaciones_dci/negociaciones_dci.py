# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from ventas.models import Negociaciones_dci, Negociaciones_dci_detalle
from django.http import JsonResponse
from core.functions import get_query, set_notification
from django.db import connection


@login_required(login_url="/login/")
def index(request):
    semanas = Negociaciones_dci.objects.all()
    data = {
        "semanas": semanas
    }
    return render(request, 'negociaciones_dci/negociaciones_dci.html', data)


@login_required(login_url="/login/")
def create_edit(request, id):

    if request.method == "POST":
        str_week = request.POST.get('week', '')
        arr_split_week = str_week.split('-')
        int_year = arr_split_week[0]
        int_semana = arr_split_week[1].replace('W', '')
        cerrado = request.POST.get('cerrado', False)
        cerrado = True if cerrado else False
        arr_detalle_id = request.POST.getlist('detalle_id[]', None)
        arr_producto_id = request.POST.getlist('producto_id[]', None)
        arr_contenedores_negociados = request.POST.getlist('contenedores_negociados[]', None)
        arr_fecha_entrega = request.POST.getlist('fecha_entrega[]', None)
        arr_estados = request.POST.getlist('estados[]', None)

        if id:
            negociaciones_dci = Negociaciones_dci.objects.get(id=id)
            negociaciones_dci.year = int_year
            negociaciones_dci.semana = int_semana
            negociaciones_dci.cerrado = cerrado
            negociaciones_dci.save()

        else:
            negociaciones_dci = Negociaciones_dci.objects.create(
                year=int_year,
                semana=int_semana,
                usuario_id=request.user.id,
                cerrado=cerrado
            )
            id = negociaciones_dci.id

        int_row = 0
        for detalle_id in arr_detalle_id:
            producto_id = int(arr_producto_id[int_row])
            contenedores_negociados = int(arr_contenedores_negociados[int_row])
            fecha_entrega = arr_fecha_entrega[int_row]
            estados = arr_estados[int_row]

            if int(detalle_id):
                detalle = Negociaciones_dci_detalle.objects.get(id=detalle_id)

                detalle.producto_id = producto_id
                detalle.contenedores_negociados = contenedores_negociados
                detalle.fecha_entrega = fecha_entrega
                detalle.estado = estados
                detalle.save()

            else:
                Negociaciones_dci_detalle.objects.create(
                    negociaciones_id=id,
                    producto_id=producto_id,
                    contenedores_negociados=contenedores_negociados,
                    fecha_entrega=fecha_entrega,
                    estado=estados
                )

            int_row += 1

        data = {
            "status": True,
            "id": id
        }
        return JsonResponse(data, safe=False)

    try:
        negociaciones_dci = Negociaciones_dci.objects.get(id=id)
        str_sql_dellates = """
            SELECT 
                D.id AS detalle_id,
                D.producto_id,
                P.CodigoProducto AS codigo_producto,
                P.Descripcion AS producto,
                D.contenedores_negociados,
                D.fecha_entrega,
                D.estado
            FROM
                NOVA..ventas_negociaciones_dci_detalle AS D
            INNER JOIN Inventario..Productos AS P ON P.NoProducto = D.producto_id
            WHERE
                D.negociaciones_id = %s
        """ % id

        cursor = connection.cursor()
        cursor.execute(str_sql_dellates)

        arr_detalles = []
        for row in cursor.fetchall():
            arr_detalles.append(
                {
                    "detalle_id": row[0],
                    "producto_id": row[1],
                    "codigo_producto": row[2],
                    "producto": row[3],
                    "contenedores_negociados": row[4],
                    "fecha_entrega": row[5],
                    "estado": row[6]
                }
            )

        cursor.close()
        data = {
            "negociaciones_dci": negociaciones_dci,
            "len": len("%s" % negociaciones_dci.semana),
            "detalles": arr_detalles
        }

    except Negociaciones_dci.DoesNotExist:
        if id:
            set_notification(request, True, "Semana no encontrada.", "warning", "danger")

            return redirect("ventas-negociaciones_dci")

        negociaciones_dci = {
            "id": 0
        }
        arr_detalles = None
        data = {
            "negociaciones_dci": negociaciones_dci,
            "len": 0,
            "detalles": arr_detalles
        }

    return render(request, 'negociaciones_dci/negociaciones_dci_create_edit.html', data)


@login_required(login_url="/login/")
def get_productos(request):

    str_producto = request.POST.get('busqueda', '')

    str_sql_producto = """
        SELECT
            NoProducto AS id,
            CONCAT(CodigoProducto, ' - ', Descripcion) AS name
        FROM
            Inventario..Productos
        WHERE
            (CodigoProducto LIKE '%%%s%%' OR Descripcion LIKE '%%%s%%')
    """ % (str_producto, str_producto)

    arr_productos = get_query(str_sql_producto)

    data = {
        "productos": arr_productos
    }
    return JsonResponse(data, safe=False)
