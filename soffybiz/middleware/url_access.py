from django.http import JsonResponse
from django.shortcuts import redirect
from django.db import connection
from sqlescapy import sqlescape
from core.functions import insert_query
from soffybiz.debug import DEBUG


def get_request_data_as_string(request):
    post_data = ''.join([f"&{key}={value}" for key, value in request.POST.lists()])
    get_data = ''.join([f"&{key}={value}" for key, value in request.GET.lists()])

    return {
        "POST": post_data,
        "GET": get_data
    }


class ProfileAccessWindow:

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.user.is_anonymous:

            try:
                if request.path.find('notification') == -1 and request.path.find('get_links') == -1 and \
                        request.path.find('get_styles_custom') == -1 and request.path.find('media') == -1 and \
                        request.path.find('send_notificaciones_ticket') == -1 and \
                        request.path.find('validate_login') == -1:

                    request_list = get_request_data_as_string(request)

                    str_sql = """
                        INSERT INTO Logs_Tablas..Nova_Logs (navegador, ip, email, post, get, urt, created_at) VALUES
                        (%s, %s, %s, %s, %s, %s, GETDATE())
                    """
                    if not DEBUG:
                        insert_query(sql=str_sql,
                                     params=(sqlescape(request.META['HTTP_USER_AGENT']),
                                             sqlescape(request.META['REMOTE_ADDR']),
                                             sqlescape(request.user.email), sqlescape(request_list['POST']),
                                             sqlescape(request_list['GET']), sqlescape(request.path)),
                                     print_debug=False)

            except ValueError:
                pass

            if request.user.is_superuser or request.user.is_staff:
                return self.get_response(request)
            else:
                if (request.path.find('/media/') != -1 or request.path.find('/user/password/') != -1
                        or request.path.find('/logout/') != -1 or request.path.find('/user/password_success/') != -1
                        or request.path.find('imprimir') != -1 or request.path.find('impresion') != -1
                        or request.path.find('powerbi') != -1 or request.path.find('/api-pedidos/') != -1):
                    return self.get_response(request)

                if request.path != '/index' and request.path != '/index/':

                    if request.method == 'GET':
                        cursor = connection.cursor()
                        str_filter = ''

                        if request.user.id:
                            str_filter = """INNER JOIN auth_permission P ON P.content_type_id = I.id INNER JOIN 
                            auth_group_permissions GP ON GP.permission_id = P.id INNER JOIN auth_user_groups UG ON 
                            UG.group_id = GP.group_id AND UG.user_id = %s""" % request.user.id

                        sql = """SELECT
                                    I.id, I.modulo, I.ventana, I.link, I.icono
                                FROM
                                    NOVA..django_content_type I
                                %s
                                WHERE  I.modulo <> ''
                                AND I.ventana <> ''
                                AND I.link <> ''
                                GROUP BY I.id, I.modulo, I.ventana, I.link, I.icono""" % str_filter

                        cursor.execute(sql)
                        bool_exist = 0

                        for row in cursor.fetchall():
                            str_url = '/' + row[3]
                            if not bool_exist and request.path.find(str_url) > -1 or request.path == '/index/' or \
                                    request.path == '/user/myaccount' or request.path == '/logout/':
                                bool_exist = 1

                        cursor.close()

                        if bool_exist:
                            return self.get_response(request)
                        else:
                            return redirect('home_core')

                    return self.get_response(request)
                return self.get_response(request)
        else:
            if request.path.find('/login/') != -1:
                return self.get_response(request)
            elif request.path.find('/login_fetch/') != -1:
                return self.get_response(request)
            elif request.path.find('/api-pedidos/') != -1:
                return self.get_response(request)
            elif request.path.find('/ventas/encuestas_voz_clientes/') != -1:
                return self.get_response(request)
            elif request.path.find('/compras/encuesta_proveedores/') != -1:
                return self.get_response(request)
            elif request.path.find('/compras/encuesta_proveedores/proveedor/') != -1:
                return self.get_response(request)
            elif request.path.find('/contabilidad/proveedor_contrasenas/') != -1:
                return self.get_response(request)
            elif request.path.find('get_horas_foxcore') != -1:
                return self.get_response(request)
            elif request.path.find('send_notificaciones_ticket') != -1:
                return self.get_response(request)
            elif request.path.find('/notification/') != -1:
                return self.get_response(request)
            elif request.path.find('/api_bridge') != -1:
                return self.get_response(request)
            elif request.path.find('/app_ventas/privacidad') != -1:
                return self.get_response(request)
            elif request.path.find('/creditos/encuesta_clientes/') != -1:
                return self.get_response(request)
            elif request.path.find('/public/') != -1:
                return self.get_response(request)
            elif request.path.find('/ventas/ingreso_clientes/') != -1:
                return self.get_response(request)
            else:
                if request.META.get('REQUEST_METHOD') == 'POST':
                    str_path = request.META.get('HTTP_REFERER')
                else:
                    str_path = request.META.get('PATH_INFO')
                request.session['REDIRECT_PATH'] = str_path
                request.session['REDIRECT_GET'] = request.GET.copy().urlencode()

                if request.headers.get('X-Csrftoken') or request.method == "POST":
                    return JsonResponse({
                        'status': False,
                        'session_expired': True,
                        'msj': 'Ha finalizado la sesión, vuelva a iniciar sesión.',
                        'msg': 'Ha finalizado la sesión, vuelva a iniciar sesión.'
                    }, status=200)
                else:
                    return redirect('login')
