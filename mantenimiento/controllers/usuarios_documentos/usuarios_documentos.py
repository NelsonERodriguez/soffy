from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.shortcuts import render, redirect

from core.functions import set_notification
from mantenimiento.forms import MusersForm, Mbodega02Form
from mantenimiento.models import Musers, Mbodega02, Mbodega
from user_auth.models import User


@login_required(login_url="/login/")
def index(request):
    musers = User.objects.select_related('musers').all()
    paginator = Paginator(musers, 10)

    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    arr_data = {
        'page_obj': page_obj,
    }
    return render(request, "usuarios_documentos/usuarios_documentos.html", arr_data)


@login_required(login_url="/login/")
def create(request, usuario_id):
    bodegas = Mbodega.objects.filter(activo=True).values('id', 'nbodega', 'ubicacion')
    if request.method == 'POST':
        form = MusersForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data

            try:
                Musers.objects.create(**data)

                arr_id = request.POST.getlist('id[]')
                arr_bodega = request.POST.getlist('idbodega[]')
                list_create = []
                for i, detalle_id in enumerate(arr_id):
                    form_detalle = Mbodega02Form({
                        'iduser': usuario_id,
                        'idbodega': arr_bodega[i],
                    })

                    if form_detalle.is_valid():
                        data = form_detalle.cleaned_data
                        list_create.append(Mbodega02(**data))

                Mbodega02.objects.bulk_create(list_create)

                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-usuarios_documentos')
            except Exception as e:
                set_notification(request, True, "Registro no grabado. <br> {}".format(e), "warning", "danger")

        else:
            set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

    else:
        form = MusersForm({
            'iduser': usuario_id,
        })

    arr_data = {
        'form': form,
        'mbodegas': list(bodegas) if bodegas else None,
        'usuario_id': usuario_id,
    }
    return render(request, "usuarios_documentos/usuarios_documentos_create.html", arr_data)


@login_required(login_url="/login/")
def edit(request, _id):
    try:
        musers = Musers.objects.get(id=_id)
        if request.method == 'POST':
            form = MusersForm(request.POST)
            if form.is_valid():
                data = form.cleaned_data
                for key, value in data.items():
                    setattr(musers, key, value)

                musers.save()

                arr_id = request.POST.getlist('id[]')
                arr_bodega = request.POST.getlist('idbodega[]')
                list_create = []
                list_update = []
                for i, detalle_id in enumerate(arr_id):
                    form_detalle = Mbodega02Form({
                        'iduser': musers.iduser_id,
                        'idbodega': arr_bodega[i],
                    })

                    if form_detalle.is_valid():
                        data = form_detalle.cleaned_data
                        if detalle_id == '0':
                            list_create.append(Mbodega02(**data))

                        else:
                            try:
                                obj = Mbodega02.objects.get(pk=detalle_id)
                                for key, value in data.items():
                                    setattr(obj, key, value)
                                list_update.append(obj)
                            except Mbodega02.DoesNotExist:
                                pass

                Mbodega02.objects.bulk_create(list_create)
                Mbodega02.objects.bulk_update(list_update, ['iduser', 'idbodega'])
                set_notification(request, True, "Registro grabado.", "add_alert", "success")
                return redirect('mantenimiento-usuarios_documentos')

            else:
                set_notification(request, True, "El registro no fue grabado.", "warning", "danger")

        else:
            form = MusersForm({
                'iduser': musers.iduser_id,
                'seriepedido': musers.seriepedido_id,
                'seriefactura': musers.seriefactura_id,
                'todas': musers.todas,
                'anulafacturas': musers.anulafacturas,
                'cambiaprecios': musers.cambiaprecios,
            })

        bodegas = Mbodega.objects.filter(activo=True).values('id', 'nbodega', 'ubicacion')
        arr_data = {
            'id': _id,
            'form': form,
            'detalles': Mbodega02.objects.all(),
            'mbodegas': list(bodegas) if bodegas else None,
        }
        return render(request, "usuarios_documentos/usuarios_documentos_edit.html", arr_data)

    except Musers.DoesNotExist:
        set_notification(request, True, "El registro no existe.", "warning", "danger")
        return redirect('mantenimiento-usuarios_documentos')


@login_required(login_url="/login/")
def delete(request):
    _id = request.POST.get('id')
    try:
        Mbodega02.objects.get(id=_id).delete()
        return JsonResponse({
            'status': True,
            'message': 'Registro eliminado correctamente',
            'msg': 'Registro eliminado correctamente',
            'msj': 'Registro eliminado correctamente',
        })

    except Mbodega02.DoesNotExist:
        return JsonResponse({
            'status': False,
            'message': 'El registro no existe',
            'msg': 'El registro no existe',
            'msj': 'El registro no existe',
        })
