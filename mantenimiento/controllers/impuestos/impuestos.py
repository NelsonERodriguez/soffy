from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
# from faker import Faker

from core.functions import set_notification
from mantenimiento.forms import MimpuestosForm
from mantenimiento.models import Mimpuestos


@login_required(login_url="/login/")
def index(request):
    # fake = Faker()
    # list_to_insert = []
    # for _ in range(30):
    #     list_to_insert.append(Mimpuestos(
    #         nombreret=fake.name(),
    #         categoria=fake.name()[:10],
    #         ctaconatble_id=1,
    #     ))
    # Mimpuestos.objects.bulk_create(list_to_insert)

    mimpuestos = Mimpuestos.objects.all()
    paginator = Paginator(mimpuestos, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "impuestos/impuestos.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = MimpuestosForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                Mimpuestos.objects.create(**data)
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-impuestos')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

    else:
        form = MimpuestosForm()

    arr_data = {
        'form': form,
    }
    return render(request, "impuestos/impuestos_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        mimpuestos = Mimpuestos.objects.get(pk=_id)
        if request.method == 'POST':
            form = MimpuestosForm(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(mimpuestos, key, value)

                mimpuestos.save()
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-impuestos')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = MimpuestosForm({
                'nombreret': mimpuestos.nombreret,
                'categoria': mimpuestos.categoria,
                'fechavalido': mimpuestos.fechavalido.strftime("%Y-%m-%d"),
                'tarifa': mimpuestos.tarifa,
                'base': mimpuestos.base,
                'prcimpbase': mimpuestos.prcimpbase,
                'ctaconatble': mimpuestos.ctaconatble_id,
            })

        arr_data = {
            'id': _id,
            'form': form,
        }
        return render(request, "impuestos/impuestos_edit.html", arr_data)

    except Mimpuestos.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('mantenimiento-impuestos')
