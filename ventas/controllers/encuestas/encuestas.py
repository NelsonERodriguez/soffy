from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from ventas.models import Encuestas_sala_ventas


@login_required(login_url="/login/")
def index(request):
    return render(request, 'encuestas/encuestas.html')


@login_required(login_url="/login/")
def set_valor(request):

    ofrecio = request.POST.get('hdnOfrecio', False)
    valor = request.POST.get('hdnValor', -1)
    valor = int(valor)
    encontro = request.POST.get('hdnEncontro', None)
    observacion = request.POST.get('observacion', False)
    recomendar = request.POST.get('hdnRecomendar', False)
    observacion_recomendar = request.POST.get('txtObservacionRecomendar', None)
    status = False

    if valor >= 0:

        Encuestas_sala_ventas.objects.create(
            valor=valor,
            ofrecio=ofrecio,
            encontro=encontro,
            observacion=observacion,
            recomendar=recomendar,
            observacion_recomendar=observacion_recomendar
        )
        status = True

    data = {
        "status": status
    }

    return JsonResponse(data, safe=True)
