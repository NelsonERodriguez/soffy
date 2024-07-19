from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from core.functions import get_query
import datetime


@login_required(login_url="/login/")
def index(request):

    str_sql = """
        EXEC NOVA..presupuesto_vendedor_año
    """

    data = {
        "datos": get_query(str_sql=str_sql, bool_formatting=True)
    }

    return render(request, 'presupuesto_vendedores/presupuesto_vendedores.html', data)
