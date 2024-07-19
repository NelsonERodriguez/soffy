from django import forms
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from rrhh.models import Permisos_tipos


class TiposForm(forms.Form):
    id = forms.IntegerField(required=False)
    nombre = forms.CharField(required=True)
    dias_permitidos = forms.IntegerField()
    activo = forms.BooleanField(required=False)


@login_required(login_url="/login/")
def index(request):
    return render(request, 'permisos_tipos/permisos_tipos.html')


@login_required(login_url="/login/")
def get_tipos(request):
    draw = int(request.POST.get('draw', 1))
    start = int(request.POST.get('start', 0))
    length = int(request.POST.get('length', 10))

    # Obtener los datos de búsqueda
    search_value = request.POST.get('search[value]', '')

    # Filtrar según la búsqueda
    if search_value:
        query_filter = (Q(nombre__icontains=search_value) | Q(dias_permitidos__icontains=search_value))
        queryset = Permisos_tipos.objects.filter(query_filter)
    else:
        queryset = Permisos_tipos.objects.all()

    # Paginar los resultados
    paginator = Paginator(queryset, length)
    page_number = start // length + 1
    page = paginator.get_page(page_number)

    # Preparar la respuesta
    data = []
    for tipo in page.object_list:
        data.append({
            "id": tipo.id,
            "nombre": tipo.nombre,
            "dias_permitidos": tipo.dias_permitidos,
            "activo": 'Si' if tipo.activo else 'No',
        })

    response = {
        'draw': draw,
        'recordsTotal': paginator.count,
        'recordsFiltered': paginator.count,
        'data': data,
    }

    return JsonResponse(response)


@login_required(login_url="/login/")
def get_tipo(request):
    int_id = request.POST.get('id', 0)
    try:
        tipo = Permisos_tipos.objects.get(id=int_id)
        response = {
            'status': True,
            'tipo': {
                "id": tipo.id,
                "nombre": tipo.nombre,
                "dias_permitidos": tipo.dias_permitidos,
                "activo": tipo.activo,
            },
        }
        return JsonResponse(response)
    except Permisos_tipos.DoesNotExist:
        response = {
            'status': False,
            'tipo': None,
            'msj': 'El tipo no existe',
            'msg': 'El tipo no existe',
        }
        return JsonResponse(response)


@login_required(login_url="/login/")
def save_tipo(request):
    if request.method == 'POST':
        form = TiposForm(request.POST)
        if form.is_valid():
            int_id = form.cleaned_data['id']
            dias_permitidos = form.cleaned_data['dias_permitidos']
            nombre = form.cleaned_data.get('nombre')

            bool_status = True
            try:
                Permisos_tipos.objects.update_or_create(
                    id=int_id,
                    defaults={
                        'dias_permitidos': dias_permitidos,
                        'nombre': nombre,
                        'activo': True if request.POST.get('activo') else False,
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
