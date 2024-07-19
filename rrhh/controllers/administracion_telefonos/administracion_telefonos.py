from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.db.models import F, Func, Value, CharField, ExpressionWrapper, Q
from django.template.loader import render_to_string

from core.functions import get_query, set_notification, insert_query, execute_query
from django.db import connection
from datetime import datetime
from rrhh.models import Telefono, Telefono_descuento
import json


@login_required(login_url="/login/")
def index(request):

    return render(request, 'administracion_telefonos/administracion_telefonos.html')


@login_required(login_url="/login/")
def get_telefonos(request):
    str_activos = request.POST.get("strActivos")

    obj_telefonos = Telefono.objects.annotate(empleado=F('user__name')).values('id', 'numero', 'subsidio',
                                                                               'cuenta_subsidio', 'activo',
                                                                               'cuenta_descuento', 'empleado')

    if str_activos and str_activos != "":
        bool_activo = True if str_activos == "1" else False
        obj_telefonos = obj_telefonos.filter(activo=bool_activo)

    obj_list = list(obj_telefonos)

    obj_json = {
        "status": True,
        "data": obj_list,
        "msj": ""
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def edit(request):
    int_id_telefono = request.POST.get("intTelefono")

    if int_id_telefono == "0":
        telefono = {
            "activo": 1
        }
    else:
        telefono = Telefono.objects.get(id=int(int_id_telefono))

        if telefono.cuenta_descuento:
            str_query = """
            SELECT (cast(Cuenta as varchar) + ' - ' + cast(Nombre as varchar)) as name
            FROM Contabilidad..NOMENCLATURA
            WHERE Cuenta = '%s'
            ORDER BY Cuenta
            """ % str(telefono.cuenta_descuento)
            obj_cuenta_descuento = get_query(str_query)

            telefono.cuenta_descuento_texto = obj_cuenta_descuento[0]["name"]

        if telefono.cuenta_subsidio:
            str_query = """
            SELECT (cast(Cuenta as varchar) + ' - ' + cast(Nombre as varchar)) as name
            FROM Contabilidad..NOMENCLATURA
            WHERE Cuenta = '%s'
            ORDER BY Cuenta
            """ % str(telefono.cuenta_subsidio)
            obj_cuenta_subsidio = get_query(str_query)

            telefono.cuenta_subsidio_texto = obj_cuenta_subsidio[0]["name"]

    data = {
        "status": True,
        "data": telefono,
        "id_telefono": int_id_telefono,
        "msj": ""
    }

    html = render_to_string('administracion_telefonos/administracion_telefonos_edit.html', data)
    return HttpResponse(html)


@login_required(login_url="/login/")
def get_usuarios(request, search):
    str_busqueda = str(search).replace(" ", "%")

    sql = """
            SELECT id, name
            FROM NOVA..auth_user
            WHERE (name like '%%%s%%')
            ORDER BY name
        """ % str_busqueda

    obj_usuarios = get_query(sql)

    data = []

    for usuario in obj_usuarios:
        data.append({
            "id": usuario["id"],
            "name": usuario["name"]
        })

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_cuentas(request, search):
    str_busqueda = str(search).replace(" ", "%")

    sql = """
            SELECT Cuenta as id, (cast(Cuenta as varchar) + ' - ' + cast(Nombre as varchar)) as name
            FROM Contabilidad..NOMENCLATURA
            WHERE (
                Cuenta like '%%%s%%'
                or Nombre like '%%%s%%'
                or ((cast(Cuenta as varchar) + ' - ' + cast(Nombre as varchar)) like '%%%s%%'))
            ORDER BY Cuenta
        """ % (str_busqueda, str_busqueda, str_busqueda)

    obj_cuentas = get_query(sql)

    data = []

    for cuenta in obj_cuentas:
        data.append({
            "id": cuenta["id"],
            "name": cuenta["name"]
        })

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def save(request):
    int_id_telefono = request.POST.get("intTelefono")

    str_numero = request.POST.get("numero")
    str_subsidio = request.POST.get("subsidio")
    str_cuenta_subsidio = request.POST.get("cuenta_subsidio")
    str_cuenta_descuento = request.POST.get("cuenta_descuento")
    str_user_id = request.POST.get("id_usuario")
    str_activo = request.POST.get("activo", None)

    int_numero = int(str_numero) if len(str_numero) > 0 else None
    sin_subsidio = float(str_subsidio) if len(str_subsidio) > 0 else None
    int_user_id = int(str_user_id) if len(str_user_id) > 0 else None
    int_cuenta_subsidio = int(str_cuenta_subsidio) if len(str_cuenta_subsidio) > 0 else None
    int_cuenta_descuento = int(str_cuenta_descuento) if len(str_cuenta_descuento) > 0 else None
    int_activo = 1 if str_activo and len(str_activo) > 0 else 0

    obj_json = {
        "status": True,
        "data": {},
        "msj": ""
    }

    if int_id_telefono == "0":
        Telefono.objects.create(
            user_id=int_user_id,
            numero=int_numero,
            subsidio=sin_subsidio,
            cuenta_subsidio=int_cuenta_subsidio,
            cuenta_descuento=int_cuenta_descuento,
            activo=int_activo,
        )
        obj_json["msj"] = "Se guardó exitosamente el teléfono ingresado"
    else:
        obj_telefono = Telefono.objects.get(id=int(int_id_telefono))
        obj_telefono.user_id = int_user_id
        obj_telefono.numero = int_numero
        obj_telefono.subsidio = sin_subsidio
        obj_telefono.cuenta_subsidio = int_cuenta_subsidio
        obj_telefono.cuenta_descuento = int_cuenta_descuento
        obj_telefono.activo = int_activo
        obj_telefono.save()
        obj_json["msj"] = "Se actualizó exitosamente el teléfono"

    return JsonResponse(obj_json, safe=False)
