from django.contrib.auth.decorators import login_required
from django.db import connection, transaction
from django.http import JsonResponse

from core.functions import get_query, insert_query, execute_query, send_email, get_single_query
from core.inventario_models import CotizacionesInventario
from factura_electronica import functions
from ventas.models import Facturas, Detalle_facturas, Cotizaciones
from soffybiz.debug import DEBUG

import inspect
import datetime


# API para procesar la factura
@login_required(login_url="/login/")
def process_factura(request):
    int_user = request.user.id if not request.user.is_superuser else 53
    int_cotizacion = request.POST.get('cotizacion')

    # si viene cotización procesamos
    if int_cotizacion:
        # en este método se generará la factura
        arr_status = generate_factura(int_cotizacion, int_user)

        # si se proceso bien retorno
        if arr_status['status']:
            return JsonResponse(arr_status, safe=False)

        # si no se grabo el documento retorno error
        else:
            arr_return = {
                "status": False,
                "message": "No se genero la factura",
            }
            return JsonResponse(arr_return, safe=False)

    # si no viene la cotización retorno error
    else:
        arr_return = {
            "status": False,
            "message": "No existe la cotización",
        }
        return JsonResponse(arr_return, safe=False)


# API para procesar la factura
@login_required(login_url="/login/")
def api_enviar_cola_fel(request):
    int_user = request.user.id if not request.user.is_superuser else 53
    int_cotizacion = request.POST.get('cotizacion')

    # si viene cotización procesamos
    if int_cotizacion:
        # en este método se generará la factura
        if not DEBUG:
            arr_status = functions.process_factura_electronica(int_cotizacion, int_user)

        else:
            arr_status = {
                "status": False,
                "message": "Ambiente local no firma documentos.",
            }

        # si se proceso bien retorno
        if arr_status['status']:
            return JsonResponse(arr_status, safe=False)

        # si no se grabo el documento retorno error
        else:
            arr_return = {
                "status": False,
                "message": arr_status['message'],
            }
            return JsonResponse(arr_return, safe=False)

    # si no viene la cotización retorno error
    else:
        arr_return = {
            "status": False,
            "message": "No existe la cotización",
        }
        return JsonResponse(arr_return, safe=False)


# Método para generar la factura
def generate_factura(int_cotizacion, int_user):
    # Busco la cotización
    arr_cotizacion = get_cotizacion(int_cotizacion, False)
    if not arr_cotizacion:
        return {
            "status": False,
            "message": "Cotización inexistente.",
            "id": 0,
        }

    int_pedido_por_cliente = arr_cotizacion['PedidoPorCliente']
    int_empresa = 1 if int_pedido_por_cliente == 0 else 2
    int_bodega = 1 if int_pedido_por_cliente == 0 else 10
    bool_mover_inventario = (arr_cotizacion['NoVendedor'] != 32 and arr_cotizacion['FormaEnvio'] != 2
                             or arr_cotizacion['FormaEnvio'] == 4 or arr_cotizacion['FormaEnvio'] == 1 or
                             arr_cotizacion['FormaEnvio'] == 5)

    # verifico disponibilidad de inventario si no son los giros de negocio 92 y 32
    if bool_mover_inventario:
        arr_lotes = validate_and_get_inventario(int_cotizacion, int_empresa, int_bodega)
    else:
        arr_lotes = {"status": True}

    # si hay disponibilidad o son los casos especiales entraremos a procesar
    if arr_lotes['status']:
        # si es envio voy a buscar el correlativo para la serie y no documento
        if arr_cotizacion['GeneraFE'] == "E":
            # Busco el correlativo para el envio
            str_sql_correlativo_envio = f"""
                DECLARE @Correlativo AS INT 
                DECLARE @Se AS VARCHAR 
                EXEC Inventario..actualizacorrelativos {int_cotizacion}, @Correlativo OUTPUT, @Se OUTPUT
            """
            arr_correlativo = get_single_query(str_sql=str_sql_correlativo_envio)
            str_serie = arr_correlativo['Serie']
            str_no_documento = arr_correlativo['Correlativo']

            # Estos clientes necesitan que se les facture al nombre comercial
            if arr_cotizacion['NoCliente'] == 120643 or arr_cotizacion['NoCliente'] == 120645 \
                    or arr_cotizacion['NoCliente'] == 121635 or arr_cotizacion['NoCliente'] == 121636 \
                    or arr_cotizacion['NoCliente'] == 121637 or arr_cotizacion['NoCliente'] == 119361 \
                    or arr_cotizacion['NoCliente'] == 116315 or arr_cotizacion['NoCliente'] == 127423 \
                    or arr_cotizacion['NoCliente'] == 120235 or arr_cotizacion['NoCliente'] == 120637 \
                    or arr_cotizacion['NoCliente'] == 139292:
                str_nombre = arr_cotizacion['NombreComercial'] if arr_cotizacion['NombreComercial'] \
                    else arr_cotizacion['Nombre']

            # si no son estos clientes, pues se utiliza el nombre normal de la cotización
            else:
                str_nombre = arr_cotizacion['Nombre']

        # si es factura se guarda sin nada por qué este se actualizará de fel
        else:
            arr_correlativo = get_single_query(str_sql="EXEC Inventario..actualizacorrelativosfacturas")
            str_serie = arr_correlativo['Serie']
            str_no_documento = arr_correlativo['ultimonumero']
            str_nombre = arr_cotizacion['Nombre']

        # busco el usuario de sistemas para grabarlo en la factura
        int_usuario = get_usuario_sistemas(int_user)

        # armo el listado que se necesita para grabar el documento
        arr_datos = {
            "NoEmpresa": arr_cotizacion['NoEmpresa'],
            "TipoDocumento": arr_cotizacion['GeneraFE'],
            "Serie": str_serie,
            "NoDocumento": str_no_documento,
            "Fecha": arr_cotizacion['Fecha'].strftime('%Y-%m-%d'),
            "NoCliente": arr_cotizacion['NoCliente'],
            "NoVendedor": arr_cotizacion['NoVendedor'],
            "DiasCredito": arr_cotizacion['DiasCredito'],
            "Total": arr_cotizacion['Total'],
            "NoMoneda": arr_cotizacion['NoMoneda'],
            "TipoCambio": arr_cotizacion['TipoCambio'],
            "Observaciones": arr_cotizacion['Observaciones'],
            "NoNit": arr_cotizacion['NoNit'],
            "Nombre": str_nombre,
            "Direccion": arr_cotizacion['Direccion'],
            "EsCredito": 1 if arr_cotizacion['EsCredito'] else 0,
            "NoUsuario": int_usuario,
        }

        # inserto la factura
        int_factura = insert_factura_encabezado(arr_datos)

        if not int_factura:
            return {
                "status": False,
                "message": "No se pudo grabar el documento.",
                "id": 0,
            }

        # busco los detalles de la cotización
        arr_detalles = get_cotizacion_detalle(int_cotizacion)

        # inserto los detalles de la factura
        if not insert_factura_detalles(int_factura, arr_detalles):

            # elimino la factura y sus detalles
            revert_factura(int_factura)

            return {
                "status": False,
                "message": "Ocurrió un error grabando los detalles del documento.",
                "id": 0,
            }

        # aquí procesaré los movimientos de inventario
        if bool_mover_inventario:
            # obtengo el correlativo del documento
            int_no_documento = get_correlativo_movimiento(int_empresa)

            arr_datos = {
                "NoEmpresa": int_empresa,
                "NoTDocumento": 2,
                "NoDocumento": int_no_documento,
                "Fecha": arr_cotizacion['Fecha'].strftime('%Y-%m-%d'),
                "Total": arr_cotizacion['Total'],
                "Observaciones": "Movimiento generado automáticamente desde la cotización No: %s" % int_cotizacion,
                "NoUsuario": int_usuario,
            }

            # inserto el encabezado de movimientos
            int_movimiento = insert_movimiento_encabezado(arr_datos)

            if not int_movimiento:

                # elimino la factura y sus detalles
                revert_factura(int_factura)

                return {
                    "status": False,
                    "message": "No se pudo grabar el movimiento de inventario.",
                    "id": 0,
                }

            # inserto los detalles de movimiento
            if not insert_movimiento_detalles(int_movimiento, arr_lotes['lotes']):

                # elimino la factura y sus detalles
                revert_factura(int_factura)

                # elimino los movimientos y sus detalles
                revert_movimiento(int_movimiento)

                return {
                    "status": False,
                    "message": "Ocurrió un problema al grabar los detalles del movimiento de inventario.",
                    "id": 0,
                }

        else:
            int_movimiento = 0

        # le pongo la factura a la cotización
        if not update_factura_cotizacion(int_factura, int_cotizacion):

            # elimino la factura y sus detalles
            revert_factura(int_factura)

            # elimino los movimientos y sus detalles
            revert_movimiento(int_movimiento)
            return {
                "status": False,
                "message": "Ocurrió un problema al asignar la cotización al documento.",
                "id": 0,
            }

        if not insert_cuenta_corriente(int_factura):
            # elimino la factura y sus detalles
            revert_factura(int_factura)

            # elimino los movimientos y sus detalles
            revert_movimiento(int_movimiento)

            return {
                "status": False,
                "message": "Ocurrió un problema al mover a la cuenta corriente el cargo.",
                "id": 0,
            }

        # actualizo el movimiento a la factura
        # este mueve la cuenta corriente
        if not update_movimiento_factura(int_factura, int_movimiento):

            # elimino la factura y sus detalles
            revert_factura(int_factura)

            # elimino los movimientos y sus detalles
            revert_movimiento(int_movimiento)

            # elimino de cuenta corriente el cargo
            revert_cuenta_corriente(int_factura)

            return {
                "status": False,
                "message": "Ocurrió un problema al actualizar el movimiento de egreso.",
                "id": 0,
            }

        if bool_mover_inventario:
            # actualizo el estado al movimiento
            # Este mueve las existencias
            if not update_movimiento_estado(int_movimiento, arr_lotes['lotes']):
                # elimino la factura y sus detalles
                revert_factura(int_factura)

                # elimino los movimientos y sus detalles
                # revert_movimiento(int_movimiento)

                # notificarnos a nosotros y mando el int_movimiento

                return {
                    "status": False,
                    "message": "Ocurrió un problema al rebajar el inventario.",
                    "id": 0,
                }

        if arr_cotizacion['GeneraFE'] == "F":
            if not DEBUG:
                arr_fel = functions.process_factura_electronica(int_cotizacion, int_user)

            else:
                arr_fel = {
                    "status": True,
                    "status_fel": False,
                    "message": "Documento generado correctamente.",
                    "id": int_factura,
                }

        else:
            return {
                "status": True,
                "status_fel": True,
                "message": "Documento generado correctamente.",
                "id": int_factura,
            }

        if arr_fel['status']:
            return {
                "status": True,
                "status_fel": True,
                "message": "Documento generado correctamente.",
                "id": int_factura,
            }

        else:
            return {
                "status": True,
                "status_fel": False,
                "message": arr_fel['message'],
                "id": int_factura,
            }

    # si no tiene disponibilidad de inventario retorno error
    else:

        return {
            "status": False,
            "message": f"No puedes guardar por que no hay existencias para: {arr_lotes['productos_errores']}",
            "id": 0,
        }


# relaciono la factura a la cotización
def update_factura_cotizacion(int_factura, int_cotizacion):
    str_sql_update = """
        UPDATE Inventario..Cotizaciones SET NoFactura = %s, NoEstado = 2 WHERE NoCotizacion = %s 
    """ % (int_factura, int_cotizacion)

    try:
        cotizacion = Cotizaciones.objects.get(nocotizacion=int_cotizacion)
        cotizacion.nofactura = int_factura
        cotizacion.noestado = 2
        cotizacion.save()

    except Cotizaciones.DoesNotExist:
        pass
    except ValueError:
        pass

    return execute_query(str_sql_update)


# relaciono el movimiento de inventario a la factura
def update_movimiento_factura(int_factura, int_movimiento):
    factura = Facturas.objects.get(nofactura=int_factura)
    factura.nomovimientoegreso = int_movimiento
    factura.save()

    str_sql_update = """
        UPDATE Inventario..Facturas SET NoMovimientoEgreso = %s WHERE NoFactura = %s 
    """ % (int_movimiento, int_factura)
    return execute_query(str_sql_update)


# relaciono el movimiento de inventario a la factura
def update_movimiento_estado(int_movimiento, arr_lotes):
    str_sql_update = """
        UPDATE Inventario..Movimientos SET NoEstado = 2 WHERE NoMovimiento = %s 
    """
    str_error_text = None
    bool_return = True

    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(str_sql_update, (int_movimiento,))

                for lote in arr_lotes:
                    str_sql_lote = """
                        SELECT
                            Existencia
                        FROM
                            Inventario..ExistenciasLotes
                        WHERE
                            NoLote = %s
                        AND NoProducto = %s
                    """
                    cursor.execute(str_sql_lote, (lote['NoLote'], lote['NoProducto']))
                    arr_existencia = cursor.fetchone()
                    if arr_existencia is not None and arr_existencia[0] < 0:
                        bool_return = False
                        transaction.rollback()
                        break

            if not bool_return:
                str_error_text = "Lotes negativos al generar un documento."

    except Exception as e:
        str_error_text = str(e)
        bool_return = False

    if str_error_text:
        all_stack_frames = inspect.stack()
        caller_stack_frame = all_stack_frames[1]
        body = f"""Error:\n {str_error_text} \n\nQuery:\n {str_sql_update} \n\nPath:\n {caller_stack_frame[1]} \n\n
        Linea:\n {caller_stack_frame[2]} \n\nUso:\n {caller_stack_frame[4]}"""
        if not DEBUG:
            send_email(str_subject='Error de query', str_body=body, bool_send=False)

    return bool_return


# realizo el insert de cuenta corriente
def insert_cuenta_corriente(int_factura):
    obj_factura = get_single_query(str_sql="SELECT * FROM Inventario..Facturas WHERE NoFactura = " + str(int_factura))

    if obj_factura:

        obj_clientes = get_single_query(str_sql="SELECT CodigoCliente FROM Inventario..Clientes " +
                                                "WHERE NoCliente = '" + str(obj_factura["NoCliente"]) + "'")

        str_codigo_cliente = str(obj_clientes["CodigoCliente"]) if obj_clientes else ""

        str_query = """
            insert into CuentaCorriente..AuxiliarCxC
            values( '%s', '%s', '%s',
            '%s', '%s', cast('%s' as date),
            0, 0, '%s', '%s', '', 'G', 'sa', getdate(),
            NULL, '%s')
        """ % (str(obj_factura["NoEmpresa"]), str_codigo_cliente, str(obj_factura["TipoDocumento"]),
               str(obj_factura["Serie"]), str(obj_factura["NoDocumento"]), str(obj_factura["Fecha"]),
               str(obj_factura["Total"]), str(obj_factura["Total"]),
               str(obj_factura["NoFactura"]))

        return execute_query(str_query)
    else:
        return None


def revert_cuenta_corriente(int_factura):
    execute_query("DELETE FROM CuentaCorriente..AuxiliarCxC WHERE NoPoliza = " + str(int_factura))


# función que devuelve la información de la empresa
def get_empresa(int_empresa):
    str_sql_empresa = """
        SELECT
            AE.id,
            AE.email,
            AE.nombre,
            AE.nombre_comercial,
            AE.nit,
            AE.direccion_comercial
        FROM
            Inventario..Empresas IE
        INNER JOIN ares..empresa_database EDE ON EDE.codigo = IE.NoEmpresa AND EDE.database_id = 41
        INNER JOIN ares..empresas AE ON AE.id = EDE.empresa_id
        WHERE
            IE.NoEmpresa = %s
    """
    return get_query(str_sql=str_sql_empresa, params=(int_empresa,))


# Busco la cotización y los datos que enviaré para la factura
def get_cotizacion(int_cotizacion, bool_factura):
    str_filter = "AND ISNULL(CO.NoFactura, 0) = 0 AND CO.NoEstado = 1" if not bool_factura else ''
    str_cotizacion = f"""
        SELECT
            CO.PedidoPorCliente,
            CO.NoEmpresa,
            CO.GeneraFE,
            CO.Fecha,
            CO.NoCliente,
            CO.NoVendedor,
            CL.DiasCredito,
            CO.Total,
            CO.NoMoneda,
            CO.TipoCambio,
            CO.Observaciones,
            CO.NoNit,
            CO.Nombre,
            CO.Direccion,
            CO.EsCredito,
            CL.NombreComercial,
            CL.NoGiroNegocio,
            CO.NoFactura,
            CO.FormaEnvio
        FROM
            Inventario..Cotizaciones CO
        INNER JOIN Inventario..Clientes CL ON CL.NoCliente = CO.NoCliente
        WHERE
            CO.NoCotizacion = %s
        AND CO.Anulado = 0
        {str_filter}
    """
    arr_cotizacion = get_single_query(str_sql=str_cotizacion, params=(int_cotizacion,))

    return arr_cotizacion if arr_cotizacion else None


# Busco los detalles de la cotizacion
def get_cotizacion_detalle(int_cotizacion):
    str_detalles = """
        SELECT
            D.Linea, 
            D.NoProducto, 
            D.NoUnidad, 
            D.Cantidad, 
            D.PorcentajeDescuento, 
            D.ValorDescuento, 
            D.Total,
            D.Iva, 
            D.Exento,
            D.VUnitario,
            P.Descripcion
        FROM
            Inventario..DetalleCotizaciones D
        INNER JOIN Inventario..Productos P ON P.NoProducto = D.NoProducto
        WHERE
            NoCotizacion = %s
    """
    return get_query(str_sql=str_detalles, params=(int_cotizacion,))


def get_existencias_lote_especifico(int_cotizacion):
    str_sql_lotes = """
        SELECT dc.NoCotizacion, dc.Linea, dc.NoProducto, l.NoBodega, l.NoLote, e.Existencia,
            eb.Existencia AS 'ExistenciaBodega', el.Existencia AS 'ExistenciaLote',
            l.nocontenedor AS 'LoteProduccion', l.FechaVencimiento, el.Existencia AS 'Saldo',
            dc.Cantidad AS 'Salida', dc.Cantidad, ROW_NUMBER() OVER(ORDER BY dc.NoCotizacion ASC) AS RowLine
        FROM Inventario..Cotizaciones c
            JOIN Inventario..DetalleCotizaciones dc ON c.NoCotizacion = dc.NoCotizacion
            JOIN Inventario..existenciaslotes el ON dc.nolote = el.nolote
            JOIN Inventario..Lotes l ON el.NoLote = l.NoLote AND dc.NoProducto = l.NoProducto
            JOIN Inventario..existenciasbodegas eb ON l.noproducto = eb.noproducto AND l.nobodega = eb.nobodega
            JOIN Inventario..existencias e ON l.noempresa = e.noempresa AND l.noproducto = e.noproducto
            JOIN Inventario..Bodegas b ON b.NoBodega = eb.NoBodega
            JOIN Inventario..Ubicaciones u ON u.NoUbicacion = l.NoUbicacion
        WHERE c.NoCotizacion = %s"""
    return get_query(str_sql=str_sql_lotes, params=(int_cotizacion,))


# Método donde se valida la disponibilidad de inventario y se retorna los lotes que se utilizaran
def validate_and_get_inventario(int_cotizacion, int_empresa, int_bodega):
    arr_forma_envio = get_single_query(str_sql="SELECT FormaEnvio FROM [Inventario]..[Cotizaciones] "
                                               "WHERE NoCotizacion = %s",
                                       params=(int_cotizacion,))

    # Busco los detalles de la cotización
    str_sql_detalles_cotizacion = """
        SELECT
            DC.NoProducto, 
            P.CodigoProducto, 
            P.Descripcion,
            DC.Cantidad AS Cantidad,
            DC.Linea,
            DC.NoLote
        FROM 
            Inventario..DetalleCotizaciones DC
        INNER JOIN Inventario..Productos P ON DC.NoProducto = P.NoProducto
        WHERE 
            DC.NoCotizacion = %s
        ORDER BY 
            DC.NoProducto, DC.Linea
    """
    arr_detalles_cotizacion = get_query(str_sql=str_sql_detalles_cotizacion, params=(int_cotizacion,))

    # creo 3 variables para manejar los errores
    arr_lotes = []
    str_productos_error = ""
    bool_status = True

    for detalles_cotizacion in arr_detalles_cotizacion:
        if arr_forma_envio and arr_forma_envio['FormaEnvio'] == 4 and detalles_cotizacion['NoLote']:
            str_sql_lote_directo = f"""
                SELECT l.NoBodega, l.NoLote, e.Existencia,
                    eb.Existencia AS 'ExistenciaBodega', el.Existencia AS 'ExistenciaLote',
                    l.nocontenedor AS 'LoteProduccion', l.FechaVencimiento, el.Existencia AS 'Saldo'
                FROM Inventario..existenciaslotes el
                    JOIN Inventario..Lotes l ON el.NoLote = l.NoLote 
                        AND l.NoProducto = {detalles_cotizacion['NoProducto']}
                    JOIN Inventario..existenciasbodegas eb ON l.noproducto = eb.noproducto AND l.nobodega = eb.nobodega
                    JOIN Inventario..existencias e ON l.noempresa = e.noempresa AND l.noproducto = e.noproducto
                    JOIN Inventario..Bodegas b ON b.NoBodega = eb.NoBodega
                    JOIN Inventario..Ubicaciones u ON u.NoUbicacion = l.NoUbicacion
                WHERE el.NoLote = %s"""
            arr_lotes_detalles = get_single_query(str_sql=str_sql_lote_directo, params=(detalles_cotizacion['NoLote'],))

            if arr_lotes_detalles:
                arr_lotes.append(
                    {
                        "NoLote": arr_lotes_detalles['NoLote'],
                        "NoBodega": arr_lotes_detalles['NoBodega'],
                        "NoProducto": detalles_cotizacion['NoProducto'],
                        "Linea": detalles_cotizacion['Linea'],
                        "Cantidad": detalles_cotizacion['Cantidad'],
                        "Existencia": arr_lotes_detalles['Saldo'],
                    }
                )

        else:
            int_cantidad = detalles_cotizacion['Cantidad']
            int_cantidad_restante = detalles_cotizacion['Cantidad']
            int_existencia_total = 0

            # por cada detalle busco los lotes disponibles
            str_sql_lotes_detalles = f"""
                SELECT 
                    L.NoBodega, 
                    L.NoLote, 
                    -- E.Existencia, 
                    -- EB.Existencia AS 'ExistenciaBodega',
                    -- EL.Existencia AS 'ExistenciaLote',
                    -- L.NoContenedor AS 'LoteProduccion',
                    -- L.FechaVencimiento,
                    -- 0.00 AS 'Salida', 
                    EL.Existencia AS 'Saldo'
                FROM 
                    Inventario..Lotes L 
                INNER JOIN Inventario..ExistenciasLotes EL ON L.NoLote = EL.NoLote
                INNER JOIN Inventario..ExistenciasBodegas EB ON L.NoProducto = EB.NoProducto 
                    AND L.NoBodega = EB.NoBodega
                INNER JOIN Inventario..Existencias E ON L.NoEmpresa = E.NoEmpresa AND L.NoProducto = E.NoProducto
                INNER JOIN Inventario..Bodegas B ON B.NoBodega = EB.NoBodega
                INNER JOIN Inventario..Ubicaciones U ON U.NoUbicacion = L.NoUbicacion
                WHERE 
                    L.NoProducto =  %s
                AND E.NoEmpresa = %s
                AND EL.NoEmpresa = %s
                AND EB.NoEmpresa = %s
                AND E.Existencia > 0
                AND EB.Existencia > 0
                AND EL.Existencia > 0
                AND EB.NoBodega IN ({int_bodega})
                AND L.FechaVencimiento > GETDATE()-1
                ORDER BY 
                    U.NoUbicacion, L.NoLote, EL.Existencia    
            """
            arr_lotes_detalles = get_query(str_sql=str_sql_lotes_detalles, params=(detalles_cotizacion['NoProducto'],
                                                                                   int_empresa, int_empresa,
                                                                                   int_empresa))

            # si tiene lotes entro a validar
            if arr_lotes_detalles:
                # recorro los lotes disponibles
                for lotes_detalles in arr_lotes_detalles:
                    # sumo todas las existencias del lote
                    int_existencia_total += lotes_detalles['Saldo']

                    # válido si aún queda cantidad por meter algún lote
                    if int_cantidad_restante > 0:
                        int_existencia = lotes_detalles['Saldo']

                        # si el lote tiene menor o igual cantidad que el detalle lo tomo completo
                        if int_existencia <= int_cantidad_restante:
                            arr_lotes.append(
                                {
                                    "NoLote": lotes_detalles['NoLote'],
                                    "NoBodega": lotes_detalles['NoBodega'],
                                    "NoProducto": detalles_cotizacion['NoProducto'],
                                    "Linea": detalles_cotizacion['Linea'],
                                    "Cantidad": int_existencia,
                                    "Existencia": lotes_detalles['Saldo'],
                                }
                            )

                        # si el lote tiene mayor cantidad que lo que necesito solo tomo la cantidad a necesidad
                        else:
                            arr_lotes.append(
                                {
                                    "NoLote": lotes_detalles['NoLote'],
                                    "NoBodega": lotes_detalles['NoBodega'],
                                    "NoProducto": detalles_cotizacion['NoProducto'],
                                    "Linea": detalles_cotizacion['Linea'],
                                    "Cantidad": int_cantidad_restante,
                                    "Existencia": lotes_detalles['Saldo'],
                                }
                            )

                        # resto la existencia a la cantidad solicitada
                        int_cantidad_restante = (int_cantidad_restante - int_existencia)

                # verifico si la cantidad solicitada no sea mayor a la disponible en los lotes disponibles
                if int_cantidad > int_existencia_total:
                    str_productos_error += f" - {detalles_cotizacion['Descripcion']}"
                    bool_status = False

            # si no tiene lote, pues marco error
            else:
                str_productos_error += f" - {detalles_cotizacion['Descripcion']}"
                bool_status = False

    # retorno la data
    arr_return = {
        "status": bool_status,
        "productos_errores": str_productos_error,
        "lotes": arr_lotes if bool_status else []
    }
    return arr_return


# Inserto el encabezado de la factura
def insert_factura_encabezado(arr_datos):
    str_sql_insert_factura = """
        INSERT INTO Inventario..Facturas 
        (NoEmpresa, TipoDocumento, Serie, NoDocumento, Fecha, NoCliente, NoVendedor, DiasCredito, Total, Iva, 
        Exento, PorcentajeDescuento, ValorDescuento, NoMoneda, TipoCambio, Observaciones, NoMovimientoEgreso, 
        NoMovimientoIngreso, NoNit, Nombre, Direccion, EsCredito, Anulado, NoCierre, NoEstado, NoUsuario, Operado)
        VALUES
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0, 
        0, 0, 0, %s, %s, %s, 0, 
        0, %s, %s, %s, %s, 0, NULL, 1, %s, GETDATE())
    """
    arr_factura = insert_query(
        sql=str_sql_insert_factura,
        params=(arr_datos['NoEmpresa'], arr_datos['TipoDocumento'], arr_datos['Serie'], arr_datos['NoDocumento'],
                arr_datos['Fecha'], arr_datos['NoCliente'], arr_datos['NoVendedor'], arr_datos['DiasCredito'],
                arr_datos['Total'], arr_datos['NoMoneda'], arr_datos['TipoCambio'], arr_datos['Observaciones'],
                arr_datos['NoNit'], arr_datos['Nombre'], arr_datos['Direccion'], arr_datos['EsCredito'],
                arr_datos['NoUsuario']))
    if arr_factura:
        int_factura = arr_factura['id']

        try:
            with transaction.atomic():
                Facturas.objects.create(
                    nofactura=int_factura,
                    noempresa=arr_datos['NoEmpresa'],
                    tipodocumento=arr_datos['TipoDocumento'],
                    serie=arr_datos['Serie'],
                    nodocumento=arr_datos['NoDocumento'],
                    fecha=arr_datos['Fecha'],
                    nocliente=arr_datos['NoCliente'],
                    novendedor=arr_datos['NoVendedor'],
                    diascredito=arr_datos['DiasCredito'],
                    total=arr_datos['Total'],
                    iva=0,
                    excento=0,
                    porcentajedescuento=0,
                    valordescuento=0,
                    nomoneda=arr_datos['NoMoneda'],
                    tipocambio=arr_datos['TipoCambio'],
                    observaciones=arr_datos['Observaciones'],
                    nomovimientoegreso=0,
                    nomovimientoingreso=0,
                    nonit=arr_datos['NoNit'],
                    nombre=arr_datos['Nombre'],
                    direccion=arr_datos['Direccion'],
                    escredito=arr_datos['EsCredito'],
                    anulado=0,
                    nocierre=None,
                    noestado=1,
                    nousuario=arr_datos['NoUsuario'],
                    operado=datetime.datetime.now()
                )

        except ValueError:
            revert_factura(int_factura)
            int_factura = 0

    else:
        int_factura = 0

    return int_factura


# Inserto el encabezado de la factura
def insert_factura_detalles(int_factura, arr_detalles):
    bool_status = True
    for detalle in arr_detalles:
        str_sql_insert_factura = """
            INSERT INTO Inventario..DetalleFacturas 
            (NoFactura, Linea, NoProducto, NoUnidad, Cantidad, PorcentajeDescuento, ValorDescuento, Total, Iva, Exento)
            VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
        """

        if not insert_query(sql=str_sql_insert_factura,
                            params=(int_factura, detalle['Linea'], detalle['NoProducto'], detalle['NoUnidad'],
                                    detalle['Cantidad'], detalle['PorcentajeDescuento'], detalle['ValorDescuento'],
                                    detalle['Total'], detalle['Iva'], detalle['Exento'])):
            bool_status = False
            break

        try:
            with transaction.atomic():
                Detalle_facturas.objects.create(
                    nofactura_id=int_factura,
                    linea=detalle['Linea'],
                    noproducto=detalle['NoProducto'],
                    nounidad=detalle['NoUnidad'],
                    cantidad=detalle['Cantidad'],
                    porcentajedescuento=detalle['PorcentajeDescuento'],
                    valordescuento=detalle['ValorDescuento'],
                    total=detalle['Total'],
                    iva=detalle['Iva'],
                    excento=detalle['Exento'],
                    vunitario=detalle['Total']/detalle['Cantidad'],
                )

        except ValueError:
            bool_status = False
            break

    return bool_status


# Busco el NoUsuario de la base de Sistemas del usuario
def get_usuario_sistemas(int_user):
    str_usuario_sql = """
        SELECT 
            SU.NoUsuario
        FROM
            NOVA..auth_user U
        INNER JOIN ares..empleados_master EM ON EM.id = U.empleado_id
        INNER JOIN Sistemas..Usuarios SU ON SU.NoUsuario = EM.db_login
        WHERE
            U.id = %s
    """

    arr_usuario = get_single_query(str_sql=str_usuario_sql, params=(int_user,))
    int_usuario = arr_usuario['NoUsuario'] if arr_usuario else 0
    return int_usuario


# busco correlativo de movimientos
def get_correlativo_movimiento(int_empresa):
    str_sql_correlativo = """
        SELECT
            MAX(NoDocumento) + 1 AS NoDocumento
        FROM
            Inventario..Movimientos 
        WHERE
            NoEmpresa = %s
        AND NoTDocumento = 2
    """
    arr_correlativo = get_single_query(str_sql=str_sql_correlativo, params=(int_empresa,))
    return arr_correlativo['NoDocumento']


# Inserto el encabezado de movimientos
def insert_movimiento_encabezado(arr_datos):
    str_sql_insert_movimiento = """
        INSERT INTO Inventario..Movimientos 
        (NoEmpresa, NoTDocumento, NoDocumento, Fecha, Total, Observaciones, NoPeriodoFiscal, NoPoliza, Anulado, 
        NoEstado, NoUsuario, Operado, MotivoAnulacion)
        VALUES
        (%s, %s, %s, %s, %s, %s, NULL, NULL, 0, 1, %s, GETDATE(), '') 
    """
    arr_movimiento = insert_query(sql=str_sql_insert_movimiento,
                                  params=(arr_datos['NoEmpresa'], arr_datos['NoTDocumento'], arr_datos['NoDocumento'],
                                          arr_datos['Fecha'], arr_datos['Total'], arr_datos['Observaciones'],
                                          arr_datos['NoUsuario']))
    int_movimiento = arr_movimiento['id'] if arr_movimiento else 0

    return int_movimiento


# Inserto el encabezado de movimientos
def insert_movimiento_detalles(int_movimiento, arr_lotes):
    bool_status = True
    int_row = 1
    for lote in arr_lotes:
        str_sql_lote = """
            SELECT
                Existencia
            FROM
                Inventario..ExistenciasLotes
            WHERE
                NoLote = %s
            AND NoProducto = %s
        """
        arr_lote = get_single_query(str_sql=str_sql_lote, params=(lote['NoLote'], lote['NoProducto']))

        if arr_lote['Existencia'] != lote['Existencia']:
            if arr_lote['Existencia'] < lote['Cantidad']:
                bool_status = False
                break

        str_sql_presentacion = """
            SELECT
                Cantidad
            FROM
                Inventario..ProductosPresentaciones 
            WHERE 
                NoProducto = %s
        """
        arr_presentacion = get_single_query(str_sql=str_sql_presentacion, params=(lote['NoProducto'],))
        int_presentacion = arr_presentacion['Cantidad'] if arr_presentacion else 1
        int_empaques = lote['Cantidad'] / int_presentacion

        str_sql_insert_detalles = """
            INSERT INTO Inventario..DetalleMovimientos
            (NoMovimiento, Linea, NoBodega, NoLote, NoProducto, Cantidad, 
            Total, CantidadEmpaques, NoCCosto, NoTCosto, VUnitario)
            VALUES
            (%s, %s, %s, %s, %s, %s,
            0, %s, 0, 0, 0) 
        """

        if not insert_query(sql=str_sql_insert_detalles, params=(int_movimiento, int_row, lote['NoBodega'],
                                                                 lote['NoLote'], lote['NoProducto'], lote['Cantidad'],
                                                                 int_empaques)):
            bool_status = False
            break

        int_row += 1

    return bool_status


def revert_factura(int_factura):
    # primero elimino los detalles
    str_sql_delete_detalles = """
        DELETE FROM [Inventario]..[DetalleFacturas] WHERE [NoFactura] = %s
    """
    execute_query(sql=str_sql_delete_detalles, params=(int_factura,))

    # luego elimino el encabezado
    str_sql_delete_encabezado = """
        DELETE FROM [Inventario]..[Facturas] WHERE [NoFactura] = %s
    """
    execute_query(sql=str_sql_delete_encabezado, params=(int_factura,))

    # Le quito la factura a la cotizacion
    str_sql_update_cotizacion = """
        UPDATE [Inventario]..[Cotizaciones] SET [NoFactura] = NULL, [NoEstado] = 1 WHERE [NoFactura] = %s
    """
    execute_query(sql=str_sql_update_cotizacion, params=(int_factura,))

    try:
        Cotizaciones.objects.filter(nofactura=int_factura).update(nofactura=None, noestado=1)
        Facturas.objects.get(nofactura=int_factura).delete()
        Detalle_facturas.objects.filter(nofactura_id=int_factura).delete()

    except ValueError:
        pass


def revert_movimiento(int_movimiento):
    # primero elimino los detalles
    str_sql_delete_detalles = """
        DELETE FROM Inventario..DetalleMovimientos WHERE NoMovimiento = %s
    """
    execute_query(sql=str_sql_delete_detalles, params=(int_movimiento,))

    # luego elimino el encabezado
    str_sql_delete_encabezado = """
        DELETE FROM Inventario..Movimientos WHERE NoMovimiento = %s
    """
    execute_query(sql=str_sql_delete_encabezado, params=(int_movimiento,))


# función que trae la data de la factura
def get_factura(int_factura):
    str_sql_factura = """
        SELECT 
            F.Serie,
            F.NoDocumento AS FelNoDocumento,
            F.Fecha,
            F.Nombre,
            F.Direccion,
            F.NoNit,
            C.DiasCredito,
            IIF(F.EsCredito = 1, 'Credito', 'Contado') AS CreditoContado,
            CC.NoDocumento AS NoPedido,
            ISNULL(S.NoRuta,0) AS NoRuta,
            C.CodigoCliente AS Cliente,
            ISNULL(M.NoDocumento, 0) AS Salida,
            F.Total,
            FEL.fecha_autorizacion,
            FEL.numero_autorizacion,
            F.EsCredito,
            F.NoVendedor,
            CC.NoDocumento,
            C.CodigoCliente,
            F.Observaciones,
            F.NoEmpresa,
            FEL.empresa_id,
            CC.GeneraFE,
            CC.NoCotizacion,
            F.NoEmpresa,
            M.NoEmpresa AS 'movimiento_no_empresa'
        FROM Inventario..Facturas F
        INNER JOIN Inventario..Clientes C ON F.NoCliente = C.NoCliente
        INNER JOIN Inventario..Cotizaciones CC ON CC.NoFactura = F.NoFactura
        LEFT JOIN ares..fel_documentos FEL ON FEL.inventario_documento_id = F.NoFactura
        LEFT JOIN Inventario..Pedido PD ON PD.NoDocumento = CC.NoCotizacion
        LEFT JOIN Inventario..Sucursales S ON PD.NoSucursal = S.NoSucursal
        LEFT JOIN Inventario..Movimientos M ON F.NoMovimientoEgreso = M.NoMovimiento
        WHERE
            F.NoFactura = %s
    """
    arr_factura = get_single_query(str_sql=str_sql_factura, params=(int_factura,))

    return arr_factura if arr_factura else False


# función que trae la data de la factura
def get_factura_detalles(int_factura):
    str_sql_detalles = """
        SELECT
            P.CodigoProducto,
            P.Descripcion,
            D.Cantidad,
            D.Total,
            CONVERT(DECIMAL(18, 2), D.VUnitario) AS VUnitario,
            CASE WHEN ISNULL(PE.Cantidad, 0) = 0 THEN 0
            WHEN ISNULL(PE.Cantidad, 0) = 1 THEN CONVERT(DECIMAL(18, 2), (D.Cantidad * PE.Cantidad))
            ELSE CONVERT(DECIMAL(18, 2), D.Cantidad / ISNULL(PE.Cantidad, 1)) END AS Cajas,
            ISNULL(U.abreviatura, '') AS abreviatura,
            PE.Cantidad AS ImprimirCajas
        FROM
            Inventario..DetalleFacturas D
        INNER JOIN Inventario..Productos P ON P.NoProducto = D.NoProducto
        LEFT JOIN Inventario..ProductosPresentaciones PE ON PE.NoProducto = P.NoProducto
        LEFT JOIN Inventario..Unidades U ON U.NoUnidad = P.NoUnidad
        WHERE
            D.NoFactura = %s
    """
    arr_detalles = get_query(str_sql=str_sql_detalles, params=(int_factura,))

    return arr_detalles if arr_detalles else False
