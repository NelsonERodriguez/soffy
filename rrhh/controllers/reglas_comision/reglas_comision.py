from django.core.files.storage import FileSystemStorage
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query, set_notification
from rrhh.models import Comision_Regla, Comision_Regla_Rangos, Comision_regla_respaldo_modificacion
from soffybiz.settings import ADJUNTOS_COMISIONES_REQUERIDO


@login_required(login_url="/login/")
def index(request):
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
    	ISNULL(b.CodigoCliente+' | '+b.NIT+' | '+b.Nombre, 'Todos') as 'cliente',
    	ISNULL(c.Descripcion, 'Todos') as 'producto',
    	ISNULL(CONVERT(VARCHAR,d.NoVendedor)+' | '+d.Nombre, 'Todos') as 'vendedor', a.id
    	FROM NOVA..rrhh_comision_regla as a
    	LEFT JOIN Inventario..Clientes as b ON b.NoCliente = a.no_cliente
    	LEFT JOIN Inventario..Productos as c ON c.NoProducto = a.no_producto
    	LEFT JOIN Inventario..Vendedores as d ON d.NoVendedor = a.no_vendedor
    """

    obj_reglas = get_query(str_query)

    data = {
        "reglas": obj_reglas
    }

    return render(request, 'reglas_comision/reglas_comision.html', data)


@login_required(login_url="/login/")
def edit(request, pk):
    str_texto_titulo = "Crear" if pk == 0 else "Editar"

    # int_id = str(int(pk))
    str_query = """
    	SELECT a.comision_base, a.comision_fuera_rango, a.tipo_producto, a.es_porcentaje,
    	ISNULL(b.CodigoCliente+' | '+b.NIT+' | '+b.Nombre, 'Todos') as 'cliente',
    	ISNULL(CONVERT(VARCHAR,d.NoVendedor)+' | '+d.Nombre, 'Todos') as 'vendedor',
    	ISNULL(CONVERT(VARCHAR,c.CodigoProducto)+' | '+c.Descripcion, 'Todos') as 'producto',
        ISNULL(a.no_cliente, '') as 'no_cliente',
        ISNULL(a.no_vendedor, '') as 'no_vendedor',
        ISNULL(a.no_producto, '') as 'no_producto',
        a.id, a.activo, a.descuento_precio, a.archivo_respaldo
    	FROM NOVA..rrhh_comision_regla as a
    	LEFT JOIN Inventario..Clientes as b ON b.NoCliente = a.no_cliente
    	LEFT JOIN Inventario..Productos as c ON c.NoProducto = a.no_producto
    	LEFT JOIN Inventario..Vendedores as d ON d.NoVendedor = a.no_vendedor
    	WHERE a.id = %s
    """ % (pk)

    rangos = Comision_Regla_Rangos.objects.filter(regla=pk, activo=1)

    obj_data = get_query(str_query)
    int_cliente = obj_data[0]["no_cliente"] if obj_data and obj_data[0]["no_cliente"] else ''
    # print(int_cliente)

    data = {
        "reglas": obj_data,
        "texto_titulo": str_texto_titulo,
        "id": pk,

        "comision_base": obj_data[0]["comision_base"] if obj_data else '',
        "comision_fuera_rango": obj_data[0]["comision_fuera_rango"] if obj_data else '',
        "tipo_producto": obj_data[0]["tipo_producto"] if obj_data else '',
        "cliente": obj_data[0]["cliente"] if obj_data else '',
        "producto": obj_data[0]["producto"] if obj_data else '',
        "vendedor": obj_data[0]["vendedor"] if obj_data else '',
        "no_cliente": obj_data[0]["no_cliente"] if obj_data and obj_data[0]["no_cliente"] else '',
        "no_producto": obj_data[0]["no_producto"] if obj_data and obj_data[0]["no_producto"] else '',
        "no_vendedor": obj_data[0]["no_vendedor"] if obj_data and obj_data[0]["no_vendedor"] else '',
        "descuento_precio": obj_data[0]["descuento_precio"] if obj_data else '',
        "activo_si": "checked" if (obj_data and obj_data[0]["activo"] == True) or len(obj_data) == 0 else '',
        "activo_no": "checked" if obj_data and obj_data[0]["activo"] == False else '',

        "es_porcentaje_si": "checked" if (len(obj_data) > 0 and obj_data[0]["es_porcentaje"] == True) or len(
            obj_data) == 0 else '',
        "es_porcentaje_no": "checked" if obj_data and obj_data[0]["es_porcentaje"] == False else '',

        "sel_cuadril": 'selected' if obj_data and obj_data[0]["tipo_producto"] == 'C' else '',
        "sel_mixto": 'selected' if obj_data and obj_data[0]["tipo_producto"] == 'M' else '',

        "archivo_respaldo": obj_data[0]["archivo_respaldo"] if obj_data and obj_data[0]["archivo_respaldo"] else None,

        "rangos": rangos,
        "cantidad_rangos": len(rangos) + 1 if len(rangos) > 0 else 2,

        "bool_adjuntos_requeridos": ADJUNTOS_COMISIONES_REQUERIDO,
    }

    return render(request, 'reglas_comision/reglas_comision_edit.html', data)


@login_required(login_url="/login/")
def save(request, pk):
    obj_regla = Comision_Regla.objects.filter(id=pk).first()

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
    descuento_precio = request.POST.get("descuento_precio", None) if len(
        request.POST.get("descuento_precio")) > 0 else None
    fil_archivo = request.FILES.get("filInputFile")

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
            archivo_respaldo=path_file_pivote,
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

    set_notification(request, True, "Regla guardada exitosamente.", "add_alert", "success")

    return redirect("rrhh-reglas_comision")


@login_required(login_url="/login/")
def get_cliente(request, search):
    str_busqueda = str(search).replace(" ", "%")

    sql = """
    	SELECT NULL as NoCliente, 'Todos' as NombreCliente, '0' AS CodigoCliente
		UNION ALL
        SELECT NoCliente, CodigoCliente+' | '+NIT+' | '+Nombre as NombreCliente, CodigoCliente
        FROM Inventario..Clientes
        WHERE (CodigoCliente like '%%%s%%' OR Nombre like '%%%s%%' OR NIT like '%%%s%%')
        ORDER BY CodigoCliente
    """ % (str_busqueda, str_busqueda, str_busqueda)

    obj_cliente = get_query(sql)

    data = []

    for cliente in obj_cliente:
        data.append({
            "id": cliente["NoCliente"],
            "name": cliente["NombreCliente"]
        })

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_vendedor(request, search):
    str_busqueda = str(search).replace(" ", "%")

    sql = """
    	SELECT NULL as NoVendedor, 'Todos' as NombreVendedor
		UNION ALL
        SELECT NoVendedor, CONVERT(VARCHAR,NoVendedor)+' | '+Nombre as NombreVendedor
        FROM Inventario..Vendedores
        WHERE (NoVendedor like '%%%s%%' OR Nombre like '%%%s%%')
        ORDER BY NoVendedor
    """ % (str_busqueda, str_busqueda)

    obj_vendedores = get_query(sql)

    data = []

    for vendedor in obj_vendedores:
        data.append({
            "id": vendedor["NoVendedor"],
            "name": vendedor["NombreVendedor"]
        })

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_producto(request, search):
    str_busqueda = str(search).replace(" ", "%")

    sql = """
    	SELECT NULL as NoProducto, 'Todos' as NombreProducto
		UNION ALL
        SELECT NoProducto, CONVERT(VARCHAR,CodigoProducto)+' | '+Descripcion as NombreProducto
        FROM Inventario..Productos
        WHERE (CodigoProducto like '%%%s%%' OR Descripcion like '%%%s%%')
        ORDER BY NoProducto
    """ % (str_busqueda, str_busqueda)

    obj_productos = get_query(sql)

    data = []

    for producto in obj_productos:
        data.append({
            "id": producto["NoProducto"],
            "name": producto["NombreProducto"]
        })

    return JsonResponse(data, safe=False)
