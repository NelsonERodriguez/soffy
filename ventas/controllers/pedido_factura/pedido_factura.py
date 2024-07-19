from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db import connection
from datetime import datetime
from core.functions import get_query


@login_required(login_url="/login/")
def index(request):
    data = {}
    # debería de ir a traer la información de los pedidos
    # a = make_tokens()
    a = save(request)
    str_query = """INSERT nova..prueba VALUES ('c')"""
    cursor = connection.cursor()
    cursor.execute(str_query)

    return render(request, 'pedido_factura/pedido_factura.html', data)


@login_required(login_url="/login/")
def save(request):
    bool_error = True
    try:
        quotation_id = request.POST.get('cotizacion_id', 739456)
        company_id = request.POST.get('empresa_id', 4)
        quotation = get_quotation_by_no_quotation(quotation_id) if quotation_id else []
        company = get_ares_company(company_id) if company_id else []
        business_turn = get_business_turn(quotation_id)
        user = request.user.id

        if quotation['GeneraFE']:
            if quotation['GeneraFE'] == 'F':
                arr_response = save_invoice(quotation, business_turn, user)

                bool_error = True # siempre dejarlo de ultimo
            elif quotation['GeneraFE'] == 'E':
                int_company = 1
                int_store = 1
                bool_error = True # siempre dejarlo de ultimo
        else:
            error = 'No exist quotation'
    except ValueError:
        msj = "No se puede guardar, ocurrió un error inesperado" + ValueError

    # return JsonResponse([{ "status": bool_status, "msj": msj }])


def get_quotation_by_no_quotation(quotation_id):
    str_query = "SELECT * FROM Inventario..Cotizaciones WHERE NoCotizacion = '%s'" % quotation_id
    quotation = get_query(str_query)
    if quotation and quotation[0]['NoCotizacion']:
        return quotation[0]
    return []


def get_ares_company(company_id):
    str_query = "SELECT * FROM ares..empresas WHERE id = '%s'" % company_id
    company = get_query(str_query)
    if company and company[0]['id']:
        return company[0]
    return []


def get_inventory_company(no_company):
    str_query = "SELECT * FROM inventario..empresas WHERE NoEmpresa = '%s'" % no_company
    company = get_query(str_query)
    if company and company[0]['NoEmpresa']:
        return company[0]
    return []


def get_business_turn(quotation_id):
    str_query = """SELECT c.NoGiroNegocio 
                        FROM inventario..clientes c 
                            JOIN inventario..cotizaciones co 
                                ON c.nocliente = co.nocliente
                        WHERE co.nocotizacion = '%s'""" % quotation_id
    business = get_query(str_query)
    if business and business[0]['NoGiroNegocio']:
        return business[0]
    return []


def save_invoice(quotation, business_turn, user):
    bool_status = False
    msj = ''
    int_company = 1 if quotation['PedidoPorCliente'] == '0' else 2
    int_store = 1 if quotation['PedidoPorCliente'] == '0' else 10
    arr_existences = get_exist_stores(int_company, quotation['NoCotizacion'], int_store)
    arr_details = get_detail_existences(int_company, quotation['NoCotizacion'])
    arr_validate = validate_existences(arr_existences, arr_details)
    if arr_validate['result'][0] or business_turn['NoGiroNegocio'] == 92 or quotation['NoVendedor'] != 32:
        if arr_validate['str_error'] != '' and (business_turn['NoGiroNegocio'] != 92 and quotation['NoVendedor'] != 32):
            msj = 'No puedes guardar la factura, no hay existencias para:' + arr_validate['str_error']
        else:
            bool_business_turn = (business_turn['NoGiroNegocio'] != 92 and quotation['NoVendedor'] != 32)
            arr_response = insert_all_invoice(quotation, bool_business_turn, arr_validate['result'], user)
            if arr_response['status']:
                bool_status = True
                msj = 'Factura insertada correctamente en el sistema.'
            else:
                msj = 'Ocurrió un error al guardar la factura en el sistema.'
    else:
        msj = 'No puedes guardar la factura, los productos no tienen existencia en bodega'

    return {
        'msj': msj,
        'status': bool_status
    }


def get_exist_stores(int_company, quotation_id, int_store):
    str_query = """SELECT dc.NoCotizacion, dc.Linea,  dc.NoProducto, l.NoBodega, l.NoLote,  e.Existencia,
                            eb.Existencia as 'ExistenciaBodega', el.Existencia as 'ExistenciaLote',
                            l.nocontenedor as 'LoteProduccion', l.FechaVencimiento, el.Existencia as 'Saldo',
                            0.00 as 'Salida', dc.Cantidad, ROW_NUMBER() OVER(ORDER BY dc.NoCotizacion ASC) AS RowLine
                        FROM inventario..Cotizaciones c
                            JOIN inventario..DetalleCotizaciones dc ON dc.NoCotizacion = c.NoCotizacion
                            JOIN inventario..lotes l ON dc.noproducto = l.noproducto
                            JOIN inventario..existenciaslotes el ON l.nolote = el.nolote
                            JOIN inventario..existenciasbodegas eb ON l.noproducto = eb.noproducto
                                AND l.nobodega = eb.nobodega
                            JOIN inventario..existencias e ON l.noempresa = e.noempresa
                                AND l.noproducto = e.noproducto
                            JOIN inventario..Bodegas b ON b.NoBodega=eb.NoBodega
                            JOIN inventario..Ubicaciones u ON u.NoUbicacion=l.NoUbicacion
                        WHERE c.NoCotizacion = '%s'
                            AND e.NoEmpresa = '%s'
                            AND el.NoEmpresa = '%s'
                            AND eb.NoEmpresa = '%s'
                            AND e.Existencia > 0
                            AND eb.Existencia > 0
                            AND el.Existencia > 0
                            AND eb.NoBodega in ('%s')
                            AND l.FechaVencimiento > getDate()-1
                        ORDER BY dc.NoProducto, dc.Linea ASC, u.noubicacion ASC, l.nolote ASC,
                            el.Existencia ASC""" % (quotation_id, int_company, int_company, int_company, int_store)
    exists = get_query(str_query)
    if exists and exists[0]['NoCotizacion']:
        return exists
    else:
        return []


def get_detail_existences(int_company, quotation_id):
    str_query = """SELECT c.NoCotizacion,
                        ROW_NUMBER() OVER(ORDER BY dc.NoCotizacion ASC) as Linea,
                        c.NoEmpresa, dc.NoProducto, p.CodigoProducto, p.Descripcion,
                        dc.Cantidad as Cantidad, e.Existencia
                    FROM inventario..Cotizaciones c
                        JOIN inventario..DetalleCotizaciones dc ON c.NoCotizacion = dc.NoCotizacion
                        JOIN inventario..Existencias e ON e.NoProducto = dc.NoProducto
                        JOIN inventario..Productos p ON dc.NoProducto = p.NoProducto
                    WHERE c.NoCotizacion = '%s'
                        AND e.NoEmpresa = '%s'
                    ORDER BY dc.NoProducto, dc.Linea""" % (quotation_id, int_company)
    details = get_query(str_query)
    if details and details[0]['NoCotizacion']:
        return details
    else:
        return []


def validate_existences(arr_existences, arr_details):
    arr_result = []
    str_product_has_not_existences = ''
    for detail in arr_details:
        int_quantity_tmp = detail['Cantidad']
        int_total = 0
        for existence in arr_existences:
            if detail['NoProducto'] == existence['NoProducto']:
                if int_quantity_tmp > 0:
                    if existence['Saldo'] <= int_quantity_tmp:
                        existence['Salida'] = existence['Saldo']
                        int_total += existence['Saldo']
                    else:
                        existence['Salida'] = int_quantity_tmp
                        int_total += int_quantity_tmp
                    int_quantity_tmp = (int_quantity_tmp - existence['Saldo'])
                else:
                    break
                arr_result.append(existence)

        if int_quantity_tmp > 0:
            str_product_has_not_existences += ' -- '
            str_product_has_not_existences += detail['Descripcion']

    return {
        'result': arr_result,
        'str_error': str_product_has_not_existences,
    }


def insert_all_invoice(quotation, bool_business_turn, arr_existences, user_id, bool_envio = False):
    int_invoice = insert_invoice(quotation, bool_business_turn, user_id, bool_envio)

    return {

    }



def insert_invoice(quotation, bool_business_turn, user_id, bool_shipping):
    bool_error = False
    msj = ''
    str_serie = ''
    str_no_document = ''
    operado = datetime.today().strftime('%Y-%m-%d-%H:%M:%S')
    if bool_shipping:
        arr_response = get_correlative_shipping(quotation['NoCotizacion'])
        if arr_response['error']:
            bool_error = True
            msj = 'No se pudo obtener el correlativo para guardar el envio'
        else:
            str_serie = arr_response['str_serie']
            str_no_document = arr_response['str_no_document']

    cursor = connection.cursor()
    str_query = """INSERT INTO inventario..Facturas (Serie, NoDocumento, NoEmpresa, TipoDocumento, Fecha, NoCliente,
                        NoVendedor, DiasCredito, Total, IVA, Exento, PorcentajeDescuento, ValorDescuento, NoMoneda,
                        TipoCambio, Observaciones, NoMovimientoEgreso, NoMovimientoIngreso, NoNit, Nombre, Direccion,
                        EsCredito, Anulado, NoEstado, NoUsuario, Operado)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s)""" % (str_serie, str_no_document, quotation['NoEmpresa'],
                        quotation['GeneraFE'], quotation['Fecha'], quotation['NoCliente'], quotation['NoVendedor'],
                        '', quotation['Total'], 0, 0, 0, 0, quotation['NoMoneda'], quotation['TipoCambio'],
                        quotation['Observaciones'], 0, 0, quotation['NoNit'], quotation['Nombre'],
                        quotation['Direccion'], quotation['EsCredito'], 0, 1, user_id, operado)

    if not bool_error:
        int_invoice = ''
        try:
            cursor.execute(str_query)
            cursor.execute("SELECT @@IDENTITY as 'test'")
            response = cursor.fetchone()
            int_invoice = response[0]
            str_query_invoice = """SELECT * FROM inventario..facturas WHERE NoFactura = '%s' AND NoEmpresa = '%s' AND 
            TipoDocumento = '%s' """
        except ValueError:
            msj = 'Ocurrió un error al guardar la factura' + ValueError
            bool_error = True
        finally:
            cursor.close()

    return {

    }



def get_correlative_shipping(no_quotation):
    bool_error = True
    str_serie = ''
    str_no_document = ''
    str_query = """declare @Correlativo as int declare @se as varchar 
                            exec inventario..actualizacorrelativos %s,
                            @correlativo output, @Se output""" % no_quotation
    arr_number = get_query(str_query)
    if arr_number and arr_number[0]['Serie']:
        str_serie = arr_number[0]['Serie']
        str_no_document = arr_number[0]['Correlativo']
        bool_error = False

    return {
        'error': bool_error,
        'str_serie': str_serie,
        'str_no_document': str_no_document,
    }


@login_required(login_url="/login/")
def save_test(request):
    # myconnection = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};
    # SERVER=172.16.10.251;DATABASE=NOVA;UID=ad;PWD=234wersdf', autocommit=False)
    a = connection.cursor()
    a.autocommit = False
    b = a.execute('SELECT * from ares..users where id = 1')
    print(b[0])
    # myconnection.commit()

    # for row in myconnection.fetchall():
    #     print(row)

    return True
    # bool_status = False
    # msj = ''
    # try:
    #     bool_status = True
    # except ValueError:
    #     msj = 'Ocurrió un error, contacta con sistemas: ' + ValueError
    #
    # return JsonResponse([{ "status": bool_status, "msj": msj }])
