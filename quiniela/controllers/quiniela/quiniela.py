from datetime import datetime
from operator import truediv
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query, set_notification
from quiniela.models import Partido, Evento_inscripcion, Evento, Evento_inscripcion_partido


@login_required(login_url="/login/")
def index(request):
	int_empleado_id = request.user.empleado_id

	# evento_id

	str_query = """
		SELECT e1.nombre as equipo1, e2.nombre as equipo2,
				e1.icono as icono1, e2.icono as icono2,
				d.nombre as nombre_tipo, c.fecha, c.hora, c.id as 'id_partido',
				d.id as id_grupo, cast(e.goles_equipo_1 as varchar) as 'goles_equipo_1',
				cast(e.goles_equipo_2 as varchar) as 'goles_equipo_2',
				cast(e.penales_equipo_1 as varchar) as 'penales_equipo_1',
				cast(e.penales_equipo_2 as varchar) as 'penales_equipo_2',
				cast(e.puntos as varchar) as 'puntos',
				
				cast(c.goles_equipo_1 as varchar) as 'r_goles_equipo_1',
				cast(c.goles_equipo_2 as varchar) as 'r_goles_equipo_2',
				cast(c.penales_equipo_1 as varchar) as 'r_penales_equipo_1',
				cast(c.penales_equipo_2 as varchar) as 'r_penales_equipo_2',
				
				e.id as 'id_registro_guardado',
				cast(fecha as datetime) + cast(hora as datetime) as 'fecha_hora',
				c.hay_penales, c.resultado_congelado
		FROM NOVA..quiniela_evento_inscripcion as a
		INNER JOIN NOVA..quiniela_evento as b
			ON b.id = a.evento_id
			AND b.activo = 1
		INNER JOIN NOVA..quiniela_partido as c
			ON c.evento_id = b.id
		INNER JOIN NOVA..quiniela_equipo as e1
			ON e1.id = c.equipo_1_id
		INNER JOIN NOVA..quiniela_equipo as e2
			ON e2.id = c.equipo_2_id
		INNER JOIN NOVA..quiniela_tipo_partido as d
			ON d.id = c.tipo_partido_id
		LEFT JOIN NOVA..quiniela_evento_inscripcion_partido as e
			ON e.partido_id = c.id
			AND e.evento_inscripcion_id = a.id
		WHERE a.empleado_id = %s
		ORDER BY d.orden, c.fecha, c.hora, e1.nombre, e2.nombre
	""" % (int_empleado_id)

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
					'id_grupo': int_id_grupo,
				}

				obj_quiniela_dos.append(obj_lista)

			partidos = list()

		date_diff = partido["fecha_hora"] - datetime.now()

		bool_readonly_penales = partido["resultado_congelado"] or\
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
			"puntos": partido["puntos"] if partido["puntos"] else "",

			"r_goles_equipo_1": partido["r_goles_equipo_1"] if partido["r_goles_equipo_1"] else "",
			"r_goles_equipo_2": partido["r_goles_equipo_2"] if partido["r_goles_equipo_2"] else "",
			"r_penales_equipo_1": partido["r_penales_equipo_1"] if partido["r_penales_equipo_1"] else "",
			"r_penales_equipo_2": partido["r_penales_equipo_2"] if partido["r_penales_equipo_2"] else "",

			"id_partido": partido["id_partido"],
			"id_registro_guardado": partido["id_registro_guardado"],
			"bloqueado": date_diff.total_seconds() < 600,
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
			'id_grupo': int_id_grupo,
		}

		obj_quiniela_dos.append(obj_lista)

	data = {
		"quiniela": obj_quiniela_dos
	}

	return render(request, 'quiniela/quiniela.html', data)


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
		obj_evento = Evento.objects.filter(activo=True).first()
		obj_partido = Partido.objects.filter(id=id_partido).first()
		obj_evento_inscripcion = Evento_inscripcion.objects\
			.filter(empleado_id=int_empleado_id, evento_id=obj_evento.id).first()
		obj_evento_inscripcion_partido = Evento_inscripcion_partido.objects\
			.filter(partido_id=obj_partido.id, evento_inscripcion_id=obj_evento_inscripcion.id).first()

		fecha_hora = datetime.combine(obj_partido.fecha, obj_partido.hora)
		date_diff = fecha_hora - datetime.now()

		if date_diff.total_seconds() < 600:
			raise ValueError("error de tiempo")

		if not obj_evento_inscripcion_partido:
			obj_evento_inscripcion_partido = Evento_inscripcion_partido.objects.create(
				partido_id=obj_partido.id,
				evento_inscripcion_id=obj_evento_inscripcion.id
			)

		if goles_equipo_1 and len(goles_equipo_1) > 0:
			obj_evento_inscripcion_partido.goles_equipo_1 = goles_equipo_1

		if goles_equipo_2 and len(goles_equipo_2) > 0:
			obj_evento_inscripcion_partido.goles_equipo_2 = goles_equipo_2

		obj_evento_inscripcion_partido.penales_equipo_1 = penales_equipo_1
		obj_evento_inscripcion_partido.penales_equipo_2 = penales_equipo_2

		obj_evento_inscripcion_partido.save()

	except ValueError:
		bool_status = False
		str_mensaje = "Ya pasó el tiempo límite para guardar el vaticinio el cual es de 10 minutos antes del partido."
	except:
		bool_status = False
		str_mensaje = "No se pudo guardar el vaticinio, refresque e intente nuevamente."

	data = {
		"status": bool_status,
		"mensaje": str_mensaje
	}

	return JsonResponse(data=data, safe=False)


def vaticinios(request):
	int_partido = request.POST.get("partido", None)
	Evento_inscripcion_partido.objects.filter()
	str_query = """
		SELECT cast(qeip.goles_equipo_1 as varchar) as 'goles_equipo_1',
				cast(qeip.goles_equipo_2 as varchar) as 'goles_equipo_2',
				cast(qeip.penales_equipo_1 as varchar) as 'penales_equipo_1',
				cast(qeip.penales_equipo_2 as varchar) as 'penales_equipo_2', au.name
		FROM NOVA..quiniela_partido AS qp
		JOIN NOVA..quiniela_evento_inscripcion_partido AS qeip
			ON qp.id = qeip.partido_id
		JOIN NOVA..quiniela_evento_inscripcion AS qei
			ON qeip.evento_inscripcion_id = qei.id
		JOIN NOVA..auth_user AS au
			ON qei.empleado_id = au.empleado_id
		WHERE qp.id = %s
	""" % int_partido

	obj_vaticinios = get_query(str_query)

	obj_partido = Partido.objects.values('hay_penales', 'resultado_congelado', 'equipo_1__nombre', 'equipo_2__nombre',
										 'equipo_1__icono', 'equipo_2__icono', 'fecha', 'hora').get(id=int_partido)

	fecha_hora = datetime.combine(obj_partido["fecha"], obj_partido["hora"])
	date_diff = fecha_hora - datetime.now()

	if not obj_partido["resultado_congelado"]:
		if date_diff.total_seconds() > 600:
			obj_vaticinios = []

	data = {
		"status": True,
		"vaticinios": obj_vaticinios,
		"partido": obj_partido,
	}

	return JsonResponse(data=data, safe=False)
