from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render, redirect

from contabilidad.forms import MgrupoitmForm
from contabilidad.models import Mgrupoitm
from core.functions import set_notification


@login_required(login_url="/login/")
def index(request):
    mgrupo = Mgrupoitm.objects.all()
    paginator = Paginator(mgrupo, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "grupo/grupo.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = MgrupoitmForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                Mgrupoitm.objects.create(**data)
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('contabilidad-grupos')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

    else:
        form = MgrupoitmForm()

    arr_data = {
        'form': form,
    }
    return render(request, "grupo/grupo_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        mgrupo = Mgrupoitm.objects.get(pk=_id)
        if request.method == 'POST':
            form = MgrupoitmForm(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(mgrupo, key, value)

                mgrupo.save()
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('contabilidad-grupos')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = MgrupoitmForm({
                'codigogrupo': mgrupo.codigogrupo,
                'grupo': mgrupo.grupo,
                'ctaingresos': mgrupo.ctaingresos_id,
                'ctainventario': mgrupo.ctainventario_id,
                'ctainventariorp': mgrupo.ctainventariorp_id,
                'ctacostovta': mgrupo.ctacostovta_id,
                'ctaennofac': mgrupo.ctaennofac_id,
                'ctadevinv': mgrupo.ctadevinv_id,
                'ctadevventa': mgrupo.ctadevventa_id,
                'almacen': mgrupo.almacen,
                'ctacostofab': mgrupo.ctacostofab_id,
                'ctainventario2': mgrupo.ctainventario2_id,
                'ctainvtran': mgrupo.ctainvtran_id,
                'activo': mgrupo.activo,
            })

        arr_data = {
            'id': _id,
            'form': form,
        }
        return render(request, "grupo/grupo_edit.html", arr_data)

    except Mgrupoitm.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('contabilidad-grupos')


@login_required(login_url="/login/")
def delete(request, _id):
    try:
        mgrupo = Mgrupoitm.objects.get(pk=_id)
        mgrupo.activo = False
        mgrupo.save()
        set_notification(request, True, "Registro eliminado.", "add_alert", "success")
        return redirect('contabilidad-grupos')

    except Mgrupoitm.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('contabilidad-grupos')

    except Exception as e:
        set_notification(request, True, "{}".format(e), "warning", "danger")
        return redirect('contabilidad-grupos')
