from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import render, redirect

from contabilidad.forms import Mpresu01Form, Mpresu02Form
from contabilidad.models import Mpresu01, Mpresu02, Mcuentas
from core.functions import set_notification


@login_required(login_url="/login/")
def index(request):
    mgrupo = Mpresu01.objects.all()
    paginator = Paginator(mgrupo, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "presupuestos/presupuestos.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = Mpresu01Form(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            mpresu = Mpresu01.objects.create(**data)

            list_detalles = []
            for key in request.POST.keys():
                if key.find('[]') != -1:
                    list_post = request.POST.getlist(key)
                    field = key.replace('[]', '')
                    for i, detalle in enumerate(list_post):
                        if len(list_detalles) != len(list_post):
                            list_detalles.append({'presu01': mpresu.id})
                        list_detalles[i][field] = detalle

            str_error = ""
            new_objects = []

            for detalle in list_detalles:
                form_detalle = Mpresu02Form(detalle)
                if form_detalle.is_valid():
                    data = form_detalle.cleaned_data
                    new_objects.append(Mpresu02(**data))

                else:
                    str_error += str(form_detalle.errors)

            try:
                with transaction.atomic():
                    if new_objects:
                        Mpresu02.objects.bulk_create(new_objects)
            except Exception as e:
                str_error += str(e)

            if str_error:
                set_notification(request, True, "Algunos registros no fueron grabados por los siguientes errores. "
                                                "<br>{}".format(str_error), "warning", "danger")
            else:
                set_notification(request, True, "Registro grabado.", "add_alert", "success")

            return redirect('contabilidad-presupuestos')

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")
    else:
        form = Mpresu01Form()

    cuentas = Mcuentas.objects.filter(activo=True).values('id', 'ctacontable', 'ctanombre')
    arr_data = {
        'form': form,
        'mcuentas': list(cuentas) if cuentas else None,
    }
    return render(request, "presupuestos/presupuestos_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        mpresu = Mpresu01.objects.get(pk=_id)
        if request.method == 'POST':
            form = Mpresu01Form(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(mpresu, key, value)

                mpresu.save()

                keys = request.POST.keys()

                list_detalles = []
                for key in keys:
                    if key.find('[]') != -1:
                        list_post = request.POST.getlist(key)
                        field = key.replace('[]', '')
                        for i, detalle in enumerate(list_post):
                            if len(list_detalles) != len(list_post):
                                list_detalles.append({'presu01': mpresu.id})
                            list_detalles[i][field] = detalle

                str_error = ""
                new_objects = []
                update_objects = []

                for detalle in list_detalles:
                    form_detalle = Mpresu02Form(detalle)
                    if form_detalle.is_valid():
                        data = form_detalle.cleaned_data
                        if detalle.get('id', '0') == '0':
                            # Crear nuevo objeto
                            new_objects.append(Mpresu02(**data))
                        else:
                            # Actualizar objeto existente
                            obj_id = detalle.get('id')
                            try:
                                obj = Mpresu02.objects.get(pk=obj_id)
                                for key, value in data.items():
                                    setattr(obj, key, value)
                                update_objects.append(obj)
                            except Mpresu02.DoesNotExist:
                                str_error += f"Registro con id {obj_id} no encontrado. "

                    else:
                        str_error += str(form_detalle.errors)

                try:
                    with transaction.atomic():
                        if new_objects:
                            Mpresu02.objects.bulk_create(new_objects)
                        if update_objects:
                            Mpresu02.objects.bulk_update(
                                update_objects,
                                ['presu01', 'ctacontable', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep',
                                 'oct', 'nov', 'dic']
                            )
                except Exception as e:
                    str_error += str(e)

                if str_error:
                    set_notification(request, True, "Algunos registros no fueron grabados por los siguientes errores. "
                                                    "<br>{}".format(str_error), "warning", "danger")
                else:
                    set_notification(request, True, "Registro grabado.", "add_alert", "success")

                return redirect('contabilidad-presupuestos')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = Mpresu01Form({
                'fecha': mpresu.fecha.strftime("%Y-%m-%d"),
                'descripcion': mpresu.descripcion,
            })

        cuentas = Mcuentas.objects.filter(activo=True).values('id', 'ctacontable', 'ctanombre')
        arr_data = {
            'id': _id,
            'form': form,
            'detalles': Mpresu02.objects.filter(presu01_id=mpresu.id),
            'mcuentas': list(cuentas) if cuentas else None,
        }
        return render(request, "presupuestos/presupuestos_edit.html", arr_data)

    except Mpresu02.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('contabilidad-presupuestos')


@login_required(login_url="/login/")
def delete(request, _id):
    try:
        mpresu = Mpresu01.objects.get(pk=_id)
        mpresu.activo = False
        mpresu.save()
        return JsonResponse({'success': True, "msg": 'Registro eliminado.'})

    except Mpresu01.DoesNotExist:
        return JsonResponse({'success': False, "msg": 'Registro no encontrado.'})

    except Exception as e:
        return JsonResponse({'success': False, "msg": str(e)})
