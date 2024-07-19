# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.forms import InterfazForm
from django.http import QueryDict, JsonResponse
from core.functions import get_query, execute_query, get_single_query
from user_auth.models import User


@login_required(login_url="/login/")
def index(request):
    interfaces = get_query(str_sql="SELECT * FROM django_content_type")
    return render(request, 'interfaces/interfaces.html', {"interfaces": interfaces})


@login_required(login_url="/login/")
def edit(request, pk):
    interfaces = get_single_query(str_sql="SELECT * FROM django_content_type WHERE id = %s", params=[pk])

    if not interfaces:
        request.session['notificacion'] = True
        request.session['notificacion_message'] = "El registro seleccionado no existe."
        request.session['notificacion_icon'] = "warning"
        request.session['notificacion_color'] = "danger"

        return redirect('core-interfaces')

    if request.method == "POST":
        form = InterfazForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            sql = """UPDATE django_content_type SET modulo = %s, ventana = %s, link = %s, icono = %s, sub_modulo = %s 
                    WHERE id = %s"""
            execute_query(sql=sql, params=(data['modulo'], data['ventana'], data['link'], data['icono'],
                                           data['sub_modulo'], pk))

            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Registro actualizado"
            request.session['notificacion_icon'] = "add_alert"
            request.session['notificacion_color'] = "success"

            return redirect("core-interfaces")
        else:
            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Error al actualizar el registro."
            request.session['notificacion_icon'] = "warning"
            request.session['notificacion_color'] = "danger"

    else:
        data = QueryDict('modulo=%s&ventana=%s&link=%s&icono=%s'
                         % (interfaces['modulo'], interfaces['ventana'], interfaces['link'], interfaces['icono']))

        form = InterfazForm(data)

    data = {"form": form, "id": pk, "app_label": interfaces['app_label'], "model": interfaces['model'],
            "modulo": interfaces['modulo'], "ventana": interfaces['ventana'],
            "link": interfaces['link'], "icono": interfaces['icono'], "sub_modulo": interfaces['sub_modulo']}
    return render(request, 'interfaces/intefaces_edit.html', data)


@login_required(login_url="/login/")
def create(request):
    sql = "SELECT app_label AS app FROM django_content_type GROUP BY app_label"
    modulos = get_query(str_sql=sql)

    form = None
    if request.method == "POST":
        form = InterfazForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            sql = """INSERT INTO django_content_type (app_label, model, modulo, ventana, link, icono, sub_modulo) VALUES 
                     (%s, %s, %s, %s, %s, %s, %s)"""

            execute_query(sql=sql,
                          params=(data['app_label'], data['model'], data['modulo'], data['ventana'], data['link'],
                                  data['icono'], data['sub_modulo']))
            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Registro grabado"
            request.session['notificacion_icon'] = "add_alert"
            request.session['notificacion_color'] = "success"

            return redirect("core-interfaces")
        else:
            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Error al grabar el registro."
            request.session['notificacion_icon'] = "warning"
            request.session['notificacion_color'] = "danger"

    data = {"modulos": modulos, "form": form}
    return render(request, 'interfaces/intefaces_create.html', data)


def get_interfaces(pk):
    sql = "SELECT * FROM django_content_type"

    if pk:
        sql += f" WHERE id = {pk}"

    return get_query(str_sql=sql)


@login_required(login_url='/login/')
def get_links(request, pk):
    user = User.objects.get(id=pk)
    str_filter = f"""INNER JOIN auth_permission P ON P.content_type_id = I.id
            INNER JOIN auth_group_permissions GP ON GP.permission_id = P.id
            INNER JOIN auth_user_groups UG ON UG.group_id = GP.group_id AND UG.user_id = {pk}"""

    if user.is_superuser or user.is_staff:
        str_filter = ""

    str_order = "ASC"
    if request.user.id == 69:
        str_order = "DESC"

    sql = f"""SELECT
                I.id, I.modulo, I.ventana, I.link, I.icono, I.sub_modulo
            FROM
                django_content_type I
            {str_filter}
            WHERE  I.modulo <> ''
            AND I.ventana <> ''
            AND I.link <> ''
            GROUP BY I.id, I.modulo, I.ventana, I.link, I.icono, I.sub_modulo
            ORDER BY I.modulo, I.sub_modulo, I.ventana {str_order}"""

    return JsonResponse(get_query(str_sql=sql, print_debug=False, print_result=False), safe=False)
