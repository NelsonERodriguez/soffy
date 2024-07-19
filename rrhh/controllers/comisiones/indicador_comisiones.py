from django.db import connection
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
import requests
import json


@login_required(login_url="/login/")
def index(request):

    
    data = {
        "groups_comisiones": [],
        "reportid_comisiones": [],
        "token_comisiones": [],
    }

    return render(request, 'comisiones/indicador_comisiones.html', data)
