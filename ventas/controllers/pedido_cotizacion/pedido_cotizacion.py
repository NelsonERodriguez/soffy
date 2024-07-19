from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from core.functions import get_query, set_notification, insert_query, render_to_pdf, execute_query, send_email, \
    numero_a_monedas_v2
from ventas.models import Cotizaciones, Detalle_cotizaciones
from ventas.functions import generate_factura, get_factura, get_factura_detalles, get_usuario_sistemas
from inventario.models import Pedidos_Confirmados
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from datetime import datetime, timedelta
from soffybiz.debug import DEBUG
from sqlescapy import sqlescape
from dateutil.relativedelta import relativedelta
import decimal

from django.template.loader import render_to_string

from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration


# Aquí se dibuja la tabla del reporte
@login_required(login_url="/login/")
def index(request):
    data = {
        "empresas": get_query(str_sql="SELECT NoEmpresa, NombreComercial FROM Inventario..Empresas")
    }
    return render(request, 'pedido_cotizacion/pedido_cotizacion.html', data)


# API que devuelve todos los pedidos de los vendedores asignados al usuario
@login_required(login_url="/login/")
def get_pedidos(request):
    # Si es admin busco con el usuario 53 que es de johana ella tiene asignados a todos los vendedores
    int_user = request.user.id if not request.user.is_superuser else 53

    # Busco a los vendedores asignados al usuario
    str_sql_vendedores = """
        SELECT 
            P.Valor
        FROM NOVA..auth_user U
        INNER JOIN ares..empleados_master EM ON EM.id = U.empleado_id
        INNER JOIN Sistemas..Usuarios SU ON SU.NoUsuario = EM.db_login
        INNER JOIN Sistemas..UsuariosObjetosAccionesParametros P ON P.NoUsuario = SU.NoUsuario
        WHERE 
            U.id = %s
        AND P.Parametro = 'Vendedores'
    """

    # Si el query no trae nada evito errores y no mando filtro de usuarios
    arr_datos = get_query(str_sql=str_sql_vendedores, params=(int_user,))
    str_filter = f" AND P.NoUsuario IN ({arr_datos[0]['Valor']}) " if arr_datos else ""

    # Busco todos los pedidos sin cotización y que no hayan sido anulados
    str_sql_pedidos = f"""
        SELECT
            P.NoPedido,
            C.CodigoCliente,
            C.Nombre,
            U.name,
            P.Fecha,
            P.Observaciones,
            P.NoSucursal,
            EE.Descripcion,
            P.NoEstado
        FROM
            Inventario..Pedido P
        INNER JOIN Inventario..Estados EE ON P.NoEstado = EE.NoEstado
        INNER JOIN Inventario..Clientes C ON C.CodigoCliente = P.NoCliente
        LEFT JOIN Inventario..Cotizaciones CO ON CO.NoCotizacion = P.NoDocumento
        INNER JOIN Sistemas..Usuarios SU ON SU.NoUsuario = P.NoUsuario
        INNER JOIN ares..empleados_master EM ON EM.db_login = SU.NoUsuario
        INNER JOIN NOVA..auth_user U ON U.empleado_id = EM.id
        WHERE
            P.NoEstado <> 3
        {str_filter}
        AND P.NoDocumento IS NULL
        ORDER BY 
            P.Fecha DESC
    """
    data = {
        "pedidos": get_query(str_sql=str_sql_pedidos)
    }

    return JsonResponse(data, safe=False)


# API para traer los saldos del cliente
@login_required(login_url="/login/")
def get_saldos_cliente(request):
    int_no_cliente = request.POST.get('nocliente')
    arr_saldos = saldos_cliente(int_no_cliente)
    return JsonResponse(arr_saldos, safe=False)


# ventana donde se genera la cotización/factura con pedido o sin pedido
@login_required(login_url="/login/")
def pedido_detalle(request, id):
    if id:
        bool_precio_mayorista = True if (request.user.id == 849 or request.user.id == 932 or
                                         request.user.id == 135) else False
        # traemos los detalles del pedido para enviarlos a la vista
        arr_datos_pedido = get_pedido(id, bool_precio_mayorista=bool_precio_mayorista)
        arr_pedido = arr_datos_pedido['pedido']
        arr_detalles = arr_datos_pedido['detalles']
        int_total = arr_datos_pedido['total']
        arr_datos_cliente = saldos_cliente(arr_pedido['NoCliente']) if arr_pedido else None

        # busco si el usuario tiene suficiente disponibilidad para procesar
        bool_no_procesar = float(arr_datos_cliente['Disponibilidad']) < float(arr_datos_pedido['total']) if \
            arr_pedido and arr_datos_cliente and not arr_datos_cliente['cliente_contado'] and \
            arr_datos_pedido['total'] != '' else False

        # Ya no quieren que se muestre el nit de la sat
        # válido el nit y lo busco de una vez con la sat para mostrar en la interfaz
        # if arr_pedido and validar_nit(arr_pedido['NIT']):
        #     arr_nit = get_datos_nit(arr_pedido['NIT'])
        #
        #     if arr_nit and arr_nit['status']:
        #         arr_pedido['NIT_FACTURA'] = arr_nit['nit']
        #         arr_pedido['NOMBRE_FACTURA'] = arr_nit['nombre']
        #         arr_pedido['DIRECCION_FACTURA'] = arr_nit['direcciones']['direccion']

    else:
        bool_no_procesar = None
        arr_pedido = None
        arr_detalles = None
        arr_datos_cliente = None
        int_total = None

    day = datetime.now()
    int_hour = day.hour
    # int_day = day.weekday()

    # Calcular el último día del mes actual
    last_day_of_month = day + relativedelta(day=31)

    # Comprobar si es el último día del mes
    if last_day_of_month.date() == day.date():
        str_day = day.strftime('%Y-%m-%d')
    else:
        if int_hour >= 15:
            day += timedelta(days=1)
            str_day = day.strftime('%Y-%m-%d')
        # En cualquier otro caso, tomar el día actual
        else:
            str_day = day.strftime('%Y-%m-%d')

    # busco todas las formas de pago
    arr_formas = get_query(str_sql="SELECT * FROM Inventario..FormasDePago")

    arr_envios = get_query(str_sql="SELECT * FROM Inventario..FormaEnvio")

    arr_lotes = [] if request.user.id == 849 or request.user.id == 932 or request.user.id == 135 else get_query(
        str_sql="exec Inventario..lotesdirectos")
    arr_contenedores = list(dict.fromkeys([d.get('NoContenedor') for d in arr_lotes]))

    arr_productos = []
    for lotes in arr_lotes:
        str_sql_lote = """
            SELECT 
                P.NoProducto, P.CodigoProducto, P.Descripcion AS Producto
            FROM 
                Inventario..Lotes L
            INNER JOIN Inventario..Productos P ON P.NoProducto = L.NoProducto
            WHERE
                L.NoLote = %s        
        """
        arr_contenedor = get_query(str_sql=str_sql_lote, params=(lotes['Valor'],))
        if arr_contenedor:
            arr_productos.append({
                "NoLote": lotes['Valor'],
                "NoContenedor": lotes['NoContenedor'],
                "NoProducto": arr_contenedor[0]['NoProducto'] if arr_contenedor else None,
                "CodigoProducto": arr_contenedor[0]['CodigoProducto'] if arr_contenedor else None,
                "Producto": arr_contenedor[0]['Producto'] if arr_contenedor else None,
            })

    data = {
        "id": id if id != "0" else None,
        "pedido": arr_pedido,
        "detalles": arr_detalles,
        "formas": arr_formas,
        "datos_cliente": arr_datos_cliente,
        "total": format(int_total) if int_total else None,
        "no_procesar": bool_no_procesar,
        "dia": str_day,
        "envios": arr_envios,
        "contenedores": arr_contenedores,
        "productos": arr_productos,
        "DEBUG": DEBUG,
    }

    return render(request, 'pedido_cotizacion_detalle/pedido_cotizacion_detalle.html', data)


# API de datos del cliente
@login_required(login_url="/login/")
def get_datos_cliente(request):
    str_tipo = request.POST.get('tipo')
    str_busqueda = request.POST.get('busqueda', '')

    if str_tipo == 'nit':
        str_busqueda = str_busqueda.replace('-', '')

    str_filter = ""
    if str_tipo == "nit":
        str_filter = f"AND REPLACE(C.NIT, '-', '') LIKE '%{str_busqueda}%'"
    elif str_tipo == "codigo":
        str_filter = f"AND C.CodigoCliente LIKE '%{str_busqueda}%'"
    elif str_tipo == "nombre":
        if len(str_busqueda):
            arr_nombres = str_busqueda.split()
            condiciones_like = ["ISNULL(C.Nombre, C.NombreComercial) LIKE '%{}%'".format(nombre) for nombre in arr_nombres]
            condicion_sql = " AND ".join(condiciones_like)
            # str_filter = f"AND ({condicion_sql})"
            str_filter = f"""AND (({condicion_sql}) OR REPLACE(C.NIT, '-', '') LIKE '%{str_busqueda}%' 
                            OR C.CodigoCliente LIKE '%{str_busqueda}%')"""

    str_campo = ""
    if str_tipo == "nit":
        str_campo = "CONCAT(REPLACE(C.NIT, '-', ''), ' - ', ISNULL(C.Nombre, C.NombreComercial))"
    elif str_tipo == "codigo":
        str_campo = "CONCAT(C.CodigoCliente, ' - ', ISNULL(C.Nombre, C.NombreComercial))"
    elif str_tipo == "nombre":
        str_campo = "CONCAT(C.CodigoCliente, ' - ', ISNULL(C.Nombre, C.NombreComercial))"

    str_sql_cliente = f"""
        SELECT TOP 20
            {str_campo} AS label,
            C.NoCliente,
            C.Nombre AS Cliente,
            C.NombreComercial,
            C.NoVendedor,
            REPLACE(C.NIT, '-', '') AS NIT,
            C.CodigoCliente,
            ISNULL(C.Observaciones, '') AS observacion_cliente,
            EF.NoEmpresa AS NoEmpresaF,
            EF.NombreComercial AS NombreComercialF,
            EDF.empresa_id AS EmpresaIDF,
            EF.DirComercial AS DirComercialF,
            EE.NoEmpresa AS NoEmpresaE,
            EE.NombreComercial AS NombreComercialE,
            EDE.empresa_id AS EmpresaIDE,
            EE.DirComercial AS DirComercialE,
            V.Nombre AS Vendedor,
            V.NoUsuario,
            CASE WHEN C.direccion_fiscal IS NULL THEN C.Direccion ELSE C.direccion_fiscal END AS Direccion
        FROM 
            Inventario..Clientes C
        LEFT JOIN Inventario..ClientesEmpresas CEF ON CEF.NoCliente = C.NoCliente AND CEF.TipoDocumento = 'F'
        LEFT JOIN ares..empresa_database EDF ON EDF.codigo = CEF.NoEmpresa AND EDF.database_id = 41
        LEFT JOIN Inventario..ClientesEmpresas CEE ON CEE.NoCliente = C.NoCliente AND CEE.TipoDocumento = 'E'
        LEFT JOIN ares..empresa_database EDE ON EDE.codigo = CEF.NoEmpresa AND EDE.database_id = 41
        LEFT JOIN Inventario..Empresas EF ON EF.NoEmpresa = CEF.NoEmpresa
        LEFT JOIN Inventario..Empresas EE ON EE.NoEmpresa = CEE.NoEmpresa
        LEFT JOIN Inventario..Vendedores V ON V.NoVendedor = C.NoVendedor
        WHERE
            C.Activo = 1
        {str_filter}
    """

    data = {
        "clientes": get_query(str_sql=str_sql_cliente)
    }

    return JsonResponse(data, safe=False)


# API de sucursales del cliente
@login_required(login_url="/login/")
def get_sucursales(request):
    str_nocliente = request.POST.get('nocliente', '')
    str_sql_sucursales = """
        SELECT
            s.NoSucursal,
            s.Nombre,
            s.Direccion,
            r.Descripcion
        FROM
            Inventario..Sucursales as s
        LEFT JOIN
            Inventario..Rutas as r
            ON r.NoRuta = s.NoRuta
        WHERE
            s.NoCliente = %s
    """
    data = {
        "sucursales": get_query(str_sql=str_sql_sucursales, params=(str_nocliente,))
    }

    return JsonResponse(data, safe=False)


# API de los productos del cliente con sus precios y presentación
@login_required(login_url="/login/")
def get_productos(request):
    int_nocliente = request.POST.get('nocliente', 0)
    str_producto = request.POST.get('busqueda', '')
    int_empresa = request.POST.get('empresa', '')
    bool_precio_mayorista = request.POST.get('precio_mayorista')
    bool_noproducto = request.POST.get('boolNoProducto')
    str_formaenvio = request.POST.get('formaenvio', '')
    str_no_lote = request.POST.get('nolote', '')

    if str_producto == "10000" or str_producto.upper() == "SERVICIOS":
        str_sql_productos = f"""
            SELECT
                P.NoProducto,
                P.CodigoProducto,
                P.Descripcion,
                1 AS Presentacion,
                0 AS Unitario,
                1 AS Existencia
            FROM
                Inventario..Productos P
            WHERE
                (P.Descripcion = %s or P.CodigoProducto = %s)"""

        arr_productos = get_query(
            str_sql=str_sql_productos,
            params=(
                str_producto,
                str_producto,
            )
        )

    else:
        str_sql_clientes = """
            SELECT
                C.NoCliente,
                C.NoClaseCliente
            FROM
                Inventario..Clientes C
            WHERE
                C.NoCliente = %s
        """
        arr_cliente = get_query(str_sql=str_sql_clientes,
                                params=(int_nocliente,))[0]

        str_no_clase = arr_cliente['NoClaseCliente']
        if bool_precio_mayorista:
            if arr_cliente and arr_cliente['NoClaseCliente'] and arr_cliente['NoClaseCliente'] != 110:
                str_no_clase = 101

        str_filter = ""
        if bool_noproducto:
            str_filter = f"OR P.NoProducto = {str_producto}"

        if str_formaenvio == "4" and len(str_no_lote) > 0:
            str_sql_productos = f"""
                SELECT
                    P.NoProducto,
                    P.CodigoProducto,
                    P.Descripcion,
                    PE.Cantidad AS Presentacion,
                    ISNULL(PC.Precio, PCL.Precio) AS Unitario,
                    E.Existencia
                FROM
                    Inventario..Productos P
                INNER JOIN Inventario..Lotes L ON L.NoProducto = P.NoProducto
                INNER JOIN Inventario..ExistenciasLotes E ON E.NoProducto = P.NoProducto AND E.NoEmpresa = %s
                    AND E.NoLote = L.NoLote
                LEFT JOIN Inventario..ProductosPresentaciones PE ON PE.NoProducto = P.NoProducto
                LEFT JOIN Inventario..PreciosClientes PC ON PC.NoProducto = P.NoProducto AND PC.NoCliente = %s
                LEFT JOIN Inventario..PreciosClases PCL ON PCL.NoProducto = P.NoProducto
                    AND PCL.NoClaseCliente = %s
                WHERE
                    L.NoContenedor = %s
                AND (P.Descripcion LIKE %s OR P.CodigoProducto LIKE %s {str_filter})
                AND ISNULL(PC.Precio, PCL.Precio) > 0
                AND E.Existencia > 0
            """

            arr_productos = get_query(
                str_sql=str_sql_productos,
                params=(
                    int_empresa,
                    int_nocliente,
                    str_no_clase,
                    str_no_lote,
                    ('%' + str_producto + '%'),
                    ('%' + str_producto + '%')
                )
            )
        else:
            str_sql_productos = f"""
                SELECT
                    P.NoProducto,
                    P.CodigoProducto,
                    P.Descripcion,
                    PE.Cantidad AS Presentacion,
                    ISNULL(PC.Precio, PCL.Precio) AS Unitario,
                    E.Existencia
                FROM
                    Inventario..Productos P
                INNER JOIN Inventario..Existencias E ON E.NoProducto = P.NoProducto AND E.NoEmpresa = %s
                LEFT JOIN Inventario..ProductosPresentaciones PE ON PE.NoProducto = P.NoProducto
                LEFT JOIN Inventario..PreciosClientes PC ON PC.NoProducto = P.NoProducto AND PC.NoCliente = %s
                LEFT JOIN Inventario..PreciosClases PCL ON PCL.NoProducto = P.NoProducto
                    AND PCL.NoClaseCliente = %s
                WHERE
                    (P.Descripcion LIKE %s OR P.CodigoProducto LIKE %s {str_filter})
                AND ISNULL(PC.Precio, PCL.Precio) > 0
                AND E.Existencia > 0
            """

            arr_productos = get_query(
                str_sql=str_sql_productos,
                params=(
                    int_empresa,
                    int_nocliente,
                    str_no_clase,
                    ('%' + str_producto + '%'),
                    ('%' + str_producto + '%')
                )
            )

    data = {
        "productos": arr_productos
    }

    return JsonResponse(data, safe=False)


# API de registro de un cliente nuevo al sistema
@login_required(login_url="/login/")
def add_cliente(request):
    int_user = request.user.id if not request.user.is_superuser else 53
    nombre_cliente = request.POST.get('nombre_cliente_nuevo')
    codigo_cliente = request.POST.get('codigo_cliente_nuevo')
    nit_cliente = request.POST.get('nit_cliente_nuevo')
    tel_cliente = request.POST.get('tel_cliente_nuevo')
    email_cliente = request.POST.get('email_cliente_nuevo')
    direccion_cliente = request.POST.get('direccion_cliente_nuevo')
    sucursal_cliente = request.POST.get('direccion_sucursal_nuevo')

    str_exists_client_sql = """
        SELECT
            NoCliente
        FROM
            Inventario..Clientes
        WHERE
            REPLACE(NIT, '-', '') = REPLACE(%s, '-', '')
    """
    arr_cliente = get_query(str_sql=str_exists_client_sql, params=(nit_cliente,))

    # verifico si existe el cliente si existe solo retorno mensaje y no duplico cliente
    if arr_cliente:
        data = {
            "cliente_exist": True
        }

        return JsonResponse(data, safe=False)

    # Busco el NoUsuario de la base de Sistemas del usuario activo
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

    arr_usuario = get_query(str_sql=str_usuario_sql, params=(int_user,))
    int_usuario = arr_usuario[0]['NoUsuario'] if arr_usuario else 0

    # Inserto el cliente nuevo
    str_cliente_sql = """
    INSERT INTO Inventario..Clientes 
    (CodigoCliente, NoClaseCliente, NIT, Direccion, NoPais, Telefono, Fax, email, ExcentoDeIva, NoMoneda, 
    PorcentajeRetencion, DiasCredito, LimiteCredito, NoUsuario, Operado, Zona, NoDepartamento, NoMunicipio,
    NoRuta, NoVendedor, Codigoproveedor, UsaDescripcionAlterna, Observaciones, NombreComercial, Activo, 
    NoGiroNegocio, Nombre, direccion_fiscal)
    VALUES 
    (%s, 106, %s, %s, 'GT', %s, '', %s, 0, 'GTQ', 0.000, 2, 2000, %s, GETDATE(), 0, 1, 101, 99, 62, '', 
    0, '', '', 1, 99, %s, %s)
    """
    insert_query(
        sql=str_cliente_sql,
        params=(codigo_cliente, nit_cliente, sucursal_cliente, tel_cliente, email_cliente, int_usuario, nombre_cliente,
                direccion_cliente)
    )

    execute_query(sql="UPDATE Inventario..clientes_correlativos SET UltimoNumero = UltimoNumero + 1")

    # Busco el NoCliente del cliente que acabo de grabar
    str_cliente_sql = """
        SELECT 
            NoCliente 
        FROM
            Inventario..Clientes
        WHERE
            NIT = %s
        AND CodigoCliente = %s
    """
    arr_cliente = get_query(str_sql=str_cliente_sql, params=(nit_cliente, codigo_cliente))
    int_no_cliente = arr_cliente[0]['NoCliente'] if arr_cliente else 0

    if int_no_cliente:
        # Le asigno la empresa 19 al cliente nuevo
        str_cliente_empresa = """
            INSERT INTO Inventario..ClientesEmpresas VALUES (19, %s, 'F')
        """
        insert_query(sql=str_cliente_empresa, params=(int_no_cliente,))

        arr_sucursal = get_query(
            str_sql="SELECT * FROM Inventario..Sucursales WHERE NoCliente = %s",
            params=(int_no_cliente,)
        )

        if arr_sucursal:
            execute_query(
                sql="""UPDATE Inventario..Sucursales SET Direccion = %s WHERE NoSucursal = %s AND NoCliente = %s""",
                params=(sucursal_cliente, arr_sucursal[0]['NoSucursal'], int_no_cliente)
            )

    data = {
        "no_cliente": int_no_cliente,
        "cliente_exist": False
    }

    return JsonResponse(data, safe=False)


# API de proceso de grabar la cotización y factura
@login_required(login_url="/login/")
def process_venta(request):
    bool_create_cotizacion = request.POST.get('create_cotizacion')
    bool_create_factura = request.POST.get('create_factura')
    bool_status_cotizacion = False
    bool_status_factura = False
    bool_status_fel = False
    int_cotizacion = 0
    int_nodocumento = 0
    int_factura = 0
    str_message_factura = ""
    str_error_message = ""

    if bool_create_cotizacion:

        # insertamos la cotización
        arr_cotizacion = insert_cotizacion(request)
        bool_status_cotizacion = arr_cotizacion['status']

        if arr_cotizacion['status']:
            int_cotizacion = arr_cotizacion['nocotizacion']
            int_nodocumento = arr_cotizacion['nodocumento']
            str_error_message = ''
        else:
            int_cotizacion = 0
            int_nodocumento = 0
            str_error_message = arr_cotizacion['error_message']

        if bool_create_factura and bool_status_cotizacion and int_cotizacion:
            int_user = request.user.id if not request.user.is_superuser else 53

            # inserto la factura
            arr_factura = generate_factura(int_cotizacion, int_user)
            bool_status_factura = arr_factura['status']
            bool_status_fel = arr_factura['status_fel'] if 'status_fel' in arr_factura else False
            str_message_factura = arr_factura['message']
            int_factura = arr_factura['id']

    data = {
        "status_cotizacion": bool_status_cotizacion,
        "cotizacion": int_cotizacion,
        "nodocumento": int_nodocumento,
        "status_factura": bool_status_factura,
        "factura": int_factura,
        "message_factura": str_message_factura,
        "status_fel": bool_status_fel,
        "error_message": str_error_message,
    }

    return JsonResponse(data, safe=False)


# API de mandar a peso el pedido
@login_required(login_url="/login/")
def set_pesado(request):
    int_pedido = request.POST.get('pedido')
    set_notification(request, True, "Pedido envio a toma de peso.", "add_alert", "success")
    data = {
        "status": True if execute_query(sql="UPDATE Inventario..Pedido SET NoEstado = 5 WHERE NoPedido = %s",
                                       params=(int_pedido,)) else False
    }
    return JsonResponse(data, safe=False)


# API de consulta código de cliente nuevo
@login_required(login_url="/login/")
def get_codigo_cliente(request):
    str_sql_cliente = """
        SELECT 
            serie + '' + concat('00', convert(varchar, UltimoNumero + 1)) AS ultimo 
        FROM 
            Inventario..clientes_correlativos
    """

    data = {
        "status": True,
        "codigo": get_query(str_sql=str_sql_cliente)[0]['ultimo'],
    }

    return JsonResponse(data, safe=False)


# API de mandar a peso el pedido
@login_required(login_url="/login/")
def set_anulado(request):
    int_cotizacion = request.POST.get('nocotizacion')
    bool_cotizacion = request.POST.get('cotizacion')
    int_pedido = request.POST.get('pedido')
    bool_update = False

    if bool_cotizacion and int_cotizacion and not int_pedido:
        str_sql_pedido = """
            SELECT
                NoPedido
            FROM
                Inventario..Pedido
            WHERE
                NoDocumento = %s
        """
        obj_pedido = get_query(str_sql=str_sql_pedido, params=(int_cotizacion,))
        int_pedido = obj_pedido[0]['NoPedido'] if obj_pedido else 0

    if int_pedido:
        bool_update = execute_query(sql="UPDATE Inventario..Pedido SET NoEstado = 3 WHERE NoPedido = %s",
                                    params=(int_pedido,))

    if bool_cotizacion:
        bool_update = execute_query(
            sql="UPDATE Inventario..Cotizaciones SET NoEstado = 3, Anulado = 1 WHERE NoCotizacion = %s",
            params=(int_cotizacion,)
        )

    set_notification(request, True, "Pedido anulado.", "add_alert", "success")
    data = {
        "status": True if bool_update else False
    }

    return JsonResponse(data, safe=False)


# API de grabado de despacho
@login_required(login_url="/login/")
def save_despacho(request):
    int_user = request.user.id if not request.user.is_superuser else 53
    int_cotizacion = request.POST.get('nocotizacion')
    int_sucursal = request.POST.get('sucursal')
    str_despacho = request.POST.get('despacho')
    str_observaciones = request.POST.get('observaciones')
    day = datetime.now()

    # Si envían M busco el día de mañana para el insert
    if str_despacho == "M":
        day = day + timedelta(days=1)
        str_day = day.strftime('%Y-%m-%d')
    else:
        str_day = day.strftime('%Y-%m-%d')

    # Busco el NoUsuario de Sistemas para él usuario que procesa
    str_sql_user = """
        SELECT
            SU.NoUsuario
        FROM NOVA..auth_user U
        INNER JOIN ares..empleados_master EM ON EM.id = U.empleado_id
        INNER JOIN Sistemas..Usuarios SU ON SU.NoUsuario = EM.db_login
        WHERE
            U.id = %s
    """
    arr_user = get_query(str_sql=str_sql_user, params=(int_user,))

    # Inserto el despacho
    str_sql_insert_cotizacionsf = """
        INSERT INTO Inventario..CotizacionesSF 
        (NoCotizacion, NoSucursal, NoEstado, NoUsuario, Operado, DespachoER, Observaciones, FechaDespacho) 
        VALUES
        (%s, %s, 1, %s, GETDATE(), %s, %s, %s)
    """
    insert_master = insert_query(sql=str_sql_insert_cotizacionsf,
                                 params=(int_cotizacion, int_sucursal, arr_user[0]['NoUsuario'],
                                         str_despacho, str_observaciones, str_day))
    int_cotizacionsf = insert_master['id'] if insert_master else 0

    # Verifico si se grabo el despacho para seguir procesando o devolver error
    bool_error = False
    if int_cotizacionsf:
        arr_noproducto = request.POST.getlist('noproducto[]')
        arr_saldo = request.POST.getlist('saldo[]')
        arr_despacho = request.POST.getlist('despacho[]')

        int_row = 0
        int_linea = 1
        for despacho in arr_despacho:

            # Inserto el detalle solo si ingresaron despacho
            if despacho:
                str_sql_insert_detalle = """
                    INSERT INTO Inventario..DetalleCotizacionesSF 
                    (NoCotizacionSF, Linea, NoProducto, Despacho, Saldo) 
                    VALUES
                    (%s, %s, %s, %s, %s)
                """
                insert_detalle = insert_query(sql=str_sql_insert_detalle,
                                              params=(int_cotizacionsf, int_linea, arr_noproducto[int_row], despacho,
                                                      arr_saldo[int_row]))
                # Verifico se grabo si no retornare error
                if not insert_detalle:
                    bool_error = True

                int_linea += 1

            int_row += 1

        # Si genera error borro todos los registros grabados
        if bool_error:
            execute_query(sql="DELETE FROM Inventario..DetalleCotizacionesSF WHERE NoCotizacionSF = %s",
                          params=(int_cotizacionsf,))

            execute_query(sql="DELETE FROM Inventario..CotizacionesSF WHERE NoCotizacionSF = %s",
                          params=(int_cotizacionsf,))
            int_cotizacionsf = 0

            str_msj = "Error al grabar el despacho"
            bool_status = False
        else:
            str_msj = "Despacho realizado."
            bool_status = True

    else:
        str_msj = "Error al grabar el despacho"
        bool_status = False

    data = {
        "status": bool_status,
        "cotizacionsf": int_cotizacionsf,
        "msj": str_msj
    }
    return JsonResponse(data, safe=False)


# Método de impresión de documentos
@login_required(login_url="/login/")
def impresion(request, id, tipo):
    if tipo == 'cotizacion':
        data = get_cotizacion(id)
        pdf = render_to_pdf('impresiones/cotizacion.html', data)
        return HttpResponse(pdf, content_type='application/pdf')

    elif tipo == 'orden':
        data = get_cotizacion(id)
        pdf = render_to_pdf('impresiones/orden.html', data)
        return HttpResponse(pdf, content_type='application/pdf')

    elif tipo == 'despacho':
        data = get_despacho(id)
        pdf = render_to_pdf('impresiones/despacho.html', data)
        return HttpResponse(pdf, content_type='application/pdf')

    elif tipo == 'factura':
        arr_factura = get_factura(id)
        if arr_factura:
            arr_detalles = get_factura_detalles(id)

            int_total_detalles = len(arr_detalles) if arr_detalles else 0

            int_user = request.user.id if not request.user.is_superuser else 53
            int_usuario = get_usuario_sistemas(int_user)
            int_establecimiento = 2 if int_usuario == 50 or int_usuario == 205 else 1
            str_direccion = '17 Calle "A" 18-86, Zona 10'
            if int_establecimiento == 2:
                str_direccion = '19 Avenida 17-87, Zona 10'

            str_lugar_salida = ''
            if arr_factura["movimiento_no_empresa"]:
                if arr_factura["movimiento_no_empresa"] == 1:
                    str_lugar_salida = 'Bodega'
                elif arr_factura["movimiento_no_empresa"] == 2:
                    str_lugar_salida = 'Sala'

            if arr_factura['GeneraFE'] == "F":
                int_range = 12 - int_total_detalles

                # esto es para que el PDF sea uniforme y siempre imprima las 9 filas de detalles que permite en una hoja
                arr_completar = []
                for i in range(int_range):
                    arr_completar.append(i)

                data = {
                    "factura": arr_factura,
                    "detalles": arr_detalles if arr_detalles else [],
                    "total_en_letras": numero_a_monedas_v2(arr_factura['Total']).upper() if arr_factura else '',
                    "completar": arr_completar,
                    "total_detalles": int_total_detalles,
                    "establecimiento": int_establecimiento,
                    "str_direccion": str_direccion,
                    "str_lugar_salida": str_lugar_salida,
                }

                # return render(request, 'impresiones/factura.html', data)
                if arr_factura['empresa_id'] == 1:
                    html = render_to_string("impresiones/fusiones.html", data)

                    response = HttpResponse(content_type="application/pdf")
                    response["Content-Disposition"] = "inline; Factura.pdf"

                    font_config = FontConfiguration()
                    HTML(string=html).write_pdf(response, font_config=font_config)

                    return response
                else:

                    html = render_to_string("impresiones/gosnel.html", data)

                    response = HttpResponse(content_type="application/pdf")
                    response["Content-Disposition"] = "inline; Factura.pdf"

                    font_config = FontConfiguration()
                    HTML(string=html).write_pdf(response, font_config=font_config)

                    return response
            else:
                int_range = 11 - int_total_detalles

                # esto es para que el PDF sea uniforme y siempre imprima las 9 filas de detalles que permite en una hoja
                arr_completar = []
                for i in range(int_range):
                    arr_completar.append(i)

                data = {
                    "factura": arr_factura,
                    "detalles": arr_detalles if arr_detalles else [],
                    "total_en_letras": numero_a_monedas_v2(arr_factura['Total']).upper() if arr_factura else '',
                    "completar": arr_completar,
                    "total_detalles": int_total_detalles,
                    "establecimiento": int_establecimiento,
                }
                pdf = render_to_pdf('impresiones/envio.html', data)
                return HttpResponse(pdf, content_type='application/pdf')

        else:
            set_notification(request, True, 'Parámetro incorrectos para impresión.', "warning", "danger")
            return redirect('ventas-home')

    else:
        set_notification(request, True, 'Parámetro incorrectos para impresión.', "warning", "danger")
        return redirect('ventas-home')


# API de búsqueda de cotización para despacho
@login_required(login_url="/login/")
def get_cotizacion_despacho(request):
    int_empresa = request.POST.get('empresa')
    int_documento = request.POST.get('documento')

    # Busco la cotización
    str_sql_cotizacion = """
        SELECT
            CO.NoCotizacion,
            CL.Nombre,
            CL.NoCliente
        FROM
            Inventario..Cotizaciones CO
        INNER JOIN Inventario..Clientes CL ON CL.NoCliente = CO.NoCliente
        INNER JOIN Inventario..Facturas F ON F.NoFactura = CO.NoFactura
        WHERE
            F.NoDocumento = %s
        AND F.NoEmpresa = %s
    """
    arr_cotizacion = get_query(str_sql=str_sql_cotizacion, params=(int_documento, int_empresa))
    arr_cotizacion = arr_cotizacion[0] if arr_cotizacion else None
    arr_detalles = None
    arr_sucursales = None

    # Si la encontró voy a buscar los detalles
    if arr_cotizacion:
        str_sql_sucursales = """
            SELECT
                NoSucursal,
                Nombre,
                Direccion
            FROM
                Inventario..Sucursales
            WHERE
                NoCliente = %s
        """
        arr_sucursales = get_query(str_sql=str_sql_sucursales, params=(arr_cotizacion['NoCliente'],))

        str_sql_despacho_destalles = """
            SELECT
                P.NoProducto,
                P.CodigoProducto,
                P.Descripcion,
                D.Cantidad,
                CASE WHEN ISNULL(PE.Cantidad, 0) = 0 THEN 0
                WHEN ISNULL(PE.Cantidad, 0) = 1 THEN CONVERT(DECIMAL(18, 2), (D.Cantidad * PE.Cantidad))
                ELSE CONVERT(DECIMAL(18, 2), D.Cantidad / ISNULL(PE.Cantidad, 1)) END AS Cajas,
                -- DSF.Despacho
                (D.Cantidad - SUM(ISNULL(DSF.Despacho, 0))) AS Saldo,
                CASE WHEN ISNULL(PE.Cantidad, 0) = 0 THEN 0
                WHEN ISNULL(PE.Cantidad, 0) = 1 THEN 0
                ELSE CONVERT(DECIMAL(18, 2), ((D.Cantidad - SUM(ISNULL(DSF.Despacho, 0))) / PE.Cantidad)) END 
                AS Saldo_cajas
            FROM
                Inventario..DetalleCotizaciones D
            INNER JOIN Inventario..Productos P ON P.NoProducto = D.NoProducto
            LEFT JOIN Inventario..ProductosPresentaciones PE ON PE.NoProducto = P.NoProducto
            LEFT JOIN Inventario..CotizacionesSF CSF ON CSF.NoCotizacion = D.NoCotizacion
            LEFT JOIN Inventario..DetalleCotizacionesSF DSF ON DSF.NoCotizacionSF = csf.NoCotizacionSF AND 
                DSF.NoProducto = D.NoProducto
            WHERE
                D.NoCotizacion = %s
            GROUP BY P.NoProducto, P.CodigoProducto, P.Descripcion, D.Cantidad, PE.Cantidad
        """

        detalles = get_query(str_sql=str_sql_despacho_destalles, params=(arr_cotizacion['NoCotizacion'],))
        arr_detalles = []
        for detalle in detalles:
            arr_detalles.append(
                {
                    "NoProducto": detalle['NoProducto'],
                    "CodigoProducto": detalle['CodigoProducto'],
                    "Descripcion": detalle['Descripcion'],
                    "Cajas": format(detalle['Cajas']),
                    "Cantidad": format(detalle['Cantidad']),
                    "Saldo": format(detalle['Saldo']),
                    "Saldo_cajas": format(detalle['Saldo_cajas']),
                }
            )

    data = {
        "cotizacion": arr_cotizacion,
        "detalles": arr_detalles,
        "sucursales": arr_sucursales
    }
    return JsonResponse(data, safe=False)


# API de búsqueda de documentos para impresión
@login_required(login_url="/login/")
def get_documentos_impresion(request):
    int_empresa = request.POST.get('empresa_impresion')
    int_documento = request.POST.get('documento_impresion')

    # Busco la cotización
    str_sql_impresion = """
        SELECT
            CO.NoCotizacion,
            CL.Nombre,
            CL.NoCliente,
            FA.NoFactura
        FROM
            Inventario..Cotizaciones CO
        INNER JOIN Inventario..Clientes CL ON CL.NoCliente = CO.NoCliente
        LEFT JOIN Inventario..Facturas FA ON FA.NoFactura = CO.NoFactura
        WHERE
            (FORMAT(CO.Fecha, 'yyyy-MM-dd') BETWEEN FORMAT(GETDATE(), 'yyyy-MM-dd') AND DATEADD(DAY, 1, GETDATE()))
        AND CO.NoDocumento = %s
        AND CO.NoEmpresa = %s
        AND CO.Anulado = 0
    """
    arr_cotizacion = get_query(str_sql=str_sql_impresion, params=(int_documento, int_empresa))
    arr_cotizacion = arr_cotizacion[0] if arr_cotizacion else None
    arr_despachos = None

    # Si la encontró voy a buscar los despachos
    if arr_cotizacion:
        str_sql_despachos = """
            SELECT
                C.NoCotizacionSF,
                S.Direccion,
                FORMAT(C.FechaDespacho, 'dd/MM/yyyy ') AS FechaDespacho,
                C.Observaciones
            FROM
                Inventario..CotizacionesSF C
            INNER JOIN Inventario..Sucursales S ON S.NoSucursal = C.NoSucursal
            WHERE
                C.NoCotizacion = %s 
        """
        arr_despachos = get_query(str_sql=str_sql_despachos, params=(arr_cotizacion['NoCotizacion'],))

    data = {
        "cotizacion": arr_cotizacion,
        "despachos": arr_despachos
    }
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def facturacion(request):
    str_query = """
        SELECT 
            P.NoCotizacion AS id,
            IIF(P.GeneraFE = 'F', 'Factura', 'Envio') AS documento,
            ED.empresa_id,
            EA.nit AS nit_empresa,
            E.RazonSocial AS empresa,
            P.NoDocumento AS pedido, 
            FORMAT(CAST(P.Fecha AS DATE), 'dd/MM/yyyy') AS fecha_ingreso,
            C.CodigoCliente AS Codigo,
            C.NIT AS nit_cliente,
            C.Nombre AS cliente,
            P.total,
            ISNULL(S.NoRuta, 99) AS ruta,
            IIF(P.FDespachoHM = 'H', 'Hoy', 'Mañana') AS entrega,
            CASE 
                P.DespachoER 
            WHEN 'E' THEN 'Entregan'
            WHEN 'R' THEN 'Recogen'
            WHEN 'V' THEN 'Vendedor'
            END AS despacho,
            CONCAT(U.Nombres, ' ', U.Apellidos) as usuario,
            ISNULL(P.Observaciones, '') as observaciones,
            P.NoEstado AS estado_id
        FROM Inventario..Cotizaciones P
        INNER JOIN Inventario..Empresas E ON P.NoEmpresa = E.NoEmpresa
        INNER JOIN Inventario..Clientes C ON P.NoCliente = C.NoCliente
        INNER JOIN Inventario..Usuarios U ON P.NoUsuario = U.NoUsuario
        INNER JOIN ares..empresa_database ED ON P.NoEmpresa = ED.codigo AND database_id = 41
        INNER JOIN ares..empresas EA ON ED.empresa_id = EA.id
        LEFT JOIN Inventario..Sucursales S ON P.NoCliente = S.NoCliente AND P.DireccionEntrega = S.Direccion
        LEFT JOIN ares..fel_documentos FD ON P.NoFactura = FD.inventario_documento_id
        WHERE 
            ISNULL(P.NoFactura, 0) = 0
        AND P.Anulado = 0"""

    data = {
        "reporte": get_query(str_sql=str_query)
    }
    return render(request, 'facturacion/facturacion.html', data)


# Ventana para firmar documento
@login_required(login_url="/login/")
def enviar_cola_fel(request):
    str_query = """
        SELECT
            C.NoCotizacion,
            C.NoDocumento,
            C.NoNit,
            C.Nombre,
            C.Observaciones,
            F.NoFactura
        FROM
            NOVA..factura_electronica_cola_facturacion FEL
        INNER JOIN Inventario..Facturas F ON F.NoFactura = FEL.valor_campo
        INNER JOIN Inventario..Cotizaciones C ON C.NoFactura = F.NoFactura
        WHERE
            FEL.firmado = 0
        GROUP BY 
            C.NoCotizacion,
            C.NoDocumento,
            C.NoNit,
            C.Nombre,
            C.Observaciones,
            F.NoFactura"""

    data = {
        "reporte": get_query(str_sql=str_query)
    }
    return render(request, 'facturacion/enviar_cola_fel.html', data)


# Trae los datos del pedido
def get_pedido(id, bool_precio_mayorista=False):
    # Buscamos el pedido master y todos sus datos del cliente, empresa, sucursal y el vendedor
    str_sql_pedido = """
        SELECT
            P.NoPedido,
            P.NoDocumento,
            P.NoEstado,
            C.CodigoCliente,
            C.NoCliente,
            C.Nombre,
            C.NoVendedor,
            C.NombreComercial,
            C.Observaciones AS observacion_cliente,
            U.name,
            P.Fecha,
            P.NoUsuario,
            P.Observaciones,
            P.NoSucursal,
            ISU.Nombre AS Sucursal,
            ISU.Direccion AS DireccionSucursal,
            EE.Descripcion,
            REPLACE(C.NIT, '-', '') AS NIT,
            C.CodigoCliente,
            IEF.NoEmpresa AS NoEmpresaF,
            IEF.NombreComercial AS EmpresaF,
            IEF.DirComercial AS DireccionEmpresaF,
            IEE.NoEmpresa AS NoEmpresaE,
            IEE.NombreComercial AS EmpresaE,
            IEE.DirComercial AS DireccionEmpresaE,
            CASE WHEN C.direccion_fiscal IS NULL THEN C.Direccion ELSE C.direccion_fiscal END AS Direccion,
            U.avatar,
            C.NoClaseCliente,
            IRU.Descripcion AS RutaSucursal
        FROM
            Inventario..Pedido P
        INNER JOIN Inventario..Estados EE on P.NoEstado = EE.NoEstado
        INNER JOIN Inventario..Clientes C ON C.CodigoCliente = P.NoCliente
        INNER JOIN Sistemas..Usuarios SU ON SU.NoUsuario = P.NoUsuario
        INNER JOIN ares..empleados_master EM ON EM.db_login = SU.NoUsuario
        INNER JOIN NOVA..auth_user U ON U.empleado_id = EM.id
        INNER JOIN Inventario..Sucursales ISU ON ISU.NoSucursal = P.NoSucursal
        LEFT JOIN Inventario..ClientesEmpresas ICEF ON ICEF.NoCliente = C.NoCliente AND ICEF.TipoDocumento = 'F'
        LEFT JOIN Inventario..Empresas IEF ON IEF.NoEmpresa = ICEF.NoEmpresa
        LEFT JOIN Inventario..ClientesEmpresas ICEE ON ICEE.NoCliente = C.NoCliente AND ICEE.TipoDocumento = 'E'
        LEFT JOIN Inventario..Empresas IEE ON IEE.NoEmpresa = ICEE.NoEmpresa
        LEFT JOIN Inventario..Rutas IRU ON IRU.NoRuta = ISU.NoRuta
        WHERE
            P.NoPedido = %s
        """

    arr_resultado = get_query(str_sql=str_sql_pedido, params=(id,))
    arr_pedido = arr_resultado[0] if arr_resultado else None

    str_no_clase = "C.NoClaseCliente"
    if bool_precio_mayorista:
        if arr_pedido and arr_pedido['NoClaseCliente'] and arr_pedido['NoClaseCliente'] != 110:
            str_no_clase = 101

    # Traemos todos los detalles del pedido con sus productos y precios
    str_sql_detalles = f"""
        SELECT
            D.Linea,
            D.NoProducto,
            PR.CodigoProducto,
            PR.Descripcion,
            CONVERT(DECIMAL(18, 4), D.Cantidad * ISNULL(PE.Cantidad, 1)) AS Libras,
            ISNULL(PE.Cantidad, 1) AS Cantidad_Cajas,
            D.Cantidad,
            IIF(ISNULL(PE.Cantidad,1) = 1, 
            1, CONVERT(DECIMAL(18, 4), (D.Cantidad * ISNULL(PE.Cantidad, 1)) / ISNULL(PE.Cantidad, 1))) AS Cajas,
            ISNULL(PC.Precio, PCL.Precio) AS Unitario,
            (CONVERT(DECIMAL(18, 4), D.Cantidad * ISNULL(PE.Cantidad, 1)) * ISNULL(PC.Precio, PCL.Precio)) AS Total,
            E.Existencia
        FROM
            Inventario..Pedido P
        INNER JOIN Inventario..PedidoDetalle D ON D.NoPedido = P.NoPedido
        INNER JOIN Inventario..Productos PR ON PR.NoProducto = D.NoProducto
        LEFT JOIN Inventario..ProductosPresentaciones PE ON PR.NoProducto = PE.NoProducto
        INNER JOIN Inventario..Clientes C ON C.CodigoCliente = P.NoCliente
        LEFT JOIN Inventario..PreciosClientes PC ON PC.NoCliente = C.NoCliente AND PC.NoProducto = D.NoProducto
        LEFT JOIN Inventario..PreciosClases PCL ON PCL.NoClaseCliente = {str_no_clase}
            AND PCL.NoProducto = PR.NoProducto
        INNER JOIN Inventario..Existencias E ON E.NoProducto = PR.NoProducto AND E.NoEmpresa = 1
        WHERE
            P.NoPedido = %s
        ORDER BY
            D.Linea
    """

    arr_detalles_tmp = get_query(str_sql=str_sql_detalles, params=(id,))
    arr_detalles = []

    # por los números necesito recorrer los detalles y convertir los datos
    int_total = 0
    for detalle_tmp in arr_detalles_tmp:

        float_cantidad = format(detalle_tmp['Cantidad'])
        arr_split = float_cantidad.split('.')
        str_cantidad = f"{arr_split[0]}.{arr_split[1][:4]}"

        if detalle_tmp['Cajas']:
            float_cajas = format(detalle_tmp['Cajas'])
            arr_split = float_cajas.split('.')
            str_cajas = f"{arr_split[0]}.{arr_split[1][:4]}"

        else:
            str_cajas = ''

        if detalle_tmp['Unitario'] > 0:
            float_unitario = format(detalle_tmp['Unitario'])
            arr_split = float_unitario.split('.')
            str_unitario = f"{arr_split[0]}.{arr_split[1][:4]}"
        else:
            str_unitario = ''
        if detalle_tmp['Total'] > 0:
            float_total = format(detalle_tmp['Total'])
            arr_split = float_total.split('.')
            str_total = f"{arr_split[0]}.{arr_split[1][:4]}"
        else:
            str_total = ''

        arr_detalles.append({
            "Linea": detalle_tmp['Linea'],
            "NoProducto": detalle_tmp['NoProducto'],
            "Libras": format(detalle_tmp['Libras']),
            "Cantidad_Cajas": format(detalle_tmp['Cantidad_Cajas']),
            "CodigoProducto": detalle_tmp['CodigoProducto'],
            "Descripcion": detalle_tmp['Descripcion'],
            "Cantidad": str_cantidad,
            "Cajas": str_cajas,
            "Unitario": str_unitario,
            "Total": str_total,
            "Existencia": format(detalle_tmp['Existencia']),
        })
        int_total += detalle_tmp['Total']

    str_total = format(int_total) if int_total > 0 else ''
    arr_split = str_total.split('.')
    str_total = '%s.%s' % (arr_split[0], arr_split[1][:4]) if str_total != '' else ''

    arr_return = {
        "pedido": arr_pedido,
        "detalles": arr_detalles,
        "total": str_total
    }
    return arr_return


# buscamos el crédito y los días disponibles del cliente
def saldos_cliente(int_no_cliente):
    arr_datos_tmp = get_query(str_sql="exec Inventario..Obtener_Datos_Cliente %s", params=(int_no_cliente,))

    if arr_datos_tmp:
        bool_saldo_red = True if arr_datos_tmp[0]['[Saldo]'] < 0 else False
        bool_disponibilidad_red = True if arr_datos_tmp[0]['[Disponibilidad]'] < 0 else False
        bool_credito_red = True if arr_datos_tmp[0]['[Limite Crédito]'] < 0 else False
        bool_cliente_contado = False
        bool_pago_contado = False
        if (arr_datos_tmp[0]['[Saldo]'] == 0 and arr_datos_tmp[0]['[Disponibilidad]'] == 0 and
                arr_datos_tmp[0]['[Limite Crédito]'] == 0 and arr_datos_tmp[0]['[Dias Disponibles]'] == 0
                and arr_datos_tmp[0]['[Dias Credito]'] == 0):
            bool_cliente_contado = True

        if arr_datos_tmp[0]['[Dias Credito]'] == 3 and arr_datos_tmp[0]['[Limite Crédito]'] == 15000:
            bool_pago_contado = True

        str_sql = """
            SELECT [NoClaseCliente], [NoVendedor], [CodigoCliente]
            FROM [Inventario]..[Clientes]
            WHERE [NoCliente] = %s"""
        arr_cliente = get_query(str_sql=str_sql, params=(int_no_cliente,))

        if arr_cliente and arr_cliente[0]['NoClaseCliente'] == 106 and arr_cliente[0]['NoVendedor'] == 62:
            bool_pago_contado = True

        arr_datos = {
            "Saldo": format(arr_datos_tmp[0]['[Saldo]']),
            "Disponibilidad": format(arr_datos_tmp[0]['[Disponibilidad]']),
            "Limite_Credito": format(arr_datos_tmp[0]['[Limite Crédito]']),
            "Dias_Disponibles": arr_datos_tmp[0]['[Dias Disponibles]'],
            "Dias_Credito": arr_datos_tmp[0]['[Dias Credito]'],
            "saldo_red": bool_saldo_red,
            "disponibilidad_red": bool_disponibilidad_red,
            "credito_red": bool_credito_red,
            "cliente_contado": bool_cliente_contado,
            "pago_contado": bool_pago_contado,
        }

    else:
        arr_datos = None

    return arr_datos


# Método que devuelve el despacho
def get_despacho(int_cotizacionsf):
    # Búsqueda del despacho
    str_sql_despacho = """
        SELECT
            DM.NoCotizacionSF,
            CL.Nombre,
            DM.FechaDespacho,
            S.Direccion,
            DM.Observaciones,
            DM.FechaDespacho
        FROM
            Inventario..CotizacionesSF DM
        INNER JOIN Inventario..Cotizaciones CO ON CO.NoCotizacion = DM.NoCotizacion
        INNER JOIN Inventario..Clientes AS CL ON CL.NoCliente = CO.NoCliente
        INNER JOIN Inventario..Sucursales S ON S.NoSucursal = DM.NoSucursal
        WHERE
            DM.NoCotizacionSF = %s
    """
    arr_despacho = get_query(str_sql=str_sql_despacho, params=(int_cotizacionsf,))[0]

    # Búsqueda de los detalles
    str_sql_detalle = """
        SELECT
            P.CodigoProducto,
            P.Descripcion,
            D.Despacho,
            CASE WHEN ISNULL(PP.Cantidad, 0) = 0 THEN 0
            WHEN ISNULL(PP.Cantidad, 0) = 1 THEN 0
            ELSE CONVERT(DECIMAL(18, 2), (D.Despacho / PP.Cantidad)) END AS Cajas
        FROM
            Inventario..DetalleCotizacionesSF D
        INNER JOIN Inventario..Productos P ON P.NoProducto = D.NoProducto
        INNER JOIN Inventario..ProductosPresentaciones PP ON PP.NoProducto = P.NoProducto
        WHERE
            D.NoCotizacionSF = %s    
        """
    arr_detalles_tmp = get_query(str_sql=str_sql_detalle, params=(int_cotizacionsf,))
    arr_detalles = []

    int_total = 0
    int_total_cajas = 0
    for detalles_tmp in arr_detalles_tmp:
        arr_detalles.append({
            "CodigoProducto": detalles_tmp['CodigoProducto'],
            "Descripcion": detalles_tmp['Descripcion'],
            "Despacho": format(detalles_tmp['Despacho']),
            "Cajas": format(detalles_tmp['Cajas']),
        })
        int_total += detalles_tmp['Despacho']
        int_total_cajas += detalles_tmp['Cajas']

    data = {
        "despacho": arr_despacho,
        "detalles": arr_detalles,
        "total": format(int_total),
        "total_cajas": format(int_total_cajas)
    }
    return data


# Api para traer la cotización
@login_required(login_url="/login/")
def api_get_cotizacion(request):
    int_documento = request.POST.get('cotizacion', '')
    arr_pedido = get_query(str_sql="""SELECT TOP 1 NoCotizacion FROM Inventario..Cotizaciones 
                                        WHERE NoDocumento = %s  ORDER BY NoCotizacion DESC""",
                           params=(int_documento,))
    int_cotizacion = arr_pedido[0]['NoCotizacion'] if arr_pedido else 0
    arr_cotizacion = get_cotizacion(int_cotizacion)
    data = {
        "status": True if arr_cotizacion['cotizacion'] else False,
        "cotizacion": arr_cotizacion,
    }
    return JsonResponse(data, safe=False)


# Devuelve la información de la cotización
def get_cotizacion(int_cotizacion):
    # Busco la cotización
    str_sql_cotizacion = """
        SELECT
            CO.Nombre,
            CL.CodigoCliente,
            CO.Fecha,
            FP.Descripcion,
            CO.Observaciones,
            CO.Total,
            CL.NoRuta,
            CASE WHEN CL.direccion_fiscal IS NULL THEN CL.Direccion ELSE CL.direccion_fiscal END AS Direccion,
            P.NoPedido,
            S.Direccion AS Sucursal,
            E.NombreComercial,
            E.RazonSocial,
            E.DirComercial,
            CO.NoDocumento,
            CO.NoVendedor,
            V.Nombre AS Vendedor,
            V.NoUsuario,
            REPLACE(CL.NIT, '-', '') AS NIT,
            REPLACE(CO.NoNit, '-', '') AS NoNit,
            P.Observaciones AS ObservacionesPedido,
            CO.NoFactura,
            CO.GeneraFE,
            CO.DespachoER,
            CO.FDespachoHM,
            CO.PedidoPorCliente,
            CO.FormaPago,
            CO.FormaEnvio,
            CO.NoNit,
            CO.Nombre,
            CO.Direccion AS DireccionFactura,
            CL.Nombre AS NombreCliente,
            CL.NoCliente,
            S.NoSucursal AS NoSucursal,
            CL.Nombre AS NombreCliente,
            R.Descripcion AS RutaSucursal
        FROM
            Inventario..Cotizaciones CO
        INNER JOIN Inventario..Clientes CL ON CL.NoCliente = CO.NoCliente
        INNER JOIN Inventario..FormasDePago FP ON FP.NoFormaDePago = CO.FormaPago
        INNER JOIN Inventario..Empresas E ON E.NoEmpresa = CO.NoEmpresa
        LEFT JOIN Inventario..Pedido P ON P.NoDocumento = CO.NoCotizacion
        LEFT JOIN Inventario..Sucursales S ON S.NoSucursal = P.NoSucursal
        LEFT JOIN Inventario..Vendedores V ON V.NoVendedor = CO.NoVendedor
        LEFT JOIN Inventario..Facturas F ON F.NoFactura = CO.NoFactura
        LEFT JOIN Inventario..Rutas R ON R.NoRuta = S.NoRuta
        WHERE
            CO.NoCotizacion = %s
    """
    obj_cotizacion = get_query(str_sql=str_sql_cotizacion, params=(int_cotizacion,))
    arr_cotizacion = None

    for cotizacion in obj_cotizacion:
        arr_cotizacion = {
            "NoCotizacion": int_cotizacion,
            "NoFactura": cotizacion['NoFactura'],
            "GeneraFE": cotizacion['GeneraFE'],
            "DespachoER": cotizacion['DespachoER'],
            "FDespachoHM": cotizacion['FDespachoHM'],
            "PedidoPorCliente": cotizacion['PedidoPorCliente'],
            "FormaPago": cotizacion['FormaPago'],
            "FormaEnvio": cotizacion['FormaEnvio'],
            "NoCliente": cotizacion['NoCliente'],
            "Nombre": cotizacion['Nombre'],
            "CodigoCliente": cotizacion['CodigoCliente'],
            "Fecha": cotizacion['Fecha'],
            "Descripcion": cotizacion['Descripcion'],
            "Observaciones": cotizacion['Observaciones'],
            "ObservacionesPedido": cotizacion['ObservacionesPedido'],
            "Total": format(cotizacion['Total']),
            "NoRuta": cotizacion['NoRuta'],
            "Direccion": cotizacion['Direccion'],
            "DireccionFactura": cotizacion['DireccionFactura'],
            "NoPedido": cotizacion['NoPedido'],
            "Sucursal": cotizacion['Sucursal'],
            "NoSucursal": cotizacion['NoSucursal'],
            "NombreComercial": cotizacion['NombreComercial'],
            "RazonSocial": cotizacion['RazonSocial'],
            "NoDocumento": cotizacion['NoDocumento'],
            "NoVendedor": cotizacion['NoVendedor'],
            "Vendedor": cotizacion['Vendedor'],
            "NoUsuario": cotizacion['NoUsuario'],
            "NIT": cotizacion['NIT'],
            "DirComercial": cotizacion['DirComercial'],
            "NombreCliente": cotizacion['NombreCliente'],
            "NoNit": cotizacion['NoNit'],
        }

    # Busco los detalles
    str_sql_destalles = """
        SELECT
            P.NoProducto,
            P.CodigoProducto,
            P.Descripcion,
            D.Cantidad,
            D.Total,
            CONVERT(DECIMAL(18, 4), D.VUnitario) AS VUnitario,
            CASE WHEN ISNULL(PE.Cantidad, 0) = 0 THEN 0
            WHEN ISNULL(PE.Cantidad, 0) = 1 THEN CONVERT(DECIMAL(18, 4), (D.Cantidad * PE.Cantidad))
            ELSE CONVERT(DECIMAL(18, 4), D.Cantidad / ISNULL(PE.Cantidad, 1)) END AS Cajas
        FROM
            Inventario..DetalleCotizaciones D
        INNER JOIN Inventario..Productos P ON P.NoProducto = D.NoProducto
        LEFT JOIN Inventario..ProductosPresentaciones PE ON PE.NoProducto = P.NoProducto
        WHERE
            D.NoCotizacion = %s
    """
    arr_detalles_tmp = get_query(str_sql=str_sql_destalles, params=(int_cotizacion,))
    arr_detalles = []

    for detalles_tmp in arr_detalles_tmp:
        arr_detalles.append({
            "NoProducto": detalles_tmp['NoProducto'],
            "CodigoProducto": detalles_tmp['CodigoProducto'],
            "Descripcion": detalles_tmp['Descripcion'],
            "Cajas": format(detalles_tmp['Cajas']),
            "Cantidad": format(detalles_tmp['Cantidad']),
            "Total": format(detalles_tmp['Total']),
            "VUnitario": format(detalles_tmp['VUnitario']),

            "CantidadMostrar": (format(detalles_tmp['Cajas'])
                                if detalles_tmp['Cajas'] > 0 else format(detalles_tmp['Cantidad'])),
        })

    data = {
        "cotizacion": arr_cotizacion,
        "detalles": arr_detalles
    }
    return data


# Se graba la cotización
def insert_cotizacion(request):
    int_user = request.user.id if not request.user.is_superuser else 53

    arr_producto = request.POST.getlist('producto_id[]')
    arr_cantidad = request.POST.getlist('libras[]')
    arr_descripcion = request.POST.getlist('descripcion[]')
    bodega = request.POST.get('bodega', '')

    int_row = 0
    bool_existencia = True
    error_message = ''
    for producto in arr_producto:
        if producto != "3756":
            int_cantidad = decimal.Decimal(arr_cantidad[int_row])
            str_sql = """
                SELECT
                    Existencia
                FROM
                    Inventario..Existencias
                WHERE
                    NoProducto = %s
                AND NoEmpresa = %s
                AND Existencia > 0"""
            arr_existencia = get_query(str_sql=str_sql,
                                       params=(producto, (1 if bodega == "G" else 2)))

            if arr_existencia and arr_existencia[0]['Existencia'] < int_cantidad or not arr_existencia:
                bool_existencia = False
                # error_message += "Cuenta únicamente con %s de existencia para %s. \n" % (
                error_message += f"No cuenta con suficiente existencia para {arr_descripcion[int_row]}. \n"
        int_row += 1

    if not bool_existencia:
        data = {
            "status": bool_existencia,
            "error_message": error_message,
            "cotizacion": None
        }
        return data

    fecha = request.POST.get('fecha', '')
    cliente = request.POST.get('nocliente', '')
    pedido = request.POST.get('pedido')
    noempresa = request.POST.get('empresa_id', 19)
    vendedor = request.POST.get('novendedor', '')
    total = request.POST.get('total', '')
    observaciones = request.POST.get('observaciones', '')
    # nousuario = request.POST.get('nousuario', '')
    operado = datetime.now()
    nonit = request.POST.get('nit', '')
    nombre = request.POST.get('nombre', '')
    direccion = request.POST.get('direccion', '')
    generafe = request.POST.get('documento', '')
    escredito = request.POST.get('escredito', 0)
    despachoer = request.POST.get('despacho', '')
    fdespachohm = request.POST.get('fecha_despacho', '')
    formapago = request.POST.get('formapago', '')
    direccionentrega = request.POST.get('direccion_sucursal', '')
    #se trae direccion sucursal extraido del select
    direccionsucursal = request.POST.get('hdn_sucursal', '')
    # lote = request.POST.get('lote', '')
    formaenvio = request.POST.get('formaenvio', '')
    contenedor = request.POST.get('contenedor', '')
    nosucursal = request.POST.get('sucursal', '')
    pedidoporcliente = 0 if bodega == 'G' else 1
    refacturacion = True if request.POST.get('refacturacion', False) else False

    # cambio_nit = request.POST.get('cambio_nit', '0')
    # cambio_nombre = request.POST.get('cambio_nombre', '0')
    # nombre_cliente = request.POST.get('cliente', '')

    # nombre_cotizacion = nombre if (cambio_nombre == "1" or cambio_nit == "1") else nombre_cliente

    str_sql_user = """
        SELECT
            SU.NoUsuario
        FROM NOVA..auth_user U
        INNER JOIN ares..empleados_master EM ON EM.id = U.empleado_id
        INNER JOIN Sistemas..Usuarios SU ON SU.NoUsuario = EM.db_login
        WHERE
            U.id = %s
    """
    arr_user = get_query(str_sql=str_sql_user, params=(int_user,))

    # Se busca el correlativo del documento del usuario
    str_sql_correlativo = """
        SELECT 
            UltimoNumero + 1 AS correlativo 
        FROM 
            Inventario..Correlativos 
        WHERE 
            NoTDocumento = 5 
        AND NoEmpresa = %s
        AND UsuarioAsignado = %s
    """

    arr_correlativo = get_query(str_sql=str_sql_correlativo, params=(noempresa, arr_user[0]['NoUsuario']))
    int_documento = arr_correlativo[0]['correlativo'] if arr_correlativo else 1

    str_sql_update_correlativo = """
        UPDATE Inventario..Correlativos 
            SET UltimoNumero = UltimoNumero + 1  
        WHERE 
            NoTDocumento = 5 
        AND NoEmpresa = %s 
        AND UsuarioAsignado = %s
    """ % (noempresa, arr_user[0]['NoUsuario'])

    # str_query_cliente = f"""
    #     SELECT Direccion FROM Inventario..Clientes WHERE NoCliente = {cliente}
    # """
    # arr_cliente = get_query(str_sql=str_query_cliente)

    # direccion_cotizacion = arr_cliente[0]["Direccion"] if arr_cliente and (cambio_nombre == "1" or cambio_nit == "1")\
    #     else direccion

    status = True
    error_message = ''
    cotizacion = None
    int_cotizacion = 0

    try:
        # Inserto la cotización en la db de inventario
        str_sql_insert_cotizacion = """
              INSERT INTO Inventario..Cotizaciones 
              (NoEmpresa, NoDocumento, Fecha, NoCliente, NoVendedor, DiasValidez, Total, Iva, Exento, 
                PorcentajeDescuento, ValorDescuento, NoMoneda, TipoCambio, Observaciones, NoFactura, Anulado, NoEstado, 
                NoUsuario, Operado, NoNit, Nombre, Direccion, GeneraFE, EsCredito, DespachoER, 
                FDespachoHM, FormaPago, DireccionEntrega, PedidoPorCliente, FormaEnvio, NoContenedor)
              VALUES 
              (%s, %s, %s, %s, %s, 0, %s, 0, 0, 0, 0, 'GTQ', 1, %s, 0, 0, 1, %s, GETDATE(), %s, %s, %s, 
              %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        arr_cotizacion = insert_query(
            sql=str_sql_insert_cotizacion,
            params=(noempresa, int_documento, fecha, cliente, vendedor, total, sqlescape(observaciones),
                    arr_user[0]['NoUsuario'], nonit, sqlescape(nombre), sqlescape(direccion), generafe,
                    escredito, despachoer, fdespachohm, formapago, sqlescape(direccionsucursal), pedidoporcliente,
                    formaenvio, contenedor))

        if arr_cotizacion:
            int_cotizacion = int(arr_cotizacion['id'])

            # Inserto la cotización en nova
            cotizacion = Cotizaciones.objects.create(
                nocotizacion=int_cotizacion,
                noempresa=noempresa,
                nodocumento=int_documento,
                fecha=fecha,
                nocliente=cliente,
                novendedor=vendedor,
                diasvalidez=0,
                total=total,
                iva=0,
                excento=0,
                porcentajedescuento=0,
                valordescuento=0,
                nomoneda='GTQ',
                tipocambio=1,
                observaciones=observaciones,
                nofactura=0,
                anulado=0,
                noestado=1,
                nousuario=arr_user[0]['NoUsuario'],
                operado=operado,
                nonit=nonit,
                nombre=nombre,
                direccion=direccion,
                generafe=generafe,
                escredito=True if escredito == '1' else False,
                despachoer=despachoer,
                fdespachohm=fdespachohm,
                formapago=formapago,
                direccionentrega=direccionsucursal,
                pedidoporcliente=pedidoporcliente,
                bodega=bodega,
                refacturacion=refacturacion,
                formaenvio=formaenvio,
                nocontenedor=contenedor,
                nosucursal=nosucursal
            )
        else:
            int_cotizacion = 0
            status = False
            error_message = "Error al ingresar Pedido"

    except Exception as e:
        status = False
        error_message = e.__str__()

    # Verifico si se grabó la cotización master para grabar los detalles
    if status and cotizacion and int_cotizacion > 0:

        arr_producto = request.POST.getlist('producto_id[]')
        arr_unitario = request.POST.getlist('unitario[]')
        arr_cantidad = request.POST.getlist('libras[]')
        arr_total = request.POST.getlist('total[]')
        arr_lote = request.POST.getlist('lote_id[]')

        int_row = 0
        int_linea = 1
        for producto in arr_producto:

            try:

                str_lote = arr_lote[int_row] if len(arr_lote[int_row]) > 0 else 'NULL'
                # Inserto los detalles de la cotización en la db inventario
                str_sql_insert_detalle = f"""
                    INSERT INTO Inventario..DetalleCotizaciones
                    (NoCotizacion, Linea, NoProducto, NoUnidad, Cantidad, PorcentajeDescuento, ValorDescuento, Total,
                    Iva, Exento, NoLote)
                    VALUES
                    (%s, %s, %s, 0, %s, 0, 0, %s, 0, 0, {str_lote})
                """
                arr_detalle = insert_query(sql=str_sql_insert_detalle,
                                           params=(int_cotizacion, int_linea, producto, arr_cantidad[int_row],
                                                   arr_total[int_row]))

                if not arr_detalle:
                    status = False
                else:
                    # Inserto los detalles de la cotización en la db de NOVA
                    Detalle_cotizaciones.objects.create(
                        nocotizacion_id=cotizacion.nocotizacion,
                        linea=int_linea,
                        noproducto=producto,
                        nounidad=0,
                        cantidad=arr_cantidad[int_row],
                        porcentajedescuento=0,
                        valordescuento=0,
                        total=arr_total[int_row],
                        iva=0,
                        excento=0,
                        vunitario=arr_unitario[int_row],
                        nolote=arr_lote[int_row] if len(arr_lote[int_row]) > 0 else None,
                    )
                int_linea += 1
                int_row += 1

            except Exception as e:
                status = False
                error_message += e.__str__() if error_message == '' else '; %s' % e.__str__()

    # Actualizo el correlativo del usuario
    if status and int_cotizacion > 0:
        insert_query(str_sql_update_correlativo)

        # actualizo el pedido si existe
        if pedido:
            str_sql_update_pedido = """
                UPDATE Inventario..Pedido SET NoDocumento = %s, NoEstado = 4
                WHERE NoPedido = %s 
            """

            insert_query(sql=str_sql_update_pedido, params=(int_cotizacion, pedido))
            # Envio de email de la confirmación del pedido
            if not DEBUG:
                try:
                    send_email_confirmacion(int_cotizacion)
                except Exception as e:
                    body = f'Error:\n {e.__str__()} \n\nNoPedido:\n {pedido}'
                    email = EmailMultiAlternatives(
                        'Error confirmación de pedido',
                        body,
                        settings.EMAIL_HOST_USER,
                        ['nrodriguez@grupobuena.com']
                    )
                    email.send()

    # Si hay error revierto los registros
    else:
        if cotizacion:
            Detalle_cotizaciones.objects.filter(nocotizacion_id=cotizacion.nocotizacion).delete()
            cotizacion.delete()

        if int_cotizacion:
            execute_query(sql="DELETE FROM Inventario..DetalleCotizaciones WHERE NoCotizacion = %s",
                          params=(int_cotizacion,))

            execute_query(sql="DELETE FROM Inventario..Cotizaciones WHERE NoCotizacion = %s",
                          params=(int_cotizacion,))

    data = {
        "status": status,
        "error_message": error_message,
        "nocotizacion": cotizacion.nocotizacion if cotizacion else None,
        "nodocumento": cotizacion.nodocumento if cotizacion else None,
    }
    return data


# Envio de email de la confirmación del pedido
def send_email_confirmacion(cotizacion):
    nocliente = get_query(str_sql="SELECT NoCliente FROM Inventario..Cotizaciones WHERE NoCotizacion = %s",
                          params=(cotizacion,))

    mail = get_query(str_sql="SELECT correo FROM Inventario..correosmayoristas WHERE NoCliente = %s",
                     params=(nocliente[0]['NoCliente'],))
    str_mail = 'NULL'

    if len(mail):
        str_mail = f"'{str(mail[0]['correo'])}'"

    status = False
    sql = f"""
        SELECT 
            C.NoCotizacion, C.NoDocumento, pe.NoPedido AS NoPedidoMovil, C.nombre AS Cliente,
            U.email AS email_secretaria, ISNULL({str_mail}, UU.email) AS email_vendedor, 
            'ventas@grupobuena.com' AS email_jefeventas,    
            IIF(C.EsCredito = 1, 'Credito', 'Contado') AS FormadePago,
            IIF(C.GeneraFE = 'F', 'Factura', 'Envio') AS Genera,
            IIF(C.fdespachoHM = 'M', 'Mañana', 'Hoy') AS Despacho,
            C.Observaciones,
            C.DireccionEntrega
        FROM
            Inventario..Cotizaciones C
        INNER JOIN Inventario..Clientes CC ON C.NoCliente = CC.nocliente
        INNER JOIN Inventario..Pedido PE ON PE.nodocumento = C.nocotizacion 
        INNER JOIN inventario..Vendedores V ON CC.novendedor = V.NoVendedor
        INNER JOIN Sistemas..Usuarios U ON C.nousuario =  U.NoUsuario
        INNER JOIN Sistemas..Usuarios UU ON UU.NoUsuario = V.NoVendedor
        WHERE 
            C.NoCotizacion = %s
    """
    arr_pedidos = get_query(str_sql=sql, params=(cotizacion,))

    if arr_pedidos:
        sql = """
            SELECT 
                P.CodigoProducto, 
                P.Descripcion,
                ISNULL(U.descripcion,'') AS unidad,
                D.cantidad / ISNULL(PP.Cantidad,1) AS Cajas, 
                D.cantidad AS Libras,
                D.Total
            FROM
                Inventario..DetalleCotizaciones D 
            INNER JOIN Inventario..Productos P ON P.NoProducto = D.NoProducto
            INNER JOIN inventario..Cotizaciones CO ON D.NoCotizacion = CO.NoCotizacion
            LEFT JOIN Inventario..ProductosPresentaciones PP ON P.noproducto = PP.NoProducto
            LEFT JOIN Inventario..Unidades U ON U.nounidad = PP.NoUnidad
            WHERE
                D.NoCotizacion = %s
        """
        arr_detalles_pedido = get_query(str_sql=sql, params=(cotizacion,))

        str_msj = f"""\nNoPedido = {arr_pedidos[0]['NoDocumento']} \nNoPedidoMovil = {arr_pedidos[0]['NoPedidoMovil']} 
        \nPedido Para: {arr_pedidos[0]['Cliente']} \n\n- Forma de Pago: {arr_pedidos[0]['FormadePago']} \n- 
        Genera: {arr_pedidos[0]['Genera']} \n - Enviar: {arr_pedidos[0]['Despacho']} \n\n"""

        for detalle_pedido in arr_detalles_pedido:
            str_msj += f"""{detalle_pedido['CodigoProducto']} - {detalle_pedido['Descripcion']} - 
                        {detalle_pedido['unidad']}: {detalle_pedido['Cajas']} - Libras: {detalle_pedido['Libras']} - 
                        Total: {detalle_pedido['Total']} \n"""

        str_msj += f"""\n- Observaciones: {arr_pedidos[0]['Observaciones']} \n- 
                            Dirección de Entrega: {arr_pedidos[0]['DireccionEntrega']}"""

        str_subject = f"Pedido {arr_pedidos[0]['NoPedidoMovil']} ingreso al sistema"

        str_cc = "ventas@grupobuena.com"

        if (not DEBUG and arr_pedidos[0]['email_secretaria'] and arr_pedidos[0]['email_vendedor'] and
                arr_pedidos[0]['email_jefeventas']):
            arr_emails = [arr_pedidos[0]['email_secretaria'], arr_pedidos[0]
                          ['email_vendedor'], arr_pedidos[0]['email_jefeventas']]
            if send_email(str_subject=str_subject, str_body=str_msj, arr_emails=arr_emails, str_cc=str_cc,
                          bool_send=DEBUG):
                status = True
                Pedidos_Confirmados.objects.create(
                    nocotizacion=cotizacion
                )

    return status


@login_required(login_url="/login/")
def get_precio_producto(request):
    int_nocliente = request.POST.get('nocliente', 0)
    str_producto = request.POST.get('busqueda', '')
    int_no_producto = request.POST.get('no_producto', '')
    int_empresa = request.POST.get('empresa', '')
    bool_precio_mayorista = request.POST.get('precio_mayorista')
    # bool_noproducto = request.POST.get('boolNoProducto')

    if str_producto == "10000" or str_producto.upper() == "SERVICIOS":
        str_sql_productos = f"""
            SELECT
                P.NoProducto,
                P.CodigoProducto,
                P.Descripcion,
                1 AS Presentacion,
                0 AS Unitario,
                1 AS Existencia
            FROM
                Inventario..Productos P
            WHERE
                (P.NoProducto = %s)"""

        arr_productos = get_query(
            str_sql=str_sql_productos,
            params=(
                int_no_producto,
            )
        )

    else:
        str_sql_clientes = """
            SELECT
                C.NoCliente,
                C.NoClaseCliente
            FROM
                Inventario..Clientes C
            WHERE
                C.NoCliente = %s
        """
        arr_cliente = get_query(str_sql=str_sql_clientes,
                                params=(int_nocliente,))[0]

        str_no_clase = arr_cliente['NoClaseCliente']
        if bool_precio_mayorista:
            if arr_cliente and arr_cliente['NoClaseCliente'] and arr_cliente['NoClaseCliente'] != 110:
                str_no_clase = 101

        # str_filter = ""
        # if bool_noproducto:
        #     str_filter = f"OR P.NoProducto = {str_producto}"

        str_sql_productos = f"""
            SELECT
                P.NoProducto,
                P.CodigoProducto,
                P.Descripcion,
                PE.Cantidad AS Presentacion,
                ISNULL(PC.Precio, PCL.Precio) AS Unitario,
                E.Existencia
            FROM
                Inventario..Productos P
            INNER JOIN Inventario..Existencias E ON E.NoProducto = P.NoProducto AND E.NoEmpresa = %s
            LEFT JOIN Inventario..ProductosPresentaciones PE ON PE.NoProducto = P.NoProducto
            LEFT JOIN Inventario..PreciosClientes PC ON PC.NoProducto = P.NoProducto AND PC.NoCliente = %s
            LEFT JOIN Inventario..PreciosClases PCL ON PCL.NoProducto = P.NoProducto
                AND PCL.NoClaseCliente = %s
            WHERE
                (P.NoProducto = %s)
            AND ISNULL(PC.Precio, PCL.Precio) > 0
            AND E.Existencia > 0
        """

        arr_productos = get_query(
            str_sql=str_sql_productos,
            params=(
                int_empresa,
                int_nocliente,
                str_no_clase,
                int_no_producto
            )
        )

    data = {
        "productos": arr_productos
    }

    return JsonResponse(data, safe=False)
