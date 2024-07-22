from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
# from faker import Faker

from core.functions import set_notification
from mantenimiento.forms import MdocumentosForm
from mantenimiento.models import Mdocumentos


@login_required(login_url="/login/")
def index(request):
    # fake = Faker()
    # list_to_insert = []
    # for _ in range(30):
    #     print(fake.name())
    #     list_to_insert.append(Mdocumentos(
    #         tipodocumento=fake.name(),
    #         fechainicio=fake.date(),
    #         fechavence=fake.date(),
    #         serie=f"A {_}",
    #         desde=_,
    #         hasta=_ * 1000,
    #         ultimano=_,
    #         resolucion=f"Desde A {_} hasta {_ * 1000}",
    #         idsucursal_id=1,
    #     ))
    # Mdocumentos.objects.bulk_create(list_to_insert)
    mdocumentos = Mdocumentos.objects.all()
    paginator = Paginator(mdocumentos, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "documentos/documentos.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = MdocumentosForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                Mdocumentos.objects.create(**data)
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-documentos')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

    else:
        form = MdocumentosForm()

    arr_data = {
        'form': form,
    }
    return render(request, "documentos/documentos_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        mdocumentos = Mdocumentos.objects.get(id=_id)
        if request.method == 'POST':
            form = MdocumentosForm(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(mdocumentos, key, value)

                mdocumentos.save()
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-documentos')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = MdocumentosForm({
                'tipodocumento': mdocumentos.tipodocumento,
                'fechainicio': mdocumentos.fechainicio.strftime('%Y-%m-%d'),
                'fechavence': mdocumentos.fechavence.strftime('%Y-%m-%d'),
                'serie': mdocumentos.serie,
                'desde': mdocumentos.desde,
                'hasta': mdocumentos.hasta,
                'ultimano': mdocumentos.ultimano,
                'resolucion': mdocumentos.resolucion,
                'idsucursal': mdocumentos.idsucursal_id,
                'describedocumento': mdocumentos.describedocumento,
                'noestable': mdocumentos.noestable,
                'cortecaja': mdocumentos.cortecaja,
            })

        arr_data = {
            'id': _id,
            'form': form,
        }
        return render(request, "documentos/documentos_edit.html", arr_data)

    except Mdocumentos.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('mantenimiento-documentos')
