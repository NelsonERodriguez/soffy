from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from core.functions import get_query, get_single_query, execute_query
from django.http import JsonResponse


@login_required(login_url="/login/")
def index(request):
    return render(request, 'distribucion_polizas/distribucion_polizas.html', {})


@login_required(login_url="/login/")
def get_data(request):
    data = {
        'status': False,
        'message': "Ocurrio un error inesperado.",
        'data': []
    }

    qry = """SELECT  e.No_Empleado, e.Nombres +' '+ e.Apellidos AS Empleado,
                e.no_Depto depto, dp.No_Depto distripoliza,
                d.Descripcion AS depto, d.No_Contable, n.Nombre AS cuenta,
                d.Area areadepto, dp.Area areadispo, a.DescripcionArea,
                dp.porcentaje, dp.valor
            FROM nominagb..Empleados e
            JOIN NominaGB..Deptos d
                ON e.No_Depto = d.No_Depto
            JOIN Contabilidad..Areas a
                ON d.area = a.codigoarea
            JOIN Contabilidad..NOMENCLATURA n
                ON d.No_Contable = n.Cuenta
            JOIN NominaGB..DistribucionPoliza dp
                ON e.No_Empleado = dp.No_Empleado
            WHERE e.Fecha_Baja IS NULL"""
    try:
        arr_response = get_query(str_sql=qry)
        data['status'] = True
        data['message'] = "Datos obtenidos correctamente"
        if len(arr_response) > 0:
            data['data'] = arr_response
    except ValueError as e:
        data['message'] = f"Ocurrio un problema, {e}"
        data['status'] = False
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def save(request):
    data = {
        'status': False,
        'message': "Ocurrio un error inesperado.",
        'data': []
    }
    area = request.POST.get('area', '')
    porcentage = request.POST.get('porcentage', '')
    nomenclatura = request.POST.get('nomenclatura', '')
    empleado = request.POST.get('empleado', '')
    try:
        qry = """UPDATE NominaGB..DistribucionPoliza
                        SET Porcentaje = %s, No_Contable = %s,
                            Area = %s
                    WHERE No_Empleado = %s"""
        if porcentage and porcentage != "" and nomenclatura and nomenclatura != "" \
            and area and area != "" and empleado and empleado != "":
            execute_query(sql=qry, params=[porcentage,
                                nomenclatura, area, empleado])
            data['status'] = True
            data['message'] = "Datos obtenidos correctamente"
        else:
            data['message'] = "Faltan datos para poder guardar"
    except ValueError as e:
        data['message'] = f"Ocurrio un problema, {e}"
        data['status'] = False
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def edit_poliza_empleado(request, pk):
    arr_empleado = []
    qry_empleado = """SELECT  e.No_Empleado, e.Nombres +' '+ e.Apellidos AS Empleado,
                    e.no_Depto depto,
                    d.Descripcion AS depto, d.No_Contable,
                    d.Area areadepto, dp.porcentaje,
                    a.CodigoArea, a.DescripcionArea,
                    n.Cuenta as NoNomenclatura,
                    n.Nombre as DescNomenclatura
                FROM nominagb..Empleados e
                JOIN NominaGB..Deptos d
                    ON e.No_Depto = d.No_Depto
                JOIN Contabilidad..Areas a
                    ON d.area = a.codigoarea
                JOIN Contabilidad..NOMENCLATURA n
                    ON d.No_Contable = n.Cuenta
                JOIN NominaGB..DistribucionPoliza dp
                    ON e.No_Empleado = dp.No_Empleado
                WHERE e.Fecha_Baja IS NULL
                    AND e.No_Empleado = %s"""
    try:
        if len(str(pk)) <= 9:
            arr_empleado = get_single_query(str_sql=qry_empleado, params=[pk])
        else:
            arr_empleado = []
    except ValueError as e:
        arr_empleado = []
    data = {
        "empleado": arr_empleado
    }
    return render(request,
        'distribucion_polizas/distribucion_polizas_edit.html', data)


@login_required(login_url="/login/")
def get_areas(request):
    data = {
        'status': False,
        'message': "Ocurrio un error inesperado.",
        'data': []
    }
    qry = """SELECT CodigoArea, DescripcionArea 
                FROM Contabilidad..Areas"""
    try:
        arr_response = get_query(str_sql=qry)
        data['status'] = True
        data['message'] = "Datos obtenidos correctamente"
        if len(arr_response) > 0:
            data['data'] = arr_response
    except ValueError as e:
        data['message'] = f"Ocurrio un problema, {e}"
        data['status'] = False
    return JsonResponse(data, safe=False)
    


@login_required(login_url="/login/")
def get_nomenclaturas(request):
    data = {
        'status': False,
        'message': "Ocurrio un error inesperado.",
        'data': []
    }
    qry = """SELECT Cuenta, Nombre
                FROM Contabilidad..NOMENCLATURA
            WHERE EstadoCuenta = 'A' 
                AND CodigoRubro = 1
                AND CodigoClaseCta IN (1, 5)
                AND Recibe = 'N'"""
    try:
        arr_response = get_query(str_sql=qry)
        data['status'] = True
        data['message'] = "Datos obtenidos correctamente"
        if len(arr_response) > 0:
            data['data'] = arr_response
    except ValueError as e:
        data['message'] = f"Ocurrio un problema, {e}"
        data['status'] = False
    return JsonResponse(data, safe=False)
    