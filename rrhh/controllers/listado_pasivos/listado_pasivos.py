import json
from datetime import datetime
from dateutil.relativedelta import relativedelta
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from core.functions import render_to_pdf, get_query, execute_query
from django.http import HttpResponse, JsonResponse
from django.db.models import F, Value as V
from django.db.models.functions import Concat
from core.contabilidad_models import Cuentasbancos, Nomenclatura
from core.ares_models import Databases
from django.template.loader import render_to_string
from core.models import Empresas
from core.nominagb_models import EmpresasNominaGB, EmpleadosconceptosNominaGB, EmpleadosNominaGB, ConceptosNominaGB
from core.nominagbf_models import EmpresasNominaGBF, EmpleadosconceptosNominaGBF, EmpleadosNominaGBF, ConceptosNominaGBF
from core.nominagbv_models import EmpresasNominaGBV, EmpleadosconceptosNominaGBV, EmpleadosNominaGBV, ConceptosNominaGBV
from sqlescapy import sqlescape


@login_required(login_url="/login/")
def index(request):
    fecha_inicial = (datetime.today() - relativedelta(years=1)).strftime('%Y-%m-%d')
    fecha_final = datetime.today().strftime('%Y-%m-%d')

    obj_databases = Databases.objects.filter(sql_name__icontains='nomina', id__in=[46, 51, 53]).values('id', 'name',
                                                                                                       'sql_name')

    data = {
        'fecha_inicial': fecha_inicial,
        'fecha_final': fecha_final,
        'databases': obj_databases,
    }

    return render(request, 'listado_pasivos/listado_pasivos.html', data)


@login_required(login_url="/login/")
def empresas(request):
    str_id = request.POST.get("strIdNomina")
    obj_database = Databases.objects.get(id=str_id)

    if obj_database.id == 46:
        obj_empresas = list(EmpresasNominaGB.objects.values('no_empresa', 'razon_social'))
    elif obj_database.id == 51:
        obj_empresas = list(EmpresasNominaGBF.objects.values('no_empresa', 'razon_social'))
    elif obj_database.id == 53:
        obj_empresas = list(EmpresasNominaGBV.objects.values('no_empresa', 'razon_social'))
    else:
        obj_empresas = {}

    bool_error = not len(obj_empresas) > 0
    obj_json = {
        "data": {'empresas': obj_empresas},
        "status": True if not bool_error else False,
        "msj": "Se muestran las empresas de la nómina seleccionada." if not bool_error
        else "No se encontraron las empresas de la nómina seleccionada."
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def listado(request):
    str_fecha_inicial = sqlescape(request.POST.get("strFechaInicial", "") + " 00:00:00")
    str_fecha_final = sqlescape(request.POST.get("strFechaFinal", "") + " 23:59:59")
    str_nomina = sqlescape(request.POST.get("strNomina", ""))
    str_empresa = sqlescape(request.POST.get("strEmpresa", ""))
    str_empresa = "" if str_empresa == "Seleccione una empresa..." else str_empresa

    obj_database = Databases.objects.get(id=str_nomina)

    if obj_database.id == 46:
        obj_model = EmpleadosconceptosNominaGB
    elif obj_database.id == 51:
        obj_model = EmpleadosconceptosNominaGBF
    elif obj_database.id == 53:
        obj_model = EmpleadosconceptosNominaGBV
    else:
        obj_model = {}

    obj_conceptos = obj_model.objects.filter(
        fechainicio__gte=str_fecha_inicial, fechafin__lte=str_fecha_final, noconcepto=6
    )

    if str_empresa != "":
        obj_conceptos = obj_conceptos.filter(noempleado__no_empresa=str_empresa)

    obj_conceptos = obj_conceptos.annotate(
        nombre_completo=Concat(F('noempleado__nombres'), V(' '), F('noempleado__apellidos'))
    ).values(
        "noempleadosconceptos", "nombre_completo", "noconcepto__descripcion", "cantidad",
        "fechainicio", "fechafin", "numerocheque", "monto", "fechapago", "observaciones", "noempleado"
    )

    obj_json = {
        "data": list(obj_conceptos),
        "status": True if obj_conceptos else False,
        "msj": "Se muestran los conceptos para los filtros seleccionados." if obj_conceptos
        else "No se encontraron conceptos para los filtros seleccionados."
    }

    return JsonResponse(obj_json, safe=False)
