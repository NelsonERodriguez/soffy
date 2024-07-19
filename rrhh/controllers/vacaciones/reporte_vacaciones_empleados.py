import json
from datetime import datetime, timedelta
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.db.models import F, Func, Value, DateField, Q, CharField
from django.db.models.functions import Concat, Cast
from core.models import Departamento
from user_auth.models import User
from core.nominagb_models import EmpleadosconceptosNominaGB, EmpleadosNominaGB
from core.nominagbf_models import EmpleadosconceptosNominaGBF
from core.nominagbv_models import EmpleadosconceptosNominaGBV
from core.ares_models import EmpleadosBase, EmpleadosMaster


class DateFormatHistorial(Func):
    function = 'FORMAT'
    template = "%(function)s(%(expressions)s, 'yyyy-MM-dd')"


class DateFormatFinHistorial(Func):
    function = 'FORMAT'
    template = "%(function)s(DATEADD(day, 1, %(expressions)s), 'yyyy-MM-dd')"


@login_required(login_url="/login/")
def index(request):
    obj_departamentos = Departamento.objects.all()

    obj_no_empleados = list(EmpleadosNominaGB.objects.filter(
        fecha_alta__isnull=False,
        fecha_baja__isnull=True
    ).values_list('no_empleado', flat=True))

    obj_empleados = EmpleadosBase.objects.filter(
        no_empleado__in=obj_no_empleados,
        base_id=46
    ).annotate(
        nombre_completo=Concat('empleado_id__nombre', Value(' '), 'empleado_id__apellido')
    ).values('nombre_completo', 'no_empleado', 'empleado_id')

    data = {
        "departamentos": obj_departamentos,
        "empleados_master": obj_empleados,
    }

    return render(request, 'vacaciones/reporte_vacaciones_empleados.html', data)


@login_required(login_url="/login/")
def get_empleados(request):
    str_departamento = request.POST.get("strDepartamento")

    obj_users = User.objects.filter(
        empleado_id__isnull=False
    )

    if str_departamento != "":
        obj_users = obj_users.filter(
            user_departamento__departamento_id=int(str_departamento),
            user_departamento__activo=True,
        )

    obj_users = list(obj_users.values_list('empleado_id', flat=True))

    obj_empleados = list(EmpleadosBase.objects.filter(
        empleado_id__in=obj_users,
        fecha_alta__isnull=False,
        fecha_baja__isnull=True,
        base_id=46
    ).annotate(
        nombre_completo=Concat('empleado_id__nombre', Value(' '), 'empleado_id__apellido')
    ).values('nombre_completo', 'no_empleado', 'empleado_id'))

    bool_error = not len(obj_empleados) > 0
    obj_json = {
        "data": {'empleados': obj_empleados},
        "status": True if not bool_error else False,
        "msj": "Se muestran los empleados del departamento seleccionado." if not bool_error
        else "No se encontraron empleados para los departamentos seleccionados."
    }

    return JsonResponse(obj_json, safe=False)


@login_required(login_url="/login/")
def data(request):
    str_year = request.POST.get("intYear", "0")
    str_departamento = request.POST.get("strDepartamento")
    str_empleado = request.POST.get("strEmpleado")
    int_year = int(str_year)

    obj_users = User.objects.filter(
        empleado_id__isnull=False
    )

    if str_empleado != "0":
        obj_users = obj_users.filter(
            empleado_id=int(str_empleado),
        )
    elif str_departamento != "":
        obj_users = obj_users.filter(
            user_departamento__departamento_id=int(str_departamento),
            user_departamento__activo=True,
        )

    obj_users = list(obj_users.values_list('empleado_id', flat=True))

    no_empleado = list(
        EmpleadosBase.objects.filter(empleado_id__in=obj_users, base_id=46).values_list('no_empleado', flat=True))

    empleados_conceptos_gb = EmpleadosconceptosNominaGB.objects.exclude(
        noestado=3,
    ).filter(
        noconcepto=1,
        fechainicio__year=int_year,
        fechafin__year=int_year,
        fechainicio__gte=F('fechafin') - timedelta(days=365)
    )

    if str_departamento != "" or str_empleado != "0":
        empleados_conceptos_gb = empleados_conceptos_gb.filter(noempleado__in=no_empleado)

    empleados_conceptos_gb = list(empleados_conceptos_gb.annotate(
        start=DateFormatHistorial('fechainicio'),
        end=DateFormatFinHistorial('fechafin'),
        title=Concat(Cast('noempleado__no_empleado', output_field=CharField()),
                     Value(' - ', output_field=CharField()), 'noempleado__nombres',
                     Value(' ', output_field=CharField()), 'noempleado__apellidos'),
    ).values('start', 'end', 'title'))

    no_empleado = list(
        EmpleadosBase.objects.filter(empleado_id__in=obj_users, base_id=51).values_list('no_empleado', flat=True))

    empleados_conceptos_gbf = EmpleadosconceptosNominaGBF.objects.exclude(
        noestado=3,
    ).filter(
        noconcepto=1,
        fechainicio__year=int_year,
        fechafin__year=int_year,
        fechainicio__gte=F('fechafin') - timedelta(days=365)
    )

    if str_departamento != "" or str_empleado != "0":
        empleados_conceptos_gbf = empleados_conceptos_gbf.filter(noempleado__in=no_empleado)

    empleados_conceptos_gbf = list(empleados_conceptos_gbf.annotate(
        start=DateFormatHistorial('fechainicio'),
        end=DateFormatFinHistorial('fechafin'),
        title=Concat(Cast('noempleado__no_empleado', output_field=CharField()),
                     Value(' - ', output_field=CharField()), 'noempleado__nombres',
                     Value(' ', output_field=CharField()), 'noempleado__apellidos'),
    ).values('start', 'end', 'title'))

    no_empleado = list(
        EmpleadosBase.objects.filter(empleado_id__in=obj_users, base_id=53).values_list('no_empleado', flat=True))

    empleados_conceptos_gbv = EmpleadosconceptosNominaGBV.objects.exclude(
        noestado=3,
    ).filter(
        noconcepto=1,
        fechainicio__year=int_year,
        fechafin__year=int_year,
        fechainicio__gte=F('fechafin') - timedelta(days=365)
    )

    if str_departamento != "" or str_empleado != "0":
        empleados_conceptos_gbv = empleados_conceptos_gbv.filter(noempleado__in=no_empleado)

    empleados_conceptos_gbv = list(empleados_conceptos_gbv.annotate(
        start=DateFormatHistorial('fechainicio'),
        end=DateFormatFinHistorial('fechafin'),
        title=Concat(Cast('noempleado__no_empleado', output_field=CharField()),
                     Value(' - ', output_field=CharField()), 'noempleado__nombres',
                     Value(' ', output_field=CharField()), 'noempleado__apellidos'),
    ).values('start', 'end', 'title'))

    vacaciones = empleados_conceptos_gb + empleados_conceptos_gbf + empleados_conceptos_gbv

    bool_error = not len(vacaciones) > 0
    obj_json = {
        "data": vacaciones,
        "status": True if not bool_error else False,
        "msj": "Se muestran las vacaciones del año " + str_year + "." if not bool_error
        else "No se encontraron vacaciones para el año " + str_year + "."
    }

    return JsonResponse(obj_json, safe=False)
