from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import set_notification
from core.models import Paises as M
from core.forms import PaisesForm as F
from core.functions import get_query, get_single_query, execute_query


@login_required(login_url="/login/")
def index(request):
    str_query = """SELECT * FROM django_content_type
            WHERE app_label NOT IN ('user_auth', 'durin',
                'api_bridge', 'contenttypes', 'sessions', 'admin')"""
    data = get_query(str_query)
    data = {
        "data": data
    }
    return render(request, 'crear_ventanas/crear_ventanas.html', data)


@login_required(login_url="/login/")
def edit(request, pk):
    str_query = f"""SELECT * FROM django_content_type
            WHERE id = {pk}"""
    data = get_single_query(str_query)

    bool_change = request.user.is_superuser
    if request.method == 'POST':
        modulo = request.POST.get('modulo', '').strip()
        ventana = request.POST.get('ventana', '').strip()
        link = request.POST.get('link', '').strip()
        icono = request.POST.get('icono', '').strip()
        sub_modulo = request.POST.get('sub_modulo', '')
        qry_save = f"""UPDATE django_content_type
                        SET modulo = '{modulo}', ventana = '{ventana}',
                        link = '{link}', icono = '{icono}',
                        sub_modulo = '{sub_modulo}'
                    WHERE id = {pk}"""
        execute_query(qry_save)
            
        set_notification(request, True, "Guardado exitosamente.", "add_alert", "success")
        return redirect('core-crear_ventanas')

    data_return = {
        "form": data,
        "bool_change": bool_change
    }
    return render(request, 'crear_ventanas/crear_ventanas_edit.html', data_return)