from datetime import datetime

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from rrhh.models import Libreria_producto, Libreria_producto_movimiento, Libreria_tipo, Libreria_ingreso_bodega
from core.functions import get_query, set_notification, render_to_pdf
from django.http import JsonResponse, HttpResponse
from django.db import transaction


@login_required(login_url="/login/")
def index(request):

    data = {}

    return render(request, 'libreria/ingreso_bodega.html', data)


@login_required(login_url="/login/")
def listado(request):
    tipo = request.POST.get("tipo")

    obj_tipo = Libreria_tipo.objects.filter(clave=tipo).first()

    if obj_tipo:
        int_tipo = obj_tipo.id
    else:
        int_tipo = 1

    obj_ingreso = Libreria_ingreso_bodega.objects.filter(tipo_id=int_tipo) \
        .values('id', 'orden_compra__no_documento', 'user__name', 'created_at')

    arr_response = {
        "productos": list(obj_ingreso),
        "msj": "Se muestran los productos ingresados en el sistema.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def ingreso_bodega_form(request):

    data = {}

    return render(request, 'libreria/ingreso_bodega_form.html', data)


@login_required(login_url='/login/')
def get_users(request):

    str_filter = request.POST.get('filter', '')

    arr_users = []
    str_query = """
    select a.id, c.nombre + ' ' + c.apellido as 'nombre_completo'
    from NOVA..auth_user as a
    join ares..empleados_base as b
    on b.empleado_id = a.empleado_id
    join ares..empleados_master as c
    on c.id = a.empleado_id
    where a.active = 1
    and (a.name like '%%%s%%' or c.nombre like '%%%s%%' or c.apellido like '%%%s%%' or b.no_empleado like '%%%s%%')
    group by a.id, c.nombre, c.apellido
    order by c.nombre, c.apellido
    """ % (str_filter, str_filter, str_filter, str_filter)

    obj_users = get_query(str_query)

    for user in obj_users:
        arr_users.append({
            "name": user["nombre_completo"],
            "id": user["id"]
        })

    return JsonResponse(arr_users, safe=False)


@login_required(login_url='/login/')
def get_orden_compra(request):

    str_filter = request.POST.get('filter', '')

    arr_ordenes = []

    str_query = """
    select convert(nvarchar, a.no_documento) + ' | ' + b.nombre as orden_compra, a.total, d.observacion, a.id
    from NOVA..compras_orden_compra as a
    join NOVA..core_empresas as b
    on a.empresa_id = b.id
    join NOVA..compras_cotizaciones as c
    on a.cotizacion_id = c.id
    join NOVA..compras_solicitudes as d
    on c.solicitudes_id = d.id
    where no_documento like '%%%s%%'
    """ % str_filter

    obj_ordenes = get_query(str_query)

    for orden in obj_ordenes:
        arr_ordenes.append({
            "name": orden["orden_compra"],
            "total": orden["total"],
            "observacion": orden["observacion"],
            "id": orden["id"]
        })

    return JsonResponse(arr_ordenes, safe=False)


@login_required(login_url='/login/')
def get_productos(request):

    str_filter = request.POST.get('filter', '')
    str_ids_not_in = request.POST.get('idsNotIn', '')

    obj_ids = str_ids_not_in.split(",")

    tipo = request.POST.get("tipo")
    obj_tipo = Libreria_tipo.objects.filter(clave=tipo).first()
    if obj_tipo:
        int_tipo = str(obj_tipo.id)
    else:
        int_tipo = "1"

    str_not_in = ""
    for id in obj_ids:
        if len(id) > 0:
            str_not_in += ("," if len(str_not_in) > 0 else "")+str(int(id))

    str_filter_2 = "and id not in("+str_not_in+")" if len(str_not_in) > 0 else ""

    arr_objetos = []
    str_query = """
    select id, ISNULL(codigo + '|', '') + ISNULL(unidad_medida + '|', '') + producto AS 'producto', existencia
    from NOVA..rrhh_libreria_producto
    where (producto like '%%%s%%' or codigo like '%%%s%%')
    and activo = 1
    and tipo_id = %s
    %s
    """ % (str_filter, str_filter, int_tipo, str_filter_2)

    obj_elementos = get_query(str_query)

    for elemento in obj_elementos:
        arr_objetos.append({
            "name": elemento["producto"],
            "id": elemento["id"],
            "existencia": elemento["existencia"]
        })

    return JsonResponse(arr_objetos, safe=False)


@login_required(login_url='/login/')
def save_ingreso_bodega(request):
    bool_status = True
    msj = "Se realizó el egreso de los productos correctamente"
    int_orden_compra = request.POST.get("hdnOrdenCompra")

    str_tipo = request.POST.get("optTipo")
    obj_tipo = Libreria_tipo.objects.filter(clave=str_tipo).first()
    if obj_tipo:
        int_tipo = str(obj_tipo.id)
    else:
        int_tipo = "1"

    try:
        with transaction.atomic():
            obj_ingreso = Libreria_ingreso_bodega.objects.create(
                orden_compra_id=int(int_orden_compra),
                user_id=request.user.id,
                tipo_id=int(int_tipo)
            )

            for key in request.POST:
                obj_key = key.split("_")
                if obj_key[0] == "hdnProducto" and obj_key[1]:
                    id_producto = request.POST.get(key)
                    int_cantidad = request.POST.get("txtCantidad_" + obj_key[1])

                    obj_producto = Libreria_producto.objects.filter(id=id_producto).first()
                    if obj_producto:

                        obj_producto.existencia = (obj_producto.existencia + int(int_cantidad))
                        obj_producto.save()

                        Libreria_producto_movimiento.objects.create(
                            producto_id=obj_producto.id,
                            tipo_movimiento="I",
                            cantidad=int(int_cantidad),
                            user_id=request.user.id,
                            ingreso_bodega_id=obj_ingreso.id
                        )
    except Exception as e:
        msj = str(e)
        bool_status = False
        transaction.rollback()
    finally:
        transaction.commit()

    if not int_orden_compra:
        msj = "No se seleccionó ninguna orden de compra para registrar el ingreso"
        bool_status = False

    if bool_status:
        set_notification(request, True, msj, "add_alert", "success")
    else:
        set_notification(request, True, msj, "warning", "danger")

    return redirect('rrhh-libreria_ingreso_bodega')


@login_required(login_url="/login/")
def imprimir_orden(request, id):
    obj_ingreso = Libreria_ingreso_bodega.objects.get(id=id)
    obj_movimientos = Libreria_producto_movimiento.objects.filter(ingreso_bodega_id=id)\
        .values('producto__producto', 'producto__unidad_medida', 'producto__codigo', 'cantidad')

    int_cantidad = obj_movimientos.count()
    int_faltan = int_cantidad % 14

    arr_completar = []
    if int_faltan > 0:
        for i in range(int_faltan):
            arr_completar.append(i)

    str_fecha = datetime.today().strftime('%d/%m/%Y %H:%M:%S')

    data = {
        "ingreso": obj_ingreso,
        "movimientos": obj_movimientos,
        "pagina": MyCount(),
        "completar": arr_completar,
        "fecha": str_fecha,
        "nombre": request.user.name
    }

    pdf = render_to_pdf('libreria/ingreso_bodega_pdf.html', data)
    return HttpResponse(pdf, content_type='application/pdf')


class MyCount(object):

    def __init__(self):
        self.v = 1

    def bump(self):
        self.v += 1
        return ''