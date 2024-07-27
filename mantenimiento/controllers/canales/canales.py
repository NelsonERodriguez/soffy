from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
# from faker import Faker

from core.functions import set_notification
from mantenimiento.forms import McanalesForm
from mantenimiento.models import Mcanales


@login_required(login_url="/login/")
def index(request):
    # fake = Faker()
    # list_to_insert = []
    # for _ in range(30):
    #     list_to_insert.append(Mcanales(
    #         canal=fake.name(),
    #         ocrcode=fake.name()[:10],
    #         agrupador=fake.name(),
    #     ))
    # Mcanales.objects.bulk_create(list_to_insert)

    mcanal = Mcanales.objects.all()
    paginator = Paginator(mcanal, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "canales/canales.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = McanalesForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                Mcanales.objects.create(**data)
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-canales')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

    else:
        form = McanalesForm()

    arr_data = {
        'form': form,
    }
    return render(request, "canales/canales_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        mcanal = Mcanales.objects.get(pk=_id)
        if request.method == 'POST':
            form = McanalesForm(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(mcanal, key, value)

                mcanal.save()
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-canales')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = McanalesForm({
                'canal': mcanal.canal,
                'ocrcode': mcanal.ocrcode,
                'agrupador': mcanal.agrupador,
            })

        arr_data = {
            'id': _id,
            'form': form,
        }
        return render(request, "canales/canales_edit.html", arr_data)

    except Mcanales.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('mantenimiento-canales')


@login_required(login_url="/login/")
def delete(request, _id):
    try:
        mcanal = Mcanales.objects.get(pk=_id)
        mcanal.activo = False
        mcanal.save()
        set_notification(request, True, "Registro eliminado.", "add_alert", "success")
        return redirect('mantenimiento-canales')

    except Mcanales.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('mantenimiento-canales')

    except Exception as e:
        set_notification(request, True, "{}".format(e), "warning", "danger")
        return redirect('mantenimiento-canales')
