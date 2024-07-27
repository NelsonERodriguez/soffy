from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
# from faker import Faker

from core.functions import set_notification
from mantenimiento.forms import MgruposocioForm
from mantenimiento.models import Mgruposocio


@login_required(login_url="/login/")
def index(request):
    # fake = Faker()
    # list_to_insert = []
    # for _ in range(30):
    #     print(fake.name())
    #     list_to_insert.append(Mgruposocio(
    #         gruposocio=fake.name(),
    #         ctacontable_id=1,
    #     ))
    # Mgruposocio.objects.bulk_create(list_to_insert)

    mgruposocio = Mgruposocio.objects.all()
    paginator = Paginator(mgruposocio, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "grupo_socio/grupo_socio.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = MgruposocioForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                Mgruposocio.objects.create(**data)
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-grupo_socio')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

    else:
        form = MgruposocioForm()

    arr_data = {
        'form': form,
    }
    return render(request, "grupo_socio/grupo_socio_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        mgruposocio = Mgruposocio.objects.get(pk=_id)
        if request.method == 'POST':
            form = MgruposocioForm(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(mgruposocio, key, value)

                mgruposocio.save()
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-grupo_socio')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = MgruposocioForm({
                'gruposocio': mgruposocio.gruposocio,
                'ctacontable': mgruposocio.ctacontable_id,
            })

        arr_data = {
            'id': _id,
            'form': form,
        }
        return render(request, "grupo_socio/grupo_socio_edit.html", arr_data)

    except Mgruposocio.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('mantenimiento-grupo_socio')
