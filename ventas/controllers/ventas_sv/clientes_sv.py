from datetime import datetime
from django.db.models import F, Q, Max
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from ventas.models import Cliente_sv
from django.http import JsonResponse
from django.db import transaction


@login_required(login_url="/login/")
def index(request):
    data = {}

    return render(request, 'ventas_sv/clientes_sv.html', data)


@login_required(login_url="/login/")
def get_codigo_nuevo(request):

    year = datetime.now().year
    clientes_anio_actual = Cliente_sv.objects.filter(created_at__year=year, codigo_cliente__contains='SLV')
    ultimo_creado = clientes_anio_actual.aggregate(Max('codigo_cliente'))['codigo_cliente__max']

    if ultimo_creado:
        correlativo = int(ultimo_creado[7:])
        siguiente_correlativo = correlativo + 1
        codigo_nuevo = f'SLV{year}{siguiente_correlativo:03d}'
    else:
        codigo_nuevo = f'SLV{year}001'

    arr_response = {
        "data": {"codigo_nuevo": codigo_nuevo},
        "msj": "Se muestra el siguiente código de cliente a asignar.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def listado(request):
    obj_clientes = Cliente_sv.objects.filter(deleted_at__isnull=True).values(
        'codigo_cliente', 'cliente', 'telefono', 'email', 'direccion_fiscal', 'activo', 'id'
    )

    arr_response = {
        "data": list(obj_clientes),
        "msj": "Se muestran los clientes registrados en el sistema.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def get_data(request):
    id_cliente = request.POST.get('id_cliente')

    obj_data = Cliente_sv.objects.values(
        'codigo_cliente', 'cliente', 'telefono', 'email', 'direccion_fiscal', 'activo', 'id'
    ).get(id=id_cliente)

    arr_response = {
        "data": obj_data,
        "msj": "Se muestra el cliente registrado en el sistema.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def guardar(request):
    bool_status = True
    msj = "Se guardo el cliente correctamente"

    try:
        with transaction.atomic():
            id_cliente = request.POST.get("id_cliente")
            codigo = request.POST.get("strCodigo")
            cliente = request.POST.get("strCliente")
            telefono = request.POST.get("strTelefono")
            email = request.POST.get("strEmail")
            direccion_fiscal = request.POST.get("strDireccionFiscal")
            activo = request.POST.get("boolActivo", 1)
            activo = int(activo)
            activo = True if activo == 1 else False

            obj_existe = Cliente_sv.objects.filter(id=id_cliente).first()

            obj_existe_codigo = Cliente_sv.objects.filter(
                ~Q(id=id_cliente),
                codigo_cliente=codigo,
                deleted_at__isnull=True
            )

            if obj_existe_codigo:
                raise ValueError("error duplicado")

            if obj_existe:
                obj_existe.codigo_cliente = codigo
                obj_existe.cliente = cliente
                obj_existe.telefono = telefono
                obj_existe.email = email
                obj_existe.direccion_fiscal = direccion_fiscal
                obj_existe.activo = activo
                obj_existe.save()
            else:
                Cliente_sv.objects.create(
                    codigo_cliente=codigo,
                    cliente=cliente,
                    telefono=telefono,
                    email=email,
                    direccion_fiscal=direccion_fiscal,
                    activo=activo
                )

    except ValueError:
        msj = "El código "+codigo+" ya está asignado a un cliente"
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
    msj = "Se eliminó el cliente correctamente"

    try:
        with transaction.atomic():
            id_cliente = request.POST.get("id_cliente")

            obj_existe = Cliente_sv.objects.filter(id=id_cliente).first()
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
