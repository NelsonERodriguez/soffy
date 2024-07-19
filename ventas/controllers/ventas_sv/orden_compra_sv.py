import uuid
from datetime import datetime
from os.path import splitext

from django.core.files.storage import FileSystemStorage
from django.db.models import F, Q, Max, Value
from django.db.models.functions import Concat
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string

from ventas.models import Producto_sv, Tipo_producto_sv, Cliente_sv, Orden_compra_sv, Orden_compra_detalle_sv
from django.http import JsonResponse
from django.db import transaction


@login_required(login_url="/login/")
def index(request):
    bool_todo = request.user.has_perm('ventas.ventas_orden_compra_sv_todo')

    data = {
        "bool_todo": bool_todo
    }

    return render(request, 'ventas_sv/orden_compra_sv.html', data)


@login_required(login_url="/login/")
def listado(request):
    obj_data = Orden_compra_sv.objects.annotate(
        cliente=Concat('cliente_sv__codigo_cliente', Value(' - '), 'cliente_sv__cliente')
    ).filter(deleted_at__isnull=True).values(
        'id', 'fecha', 'total', 'cliente', 'anulada', 'path_factura', 'path_recibo', 'path_transferencia'
    )

    arr_response = {
        "data": list(obj_data),
        "msj": "Se muestran las órdenes de compra registradas en el sistema.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def get_form(request):
    id_orden = request.POST.get('intOrdenCompra')

    obj_orden_compra = Orden_compra_sv.objects.filter(id=id_orden).first()
    obj_orden_compra_detalle = Orden_compra_detalle_sv.objects.filter(orden_compra_sv_id=id_orden)

    obj_clientes = Cliente_sv.objects.all()

    obj_productos = Producto_sv.objects.filter(deleted_at__isnull=True, activo=True)

    str_hoy = datetime.today().strftime('%Y-%m-%d')

    obj_data = {
        "id_orden": id_orden,
        "orden_compra": obj_orden_compra,
        "orden_compra_detalle": obj_orden_compra_detalle,
        "clientes": obj_clientes,
        "productos": obj_productos,
        "hoy": str_hoy,
    }

    html = render_to_string('ventas_sv/orden_compra_sv_form.html', obj_data)

    obj_json = {
        "status": True if obj_orden_compra else False,
        "msj": "Se muestra la información del cliente." if obj_orden_compra
        else "No se encontró la información del cliente.",

        "data": {
            "html": html,
            "prods_json": list(obj_productos.values("id", "codigo_producto", "producto")),
        }
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def guardar(request):
    bool_status = True
    msj = "Se ingresó la orden de compra exitosamente"

    try:
        with transaction.atomic():
            str_fecha = request.POST.get("txtFechaOC")
            int_cliente = request.POST.get("sltCliente")

            url = 'media/orden_compra_sv/'
            fs = FileSystemStorage(location=url)

            file_factura = request.FILES.get('filFactura', None)
            path_factura = None
            file_recibo = request.FILES.get('filRecibo', None)
            path_recibo = None
            file_transferencia = request.FILES.get('filTransferencia', None)
            path_transferencia = None

            str_uuid = str(uuid.uuid4())
            if file_factura:
                nombre_archivo = file_factura.name
                extension = splitext(nombre_archivo)[1]
                path_factura = fs.save(str_uuid+'_factura' + extension, file_factura)

            if file_recibo:
                nombre_archivo = file_recibo.name
                extension = splitext(nombre_archivo)[1]
                path_recibo = fs.save(str_uuid+'_recibo' + extension, file_recibo)

            if file_transferencia:
                nombre_archivo = file_transferencia.name
                extension = splitext(nombre_archivo)[1]
                path_transferencia = fs.save(str_uuid+'_transferencia' + extension, file_transferencia)

            dic_detail = []
            flt_total = 0
            for key in request.POST:
                obj_key = key.split("_")
                if obj_key[0] == "sltProducto" and obj_key[1]:
                    str_producto = request.POST.get(key)
                    flt_precio = request.POST.get("txtPrecio_"+obj_key[1])
                    flt_precio = float(flt_precio)
                    flt_cantidad = request.POST.get("txtCantidad_"+obj_key[1])
                    flt_cantidad = float(flt_cantidad)

                    dic_detail.append({
                        "producto": str_producto,
                        "precio": flt_precio,
                        "cantidad": flt_cantidad,
                    })

                    flt_total += (flt_precio * flt_cantidad)

            flt_total = round(flt_total, 2)

            obj_orden_compra = Orden_compra_sv.objects.create(
                cliente_sv_id=int_cliente,
                fecha=str_fecha,
                total=flt_total,
                path_factura=path_factura,
                path_recibo=path_recibo,
                path_transferencia=path_transferencia
            )

            for key in dic_detail:
                flt_totald = (key["precio"] * key["cantidad"])
                flt_totald = round(flt_totald, 2)

                Orden_compra_detalle_sv.objects.create(
                    orden_compra_sv=obj_orden_compra,
                    producto_sv_id=key["producto"],
                    cantidad=key["cantidad"],
                    precio=key["precio"],
                    total=flt_totald,
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
def anular(request):
    bool_status = True
    msj = "Se anuló la orden de compra correctamente"

    try:
        with transaction.atomic():
            id_orden_compra = request.POST.get("id_orden_compra")

            obj_existe = Orden_compra_sv.objects.filter(id=id_orden_compra).first()
            obj_existe.deleted_at = datetime.now()
            obj_existe.anulada = True
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
