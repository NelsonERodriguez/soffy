import datetime
from django.db.models import F, Q
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from ventas.models import Tipo_producto_sv, Producto_sv
from django.http import JsonResponse
from django.db import transaction


@login_required(login_url="/login/")
def index(request):

    data = {
    }

    return render(request, 'ventas_sv/tipos_producto_sv.html', data)


@login_required(login_url="/login/")
def listado(request):

    obj_tipos_producto = Tipo_producto_sv.objects.filter(deleted_at=None).values(
        'tipo_producto', 'activo', 'id'
    )

    arr_response = {
        "data": list(obj_tipos_producto),
        "msj": "Se muestran los tipos de productos registrados en el sistema.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def get_data(request):
    id_tipo_producto = request.POST.get('id_tipo_producto')

    obj_tipos_producto = Tipo_producto_sv.objects.values(
        'tipo_producto', 'activo', 'id'
    ).get(id=id_tipo_producto)

    arr_response = {
        "data": obj_tipos_producto,
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
            id_tipo_producto = request.POST.get("id_tipo_producto")
            tipo_producto = request.POST.get("strTipoProducto")
            activo = request.POST.get("boolActivo", 1)
            activo = int(activo)
            activo = True if activo == 1 else False

            obj_existe = Tipo_producto_sv.objects.filter(id=id_tipo_producto).first()

            obj_existe_tipo = Tipo_producto_sv.objects.filter(
                ~Q(id=id_tipo_producto),
                tipo_producto=tipo_producto,
                deleted_at__isnull=True
            )

            if obj_existe_tipo:
                raise ValueError("error duplicado")

            if obj_existe:
                obj_existe.tipo_producto = tipo_producto
                obj_existe.activo = activo
                obj_existe.save()
            else:
                Tipo_producto_sv.objects.create(
                    tipo_producto=tipo_producto,
                    activo=activo
                )

    except ValueError:
        msj = "El tipo de producto "+tipo_producto+" ya se encuentra registrado."
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
    msj = "Se eliminó el tipo de producto correctamente"

    try:
        with transaction.atomic():
            id_tipo_producto = request.POST.get("id_tipo_producto")

            obj_productos = Producto_sv.objects.filter(tipo_producto_sv_id=id_tipo_producto, deleted_at__isnull=True)

            if obj_productos:
                raise ValueError("error asignado")

            obj_existe = Tipo_producto_sv.objects.filter(id=id_tipo_producto).first()
            obj_existe.deleted_at = datetime.datetime.now()
            obj_existe.save()

    except ValueError:
        msj = "El tipo de producto se está usando actualmente en productos."
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
