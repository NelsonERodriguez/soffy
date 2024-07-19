from django.db import connection
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
import requests
import json


@login_required(login_url="/login/")
def index(request):
    data = {}
    return render(request, 'planeacion_demanda/indicador_planeacion_demanda.html', data)
