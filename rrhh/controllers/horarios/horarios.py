from django.core.paginator import Paginator
from django.db.models import Q
from django import forms
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from rrhh.models import Horarios, Dias_semana
from django.http import JsonResponse


class HorarioForm(forms.Form):
    id = forms.IntegerField(required=False)
    dia = forms.IntegerField()
    hora_entrada = forms.TimeField()
    hora_salida = forms.TimeField()
    hora_almuerzo = forms.TimeField(required=False)


@login_required(login_url="/login/")
def index(request):
    dias_semana = Dias_semana.objects.all().values('nombre', 'id')
    data = {
        "dias_semana": dias_semana,
    }
    return render(request, 'horarios/horarios.html', data)


@login_required(login_url="/login/")
def get_horarios(request):
    draw = int(request.POST.get('draw', 1))
    start = int(request.POST.get('start', 0))
    length = int(request.POST.get('length', 10))

    # Obtener los datos de búsqueda
    search_value = request.POST.get('search[value]', '')

    # Filtrar según la búsqueda
    if search_value:
        query_filter = (Q(dias_semana__nombre__icontains=search_value) | Q(hora_entrada__icontains=search_value) |
                        Q(hora_salida__icontains=search_value))
        queryset = Horarios.objects.select_related('dias_semana').filter(query_filter)
    else:
        queryset = Horarios.objects.select_related('dias_semana').all()

    # Paginar los resultados
    paginator = Paginator(queryset, length)
    page_number = start // length + 1
    page = paginator.get_page(page_number)

    # Preparar la respuesta
    data = []
    for horario in page.object_list:
        data.append({
            "id": horario.id,
            "dia": horario.dias_semana.nombre,
            "hora_entrada": horario.hora_entrada,
            "hora_salida": horario.hora_salida,
            "hora_almuerzo": horario.hora_almuerzo
        })

    response = {
        'draw': draw,
        'recordsTotal': paginator.count,
        'recordsFiltered': paginator.count,
        'data': data,
    }

    return JsonResponse(response)


@login_required(login_url="/login/")
def get_horario(request):
    int_id = request.POST.get('id', 0)
    try:
        horario = Horarios.objects.get(id=int_id)
        response = {
            'status': True,
            'horario': {
                "id": horario.id,
                "hora_entrada": horario.hora_entrada,
                "hora_salida": horario.hora_salida,
                "hora_almuerzo": horario.hora_almuerzo,
                "dias_semana_id": horario.dias_semana_id,
            },
        }
        return JsonResponse(response)
    except Horarios.DoesNotExist:
        response = {
            'status': False,
            'horario': None,
            'msj': 'El horario no existe',
            'msg': 'El horario no existe',
        }
        return JsonResponse(response)


@login_required(login_url="/login/")
def save_horario(request):
    if request.method == 'POST':
        form = HorarioForm(request.POST)
        if form.is_valid():
            int_id = form.cleaned_data['id']
            dia = form.cleaned_data['dia']
            hora_entrada = form.cleaned_data['hora_entrada']
            hora_salida = form.cleaned_data['hora_salida']
            hora_almuerzo = form.cleaned_data.get('hora_almuerzo')

            bool_status = True
            try:
                Horarios.objects.update_or_create(
                    id=int_id,
                    defaults={
                        'dias_semana_id': dia,
                        'hora_entrada': hora_entrada,
                        'hora_salida': hora_salida,
                        'hora_almuerzo': hora_almuerzo,
                    }
                )
                str_msj = "Registro grabado"
            except Exception as e:
                bool_status = False
                str_msj = f"Error al grabar el registro: {e}"

            response = {
                'status': bool_status,
                'msj': str_msj,
                'msg': str_msj,
            }
            return JsonResponse(response)
        else:
            # El formulario no es válido, devuelve un mensaje de error
            response = {
                'status': False,
                'msj': 'Datos de formulario no válidos',
                'msg': 'Datos de formulario no válidos',
            }
            return JsonResponse(response)
    else:
        # El método de solicitud no es POST
        response = {
            'status': False,
            'msj': 'Método de solicitud no permitido',
            'msg': 'Método de solicitud no permitido',
        }
        return JsonResponse(response)
