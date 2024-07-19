from array import array
from tempfile import TemporaryFile
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query, set_notification, insert_query, execute_query
from django.db import connection
from datetime import datetime
import django.db as db
from rrhh.models import Pagos_programados_empleados
import openpyxl
import time
import math
import calendar
import datetime as dt
from django.core.files.storage import FileSystemStorage
from dateutil.relativedelta import relativedelta


arr_nominas = [
    {
        'str_for_query': 'nominagb',
        'name': 'Nomina General',
    },
    {
        'str_for_query': 'nominagbf',
        'name': 'Nomina Facturación',
    },
    {
        'str_for_query': 'nominagbv',
        'name': 'Nomina Ventas',
    },
    {
        'str_for_query': 'nominagbd',
        'name': 'Nomina Depreciación',
    },
]

arr_options = [
    {
        'name': 'Cuotas Figua',
        'str_search': 'cuotas_figua',
        'icon': 'fa fa-piggy-bank',
        'default': True,
    },
    {
        'name': 'Cuotas UPA',
        'str_search': 'cuotas_upa',
        'icon': 'fas fa-hands-usd',
        'default': False,
    },
    {
        'name': 'Otros',
        'str_search': 'others',
        'icon': 'fa fa-filter',
        'default': False,
    },
]


@login_required(login_url="/login/")
def index(request):
    data = { 'nominas': arr_nominas, }
    return render(request, 'movimientos_programados/movimientos_programados.html', data)


@login_required(login_url="/login/")
def create(request):
    arr_data = {
        'nominas': arr_nominas,
        'keys': get_keys_movements(request),
        'periods': get_period_types(request),
        'options': arr_options,
    }
    # if :
        # return redirect('compras-proveedores')
    return render(request, 'movimientos_programados/movimientos_programados_create.html', arr_data)


@login_required(login_url="/login/")
def save(request):
    bool_no_error = True
    str_message = 'Guardado Correctamente'
    str_nomina = request.POST.get('nomina', 'nominagb')
    int_employee = request.POST.get('employee', 0)
    int_key = request.POST.get('key', 0)
    str_period = request.POST.get('period', '')
    date_init = request.POST.get('init', '')
    date_end = request.POST.get('end', '')
    str_observations = request.POST.get('observations', '')
    int_quote = request.POST.get('quote', 0)
    int_total = request.POST.get('total', 0)

    if not int_employee:
        bool_no_error = False
        str_message = 'Selecciona un empleado.'
    if not int_key:
        bool_no_error = False
        str_message = 'Debes de poner un movimiento valido.'
    if not date_init or not date_end:
        bool_no_error = False
        str_message = 'Verifica tus datos en las fechas'

    if bool_no_error:
        str_query = """INSERT INTO %s..MovimientosProgramados (No_Empleado, No_Clave, Fecha_Inicio, Fecha_Final, Total,
                        Cuota, No_Pagos, Saldo, Observaciones, ID_Usuario, Tipo_Periodo) VALUES ('%s', '%s', '%s', '%s',
                        %s, %s, 0, %s, '%s', 1, '%s')""" % (str_nomina, int_employee, int_key, date_init, date_end,
                        int_total, int_quote, int_total, str_observations, str_period)
        bool_response = execute_query(str_query)
        if not bool_response:
            bool_no_error = False
            str_message = 'Ocurrió un error al insertar el movimiento, contacta con IT'

    arr_return = {
        'status': bool_no_error,
        'message': str_message,
    }
    return JsonResponse(arr_return, safe=False)


# @login_required(login_url="/login/")
# def delete(request):
#     arr_return = {}
    # str_query = """SELECT mp.No_Movimiento, mp.No_Empleado, e.Nombres, e.Apellidos, mp.Tipo_Periodo,
    #                         mp.No_Clave, mp.Fecha_Inicio, mp.Fecha_Final, mp.Total, mp.Cuota, mp.Saldo,
    #                         mp.Observaciones, mp.No_Pagos
    #                     FROM %s..MovimientosProgramados mp
    #                         JOIN %s..Empleados e
    #                             ON mp.No_Empleado = e.No_Empleado
    #                     WHERE mp.No_Movimiento = '%s'
    #                     ORDER BY No_Empleado ASC""" % (nomina, nomina, pk)
    # arr_response = get_query(str_query, True)
    # arr_return = {
    #     'data': [],
    #     'nomina_selected': nomina,
    #     'nominas': arr_nominas,
    #     'keys': get_keys_movements(request),
    #     'periods': get_period_types(request),
    # }
    # if arr_response:
    #     arr_return['data'] = arr_response[0]
    # return render(request, 'movimientos_programados/movimientos_programados_edit.html', arr_return)


@login_required(login_url="/login/")
def delete(request):
    return render(request, 'movimientos_programados/movimientos_programados_delete.html')


@login_required(login_url="/login/")
def get_movements_by_user(request):
    arr_return = {
        'status': True,
        'data': [],
        'message': '',
    }
    int_employee = request.POST.get('user', '')
    str_nomina = request.POST.get('nomina', '')
    str_query = """SELECT mp.No_Empleado, mp.No_Clave, e.Nombres, e.Apellidos,
                c.Descripcion
            FROM %s..MovimientosProgramados mp
                JOIN %s..Empleados e
                    ON mp.No_Empleado = e.No_Empleado
                JOIN %s..Claves c
                    ON mp.No_Clave = c.No_Clave
            WHERE mp.No_Empleado  = '%s'
            AND mp.Fecha_Final >= (SELECT fecha_final FROM %s..Periodos 
                    WHERE No_Empresa = 1 AND Fecha_Inicial <= GETDATE()
                        AND Fecha_Final >= GETDATE())
            AND mp.Saldo > 0
            GROUP BY mp.No_Empleado, mp.No_Clave, e.Nombres,
                e.Apellidos, c.Descripcion
            ORDER BY mp.No_Empleado ASC""" % (str_nomina, str_nomina,
                str_nomina, int_employee, str_nomina)
    try:
        arr_data = get_query(str_query, True)
        if len(arr_data) > 0:
            arr_return['data'] = arr_data
            arr_return['message'] = 'Datos obtenidos correctamente'
        else:
            arr_return['status'] = False
            arr_return['message'] = 'No se obtuvieron movimientos para el empleado seleccionado'
    except ValueError:
        arr_return['status'] = False
        arr_return['message'] = "Ocurrió un error, contacta con IT, %s" % ValueError

    return JsonResponse(arr_return, safe=False)


@login_required(login_url="/login/")
def delete_movements_by_user(request):
    arr_return = {
        'status': True,
        'message': 'Datos guardados correctamente',
    }
    int_employee = request.POST.get('employee', '')
    str_nomina = request.POST.get('nomina', '')
    int_key = request.POST.get('key', '')
    str_query = """UPDATE %s..MovimientosProgramados SET Saldo = 0.00
                    WHERE No_Clave = %s
                    AND No_Empleado = '%s'""" % (str_nomina, int_key, int_employee)
    try:
        bool_done = execute_query(str_query)
        if not bool_done:
            arr_return['status'] = False
            arr_return['message'] = "Error en los datos al actualizar movimientos."
    except ValueError:
        arr_return['status'] = False
        arr_return['message'] = "Ocurrió error al actualizar los movimientos, %s" % ValueError
    return JsonResponse(arr_return, safe=False)


@login_required(login_url="/login/")
def get_employees(request):
    bool_status = False
    str_nomina = request.POST.get('nomina', 'nominagb')
    str_by_name = request.POST.get('name', '')
    str_filter = ''
    if str_by_name != '':
        str_filter = """AND e.Nombres LIKE '%%%s%%' OR e.Apellidos LIKE '%%%s%%'
                        OR mp.No_Empleado LIKE '%%%s%%'""" % (str_by_name, str_by_name, str_by_name)

    # AND Fecha_Final >= GETDATE()
    str_query = """SELECT mp.No_Movimiento, mp.No_Empleado, e.Nombres, e.Apellidos,
                        mp.No_Clave, mp.Fecha_Inicio, mp.Fecha_Final, mp.Total, mp.Cuota, mp.Saldo,
                        mp.Observaciones, mp.No_Pagos
                    FROM %s..MovimientosProgramados mp
                        JOIN %s..Empleados e
                            ON mp.No_Empleado = e.No_Empleado
                    WHERE Saldo > 0
                        %s
                    ORDER BY No_Empleado ASC""" % (str_nomina, str_nomina, str_filter)
    arr_response = get_query(str_query, True)

    if arr_response:
        bool_status = True

    arr_return = {
        'status': bool_status,
        'response': arr_response
    }
    return JsonResponse(arr_return, safe=False)


@login_required(login_url="/login/")
def get_users(request):
    bool_status = False
    str_nomina = request.POST.get('nomina', 'nominagb')
    str_by_name = request.POST.get('name', '')

    str_query = f"""SELECT Nombres, Apellidos, No_Empleado
            FROM {str_nomina}..Empleados
            WHERE Fecha_Baja IS NULL
                AND Nombres LIKE '%%{str_by_name}%%' 
                    OR Apellidos LIKE '%%{str_by_name}%%'
                    OR No_Empleado LIKE '%%{str_by_name}%%'
            ORDER BY No_Empleado ASC"""
    try:
        arr_response = get_query(str_query, True)
        bool_status = True
    except ValueError as e:
        arr_response = []
        bool_status = False

    arr_return = {
        'status': bool_status,
        'response': arr_response
    }
    return JsonResponse(arr_return, safe=False)


@login_required(login_url="/login/")
def get_keys_movements(request, method_response = 'arr'):
    arr_response = {
        'nominagb': [],
        'nominagbv': [],
        'nominagbf': [],
        'nominagbd': [],
    }

    for detail in arr_nominas:
        nomina = detail['str_for_query']
        str_filter = "AND Activa = 1"
        if nomina == 'nominagbd':
            str_filter = ''
        str_query = f"""SELECT No_Clave AS Clave,
                CAST(No_Clave AS VARCHAR)+' - '+ Descripcion AS Descripcion
                    FROM {nomina}..claves
                WHERE MovimientosProgramados = 1 {str_filter}"""
        try:
            arr_response[nomina] = get_query(str_query, True)
        except ValueError as e:
            arr_response[nomina] = []

    if method_response == 'json':
        return JsonResponse(arr_response, safe=False)
    else:
        return arr_response


@login_required(login_url="/login/")
def get_period_types(request, method_response = 'arr'):
    arr_response = {
        'nominagb': [],
        'nominagbv': [],
        'nominagbf': [],
        'nominagbd': [],
    }
    for detail in arr_nominas:
        nomina = detail['str_for_query']
        str_query = f"""SELECT CodigoTipo, Descripcion
                FROM {nomina}..TipoPeriodos"""
        try:
            arr_response[nomina] = get_query(str_query, True)
        except ValueError as e:
            arr_response[nomina] = []
    if method_response == 'json':
        return JsonResponse(arr_response, safe=False)
    else:
        return arr_response


@login_required(login_url="/login/")
def calculate_figua(request):
    bool_no_error = True
    str_return = "Calculado correctamente"
    arr_return = []
    # param_interest = int(request.POST.get('interest', 0))
    param_interest = 12
    param_amount = request.POST.get('amount', False)
    param_months = request.POST.get('months', 0)
    param_date_init = request.POST.get('date_init', '')
    param_date_first_quote = request.POST.get('date_first_quote', '')
    amount = float( param_amount if param_amount else 0.00 )
    months = int( param_months if param_months else 0 )
    interest = (months / 12) * param_interest

    if amount <= 0:
        bool_no_error = False
        str_return = "No existe un monto valido"
    if months <= 0:
        bool_no_error = False
        str_return = "La cantidad de meses debe ser valida"

    if bool_no_error:
        date_init = datetime.strptime(param_date_init, "%Y-%m-%d")
        date_first_quote = datetime.strptime(param_date_first_quote, "%Y-%m-%d")
        difference_first_day = int((date_first_quote - date_init).days)
        int_days_month = 30
        total_days = get_days_total(months, int_days_month)
        int_fix_quote = round((amount / months), 2)
        int_quote_interest = round(float(( (amount / int(total_days) ) * difference_first_day ) * interest / 100), 2)
        first_quote = round((int_fix_quote + int_quote_interest), 2)
        residual = round((amount - int_fix_quote), 2)
        prev_date = date_first_quote
        date_end_quote = prev_date.replace(day=15)

        arr_return = [
            {
                'date_payment': format(str(date_first_quote).replace('00:00:00', '').replace(' ', '')),
                'end_payment': format(str(date_end_quote).replace('00:00:00', '').replace(' ', '')),
                'capital_quote': format(int_fix_quote),
                'interest_quote': format(int_quote_interest),
                'total_quote': format(first_quote),
                'residual': format(residual),
                'days': difference_first_day
            },
        ]

        end_date = date_init + relativedelta(months=months)
        for x in range(1, months):
            if residual < int_fix_quote:
                int_fix_quote = residual

            new_date = prev_date + relativedelta(months=1)
            difference_dead_time = int((new_date - end_date).days)
            difference_days = int((new_date - prev_date).days)

            if difference_dead_time > 0:
                difference_days = difference_days - difference_dead_time

            quote_interest = round(float(((residual / int(total_days)) * difference_days) * interest / 100), 2)

            total_quote = round((int_fix_quote + quote_interest), 2)
            prev_date = new_date
            date_end_quote = prev_date.replace(day=15)
            residual = round((residual - int_fix_quote), 2)
            arr_return.append({
                'date_payment': format(str(prev_date).replace('00:00:00', '').replace(' ', '')),
                'end_payment': format(str(date_end_quote).replace('00:00:00', '').replace(' ', '')),
                'capital_quote': format(int_fix_quote),
                'interest_quote': format(quote_interest),
                'total_quote': format(total_quote),
                'residual': format(residual),
                'days': difference_days
            })

    arr_response = {
        'status': bool_no_error,
        'message': str_return,
        'arr_data': arr_return,
    }
    return JsonResponse(arr_response, safe=False)


def get_days_total(months, int_days_month):
    total_days = int(months) * int_days_month
    if months == 12:
        total_days = 365
    elif months == 24:
        total_days = 365 * 2
    elif months == 36:
        total_days = 365 * 3
    elif months == 48:
        total_days = 365 * 4
    elif months == 60:
        total_days = 365 * 5
    return total_days


@login_required(login_url="/login/")
def save_figua(request):
    bool_no_error = True
    str_message = 'Guardado correctamente.'
    param_employee = request.POST.get('employee', '')
    param_nomina = request.POST.get('nomina', '')
    param_months = request.POST.get('months', '')

    param_init = request.POST.getlist('date_init[]', [])
    param_end = request.POST.getlist('end_payment[]', [])
    param_total_quote = request.POST.getlist('total_quote[]', [])
    param_capital = request.POST.getlist('capital_quote[]', [])
    param_interest = request.POST.getlist('interest_quote[]', [])
    param_residual = request.POST.getlist('residual[]', [])
    int_key = 0
    int_payment = 1

    if not param_employee:
        bool_no_error = False
        str_message = "Selecciona un empleado."
    if not param_months:
        bool_no_error = False
        str_message = "Ingresa cantidad de meses valida."


    if bool_no_error:
        for quote in param_total_quote:
            init = param_init[int_key]
            end = param_end[int_key]


            int_residual = quote
            date_end = datetime.strptime(end, "%Y-%m-%d")
            prev_date_today = "%s-%s-%s" % (datetime.today().year, str(datetime.today().month).zfill(2),
                                            str(datetime.today().day).zfill(2))
            date_today = datetime.strptime(prev_date_today, "%Y-%m-%d")
            difference_days = int((date_end - date_today).days)

            if difference_days < 0:
                int_residual = 0

            str_description = "Descuento por préstamo empresa."
            str_query = """INSERT INTO %s..MovimientosProgramados (No_Empleado, No_Clave, Fecha_Inicio, Fecha_Final,
                        Total, Cuota, No_Pagos, Saldo, Observaciones, ID_Usuario, Tipo_Periodo) VALUES ('%s', '%s',
                        '%s', '%s', %s, %s, 0, %s, '%s', 1, 'Q')""" % (param_nomina, param_employee, 106, init, end,
                        quote, quote, int_residual, str_description)
            bool_insert = execute_query(str_query)

            if not bool_insert:
                bool_no_error = False
                str_message = "Ocurrió un error al guardar la información, contacta con IT"
            int_payment += 1
            int_key += 1

    arr_return = {
        'status': bool_no_error,
        'message': str_message,
    }
    return JsonResponse(arr_return, safe=False)


@login_required(login_url="/login/")
def save_upa(request):
    bool_no_error = True
    str_message = 'Guardado correctamente.'
    param_employee = request.POST.get('employee', '')
    param_nomina = request.POST.get('nomina', '')
    param_type_payment = request.POST.get('type_payment', '')
    param_quantity_quotes = request.POST.get('quantity_quotes', 0)
    param_quote = request.POST.getlist('quote[]', [])
    param_init = request.POST.getlist('date_init[]', [])
    param_end = request.POST.getlist('date_end[]', [])
    int_key = 0
    int_payment = 1

    if not param_employee:
        bool_no_error = False
        str_message = "Selecciona un empleado."
    if not param_quantity_quotes:
        bool_no_error = False
        str_message = "Ingresa cantidad de cuotas."

    if bool_no_error:
        for quote in param_quote:
            init = param_init[int_key]
            end = param_end[int_key]
            int_residual = quote
            date_end = datetime.strptime(end, "%Y-%m-%d")
            prev_date_today = "%s-%s-%s" % (datetime.today().year, str(datetime.today().month).zfill(2),
                                            str(datetime.today().day).zfill(2))
            date_today = datetime.strptime(prev_date_today, "%Y-%m-%d")
            difference_days = int((date_end - date_today).days)

            if difference_days < 0:
                int_residual = 0

            str_description = "Descuento por préstamo UPA, pago %s de %s" % (int_payment, param_quantity_quotes)
            str_query = """INSERT INTO %s..MovimientosProgramados (No_Empleado, No_Clave, Fecha_Inicio, Fecha_Final,
                        Total, Cuota, No_Pagos, Saldo, Observaciones, ID_Usuario, Tipo_Periodo) VALUES ('%s', '%s',
                        '%s', '%s', %s, %s, 0, %s, '%s', 1, '%s')""" % (param_nomina, param_employee, 78, init, end,
                        quote, quote, int_residual, str_description, param_type_payment)
            bool_insert = execute_query(str_query)

            if not bool_insert:
                bool_no_error = False
                str_message = "Ocurrió un error al guardar la información, contacta con IT"
            int_payment += 1
            int_key += 1

    arr_return = {
        'status': bool_no_error,
        'message': str_message,
    }
    return JsonResponse(arr_return, safe=False)


@login_required(login_url="/login/")
def calculate_upa(request):
    arr_return = []
    bool_no_error = True
    str_return = "Calculado correctamente"
    param_quantity_quotes = request.POST.get('quantity_quotes', '')
    param_total_quote = request.POST.get('total_quote', '')
    param_last_quote = request.POST.get('last_quote', '')
    param_date_first_quote = request.POST.get('date_first_quote', '')
    param_type_payment = request.POST.get('type_payment', 'Q')

    param_total_quote = float(param_total_quote) if param_total_quote else 0.00
    param_last_quote = float(param_last_quote) if param_last_quote else 0.00
    param_quantity_quotes = int(param_quantity_quotes) if param_quantity_quotes else 0

    if param_quantity_quotes <= 0:
        bool_no_error = False
        str_return = 'Ingresa una cantidad de cuotas valida'
    if param_total_quote <= 0:
        bool_no_error = False
        str_return = 'Ingresa una cantidad valida en las cuotas'

    if bool_no_error:
        prev_last_quote = float(param_total_quote)
        if param_last_quote > 0:
            prev_last_quote = param_last_quote

        quantity_quotes = int(param_quantity_quotes)
        total_quote = float(param_total_quote)
        last_quote = float(prev_last_quote)
        int_range_init = 1
        if param_type_payment == 'F':
            quantity_quotes = quantity_quotes * 2
            total_quote = total_quote / 2
            last_quote = last_quote / 2
            int_range_init = 2
        int_loop = 1
        prev_date_init = datetime.strptime(param_date_first_quote, "%Y-%m-%d")
        first_day = prev_date_init.replace(day=1)
        last_day = prev_date_init.replace(day=calendar.monthrange(prev_date_init.year, prev_date_init.month)[1])
        for x in range(int_range_init, quantity_quotes):
            if param_type_payment == 'F':
                if prev_date_init.day <= 15:
                    first_day = prev_date_init.replace(day=1)
                    last_day = prev_date_init.replace(day=15)
                    prev_date_init = prev_date_init.replace(day=16)
                else:
                    first_day = prev_date_init.replace(day=16)
                    last_day = prev_date_init.replace(day=calendar.monthrange(prev_date_init.year, prev_date_init.month)[1])

                if int_loop % 2 == 0:
                    first_day_replace = prev_date_init.replace(day=1)
                    prev_date_init = first_day_replace + relativedelta(months=1)

                arr_return.append({
                    'date_init': format( str(first_day).replace('00:00:00', '').replace(' ', '') ),
                    'date_end': format( str(last_day).replace('00:00:00', '').replace(' ', '') ),
                    'quote': format(round(total_quote, 2)),
                })
            elif param_type_payment == 'M':
                first_day = prev_date_init.replace(day=16)
                last_day = prev_date_init.replace(day=calendar.monthrange(prev_date_init.year, prev_date_init.month)[1])

                arr_return.append({
                    'date_init': format( str(first_day).replace('00:00:00', '').replace(' ', '') ),
                    'date_end': format( str(last_day).replace('00:00:00', '').replace(' ', '') ),
                    'quote': format(round(total_quote, 2)),
                })
                prev_date_init = first_day + relativedelta(months=1)
            elif param_type_payment == 'Q':
                first_day = prev_date_init.replace(day=1)
                last_day = prev_date_init.replace(day=15)

                arr_return.append({
                    'date_init': format( str(first_day).replace('00:00:00', '').replace(' ', '') ),
                    'date_end': format( str(last_day).replace('00:00:00', '').replace(' ', '') ),
                    'quote': format(round(total_quote, 2)),
                })
                prev_date_init = first_day + relativedelta(months=1)

            int_loop += 1

        if param_type_payment == 'F':
            if prev_date_init.day <= 15:
                first_day = prev_date_init.replace(day=1)
                last_day = prev_date_init.replace(day=15)
                prev_date_init = prev_date_init.replace(day=16)
            else:
                first_day = prev_date_init.replace(day=16)
                last_day = prev_date_init.replace(day=calendar.monthrange(prev_date_init.year, prev_date_init.month)[1])

            arr_return.append({
                'date_init': format( str(first_day).replace('00:00:00', '').replace(' ', '') ),
                'date_end': format( str(last_day).replace('00:00:00', '').replace(' ', '') ),
                'quote': format(round(last_quote, 2)),
            })

            if prev_date_init.day <= 15:
                first_day = prev_date_init.replace(day=1)
                last_day = prev_date_init.replace(day=15)
            else:
                first_day = prev_date_init.replace(day=16)
                last_day = prev_date_init.replace(day=calendar.monthrange(prev_date_init.year, prev_date_init.month)[1])
            arr_return.append({
                'date_init': format( str(first_day).replace('00:00:00', '').replace(' ', '') ),
                'date_end': format( str(last_day).replace('00:00:00', '').replace(' ', '') ),
                'quote': format(round(last_quote, 2)),
            })
        elif param_type_payment == 'M':
            first_day = prev_date_init.replace(day=16)
            last_day = prev_date_init.replace(day=calendar.monthrange(prev_date_init.year, prev_date_init.month)[1])
            arr_return.append({
                'date_init': format( str(first_day).replace('00:00:00', '').replace(' ', '') ),
                'date_end': format( str(last_day).replace('00:00:00', '').replace(' ', '') ),
                'quote': format(round(last_quote, 2)),
            })
        elif param_type_payment == 'Q':
            first_day = prev_date_init.replace(day=1)
            last_day = prev_date_init.replace(day=15)
            arr_return.append({
                'date_init': format( str(first_day).replace('00:00:00', '').replace(' ', '') ),
                'date_end': format( str(last_day).replace('00:00:00', '').replace(' ', '') ),
                'quote': format(round(last_quote, 2)),
            })

    arr_response = {
        'status': bool_no_error,
        'message': str_return,
        'arr_data': arr_return,
    }
    return JsonResponse(arr_response, safe=False)