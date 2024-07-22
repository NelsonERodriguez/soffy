import random

from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
# from faker import Faker

from core.functions import set_notification
from mantenimiento.forms import MbancosForm
from mantenimiento.models import Mbancos


@login_required(login_url="/login/")
def index(request):
    # fake = Faker()
    # list_to_insert = []
    # for _ in range(30):
    #     print(fake.name())
    #     list_to_insert.append(Mbancos(
    #         cueban=fake.name(),
    #         nomban=fake.name(),
    #         chequesigue=1,
    #         ctacon_id=random.randrange(1, 30),
    #         sobregiro=fake.boolean(),
    #         bloqueado=fake.boolean(),
    #         saldoinicial=100,
    #         fechainicial=fake.date(),
    #     ))
    # Mbancos.objects.bulk_create(list_to_insert)
    mbancos = Mbancos.objects.all()
    paginator = Paginator(mbancos, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "bancos/bancos.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = MbancosForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                Mbancos.objects.create(**data)
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-bancos')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

    else:
        form = MbancosForm()

    arr_data = {
        'form': form,
    }
    return render(request, "bancos/bancos_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        mbancos = Mbancos.objects.get(id=_id)
        if request.method == 'POST':
            form = MbancosForm(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(mbancos, key, value)

                mbancos.save()
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-bancos')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = MbancosForm({
                'cueban': mbancos.cueban,
                'nomban': mbancos.nomban,
                'chequesigue': mbancos.chequesigue,
                'ctacon': mbancos.ctacon_id,
                'piecheq': mbancos.piecheq,
                'sobregiro': mbancos.sobregiro,
                'moneda': mbancos.moneda,
                'bloqueado': mbancos.bloqueado,
                'saldoinicial': mbancos.saldoinicial,
                'fechainicial': mbancos.fechainicial.strftime('%Y-%m-%d'),
            })

        arr_data = {
            'id': _id,
            'form': form,
        }
        return render(request, "bancos/bancos_edit.html", arr_data)

    except Mbancos.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('mantenimiento-bancos')
