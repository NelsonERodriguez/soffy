# Create your views here.
import os.path
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import _get_user_session_key, update_session_auth_hash
from django.contrib.auth.views import PasswordChangeView
from django.http import HttpResponseRedirect, JsonResponse
from django.urls import reverse_lazy
from django.core.files.storage import FileSystemStorage
from user_auth.models import User
from user_auth.forms import UserForms, PasswordChangingForm
from core.functions import get_query, execute_query
from datetime import datetime
from core.models import User_departamento, Departamento, Empresas

from django.db.models import F, Q


@login_required(login_url="/login/")
def index(request):
    obj_empresas = list(Empresas.objects.values("id", "nombre"))
    obj_deptos = list(Departamento.objects.values("id", "nombre"))

    str_query_empleados = """
            SELECT id, nombre + ' ' + apellido as full_name
            FROM ares..empleados_master
        """

    obj_query_empleados = get_query(str_query_empleados)

    data = {
        "empresas": obj_empresas,
        "deptos": obj_deptos,
        "empleados": obj_query_empleados
    }

    return render(request, 'admin_usuarios/admin_usuarios.html', data)


@login_required(login_url="/login/")
def get_data_incompleta(request):
    obj_users = list(User.objects.annotate(nombre_empresa=F('empresa__nombre'))
                         .annotate(departamento_id=F('user_departamento__departamento'),
                                   nombre_departamento=F('user_departamento__departamento__nombre'))
                         .filter((Q(empresa=None) | Q(empleado_id=None) | Q(empleado_id=0)
                                 | Q(user_departamento__departamento=None)), is_active=1)
                         .values('id', 'name', 'email', 'empleado_id', 'empresa_id',
                                 'nombre_empresa', 'usuario', 'nombre_departamento'))

    obj_json = {
        "status": True,
        "data": obj_users,
        "msj": ""
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def get_data_completa(request):
    obj_users = list(User.objects.annotate(nombre_empresa=F('empresa__nombre'))
                         .annotate(departamento_id=F('user_departamento__departamento'),
                                   nombre_departamento=F('user_departamento__departamento__nombre'))
                         .filter(empresa__isnull=False, empleado_id__isnull=False, empleado_id__gt=0,
                                 departamento_id__isnull=False, is_active=1)
                         .values('id', 'name', 'email', 'empleado_id', 'empresa_id',
                                 'nombre_empresa', 'usuario', 'nombre_departamento'))

    obj_json = {
        "status": True,
        "data": obj_users,
        "msj": ""
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def get_data_inactivo(request):
    obj_users = list(User.objects.annotate(nombre_empresa=F('empresa__nombre'))
                         .annotate(departamento_id=F('user_departamento__departamento'),
                                   nombre_departamento=F('user_departamento__departamento__nombre'))
                         .filter(is_active=0)
                         .values('id', 'name', 'email', 'empleado_id', 'empresa_id',
                                 'nombre_empresa', 'usuario', 'nombre_departamento'))

    obj_json = {
        "status": True,
        "data": obj_users,
        "msj": ""
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def get_data_user(request):
    str_id = request.POST.get("user_id", "0")
    int_id = int(str_id)

    obj_users = (User.objects.annotate(nombre_empresa=F('empresa__nombre'),
                                       departamento_id=F('user_departamento__departamento__id'))
                 .values('id', 'name', 'email', 'empleado_id', 'empresa_id',
                         'nombre_empresa', 'usuario', 'departamento_id').get(id=int_id))

    obj_user = User.objects.get(id=int_id)

    obj_json = {
        "status": True,
        "data": {},
        "data_user": obj_users,
        "msj": ""
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def update_data_user(request):
    str_id = request.POST.get("user_id", "0")
    str_empleado_id = request.POST.get("empleado_id", "0")
    str_empresa_id = request.POST.get("empresa_id", "0")
    str_departamento_id = request.POST.get("departamento_id", "0")
    int_id = int(str_id)

    obj_user = User.objects.get(id=int_id)

    if str_empresa_id and str_empresa_id != "0":
        obj_user.empresa_id = int(str_empresa_id)

    if str_empleado_id and str_empleado_id != "0":
        obj_user.empleado_id = int(str_empleado_id)

    obj_user.save()

    if str_departamento_id and str_departamento_id != "0":
        obj_user_dpt = User_departamento.objects.filter(user_id=int_id).first()

        if obj_user_dpt:
            obj_user_dpt.departamento_id = int(str_departamento_id)
            obj_user_dpt.activo = 1
            obj_user_dpt.save()
        else:
            User_departamento.objects.create(
                user_id=int_id,
                departamento_id=int(str_departamento_id),
                activo=1,
                es_admin=0
            )

    obj_json = {
        "status": True,
        "data": {},
        "msj": "Usuario actualizado exitosamente."
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def desactivar_user(request):
    str_id = request.POST.get("user_id", "0")
    int_id = int(str_id)

    obj_user = User.objects.get(id=int_id)
    obj_user.is_active = 0
    obj_user.save()

    str_query = f"""
        UPDATE ares..Users SET active = 0 WHERE id = {str_id}
    """
    execute_query(str_query)

    obj_json = {
        "status": True,
        "data": {},
        "msj": "Usuario desactivado exitosamente."
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def activar_user(request):
    str_id = request.POST.get("user_id", "0")
    int_id = int(str_id)

    obj_user = User.objects.get(id=int_id)
    obj_user.is_active = 1
    obj_user.save()

    str_query = f"""
        UPDATE ares..Users SET active = 1 WHERE id = {str_id}
    """
    execute_query(str_query)

    obj_json = {
        "status": True,
        "data": {},
        "msj": "Usuario activado exitosamente."
    }

    return JsonResponse(obj_json, safe=False)


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
            select nes.NoEmpresaConta
            from NOVA..auth_user as au
            join ares..empleados_base as eb
                on eb.empleado_id = au.empleado_id
                and eb.base_id in(46)
                and eb.fecha_baja is null
            join NominaGB..Empleados as nem on nem.No_Empleado = eb.no_empleado and nem.Fecha_Baja is null
            join NominaGB..Empresas as nes on nes.No_Empresa = nem.No_Empresa
            where au.id = %s
            
            union all
            
            select nes.NoEmpresaConta
            from NOVA..auth_user as au
            join ares..empleados_base as eb
                on eb.empleado_id = au.empleado_id
                and eb.base_id in(46, 51, 53)
                and eb.fecha_baja is null
            join NominaGBF..Empleados as nem on nem.No_Empleado = eb.no_empleado and nem.Fecha_Baja is null
            join NominaGBF..Empresas as nes on nes.No_Empresa = nem.No_Empresa
            where au.id = %s
            
            union all
            
            select nes.NoEmpresaConta
            from NOVA..auth_user as au
            join ares..empleados_base as eb
                on eb.empleado_id = au.empleado_id
                and eb.base_id in(46, 51, 53)
                and eb.fecha_baja is null
            join NominaGBV..Empleados as nem on nem.No_Empleado = eb.no_empleado and nem.Fecha_Baja is null
            join NominaGBV..Empresas as nes on nes.No_Empresa = nem.No_Empresa
            where au.id = %s
            """ % (int_user_id, int_user_id, int_user_id)

            obj_query_empresa = get_query(str_query_empresa)

            int_empresa = obj_query_empresa[0]["NoEmpresaConta"] if obj_query_empresa else None

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
