from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from core.functions import get_query
import datetime


@login_required(login_url="/login/")
def index(request):
    fecha_inicio = request.POST.get('fecha_inicio', None)
    fecha_fin = request.POST.get('fecha_fin', None)
    date = datetime.datetime.now()

    if fecha_inicio and fecha_fin:

        str_filter = """
            created_at BETWEEN '%s' AND '%s'
        """ % (fecha_inicio, fecha_fin)
    else:
        str_filter = """
        MONTH(created_at) = MONTH(GETDATE())
        AND YEAR(created_at) = YEAR(GETDATE())
        """

    sql = """
        SELECT 
            COUNT(valor) AS total, valor 
        FROM 
            ventas_encuestas_sala_ventas
        WHERE 
            %s
        GROUP BY valor ORDER BY valor
    """ % str_filter

    arr_return = get_query(sql)

    data = {
        "datos": arr_return,
        "fecha_inicio": fecha_inicio if
        fecha_inicio else '%s-%s-01' % (date.year, date.month if len(str(date.month)) > 1 else "0%s" % date.month),
        "fecha_fin": fecha_fin if
        fecha_fin else '%s-%s-30' % (date.year, date.month if len(str(date.month)) > 1 else "0%s" % date.month)
    }

    return render(request, 'reporte_encuestas/reporte_encuestas.html', data)
