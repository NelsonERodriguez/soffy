import datetime
from decimal import Decimal
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.core.mail import EmailMessage
from core.functions import get_query, MESES
from ventas.models import Planeacion_demanda, Planeacion_demanda_detalle
from datetime import date
from nova.debug import IMAGEN_GB


@login_required(login_url="/login/")
def index(request):
    arr_planeacion_tabla = []

    str_sql = """
    SELECT
        D.cantidad,
        D.NoProducto,
        D.descripcion,
        PR.Descripcion AS producto
    FROM
        NOVA..ventas_planeacion_demanda P
    INNER JOIN NOVA..ventas_planeacion_demanda_detalle D ON D.planeacion_id = P.id
    INNER JOIN Inventario..Productos PR ON PR.NoProducto = D.noproducto
    WHERE
        P.cerrado = 0
    """
    arr_detalles = get_query(str_sql=str_sql)

    str_sql = """
        exec NOVA..sp_compras_planeacion_demanda_clq;
    """
    obj_data = get_query(str_sql=str_sql)

    arr_planeacion_sku = {}
    arr_planeacion_tabla = {}
    total_prev_month = 0
    total_month = 0
    total_gt = 0
    total_embarqued = 0

    for row in obj_data:
        if row["NoProducto"] not in arr_planeacion_sku:
            arr_planeacion_sku[row["NoProducto"]] = {
                "NoProducto": row['NoProducto'],
                "CodigoProducto": row['CodigoProducto'],
                "Descripcion": row['Descripcion'],
                "tipo": row['Tipo'],
                "Nivel1": row['Nivel1'],
                "Nivel2": row['Nivel2'],
                "Nivel3": row['NoProducto'],
                # "Libras_Mes_1": row['Libras_Mes_1'],
                "Libras_Mes_1": 0,
                # "Libras_Mes_A": row['Libras_Mes_A'],
                "Libras_Mes_A": 0,
                # "Dias_Ventas": planeacion_tmp['Dias_Ventas'],
                "Dias_Ventas": 0,
                # "Total_Venta_4_Meses": planeacion_tmp['Total_Venta_4_Meses'],
                "Total_Venta_4_Meses": 0,
                # "Promedio_Venta": planeacion_tmp['Promedio_Venta'],
                "Promedio_Venta": 0,
                # "Existencia": planeacion_tmp['Existencia'],
                "Existencia": 0,
                # "Costo_Unitario": planeacion_tmp['Costo_Unitario'],
                "Costo_Unitario": 0,
                # "Dias_Inventario": planeacion_tmp['Dias_Inventario'],
                "Dias_Inventario": 0,
                # "Inventario_Transito": planeacion_tmp['Inventario_Transito'],
                "Inventario_Transito": 0,
                # "Fecha_Arribo": planeacion_tmp['Fecha_Arribo'],
                "Fecha_Arribo": '',
                # "Fecha_Quiebre": planeacion_tmp['Fecha_Quiebre'],
                "Fecha_Quiebre": '',

                # "Promedio_Dias": promedio_dias,
                "Promedio_Dias": 0,
            }

        if row["NoProducto"] not in arr_planeacion_tabla:
            arr_planeacion_tabla[row["NoProducto"]] = {
                "CodigoProducto": format(row['CodigoProducto']),
                "Descripcion": format(row['Descripcion']),
                "Libras_Mes_1": 0,
                "Libras_Mes_A": 0,
                "Existencia": 0,
                "Inventario_Transito": 0,
                "Fecha_Arribo": '',
            }

        total_prev_month += Decimal(row['Libras_Mes_1'])
        total_month += Decimal(row['Libras_Mes_A'])
        total_gt += Decimal(row['Existencia'])
        total_embarqued += Decimal(row['cantidad'])
        arr_planeacion_sku[row["NoProducto"]]["Libras_Mes_1"] += row['Libras_Mes_1']
        arr_planeacion_sku[row["NoProducto"]]["Libras_Mes_A"] += row['Libras_Mes_A']
        arr_planeacion_sku[row["NoProducto"]]["Existencia"] += row['Existencia']
        if (arr_planeacion_sku[row["NoProducto"]]["Fecha_Arribo"] == '' and
                row['fechaarribo'] != datetime.date(1900, 1, 1)):
            arr_planeacion_sku[row["NoProducto"]]["Fecha_Arribo"] = row['fechaarribo']
        arr_planeacion_sku[row["NoProducto"]]["Inventario_Transito"] += row['cantidad']

        arr_planeacion_tabla[row["NoProducto"]]["Libras_Mes_1"] += row['Libras_Mes_1']
        arr_planeacion_tabla[row["NoProducto"]]["Libras_Mes_A"] += row['Libras_Mes_A']
        arr_planeacion_tabla[row["NoProducto"]]["Existencia"] += row['Existencia']
        if (arr_planeacion_tabla[row["NoProducto"]]["Fecha_Arribo"] == '' and
                row['fechaarribo'] != datetime.date(1900, 1, 1)):
            arr_planeacion_tabla[row["NoProducto"]]["Fecha_Arribo"] = row['fechaarribo']
        arr_planeacion_tabla[row["NoProducto"]]["Inventario_Transito"] += Decimal(row['cantidad'])

    month = date.today().month
    month_1 = (13 if month == 1 else month) - 1

    arr_info_excel = []
    for k in arr_planeacion_tabla:
        producto = arr_planeacion_tabla[k]
        arr_info_excel.append({
            "CodigoProducto": format(producto['CodigoProducto']),
            "Descripcion": format(producto['Descripcion']),
            "Libras_Mes_1": format(producto['Libras_Mes_1']),
            "Libras_Mes_A": format(producto['Libras_Mes_A']),
            "Existencia": format(producto['Existencia']),
            "Inventario_Transito": format(producto['Inventario_Transito']),
            "Fecha_Arribo": format(producto['Fecha_Arribo']),
        })

    data = {
        "planeacion_sku": arr_planeacion_sku,
        "info_excel": list(arr_info_excel),
        "detalles": arr_detalles,
        "month": MESES[month],
        "month_1": MESES[month_1],
        "total_prev_month": total_prev_month,
        "total_month": total_month,
        "total_gt": total_gt,
        "total_embarqued": total_embarqued
    }

    bool_json = request.POST.get('bool_json', '')
    if not bool_json or bool_json == '' or bool_json == False:
        return render(request, 'planeacion_demanda_cuadriles/planeacion_demanda_cuadriles.html', data)
    else:
        data['status'] = True
        return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_productos(request):
    str_busqueda = request.POST.get('busqueda')
    str_nivel3 = request.POST.get('nivel3')
    str_filter = (" AND C.Nivel3 = '%s' " % str_nivel3) if str_nivel3 and len(str_nivel3) > 1 else ''
    str_filter += " AND (P.Descripcion LIKE '%%%s%%' OR P.CodigoProducto LIKE '%%%s%%') " % (str_busqueda, str_busqueda)

    str_sql = """SELECT C.Nivel3, P.NoProducto, P.CodigoProducto,
            P.Descripcion
        FROM
            Inventario..ClasificacionesNP C
        INNER JOIN Inventario..Productos P ON P.NoProducto = C.NoProducto
        WHERE P.Habilitado = 1 %s
        ORDER BY
            C.Nivel3""" % str_filter

    data = {
        "status": True,
        "arr_productos": get_query(str_sql)
    }
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_inventario_transito_pedido(request):
    str_nivel3 = request.POST.get('nivel3', '')
    str_sql = """SELECT pa.*, p.CodigoProducto, o.date_ordered
                    FROM inventario..productosagua pa
                    JOIN inventario..productos p
                        ON pa.NoProducto = p.NoProducto
                    JOIN nova..importaciones_new_otif as o
                        ON pa.id = o.id
                WHERE pa.NoProducto = %s"""

    data = {
        "status": True,
        "arr_reporte": get_query(str_sql=str_sql, params=[str_nivel3])
    }
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_inventario_existencia(request):
    str_noproducto = request.POST.get('noproducto', '')

    str_sql = """
         SELECT
            P.NoProducto, P.CodigoProducto, P.Descripcion AS Producto, B.Descripcion AS bodega, 
            SUM(EL.Existencia) / 58000 AS Existencia    
        FROM
            Inventario..Lotes L 
        JOIN Inventario..ExistenciasLotes EL ON L.NoLote = EL.NoLote
        JOIN inventario..Productos P ON EL.NoProducto = P.NoProducto AND L.NoEmpresa = 1
        JOIN Inventario..bodegas B ON L.nobodega = B.nobodega
        JOIN inventario..Ubicaciones U ON L.noubicacion = U.NoUbicacion
        WHERE
            EL.existencia > 0
        AND B.NoBodega NOT IN (10)
        AND U.noubicacion NOT IN ('99')
        AND P.NoClasificacion like '07%%'
        AND P.NoProducto = '%s'
        GROUP BY
            P.noproducto, B.Descripcion , P.CodigoProducto, P.Descripcion    
    """ % str_noproducto

    data = {
        "status": True,
        "arr_inventario": get_query(str_sql)
    }

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def save_planeacion_detalle(request):
    int_noproducto = request.POST.get('noproducto')
    int_cantidad = request.POST.get('cantidad')
    str_descripcion = request.POST.get('descripcion')

    planeacion = Planeacion_demanda.objects.filter(cerrado=False).first()

    if not planeacion:
        planeacion = Planeacion_demanda.objects.create(
            user_id=request.user.id,
            cerrado=False
        )

    Planeacion_demanda_detalle.objects.create(
        planeacion_id=planeacion.id,
        noproducto=int_noproducto,
        cantidad=int_cantidad,
        descripcion=str_descripcion,
    )

    data = {
        "status": True,
    }

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def delete_planeacion_detalle(request):
    int_noproducto = request.POST.get('noproducto')

    planeacion = Planeacion_demanda.objects.filter(cerrado=False).first()

    if planeacion:
        detalle = Planeacion_demanda_detalle.objects.filter(noproducto=int_noproducto, planeacion_id=planeacion.id)
        detalle.delete()

    data = {
        "status": True,
    }

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def cerrar_planeacion(request):
    planeacion = Planeacion_demanda.objects.filter(cerrado=False).first()
    planeacion.cerrado = True
    planeacion.save()

    str_sql = """
        SELECT
            D.cantidad,
            PR.Descripcion AS producto,
            D.descripcion
        FROM
            NOVA..ventas_planeacion_demanda P
        INNER JOIN NOVA..ventas_planeacion_demanda_detalle D ON D.planeacion_id = P.id
        INNER JOIN Inventario..Productos PR ON PR.NoProducto = D.noproducto
        WHERE
            P.id = %s
    """ % planeacion.id
    arr_detalles = get_query(str_sql=str_sql)

    str_body = """
        <table style="width: 100%;">
            <thead>
                <tr>
                    <th style="text-align: center;">Producto</th>
                    <th style="text-align: center;">Observación</th>
                    <th style="text-align: center;">Cantidad</th>
                </tr>
            </thead>
            <tbody>
                """

    for detalle in arr_detalles:
        str_body += """
            <tr>
                <td style="text-align: left;">%s</td>
                <td style="text-align: left;">%s</td>
                <td style="text-align: right;">%s</td>
            </tr>
        """ % (detalle['producto'], detalle['descripcion'], "{:,.0f}".format(detalle['cantidad']))

    str_body += """
            </tbody>
        </table>
    """
    str_subject = "Planeación de la Demanda"

    str_html = """
        <table style="width: 100%%;">
            <tbody>
                <tr>
                    <td width="25%%">&nbsp;</td>
                    <td width="50%%">
                        <table style="width: 100%%; border: 1px solid #dddddd; border-radius: 3px;">
                            <tbody>
                                <tr>
                                    <td style="text-align: center; padding: 20px;">
                                        <img src="%s" 
                                        alt="No se puedo cargar la imagen" style="width: 100%%" width="100%%">
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background: #333333; color: white; text-align:center;">
                                        <h2>Planeación de la Demanda.</h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="text-align: center; padding: 20px;">
                                        %s
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                    <td width="35%%">&nbsp;</td>
                </tr>
            </tbody>
        </table>
    """ % (IMAGEN_GB, str_body)

    # arr_emails = ['olivio@grupobuena.com', 'jlemus@grupobuena.com', 'jrecendiz@grupobuena.com',
    #               'bcabrera@grupobuena.com']
    arr_emails = ['nrodriguez@grupobuena.com']
    msg = EmailMessage(str_subject, str_html, 'nova@grupobuena.com', arr_emails)
    msg.content_subtype = "html"
    msg.send()

    data = {
        "status": True,
    }

    return JsonResponse(data, safe=False)
