from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.shortcuts import render, redirect

from contabilidad.forms import MccosForm
from contabilidad.models import Mccos
from core.functions import set_notification


@login_required(login_url="/login/")
def index(request):
    mccos = Mccos.objects.all()
    paginator = Paginator(mccos, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "centros_costo/centros_costo.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = MccosForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                Mccos.objects.create(**data)
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('contabilidad-centros_costo')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

    else:
        form = MccosForm()

    arr_data = {
        'form': form,
    }
    return render(request, "centros_costo/centros_costo_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        mcco = Mccos.objects.get(pk=_id)
        if request.method == 'POST':
            form = MccosForm(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(mcco, key, value)

                mcco.save()
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('contabilidad-centros_costo')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = mcco

        arr_data = {
            'id': _id,
            'form': form,
        }
        return render(request, "centros_costo/centros_costo_edit.html", arr_data)

    except Mccos.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('contabilidad-centros_costo')


@login_required(login_url="/login/")
def delete(request, _id):
    try:
        mpresu = Mccos.objects.get(pk=_id)
        mpresu.activo = False
        mpresu.save()
        set_notification(request, True, "Registro eliminado.", "add_alert", "success")
        return redirect('contabilidad-centros_costo')

    except Mccos.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('contabilidad-centros_costo')

    except Exception as e:
        set_notification(request, True, "{}".format(e), "warning", "danger")
        return redirect('contabilidad-centros_costo')
