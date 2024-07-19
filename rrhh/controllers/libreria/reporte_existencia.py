from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rrhh.models import Libreria_producto, Libreria_tipo
from django.http import JsonResponse


@login_required(login_url="/login/")
def index(request):
    # arr_productos = Libreria_producto.objects.all()

    data = {
        # "productos": arr_productos
    }

    return render(request, 'libreria/reporte_existencia.html', data)


@login_required(login_url="/login/")
def listado(request):
    tipo = request.POST.get("tipo")
    obj_tipo = Libreria_tipo.objects.filter(clave=tipo).first()

    if obj_tipo:
        int_tipo = obj_tipo.id
    else:
        int_tipo = 1

    arr_productos = Libreria_producto.objects.filter(activo=True, tipo_id=int_tipo).values()

    arr_response = {
        "productos": list(arr_productos),
        "msj": "Se muestran los productos ingresados en el sistema.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)