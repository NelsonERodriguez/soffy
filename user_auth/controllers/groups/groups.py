# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from user_auth.forms import GroupsForm
from core.functions import get_query, execute_query


@login_required(login_url="/login/")
def index(request):
    groups = Group.objects.all()
    return render(request, 'groups/groups.html', {"groups": groups})


@login_required(login_url='/login/')
def create(request):
    accesos = get_accesos(0)

    if request.method == "POST":
        form = GroupsForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            group_exist = Group.objects.filter(name=data['name']).first()
            if group_exist is None:
                group = Group.objects.create()
                save(group, data)
                message = "Registro grabado"
                icon = "add_alert"
                color = "success"
                group = Group.objects.latest('id')
                arr_accesos = request.POST.getlist('acceso[]')
                for acceso in arr_accesos:
                    sql = "INSERT INTO auth_group_permissions (group_id, permission_id) VALUES (%s, %s)"
                    execute_query(sql=sql, params=(group.id, acceso))

            else:
                message = "No se pudo grabar el registro, ya existe un grupo con ese nombre."
                icon = "warning"
                color = "danger"

            request.session['notificacion'] = True
            request.session['notificacion_message'] = message
            request.session['notificacion_icon'] = icon
            request.session['notificacion_color'] = color

            return redirect('user-groups')
        else:
            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Error al grabar el registro."
            request.session['notificacion_icon'] = "warning"
            request.session['notificacion_color'] = "danger"

    else:
        form = GroupsForm()

    return render(request, 'groups/groups_create.html', {"form": form, "accesos": accesos})


@login_required(login_url='/login/')
def edit(request, pk):
    accesos = get_accesos(pk)
    group = Group.objects.get(id=pk)

    if request.method == "POST":
        form = GroupsForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            save(group, data)
            message = "Registro grabado"
            icon = "add_alert"
            color = "success"

            sql = "DELETE FROM auth_group_permissions WHERE group_id = %s"
            execute_query(sql=sql, params=(pk,))

            arr_accesos = request.POST.getlist('acceso[]')
            for acceso in arr_accesos:
                sql = "INSERT INTO auth_group_permissions (group_id, permission_id) VALUES (%s, %s)"
                execute_query(sql=sql, params=(pk, acceso))

            request.session['notificacion'] = True
            request.session['notificacion_message'] = message
            request.session['notificacion_icon'] = icon
            request.session['notificacion_color'] = color

            return redirect('user-groups')
        else:
            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Error al actualizar el registro."
            request.session['notificacion_icon'] = "warning"
            request.session['notificacion_color'] = "danger"

    return render(request, 'groups/groups_edit.html', {"form": group, "accesos": accesos})


@login_required(login_url='/login/')
def delete(request, pk):
    sql = "DELETE FROM auth_group_permissions WHERE group_id = %s"
    execute_query(sql=sql, params=(pk,))
    Group.objects.get(id=pk).delete()
    request.session['notificacion'] = True
    request.session['notificacion_message'] = "Registro eliminado."
    request.session['notificacion_icon'] = "add_alert"
    request.session['notificacion_color'] = "success"

    return redirect('user-groups')


def save(group, data):
    group.name = data['name']
    group.save()


def get_accesos(group_id):
    sql = """SELECT [auth_permission].[id],
                CONCAT([django_content_type].[app_label], ' | ', 
                [django_content_type].[model], ' | ', [auth_permission].[name]) AS [nombre],
                [auth_group_permissions].[id] [acceso]
            FROM [NOVA]..[django_content_type]
                INNER JOIN [NOVA]..[auth_permission] ON [auth_permission].[content_type_id] = [django_content_type].[id]
            LEFT JOIN [NOVA]..[auth_group_permissions] 
            ON [auth_group_permissions].[permission_id] = [auth_permission].[id] AND [group_id] = %s"""
    return get_query(str_sql=sql, params=(group_id,))
