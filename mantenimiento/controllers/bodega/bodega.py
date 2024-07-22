from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
# from faker import Faker

from core.functions import set_notification
from mantenimiento.forms import MbodegaForm
from mantenimiento.models import Mbodega


@login_required(login_url="/login/")
def index(request):
    # fake = Faker()
    # list_to_insert = []
    # for _ in range(30):
    #     print(fake.name())
    #     list_to_insert.append(Mbodega(
    #         nbodega=fake.name(),
    #         ubicacion=fake.name(),
    #         activo=fake.boolean(),
    #         predet=False,
    #         ctacontable_id=1,
    #         cencos_id=1
    #     ))
    # Mbodega.objects.bulk_create(list_to_insert)

    mbodega = Mbodega.objects.all()
    paginator = Paginator(mbodega, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "bodega/bodega.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = MbodegaForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                Mbodega.objects.create(**data)
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-bodega')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

    else:
        form = MbodegaForm()

    arr_data = {
        'form': form,
    }
    return render(request, "bodega/bodega_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        mbodega = Mbodega.objects.get(pk=_id)
        if request.method == 'POST':
            form = MbodegaForm(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(mbodega, key, value)

                mbodega.save()
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-bodega')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = MbodegaForm({
                'nbodega': mbodega.nbodega,
                'ubicacion': mbodega.ubicacion,
                'predet': mbodega.predet,
                'ctacontable': mbodega.ctacontable_id,
                'cencos': mbodega.cencos_id,
                'activo': mbodega.activo,
            })

        arr_data = {
            'id': _id,
            'form': form,
        }
        return render(request, "bodega/bodega_edit.html", arr_data)

    except Mbodega.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('mantenimiento-bodega')


@login_required(login_url="/login/")
def delete(request, _id):
    try:
        mbodega = Mbodega.objects.get(pk=_id)
        mbodega.activo = False
        mbodega.save()
        set_notification(request, True, "Registro eliminado.", "add_alert", "success")
        return redirect('mantenimiento-bodega')

    except Mbodega.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('mantenimiento-bodega')

    except Exception as e:
        set_notification(request, True, "{}".format(e), "warning", "danger")
        return redirect('mantenimiento-bodega')
