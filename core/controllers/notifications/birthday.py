from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.db import connection
from django.http import QueryDict, JsonResponse

@login_required(login_url="/login/")
def index(request):
    cursor = connection.cursor()
    sql = """EXEC cumples"""
    cursor.execute(sql)

    data = []
    for row in cursor.fetchall():
        data.append({"empleado": row[0], "dia": row[1], "mes": row[2]})

    cursor.close()
    return JsonResponse(data, safe=False)