from datetime import datetime

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rrhh.models import Libreria_producto, Libreria_tipo, Libreria_producto_movimiento
from django.http import JsonResponse


@login_required(login_url="/login/")
def index(request):
    # arr_productos = Libreria_producto.objects.all()

    data = {
        # "productos": arr_productos
    }

    return render(request, 'libreria/reporte_movimientos.html', data)


@login_required(login_url="/login/")
def listado(request):
    tipo = request.POST.get("tipo")

    obj_hoy = datetime.today()
    fecha_hoy = str(obj_hoy.strftime('%Y-%m-%d'))

    str_fecha_inicio = request.POST.get("fecha_inicial", None)
    str_fecha_fin = request.POST.get("fecha_final", None)

    str_fecha_inicio = fecha_hoy if not str_fecha_inicio or len(str(str_fecha_inicio)) == 0 else str_fecha_inicio
    str_fecha_fin = fecha_hoy if not str_fecha_fin or len(str(str_fecha_fin)) == 0 else str_fecha_fin

    obj_tipo = Libreria_tipo.objects.filter(clave=tipo).first()

    if obj_tipo:
        int_tipo = obj_tipo.id
    else:
        int_tipo = 1

    obj_movimientos = Libreria_producto_movimiento.objects.filter(producto__tipo_id=int_tipo,
                                                                  producto__activo=True,
                                                                  created_at__gte=str_fecha_inicio,
                                                                  created_at__lte=str_fecha_fin)\
        .values('producto__producto', 'producto__codigo', 'created_at', 'tipo_movimiento', 'cantidad',
                'user__name')

    # arr_productos = Libreria_producto.objects.filter(activo=True, tipo_id=int_tipo).values()

    arr_response = {
        "movimientos": list(obj_movimientos),
        "msj": "Se muestran los movimientos según las fechas ingresadas.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)