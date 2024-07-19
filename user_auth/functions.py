from collections import namedtuple
from user_auth.models import User
# from contabilidad.models import Caja_Chica, Caja_Chica_Encargado
from django.db import connection
from django.http import JsonResponse


def get_usuarios(request, search):
    data= []
    usuarios = []
    if bool(search):
        cursor = connection.cursor()
        sql = "SELECT id, name FROM auth_user WHERE name LIKE '%%%s%%' " % search
        cursor.execute(sql)
    
        for usuario in cursor.fetchall():
            data.append({
                'id': usuario[0],
                'name': usuario[1],
            })
        cursor.close()
    
    return JsonResponse(data, safe=False)