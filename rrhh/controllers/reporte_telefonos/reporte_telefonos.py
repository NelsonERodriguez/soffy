from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query


@login_required(login_url="/login/")
def index(request):
    data = {
        "datos": {}
    }

    return render(request, 'reporte_telefonos/reporte_telefonos.html', data)


@login_required(login_url='/login/')
def get_data(request):
    str_filtro = request.POST.get('filtro')

    str_fecha = request.POST.get('fecha')

    arr_fecha = str_fecha.split("-")
    str_mes = arr_fecha[1]
    str_mes = str(int(str_mes))
    str_anio = arr_fecha[0]

    if str_filtro == "4":
        str_query = "EXEC NOVA..rrhh_polizas_telefonos %s, %s, %s" % (str_filtro, str_mes, str_anio)
    else:
        str_query = "EXEC NOVA..rrhh_reporte_telefonos %s, %s, %s" % (str_filtro, str_mes, str_anio)

    obj_query = get_query(str_query)

    obj_json = {
        "data": obj_query,
        "status": True if obj_query else False,
        "msj": "Se muestra la información para los filtros seleccionados" if obj_query
        else "No se encontraron datos para los filtros seleccionados."
    }

    return JsonResponse(obj_json, safe=False)
