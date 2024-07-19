from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from core.functions import get_query, get_single_query


@login_required(login_url="/login/")
def index(request):
    return render(request, 'ficha_empleados/ficha_empleados.html', {})


@login_required(login_url='/login/')
def get_ficha(request, pk):
    employee = pk
    data = {
        'vacaciones': [],
        'pasivos': [],
        'anticipos': [],
        'beneficios': [],
        'info_employee': [],
        'bool_vacaciones': False,
        'bool_pasivos': False,
        'bool_anticipos': False,
        'bool_beneficios': False,
        'status': False,
        'avatar': None,
        'message': 'Ocurrio una problema inesperado'
    }
    if len(str(employee)) <= 9:
        qry_vacaciones = """EXEC NominaGB..StatusVacaciones %s, 12"""
        qry_pasivos = """EXEC NominaGB..Statuspasivo %s, 12"""
        qry_anticipos = """EXEC ares..statusanticipos %s"""
        qry_avatar = """SELECT avatar FROM nova..auth_user
                        WHERE avatar IS NOT NULL
                            AND empleado_id = (SELECT empleado_id
                                FROM ares..empleados_base
                            WHERE no_empleado = %s)"""
        qry_nomina = """SELECT e.Nombres, e.Apellidos,
                        e.Fecha_Alta,
                        DATEDIFF(YEAR, e.Fecha_Nacimiento, GETDATE()) as 'edad',
                        emp.Razon_Social AS 'empresa'
                    FROM NominaGB..empleados e
                        JOIN NominaGB..Empresas emp
                            ON e.No_Empresa = emp.No_Empresa
                    WHERE e.No_Empleado = %s"""
        try:
            arr_vacaciones = get_query(str_sql=qry_vacaciones, params=[employee])
            arr_pasivos = get_query(str_sql=qry_pasivos, params=[employee])
            arr_anticipos = get_query(str_sql=qry_anticipos, params=[employee])
            avatar = get_single_query(str_sql=qry_avatar, params=[employee])
            info_employee = get_single_query(str_sql=qry_nomina, params=[employee])
            arr_beneficios = []
            if "Nombres" in info_employee:
                if info_employee['Nombres']:
                    data['info_employee'] = info_employee

                if avatar and avatar['avatar'] is not None and avatar['avatar'] != "":
                    data['avatar'] = f"media/{avatar['avatar']}"

                if len(arr_vacaciones) > 0:
                    data['vacaciones'] = arr_vacaciones
                    data['bool_vacaciones'] = True
                    if len(arr_pasivos) > 0:
                        data['pasivos'] = arr_pasivos
                        data['bool_pasivos'] = True
                    if len(arr_anticipos) > 0:
                        data['anticipos'] = arr_anticipos
                        data['bool_anticipos'] = True
                    if len(arr_beneficios) > 0:
                        data['beneficios'] = arr_beneficios
                        data['bool_beneficios'] = True
                    data['status'] = True
                    data['message'] = "Datos obtenidos correctamente"
                else:
                    data['status'] = False
                    data['message'] = "No hay información a mostrar"
            else:
                data['status'] = False
                data['message'] = "No hay información a mostrar"
        except ValueError as e:
            data['status'] = False
            data['message'] = f"No hay información a mostrar, {e}"
    else:
        data['status'] = False
        data['message'] = f"No hay información a mostrar, {e}"
    return render(request, 'ficha_empleados/ficha_empleados_detalle.html', data)
