from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from core.functions import get_query


@login_required(login_url="/login/")
def index(request):
    str_query = """
        SELECT au.name, ISNULL(SUM(c.puntos), 0) as SUMA, SUM(CASE WHEN puntos = 5 THEN 1 ELSE 0 END) AS total
        FROM NOVA..quiniela_evento_inscripcion as a
        JOIN NOVA..quiniela_evento as b
            ON b.id = a.evento_id
            AND b.activo = 1
        JOIN NOVA..auth_user AS au
            ON a.empleado_id = au.empleado_id
        LEFT JOIN NOVA..quiniela_evento_inscripcion_partido as c
            ON c.evento_inscripcion_id = a.id
        GROUP BY au.name
        ORDER BY SUMA desc, total desc, au.name
    """

    obj_datos = get_query(str_query)

    data = {
        "datos": obj_datos
    }

    return render(request, 'clasificacion/clasificacion.html', data)
