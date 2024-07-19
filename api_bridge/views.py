from datetime import date, datetime
from decimal import Decimal

from django.core.mail import EmailMessage
from django.db.models import F, Q, Value, CharField
from django.db.models.functions import Concat
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import check_password
from sqlescapy import sqlescape
from django.core import serializers
from auditoria.models import Verificacion_cliente, Verificacion_detalle
from core.ares_models import ClientesProspectos
from core.functions import get_query, insert_query, execute_query
from core.inventario_models import ProductosInventario, Motivos, VentaperdidaInventario, Ventaperdidadetalle, Clientes
from core.models import User_departamento
from factura_electronica.functions import get_datos_nit
from soffybiz.debug import DEBUG, IMAGEN_GB
from rrhh.models import Vales
from user_auth.models import User
from durin.models import AuthToken, Client
from django.conf import settings
import json, base64, os, random, string
import qrcode


def get_user_db_login(int_user):
    str_sql = """
        SELECT
            E.db_login
        FROM NOVA..auth_user U
        INNER JOIN ares..empleados_master E ON E.id = U.empleado_id
        WHERE
            U.id = %s 
    """
    arr_user = get_query(str_sql=str_sql, params=(int_user,))
    return arr_user[0]["db_login"] if arr_user else 0


@api_view(["POST"])
def login(request):
    try:
        str_email = request.data["email"]
        str_password = request.data["password"]
        obj_user = User.objects.get(email=str_email)
    except User.DoesNotExist:
        return Response({
            "status": False,
            "message": "Usuario inválido"
        })
    except KeyError:
        return Response({
            "status": False,
            "message": "Los datos contenidos en la solicitud no son los correctos."
        })

    pwv_valid = check_password(str_password, obj_user.password)

    if not pwv_valid:
        return Response({
            "status": False,
            "message": "El password no es válido"
        })

    obj_client, created_client = Client.objects.get_or_create(name=settings.REST_DURIN["API_ACCESS_CLIENT_NAME"])

    try:
        obj_last_token = AuthToken.objects.get(user=obj_user, client=obj_client)
        if obj_last_token.has_expired:
            obj_last_token.renew_token(request=request)
        obj_token = obj_last_token
    except AuthToken.DoesNotExist:
        obj_token = AuthToken.objects.create(user=obj_user, client=obj_client)

    try:
        user_departamento = User_departamento.objects.filter(user_id=obj_user.id).first()
        str_departamento = user_departamento.departamento.nombre
        int_departamento = user_departamento.departamento_id
    except Exception:
        return Response({
            "status": False,
            "message": "No tiene departamento configurado"
        })

    str_default = "https://nova.ffinter.com/static/assets/img/default-avatar.png"
    str_photo = f"https://nova.ffinter.com/{obj_user.avatar.url}" if obj_user.avatar else str_default
    return Response({
        "status": True,
        "token": obj_token.token,
        "email": obj_user.email,
        "name": obj_user.name,
        "user_id": obj_user.id,
        "photo": str_photo,
        "login_date": obj_token.created,
        "expiry_date": obj_token.expiry,
        "departamento": str_departamento,
        "departamento_id": int_departamento,
        "message": f"Bienvenido: {obj_user.name}"
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_users(request):
    obj_lista = User.objects.all()

    return Response(list(obj_lista.values()))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_clientes(request):
    str_search = request.POST.get('search', '')
    user = request.user

    clientes_query = Clientes.objects.filter(activo=True)  # Filtrar por clientes activos

    if str_search:
        clientes_query = clientes_query.filter(
            Q(codigocliente__icontains=str_search) |
            Q(nombre__icontains=str_search)
        )

    if user.id == 145 or user.id == 146:
        clientes_query = clientes_query.filter(
            Q(nocliente__in=[123863, 124908, 128444, 129407, 131805, 141471, 145446, 145711, 147156, 148589]) |
            Q(novendedor=90)
        )

    elif user.mobile_seller:

        if user.id == 177:
            clientes_query = clientes_query.filter(nocliente__in=[121635, 121637])
        else:
            int_user = get_user_db_login(user.id)
            clientes_query = clientes_query.filter(novendedor=int_user)

    arr_clientes = clientes_query.values('nocliente', 'codigocliente', 'nombre')
    arr_clientes = [{'id': c['nocliente'], 'nombre': f"{c['codigocliente']} | {c['nombre']}"} for c in arr_clientes]

    data = {
        "status": True,
        "clientes": arr_clientes,
    }
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_info_cliente(request):
    str_cliente = sqlescape(request.POST.get('cliente', ''))

    if len(str_cliente) > 0:

        arr_info = get_query(str_sql="EXEC ares..PedidosMovilesDatosCliente %s", params=(str_cliente,))

        str_sql = """
            SELECT
                DISTINCT Descripcion AS Producto
            FROM
                ares..ventas_generales
            WHERE
                NoCliente = %s
            AND Fecha BETWEEN GETDATE() - 15 - 30 and  GETDATE() - 15
            AND NoProducto NOT IN
                (SELECT
                    NoProducto 
                FROM ares..ventas_generales WHERE NoCliente = %s AND Fecha >= GETDATE() - 15)
                """
        arr_sin_comprar = get_query(str_sql=str_sql, params=(str_cliente, str_cliente))

        arr_sucursales = get_query(str_sql="SELECT NoSucursal, Direccion FROM Inventario..sucursales "
                                           "WHERE NoCliente = %s AND Activo = 1", params=(str_cliente,))

        return Response({
            "status": True,
            "info_cliente": arr_info,
            "sin_comprar": arr_sin_comprar,
            "sucursales": arr_sucursales,
        })

    else:

        return Response({
            "status": False
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_vencidos_cliente(request):
    str_cliente = request.POST.get('cliente', '')

    if len(str_cliente) > 0:

        return Response({
            "status": True,
            "vencidos": get_query(str_sql="EXEC ares..PedidosMovilesDocsVencidos %s", params=(sqlescape(str_cliente),)),
        })

    else:

        return Response({
            "status": False
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_saldo_cliente(request):
    str_cliente = request.POST.get('cliente', '')

    if len(str_cliente) > 0:

        return Response({
            "status": True,
            "saldo": get_query(str_sql="EXEC ares..PedidosMovilesAntiguedadSaldo %s", params=(sqlescape(str_cliente),)),
        })

    else:

        return Response({
            "status": False
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_venta_cruzada(request):
    int_cliente = request.POST.get('cliente', '')

    if len(int_cliente) > 0:

        return Response({
            "status": True,
            "cruzada": get_query(str_sql="EXEC Inventario..VentaCruzadaMovil %s", params=(sqlescape(int_cliente),)),
        })

    else:

        return Response({
            "status": False
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_productos(request):
    str_producto = sqlescape(request.POST.get('producto', ''))

    if len(str_producto) > 0:

        str_sql = """
            SELECT 
                productos.NoProducto AS id, 
                CONCAT(productos.CodigoProducto, ' | ', productos.Descripcion) AS nombre
            FROM 
                Inventario..Productos AS productos
            INNER JOIN Inventario..existencias AS ex ON productos.NoProducto = ex.NoProducto
            WHERE 
                ex.NoEmpresa IN (1, 2)
            AND ex.existencia > 0
            AND productos.habilitado = 1
            AND (productos.CodigoProducto LIKE %s OR productos.Descripcion LIKE %s)
            GROUP BY 
                productos.NoProducto, productos.CodigoProducto, productos.Descripcion
        """
        return Response({
            "status": True,
            "productos": get_query(str_sql=str_sql, params=('%' + str_producto + '%', '%' + str_producto + '%')),
        })

    else:

        return Response({
            "status": False
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_productos_lost(request):
    str_producto = sqlescape(request.POST.get('producto', ''))

    if len(str_producto) > 0:

        try:
            productos = ProductosInventario.objects.filter(
                habilitado=True,
                existencias__noempresa__in=[1]
            ).annotate(
                id=F('noproducto'),
                nombre=Concat(
                    F('codigoproducto'),
                    Value(' | '),
                    F('descripcion'),
                    output_field=CharField()
                )
            ).filter(habilitado=True).filter(
                Q(codigoproducto__startswith=str_producto) | Q(descripcion__icontains=str_producto),
            ).values(
                'id', 'nombre'
            ).distinct()

            return Response({
                "status": True,
                "productos": productos,
            })

        except Exception:
            return Response({
                "status": False
            })

    else:

        return Response({
            "status": False
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_motivos(request):
    try:
        motivos_list = serializers.serialize('python', Motivos.objects.all())
        motivos_data = [{'id': item['pk'], 'descripcion': item['fields']['descripcion']} for item in motivos_list]
        return Response({
            "status": True,
            "motivos": motivos_data,
        })

    except Exception:
        return Response({
            "status": False
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def grabar_venta_perdida(request):
    try:
        int_user = get_user_db_login(request.user.id)
        str_no_cliente = request.POST.get('no_cliente', '')
        str_observaciones = request.POST.get('observaciones', '')
        str_total = request.POST.get('total', '')
        str_motivo_id = request.POST.get('motivo_id', '')
        str_motivo = request.POST.get('motivo', '')
        arr_detalles = request.POST.get('detalles', '')

        cliente = Clientes.objects.filter(nocliente=str_no_cliente).first()
        venta = VentaperdidaInventario.objects.create(
            nocliente=str_no_cliente,
            observaciones=str_observaciones,
            total=str_total,
            motivo=str_motivo,
            motivo_id=str_motivo_id,
            noestado=1,
            nousuario=int_user,
            fecha=datetime.now()
        )

        int_linea = 1
        str_body = ""
        data = json.loads(arr_detalles)
        for detalle in data:
            Ventaperdidadetalle.objects.create(
                nopedido=venta.nopedido,
                noproducto=detalle['id'],
                linea=int_linea,
                cantidad=detalle['cantidad'],
                precio=detalle['precio'],
                actualizaexistencia=0,
            )
            subtotal = Decimal(detalle['cantidad']) * Decimal(detalle['precio'])
            int_linea += 1
            producto = ProductosInventario.objects.filter(noproducto=detalle['id']).first()
            str_body += f"""
                <tr>
                    <td>{producto.codigoproducto} | {producto.descripcion}</td>
                    <td>{detalle['cantidad']}</td>
                    <td style="text-align: right;">{detalle['precio']}</td>
                    <td style="text-align: right;">{subtotal}</td>
                </tr>
            """

        Ventaperdidadetalle.objects.filter(nopedido=venta.nopedido).update(actualizaexistencia=1)

        return Response({
            "status": True,
        })

    except Exception as E:
        print('\n ERROR EN VENTA \n', E, '\n')
        return Response({
            "status": False
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_info_producto(request):
    str_producto = sqlescape(request.POST.get('producto', ''))
    str_cliente = sqlescape(request.POST.get('cliente', ''))

    if len(str_producto) > 0 and len(str_cliente) > 0:

        return Response({
            "status": True,
            "existencia": get_query(
                str_sql="EXEC ares..PedidosMovilesProductoDetalle %s, %s", params=(str_producto, str_cliente)),
            "sugerido": get_query(str_sql="EXEC ares..PedidoSugerido %s, %s", params=(str_producto, str_cliente)),
        })

    else:

        return Response({
            "status": False
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def grabar_envio(request):
    str_codigo_cliente = request.POST.get('codigo_cliente', '')
    str_observaciones = request.POST.get('observaciones', '')
    str_total = request.POST.get('total', '')
    str_no_sucursal = request.POST.get('no_sucursal', '')
    arr_detalles = request.POST.get('detalles', '')

    try:
        str_sql_user = """
            SELECT
                SU.NoUsuario
            FROM NOVA..auth_user U
            INNER JOIN ares..empleados_master EM ON EM.id = U.empleado_id
            INNER JOIN Sistemas..Usuarios SU ON SU.NoUsuario = EM.db_login
            WHERE
                U.id = %s
        """
        arr_user = get_query(str_sql=str_sql_user, params=(request.user.id,))

        str_sql_insert = """
                    INSERT INTO Inventario..Pedido 
                    (fecha, NoCliente, NoUsuario, NoEstado, Observaciones, Total, NoSucursal)
                    VALUES
                    (GETDATE(), %s, %s, 0, %s, %s, %s)
                """
        arr_id = insert_query(
            sql=str_sql_insert,
            params=(sqlescape(str_codigo_cliente), arr_user[0]['NoUsuario'], sqlescape(str_observaciones[:250]),
                    str_total, str_no_sucursal)
        )
        int_pedido = arr_id['id']

        int_linea = 1
        data = json.loads(arr_detalles)
        for detalle in data:
            str_sql_insert = """
                INSERT INTO Inventario..PedidoDetalle 
                (NoPedido, Linea, NoProducto, Cantidad)
                VALUES
                (%s, %s, %s, %s)
            """
            insert_query(sql=str_sql_insert, params=(int_pedido, int_linea, detalle['noproducto'], detalle['cantidad']))
            int_linea += 1

        execute_query(sql="UPDATE Inventario..Pedido SET NoEstado = 1 WHERE NoPedido = %s", params=(int_pedido,))

        return Response({
            "status": True,
            "msj": f"Pedido enviado, Número {int_pedido}",
            "pedido": int_pedido,
        })

    except ValueError:
        return Response({
            "status": False,
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_existencias(request):
    try:

        return Response({
            "status": True,
            "existencias": get_query(str_sql="EXEC ares..PedidosMovilesExistencias"),
        })

    except ValueError:
        return Response({
            "status": False,
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_producto_transito(request):
    try:
        str_codigo = request.POST.get('codigo', '')
        str_sql = """SELECT * FROM NOVA..productosarribo
                    WHERE codigoproducto = %s
                    ORDER BY FechaArribo DESC"""

        arr_data = get_query(str_sql=str_sql, params=(sqlescape(str_codigo),))

        if len(arr_data):
            return Response({
                "status": True,
                "message": "Datos obtenidos correctamente",
                "data": arr_data,
            })
        else:
            return Response({
                "status": False,
                "message": "No hay información en transito sobre este producto"
            })

    except ValueError:
        return Response({
            "status": False,
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_pedido_dia(request):
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        str_fecha = request.POST.get('fecha', today)
        int_user = get_user_db_login(request.user.id)

        return Response({
            "status": True,
            "data": get_query(str_sql="EXEC ares..PedidosMovilesPedidosDia %s, %s", params=(str_fecha, int_user))
        })

    except ValueError:
        return Response({
            "status": False,
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_comisiones(request):
    # try:
    str_sql_user = """
        SELECT
            SU.NoUsuario, EM.db_login, EM.id
        FROM NOVA..auth_user U
        INNER JOIN ares..empleados_master EM ON EM.id = U.empleado_id
        INNER JOIN Sistemas..Usuarios SU ON SU.NoUsuario = EM.db_login
        WHERE
            U.id = %s
    """
    arr_user = get_query(str_sql=str_sql_user, params=(request.user.id,))

    str_filtro = ""
    int_no_vendedor = arr_user[0]["db_login"]
    if arr_user[0]["id"] == 58 or arr_user[0]["id"] == 18:
        str_filtro = "AND rcd.codigo_cliente NOT IN('2012287','2012412','2013321','2014016','2017061')"
        int_no_vendedor = "86,90"

    obj_hoy = date.today()
    int_mes_actual = obj_hoy.month
    int_anio_actual = obj_hoy.year
    int_dia_actual = obj_hoy.day

    if int_dia_actual <= 5:
        int_mes = int_mes_actual - 1
        if int_mes == 0:
            int_mes = 12
            int_anio_actual -= 1
    else:
        int_mes = int_mes_actual

    str_query_c = f"""
        SELECT rcd.nombre_cliente, rcd.numero_factura, FORMAT(rcd.fecha_fac,'dd/MM/yyyy') as fecha_fac,
            rcd.numero_recibo, FORMAT(rcd.fecha_rec,'dd/MM/yyyy') as fecha_rec, rcd.dias_credito,
            rcd.diferencias_dias, rcd.nombre_producto, rcd.abono_producto, rcd.comision_pagada,
            rcd.id, rcd.cajas_abonadas, ref.*,
            CASE
                WHEN rcd.valor_comision_efectiva = 0 THEN
                    '0.00'
                WHEN rcd.valor_comision_efectiva < 0.1 THEN
                    CAST(CAST((rcd.valor_comision_efectiva * 100) AS DECIMAL(5,2)) AS varchar) + '%%'
                ELSE
                    CAST(CAST((rcd.valor_comision_efectiva) AS DECIMAL(5,2)) AS varchar)
            END as monto_comision
        FROM NOVA..rrhh_comision_datos as rcd
        left join (
            select f.Serie + '-' + cast(f.NoDocumento as varchar) as FacturaAnterior, 
                FORMAT(cast(f.Fecha as date),'dd/MM/yyyy') as Fecha, f.Total, f.Observaciones, rf.NombreAnterior,
                rf.Observaciones as 'ObservacionesN', rf.NoFacturaActual
            from Inventario..Refacturaciones as rf
                inner join Inventario..Facturas as f on f.NoFactura = rf.NoFacturaAnterior
        ) as ref
        on ref.NoFacturaActual = rcd.no_factura
        WHERE rcd.no_vendedor IN({int_no_vendedor})
        AND rcd.mes = %s
        AND rcd.año = %s
        AND rcd.tipo_producto = 'Cuadril'
        {str_filtro}
    """

    obj_query_c = get_query(str_sql=str_query_c, params=(int_mes, int_anio_actual))

    str_query_m = f"""
        SELECT rcd.nombre_cliente, rcd.numero_factura, FORMAT(rcd.fecha_fac,'dd/MM/yyyy') as fecha_fac,
            rcd.numero_recibo, FORMAT(rcd.fecha_rec,'dd/MM/yyyy') as fecha_rec, rcd.dias_credito,
            rcd.diferencias_dias, rcd.nombre_producto, rcd.abono_producto, rcd.comision_pagada,
            rcd.id, rcd.cajas_abonadas, ref.*,
            CASE
                WHEN rcd.valor_comision_efectiva = 0 THEN
                    '0.00'
                WHEN rcd.valor_comision_efectiva < 0.1 THEN
                    CAST(CAST((rcd.valor_comision_efectiva * 100) AS DECIMAL(5,2)) AS varchar) + '%%'
                ELSE
                    CAST(CAST((rcd.valor_comision_efectiva) AS DECIMAL(5,2)) AS varchar)
            END as monto_comision
        FROM NOVA..rrhh_comision_datos as rcd
        left join (
            select f.Serie + '-' + cast(f.NoDocumento as varchar) as FacturaAnterior,
                FORMAT(cast(f.Fecha as date),'dd/MM/yyyy') as Fecha, f.Total, f.Observaciones, rf.NombreAnterior,
                rf.Observaciones as 'ObservacionesN', rf.NoFacturaActual
            from Inventario..Refacturaciones as rf
                inner join Inventario..Facturas as f on f.NoFactura = rf.NoFacturaAnterior
        ) as ref
        on ref.NoFacturaActual = rcd.no_factura
        WHERE rcd.no_vendedor IN({int_no_vendedor})
        AND rcd.mes = %s
        AND rcd.año = %s
        AND rcd.tipo_producto = 'Mixto'
        {str_filtro}
    """
    obj_query_m = get_query(str_sql=str_query_m, params=(int_mes, int_anio_actual))

    return Response({
        "status": True,
        "comisiones_c": obj_query_c,
        "comisiones_m": obj_query_m,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_cobrado_dia(request):
    int_user = get_user_db_login(request.user.id)

    first_day = datetime.today()
    today = datetime.now()

    str_sql = """
        SELECT 
            SUM(CASE WHEN D.DocAbono IS NULL THEN  A.Total ELSE 0 END)/1.12 AS Cobrado
        FROM CuentaCorriente..AuxiliarCxC A
        JOIN CuentaCorriente..InvClientes C ON A.CodigoCliente = C.CodigoCliente
        LEFT OUTER JOIN 
            (
                SELECT 
                    X.NoCorrelativo, P.DocAbono
                FROM CuentaCorriente..AuxiliarCxC X
                INNER JOIN CuentaCorriente..AplicacionCxC P ON X.NoCorrelativo = P.DocAplico
                WHERE X.TipoDoc = 'D'
            ) D ON A.NoCorrelativo = D.DocAbono
        WHERE A.fecha BETWEEN %s AND %s
        AND A.TipoDoc = 'R'
        AND C.NoVendedor = %s
        GROUP BY C.NombreVendedor
    """

    return Response({
        "status": True,
        "data": get_query(str_sql=str_sql,
                          params=(first_day.strftime("%Y-%m-01"), today.strftime('%Y-%m-%d'), int_user)),
        "rango_fecha": "del %s al %s" % (first_day.strftime("01/%m/%Y"), today.strftime('%d/%m/%Y'))
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_ventas_al_dia(request):
    int_user = get_user_db_login(request.user.id)

    str_sql = """
        SELECT 
            Clasificacion, SUM(Unidades) AS unidades, SUM(cajas) AS cajas, SUM(totalPrdSinDes) AS Total
        FROM
            Inventario..VentasNetas
        WHERE NoVendedor = %s
        AND fecha BETWEEN DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0) AND GETDATE()
        GROUP BY Clasificacion
    """

    return Response({
        "status": True,
        "data": get_query(str_sql=str_sql, params=(int_user,)),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_contado_con_saldo(request):
    int_user = get_user_db_login(request.user.id)

    str_sql = """
        SELECT 
            E.RazonSocial, F.tipodocumento, F.NoDocumento, C.CodigoCliente, C.Nombre, A.Saldo, 
            DATEDIFF(DD, F.fecha, GETDATE()) as DiasFactura
        FROM Inventario..facturas F
        JOIN CuentaCorrientE..auxiliarcxc A ON F.NoFactura = A.NoPoliza
        JOIN Inventario..Empresas E ON E.NoEmpresa = F.NoEmpresa
        JOIN Inventario..Clientes C ON F.NoCliente = C.NoCliente
        WHERE A.Saldo > 0
        AND C.diascredito BETWEEN 0 AND  3
        AND F.NoVendedor = %s
    """

    return Response({
        "status": True,
        "data": get_query(str_sql=str_sql, params=(int_user,)),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_registro_visitas(request):
    int_user = get_user_db_login(request.user.id)

    if int_user == 39:
        str_sql = """
            SELECT
                c.id, cl.Nombre, s.direccion, c.fecha_visita
            FROM ares..citas c
            JOIN Inventario..Sucursales s ON  c.nocliente = s.NoSucursal
            JOIN Inventario..Clientes cl ON s.NoCliente = cl.NoCliente
            WHERE c.user_id = 39
            AND c.NoEstado = 1
            ORDER BY c.created_At DESC
        """

    else:
        str_sql = """
            SELECT 
                C.id, CLI.Nombre, CLI.direccion, C.fecha_visita 
            FROM ares..citas C
            JOIN Inventario..clientes CLI ON C.nocliente = CLI.nocliente
            WHERE C.noestado = 1
            AND C.user_id = %s
            UNION ALL
            SELECT 
                C.id, CLI.Nombre, CLI.direccion, C.fecha_visita 
            FROM ares..citas C
            JOIN ares..clientes_prospectos CLI ON C.nocliente = CLI.id
            WHERE C.noestado = 1
            AND C.user_id = %s
        """

    return Response({
        "status": True,
        "data": get_query(str_sql=str_sql, params=(int_user, int_user)),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_save_cita(request):
    int_cita = request.POST.get('cita_id')
    str_motivo = request.POST.get('motivo')
    latitude = request.POST.get('latitude')
    longitude = request.POST.get('longitude')
    str_sql = """
        INSERT INTO ares..Registro_Citas (cita_id, latitude, longitude, created_at, updated_at) 
        VALUES
        (%s, %s, %s, GETDATE(), GETDATE())
    """

    if not insert_query(sql=str_sql, params=(int_cita, latitude, longitude)):
        return Response({
            "status": False,
        })

    str_sql = """
        UPDATE ares..citas SET NoEstado = 2, motivo = %s, updated_at = GETDATE() WHERE id = %s
    """
    if not execute_query(sql=str_sql, params=(sqlescape(str_motivo.lower()), int_cita)):
        return Response({
            "status": False,
        })

    return Response({
        "status": True,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_citas_vendedor(request):
    int_user = get_user_db_login(request.user.id)

    str_sql = """
        SELECT
            c.id, cli.nombre as text, 1 AS employeeID, c.fecha_visita AS startDate, c.created_at AS endDate
        FROM ares..citas c
        JOIN Inventario..clientes cli ON c.nocliente = cli.nocliente
        WHERE c.user_id = %s
        AND c.id NOT IN (SELECT cita_id FROM ares..registro_citas)
        UNION ALL
        SELECT
            c.id, cli.nombre AS text, 1 AS employeeID, c.fecha_visita AS startDate, c.created_at AS endDate
        FROM ares..citas c
        JOIN ares..clientes_prospectos cli ON c.nocliente= cli.id
        WHERE c.user_id = %s
        AND c.id NOT IN (SELECT cita_id FROM ares..registro_citas)
    """

    if int_user == 39:
        str_sql_clientes = """
            SELECT S.nosucursal AS id, C.CodigoCliente + '|' + S.direccion AS text
            FROM inventario..Clientes C 
            JOIN inventario..Sucursales S ON c.NoCliente = S.NoCliente
            WHERE C.nocliente =  110641
        """
    else:
        str_sql_clientes = """
            SELECT nocliente AS id, CodigoCliente + '|' + nombre AS nombre
            FROM inventario..clientes
            WHERE NoVendedor = %s
            AND activo = 1
            UNION ALL 
            SELECT id, nombre AS text
            FROM ares..clientes_prospectos
            WHERE NoVendedor =  %s        
        """

    return Response({
        "status": True,
        "data": get_query(str_sql=str_sql, params=(int_user, int_user)),
        "clientes": get_query(str_sql=str_sql_clientes, params=(int_user, int_user)),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_cita(request):
    int_user = get_user_db_login(request.user.id)
    int_cliente = request.POST.get('cliente')
    str_fecha = request.POST.get('fecha')

    str_sql = """
        INSERT INTO ares..citas (user_id, nocliente, fecha_visita, latitude, longitude, NoEstado, created_at)
        VALUES
        (%s, %s, %s, 3.12, 4.13, 1, GETDATE())
    """
    arr_id = insert_query(sql=str_sql, params=(int_user, int_cliente, str_fecha))
    if not arr_id:
        return Response({
            "status": False,
        })

    int_cita = arr_id['id']

    str_motivo = request.POST.get('motivo', '')
    latitude = request.POST.get('latitude')
    longitude = request.POST.get('longitude')

    if latitude and longitude:
        str_sql = """
            INSERT INTO ares..Registro_Citas (cita_id, latitude, longitude, created_at, updated_at) 
            VALUES
            (%s, %s, %s, GETDATE(), GETDATE())
        """

        if not insert_query(sql=str_sql, params=(int_cita, latitude, longitude)):
            return Response({
                "status": False,
            })

        str_sql = """
            UPDATE ares..citas SET NoEstado = 2, motivo = %s, updated_at = GETDATE() WHERE id = %s
        """
        if not execute_query(sql=str_sql, params=(sqlescape(str_motivo.lower()), int_cita)):
            return Response({
                "status": False,
            })

    return Response({
        "status": True,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_cita(request):
    int_cita = request.POST.get('cita')

    return Response({
        "status": execute_query(sql="DELETE FROM ares..citas WHERE id = %s", params=(int_cita,)),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_devoluciones(request):
    int_user = get_user_db_login(request.user.id)
    return Response({
        "status": True,
        "data": get_query(str_sql="EXEC inventario..CotizacionesDevoluciones %s", params=(int_user,)),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_semanas(request):
    int_user = get_user_db_login(request.user.id)
    return Response({
        "status": True,
        "data": get_query(str_sql="EXEC Inventario..ventas_cuatro_semanas_por_vendedor %s", params=(int_user,)),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_no_empleado_boletas(request):
    str_sql = """
    SELECT U.name,
           U.email,
           U.empleado_id,
           EB.no_empresa,
           EB.no_empleado,
           EB.base_id,
           B.sql_name,
           B.name AS base
    FROM NOVA..auth_user U
             INNER JOIN ares..empleados_base EB ON EB.empleado_id = U.empleado_id
             INNER JOIN ares..databases B ON B.id = base_id
    WHERE EB.fecha_baja IS NULL
      AND U.id = %s
      AND EB.no_empresa <> 0
      AND EB.base_id IN (46, 50, 51, 53)
    """

    arr_datos = []
    arr_empleado = get_query(str_sql=str_sql, params=(request.user.id,))
    for empleado in arr_empleado:
        arr_empresa = get_query(
            str_sql="SELECT Razon_Social FROM " + empleado['sql_name'] + "..empresas WHERE No_Empresa = %s",
            params=(empleado['no_empresa'],))
        arr_datos.append({
            "base_id": empleado['base_id'],
            "base": empleado['base'],
            "empleado": empleado['name'],
            "no_empleado": empleado['no_empleado'],
            "empresa": arr_empresa[0]['Razon_Social'],
            "no_empresa": empleado['no_empresa'],
            "sql_name": empleado['sql_name'],
        })

    return Response({
        "status": True,
        "data": arr_datos,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_periodos(request):
    str_base = request.POST.get('base')
    str_no_empresa = request.POST.get('no_empresa')
    str_no_empleado = request.POST.get('no_empleado')
    str_sql = f"""
        SELECT TOP 28 P.Tipo_Periodo,
              P.No_Periodo,
              CONCAT(FORMAT(P.Fecha_Inicial, 'dd/MM/yyyy'), ' - ', FORMAT(P.Fecha_Final, 'dd/MM/yyyy')) AS Fecha
            FROM {str_base}..periodos P
            WHERE P.No_Empresa = %s
              AND P.Tipo_Periodo in ('Q', 'M', 'A', 'B', 'E')
              AND P.Fecha_Cerro is not null
              AND P.Fecha_Inicial >= '2020-01-01'
            ORDER BY P.Fecha_Final DESC
        """

    arr_datos = get_query(str_sql=str_sql, params=(str_no_empresa,))

    arr_periodos = []
    for datos in arr_datos:
        str_sql_boletas = """
            SELECT recibo_pdf
            FROM ares..boletas_firmadas
            WHERE no_empleado = %s
              AND no_periodo = %s
              AND no_empresa = %s
        """
        arr_recibo = get_query(str_sql=str_sql_boletas, params=(str_no_empleado, datos['No_Periodo'], str_no_empresa))

        arr_periodos.append({
            "recibo": arr_recibo[0]['recibo_pdf'] if arr_recibo else None,
            "No_Periodo": datos['No_Periodo'],
            "Fecha": datos['Fecha'],
            "Tipo_Periodo": datos['Tipo_Periodo'],
        })

    return Response({
        "status": True,
        "data": arr_periodos
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_boleta(request):
    str_base = request.POST.get('base')
    str_no_empleado = request.POST.get('no_empleado')
    str_no_empresa = request.POST.get('no_empresa')
    str_periodo = request.POST.get('periodo')
    str_sql = f"EXEC {str_base}..datosboletas %s, %s"

    arr_datos = get_query(str_sql=str_sql, params=(str_no_empleado, str_periodo))

    if arr_datos:
        total_ingresos = 0
        total_egresos = 0
        str_sql_boletas = """
            SELECT recibo_pdf
            FROM ares..boletas_firmadas
            WHERE no_empleado = %s
              AND no_periodo = %s
              AND no_empresa = %s
        """
        arr_recibo = get_query(str_sql=str_sql_boletas, params=(str_no_empleado, str_periodo, str_no_empresa))
        str_path = ""

        if arr_recibo:
            str_path = f"https://nova.ffinter.com/media{arr_recibo[0]['recibo_pdf']}"

        for datos in arr_datos:
            if datos['tipo'] == "Ingreso":
                total_ingresos += datos['valor']
            if datos['tipo'] == "Descuento":
                total_egresos += datos['valor']

        str_sql_recibo = """
            SELECT NoBoleta
            FROM NominaGB..vw_empleados_no_boleta
            WHERE no_empleado = %s
              AND no_periodo = %s
              AND no_empresa = %s
        """
        arr_no_boleta = get_query(str_sql=str_sql_recibo, params=(str_no_empleado, str_periodo, str_no_empresa))

        str_no_boleta = arr_no_boleta[0]["NoBoleta"] if arr_no_boleta else None

        return Response({
            "status": True,
            "data": {
                "result": arr_datos,
                "image": str_path if arr_recibo else None,
                "totalIngresos": total_ingresos,
                "totalEgresos": total_egresos,
                "totalLiquido": (total_ingresos - total_egresos),
                "no_boleta": str_no_boleta,
            }
        })
    else:
        return Response({
            "status": False,
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_firma(request):
    str_id_base = request.POST.get('id_base')
    str_no_empleado = request.POST.get('no_empleado')
    str_no_empresa = request.POST.get('no_empresa')
    str_no_periodo = request.POST.get('no_periodo')
    file = request.POST.get('image')
    is_app = request.POST.get('app')

    if file:
        try:
            if not is_app:
                str_format, str_img = file.split(';base64,')
                ext = str_format.split('/')[-1]
            else:
                str_img = file
                ext = "png"

            filename = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10)) + '.' + ext
            file_path = os.path.join('rrhh', 'recibos', filename)

            with open(os.path.join(settings.MEDIA_ROOT, file_path), 'wb') as f:
                f.write(base64.b64decode(str_img))

            str_sql_boletas = """
                INSERT INTO ares..boletas_firmadas 
                (no_empleado, no_periodo, id_base, no_empresa, recibo_pdf, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, GETDATE(), GETDATE())
            """
            insert_query(sql=str_sql_boletas,
                         params=(str_no_empleado, str_no_periodo, str_id_base, str_no_empresa, '/' + file_path))
            data = {
                "status": True,
                "image": f"https://nova.ffinter.com/media/{file_path}"
            }

            return Response(data)
        except Exception as e:
            data = {
                "status": False,
                "msg": str(e)
            }
            return Response(data)

    else:
        data = {
            "status": False,
            "msg": "No envio ninguna firma."
        }
        return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_orden_pedidos_sin_entregar(request):
    str_sql = """
        SELECT OT.NoOTransporte,
               U.name,
               EB.no_empleado,
               OT.Fecha,
               OT.Observaciones,
               E.Estado
        FROM NOVA..auth_user U
                 INNER JOIN ares..empleados_master EM ON EM.id = U.empleado_id
                 INNER JOIN ares..empleados_base EB ON EB.empleado_id = EM.id AND base_id = 46
                 INNER JOIN Transporte..Pilotos P ON P.NoEmpleado = EB.no_empleado
                 INNER JOIN Transporte..OTransporte OT ON OT.NoPiloto = P.NoEmpleado
                 INNER JOIN Transporte..Estados E ON E.NoEstado = OT.NoEstado
        WHERE EB.fecha_baja IS NULL
          AND U.active = 1
          AND U.is_active = 1
          AND U.id = %s
          AND OT.liquidado = 0
          AND OT.NoEstado NOT IN (3)
    """
    return Response({
        "status": True,
        "data": get_query(str_sql=str_sql, params=(request.user.id,)),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_detalles_pedidos_sin_entregar(request):
    int_no_transporte = request.POST.get('NoOTransporte')
    str_sql = """
        SELECT C.NoCotizacion,
               C.NoDocumento AS Pedido,
               F.NoFactura,
               F.Serie,
               F.NoDocumento,
               CL.nombre,
               CL.Nit,
               C.observaciones,
               CL.Direccion,
               LO.estado,
               C.NoCliente,
               U.latitud,
               U.longitud,
               C.DireccionEntrega,
               OT.NoOTransporte
        FROM Transporte..OTransporte OT
                 INNER JOIN Transporte..OTransportePedidos OTP ON OTP.NoOTransporte = OT.NoOTransporte
                 INNER JOIN Inventario..Cotizaciones C ON C.NoCotizacion = OTP.NoPedido
                 INNER JOIN Inventario..Facturas F ON F.NoFactura = C.NoFactura
                 INNER JOIN Inventario..Clientes CL ON CL.NoCliente = C.NoCliente
                 LEFT JOIN Inventario..Sucursales S ON S.NoCliente = CL.NoCliente AND S.Direccion = C.DireccionEntrega
                 LEFT JOIN NOVA..auditoria_cliente_ubicacion U
                           ON U.nocliente = C.NoCliente AND (U.nosucursal IS NULL OR U.nosucursal = S.Nosucursal)
                 LEFT JOIN ares..location_orders LO
                           ON OTP.NoOTransporte = LO.orden_transporte AND CL.NoCliente = LO.no_cliente AND
                              LO.no_documento = F.NoDocumento
        WHERE OTP.NoOTransporte = %s
          AND LO.out_at IS NULL
    """
    return Response({
        "status": True,
        "data": get_query(str_sql=str_sql, params=(int_no_transporte,)),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_geo(request):
    int_no_transporte = request.POST.get('idNoOrder')
    int_documento = request.POST.get('idDocumento')
    int_cliente = request.POST.get('idCliente')
    int_latitude = request.POST.get('latitude')
    int_longitude = request.POST.get('longitude')
    int_estado = request.POST.get('estado')
    str_sql = """
        INSERT INTO ares..location_orders 
        (orden_transporte, no_documento, no_cliente, user_id, latitude, longitude, estado, created_at, updated_at)
        VALUES
        (%s, %s, %s, %s, %s, %s, %s, GETDATE(), GETDATE())
    """
    return Response({
        "status": True,
        "data": execute_query(sql=str_sql, params=(
            int_no_transporte, int_documento, int_cliente, request.user.id, int_latitude, int_longitude, int_estado)),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_out(request):
    # //enviar correo al vendedor
    int_no_transporte = request.POST.get('idNoOrder')
    int_documento = request.POST.get('idDocumento')
    str_sql = """
        UPDATE ares..location_orders
        SET out_at = GETDATE(),
            updated_at = GETDATE()
        WHERE orden_transporte = %s
          AND no_documento = %s
    """
    return Response({
        "status": True,
        "data": execute_query(sql=str_sql, params=(int_no_transporte, int_documento)),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_meses_vendedores(request):
    list_datos = get_query(str_sql="exec inventario..sp_ventas3mesesVendedores %s",
                           params=(get_user_db_login(request.user.id),))

    datos_agrupados = {}
    for dato in list_datos:
        list_padre = {}
        list_hijos = {}
        for key in dato.keys():
            if "Vendedor" != key:
                if "nombreproducto" != key and "nombrecliente" != key:
                    list_padre[key] = 0
                    list_hijos[key] = 0

                if "nombrecliente" == key:
                    list_padre[key] = dato["nombrecliente"]

                if "nombreproducto" == key:
                    list_hijos[key] = ""

        str_nombre = dato["nombrecliente"]
        if str_nombre not in datos_agrupados:
            datos_agrupados[str_nombre] = list_padre
            datos_agrupados[str_nombre]["productos"] = []

        for key in dato.keys():
            if "Vendedor" != key and "nombrecliente" != key:
                list_hijos[key] = dato[key]
                if "nombreproducto" != key:
                    datos_agrupados[str_nombre][key] += dato[key]

        datos_agrupados[str_nombre]["productos"].append(list_hijos)

    return Response({
        "status": True,
        "data": datos_agrupados,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_auditoria_clientes(request):
    search = request.POST.get('search', '')
    str_nombre = str(search).replace(" ", "%")
    sql = """
        SELECT C.NoCliente, CONCAT(C.NIT, ' | ', C.Nombre) AS NombreCompleto, C.NIT
        FROM Inventario..Clientes C
        WHERE (C.Nombre LIKE %s OR C.NIT LIKE %s)
        AND C.Activo = 1
        ORDER BY C.Nombre
    """
    nombre_escapado = '%' + sqlescape(str_nombre) + '%'
    params = (nombre_escapado, nombre_escapado)
    obj_cliente = get_query(str_sql=sql, params=params)
    data = []

    for cliente in obj_cliente:
        data.append({
            "id": cliente["NoCliente"],
            "nombre": cliente["NombreCompleto"],
            "nit": cliente["NIT"],
        })

    return Response({
        "status": True,
        "data": data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_auditoria_info_cliente(request):
    str_cliente = request.POST.get('cliente', '')
    str_nit = request.POST.get('nit', '')
    params = (sqlescape(str_cliente),)
    arr_info = get_query(str_sql="EXEC ares..PedidosMovilesDatosCliente %s", params=params)
    arr_sucursales = get_query(str_sql="SELECT NoSucursal, Direccion FROM Inventario..sucursales "
                                       "WHERE NoCliente = %s AND Activo = 1", params=params)
    arr_cliente_sat = get_datos_nit(str_nit)

    return Response({
        "status": True,
        "info_cliente": arr_info,
        "sucursales": arr_sucursales,
        "info_sat": arr_cliente_sat,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_auditoria_verificacion(request):
    documentos = json.loads(request.POST.get('documentos', '[]'))

    no_cliente = request.POST.get('cliente')
    observacion = request.POST.get('observacion')

    verificacion = Verificacion_cliente.objects.create(
        user_id=request.user.id,
        nocliente=no_cliente,
        observacion=observacion,
    )

    for documentos in documentos:
        fecha_str = documentos['Fecha']
        fecha_obj = datetime.strptime(fecha_str, '%d/%m/%Y').strftime('%Y-%m-%d')

        Verificacion_detalle.objects.create(
            verificacion_id=verificacion.id,
            tipodoc=documentos['TipoDoc'],
            nodocumento=documentos['nodocumento'],
            serie=documentos['serie'],
            confirmado=documentos['confirmado'],
            fecha=fecha_obj,
        )

    return Response({
        "status": True,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_auditoria_historial(request):
    fecha_inicio = request.POST.get('fecha_inicio')
    fecha_fin = request.POST.get('fecha_fin')

    str_sql = """
        SELECT V.id,
               C.nombre,
               CAST(V.created_at AS DATE) AS fecha,
               V.observacion
        FROM NOVA..auditoria_verificacion_cliente V
                INNER JOIN Inventario..Clientes C ON C.NoCliente = V.nocliente
        WHERE V.created_at BETWEEN %s AND %s
    """
    params = (fecha_inicio, fecha_fin)
    verificacion = get_query(str_sql=str_sql, params=params)

    verificacion_ids = [item['id'] for item in verificacion]
    detalle = Verificacion_detalle.objects.filter(verificacion_id__in=verificacion_ids)

    detalle_list = serializers.serialize('python', detalle)

    detalle_data = [{'pk': item['pk'], **item['fields']} for item in detalle_list]

    return Response({
        "status": True,
        "verificacion": verificacion,
        "detalle": detalle_data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_ventas_historial_citas(request):
    fecha_inicio = request.POST.get('fecha_inicio')
    fecha_fin = request.POST.get('fecha_fin')
    int_user = get_user_db_login(request.user.id)

    str_sql = """
        SELECT C.fecha_visita AS fecha_planeada, RC.created_at AS fecha_real, CLI.nombre AS cliente, C.motivo
        FROM ares..citas C
                 INNER JOIN ares..registro_citas RC ON RC.cita_id = C.id
                 INNER JOIN Inventario..clientes CLI ON C.nocliente = CLI.nocliente
        WHERE C.NoEstado = 2
          AND C.fecha_visita BETWEEN %s AND %s
          AND C.user_id = %s
    """

    return Response({
        "status": True,
        "visitas": get_query(str_sql=str_sql, params=(fecha_inicio, fecha_fin, int_user)),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_clientes_prospecto(request):
    int_user = get_user_db_login(request.user.id)

    try:
        ClientesProspectos.objects.create(
            nombre=request.POST.get("nombre", ""),
            direccion=request.POST.get("direccion", ""),
            cantidad=request.POST.get("cantidad", 0),
            noestado=request.POST.get("estado", 0),
            novendedor=int_user,
        )

        return Response({
            "status": True,
        })

    except Exception as E:
        return Response({
            "status": False,
            "error": str(E)
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_vales(request):
    try:
        now = datetime.now()
        user = f"{request.user.id}"

        year = f"{now.year}"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )

        qr.add_data(f'https://nova.ffinter.com/rrhh/vales/qr_validar/params/user___{user}|year___{year}')
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        str_img = f"media/rrhh/qr/vales/user_{user}_{year}.png"
        str_path = f"https://nova.ffinter.com/media/rrhh/qr/vales/user_{user}_{year}.png"

        try:
            img.save(str_img)
        except ValueError:
            pass

        vales = Vales.objects.filter(user__id=user, year=year)

        data = {
            "image": str_path,
            "vales": vales.values()[0] if vales else None
        }

        return Response({
            "status": True,
            "data": data
        })

    except ValueError:
        return Response({
            "status": False,
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_dashboard_presupuesto(request):
    try:
        int_mes = request.POST.get('mes')

        if int_mes:
            int_novendedor = get_user_db_login(request.user.id)
            return Response({
                "status": True,
                "data": get_query(str_sql="EXEC [Inventario]..[sp_indicador_familia_mes_pronostico] %s, %s",
                                  params=(int_mes, int_novendedor))
            })
        else:
            return Response({
                "status": False,
                "msg": 'Error al recibir los parametros',
                "msj": 'Error al recibir los parametros',
            })

    except Exception as E:
        return Response({
            "status": False,
            "msg": str(E),
            "msj": str(E),
        })
