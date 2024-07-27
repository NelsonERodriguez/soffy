from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
# from faker import Faker

from core.functions import set_notification
from mantenimiento.forms import MgtoiForm
from mantenimiento.models import Mgtoi


@login_required(login_url="/login/")
def index(request):
    # fake = Faker()
    # list_to_insert = []
    # for _ in range(30):
    #     print(fake.name())
    #     list_to_insert.append(Mgtoi(
    #         nombregasto=fake.name(),
    #         ctagasto_id=1,
    #     ))
    # Mgtoi.objects.bulk_create(list_to_insert)

    mgtoi = Mgtoi.objects.all()
    paginator = Paginator(mgtoi, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "gasto_importacion/gasto_importacion.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = MgtoiForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                Mgtoi.objects.create(**data)
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-gasto_importacion')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

    else:
        form = MgtoiForm()

    arr_data = {
        'form': form,
    }
    return render(request, "gasto_importacion/gasto_importacion_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        mgtoi = Mgtoi.objects.get(pk=_id)
        if request.method == 'POST':
            form = MgtoiForm(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(mgtoi, key, value)

                mgtoi.save()
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-gasto_importacion')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = MgtoiForm({
                'nombregasto': mgtoi.nombregasto,
                'ctagasto': mgtoi.ctagasto_id,
            })

        arr_data = {
            'id': _id,
            'form': form,
        }
        return render(request, "gasto_importacion/gasto_importacion_edit.html", arr_data)

    except Mgtoi.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('mantenimiento-gasto_importacion')
