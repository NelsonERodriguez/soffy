# Create your views here.
import os.path
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import _get_user_session_key, update_session_auth_hash
from django.contrib.auth.views import PasswordChangeView
from django.http import HttpResponseRedirect
from django.urls import reverse_lazy
from django.core.files.storage import FileSystemStorage
from user_auth.models import User
from user_auth.forms import UserForms, PasswordChangingForm
from core.functions import get_query
from datetime import datetime


@login_required(login_url="/login/")
def index(request):
    return render(request, 'index.html')


@login_required(login_url="/login/")
def myaccount(request):
    user_id = _get_user_session_key(request)
    user = User.objects.get(id=user_id)

    if request.method == "POST":
        form = UserForms(request.POST)

        if form.is_valid():
            data = form.cleaned_data

            file = request.FILES.get('avatar')

            if file:
                path = 'media/' + user.avatar.name
                if user.avatar and os.path.exists(path):
                    os.remove(path)

                fs = FileSystemStorage()
                name = fs.save('%s_%s' % (user.nickname, file.name), file)
                url = name
            else:
                path = 'media/' + user.avatar.name

                if user.avatar and os.path.exists(path):
                    url = user.avatar
                else:
                    url = ''

            user.first_name = data['first_name']
            user.last_name = data['last_name']
            user.name = data['name']
            user.email = data['email']
            user.avatar = url
            user.save()

            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Usuario actualizada."
            request.session['notificacion_icon'] = "add_alert"
            request.session['notificacion_color'] = "success"

            return redirect('myaccount')
        else:
            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Usuario no actualizado."
            request.session['notificacion_icon'] = "warning"
            request.session['notificacion_color'] = "danger"

    else:
        form = UserForms()

    data = {"user": user, "form": form, "form_detail": ""}
    return render(request, 'usuarios/myaccount.html', data)


class PasswordsChangeView(PasswordChangeView):
    form_class = PasswordChangingForm
    success_url = reverse_lazy('user-success_password')

    def form_valid(self, form):
        form.save()
        # Updating the password logs out all other sessions for the user
        # except the current one.
        update_session_auth_hash(self.request, form.user)
        user = User.objects.get(id=self.request.user.id)
        # user.ue_password = self.request.POST['new_password1']
        user.save()
        return HttpResponseRedirect(self.get_success_url())


@login_required(login_url="/login/")
def password_success(request):
    return render(request, 'usuarios/success_password.html')


@login_required(login_url="/login/")
def users(request):

    if request.method == "POST":
        int_user_id = request.POST.get('user_id', 0)
        if int_user_id:
            str_sql_user = """
                SELECT 
                    * 
                FROM 
                    ares..users 
                WHERE
                    id = %s
            """ % int_user_id
            arr_user = get_query(str_sql_user)[0]
            int_empleado = arr_user['empleado_id'] if arr_user['empleado_id'] else 0

            str_query_empresa = """
            select nce.id
            from ares..users as au
            join ares..empleados_base as eb
                on eb.empleado_id = au.empleado_id
                and eb.base_id in(46)
                and eb.fecha_baja is null
            join NominaGB..Empleados as nem on nem.No_Empleado = eb.no_empleado and nem.Fecha_Baja is null
            join NominaGB..Empresas as nes on nes.No_Empresa = nem.No_Empresa
            join NOVA..core_empresas as nce on nes.NoEmpresaConta = nce.no_empresa_conta
            where au.id = %s
            
            union all
            
            select nce.id
            from ares..users as au
            join ares..empleados_base as eb
                on eb.empleado_id = au.empleado_id
                and eb.base_id in(51)
                and eb.fecha_baja is null
            join NominaGBF..Empleados as nem on nem.No_Empleado = eb.no_empleado and nem.Fecha_Baja is null
            join NominaGBF..Empresas as nes on nes.No_Empresa = nem.No_Empresa
            join NOVA..core_empresas as nce on nes.NoEmpresaConta = nce.no_empresa_conta
            where au.id = %s
            
            union all
            
            select nce.id
            from ares..users as au
            join ares..empleados_base as eb
                on eb.empleado_id = au.empleado_id
                and eb.base_id in(53)
                and eb.fecha_baja is null
            join NominaGBV..Empleados as nem on nem.No_Empleado = eb.no_empleado and nem.Fecha_Baja is null
            join NominaGBV..Empresas as nes on nes.No_Empresa = nem.No_Empresa
            join NOVA..core_empresas as nce on nes.NoEmpresaConta = nce.no_empresa_conta
            where au.id = %s
            """ % (int_user_id, int_user_id, int_user_id)

            obj_query_empresa = get_query(str_query_empresa)

            int_empresa = obj_query_empresa[0]["id"] if obj_query_empresa else None

            User.objects.create(
                id=int_user_id,
                name=arr_user['name'],
                email=arr_user['email'],
                password='pbkdf2_sha256$180000$sha$sgbiQxJhnKdeZYtRRqOBB42ATFYU4If99FjrmbzD4tc=',
                active=True,
                date_joined=datetime.now(),
                is_active=True,
                empleado_id=int_empleado,
                empresa_id=int_empresa,
            )

    str_sql_users = """
        SELECT
            AU.*
        FROM
            ares..users AS AU
        LEFT JOIN NOVA..auth_user AS NU ON AU.id = NU.id
        WHERE
            NU.id IS NULL    
    """

    arr_users = get_query(str_sql_users)

    data = {
        "users": arr_users
    }

    return render(request, "usuarios/users.html", data)
