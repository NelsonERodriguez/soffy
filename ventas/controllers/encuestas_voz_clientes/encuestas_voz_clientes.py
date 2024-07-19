from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query, set_notification
from ventas.models import Encuestas_voz_clientes
from ventas.forms import Encuestas_voz_clientesForm
from django.db import connection
import django.db as db


def index(request):
    data = {
        "query": []
    }
    return render(request, 'encuestas_voz_clientes/encuestas_voz_clientes.html', data)


def index_interno(request):
    data = {
        "query": []
    }
    return render(request, 'encuestas_voz_clientes/encuestas_voz_clientes_interno.html', data)


def buscar_cliente(request):

    str_nit_cliente = request.POST.get("strNitCliente")

    sql = """
        SELECT a.NoCliente, a.Nombre, a.NoVendedor, b.Nombre as 'NombreVendedor', a.Telefono
        FROM Inventario..Clientes as a
        JOIN Inventario..Vendedores as b ON a.NoVendedor = b.NoVendedor
        WHERE NIT = '%s'
        AND Activo = 1
        and b.NoVendedor in (39,104,167,73,117,76,38,67,154,43,127,105,40,241)
    """ % str_nit_cliente

    obj_cliente = get_query(sql)

    obj_return = None

    if not obj_cliente:
        return JsonResponse([{ "status": False, "msj": 'No se encontró ningún cliente con el NIT ingresado' }], safe=False)
    else:
        obj_return = obj_cliente[0]
        return JsonResponse([{ "status": True, "msj": 'Se encontró el cliente con el NIT ingresado', "cliente": obj_return }], safe=False)


@login_required(login_url="/login/")
def get_clientes(request, search):
    str_nombre = str(search).replace(" ","%")

    sql = """
        SELECT a.NoCliente, a.Nombre, a.NoVendedor, b.Nombre as 'NombreVendedor', a.Telefono, a.NIT
        FROM Inventario..Clientes as a
        JOIN Inventario..Vendedores as b ON a.NoVendedor = b.NoVendedor
        WHERE a.Nombre like '%"""+str_nombre+"""%'
        AND Activo = 1
        AND b.NoVendedor in (39,104,167,73,117,76,38,67,154,43,127,105,40,241)
        ORDER BY a.Nombre
    """

    obj_cliente = get_query(sql)

    data = []

    for cliente in obj_cliente:
        data.append({
            "id": cliente["NoCliente"],
            "name": cliente["Nombre"],
            "nit": cliente["NIT"],
            "telefono": cliente["Telefono"],
            "nombreVendedor": cliente["NombreVendedor"]
        })

    return JsonResponse(data, safe=False)


def save(request):

    arrData = {
        "NoCliente": request.POST.get("hdnNoCliente"),
        "telefono": request.POST.get("txtTelefono"),
        "pregunta_evalua_servicio": request.POST.get("chkPreguntaEvaluarServicio"),
        "pregunta_comunicacion": request.POST.get("chkPreguntaComunicaVendedor"),
        "detalle_pregunta_comunicacion": request.POST.get("txtPreguntaComunicaVendedor"),
        "pregunta_realizar_pedido": request.POST.get("chkPreguntaRealizarPedido"),
        "pregunta_metodo_pedido": request.POST.get("chkPreguntaMetodoPedido"),
        "detalle_pregunta_metodo_pedido": request.POST.get("txtPreguntaMetodoPedido"),
        "pregunta_vendedor_ofrece": 1 if request.POST.get("chkPreguntaOfreceVendedor") == 'SI' else 0,
        "pregunta_cambio_precio":  1 if request.POST.get("chkPreguntaCambioPrecio") == 'SI' else 0,
        "pregunta_visitas_vendedor": request.POST.get("chkPreguntaVisitaVendedor"),
        "comentario": request.POST.get("txtComentarios"),
    }

    form = Encuestas_voz_clientesForm(arrData)

    strTelefono = arrData["telefono"]
    intNoCliente = arrData["NoCliente"]

    if form.is_valid():
        data = form.cleaned_data

        error_text = None

        sql = """
            UPDATE Inventario..Clientes
            SET Telefono = '%s'
            WHERE NoCliente = %s
        """ % (strTelefono, intNoCliente)
        
        cursor = connection.cursor()
        try:
            cursor.execute(sql)
        except db.OperationalError as e:
            error_text = str(e)
        except db.Error as e:
            error_text = str(e)
        except:
            result = cursor.statusmessage
            error_text = str(result)
        finally:
            cursor.close()
        
        if error_text:
            set_notification(request, False, "Ocurrió un error inesperado, contacte con TI para solucionar este problema.", "warning", "danger")
        else:

            encuesta_voz_cliente = Encuestas_voz_clientes()
            guardar_encuesta(encuesta_voz_cliente, data)
            set_notification(request, True, "Encuesta guardada exitosamente.", "add_alert", "success")
    else:
        set_notification(request, False, "Encuesta no guardada. Revise los datos ingresados e intente nuevamente.", "warning", "danger")

    return redirect('ventas-encuestas_voz_clientes')


def save_interno(request):

    arrData = {
        "NoCliente": request.POST.get("hdnNoCliente"),
        "telefono": request.POST.get("txtTelefono"),
        "pregunta_evalua_servicio": request.POST.get("chkPreguntaEvaluarServicio"),
        "pregunta_comunicacion": request.POST.get("chkPreguntaComunicaVendedor"),
        "detalle_pregunta_comunicacion": request.POST.get("txtPreguntaComunicaVendedor"),
        "pregunta_realizar_pedido": request.POST.get("chkPreguntaRealizarPedido"),
        "pregunta_metodo_pedido": request.POST.get("chkPreguntaMetodoPedido"),
        "detalle_pregunta_metodo_pedido": request.POST.get("txtPreguntaMetodoPedido"),
        "pregunta_vendedor_ofrece": 1 if request.POST.get("chkPreguntaOfreceVendedor") == 'SI' else 0,
        "pregunta_cambio_precio":  1 if request.POST.get("chkPreguntaCambioPrecio") == 'SI' else 0,
        "pregunta_visitas_vendedor": request.POST.get("chkPreguntaVisitaVendedor"),
        "comentario": request.POST.get("txtComentarios"),
    }

    form = Encuestas_voz_clientesForm(arrData)

    strTelefono = arrData["telefono"]
    intNoCliente = arrData["NoCliente"]

    if form.is_valid():
        data = form.cleaned_data

        error_text = None

        sql = """
            UPDATE Inventario..Clientes
            SET Telefono = '%s'
            WHERE NoCliente = %s
        """ % (strTelefono, intNoCliente)
        
        cursor = connection.cursor()
        try:
            cursor.execute(sql)
        except db.OperationalError as e:
            error_text = str(e)
        except db.Error as e:
            error_text = str(e)
        except:
            result = cursor.statusmessage
            error_text = str(result)
        finally:
            cursor.close()
        
        if error_text:
            set_notification(request, False, "Ocurrió un error inesperado, contacte con TI para solucionar este problema.", "warning", "danger")
        else:
            encuesta_voz_cliente = Encuestas_voz_clientes()
            guardar_encuesta(encuesta_voz_cliente, data)
            set_notification(request, True, "Encuesta guardada exitosamente.", "add_alert", "success")
    else:
        set_notification(request, False, "Encuesta no guardada. Revise los datos ingresados e intente nuevamente.", "warning", "danger")

    return redirect('ventas-encuestas_voz_clientes_interno')


def guardar_encuesta(encuesta_voz_cliente, data):

    encuesta_voz_cliente.NoCliente = int(data['NoCliente'])
    encuesta_voz_cliente.telefono = data['telefono']
    encuesta_voz_cliente.pregunta_evalua_servicio = data['pregunta_evalua_servicio']
    encuesta_voz_cliente.pregunta_comunicacion = data['pregunta_comunicacion']
    encuesta_voz_cliente.detalle_pregunta_comunicacion = data['detalle_pregunta_comunicacion'] if len(data['detalle_pregunta_comunicacion']) > 0 else None
    encuesta_voz_cliente.pregunta_realizar_pedido = data['pregunta_realizar_pedido']
    encuesta_voz_cliente.pregunta_metodo_pedido = data['pregunta_metodo_pedido']
    encuesta_voz_cliente.detalle_pregunta_metodo_pedido = data['detalle_pregunta_metodo_pedido'] if len(data['detalle_pregunta_metodo_pedido']) > 0 else None
    encuesta_voz_cliente.pregunta_vendedor_ofrece = 1 if data['pregunta_vendedor_ofrece'] else 0
    encuesta_voz_cliente.pregunta_cambio_precio = 1 if data['pregunta_cambio_precio'] else 0
    encuesta_voz_cliente.pregunta_visitas_vendedor = data['pregunta_visitas_vendedor']
    encuesta_voz_cliente.comentario = data['comentario'] if len(data['comentario']) > 0 else None
    encuesta_voz_cliente.save()