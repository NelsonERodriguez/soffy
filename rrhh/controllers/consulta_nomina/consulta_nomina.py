from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from datetime import datetime
from dateutil.relativedelta import relativedelta
from django.template.loader import render_to_string
from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration

from core.functions import get_query, set_notification
from core.nominagb_models import EmpresasNominaGB, PeriodosNominaGB
from core.nominagbf_models import EmpresasNominaGBF, PeriodosNominaGBF
from core.nominagbv_models import EmpresasNominaGBV, PeriodosNominaGBV

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
    obj_empresas = EmpresasNominaGB.objects.filter(activa=True)
    sql = """
    SELECT
        CONCAT(CONVERT(VARCHAR, No_Empresa), ' - ', Razon_Social) AS RazonSocial, No_Empresa 
    FROM 
        NominaGB..Empresas
    WHERE
        Activa = 1
    """
    arr_empresas = get_query(sql)

    fecha_inicial = datetime.today().replace(day=1)
    fecha_final = datetime.today() + relativedelta(day=31)

    data = {
        "empresas": arr_empresas,
        "obj_empresas": obj_empresas,
        "fecha_inicial": fecha_inicial,
        "fecha_final": fecha_final,
        "data": {}
    }

    return render(request, 'consulta_nomina/consulta_nomina.html', data)


@login_required(login_url="/login/")
def get_empresas(request):
    str_nomina = request.POST.get("nomina")

    if str_nomina == "general":
        obj_base = EmpresasNominaGB
    elif str_nomina == "facturacion":
        obj_base = EmpresasNominaGBF
    elif str_nomina == "vendedores":
        obj_base = EmpresasNominaGBV
    else:
        return JsonResponse({"status": True, "msj": 'No se eligió una nómina correcta.', "empresas": {}}, safe=False)

    obj_empresas = obj_base.objects.filter(activa=True).values("no_empresa", "razon_social")

    return JsonResponse({"status": True, "msj": 'Se cambió la nómina.', "empresas": list(obj_empresas)}, safe=False)


@login_required(login_url="/login/")
def get_periodos(request):
    str_nomina = request.POST.get("nomina")
    str_empresa = request.POST.get("empresa")

    if str_nomina == "general":
        obj_base = PeriodosNominaGB
    elif str_nomina == "facturacion":
        obj_base = PeriodosNominaGBF
    elif str_nomina == "vendedores":
        obj_base = PeriodosNominaGBV
    else:
        return JsonResponse({"status": True, "msj": 'No se eligió una empresa correcta.', "periodos": {}}, safe=False)

    obj_periodos = obj_base.objects.filter(no_empresa=str_empresa).values(
        "tipo_periodo", "no_periodo", "fecha_inicial__date", "fecha_final__date"
    ).order_by("-fecha_final", "fecha_inicial", )[0:27]

    return JsonResponse({"status": True, "msj": 'Se cambió la empresa.', "periodos": list(obj_periodos)}, safe=False)


@login_required(login_url="/login/")
def get_nomina(request):
    str_nomina = request.POST.get("nomina")
    str_empresa = request.POST.get("empresa")
    str_periodo = request.POST.get("periodo")

    if str_nomina == "general":
        obj_base = PeriodosNominaGB
        str_base = "NominaGB"
    elif str_nomina == "facturacion":
        obj_base = PeriodosNominaGBF
        str_base = "NominaGBF"
    elif str_nomina == "vendedores":
        obj_base = PeriodosNominaGBV
        str_base = "NominaGBV"
    else:
        return JsonResponse({"status": False, "msj": 'No se eligió una empresa correcta.', "data": {}}, safe=False)

    obj_periodo = obj_base.objects.filter(no_empresa=str_empresa, no_periodo=str_periodo).first()

    sql = f"""
        exec {str_base}..CreaNomina2 {str_empresa}, '{obj_periodo.tipo_periodo}', {str_periodo}
    """

    data = get_query(sql)

    obj_json = {
        "status": True,
        "msj": "Se muestra la nómina.",
        "data": data
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def get_impresion(request):
    str_nomina = request.POST.get("hdnNomina", None)
    str_empresa = request.POST.get("hdnEmpresa", None)
    str_periodo = request.POST.get("hdnPeriodo", None)

    if str_nomina == "general":
        obj_base = PeriodosNominaGB
        str_base = "NominaGB"
        obj_base_empresa = EmpresasNominaGB
    elif str_nomina == "facturacion":
        obj_base = PeriodosNominaGBF
        str_base = "NominaGBF"
        obj_base_empresa = EmpresasNominaGBF
    elif str_nomina == "vendedores":
        obj_base = PeriodosNominaGBV
        obj_base_empresa = EmpresasNominaGBV
        str_base = "NominaGBV"
    else:
        set_notification(request, True, "No se eligieron correctamente los filtros", "warning", "danger")
        return redirect('rrhh-consulta_nomina')

    if ((str_nomina and str_nomina == "0") or (str_empresa and str_empresa == "0")
            or (str_periodo and str_periodo == "0")):
        set_notification(request, True, "No se eligieron correctamente los filtros", "warning", "danger")
        return redirect('rrhh-consulta_nomina')

    obj_periodo = obj_base.objects.filter(no_empresa=str_empresa, no_periodo=str_periodo).first()

    int_mes = obj_periodo.fecha_inicial.strftime('%m')
    int_anio = obj_periodo.fecha_final.strftime('%Y')

    filtro = filter(lambda x: x['id'] == int(int_mes), arr_meses)
    resultado = next(filtro, None)

    str_titulo = ""
    if obj_periodo.tipo_periodo == "Q":
        str_titulo = "Primera quincena del mes de "+resultado["mes"] + " de " + int_anio
    if obj_periodo.tipo_periodo == "M":
        str_titulo = "Segunda quincena del mes de "+resultado["mes"] + " de " + int_anio
    if obj_periodo.tipo_periodo == "E":
        str_titulo = "Pago Extraordinario " + int_anio
    if obj_periodo.tipo_periodo == "B":
        str_titulo = "Bono 14 del año " + int_anio
    if obj_periodo.tipo_periodo == "A":
        str_titulo = "Aguinaldo del año " + int_anio

    obj_empresa = obj_base_empresa.objects.get(no_empresa=str_empresa)

    sql = f"""
        exec {str_base}..CreaNomina2 {str_empresa}, '{obj_periodo.tipo_periodo}', {str_periodo}
    """

    obj_nomina = get_query(sql)

    arr_datos = {}

    arr_general = {
        "tot_sueldo_ordinario": 0,
        "tot_bonificacion_productividad": 0,
        "tot_otros_ingresos": 0,
        "tot_bonificacion": 0,
        "tot_horas_extras": 0,
        "tot_vacaciones": 0,
        "tot_total_devengado": 0,

        "tot_igss": 0,
        "tot_isr": 0,
        "tot_creditos": 0,
        "tot_prestamo": 0,
        "tot_celular": 0,
        "tot_otros_descuentos": 0,
        "tot_liquido": 0,
    }

    for value in obj_nomina:
        if not value['No_Depto'] in arr_datos:
            arr_datos[value['No_Depto']] = {
                "detalles": [],
                "no_depto": value['No_Depto'],
                "nombre": value['NombreDepto'],
                "tot_sueldo_ordinario": 0,
                "tot_bonificacion_productividad": 0,
                "tot_otros_ingresos": 0,
                "tot_bonificacion": 0,
                "tot_horas_extras": 0,
                "tot_vacaciones": 0,
                "tot_total_devengado": 0,

                "tot_igss": 0,
                "tot_isr": 0,
                "tot_creditos": 0,
                "tot_prestamo": 0,
                "tot_celular": 0,
                "tot_otros_descuentos": 0,
                "tot_liquido": 0,
            }

        arr_datos[value['No_Depto']]["detalles"].append(value)

        arr_datos[value['No_Depto']]["tot_sueldo_ordinario"] += value["Sueldo_Ordinario"]
        arr_datos[value['No_Depto']]["tot_bonificacion_productividad"] += value["Bonificacion_Productividad"]
        arr_datos[value['No_Depto']]["tot_otros_ingresos"] += value["OtrosIngresos"]
        arr_datos[value['No_Depto']]["tot_bonificacion"] += value["Bonificacion"]
        arr_datos[value['No_Depto']]["tot_horas_extras"] += value["Horas_Extras"]
        arr_datos[value['No_Depto']]["tot_vacaciones"] += value["Vacaciones"]
        arr_datos[value['No_Depto']]["tot_total_devengado"] += value["Total_Devengado"]

        arr_datos[value['No_Depto']]["tot_igss"] += value["IGSS"]
        arr_datos[value['No_Depto']]["tot_isr"] += value["ISR"]
        arr_datos[value['No_Depto']]["tot_creditos"] += value["Creditos"]
        arr_datos[value['No_Depto']]["tot_prestamo"] += value["Prestamo"]
        arr_datos[value['No_Depto']]["tot_celular"] += value["Celular"]
        arr_datos[value['No_Depto']]["tot_otros_descuentos"] += value["OtrosDescuentos"]
        arr_datos[value['No_Depto']]["tot_liquido"] += value["Liquido"]

        arr_general["tot_sueldo_ordinario"] += value["Sueldo_Ordinario"]
        arr_general["tot_bonificacion_productividad"] += value["Bonificacion_Productividad"]
        arr_general["tot_otros_ingresos"] += value["OtrosIngresos"]
        arr_general["tot_bonificacion"] += value["Bonificacion"]
        arr_general["tot_horas_extras"] += value["Horas_Extras"]
        arr_general["tot_vacaciones"] += value["Vacaciones"]
        arr_general["tot_total_devengado"] += value["Total_Devengado"]

        arr_general["tot_igss"] += value["IGSS"]
        arr_general["tot_isr"] += value["ISR"]
        arr_general["tot_creditos"] += value["Creditos"]
        arr_general["tot_prestamo"] += value["Prestamo"]
        arr_general["tot_celular"] += value["Celular"]
        arr_general["tot_otros_descuentos"] += value["OtrosDescuentos"]
        arr_general["tot_liquido"] += value["Liquido"]

    data = {
        "fecha_actual": datetime.now(),
        "periodo": obj_periodo,
        "empresa": obj_empresa,
        "datos": arr_datos,
        "general": arr_general,
        "titulo": str_titulo,
    }
    html = render_to_string("consulta_nomina/consulta_nomina_impresion.html", data)

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; Nomina.pdf"

    font_config = FontConfiguration()
    HTML(string=html).write_pdf(response, font_config=font_config)

    return response
