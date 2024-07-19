from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from core.functions import get_query, execute_query
from factura_electronica import functions


@login_required(login_url="/login/")
def index(request):
    return render(request, "anular_facturas/anular_facturas.html")


@login_required(login_url="/login/")
def show(request):
    arr_return = {
        'status': True,
        'data': [],
        'message': 'No hay informacion a mostrar',
    }
    str_query = """SELECT f.NoFactura, e.RazonSocial, f.NoDocumento,
                        c.Fecha, cli.Nombre, f.TipoDocumento
                    FROM inventario..facturas f
                    JOIN inventario..Cotizaciones c
                        ON f.NoFactura = c.NoFactura
                    JOIN Inventario..Empresas e
                        ON f.NoEmpresa = e.NoEmpresa
                    JOIN Inventario..Clientes cli
                        ON f.NoCliente = cli.NoCliente
                    WHERE f.Anulado = 0
                        AND f.Fecha >= CAST(GETDATE() AS DATE)"""
    try:
        arr_result = get_query(str_query)
        if len(arr_result) > 0:
            arr_return['data'] = arr_result
            arr_return['message'] = 'Datos obtenidos correctamente'
    except ValueError:
        arr_return['message'] = "Ocurrio un problema al consultar las facturas, %s" % ValueError

    return JsonResponse(arr_return, safe=False)


@login_required(login_url="/login/")
def anular(request):
    arr_invoices = request.POST.getlist('invoices[]', None)
    arr_envios = request.POST.getlist('envios[]', None)
    arr_return = {
        'status': False,
        'message': '',
    }
    if arr_invoices:
        int_user = request.user.id if not request.user.is_superuser else 53
        arr_anular_invoices = anular_invoices(int_user, arr_invoices)
        if arr_anular_invoices['status']:
            arr_return['status'] = True
        arr_return['message'] = arr_anular_invoices['message']
    elif arr_envios:
        arr_anular_envios = anular_envios(request, arr_envios)
        if arr_anular_envios['status']:
            arr_return['status'] = True
        arr_return['message'] = arr_anular_envios['message']
    return JsonResponse(arr_return, safe=False)


def anular_invoices(int_user, arr_invoice):
    arr_return = {
        'status': True,
        'message': '',
    }
    if arr_invoice:
        for invoice in arr_invoice:
            if arr_return['status']:
                arr_pending_pay_invoice = get_invoice_to_null(invoice, True)
                if arr_pending_pay_invoice['status']:
                    arr_anular = functions.process_anular_factura_electronica(invoice, int_user, arr_pending_pay_invoice['data'])
                    if arr_anular['status']:
                        arr_return['status'] = True
                        arr_return['message'] = arr_anular['message']
                    else:
                        arr_return['status'] = False
                        arr_return['message'] = arr_anular['message']
                else:
                    arr_return['status'] = False
                    arr_return['message'] = arr_pending_pay_invoice['message']
    return arr_return


def anular_envios(request, arr_envios):
    arr_return = {
        'status': True,
        'message': '',
    }
    user_id = request.user.id
    if arr_envios:
        for envio in arr_envios:
            if arr_return['status']:
                arr_invoice = get_invoice_to_null(envio)
                if arr_invoice['status']:
                    str_query_alter = """UPDATE Inventario..Facturas
                                            SET NoEstado = 3,
                                                Anulado = 1,
                                                NoMovimientoIngreso = 0
                                            WHERE NoFactura = '%s'""" % envio
                    try:
                        bool_exec = execute_query(str_query_alter)
                        if bool_exec:
                            str_query_sp = """EXEC Inventario..AnulaMovimiento %s, %s,
                                                'Anulacion de factura', 0""" % (arr_invoice['data']['NoMovimientoEgreso'],
                                                user_id)
                            try:
                                exec_sp = execute_query(str_query_sp)
                                if exec_sp:
                                    arr_return['message'] = "Anulado correctamente"
                            except ValueError:
                                arr_return['status'] = False
                                arr_return['message'] = "Error en el proceso de Anulacion de Factura, SP."
                    except ValueError:
                        arr_return['status'] = False
                        arr_return['message'] = "Ocurrio un problema al cambiar los estados de la factura."
                else:
                    arr_return['status'] = False
                    arr_return['message'] = arr_invoice['message']
    return arr_return


def get_invoice_to_null(invoice, bool_fel = False):
    arr_return = {
        'status': False,
        'message': '',
        'data': [],
    }
    
    str_get_query = ""
    str_join_query = ""
    if bool_fel:
        str_get_query = """, fd.fecha_emision"""
        str_join_query = """LEFT JOIN ares..fel_documentos fd
                                ON f.NoFactura = fd.inventario_documento_id"""
    
    str_pagada = """SELECT CASE WHEN f.Total <> c.SALDO THEN '0' ELSE '1' END AS Anular,
                        f.NoMovimientoEgreso %s
                    FROM Inventario..Facturas f
                        JOIN cuentacorriente..AuxiliarCxC c
                            ON f.nofactura = c.NoPoliza
                        %s
                    WHERE f.nofactura = '%s'""" % (str_get_query, str_join_query, invoice)
    try:
        arr_pagada = get_query(str_pagada, True)
        if len(arr_pagada) > 0:
            if arr_pagada[0]['Anular'] == '0':
                arr_return['status'] = False
                arr_return['message'] = "No puedes anular la factura, ya se encuentra pagada."
            else:
                arr_return['status'] = True
                arr_return['message'] = "Informacion de la factura obtenida correctamente."
                arr_return['data'] = arr_pagada[0]
        else:
            arr_return['message'] = "No se pudo validar si tiene o no saldo."
    except ValueError:
        arr_return['message'] = "Ocurrio un problema al consultar la factura, %s" % ValueError
    return arr_return