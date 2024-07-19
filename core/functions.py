import pprint
import inspect
import datetime
from datetime import datetime as dtf
import json
import requests
import xmltodict
import xml.etree.ElementTree as ET
import xmljson
import threading
from collections import namedtuple
from cryptography.fernet import Fernet
from django.template.loader import get_template
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.db import connection, transaction
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from sqlescapy import sqlescape
from xhtml2pdf import pisa
from io import BytesIO
from isoweek import Week
from soffybiz.debug import DEBUG

_thread_locals = threading.local()

MONEDA_SINGULAR = 'quetzal'
MONEDA_PLURAL = 'quetzales'

CENTIMOS_SINGULAR = 'centimo'
CENTIMOS_PLURAL = 'centimos'

MAX_NUMERO = 999999999999

UNIDADES = (
    'cero',
    'uno',
    'dos',
    'tres',
    'cuatro',
    'cinco',
    'seis',
    'siete',
    'ocho',
    'nueve'
)

DECENAS = (
    'diez',
    'once',
    'doce',
    'trece',
    'catorce',
    'quince',
    'dieciséis',
    'diecisiete',
    'dieciocho',
    'diecinueve'
)

DIEZ_DIEZ = (
    'cero',
    'diez',
    'veinte',
    'treinta',
    'cuarenta',
    'cincuenta',
    'sesenta',
    'setenta',
    'ochenta',
    'noventa'
)

CIENTOS = (
    '_',
    'ciento',
    'doscientos',
    'trescientos',
    'cuatrocientos',
    'quinientos',
    'seiscientos',
    'setecientos',
    'ochocientos',
    'novecientos'
)

MESES = {
    1: "Enero",
    2: "Febrero",
    3: "Marzo",
    4: "Abril",
    5: "Mayo",
    6: "Junio",
    7: "Julio",
    8: "Agosto",
    9: "Septiembre",
    10: "Octubre",
    11: "Noviembre",
    12: "Diciembre",
}

DIAS = {
    "0": "Domingo",
    "1": "Lunes",
    "2": "Martes",
    "3": "Miércoles",
    "4": "Jueves",
    "5": "Viernes",
    "6": "Sábado",
}


def get_convert_json_response_xml(str_xml):
    try:
        arr_dic = xmltodict.parse(str_xml)
        str_json = json.dumps(arr_dic)
        arr_json = json.loads(str_json)
    except ValueError:
        arr_json = None
    return arr_json


def get_json_response_xml(response):
    str_response = response.content
    tree = ET.fromstring(str_response)
    str_xml = json.dumps(xmljson.badgerfish.data(tree))
    return json.loads(str_xml)


def get_current_user():
    return getattr(_thread_locals, 'user', None)


def middleware_user_login(get_response):
    def middleware_function(request):
        _thread_locals.user = getattr(request, 'user', None)
        response = get_response(request)
        return response

    return middleware_function


def get_query(str_sql, bool_formatting=False, params=None, print_debug=DEBUG, print_result=DEBUG):
    if print_debug:
        print('\n QUERY:\n', str_sql, '\n')
        print('\n PARAMS:\n', params, '\n')

    arr_return = []
    str_error_text = None

    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                if params:
                    cursor.execute(str_sql, params)
                else:
                    cursor.execute(str_sql)

                arr_campos = [campo[0] for campo in cursor.description]

                for row in cursor.fetchall():
                    tmp_registros = {
                        arr_campos[i]: row[i] for i in range(len(arr_campos))
                    }
                    if bool_formatting:
                        for key, valor in tmp_registros.items():
                            if isinstance(valor, dtf):
                                tmp_registros[key] = valor.strftime("%Y-%m-%d")
                            else:
                                tmp_registros[key] = format(valor)
                    arr_return.append(tmp_registros)

                if print_result:
                    print(f'\n TOP 3 DEL RESULTADO DE {len(arr_return)}:\n')
                    pprint.pp(arr_return[:3])
                    print('\n')

    except Exception as e:
        str_error_text = str(e)

    all_stack_frames = inspect.stack()
    caller_stack_frame = all_stack_frames[1]
    str_joins = [str(element) for element in params] if params is not None else ''
    str_params = ', '.join(str_joins)
    if str_error_text:
        body = f"""Error:\n {str_error_text} \n\nQuery:\n {str_sql} \n\nParams:\n {str_params} 
        \n\nPath:\n {caller_stack_frame[1]} \n\nLinea:\n {caller_stack_frame[2]} 
        \n\nUso:\n {caller_stack_frame[4]}"""
        send_email(str_subject='Error de query', str_body=body, bool_send=False)

    if params is not None:
        str_sql += ("\n PARAMS=" + str_params)
    save_log_queries(str_sql=str_sql, str_ruta=caller_stack_frame[1], str_error_text=str_error_text)

    return arr_return


def get_single_query(str_sql, bool_formatting=False, params=None, print_debug=DEBUG, print_result=DEBUG):
    if print_debug:
        print('\n QUERY:\n', str_sql, '\n')
        print('\n PARAMS:\n', params, '\n')

    single_record = {}
    str_error_text = None

    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                if params:
                    cursor.execute(str_sql, params)
                else:
                    cursor.execute(str_sql)

                arr_campos = [campo[0] for campo in cursor.description]

                row = cursor.fetchone()
                if row:
                    single_record = {
                        arr_campos[i]: row[i] for i in range(len(arr_campos))
                    }
                    if bool_formatting:
                        for key, valor in single_record.items():
                            if isinstance(valor, dtf):
                                single_record[key] = valor.strftime("%Y-%m-%d")
                            else:
                                single_record[key] = format(valor)

                if print_result:
                    print(f'\n RESULTADO:\n')
                    pprint.pp(single_record)
                    print('\n')

    except Exception as e:
        str_error_text = str(e)

    all_stack_frames = inspect.stack()
    caller_stack_frame = all_stack_frames[1]
    str_joins = [str(element) for element in params] if params is not None else ''
    str_params = ', '.join(str_joins)
    if str_error_text:
        body = f"""Error:\n {str_error_text} \n\nQuery:\n {str_sql} \n\nParams:\n {str_params} 
        \n\nPath:\n {caller_stack_frame[1]} \n\nLinea:\n {caller_stack_frame[2]} 
        \n\nUso:\n {caller_stack_frame[4]}"""
        send_email(str_subject='Error de query', str_body=body, bool_send=False)

    if params is not None:
        str_sql += ("\n PARAMS=" + str_params)
    save_log_queries(str_sql=str_sql, str_ruta=caller_stack_frame[1], str_error_text=str_error_text)

    return single_record


def execute_query(sql, params=None, print_debug=DEBUG):
    if print_debug:
        print('\n QUERY:\n', sql, '\n')
        print('\n PARAMS:\n', params, '\n')

    str_error_text = None

    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                if params:
                    cursor.execute(sql, params)
                else:
                    cursor.execute(sql)
            bool_return = True

    except Exception as e:
        str_error_text = str(e)
        bool_return = False

    all_stack_frames = inspect.stack()
    caller_stack_frame = all_stack_frames[1]
    str_joins = [str(element) for element in params] if params is not None else ''
    str_params = ', '.join(str_joins)
    if str_error_text:
        body = f"""Error:\n {str_error_text} \n\nQuery:\n {sql} \n\nParams:\n {str_params} 
        \n\nPath:\n {caller_stack_frame[1]} \n\nLinea:\n {caller_stack_frame[2],} 
        \n\nUso:\n {caller_stack_frame[4]}"""
        send_email(str_subject='Error de query', str_body=body, bool_send=False)

    if params is not None:
        sql += ("\n PARAMS=" + str_params)
    save_log_queries(str_sql=sql, str_ruta=caller_stack_frame[1], str_error_text=str_error_text)

    return bool_return


def insert_query(sql, params=None, print_debug=DEBUG):
    if print_debug:
        print('\n QUERY:\n', sql, '\n')
        print('\n PARAMS:\n', params, '\n')

    str_error_text = None
    arr_return = None

    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                if params:
                    cursor.execute(sql, params)
                else:
                    cursor.execute(sql)
                cursor.execute("SELECT @@IDENTITY AS ID")
                int_id = cursor.fetchone()[0]
                arr_return = {"id": int_id}

    except Exception as e:
        str_error_text = str(e)

    all_stack_frames = inspect.stack()
    caller_stack_frame = all_stack_frames[1]
    str_joins = [str(element) for element in params] if params is not None else ''
    str_params = ', '.join(str_joins)
    if str_error_text:
        body = f"""Error:\n {str_error_text} \n\nQuery:\n {sql} \n\nParams:\n {str_params} 
        \n\nPath:\n {caller_stack_frame[1]} \n\nLinea:\n {caller_stack_frame[2]} 
        \n\nUso:\n {caller_stack_frame[4]}"""
        send_email(str_subject='Error de query', str_body=body, bool_send=False)

    if params is not None:
        sql += ("\n PARAMS=" + str_params)
    save_log_queries(str_sql=sql, str_ruta=caller_stack_frame[1], str_error_text=str_error_text)

    return arr_return


def save_log_queries(str_sql, str_ruta, str_error_text):
    if str_ruta.find('url_access') == -1 and str_ruta.find('cron.py') == -1:
        try:
            user = get_current_user()
            if user.is_anonymous:
                email = ''
            else:
                email = user.email if user else ''
        except ValueError:
            email = ''

        try:
            cursor = connection.cursor()
            sql_log = """INSERT INTO core_query_logs (email, query, ruta, ip, query_error, created_at, updated_at)
                VALUES (%s, %s, %s, '', %s, NOW(), NOW())"""

            cursor.execute(sql_log, (email, sqlescape(str_sql), str_ruta,
                                     (sqlescape(str_error_text) if str_error_text else 'NULL')))
            cursor.close()
        except ValueError:
            pass


def send_email(str_subject, str_body='', arr_emails=settings.EMAIL_USERS, str_cc=None, str_bcc=None, bool_send=DEBUG):
    email = EmailMultiAlternatives(
        str_subject,
        str_body,
        settings.EMAIL_HOST_USER,
        arr_emails
    )
    if str_cc is not None:
        email.cc = [str_cc]
    if str_bcc is not None:
        email.bcc = [str_bcc]

    if not bool_send:
        if email.send():
            bool_book = True

        else:
            bool_book = False

    else:
        bool_book = True

    return bool_book


def dict_fetch_all(cursor):
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


def array_fetchall(cursor):
    desc = cursor.description
    nt_result = namedtuple('Result', [col[0] for col in desc])
    return [nt_result(*row) for row in cursor.fetchall()]


def get_notification(request):
    if 'notificacion' in request.session:
        notification = True
        message = request.session['notificacion_message']
        icon = request.session['notificacion_icon']
        color = request.session['notificacion_color']

        del request.session['notificacion']
        del request.session['notificacion_message']
        del request.session['notificacion_icon']
        del request.session['notificacion_color']

    else:
        notification = False
        message = ''
        icon = ''
        color = ''

    return {"notificacion": notification, "message": message, "icon": icon, "color": color}


def set_notification(request, bool_notification, str_message, str_icon, str_color):
    if 'notificacion' in request.session:
        del request.session['notificacion']
        del request.session['notificacion_message']
        del request.session['notificacion_icon']
        del request.session['notificacion_color']

    request.session['notificacion'] = bool_notification
    request.session['notificacion_message'] = str_message
    request.session['notificacion_icon'] = str_icon
    request.session['notificacion_color'] = str_color


def render_to_pdf(template_src, context_dict=None):
    if context_dict is None:
        context_dict = {}
    template = get_template(template_src)
    html = template.render(context_dict)
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    if not pdf.err:
        return HttpResponse(result.getvalue(), content_type='application/pdf')
    return None


@login_required(login_url='/login/')
def buscador(request):
    str_buscador = request.POST.get('busqueda', '')

    str_filter = f"""INNER JOIN auth_permission P ON P.content_type_id = I.id
            INNER JOIN auth_group_permissions GP ON GP.permission_id = P.id
            INNER JOIN auth_user_groups UG ON UG.group_id = GP.group_id AND UG.user_id = {request.user.id}"""

    if request.user.is_superuser or request.user.is_staff:
        str_filter = ""

    sql = f"""SELECT
                I.id, CONCAT(I.modulo, ' - ' ,I.ventana) AS ventana, I.link
            FROM
                django_content_type I
            {str_filter}
            WHERE  I.modulo <> ''
            AND I.ventana <> ''
            AND I.link <> ''
            AND I.ventana LIKE %s
            GROUP BY I.id, I.modulo, I.ventana, I.link, I.icono
            ORDER BY I.modulo, I.ventana"""

    menu = get_query(str_sql=sql, params=(f"%{str_buscador}%",), print_debug=False, print_result=False)

    data = {
        "menu": menu
    }

    return JsonResponse(data, safe=False)


def show_elements_object(obj):
    for key, value in vars(obj).items():
        print('\n', key, ":", value, '\n')


def get_last_weeks_range_dates(date_init):
    number_week = date_init.isocalendar().week
    yy = date_init.year
    arr_weeks_return = []
    if number_week <= 3:
        first_day_current_month = date_init.replace(day=1)
        last_date_year = first_day_current_month - datetime.timedelta(days=1)
        number_last_year_week = last_date_year.isocalendar().week

        if number_last_year_week == 1:
            date_last_week = first_day_current_month.replace(day=26)
            number_last_year_week = date_last_week.isocalendar().week

        if number_last_year_week > 0:
            int_last_year = last_date_year.year
            if number_week == 1:
                int_w = number_last_year_week - 2
                arr_tmp = add_weeks_return(int_last_year, int_w)
                arr_weeks_return.append(arr_tmp)

                int_w = number_last_year_week - 1
                arr_tmp = add_weeks_return(int_last_year, int_w)
                arr_weeks_return.append(arr_tmp)

                int_w = number_last_year_week
                arr_tmp = add_weeks_return(int_last_year, int_w)
                arr_weeks_return.append(arr_tmp)

                arr_tmp = add_weeks_return(yy, number_week)
                arr_weeks_return.append(arr_tmp)
            elif number_week == 2:
                int_w = number_last_year_week - 1
                arr_tmp = add_weeks_return(int_last_year, int_w)
                arr_weeks_return.append(arr_tmp)

                int_w = number_last_year_week
                arr_tmp = add_weeks_return(int_last_year, int_w)
                arr_weeks_return.append(arr_tmp)

                arr_tmp = add_weeks_return(yy, (number_week - 1))
                arr_weeks_return.append(arr_tmp)

                arr_tmp = add_weeks_return(yy, number_week)
                arr_weeks_return.append(arr_tmp)
            elif number_week == 3:
                int_w = number_last_year_week
                arr_tmp = add_weeks_return(int_last_year, int_w)
                arr_weeks_return.append(arr_tmp)

                arr_tmp = add_weeks_return(yy, (number_week - 2))
                arr_weeks_return.append(arr_tmp)

                arr_tmp = add_weeks_return(yy, (number_week - 1))
                arr_weeks_return.append(arr_tmp)

                arr_tmp = add_weeks_return(yy, number_week)
                arr_weeks_return.append(arr_tmp)
    else:
        arr_tmp = add_weeks_return(yy, (number_week - 3))
        arr_weeks_return.append(arr_tmp)

        arr_tmp = add_weeks_return(yy, (number_week - 2))
        arr_weeks_return.append(arr_tmp)

        arr_tmp = add_weeks_return(yy, (number_week - 1))
        arr_weeks_return.append(arr_tmp)

        arr_tmp = add_weeks_return(yy, number_week)
        arr_weeks_return.append(arr_tmp)

    return arr_weeks_return


def add_weeks_return(int_year, int_number_week):
    int_week = Week(int_year, int_number_week)
    return {
        'week': format(int_week.week),
        'year': format(int_year),
        'init_date': format(int_week.monday()),
        'end_date': format(int_week.sunday()),
    }


def get_horas_foxcore(request):
    if not DEBUG:

        arr_ips = ["http://172.16.10.15/iWsService",
                   "http://172.16.10.25/iWsService"]

        for ip in arr_ips:
            str_soap = """<?xml version=\"1.0\" encoding=\"utf-8\" ?>
                        <soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">
                            <soap:Body>
                                <GetAttLog><ArgComKey>0</ArgComKey><Arg><PIN></PIN></Arg></GetAttLog>
                            </soap:Body>
                        </soap:Envelope>"""
            headers = {
                'Content-Type': 'text/xml; charset=utf-8'
            }

            # POST request
            # url = "http://172.16.10.15/iWsService"
            response = requests.request(
                "POST", ip, headers=headers, data=str_soap)
            str_xml = response.text

            arr_dic = xmltodict.parse(str_xml)
            str_json = json.dumps(arr_dic)
            str_json = json.loads(str_json)

            if str_json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['GetAttLogResponse']:

                bool_register = False
                if str(type(
                        str_json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['GetAttLogResponse'][
                            'Row'])) == "<class 'list'>":
                    for row in str_json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['GetAttLogResponse']['Row']:
                        str_sql = """
                        INSERT INTO foxcore..empleado_asistencias (codigo, fecha, estatus)
                        VALUES
                        (%s, %s, %s)
                        """
                        insert_query(sql=str_sql, params=(row['PIN'], row['DateTime'], row['Status']))
                        bool_register = True

                elif str(type(
                        str_json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['GetAttLogResponse'][
                            'Row'])) == "<class 'dict'>":
                    row = str_json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['GetAttLogResponse']['Row']

                    str_sql = """
                    INSERT INTO foxcore..empleado_asistencias (codigo, fecha, estatus)
                    VALUES
                    (%s, %s, %s)
                    """
                    insert_query(sql=str_sql, params=(row['PIN'], row['DateTime'], row['Status']))
                    bool_register = True

                if bool_register:
                    str_sql = """
                    INSERT INTO foxcore..asistencia_logs (user_id, fecha)
                    VALUES
                    (1, NOW())
                    """
                    insert_query(str_sql)

                    str_soap_delete = """<?xml version=\"1.0\" encoding=\"utf-8\" ?>
                                        <soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">
                                            <soap:Body>
                                                <ClearData><ArgComKey>0</ArgComKey><Arg><Value>3</Value></Arg></ClearData>
                                            </soap:Body>
                                        </soap:Envelope>"""

                    # headers
                    headers = {
                        'Content-Type': 'text/xml; charset=utf-8'
                    }
                    # POST request
                    # url = "http://172.16.10.15/iWsService"
                    requests.request(
                        "POST", ip, headers=headers, data=str_soap_delete)
                    # str_xml = response.text

    data = {
        "status": True
    }
    return JsonResponse(data, safe=False)


def get_ultimo_dia_mes(int_mes=None, int_year=None):
    int_year_pivote = datetime.date.today().year if not int_year else int_year

    if int_mes is None:
        int_month = datetime.date.today().month
    else:
        int_month = int_mes

    if int_month + 1 > 12:
        int_mes_eval = 1
    else:
        int_mes_eval = int_month + 1

    fecha_fin = datetime.date(
        int_year_pivote, int_mes_eval, 1) - datetime.timedelta(days=1)
    return fecha_fin


def numero_a_letras(numero):
    numero_entero = int(numero)
    if numero_entero > MAX_NUMERO:
        raise OverflowError('Número demasiado alto')
    if numero_entero < 0:
        return f'menos {numero_a_letras(abs(numero))}'
    letras_decimal = ''
    parte_decimal = int(round((abs(numero) - abs(numero_entero)) * 100))
    if parte_decimal > 9:
        letras_decimal = f'punto {numero_a_letras(parte_decimal)}'
    elif parte_decimal > 0:
        letras_decimal = f'punto cero {numero_a_letras(parte_decimal)}'
    if numero_entero <= 99:
        resultado = leer_decenas(numero_entero)
    elif numero_entero <= 999:
        resultado = leer_centenas(numero_entero)
    elif numero_entero <= 999999:
        resultado = leer_miles(numero_entero)
    elif numero_entero <= 999999999:
        resultado = leer_millones(numero_entero)
    else:
        resultado = leer_millardos(numero_entero)
    resultado = resultado.replace('uno mil', 'un mil')
    resultado = resultado.strip()
    resultado = resultado.replace(' _ ', ' ')
    resultado = resultado.replace('  ', ' ')
    if parte_decimal > 0:
        resultado = f'{resultado} {letras_decimal}'
    return resultado


def numero_a_moneda(numero):
    numero_entero = int(numero)
    parte_decimal = int(round((abs(numero) - abs(numero_entero)) * 100))

    if parte_decimal == 1:
        centimos = CENTIMOS_SINGULAR
    else:
        centimos = CENTIMOS_PLURAL

    if numero_entero == 1:
        moneda = MONEDA_SINGULAR
    else:
        moneda = MONEDA_PLURAL
    letras = numero_a_letras(numero_entero)
    letras = letras.replace('uno', 'un')
    letras_decimal = f"con {numero_a_letras(parte_decimal).replace('uno', 'un')} {centimos}"
    letras = f'{letras} {moneda} {letras_decimal}'
    return letras


def leer_decenas(numero):
    if numero < 10:
        return UNIDADES[numero]
    decena, unidad = divmod(numero, 10)
    if numero <= 19:
        resultado = DECENAS[unidad]
    elif 21 <= numero <= 29:
        resultado = f'veinti{UNIDADES[unidad]}'
    else:
        resultado = DIEZ_DIEZ[decena]
        if unidad > 0:
            resultado = f'{resultado} y {UNIDADES[unidad]}'
    return resultado


def leer_centenas(numero):
    centena, decena = divmod(numero, 100)
    if decena == 0 and centena == 1:
        resultado = 'cien'
    else:
        resultado = CIENTOS[centena]
        if decena > 0:
            resultado = f'{resultado} {leer_decenas(decena)}'
    return resultado


def leer_miles(numero):
    millar, centena = divmod(numero, 1000)
    resultado = ''
    if millar == 1:
        resultado = ''
    if (millar >= 2) and (millar <= 9):
        resultado = UNIDADES[millar]
    elif (millar >= 10) and (millar <= 99):
        resultado = leer_decenas(millar)
    elif (millar >= 100) and (millar <= 999):
        resultado = leer_centenas(millar)
    resultado = f'{resultado} mil'
    if centena > 0:
        resultado = f'{resultado} {leer_centenas(centena)}'
    return resultado


def leer_millones(numero):
    millon, millar = divmod(numero, 1000000)
    resultado = ''
    if millon == 1:
        resultado = ' un millon '
    if (millon >= 2) and (millon <= 9):
        resultado = UNIDADES[millon]
    elif (millon >= 10) and (millon <= 99):
        resultado = leer_decenas(millon)
    elif (millon >= 100) and (millon <= 999):
        resultado = leer_centenas(millon)
    if millon > 1:
        resultado = f'{resultado} millones'
    if (millar > 0) and (millar <= 999):
        resultado = f'{resultado} {leer_centenas(millar)}'
    elif (millar >= 1000) and (millar <= 999999):
        resultado = f'{resultado} {leer_miles(millar)}'
    return resultado


def leer_millardos(numero):
    millardo, millon = divmod(numero, 1000000)
    return f'{leer_miles(millardo)} millones {leer_millones(millon)}'


def numero_a_monedas_v2(numero):
    numero_entero = int(numero)
    parte_decimal = int(round((abs(numero) - abs(numero_entero)) * 100))

    letras = numero_a_letras(numero_entero)
    letras_decimal = f'{parte_decimal:02n}/100 {MONEDA_PLURAL}'
    letras = f'{letras} {letras_decimal}'
    return letras


def get_first_and_last_day_month():
    now = datetime.datetime.now()
    first_day_of_month = now.replace(day=1)
    last_day_of_month = first_day_of_month + datetime.timedelta(days=32)
    last_day_of_month = last_day_of_month.replace(
        day=1) - datetime.timedelta(days=1)

    return {
        "now": now,
        "first": first_day_of_month,
        "last": last_day_of_month,
    }


def obtener_rangos_fechas(fechas):
    if not fechas:
        return []
    fechas_ordenadas = sorted(fechas)
    rangos = []
    inicio_rango = fechas_ordenadas[0]
    fin_rango = fechas_ordenadas[0]

    for fecha in fechas_ordenadas[1:]:
        diferencia_dias = (fecha - fin_rango).days

        if diferencia_dias == 1 or (fin_rango.weekday() == 5 and diferencia_dias == 2) or (
                fin_rango.weekday() == 4 and diferencia_dias == 3):
            fin_rango = fecha
        else:
            rangos.append((inicio_rango, fin_rango))
            inicio_rango = fecha
            fin_rango = fecha
    rangos.append((inicio_rango, fin_rango))

    return rangos


def encriptar_datos(datos, clave):
    f = Fernet(clave)
    datos_encriptados = f.encrypt(datos.encode())
    return datos_encriptados


def desencriptar_datos(datos_encriptados, clave):
    f = Fernet(clave)
    datos = f.decrypt(datos_encriptados).decode()
    return datos
