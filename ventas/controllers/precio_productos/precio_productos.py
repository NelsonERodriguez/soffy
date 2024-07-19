from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db import connection
from django.http import JsonResponse


@login_required(login_url="/login/")
def index(request):
    data = {}
    return render(request, 'precio_productos/precio_productos.html', data)


@login_required(login_url="/login/")
def get_productos(request):
    clasificacion = request.POST.get('clasificacion', None)
    filter_clasificacion = "''"

    if clasificacion == 'pollo':
        filter_clasificacion = "'CUADRIL', 'MIXTO POLLO'"
    elif clasificacion == "cerdo":
        filter_clasificacion = "'CARNE DE CERDO'"
    elif clasificacion == "res":
        filter_clasificacion = "'RES'"
    elif clasificacion == "embutidos":
        filter_clasificacion = "'EMBUTIDOS'"
    elif clasificacion == "otros":
        filter_clasificacion = "'PAPAS', 'MILANESA'"

    sql = """
            SELECT 
                p.NoProducto, p.CodigoProducto, p.Descripcion, c.Nivel1 AS Clasificacion, e.Existencia, pc.Precio            
            FROM 
                Inventario..existencias e 
            INNER JOIN Inventario..Productos p ON p.NoProducto = e.NoProducto
            LEFT JOIN Inventario..ClasificacionesN c ON p.NoClasificacion = c.NoNivel3
            INNER JOIN Inventario..PreciosClases pc ON p.NoProducto = pc.NoProducto AND pc.noclasecliente = 106
            WHERE 
                e.NoEmpresa = 2
            AND Existencia > 0
            AND c.Nivel1 IN (%s)
            ORDER BY c.Nivel1
    """ % filter_clasificacion

    cursor = connection.cursor()
    cursor.execute(sql)

    arr_productos = []
    for row in cursor.fetchall():
        arr_productos.append({
            "NoProducto": row[0],
            "CodigoProducto": row[1],
            "Descripcion": row[2],
            "Clasificacion": row[3],
            "Existencia": row[4],
            "Precio": row[5]
        })

    data = {
        "productos": arr_productos
    }
    return JsonResponse(data, safe=False)
