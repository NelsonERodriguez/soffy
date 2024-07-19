# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required

from core.functions import execute_query, get_query
from user_auth.models import User
from sqlescapy import sqlescape
from django.http import JsonResponse


@login_required(login_url="/login/")
def index(request):
    users = User.objects.all()
    return render(request, 'users_groups/users_groups.html', {"users": users})


@login_required(login_url='/login/')
def edit(request, pk):

    if request.method == "POST":
        arr_roles = request.POST.getlist('roles[]')
        execute_query(sql="DELETE FROM auth_user_groups WHERE user_id = %s", params=(pk,))

        for role in arr_roles:
            sql = "INSERT INTO auth_user_groups (user_id, group_id) VALUES (%s, %s)"
            execute_query(sql=sql, params=(pk, role))

        request.session['notificacion'] = True
        request.session['notificacion_message'] = "Registros actualizados."
        request.session['notificacion_icon'] = "add_alert"
        request.session['notificacion_color'] = "success"

        return redirect('user-users_groups')

    user = User.objects.get(id=pk)
    sql = """SELECT G.id, G.name
            FROM auth_user_groups AS UG
            INNER JOIN auth_group AS G ON G.id = UG.group_id
            WHERE UG.user_id = %s"""
    data = get_query(str_sql=sql, params=(pk,))

    return render(request, 'users_groups/users_groups_edit.html', {"id": pk, "user": user, "roles": data})


@login_required(login_url='/login/')
def get_group(request, search):
    sql = f"SELECT id, name FROM auth_group WHERE name LIKE '%{sqlescape(search)}%'"
    data = get_query(str_sql=sql)
    return JsonResponse(data, safe=False)
