from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rrhh.models import Libreria_producto, Libreria_producto_movimiento, Libreria_tipo
from core.functions import get_query
from django.http import JsonResponse
from django.db import transaction


@login_required(login_url="/login/")
def index(request):
    # arr_productos = Libreria_producto.objects.all()

    data = {
        # "productos": arr_productos
    }

    return render(request, 'libreria/productos.html', data)


@login_required(login_url="/login/")
def listado(request):
    tipo = request.POST.get("tipo")
    obj_tipo = Libreria_tipo.objects.filter(clave=tipo).first()

    if obj_tipo:
        int_tipo = obj_tipo.id
    else:
        int_tipo = 1

    arr_productos = Libreria_producto.objects.filter(activo=True, tipo_id=int_tipo).values()

    arr_response = {
        "productos": list(arr_productos),
        "msj": "Se muestran los productos ingresados en el sistema.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def save_productos(request):
    bool_status = True
    msj = "Se guardaron los productos correctamente"
    tipo = request.POST.get("tipo")
    obj_tipo = Libreria_tipo.objects.filter(clave=tipo).first()
    if obj_tipo:
        int_tipo = obj_tipo.id
    else:
        int_tipo = 1

    try:
        with transaction.atomic():
            for key in request.POST:
                obj_key = key.split("_")
                if obj_key[0] == "txtProducto" and obj_key[1]:
                    producto = request.POST.get(key)
                    unidad_medida = request.POST.get("txtUnidadMedida_" + obj_key[1])
                    codigo = request.POST.get("txtCodigo_" + obj_key[1])
                    existencias = request.POST.get("txtExistencia_" + obj_key[1])

                    obj_existe = Libreria_producto.objects.filter(producto=producto, activo=True,
                                                                  tipo_id=int_tipo).first()

                    if obj_existe:
                        raise ValueError("error duplicado")

                    obj_producto = Libreria_producto.objects.create(
                        unidad_medida=unidad_medida,
                        codigo=codigo,
                        producto=producto,
                        existencia=int(existencias),
                        tipo_id=int_tipo
                    )

                    Libreria_producto_movimiento.objects.create(
                        producto_id=obj_producto.id,
                        tipo_movimiento="I",
                        cantidad=int(existencias),
                        user_id=request.user.id
                    )
    except ValueError:
        msj = "El producto "+producto+" ya existe en el inventario"
        bool_status = False
        transaction.rollback()
    except Exception as e:
        msj = str(e)
        bool_status = False
        transaction.rollback()
    finally:
        transaction.commit()

    arr_response = {
        "msj": msj,
        "status": bool_status
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def ingreso_existencia(request):
    bool_status = True
    msj = "Se ingresaron las nuevas existencias correctamente"
    try:
        with transaction.atomic():
            id_producto = request.POST.get("id_producto")
            cantidad = request.POST.get("cantidad")

            obj_producto = Libreria_producto.objects.filter(id=id_producto).first()
            if obj_producto:
                obj_producto.existencia = (obj_producto.existencia + int(cantidad))
                obj_producto.save()

                Libreria_producto_movimiento.objects.create(
                    producto_id=obj_producto.id,
                    tipo_movimiento="I",
                    cantidad=int(cantidad),
                    user_id=request.user.id
                )
    except Exception as e:
        msj = str(e)
        bool_status = False
        transaction.rollback()
    finally:
        transaction.commit()

    arr_response = {
        "msj": msj,
        "status": bool_status
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def eliminar_producto(request):
    bool_status = True
    msj = "Se eliminó el producto exitosamente."
    try:
        with transaction.atomic():
            id_producto = request.POST.get("id_producto")

            obj_producto = Libreria_producto.objects.filter(id=id_producto).first()
            if obj_producto:
                obj_producto.activo = False
                obj_producto.save()
    except Exception as e:
        msj = str(e)
        bool_status = False
        transaction.rollback()
    finally:
        transaction.commit()

    arr_response = {
        "msj": msj,
        "status": bool_status
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def historial_producto(request):
    id_producto = request.POST.get("id_producto")

    str_query = """
    SELECT a.id, CASE a.tipo_movimiento WHEN 'I' THEN 'Ingreso' ELSE 'Egreso' END as 'movimiento',
            FORMAT(a.created_at,'dd/MM/yyyy HH:mm:ss') as FechaFormat, b.name, a.cantidad
    FROM NOVA..rrhh_libreria_producto_movimiento as a
    INNER JOIN NOVA..auth_user as b ON b.id = a.user_id
    WHERE a.producto_id = %s
    ORDER BY a.created_at DESC
    """ % id_producto
    obj_historial = get_query(str_query)

    arr_response = {
        "historial": obj_historial,
        "msj": "Se muestra el historial de movimiento del producto seleccionado.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url='/login/')
def get_users(request):

    str_filter = request.POST.get('filter', '')

    arr_users = []
    str_query = """
    select distinct a.id, c.nombre + ' ' + c.apellido as 'nombre_completo'
    from NOVA..auth_user as a
    join ares..empleados_base as b
    on b.empleado_id = a.empleado_id
    join ares..empleados_master as c
    on c.id = a.empleado_id
    where (a.name like '%%%s%%' or c.nombre like '%%%s%%' or c.apellido like '%%%s%%' or b.no_empleado like '%%%s%%')
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


@login_required(login_url="/login/")
def info(request):
    id_producto = request.POST.get("id_producto")

    obj_producto = Libreria_producto.objects.filter(id=id_producto).values()
    # print("\n\n", list(obj_producto), "\n\n")

    arr_response = {
        "producto": list(obj_producto)[0],
        "msj": "Se obtuvo la información del producto.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def actualizar_producto(request):
    bool_status = True
    msj = "Se actualizó el producto exitosamente."
    try:
        with transaction.atomic():
            id_producto = request.POST.get("id_producto")
            codigo = request.POST.get("codigo_producto")
            unidad_medida = request.POST.get("unidad_medida")
            producto = request.POST.get("producto")

            obj_producto = Libreria_producto.objects.filter(id=id_producto).first()
            if obj_producto:
                obj_producto.codigo = codigo
                obj_producto.unidad_medida = unidad_medida
                obj_producto.producto = producto
                obj_producto.save()
    except Exception as e:
        msj = str(e)
        bool_status = False
        transaction.rollback()
    finally:
        transaction.commit()

    arr_response = {
        "msj": msj,
        "status": bool_status
    }

    return JsonResponse(data=arr_response, safe=False)
