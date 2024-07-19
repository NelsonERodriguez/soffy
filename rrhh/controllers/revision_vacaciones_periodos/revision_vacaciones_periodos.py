from django.db.models import Q, Func, CharField, Value
from django.db.models.functions import Concat, Cast
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from core.ares_models import EmpleadosBase
from core.functions import get_query
from core.nominagb_models import EmpleadosconceptosNominaGB
from core.nominagbf_models import EmpleadosconceptosNominaGBF
from core.nominagbv_models import EmpleadosconceptosNominaGBV
from user_auth.models import User


class DateFormatHistorial(Func):
    function = 'FORMAT'
    template = "%(function)s(%(expressions)s, 'dd/MM/yyyy')"


@login_required(login_url="/login/")
def index(request):
    return render(request, 'revision_vacaciones_periodos/revision_vacaciones_periodos.html')


@login_required(login_url="/login/")
def get_users(request):
    str_search = request.POST.get('search')
    try:
        users = list(User.objects
                     .filter(Q(name__icontains=str_search) | Q(email__icontains=str_search))
                     .filter(active=True, is_active=True).values('id', 'name').exclude(id=1))
        return JsonResponse({'status': True, 'users': users}, safe=False)

    except Exception as e:
        return JsonResponse({'status': False, 'error': str(e), 'msg': str(e), 'msj': str(e)})


@login_required(login_url="/login/")
def get_periodos(request):
    int_user = request.POST.get('user')
    try:
        user = User.objects.get(id=int_user)
        empleado = EmpleadosBase.objects.filter(empleado_id=user.empleado_id, base_id=46,
                                                fecha_baja__isnull=True).first()

        arr_periodos_disponibles = get_query(str_sql="EXEC [NominaGB]..[StatusVacaciones] %s, %s",
                                             params=(empleado.no_empleado if empleado else '',
                                                     empleado.no_empresa if empleado else ''),
                                             print_debug=False,
                                             print_result=False)

        no_empleado = list(EmpleadosBase.objects.filter(empleado_id=user.empleado_id, base_id=46)
                           .values_list('no_empleado', flat=True))

        empleados_conceptos_gb = EmpleadosconceptosNominaGB.objects.exclude(
            noestado=3,
        ).filter(
            noconcepto=1,
            noempleado__in=no_empleado
        )

        empleados_conceptos_gb = list(empleados_conceptos_gb.annotate(
            fecha_inicio=DateFormatHistorial('fechainicio'),
            fecha_fin=DateFormatHistorial('fechafin'),
            nombre=Concat(Cast('noempleado__no_empleado', output_field=CharField()),
                          Value(' - ', output_field=CharField()), 'noempleado__nombres',
                          Value(' ', output_field=CharField()), 'noempleado__apellidos'),
        ).values('fecha_inicio', 'fecha_fin', 'nombre', 'monto', 'cantidad', 'periodo'))

        no_empleado = list(EmpleadosBase.objects.filter(empleado_id=user.empleado_id, base_id=51)
                           .values_list('no_empleado', flat=True))

        empleados_conceptos_gbf = EmpleadosconceptosNominaGBF.objects.exclude(
            noestado=3,
        ).filter(
            noconcepto=1,
            noempleado__in=no_empleado
        )

        empleados_conceptos_gbf = list(empleados_conceptos_gbf.annotate(
            fecha_inicio=DateFormatHistorial('fechainicio'),
            fecha_fin=DateFormatHistorial('fechafin'),
            nombre=Concat(Cast('noempleado__no_empleado', output_field=CharField()),
                          Value(' - ', output_field=CharField()), 'noempleado__nombres',
                          Value(' ', output_field=CharField()), 'noempleado__apellidos'),
        ).values('fecha_inicio', 'fecha_fin', 'nombre', 'monto', 'cantidad', 'periodo'))

        no_empleado = list(EmpleadosBase.objects.filter(empleado_id=user.empleado_id, base_id=53)
                           .values_list('no_empleado', flat=True))

        empleados_conceptos_gbv = EmpleadosconceptosNominaGBV.objects.exclude(
            noestado=3,
        ).filter(
            noconcepto=1,
            noempleado__in=no_empleado
        )

        empleados_conceptos_gbv = list(empleados_conceptos_gbv.annotate(
            fecha_inicio=DateFormatHistorial('fechainicio'),
            fecha_fin=DateFormatHistorial('fechafin'),
            nombre=Concat(Cast('noempleado__no_empleado', output_field=CharField()),
                          Value(' - ', output_field=CharField()), 'noempleado__nombres',
                          Value(' ', output_field=CharField()), 'noempleado__apellidos'),
        ).values('fecha_inicio', 'fecha_fin', 'nombre', 'monto', 'cantidad', 'periodo'))

        vacaciones = empleados_conceptos_gb + empleados_conceptos_gbf + empleados_conceptos_gbv

        return JsonResponse({
            'status': True,
            'periodos': arr_periodos_disponibles,
            'vacaciones': vacaciones
        }, safe=False)

    except User.DoesNotExist:
        return JsonResponse({'status': False, 'msg': 'Usuario no existe', 'msj': 'Usuario no existe'})

    except Exception as e:
        return JsonResponse({'status': False, 'error': str(e), 'msg': str(e), 'msj': str(e)})
