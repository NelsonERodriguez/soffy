from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query


@login_required(login_url="/login/")
def index(request):
    return render(request, 'reporte_sueldos/reporte_sueldos.html', {})


@login_required(login_url='/login/')
def get_data(request):
    data = {
        'data': [],
        'status': False,
        'message': 'Ocurrio una problema inesperado'
    }
    str_query = """SELECT *
        FROM NominaGB..vw_datos_empleados_sueldos_otros"""
    try:
        arr_data = get_query(str_query)
        data['status'] = True
        data['message'] = "Datos obtenidos correctamente"
        if len(arr_data) > 0:
            data['data'] = arr_data
    except ValueError as e:
        data['data'] = []
        data['status'] = True
        data['message'] = f"Ocurrio un problema, {e}"

    return JsonResponse(data, safe=False)
