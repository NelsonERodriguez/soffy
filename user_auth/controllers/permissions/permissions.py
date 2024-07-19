# Create your views here.
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.db import connection
from sqlescapy import sqlescape

from user_auth.forms import PermissionsForm
from core.functions import set_notification, get_query, insert_query, execute_query


@login_required(login_url="/login/")
def index(request):
    return render(request, 'permissions/permissions.html')


@login_required(login_url="/login/")
def get_permisos(request):
    draw = int(request.POST.get('draw', 1))  # Contador de solicitudes de DataTables
    start = int(request.POST.get('start', 0))  # Inicio del rango de paginación
    length = int(request.POST.get('length', 10))  # Cantidad de filas por página

    # Obtener los datos de búsqueda
    search_value = request.POST.get('search[value]', '')
    query_filter = ""

    # Filtrar según la búsqueda
    if search_value:
        str_filter = sqlescape(search_value)
        query_filter = f"""WHERE (P.name LIKE '%{str_filter}%' OR
                            P.codename LIKE '%{str_filter}%' OR
                            C.app_label LIKE '%{str_filter}%' OR
                            C.model LIKE '%{str_filter}%' OR
                            C.ventana LIKE '%{str_filter}%' OR
                            C.modulo LIKE '%{str_filter}%')"""

    str_sql = f"""SELECT 
                    P.id, P.name, P.codename, C.app_label, C.model, C.modulo, C.ventana
                FROM auth_permission P
                INNER JOIN django_content_type C ON C.id = P.content_type_id
                {query_filter}"""
    arr_permiso = get_query(str_sql=str_sql)

    length = length if length > 1 else (len(arr_permiso) if arr_permiso else 0)
    # Paginar los resultados
    paginator = Paginator(arr_permiso, length)
    page_number = start // length + 1
    page = paginator.get_page(page_number)

    # Preparar la respuesta
    data = []
    for permiso in page.object_list:
        data.append({
            "id": permiso['id'],
            "name": permiso['name'],
            "codename": permiso['codename'],
            "app_label": permiso['app_label'],
            "model": permiso['model'],
            "modulo": permiso['modulo'],
            "ventana": permiso['ventana'],
        })

    response = {
        'draw': draw,
        'recordsTotal': paginator.count,
        'recordsFiltered': paginator.count,
        'data': data,
    }
    return JsonResponse(response)


@login_required(login_url="/login/")
def create(request):
    if request.method == "POST":
        form = PermissionsForm(request.POST)

        if form.is_valid():
            post = form.cleaned_data
            sql = """
            INSERT INTO auth_permission (name, content_type_id, codename) VALUES
            (%s, %s, %s)"""
            insert_query(sql=sql, params=(post['name'], post['content_type_id'], post['codename']))
            set_notification(request, True, "Registro grabado.", "add_alert", "success")

            return redirect('user-permissions')
        else:
            set_notification(request, True, "Error al grabar el registro.", "warning", "danger")

    else:
        form = PermissionsForm()

    sql = "SELECT id, CONCAT(app_label, ' | ', model) AS app FROM django_content_type"

    data = {"modulos": get_query(str_sql=sql), "form": form}
    return render(request, 'permissions/permissions_create.html', data)


@login_required(login_url="/login/")
def edit(request, id):
    if request.method == "POST":
        form = PermissionsForm(request.POST)

        if form.is_valid():
            post = form.cleaned_data
            sql = "UPDATE auth_permission SET name = %s, content_type_id = %s, codename = %s WHERE id = %s"
            execute_query(sql=sql, params=(post['name'], post['content_type_id'], post['codename'], id))

            set_notification(request, True, "Registro grabado.", "add_alert", "success")

            return redirect('user-permissions')
        else:
            set_notification(request, True, "Error al grabar el registro.", "warning", "danger")

    cursor = connection.cursor()
    sql = "SELECT * FROM auth_permission WHERE id = %s" % id
    cursor.execute(sql)

    permiso = {}
    arr_permiso = cursor.fetchone()
    permiso['id'] = arr_permiso[0]
    permiso['name'] = arr_permiso[1]
    permiso['content_type_id'] = arr_permiso[2]
    permiso['codename'] = arr_permiso[3]

    sql = "SELECT id, CONCAT(app_label, ' | ', model) app FROM django_content_type"

    cursor.close()
    data = {"id": id, 'permiso': permiso, "modulos": get_query(str_sql=sql)}
    return render(request, 'permissions/permissions_edit.html', data)
