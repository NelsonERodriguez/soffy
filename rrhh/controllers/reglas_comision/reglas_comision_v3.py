from django.core.files.storage import FileSystemStorage
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.template.loader import render_to_string
from io import BytesIO

from core.functions import get_query, set_notification
from rrhh.models import Comision_Regla, Comision_Regla_Rangos, Comision_regla_respaldo_modificacion
from soffybiz.settings import ADJUNTOS_COMISIONES_REQUERIDO
import datetime
import xlwt


@login_required(login_url="/login/")
def index(request):
    return render(request, 'reglas_comision/reglas_comision_v3.html')


@login_required(login_url="/login/")
def get_reglas(request):
    str_class = request.POST.get("strClass", None)
    int_keys = request.POST.get("intKeyBuscar", None)
    str_habilitado = request.POST.get("strHabilitado", None)

    str_filter = ""

    if str_class == "cliente":
        str_filter = "WHERE a.no_cliente  = " + int_keys
    elif str_class == "producto":
        str_filter = ("WHERE a.no_cliente IS NULL AND a.no_producto IS NOT NULL AND a.tipo_producto IS NOT NULL"
                      " AND a.no_vendedor IS NULL")
        str_filter = "WHERE a.no_producto = " + int_keys
    elif str_class == "clase":
        str_filter = ("WHERE a.no_cliente IS NULL AND a.no_producto IS NULL AND a.tipo_producto IS NOT NULL"
                      " AND a.no_vendedor IS NULL")
    elif str_class == "vendedor":
        str_filter = "WHERE a.no_vendedor  = " + int_keys
    elif str_class == "general":
        str_filter = ("WHERE a.no_cliente IS NULL AND a.no_producto IS NULL AND a.tipo_producto IS NOT NULL"
                      " AND a.no_vendedor IS NULL")
    elif str_class == "clienteProducto":
        str_filter = ("WHERE a.no_cliente IS NOT NULL AND a.no_producto IS NOT NULL AND a.tipo_producto IS NOT NULL"
                      " AND a.no_vendedor IS NULL")
    elif str_class == "clienteVendedor":
        str_filter = ("WHERE a.no_cliente IS NOT NULL AND a.no_producto IS NULL AND a.tipo_producto IS NOT NULL"
                      " AND a.no_vendedor IS NOT NULL")
    elif str_class == "vendedorProducto":
        str_filter = ("WHERE a.no_cliente IS NULL AND a.no_producto IS NOT NULL AND a.tipo_producto IS NOT NULL"
                      " AND a.no_vendedor IS NOT NULL")
    elif str_class == "parametro":
        str_filter = ("WHERE a.tipo_producto IS NOT NULL AND ("
                      "(a.no_cliente IS NOT NULL AND a.no_producto IS NOT NULL) OR"
                      "(a.no_cliente IS NOT NULL AND a.no_vendedor IS NOT NULL) OR"
                      "(a.no_vendedor IS NOT NULL AND a.no_producto IS NOT NULL) OR"
                      "(a.no_vendedor IS NOT NULL AND a.no_cliente IS NOT NULL)"
                      ")")
        str_filter = ("WHERE a.no_cliente IS NOT NULL AND a.no_producto IS NOT NULL AND a.tipo_producto IS NOT NULL"
                      " AND a.no_vendedor IS NOT NULL")

    if str_habilitado == "1":
        str_filter += " AND a.activo = 1"
    elif str_habilitado == "0":
        str_filter += " AND a.activo = 0"

    str_query = """
        SELECT a.comision_base, a.comision_fuera_rango,
        CASE a.tipo_producto
            WHEN 'C' THEN
                'Cuadril'
            WHEN 'M' THEN
                'Mixto'
        END as 'TipoProducto',
        CASE a.es_porcentaje
            WHEN 1 THEN
                CONVERT(VARCHAR, a.comision_base) + ' %%'
            ELSE
                CONVERT(VARCHAR, a.comision_base)
        END AS 'comisionbase',
        CASE a.activo
            WHEN 1 THEN
                'Si'
            WHEN 0 THEN
                'No'
            ELSE
                'No'
        END as 'habilitado',
        ISNULL(b.CodigoCliente+' | '+b.NIT+' | '+b.Nombre, '') as 'cliente',
        ISNULL(c.Descripcion, '') as 'producto',
        ISNULL(CONVERT(VARCHAR,d.NoVendedor)+' | '+d.Nombre, '') as 'vendedor', a.id
        FROM NOVA..rrhh_comision_regla as a
        LEFT JOIN Inventario..Clientes as b ON b.NoCliente = a.no_cliente
        LEFT JOIN Inventario..Productos as c ON c.NoProducto = a.no_producto
        LEFT JOIN Inventario..Vendedores as d ON d.NoVendedor = a.no_vendedor
        %s
    """ % str_filter

    obj_reglas = get_query(str_query)

    obj_json = {
        "status": True,
        "data": obj_reglas,
        "msj": ""
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def edit(request):
    pk = request.POST.get("intIdRegla")
    int_pk = int(pk)
    str_texto_titulo = "Crear" if int_pk == 0 else "Editar"

    str_class = request.POST.get("strClass", None)

    bool_show_cliente = False
    bool_show_vendedor = False
    bool_tipo_producto = False
    bool_producto = False
    bool_show_titulo = True

    if str_class == "cliente":
        bool_show_vendedor = True
        bool_tipo_producto = True
        bool_producto = True
    elif str_class == "producto":
        bool_show_cliente = True
        bool_show_vendedor = True
    elif str_class == "vendedor":
        bool_show_cliente = True
        bool_tipo_producto = True
        bool_producto = True
    elif str_class == "general":
        bool_tipo_producto = True
        bool_show_titulo = False

    # int_id = str(int(pk))
    str_query = """
    SELECT a.comision_base, a.comision_fuera_rango, a.tipo_producto, a.es_porcentaje,
    ISNULL(b.CodigoCliente+' | '+b.NIT+' | '+b.Nombre, '') as 'cliente',
    ISNULL(CONVERT(VARCHAR,d.NoVendedor)+' | '+d.Nombre, '') as 'vendedor',
    ISNULL(CONVERT(VARCHAR,c.CodigoProducto)+' | '+c.Descripcion, '') as 'producto',
    ISNULL(a.no_cliente, '') as 'no_cliente',
    ISNULL(a.no_vendedor, '') as 'no_vendedor',
    ISNULL(a.no_producto, '') as 'no_producto',
    a.id, a.activo, a.descuento_precio, a.archivo_respaldo,
    FORMAT(a.fecha_inicio,'yyyy-MM-dd') as fecha_inicio,
    FORMAT(a.fecha_fin,'yyyy-MM-dd') as fecha_fin
    FROM NOVA..rrhh_comision_regla as a
    LEFT JOIN Inventario..Clientes as b ON b.NoCliente = a.no_cliente
    LEFT JOIN Inventario..Productos as c ON c.NoProducto = a.no_producto
    LEFT JOIN Inventario..Vendedores as d ON d.NoVendedor = a.no_vendedor
    WHERE a.id = %s
    """ % pk

    rangos = Comision_Regla_Rangos.objects.filter(regla=pk, activo=1)

    obj_data = get_query(str_query)
    int_cliente = obj_data[0]["no_cliente"] if obj_data and obj_data[0]["no_cliente"] else ''
    # print(int_cliente)

    date = datetime.datetime.now()
    fecha_inicio_default = (date.strftime('%Y-%m-%d') if pk == "0" else '')

    str_vendedor = obj_data[0]["vendedor"] if obj_data else ''
    str_no_vendedor = obj_data[0]["no_vendedor"] if obj_data and obj_data[0]["no_vendedor"] else ''

    str_valor_input = request.POST.get("strValorInputHidden", None)
    if str_class == "cliente" and str_valor_input:
        str_sql = """
                SELECT v.NoVendedor, CONVERT(VARCHAR,v.NoVendedor)+' | '+v.Nombre as NombreVendedor
                FROM Inventario..Clientes as c
                LEFT JOIN Inventario..Vendedores as v
                ON v.NoVendedor = c.NoVendedor
                WHERE c.NoCliente = '%s'
                ORDER BY c.CodigoCliente
            """ % str_valor_input
        obj_cliente_vendedor = get_query(str_sql)

        if obj_cliente_vendedor and pk == "0":
            str_vendedor = obj_cliente_vendedor[0]["NombreVendedor"]
            str_no_vendedor = obj_cliente_vendedor[0]["NoVendedor"]

    data = {
        "class": str_class,
        "reglas": obj_data,
        "texto_titulo": str_texto_titulo,
        "id": pk,

        "bool_show_cliente": bool_show_cliente,
        "bool_show_vendedor": bool_show_vendedor,
        "bool_tipo_producto": bool_tipo_producto,
        "bool_producto": bool_producto,
        "bool_show_titulo": bool_show_titulo,

        "comision_base": obj_data[0]["comision_base"] if obj_data else '',
        "comision_fuera_rango": obj_data[0]["comision_fuera_rango"] if obj_data else (0 if pk == "0" else ''),
        "tipo_producto": obj_data[0]["tipo_producto"] if obj_data else '',
        "cliente": obj_data[0]["cliente"] if obj_data else '',
        "producto": obj_data[0]["producto"] if obj_data else '',
        "vendedor": str_vendedor,
        "no_cliente": obj_data[0]["no_cliente"] if obj_data and obj_data[0]["no_cliente"] else '',
        "no_producto": obj_data[0]["no_producto"] if obj_data and obj_data[0]["no_producto"] else '',
        "no_vendedor": str_no_vendedor,
        "descuento_precio": obj_data[0]["descuento_precio"] if obj_data else '',
        "activo_si": "checked" if (obj_data and obj_data[0]["activo"] == True) or len(obj_data) == 0 else '',
        "activo_no": "checked" if obj_data and obj_data[0]["activo"] == False else '',

        "fecha_inicio": obj_data[0]["fecha_inicio"] if obj_data and obj_data[0]["fecha_inicio"]
        else fecha_inicio_default,
        "fecha_fin": obj_data[0]["fecha_fin"] if obj_data and obj_data[0]["fecha_fin"] else '',

        "es_porcentaje_si": "checked" if (len(obj_data) > 0 and obj_data[0]["es_porcentaje"] == True) or len(
            obj_data) == 0 else '',
        "es_porcentaje_no": "checked" if obj_data and obj_data[0]["es_porcentaje"] == False else '',

        "sel_cuadril": 'selected' if obj_data and obj_data[0]["tipo_producto"] == 'C' else '',
        "sel_mixto": 'selected' if obj_data and obj_data[0]["tipo_producto"] == 'M' else '',

        "archivo_respaldo": obj_data[0]["archivo_respaldo"] if obj_data and obj_data[0]["archivo_respaldo"] else None,

        "rangos": rangos,

        "bool_adjuntos_requeridos": ADJUNTOS_COMISIONES_REQUERIDO,
    }

    # return render(request, 'reglas_comision/reglas_comision_edit.html', data)

    html = render_to_string('reglas_comision/reglas_comision_edit_v3.html', data)
    return HttpResponse(html)


@login_required(login_url="/login/")
def save(request):
    str_pk = request.POST.get("intIdRegla")
    pk = int(str_pk)

    obj_regla = Comision_Regla.objects.filter(id=pk).first()

    no_cliente = request.POST.get("nocliente", None) if len(request.POST.get("nocliente")) > 0 else None
    no_cliente = request.POST.get("nocliente", None) if len(request.POST.get("nocliente")) > 0 else None
    no_vendedor = request.POST.get("novendedor", None) if len(request.POST.get("novendedor")) > 0 else None
    tipo_producto = request.POST.get("tipoProducto", None) if len(request.POST.get("tipoProducto")) > 0 else None
    no_producto = request.POST.get("noproducto", None) if len(request.POST.get("noproducto")) > 0 else None
    comision_base = request.POST.get("comision_base", None) if len(request.POST.get("comision_base")) > 0 else None
    comision_fuera_rango = request.POST.get("comision_fuera_rango", None) if len(
        request.POST.get("comision_fuera_rango")) > 0 else None
    es_porcentaje = request.POST.get("es_porcentaje", None) if len(request.POST.get("es_porcentaje")) > 0 else None
    activo = request.POST.get("activo", None) if len(request.POST.get("activo")) > 0 else None
    activo = True if activo == '1' else False
    fecha_inicio = request.POST.get("fecha_inicio", None) if len(request.POST.get("fecha_inicio")) > 0 else None
    fecha_fin = request.POST.get("fecha_fin", None) if len(request.POST.get("fecha_fin")) > 0 else None
    descuento_precio = request.POST.get("descuento_precio", None) if len(
        request.POST.get("descuento_precio")) > 0 else None
    fil_archivo = request.FILES.get("filInputFile")

    path_file = None
    if fil_archivo:
        url = 'media/respaldo_regla/'
        fs = FileSystemStorage(location=url)
        file = fs.save(fil_archivo.name, fil_archivo)
        path_file = url + file

    if obj_regla:
        obj_regla.no_cliente = no_cliente
        obj_regla.no_vendedor = no_vendedor
        obj_regla.tipo_producto = tipo_producto
        obj_regla.no_producto = no_producto
        obj_regla.comision_base = comision_base
        obj_regla.comision_fuera_rango = comision_fuera_rango
        obj_regla.es_porcentaje = es_porcentaje
        obj_regla.activo = activo
        obj_regla.descuento_precio = descuento_precio
        obj_regla.fecha_inicio = fecha_inicio
        obj_regla.fecha_fin = fecha_fin
        if fil_archivo:
            obj_regla.archivo_respaldo = path_file

        obj_regla.save()
    else:
        path_file_pivote = None
        if fil_archivo:
            path_file_pivote = path_file

        obj_regla = Comision_Regla.objects.create(
            no_cliente=no_cliente,
            no_vendedor=no_vendedor,
            tipo_producto=tipo_producto,
            no_producto=no_producto,
            comision_base=comision_base,
            comision_fuera_rango=comision_fuera_rango,
            es_porcentaje=es_porcentaje,
            activo=activo,
            descuento_precio=descuento_precio,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
        )

    if fil_archivo:
        Comision_regla_respaldo_modificacion.objects.create(
            comision_regla_id=obj_regla.id,
            archivo_respaldo=path_file,
        )

    for key in request.POST:
        obj_key = key.split("_")
        if obj_key[0] == "id" and obj_key[1] == "rango" \
                and obj_key[2] == "detalle" and obj_key[3] is not None:

            value = request.POST.get(key)

            obj_regla_rango = Comision_Regla_Rangos.objects.filter(id=int(value)).first()

            inicio_rango_dias = request.POST.get("inicio_rango_dias_" + obj_key[3])
            fin_rango_dias = request.POST.get("fin_rango_dias_" + obj_key[3])
            comision = request.POST.get("comision_rango_" + obj_key[3])

            if obj_regla_rango:
                eliminar = request.POST.get("hdn_eliminar_" + obj_key[3], 0)
                activo = False if eliminar == '1' else True

                obj_regla_rango.inicio_rango_dias = inicio_rango_dias
                obj_regla_rango.fin_rango_dias = fin_rango_dias
                obj_regla_rango.comision = comision
                obj_regla_rango.activo = activo

                obj_regla_rango.save()
            else:
                obj_regla_rango = Comision_Regla_Rangos.objects.create(
                    regla_id=obj_regla.id,
                    inicio_rango_dias=inicio_rango_dias,
                    fin_rango_dias=fin_rango_dias,
                    comision=comision,
                )

    obj_json = {
        "status": True,
        "data": {},
        "msj": "Regla guardada exitosamente."
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def get_cliente(request, search, union):
    str_busqueda = str(search).replace(" ", "%")

    str_select = ""
    if union == "todos2":
        str_select = """SELECT NULL as NoCliente, 'Todos' as NombreCliente, '0' AS CodigoCliente
        UNION ALL
        """

    sql = """
        %s
        SELECT c.NoCliente, c.CodigoCliente+' | '+c.Nombre as NombreCliente, c.CodigoCliente,
            v.NoVendedor, CONVERT(VARCHAR,v.NoVendedor)+' | '+v.Nombre as NombreVendedor
        FROM Inventario..Clientes as c
        LEFT JOIN Inventario..Vendedores as v
        ON c.NoVendedor = v.NoVendedor
        WHERE (c.CodigoCliente like '%%%s%%' OR c.Nombre like '%%%s%%')
        ORDER BY c.CodigoCliente
    """ % (str_select, str_busqueda, str_busqueda)

    obj_cliente = get_query(sql)

    data = []

    for cliente in obj_cliente:
        data.append({
            "id": cliente["NoCliente"],
            "name": cliente["NombreCliente"],
            "id_ven": cliente["NoVendedor"],
            "name_ven": cliente["NombreVendedor"],
        })

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_vendedor(request, search, union):
    str_busqueda = str(search).replace(" ", "%")

    str_select = ""
    if union == "todos2":
        str_select = """SELECT NULL as NoVendedor, 'Todos' as NombreVendedor
        UNION ALL
        """

    sql = """
        %s
        SELECT NoVendedor, CONVERT(VARCHAR,NoVendedor)+' | '+Nombre as NombreVendedor
        FROM Inventario..Vendedores
        WHERE (NoVendedor like '%%%s%%' OR Nombre like '%%%s%%')
        ORDER BY NoVendedor
    """ % (str_select, str_busqueda, str_busqueda)

    obj_vendedores = get_query(sql)

    data = []

    for vendedor in obj_vendedores:
        data.append({
            "id": vendedor["NoVendedor"],
            "name": vendedor["NombreVendedor"]
        })

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_producto(request, search, union):
    str_busqueda = str(search).replace(" ", "%")

    str_select = ""
    if union == "todos2":
        str_select = """SELECT NULL as NoProducto, 'Todos' as NombreProducto, NULL as TipoProducto
        UNION ALL
        """

    sql = """
    %s
    SELECT NoProducto, CONVERT(VARCHAR,CodigoProducto)+' | '+Descripcion as NombreProducto,
        case left(NoClasificacion,2) 
        when '07' then 'C' 
        when '21' then 'M'
        else 'M' end as TipoProducto
    FROM Inventario..Productos
    WHERE (CodigoProducto like '%%%s%%' OR Descripcion like '%%%s%%')
    AND Habilitado = 1
    ORDER BY NoProducto
    """ % (str_select, str_busqueda, str_busqueda)

    obj_productos = get_query(sql)

    data = []

    for producto in obj_productos:
        data.append({
            "id": producto["NoProducto"],
            "name": producto["NombreProducto"],
            "tipo_prod": producto["TipoProducto"],
        })

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def descargar_excel(request):
    str_query = """
        SELECT a.comision_base, a.comision_fuera_rango,
        CASE a.tipo_producto
            WHEN 'C' THEN
                'Cuadril'
            WHEN 'M' THEN
                'Mixto'
        END as 'TipoProducto',
        CASE a.es_porcentaje
            WHEN 1 THEN
                CONVERT(VARCHAR, a.comision_base) + ' %'
            ELSE
                CONVERT(VARCHAR, a.comision_base)
        END AS 'comisionbase',
        CASE a.activo
            WHEN 1 THEN
                'Si'
            WHEN 0 THEN
                'No'
            ELSE
                'No'
        END as 'habilitado',
        ISNULL(b.CodigoCliente+' | '+b.NIT+' | '+b.Nombre, '') as 'cliente',
        ISNULL(c.Descripcion, '') as 'producto',
        ISNULL(CONVERT(VARCHAR,d.NoVendedor)+' | '+d.Nombre, '') as 'vendedor', a.id
        FROM NOVA..rrhh_comision_regla as a
        LEFT JOIN Inventario..Clientes as b ON b.NoCliente = a.no_cliente
        LEFT JOIN Inventario..Productos as c ON c.NoProducto = a.no_producto
        LEFT JOIN Inventario..Vendedores as d ON d.NoVendedor = a.no_vendedor
    """

    obj_reglas = get_query(str_query)

    wb = xlwt.Workbook(encoding='UTF-8')
    ws = wb.add_sheet('Hoja 1')
    style = xlwt.XFStyle()
    style.num_format_str = '0'

    ws.write(0, 0, 'Cliente')
    ws.write(0, 1, 'Vendedor')
    ws.write(0, 2, 'Tipo de Producto')
    ws.write(0, 3, 'Producto')
    ws.write(0, 4, 'Comisión Base')
    ws.write(0, 5, 'Habilitado')

    int_row = 1
    for regla in obj_reglas:
        ws.write(int_row, 0, regla['cliente'])
        ws.write(int_row, 1, regla['vendedor'])
        ws.write(int_row, 2, regla['TipoProducto'])
        ws.write(int_row, 3, regla['producto'])
        ws.write(int_row, 4, regla['comisionbase'])
        ws.write(int_row, 5, regla['habilitado'])
        int_row += 1

    response = HttpResponse(content_type='application/ms-excel')
    response['Content-Disposition'] = 'attachment; filename="Reglas de Comisiones.xls"'

    wb.save(response)

    return response

