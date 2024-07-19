from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from core.functions import get_query
from rrhh.models import Empleados_horarios, Horarios, Dias_semana


@login_required(login_url="/login/")
def index(request):
    dias_semana = (Dias_semana.objects.prefetch_related('horarios_set').all()
                   .values('id', 'dia', 'horarios__hora_entrada', 'horarios__hora_salida', 'nombre',
                           'horarios__id').order_by('dia', 'horarios__hora_entrada'))

    horarios = Horarios.objects.select_related('dias_semana').all().values('id', 'hora_entrada', 'hora_salida',
                                                                           'dias_semana_id', 'dias_semana__dia',
                                                                           'dias_semana__nombre')
    arr_dias = {}

    for dia in dias_semana:
        if not dia['dia'] in arr_dias:
            arr_dias[dia['dia']] = {
                'id': dia['id'],
                'dia': dia['dia'],
                'nombre': dia['nombre'],
                'horarios': []
            }

        if dia['horarios__id']:
            arr_dias[dia['dia']]['horarios'].append({
                'id': dia['horarios__id'],
                'hora_entrada': dia['horarios__hora_entrada'].strftime('%H:%M'),
                'hora_salida': dia['horarios__hora_salida'].strftime('%H:%M'),
                'dias_semana_id': dia['id'],
            })

    arr_horarios = {}

    for horario in horarios:
        if not horario['dias_semana__dia'] in arr_horarios:
            arr_horarios[horario['dias_semana__dia']] = []

        arr_horarios[horario['dias_semana__dia']].append({
            'id': horario['id'],
            'hora_entrada': horario['hora_entrada'].strftime('%H:%M'),
            'hora_salida': horario['hora_salida'].strftime('%H:%M'),
            'dia': horario['dias_semana__nombre'],
            'dias_semana_id': horario['dias_semana_id'],
        })

    data = {
        "departamentos": get_departamentos_empleados(),
        "dias_semana": arr_dias,
        "horarios": arr_horarios,
    }
    return render(request, 'empleados_horarios/empleados_horarios.html', data)


@login_required(login_url="/login/")
def save_horarios_empleados(request):
    int_empleado = request.POST.get('empleado')
    int_horario_anterior = request.POST.get('horario_anterior')
    int_horario = request.POST.get('horario')

    try:
        if int_horario_anterior:
            Empleados_horarios.objects.filter(usuario_id=int_empleado, horario_id=int_horario_anterior).update(
                horario_id=int_horario)
        else:
            Empleados_horarios.objects.create(usuario_id=int_empleado, horario_id=int_horario)

        return JsonResponse({
            'status': True,
            'msg': 'Registro grabado',
            'msj': 'Registro grabado',
        }, safe=False)
    except Exception as E:
        return JsonResponse({
            'status': False,
            'msg': f'Error al grabar: {str(E)}',
            'msj': f'Error al grabar: {str(E)}',
        }, safe=False)


def get_departamentos_empleados():
    str_query_asistencias = """
        SELECT
            [auth_user].[id],
            [auth_user].[name],
            [auth_user].[email],
            [empleados_base].[no_empleado],
            [puestos].[descripcion],
            ISNULL([core_user_departamento].[departamento_id], 0) AS [departamento_id],
            ISNULL([core_departamento].[nombre], 'Sin departamento') AS [departamento],
            ISNULL((SELECT STRING_AGG([horario_id], ',')
            FROM [NOVA]..[rrhh_empleados_horarios]
            WHERE [usuario_id] = [auth_user].[id]
            GROUP BY [usuario_id]), 0) AS [horarios_id]
        FROM [NOVA]..[auth_user]
        INNER JOIN [ares]..[empleados_base] ON [empleados_base].[empleado_id] = [auth_user].[empleado_id]
        INNER JOIN [ares]..[puestos] ON [puestos].[codigo] = [empleados_base].[no_puesto]
        LEFT JOIN [NOVA]..[core_user_departamento] ON [core_user_departamento].[user_id] = [auth_user].[id]
        LEFT JOIN [NOVA]..[core_departamento] ON [core_departamento].[id] = [core_user_departamento].[departamento_id]
        WHERE [auth_user].[active] = 1
            AND [auth_user].[is_active] = 1
            AND [empleados_base].[fecha_baja] IS NULL
            AND [empleados_base].[no_empresa] <> 0
            AND [empleados_base].[base_id] = 46
        GROUP BY
            [auth_user].[id],
            [auth_user].[name],
            [auth_user].[email],
            [empleados_base].[no_empleado],
            [puestos].[descripcion],
            [core_user_departamento].[departamento_id],
            [core_departamento].[nombre]
        ORDER BY
            [core_departamento].[nombre]
    """
    arr_usuarios = get_query(str_sql=str_query_asistencias, print_debug=False, print_result=False)

    arr_departamentos = {}
    int_count = 0
    for usuario in arr_usuarios:
        if not usuario['departamento_id'] in arr_departamentos:
            arr_departamentos[usuario['departamento_id']] = {
                'id': usuario['departamento_id'],
                'nombre': usuario['departamento'],
                'usuarios': {},
            }

        arr_departamentos[usuario['departamento_id']]['usuarios'][int_count] = {
            'id': usuario['id'],
            'nombre': usuario['name'],
            'email': usuario['email'],
            'no_empleado': usuario['no_empleado'],
            'puesto': usuario['descripcion'],
            'horarios_id': usuario['horarios_id'],
        }
        int_count += 1

    return arr_departamentos
