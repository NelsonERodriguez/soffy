from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from rrhh.models import Libreria_producto, Libreria_producto_movimiento, Libreria_tipo
from core.functions import get_query, set_notification
from django.http import JsonResponse
from django.db import transaction


@login_required(login_url="/login/")
def index(request):

    data = {}

    return render(request, 'libreria/egresos.html', data)


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
def save_egreso(request):
    bool_status = True
    msj = "Se realizó el egreso de los productos correctamente"
    int_usuario = request.POST.get("hdnEmpleado")
    str_nombre_producto = ""

    try:
        with transaction.atomic():
            for key in request.POST:
                obj_key = key.split("_")
                if obj_key[0] == "hdnProducto" and obj_key[1] and int_usuario:
                    id_producto = request.POST.get(key)
                    int_cantidad = request.POST.get("txtCantidad_" + obj_key[1])

                    obj_producto = Libreria_producto.objects.filter(id=id_producto).first()
                    if obj_producto:
                        if obj_producto.existencia < int(int_cantidad):
                            str_nombre_producto = obj_producto.producto
                            raise ValueError("error no encontrado")

                        obj_producto.existencia = (obj_producto.existencia - int(int_cantidad))
                        obj_producto.save()

                        Libreria_producto_movimiento.objects.create(
                            producto_id=obj_producto.id,
                            tipo_movimiento="E",
                            cantidad=int(int_cantidad),
                            user_id=int_usuario
                        )
    except ValueError:
        msj = "El producto " + str_nombre_producto + " no tiene existencias"
        bool_status = False
        transaction.rollback()
    except Exception as e:
        msj = str(e)
        bool_status = False
        transaction.rollback()
    finally:
        transaction.commit()

    if not int_usuario:
        msj = "No se selecciono ningún usuario para registrar el egreso"
        bool_status = False

    if bool_status:
        set_notification(request, True, msj, "add_alert", "success")
    else:
        set_notification(request, True, msj, "warning", "danger")

    return redirect('rrhh-libreria_egresos')
