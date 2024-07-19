from datetime import datetime
from operator import truediv
from django.core.mail import EmailMessage
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.template.loader import render_to_string

from core.functions import get_query, set_notification
from quiniela.models import Partido, Evento_inscripcion, Evento, Evento_inscripcion_partido
from soffybiz.debug import DEBUG, IMAGEN_GB
from user_auth.models import User


@login_required(login_url="/login/")
def index(request):
    int_empleado_id = request.user.empleado_id

    # evento_id

    str_query = """
		SELECT e1.nombre as equipo1, e2.nombre as equipo2,
				e1.icono as icono1, e2.icono as icono2,
				d.nombre as nombre_tipo, c.fecha, c.hora, c.id as 'id_partido',
				d.id as id_grupo, cast(c.goles_equipo_1 as varchar) as 'goles_equipo_1',
				cast(c.goles_equipo_2 as varchar) as 'goles_equipo_2',
				cast(c.penales_equipo_1 as varchar) as 'penales_equipo_1',
				cast(c.penales_equipo_2 as varchar) as 'penales_equipo_2',
				cast(fecha as datetime) + cast(hora as datetime) as 'fecha_hora',
				c.hay_penales, c.resultado_congelado
		FROM NOVA..quiniela_evento as b
		INNER JOIN NOVA..quiniela_partido as c
			ON c.evento_id = b.id
		INNER JOIN NOVA..quiniela_equipo as e1
			ON e1.id = c.equipo_1_id
		INNER JOIN NOVA..quiniela_equipo as e2
			ON e2.id = c.equipo_2_id
		INNER JOIN NOVA..quiniela_tipo_partido as d
			ON d.id = c.tipo_partido_id
		WHERE b.activo = 1
		ORDER BY d.orden, c.fecha, c.hora, e1.nombre, e2.nombre
	"""

    obj_partidos = get_query(str_query)

    obj_quiniela = {}
    obj_quiniela_dos = list()

    int_id_grupo = 0
    int_id_grupo_actual = 0

    str_nombre_grupo = ''

    for partido in obj_partidos:

        if partido["id_grupo"] != int_id_grupo:
            if int_id_grupo != 0:
                obj_lista = {
                    'partidos': partidos,
                    'nombre_grupo': str_nombre_grupo,
                }

                obj_quiniela_dos.append(obj_lista)

            partidos = list()

        date_diff = partido["fecha_hora"] - datetime.now()

        bool_readonly_penales = partido["resultado_congelado"] or \
                                (partido["goles_equipo_1"] != partido["goles_equipo_2"] and
                                 len(str(partido["goles_equipo_1"])) > 0)

        arr_partido = {
            "equipo1": partido["equipo1"],
            "equipo2": partido["equipo2"],
            "icono1": partido["icono1"],
            "icono2": partido["icono2"],
            "fecha": partido["fecha"],
            "hora": partido["hora"],
            "hay_penales": partido["hay_penales"],
            "goles_equipo_1": partido["goles_equipo_1"] if partido["goles_equipo_1"] else "",
            "goles_equipo_2": partido["goles_equipo_2"] if partido["goles_equipo_2"] else "",
            "penales_equipo_1": partido["penales_equipo_1"] if partido["penales_equipo_1"] else "",
            "penales_equipo_2": partido["penales_equipo_2"] if partido["penales_equipo_2"] else "",
            "id_partido": partido["id_partido"],
            "resultado_congelado": partido["resultado_congelado"],
            "bool_readonly_penales": bool_readonly_penales,
        }

        partidos.append(arr_partido)

        int_id_grupo = partido['id_grupo']
        str_nombre_grupo = partido['nombre_tipo']

    if int_id_grupo != 0:
        obj_lista = {
            'partidos': partidos,
            'nombre_grupo': str_nombre_grupo,
        }

        obj_quiniela_dos.append(obj_lista)

    data = {
        "quiniela": obj_quiniela_dos
    }

    return render(request, 'resultados/resultados.html', data)


def guardar(request):
    bool_status = True
    str_mensaje = "Vaticinio guardado exitosamente."

    int_empleado_id = request.user.empleado_id
    id_partido = request.POST.get("id_partido")
    goles_equipo_1 = request.POST.get("goles_equipo_1")
    goles_equipo_1 = goles_equipo_1 if goles_equipo_1 != "null" else None
    goles_equipo_2 = request.POST.get("goles_equipo_2")
    goles_equipo_2 = goles_equipo_2 if goles_equipo_2 != "null" else None
    penales_equipo_1 = request.POST.get("penales_equipo_1")
    penales_equipo_1 = penales_equipo_1 if penales_equipo_1 != "null" and penales_equipo_1 != "" else None
    penales_equipo_2 = request.POST.get("penales_equipo_2")
    penales_equipo_2 = penales_equipo_2 if penales_equipo_2 != "null" and penales_equipo_2 != "" else None

    try:
        obj_partido = Partido.objects.filter(id=id_partido).first()

        if goles_equipo_1 and len(goles_equipo_1) > 0:
            obj_partido.goles_equipo_1 = goles_equipo_1

        if goles_equipo_2 and len(goles_equipo_2) > 0:
            obj_partido.goles_equipo_2 = goles_equipo_2

        obj_partido.penales_equipo_1 = penales_equipo_1
        obj_partido.penales_equipo_2 = penales_equipo_2

        obj_partido.save()

    except ValueError:
        bool_status = False
        str_mensaje = "No se pudo guardar el vaticinio, refresque e intente nuevamente."

    data = {
        "status": bool_status,
        "mensaje": str_mensaje
    }

    return JsonResponse(data=data, safe=False)


def congelar(request):
    id_partido = int(request.POST.get("id_partido", None))
    obj_partido = Partido.objects.filter(id=id_partido).values('hay_penales', 'resultado_congelado', 'equipo_1__nombre',
                                                               'equipo_2__nombre', 'equipo_1__icono', 'equipo_2__icono',
                                                               'fecha', 'hora', 'goles_equipo_1', 'goles_equipo_2',
                                                               'penales_equipo_1', 'penales_equipo_2').first()

    obj_evento_inscripcion_partido = Evento_inscripcion_partido.objects.filter(partido_id=id_partido).all()

    bool_calcular = False
    str_mensaje = "Falta información del partido para congelar el resultado"

    if obj_partido["hay_penales"]:
        if obj_partido["goles_equipo_1"] == obj_partido["goles_equipo_2"]:
            if ((obj_partido["penales_equipo_1"] >= 0 and obj_partido["penales_equipo_2"] >= 0) or
                    (not obj_partido["penales_equipo_1"] and not obj_partido["penales_equipo_2"])):
                bool_calcular = True
        elif obj_partido["goles_equipo_1"] >= 0 and obj_partido["goles_equipo_2"] >= 0:
            bool_calcular = True
    else:
        if obj_partido["goles_equipo_1"] >= 0 and obj_partido["goles_equipo_2"] >= 0:
            bool_calcular = True

    if bool_calcular:
        try:
            arr_evento_inscripcion_partido = []
            for row in obj_evento_inscripcion_partido:
                if (obj_partido["hay_penales"] and row.penales_equipo_1 is not None and
                    row.penales_equipo_2 is not None) or\
                        (not obj_partido["hay_penales"] and row.goles_equipo_1 is not None
                         and row.goles_equipo_2 is not None):
                    int_puntos = 0
                    if obj_partido["goles_equipo_1"] == obj_partido["goles_equipo_2"]:
                        if (
                            (obj_partido["goles_equipo_1"] == row.goles_equipo_1)
                            and (obj_partido["goles_equipo_2"] == row.goles_equipo_2)
                            and (obj_partido["penales_equipo_1"] == row.penales_equipo_1)
                            and (obj_partido["penales_equipo_2"] == row.penales_equipo_2)
                        ):
                            int_puntos = 5
                        elif (
                            (obj_partido["goles_equipo_1"] == row.goles_equipo_1)
                            and (obj_partido["goles_equipo_2"] == row.goles_equipo_2)
                            and (obj_partido["penales_equipo_1"] != row.penales_equipo_1)
                            and (obj_partido["penales_equipo_2"] != row.penales_equipo_2)
                        ):
                            int_puntos = 3
                        elif (
                            (obj_partido["goles_equipo_1"] != row.goles_equipo_1)
                            and (obj_partido["goles_equipo_2"] != row.goles_equipo_2)
                            and (row.goles_equipo_1 == row.goles_equipo_2)
                        ):
                            int_puntos = 3
                        else:
                            int_puntos = 0
                    else:
                        if(
                            (obj_partido["goles_equipo_1"] == row.goles_equipo_1)
                            and (obj_partido["goles_equipo_2"] == row.goles_equipo_2)
                        ):
                            int_puntos = 5
                        elif(
                            (obj_partido["goles_equipo_1"] > obj_partido["goles_equipo_2"])
                            and (row.goles_equipo_1 > row.goles_equipo_2)
                        ):
                            int_puntos = 3
                        elif(
                            (obj_partido["goles_equipo_1"] < obj_partido["goles_equipo_2"])
                            and (row.goles_equipo_1 < row.goles_equipo_2)
                        ):
                            int_puntos = 3
                        elif(
                            (obj_partido["goles_equipo_1"] == obj_partido["goles_equipo_2"])
                            and (row.goles_equipo_1 == row.goles_equipo_2)
                            and (obj_partido["goles_equipo_1"] != row.goles_equipo_1)
                            and (obj_partido["goles_equipo_2"] != row.goles_equipo_2)
                        ):
                            int_puntos = 3
                        else:
                            int_puntos = 0

                    row.puntos = int_puntos
                    row.save()
                else:
                    row.puntos = 0
                    row.save()

                obj_inscripcion = Evento_inscripcion.objects.\
                    filter(id=row.evento_inscripcion_id).first()
                obj_user = User.objects.filter(empleado_id=obj_inscripcion.empleado_id).first()
                arr_evento_inscripcion_partido.append({
                    "participante": obj_user.name,
                    "goles_equipo_1": row.goles_equipo_1,
                    "goles_equipo_2": row.goles_equipo_2,
                    "penales_equipo_1": row.penales_equipo_1,
                    "penales_equipo_2": row.penales_equipo_2
                })

            obj_partido_save = Partido.objects.filter(id=id_partido).first()
            obj_partido_save.resultado_congelado = True
            obj_partido_save.save()

            bool_calcular = True
            str_mensaje = "Se congelo el resultado y se calcularon los punteos para cada participante"

            # print("\n\n", arr_evento_inscripcion_partido, "\n\n")

            make_email(arr_evento_inscripcion_partido, obj_partido)
        except ValueError:
            bool_calcular = False
            str_mensaje = "No se pudo congelar el resultado, refresque e intente nuevamente."

    data = {
        "status": bool_calcular,
        "mensaje": str_mensaje
    }

    return JsonResponse(data=data, safe=False)


def make_email(obj_evento_inscripcion_partido, obj_partido):
    str_message = ""
    bool_error = False

    str_query = """
            SELECT au.name, ISNULL(SUM(c.puntos), 0) as SUMA
            FROM NOVA..quiniela_evento_inscripcion as a
            JOIN NOVA..quiniela_evento as b
                ON b.id = a.evento_id
                AND b.activo = 1
            JOIN NOVA..auth_user AS au
                ON a.empleado_id = au.empleado_id
            LEFT JOIN NOVA..quiniela_evento_inscripcion_partido as c
                ON c.evento_inscripcion_id = a.id
            GROUP BY au.name
            ORDER BY SUMA desc, au.name
        """

    obj_resumen = get_query(str_query)

    data = {
        'evento_inscripcion_partido': obj_evento_inscripcion_partido,
        'partido': obj_partido,
        'resumen': obj_resumen,
        'imagen': IMAGEN_GB,
    }
    text = render_to_string('resultados/resumen_resultados.html', data)

    if text:
        arr_emails = ['nrodriguez@grupobuena.com']
        msg = EmailMessage('Vaticinios Ingresados', text, 'nova@grupobuena.com', arr_emails)
        try:
            msg.content_subtype = "html"
            msg.send()
        except ValueError:
            bool_error = True
            str_message = "No se pudo enviar el correo debido a: %s" % ValueError
    else:
        bool_error = True
        str_message = "No se pudo renderizar el template"

    if bool_error:
        return {'status': False, 'message': str_message}
    return {'status': True, 'message': 'Enviados correctamente'}