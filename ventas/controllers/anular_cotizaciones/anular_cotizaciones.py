from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query, execute_query


@login_required(login_url="/login/")
def index(request):
    sql = """SELECT CONCAT(CONVERT(VARCHAR, NoEmpresa), ' - ', RazonSocial) AS RazonSocial, NoEmpresa 
                FROM Inventario..Empresas """
    arr_empresas = get_query(sql)
    data = {"empresas": arr_empresas}

    return render(request, 'anular_cotizaciones/anular_cotizaciones.html', data)


@login_required(login_url="/login/")
def show(request):
    arr_return = {
        'status': True,
        'message': "Datos obtenidos correctamente",
        'data': [],
    }
    arr_details = []
    arr_return_quotation = []
    int_quotation = request.POST.get('cotizacion', 0)
    int_company = request.POST.get('empresa', 0)
    str_option = request.POST.get('option', '')

    if str_option == 'cotizaciones':
        sql = """SELECT CONCAT(CONVERT(VARCHAR, b.NoEmpresa), ' - ', b.RazonSocial) AS RazonSocial,
                    a.NoCotizacion, a.Total, a.Anulado, a.NoEstado, c.Nombre, a.Fecha, a.NoDocumento
                FROM inventario..Cotizaciones AS a
                    JOIN inventario..Empresas AS b ON a.NoEmpresa = b.NoEmpresa
                    JOIN inventario..Clientes AS c ON a.NoCliente = c.NoCliente
                WHERE a.NoDocumento = %s
                    AND a.NoEmpresa = %s""" % (int_quotation, int_company)
        arr_quotation = get_query(sql, True)
        if len(arr_quotation) > 0:
            arr_return_quotation = arr_quotation[0]
            if arr_quotation and arr_return_quotation:
                if arr_return_quotation["Anulado"] and int(arr_return_quotation["NoEstado"]) == 3:
                    arr_return['status'] = False
                    arr_return['message'] = "La cotización ya se encuentra anulada."
            else:
                arr_return['status'] = False
                arr_return['message'] = "La cotización ingresada no existe en el sistema."

            sql = """SELECT a.Linea, a.Cantidad, a.Total, a.VUnitario, b.Descripcion
                        FROM inventario..DetalleCotizaciones AS a
                        JOIN inventario..Productos AS b ON a.NoProducto = b.NoProducto
                    WHERE a.NoCotizacion = %s
                    ORDER BY a.Linea""" % arr_return_quotation["NoCotizacion"]
            arr_details = get_query(sql)
        else:
            arr_return['status'] = False
            arr_return['message'] = "No existen datos para mostrar, por favor verifica tu información."

        if arr_return['status']:
            arr_return['data'] = {
                "cotizacion": arr_return_quotation,
                "detalles": arr_details,
            }
    elif str_option == 'pedidos':
        sql = """SELECT p.NoPedido, p.Total, p.NoEstado, c.Nombre, p.Fecha, p.NoDocumento
                    FROM inventario..pedido p
                        JOIN inventario..Clientes c
                            ON p.NoCliente = c.CodigoCliente
                    WHERE p.NoPedido = %s""" % int_quotation
        arr_quotation = get_query(sql, True)
        if len(arr_quotation) > 0:
            arr_return_quotation = arr_quotation[0]
            if int(arr_return_quotation["NoEstado"]) == 3:
                arr_return['status'] = False
                arr_return['message'] = "El pedido ya se encuentra anulado."
            else:
                str_query_detail = """SELECT
                                        a.Linea, a.Cantidad, b.Descripcion, p.Total
                                            FROM inventario..PedidoDetalle AS a
                                            JOIN inventario..Pedido as p
                                                ON a.NoPedido = p.NoPedido
                                            JOIN inventario..Productos AS b ON a.NoProducto = b.NoProducto
                                        WHERE a.NoPedido = %s""" % arr_return_quotation['NoPedido']
                arr_details = get_query(str_query_detail)
        else:
            arr_return['status'] = False
            arr_return['message'] = "No existen datos para mostrar, por favor verifica tu información."
        if arr_return['status']:
            arr_return['data'] = {
                "cotizacion": arr_return_quotation,
                "detalles": arr_details,
            }
    return JsonResponse(arr_return, safe=False)


@login_required(login_url='/login/')
def anular(request):
    quotation = request.POST.get('quotation', '')
    str_option = request.POST.get('option', '')
    arr_return = {
        'status': True,
        'message': 'Anulada Correctamente.'
    }
    try:
        if str_option == 'cotizaciones':
            sql = """UPDATE inventario..Cotizaciones
                        SET NoEstado = 3, Anulado = 1
                    WHERE NoCotizacion = %s"""
            if not execute_query(sql=sql, params=(quotation,)):
                arr_return['status'] = False
                arr_return['message'] = "No se puedo anular, contacta con IT. "

        elif str_option == 'pedidos':
            sql = """UPDATE inventario..pedido
                        SET NoEstado = 3
                    WHERE NoPedido = %s"""
            if not execute_query(sql=sql, params=(quotation,)):
                arr_return['status'] = False
                arr_return['message'] = "No se puedo anular, contacta con IT. "

    except ValueError:
        arr_return['status'] = False
        arr_return['message'] = "No se puedo anular, contacta con IT. %s" % ValueError

    return JsonResponse(arr_return, safe=False)


@login_required(login_url='/login/')
def get_documentos(request):
    str_empresa = request.POST.get('empresa')
    str_option = request.POST.get('option', '')

    if str_option == "cotizaciones":
        str_filter = f"AND [Cotizaciones].[NoEmpresa] = {str_empresa}" if (str_empresa and len(str_empresa)) else ''
        str_sql = f"""
            SELECT [Cotizaciones].[NoDocumento] AS [Pedido], [Cotizaciones].[NoCotizacion], 
                IIF([Cotizaciones].[GeneraFE] = 'F', 'Factura', 'Envio') AS [Documento],
                --[AE].[nit] AS [NitEmpresa], 
                [Empresas].RazonSocial AS [Empresa],
                --FORMAT(CAST([Cotizaciones].[Fecha] AS DATE), 'dd/MM/yyyy') AS [FechaIngreso],
                CONCAT([Clientes].[CodigoCliente], ' | ', [Clientes].[Nombre]) AS [Cliente],
                [Cotizaciones].[total], --ISNULL([Sucursales].[NoRuta], 99) AS [Ruta],
                --IIF([Cotizaciones].[FDespachoHM] = 'H', 'Hoy', 'Mañana') AS [Entrega],
                CONCAT([Usuarios].[Nombres], ' ', [Usuarios].[Apellidos]) AS [Usuario]
                --ISNULL([Cotizaciones].[Observaciones], '') AS [Observaciones],
                --CASE 
                    --[Cotizaciones].[DespachoER] 
                    --WHEN 'E' THEN 'Entregan'
                    --WHEN 'R' THEN 'Recogen'
                    --WHEN 'V' THEN 'Vendedor'
                --END AS Despacho,
                --[Estados].[Descripcion] AS Estado
            FROM [Inventario]..[Cotizaciones]
                INNER JOIN [Inventario]..[Empresas] ON [Cotizaciones].[NoEmpresa] = [Empresas].[NoEmpresa]
                INNER JOIN [Inventario]..[Clientes] ON [Cotizaciones].[NoCliente] = [Clientes].[NoCliente]
                INNER JOIN [Inventario]..[Usuarios] ON [Cotizaciones].[NoUsuario] = [Usuarios].[NoUsuario]
                INNER JOIN [ares]..[empresa_database] ON [Cotizaciones].[NoEmpresa] = [empresa_database].[codigo] 
                    AND [empresa_database].[database_id] = 41
                INNER JOIN [ares]..[empresas] [AE] ON [empresa_database].[empresa_id] = [AE].[id]
                LEFT JOIN [Inventario]..[Sucursales] ON [Cotizaciones].[NoCliente] = [Sucursales].[NoCliente] AND 
                    [Cotizaciones].[DireccionEntrega] = [Sucursales].[Direccion]
                LEFT JOIN [ares]..[fel_documentos] ON [Cotizaciones].[NoFactura] = [fel_documentos].[inventario_documento_id]
                LEFT JOIN [Inventario]..[Estados] ON [Estados].[NoEstado] = [Cotizaciones].[NoEstado]
            WHERE 
                ISNULL([Cotizaciones].[NoFactura], 0) = 0
                AND [Cotizaciones].[Anulado] = 0
                {str_filter}
            AND CAST([Cotizaciones].[Fecha] AS DATE) = CAST(GETDATE() AS DATE)"""

        arr_documentos = get_query(str_sql=str_sql)

    else:
        str_sql = """
            SELECT [Pedido].[NoPedido] AS [Pedido], --FORMAT([Pedido].[Fecha], 'dd/MM/yyyy hh:mm:ss') AS [Fecha],
                CONCAT([Clientes].[CodigoCliente], ' | ', [Clientes].[Nombre]) AS [Cliente],
                [Pedido].[Total], --ISNULL([Sucursales].NoRuta, 99) AS [Ruta],
                [Usuarios].[Nombres] [Usuario]--, [Pedido].[Observaciones], [Estados].[Descripcion] AS [Estado]
            FROM [Inventario]..[Pedido]
                INNER JOIN [Inventario]..[Clientes] ON [Clientes].[CodigoCliente] = [Pedido].[NoCliente]
                INNER JOIN [Inventario]..[Usuarios] ON [Usuarios].[NoUsuario] = [Pedido].[NoUsuario]
                INNER JOIN [Inventario]..[Sucursales] ON [Sucursales].[NoSucursal] = [Pedido].[NoSucursal]
                LEFT JOIN [Inventario]..[Estados] ON [Estados].[NoEstado] = [Pedido].[NoEstado]
            WHERE
                [Pedido].[NoDocumento] IS NULL
            AND [Pedido].[NoEstado] <> 3
            AND CAST([Pedido].[Fecha] AS DATE) = CAST(GETDATE() AS DATE)"""

        arr_documentos = get_query(str_sql=str_sql)

    response = {
        "status": True if arr_documentos else False,
        "documentos": arr_documentos,
    }
    return JsonResponse(data=response)
