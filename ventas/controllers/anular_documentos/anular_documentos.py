from django.db import transaction
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query
# from core.inventario_models import FacturasInventario
from factura_electronica import functions
from factura_electronica.functions import anulate_invoice_local
from soffybiz.debug import DEBUG


@login_required(login_url="/login/")
def index(request):
    data = {
        "DEBUG": DEBUG,
    }
    return render(request, 'anular_documentos/anular_documentos.html', data)


@login_required(login_url="/login/")
def get_facturas_anular(request):
    str_filter_user = ""
    str_filter_anulado = "[Cotizaciones].[Anulado] = 0"
    str_envio_factura = request.POST.get('tipo', 'F')
    int_days_get_data = 30
    int_user = request.user.id

    if int_user == 108:
        str_filter_user = "AND [Cotizaciones].NoUsuario IN (71)"
    elif int_user == 152:
        str_filter_user = "AND [Cotizaciones].NoUsuario IN (147)"
    elif int_user == 147:
        str_filter_user = "AND [Cotizaciones].NoUsuario IN (122)"
    elif int_user == 916:
        str_filter_user = "AND [Cotizaciones].NoUsuario IN (1539)"
    elif int_user == 917:
        str_filter_user = "AND [Cotizaciones].NoUsuario IN (1540)"
    elif int_user == 946:
        str_filter_user = "AND [Cotizaciones].NoUsuario IN (1542)"
    elif int_user == 74:
        str_filter_user = "AND [Cotizaciones].NoUsuario IN (118)"
    elif int_user == 949:
        str_filter_user = "AND [Cotizaciones].NoUsuario IN (1543)"

    if request.POST.get('anulados'):
        str_filter_anulado = "[Cotizaciones].[Anulado] = 1"
        str_envio_factura = "F', 'E"

    str_facturas = f"""
        SELECT
            [Cotizaciones].[NoCotizacion] AS [id],
            IIF([Cotizaciones].[GeneraFE] = 'F', 'Factura', 'Envio') AS [documento],
            [AresEmpresa].[id] AS [empresa_id],
            [AresEmpresa].[nit] AS [nit_empresa],
            [Empresas].[RazonSocial] AS [empresa],
            [Cotizaciones].[NoDocumento] AS [pedido],
            FORMAT(CAST([Cotizaciones].[Fecha] AS DATE), 'dd/MM/yyyy') AS [fecha_ingreso],
            [Clientes].[CodigoCliente] AS [Codigo],
            [Cotizaciones].[NoNit] AS [nit_cliente],
            [Clientes].[Nombre] AS [cliente],
            [Cotizaciones].[Total],
            isnull([Sucursales].[NoRuta], 99) AS [ruta],
            IIF([Cotizaciones].[FDespachoHM] = 'H', 'Hoy', 'Mañana') AS [entrega],
            CASE [Cotizaciones].[DespachoER]
            WHEN 'E' THEN 'Entregan'
            WHEN 'R' THEN 'Recogen'
            WHEN 'V' THEN 'Vendedor'
            END AS [despacho],
            CONCAT([Usuarios].[Nombres], ' ', [Usuarios].[Apellidos]) AS [usuario],
            ISNULL([Cotizaciones].[Observaciones], '') AS [observaciones],
            [Cotizaciones].[NoEstado] AS [estado_id],
            ISNULL([Cotizaciones].[NoFactura], NULL) AS [factura_id],
            [fel_documentos].[id] AS [fel_id],
            [fel_documentos].[numero_autorizacion],
            FORMAT([fel_documentos].[fecha_emision], 'dd/MM/yyyy hh:mm:ss') AS [fecha_emision],
            [Facturas].[Serie] AS [serie],
            [Facturas].[NoDocumento] AS [numero],
            [fel_documentos].[fel_pdf],
            [Facturas].[Anulado],
            IIF(CAST([Facturas].[Fecha] AS DATE) >= CAST(GETDATE() AS DATE), 1, 0) [permite_anular]
        FROM [Inventario]..[Cotizaciones]
            INNER JOIN [Inventario]..[Facturas] ON [Facturas].NoFactura = [Cotizaciones].NoFactura
            LEFT OUTER JOIN [ares]..[fel_documentos] ON [Facturas].NoFactura = [fel_documentos].inventario_documento_id
                AND [fel_documentos].[fecha_emision] >= DATEADD(DD, - {int_days_get_data}, GETDATE())
            INNER JOIN [Inventario]..[Empresas] ON [Cotizaciones].[NoEmpresa] = [Empresas].[NoEmpresa]
            INNER JOIN [Inventario]..[Clientes] ON [Cotizaciones].[NoCliente] = [Clientes].[NoCliente]
            INNER JOIN [Inventario]..[Usuarios] ON [Cotizaciones].[NoUsuario] = [Usuarios].[NoUsuario]
            INNER JOIN [ares]..[empresa_database] ON [Cotizaciones].[NoEmpresa] = [empresa_database].[codigo] 
                AND [empresa_database].[database_id] = 41
            INNER JOIN [ares]..[empresas] [AresEmpresa] ON [empresa_database].[empresa_id] = [AresEmpresa].[id]
            LEFT OUTER JOIN [Inventario]..[Sucursales] ON [Cotizaciones].[NoCliente] = [Sucursales].[NoCliente] 
                AND [Cotizaciones].[DireccionEntrega] = [Sucursales].[Direccion]
        WHERE
            {str_filter_anulado}
            {str_filter_user}
            AND [Cotizaciones].[GeneraFE] IN ('{str_envio_factura}')
            AND [Cotizaciones].[Fecha] >= DATEADD(DD, - {int_days_get_data}, GETDATE())
        ORDER BY [entrega] ASC
    """
    data = {
        "status": True,
        "documentos": get_query(str_sql=str_facturas)
    }
    return JsonResponse(data=data)


@login_required(login_url="/login/")
def get_notas_anular(request):
    str_sql_notas = """
        SELECT [nocr_solicitudes].[id], [nocr_solicitudes].[solicitante_id], [nocr_solicitudes].[empresa_id],
            [nocr_solicitudes].[tipo_documento_id], [nocr_solicitudes].[fecha], [nocr_solicitudes].[cliente_id],
            [nocr_solicitudes].[total], [nocr_solicitudes].[factura_id], [nocr_solicitudes].[etapa_id],
            [Empresas].[NoEmpresa], [Empresas].[RazonSocial], [TiposNCredito].[NoTipoNCredito],
            [TiposNCredito].[Descripcion], [TiposNCredito].[fel_descripcion],
            [Clientes].[NoCliente], [Clientes].[Nombre], [Clientes].[Direccion], [Clientes].[NIT],
            [Facturas].[NoFactura], [Facturas].[Serie], [Facturas].[NoDocumento], [Facturas].[TipoDocumento],
            [Facturas].[NoNit], [Facturas].[Nombre] [NombreFactura], [Facturas].[Direccion] [DireccionFactura], 
            [Facturas].[Fecha], [nocr_generadas].[solicitud_id], [nocr_generadas].[notacredito_id], 
            [nocr_generadas].[archivo], [NCredito].[NoNCredito], [NCredito].[Serie] [SerieNota], 
            [NCredito].[NoDocumento] [NoDocumentoNota], [NCredito].[Nombre] [NombreNota], 
            [NCredito].[NoNit] [NoNitNota], [auth_user].[name]
        FROM [ares]..[nocr_solicitudes]
            INNER JOIN [Inventario]..[Empresas] ON [Empresas].[NoEmpresa] = [nocr_solicitudes].[empresa_id]
            INNER JOIN [Inventario]..[TiposNCredito] ON [TiposNCredito].[NoTipoNCredito] = 
                [nocr_solicitudes].[tipo_documento_id]
            INNER JOIN [Inventario]..[Clientes] ON [Clientes].[NoCliente] = [nocr_solicitudes].[cliente_id]
            INNER JOIN [Inventario]..[Facturas] ON [Facturas].[NoFactura] = [nocr_solicitudes].[factura_id]
            INNER JOIN [NOVA]..[auth_user] ON [auth_user].[id] = [nocr_solicitudes].[solicitante_id]
            INNER JOIN [ares]..[nocr_generadas] ON [nocr_generadas].[solicitud_id] = [nocr_solicitudes].[id]
            INNER JOIN [Inventario]..[NCredito] ON [NCredito].[NoNCredito] = [nocr_generadas].[notacredito_id]
        WHERE [nocr_solicitudes].[etapa_id] = 4
            AND [nocr_solicitudes].[created_at] > '20220101'
    """
    data = {
        "status": True,
        "documentos": get_query(str_sql=str_sql_notas)
    }
    return JsonResponse(data=data)


@login_required(login_url="/login/")
def post_anular_factura(request):
    no_factura = request.POST.get('NoFactura')
    str_query = """
        SELECT IIF([Facturas].Total <> [AuxiliarCxC].SALDO, 0, 1) AS [Anular]
        FROM [Inventario]..[Facturas]
            JOIN [CuentaCorriente]..[AuxiliarCxC] ON [Facturas].[NoFactura] = [AuxiliarCxC].[NoPoliza]
        WHERE [Facturas].[NoFactura] = %s
    """
    arr_pagos = get_query(str_sql=str_query, params=(no_factura,))
    if arr_pagos:
        if arr_pagos[0]['Anular'] == 0:
            return JsonResponse(data={
                "status": False,
                "msg": "No puedes anular por que ya se encuentra pagada",
                "msj": "No puedes anular por que ya se encuentra pagada",
            })

    arr_documento = get_query(str_sql="SELECT NoMovimientoEgreso FROM [Inventario]..[Facturas] WHERE [NoFactura] = %s",
                              params=(no_factura,))

    arr_anular = functions.process_anular_factura_electronica(no_factura, request.user.id, arr_documento[0])
    return JsonResponse(data=arr_anular)


@login_required(login_url="/login/")
def post_anular_envio(request):
    no_factura = request.POST.get('NoFactura', 0)
    arr_documento = get_query(str_sql="SELECT NoMovimientoEgreso FROM [Inventario]..[Facturas] WHERE [NoFactura] = %s",
                              params=(no_factura,))
    return JsonResponse(
        data=anulate_invoice_local(
            int_user=request.user.id,
            arr_invoice_data={
                'factura_id': no_factura,
                'fel_id': 0,
                'NoMovimientoEgreso': arr_documento[0]['NoMovimientoEgreso']
            }
        )
    )


@login_required(login_url="/login/")
def post_anular_nota(request):
    no_factura = request.POST.get('NoFactura')
    arr_documento = get_query(str_sql="SELECT NoMovimientoEgreso FROM [Inventario]..[Facturas] WHERE [NoFactura] = %s",
                              params=(no_factura,))
    arr_anular = functions.process_anular_factura_electronica(int_invoice=no_factura, int_user=request.user.id,
                                                              arr_data_invoice=arr_documento[0],
                                                              bool_anula_movimiento=False)
    return JsonResponse(data=arr_anular)
