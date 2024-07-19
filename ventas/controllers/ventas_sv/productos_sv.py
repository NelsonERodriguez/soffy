from datetime import datetime
from django.db.models import F, Q, Max
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from ventas.models import Producto_sv, Tipo_producto_sv
from django.http import JsonResponse
from django.db import transaction


@login_required(login_url="/login/")
def index(request):
    arr_tipo_producto = Tipo_producto_sv.objects.all()

    data = {
        "tipos": arr_tipo_producto
    }

    return render(request, 'ventas_sv/productos_sv.html', data)


@login_required(login_url="/login/")
def get_codigo_nuevo(request):
    ultimo_producto = Producto_sv.objects.filter(codigo_producto__contains='COD')
    ultimo_producto = ultimo_producto.aggregate(Max('codigo_producto'))['codigo_producto__max']
    print(ultimo_producto)

    if ultimo_producto:
        correlativo = int(ultimo_producto[3:]) if len(ultimo_producto) > 3 else 0
        siguiente_correlativo = correlativo + 1
        codigo_nuevo = f'COD{siguiente_correlativo:03d}'
    else:
        codigo_nuevo = f'COD001'

    arr_response = {
        "data": {"codigo_nuevo": codigo_nuevo},
        "msj": "Se muestran el siguiente código a generar.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def listado(request):

    obj_productos = Producto_sv.objects.filter(deleted_at__isnull=True).annotate(
        tipo=F('tipo_producto_sv__tipo_producto')
    ).values(
        'codigo_producto', 'producto', 'activo', 'id', 'tipo'
    )

    arr_response = {
        "data": list(obj_productos),
        "msj": "Se muestran los productos registrados en el sistema.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def get_data(request):
    id_producto = request.POST.get('id_producto')

    obj_producto = Producto_sv.objects.values(
        'codigo_producto', 'producto', 'activo', 'id', 'tipo_producto_sv_id'
    ).get(id=id_producto)

    arr_response = {
        "data": obj_producto,
        "msj": "Se muestran los productos registrados en el sistema.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def guardar(request):
    bool_status = True
    msj = "Se editó el producto correctamente"

    try:
        with transaction.atomic():
            id_producto = request.POST.get("id_producto")
            tipo_producto = request.POST.get("intTipoProducto")
            codigo = request.POST.get("strCodigo")
            producto = request.POST.get("strProducto")
            activo = request.POST.get("boolActivo", 1)
            activo = int(activo)
            activo = True if activo == 1 else False

            obj_existe = Producto_sv.objects.filter(id=id_producto).first()

            obj_existe_codigo = Producto_sv.objects.filter(
                ~Q(id=id_producto),
                codigo_producto=codigo,
                deleted_at__isnull=True
            )

            if obj_existe_codigo:
                raise ValueError("error duplicado")

            if obj_existe:
                obj_existe.tipo_producto_sv_id = tipo_producto
                obj_existe.codigo_producto = codigo
                obj_existe.producto = producto
                obj_existe.activo = activo
                obj_existe.save()
            else:
                Producto_sv.objects.create(
                    tipo_producto_sv_id=tipo_producto,
                    codigo_producto=codigo,
                    producto=producto,
                    activo=activo
                )

    except ValueError:
        msj = "El código "+codigo+" ya existe en el inventario"
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
def eliminar(request):
    bool_status = True
    msj = "Se eliminó el producto correctamente"

    try:
        with transaction.atomic():
            id_producto = request.POST.get("id_producto")

            obj_existe = Producto_sv.objects.filter(id=id_producto).first()
            obj_existe.deleted_at = datetime.now()
            obj_existe.save()

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
