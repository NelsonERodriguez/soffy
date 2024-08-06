from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.shortcuts import render, redirect

from contabilidad.models import Mcuentas
# from faker import Faker

from core.functions import set_notification
from bancos.forms import Tpago01Form, Tpago02Form
from bancos.models import Tpago01, Tpago02
# from mantenimiento.models import Mgruposocio, Msocios


@login_required(login_url="/login/")
def index(request):
    # fake = Faker()
    # list_to_insert = []
    # for _ in range(30):
    #     grupo = Mgruposocio.objects.create(
    #         gruposocio=fake.name(),
    #         ctacontable_id=_ + 1,
    #     )
    #     socio = Msocios.objects.create(
    #         idgruposocio=grupo,
    #         codsocio=fake.name()[:10],
    #         tiposocio=fake.name()[:10],
    #         nombresocio=fake.name(),
    #         direccion=fake.address(),
    #         ctacontable_id=_ + 1,
    #         activo=True,
    #     )
    #     pago = Tpago01.objects.create(
    #         serie=fake.name(),
    #         numero=_,
    #         idsocio=socio,
    #         fechapago=fake.date(),
    #         fechaconta=fake.date(),
    #         cueban_id=1,
    #         comentario=fake.text(),
    #         montorecibo=_ * 10,
    #         status=_ % 2,
    #         ctacontableban_id=1,
    #     )
    #     Tpago02.objects.create(
    #         pago=pago,
    #         serie=fake.name(),
    #         numero=_,
    #         ctacontable_id=1,
    #         fecha=fake.date(),
    #         doctotal=_ * 10,
    #     )

    tpago01 = Tpago01.objects.all()
    paginator = Paginator(tpago01, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "pago_proveedores/pago_proveedores.html", arr_data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = Tpago01Form(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                pago01 = Tpago01.objects.create(**data)

                detalle = request.POST.getlist('id[]')
                ctacontable = request.POST.getlist('ctacontable[]')
                serie = request.POST.getlist('serie[]')
                numero = request.POST.getlist('numero[]')
                doctotal = request.POST.getlist('doctotal[]')
                fecha = request.POST.getlist('fecha[]')
                abonos = request.POST.getlist('abonos[]')
                pago = request.POST.getlist('pago[]')

                list_detalle = []
                errores = ''
                for i, row in enumerate(detalle):
                    form_detalles = Tpago02Form({
                        "tpago01": pago01,
                        "ctacontable": ctacontable[i],
                        "serie": serie[i],
                        "numero": numero[i],
                        "doctotal": doctotal[i],
                        "fecha": fecha[i],
                        "abonos": abonos[i],
                        "pago": pago[i],
                    })

                    if form_detalles.is_valid():
                        list_detalle.append(Tpago02(**form_detalles.cleaned_data))
                    else:
                        errores += str(form_detalles.errors)

                Tpago02.objects.bulk_create(list_detalle)

                if errores == '':
                    set_notification(request, True, "Registro grabado.", "add_alert", "success")
                else:
                    set_notification(request, True, "Registro grabado pero hubieron detalles que no "
                                                    "se grabaron por los siguientes motivos: <br> {}".format(errores),
                                     "warning", "success")
                return redirect('bancos-pago_proveedores')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, f"El registro no fue grabado. <br>{form.errors}", "warning", "danger")

    else:
        form = Tpago01Form()

    cuentas = Mcuentas.objects.filter(activo=True).values('id', 'ctacontable', 'ctanombre')
    arr_data = {
        'form': form,
        'mcuentas': list(cuentas) if cuentas else None,
    }
    return render(request, "pago_proveedores/pago_proveedores_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        tpago01 = Tpago01.objects.get(pk=_id)
        if request.method == 'POST':
            form = Tpago01Form(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(tpago01, key, value)

                tpago01.save()
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('bancos-cuentas_conciliacion_cuadratica')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = Tpago01Form({
                'descri': tpago01.descri,
                'ctacontable': tpago01.ctacontable_id,
            })

        arr_data = {
            'id': _id,
            'form': form,
        }
        return render(request, "cuentas_conciliacion_cuadratica/cuentas_conciliacion_cuadratica_edit.html", arr_data)

    except Tpago01.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('bancos-cuentas_conciliacion_cuadratica')
