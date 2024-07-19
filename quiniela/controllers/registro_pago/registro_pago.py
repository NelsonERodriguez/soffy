from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query, execute_query
from quiniela.models import Pago_inscripcion


@login_required(login_url="/login/")
def index(request):
    str_query = """
        SELECT b.pago_realizado, a.name, c.nombre, c.apellido, a.empleado_id
        FROM NOVA..auth_user as a
        LEFT JOIN NOVA..quiniela_pago_inscripcion as b
        ON b.empleado_id = a.empleado_id
        AND b.activo = 1
        INNER JOIN ares..empleados_master as c
        ON c.id = a.empleado_id
        WHERE a.active = 1
        AND a.is_active = 1
        ORDER BY a.name
    """

    obj_datos = get_query(str_query)

    data = {
        "datos": obj_datos
    }

    return render(request, 'registro_pago/registro_pago.html', data)


def registrar(request):
    int_empleado_id = request.POST.get("empleado_id")

    try:
        obj_pago_inscripcion = Pago_inscripcion.objects.filter(empleado_id=int_empleado_id, activo=1).first()

        if not obj_pago_inscripcion:
            obj_pago_inscripcion = Pago_inscripcion.objects.create(
                empleado_id=int_empleado_id,
                activo=True,
                pago_realizado=False
            )

        obj_pago_inscripcion.pago_realizado = True

        obj_pago_inscripcion.save()

        str_query = """
            select id from NOVA..auth_group where name like '%Participantes Quiniela%'
        """
        obj_rol = get_query(str_query)

        str_query = """
            select id from NOVA..auth_user where empleado_id = %s
        """ % int_empleado_id
        obj_user = get_query(str_query)

        if obj_rol and obj_user:
            int_user = obj_user[0]['id']
            int_rol = obj_rol[0]['id']

            str_query = """
                select id from NOVA..auth_user_groups where user_id = %s AND group_id = %s
            """ % (int_user, int_rol)
            obj_existe = get_query(str_query)

            if not obj_existe:
                str_query = """
                    insert into NOVA..auth_user_groups values(%s,%s)
                """ % (int_user, int_rol)
                execute_query(str_query)

        bool_status = True
        str_mensaje = "Se registró el pago del colaborador exitosamente."

    except ValueError:
        bool_status = False
        str_mensaje = "Ocurrió un error al intentar registrar el pago, contacte a IT."

    data = {
        "status": bool_status,
        "mensaje": str_mensaje
    }

    return JsonResponse(data=data, safe=False)

