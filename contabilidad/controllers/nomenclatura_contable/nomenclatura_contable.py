from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render, redirect

from contabilidad.forms import McuentasForm
from contabilidad.models import Mcuentas
from core.functions import set_notification


@login_required(login_url="/login/")
def index(request):
    mcuentas = Mcuentas.objects.all()
    paginator = Paginator(mcuentas, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "nomenclatura_contable/nomenclatura_contable.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = McuentasForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                Mcuentas.objects.create(**data)
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('contabilidad-nomenclatura_contable')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

    else:
        form = McuentasForm()

    arr_data = {
        'form': form,
    }
    return render(request, "nomenclatura_contable/nomenclatura_contable_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        mcuenta = Mcuentas.objects.get(pk=_id)
        if request.method == 'POST':
            form = McuentasForm(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(mcuenta, key, value)

                mcuenta.save()
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('contabilidad-nomenclatura_contable')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = McuentasForm({
                'ctacontable': mcuenta.ctacontable,
                'ctanombre': mcuenta.ctanombre,
                'ctanombre2': mcuenta.ctanombre2,
                'efecto': mcuenta.efecto,
                'nivel': mcuenta.nivel,
                'referencia': mcuenta.referencia,
                'moneda': mcuenta.moneda,
                'grupo': mcuenta.grupo_id,
                'ctapadre': mcuenta.ctapadre_id,
                'mccos': mcuenta.mccos_id,
                'activo': mcuenta.activo,
            })

        arr_data = {
            'id': _id,
            'form': form,
        }
        return render(request, "nomenclatura_contable/nomenclatura_contable_edit.html", arr_data)

    except Mcuentas.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('contabilidad-nomenclatura_contable')


@login_required(login_url="/login/")
def delete(request, _id):
    try:
        mcuenta = Mcuentas.objects.get(pk=_id)
        mcuenta.activo = False
        mcuenta.save()
        set_notification(request, True, "Registro eliminado.", "add_alert", "success")
        return redirect('contabilidad-nomenclatura_contable')

    except Mcuentas.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('contabilidad-nomenclatura_contable')

    except Exception as e:
        set_notification(request, True, "{}".format(e), "warning", "danger")
        return redirect('contabilidad-nomenclatura_contable')
