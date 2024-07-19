from operator import truediv
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query, set_notification
from quiniela.models import Evento_inscripcion, Evento


def index(request):
    int_empleado_id = request.user.empleado_id
    obj_evento = Evento.objects.filter(activo=True)

    if request.method == "POST":
        str_empleado_id = request.POST.get("hdnEmpleadoId")

        if str_empleado_id == str(int_empleado_id) and obj_evento.exists():
            obj_evento_usar = obj_evento.get()
            obj_datos = Evento_inscripcion.objects.create(
                evento_id=obj_evento_usar.id,
                empleado_id=int_empleado_id,
                puntos_totales=0,
            )
            set_notification(request, True, "Se realizó la inscripción exitosamente exitosamente.",
                             "add_alert", "success")
            return redirect('quiniela-inscripcion')
    #     set_notification(request, True, "Registro no encontrado.", "warning", "danger")

    data = {}
    obj_evento = Evento.objects.filter(activo=True)
    obj_evento_inscripcion = Evento_inscripcion.objects.filter(empleado_id=int_empleado_id)

    if obj_evento.exists():
        data["hay_evento"] = True
    else:
        data["hay_evento"] = False

    if obj_evento_inscripcion.exists():
        data["inscrito"] = True
    else:
        data["inscrito"] = False

    data["empleado_id"] = request.user.empleado_id

    return render(request, 'inscripcion/inscripcion.html', data)


@login_required(login_url="/login/")
def get_clientes(request, search):
    str_nombre = str(search).replace(" ","%")

    sql = """
        SELECT a.NoCliente, a.NIT+' | '+a.Nombre as NombreCompleto
        FROM Inventario..Clientes as a
        WHERE (a.Nombre like '%"""+str_nombre+"""%' OR a.NIT like '%"""+str_nombre+"""%')
        AND Activo = 1
        ORDER BY a.Nombre
    """

    obj_cliente = get_query(sql)

    data = []

    for cliente in obj_cliente:
        data.append({
            "id": cliente["NoCliente"],
            "name": cliente["NombreCompleto"]
        })

    return JsonResponse(data, safe=False)