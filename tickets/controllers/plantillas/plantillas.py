from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.db.models import F, Q, FilteredRelation
from core.functions import set_notification
from tickets.models import Plantilla, Plantilla_categoria, Agrupacion, Etiqueta, Plantilla_etiqueta


@login_required(login_url="/login/")
def index(request):
    plantilla = Plantilla.objects.annotate(categoria=F('plantilla_categoria__nombre'),
                                           departamento_nombre=F('departamento__nombre'),
                                           etiqueta_activo=FilteredRelation(relation_name='plantilla_etiqueta',
                                                                            condition=Q(
                                                                                plantilla_etiqueta__activo=True))). \
        values('titulo', 'color', 'activo', 'id', 'departamento_nombre', 'categoria',
               nombre_etiqueta=F('etiqueta_activo__etiqueta__nombre'))

    data = []

    int_id = 0
    str_titulo = ''
    str_tipo_categoria = ''
    int_activo = 1
    obj_departamentos = []
    obj_etiqueta = []

    str_last_departamento = ''
    for row in plantilla:
        if row['id'] != int_id:
            if int_id != 0:
                obj_lista = {
                    'id': int_id,
                    'departamentos': obj_departamentos,
                    'etiquetas': obj_etiqueta,
                    'titulo': str_titulo,
                    'tipo_categoria': str_tipo_categoria,
                    'activo': int_activo,
                }
                data.append(obj_lista)

            obj_departamentos = []
            obj_etiqueta = []

        if str_last_departamento != row['departamento_nombre']:
            str_last_departamento = row['departamento_nombre']
            obj_departamentos.append({
                'nombre': row['departamento_nombre']
            })

        if row['nombre_etiqueta']:
            obj_etiqueta.append({
                'nombre': row['nombre_etiqueta']
            })

        int_id = row['id']
        str_titulo = row['titulo']
        str_tipo_categoria = row['categoria']
        int_activo = row['activo']

    if int_id != 0:
        obj_lista = {
            'id': int_id,
            'departamentos': obj_departamentos,
            'etiquetas': obj_etiqueta,
            'titulo': str_titulo,
            'tipo_categoria': str_tipo_categoria,
            'activo': int_activo,
        }
        data.append(obj_lista)

    return render(request, 'plantillas/plantillas.html', {'data': data})


@login_required(login_url="/login/")
def edit(request, pk):
    str_texto_titulo = "Editar" if pk > 0 else "Crear"
    plantilla = Plantilla.objects.filter(id=pk).first()
    int_key = plantilla.id if plantilla else 0

    arr_categorias = Plantilla_categoria.objects.filter(activo=True)
    arr_agrupaciones = Agrupacion.objects.select_related('departamento').filter(activo=True).order_by('departamento_id',
                                                                                                      'id')
    arr_plantilla_etiquetas = Plantilla_etiqueta.objects.filter(plantilla_id=int_key, activo=True)
    arr_etiquetas = Etiqueta.objects.filter(activo=True)

    data = {
        "id": int_key,
        "texto_titulo": str_texto_titulo,
        "plantilla": plantilla,
        "categorias": arr_categorias,
        "agrupaciones": arr_agrupaciones,
        "etiquetas": arr_etiquetas,
        "plantilla_etiquetas": arr_plantilla_etiquetas,
    }

    return render(request, 'plantillas/plantillas_edit.html', data)


@login_required(login_url="/login/")
def save(request, pk):
    obj_plantilla = Plantilla.objects.filter(id=pk).first()

    try:
        str_titulo = request.POST.get("titulo", '')
        str_descripcion = request.POST.get("descripcion", '')
        int_categoria = request.POST.get("categoria_id", 0)
        int_agrupacion = request.POST.get("agrupacion_id", 0)
        str_correo_notificacion = request.POST.get("correo_notificacion", '')
        int_departamento = Agrupacion.objects.values('departamento_id').filter(id=int_agrupacion). \
            first()['departamento_id']
        str_icono = request.POST.get('icono', '')
        str_color = request.POST.get('color', '')
        activo = request.POST.get("activo", None) if len(request.POST.get("activo")) > 0 else 0
        activo = True if activo == '1' else False

        arr_etiquetas = request.POST.getlist('etiquetas[]')

        if obj_plantilla:
            obj_plantilla.titulo = str_titulo
            obj_plantilla.descripcion = str_descripcion
            obj_plantilla.plantilla_categoria_id = int_categoria
            obj_plantilla.agrupacion_id = int_agrupacion
            obj_plantilla.departamento_id = int_departamento
            obj_plantilla.icono = str_icono
            obj_plantilla.color = str_color
            obj_plantilla.activo = activo
            obj_plantilla.correo_notificacion = str_correo_notificacion

            obj_plantilla.save()

        else:
            obj_plantilla = Plantilla.objects.create(
                titulo=str_titulo,
                descripcion=str_descripcion,
                plantilla_categoria_id=int_categoria,
                agrupacion_id=int_agrupacion,
                departamento_id=int_departamento,
                icono=str_icono,
                color=str_color,
                activo=activo,
                correo_notificacion=str_correo_notificacion,
            )

        plantilla_eti = Plantilla_etiqueta.objects.filter(plantilla_id=obj_plantilla.id)

        for plantilla in plantilla_eti:
            key = arr_etiquetas.index(str(plantilla.etiqueta_id)) if str(plantilla.etiqueta_id) in arr_etiquetas else \
                None

            if key is not None and plantilla.activo is False:

                plantilla.activo = True
                plantilla.save()

            elif key is None and plantilla.activo is True:

                plantilla.activo = False
                plantilla.save()

            if key is not None and key >= 0:
                arr_etiquetas.pop(key)

        for a in arr_etiquetas:
            if len(a) > 0:
                Plantilla_etiqueta.objects.create(
                    plantilla_id=obj_plantilla.id,
                    etiqueta_id=a,
                    activo=True
                )

        set_notification(request, True, "Plantilla guardada exitosamente.", "add_alert", "success")
    except ValueError:
        set_notification(request, True, "Plantilla no grabada.", "warning", "danger")

    return redirect("tickets-plantillas")
