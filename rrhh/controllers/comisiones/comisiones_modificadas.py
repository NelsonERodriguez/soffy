from io import BytesIO

from django.core.files.storage import FileSystemStorage
from xhtml2pdf import pisa

from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect
from django.template.loader import get_template
from django.contrib.auth.decorators import login_required

from core.functions import set_notification, get_query, execute_query, insert_query
from datetime import date, datetime
from rrhh.models import Comision_Regla, Comision_Regla_Rangos, Comision_respaldo_modificacion
from soffybiz.settings import ADJUNTOS_COMISIONES_REQUERIDO
from soffybiz.debug import DEBUG, IMAGEN_GB
from django.core.mail import EmailMessage

arr_meses = [{'id': 1, 'mes': 'Enero'},
             {'id': 2, 'mes': 'Febrero'},
             {'id': 3, 'mes': 'Marzo'},
             {'id': 4, 'mes': 'Abril'},
             {'id': 5, 'mes': 'Mayo'},
             {'id': 6, 'mes': 'Junio'},
             {'id': 7, 'mes': 'Julio'},
             {'id': 8, 'mes': 'Agosto'},
             {'id': 9, 'mes': 'Septiembre'},
             {'id': 10, 'mes': 'Octubre'},
             {'id': 11, 'mes': 'Noviembre'},
             {'id': 12, 'mes': 'Diciembre'}]


@login_required(login_url="/login/")
def index(request):
    obj_hoy = date.today()
    int_mes_actual = obj_hoy.month
    int_anio_actual = obj_hoy.year
    int_vendedor = ""

    arr_anio = [int_anio_actual-2, int_anio_actual-1, int_anio_actual, int_anio_actual+1, int_anio_actual+2]

    str_query = """
        SELECT DISTINCT no_vendedor, nombre_vendedor
        FROM NOVA..rrhh_comision_datos
        WHERE no_vendedor NOT IN (86,90)
        ORDER BY nombre_vendedor
    """
    obj_vendedores = get_query(str_query)

    arr_comisiones = []

    bool_cerrado = True

    sin_total_comision = 0
    sin_total_abono = 0
    sin_total_cajas = 0
    sin_total_supervision = 0

    obj_resumen = []
    obj_id_vendedores_dos = {}

    if request.method == 'POST':
        int_mes_post = request.POST.get('sltMes')
        int_anio_post = request.POST.get('sltAnio')
        int_vendedor = request.POST.get('sltVendedor')
        int_mes_actual = int(int_mes_post)
        int_anio_actual = int(int_anio_post)

        str_filter_vendedor = ""

        if int_vendedor and len(int_vendedor) > 0:
            str_filter_vendedor = "and rcd.no_vendedor = " + int_vendedor
            int_vendedor = int(int_vendedor)

        # SE QUITO VENTAS MAYORISTAS 2 Y 3 POR SOLICITUD DE PEDRO
        str_query = """
            select rcd.*, rcrm.archivo_respaldo
            cast(rcd.valor_comision_efectiva as float) as 'afectiva_float'
            from NOVA..rrhh_comision_datos as rcd
                LEFT JOIN NOVA..rrhh_comision_respaldo_modificacion as rcrm
                    ON rcrm.id_comision_datos = rcd.id
            where rcd.mes = %s and rcd.año = %s
            and rcd.no_vendedor NOT IN (86,90)
            and rcd.modificada = 1
            %s
        """ % (int_mes_post, int_anio_post, str_filter_vendedor)

        arr_comisiones = get_query(str_query)

        if arr_comisiones:
            if not arr_comisiones[0]["cerrado"]:
                bool_cerrado = False

        obj_id_vendedores = []
        obj_id_vendedores_dos = {}
        for row in arr_comisiones:
            if row["no_vendedor"] not in obj_id_vendedores:
                obj_id_vendedores.append(row["no_vendedor"])
                obj_id_vendedores_dos[str(row["no_vendedor"])] = {"comision": 0, "abono": 0, "cajas": 0}
                obj_id_vendedores_dos[str(row["no_vendedor"])]["no_vendedor"] = row["no_vendedor"]
                obj_id_vendedores_dos[str(row["no_vendedor"])]["nombre_vendedor"] = row["nombre_vendedor"]

            obj_id_vendedores_dos[str(row["no_vendedor"])]["comision"] += float(row["comision_pagada"])
            obj_id_vendedores_dos[str(row["no_vendedor"])]["abono"] += float(row["abono_producto"])
            obj_id_vendedores_dos[str(row["no_vendedor"])]["cajas"] += float(row["cajas_abonadas"])

            sin_total_comision += float(row["comision_pagada"])
            sin_total_abono += float(row["abono_producto"])
            sin_total_cajas += float(row["cajas_abonadas"])
            sin_total_supervision += float(row["comision_supervision"])

    data = {
        "meses": arr_meses,
        "anios": arr_anio,
        "vendedores": obj_vendedores,
        "mes_selected": int_mes_actual,
        "anio_selected": int_anio_actual,
        "vendedor_selected": int_vendedor,
        "comisiones": arr_comisiones,
        "resumen": obj_id_vendedores_dos,
        "bool_cerrado": bool_cerrado,
        "total_comision": sin_total_comision,
        "total_abono": sin_total_abono,
        "total_cajas": sin_total_cajas,
        "total_supervision": sin_total_supervision,
        "bool_adjuntos_requeridos": ADJUNTOS_COMISIONES_REQUERIDO,
    }

    return render(request, 'comisiones/comisiones_modificadas.html', data)


@login_required(login_url="/login/")
def data_comisiones(request):
    sin_total_comision = 0
    sin_total_abono = 0
    sin_total_cajas = 0

    int_mes_post = request.POST.get('sltMes')
    int_anio_post = request.POST.get('sltAnio')
    int_vendedor = request.POST.get('sltVendedor')
    int_mes_actual = int(int_mes_post)
    int_anio_actual = int(int_anio_post)

    str_filter_vendedor = ""

    if int_vendedor and len(int_vendedor) > 0:
        str_filter_vendedor = "and rcd.no_vendedor = " + int_vendedor
        int_vendedor = int(int_vendedor)

    # SE QUITO VENTAS MAYORISTAS 2 Y 3 POR SOLICITUD DE PEDRO
    str_query = """
                select rcd.*, rcrm.archivo_respaldo,
                cast(rcd.valor_comision_efectiva as float) as 'afectiva_float'
                from NOVA..rrhh_comision_datos as rcd
                    LEFT JOIN NOVA..rrhh_comision_respaldo_modificacion as rcrm
                        ON rcrm.id_comision_datos = rcd.id
                where rcd.mes = %s and rcd.año = %s
                and rcd.no_vendedor NOT IN (86,90)
                and rcd.modificado = 1
                %s
            """ % (int_mes_post, int_anio_post, str_filter_vendedor)

    arr_comisiones = get_query(str_query)

    for row in arr_comisiones:
        sin_total_comision += float(row["comision_pagada"])
        sin_total_abono += float(row["abono_producto"])
        sin_total_cajas += float(row["cajas_abonadas"])

    data = {
        "status": True,
        "msj": 'Se obtuvieron los datos de comisiones exitosamente.',
        'comisiones': arr_comisiones,
        'total_comision': sin_total_comision,
        'total_abono': sin_total_abono,
        'total_cajas': sin_total_cajas
    }

    if not arr_comisiones:
        data["status"] = False
        data["msj"] = "No se encontraron comisiones modificadas."

    return JsonResponse(data, safe=False)