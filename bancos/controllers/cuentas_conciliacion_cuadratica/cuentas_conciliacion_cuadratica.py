from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
# from faker import Faker

from core.functions import set_notification
from bancos.forms import McuadraticaForm
from bancos.models import Mcuadratica


@login_required(login_url="/login/")
def index(request):
    # fake = Faker()
    # list_to_insert = []
    # for _ in range(30):
    #     list_to_insert.append(Mcuadratica(
    #         descri=fake.name(),
    #         ctacontable_id=1,
    #     ))
    # Mcuadratica.objects.bulk_create(list_to_insert)

    mcuadratica = Mcuadratica.objects.all()
    paginator = Paginator(mcuadratica, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "cuentas_conciliacion_cuadratica/cuentas_conciliacion_cuadratica.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = McuadraticaForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                Mcuadratica.objects.create(**data)
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('bancos-cuentas_conciliacion_cuadratica')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

    else:
        form = McuadraticaForm()

    arr_data = {
        'form': form,
    }
    return render(request, "cuentas_conciliacion_cuadratica/cuentas_conciliacion_cuadratica_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        mcuadratica = Mcuadratica.objects.get(pk=_id)
        if request.method == 'POST':
            form = McuadraticaForm(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(mcuadratica, key, value)

                mcuadratica.save()
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('bancos-cuentas_conciliacion_cuadratica')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = McuadraticaForm({
                'descri': mcuadratica.descri,
                'ctacontable': mcuadratica.ctacontable_id,
            })

        arr_data = {
            'id': _id,
            'form': form,
        }
        return render(request, "cuentas_conciliacion_cuadratica/cuentas_conciliacion_cuadratica_edit.html", arr_data)

    except Mcuadratica.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('bancos-cuentas_conciliacion_cuadratica')
