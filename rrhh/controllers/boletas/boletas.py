from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.functions import get_query, insert_query
from nova import settings
from soffybiz.debug import DEBUG
import base64
import os
import random
import string
from user_auth.models import User


@login_required(login_url="/login/")
def index(request):
    user_id = request.GET.get('user_id')
    str_sql = """
        SELECT U.name,
           U.email,
           U.empleado_id,
           EB.no_empresa,
           EB.no_empleado,
           EB.base_id,
           B.sql_name,
           B.name AS base
    FROM NOVA..auth_user U
             INNER JOIN ares..empleados_base EB ON EB.empleado_id = U.empleado_id
             INNER JOIN ares..databases B ON B.id = base_id
    WHERE EB.fecha_baja IS NULL
      AND U.id = %s
      AND EB.no_empresa <> 0
      AND EB.base_id IN (46, 50, 51, 53, 64)
        """ % (request.user.id if not user_id else user_id)

    arr_datos = []
    arr_empleado = get_query(str_sql=str_sql)
    for empleado in arr_empleado:
        arr_empresa = get_query(str_sql="SELECT Razon_Social FROM %s..empresas WHERE No_Empresa = %s" % (
            empleado['sql_name'], empleado['no_empresa']))
        arr_datos.append({
            "base_id": empleado['base_id'],
            "base": empleado['base'],
            "empleado": empleado['name'],
            "no_empleado": empleado['no_empleado'],
            "empresa": arr_empresa[0]['Razon_Social'],
            "no_empresa": empleado['no_empresa'],
            "sql_name": empleado['sql_name'],
        })

    user = {}
    if user_id:
        user = User.objects.filter(id=user_id, active=True, is_active=True).first()

    data = {
        "datos": arr_datos,
        "user": request.user if not user_id else user,
        "user_id": user_id,
    }

    return render(request, 'boletas/boletas.html', data)


@login_required(login_url="/login/")
def get_periodos(request):
    str_base = request.POST.get('base')
    str_no_empresa = request.POST.get('no_empresa')
    str_no_empleado = request.POST.get('no_empleado')
    str_sql = """
        SELECT TOP 28 P.Tipo_Periodo,
              P.No_Periodo,
              CONCAT(FORMAT(P.Fecha_Inicial, 'dd/MM/yyyy'), ' - ', FORMAT(P.Fecha_Final, 'dd/MM/yyyy')) AS Fecha
            FROM %s..periodos P
            WHERE P.No_Empresa = %s
              AND P.Tipo_Periodo in ('Q', 'M', 'A', 'B', 'E')
              AND P.Fecha_Cerro is not null
              AND P.Fecha_Inicial >= '2020-01-01'
            ORDER BY P.Fecha_Final DESC
        """ % (str_base, str_no_empresa)

    arr_datos = get_query(str_sql=str_sql)

    arr_periodos = []
    for datos in arr_datos:
        str_sql_boletas = """
            SELECT recibo_pdf
            FROM ares..boletas_firmadas
            WHERE no_empleado = '%s'
              AND no_periodo = %s
              AND no_empresa = %s
        """ % (str_no_empleado, datos['No_Periodo'], str_no_empresa)
        arr_recibo = get_query(str_sql=str_sql_boletas)

        arr_periodos.append({
            "recibo": arr_recibo[0]['recibo_pdf'] if arr_recibo else None,
            "No_Periodo": datos['No_Periodo'],
            "Fecha": datos['Fecha'],
            "Tipo_Periodo": datos['Tipo_Periodo'],
        })

    data = {
        "periodos": arr_periodos
    }

    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_boleta(request):
    str_base = request.POST.get('base')
    str_no_empleado = request.POST.get('no_empleado')
    str_no_empresa = request.POST.get('no_empresa')
    str_periodo = request.POST.get('periodo')
    str_sql = "EXEC %s..datosboletas '%s', '%s'" % (str_base, str_no_empleado, str_periodo)

    arr_datos = get_query(str_sql=str_sql)

    if arr_datos:
        total_ingresos = 0
        total_egresos = 0
        str_sql_boletas = """
            SELECT [recibo_pdf]
            FROM ares..boletas_firmadas
            WHERE no_empleado = '%s'
              AND no_periodo = %s
              AND no_empresa = %s
        """ % (str_no_empleado, str_periodo, str_no_empresa)
        arr_recibo = get_query(str_sql=str_sql_boletas)
        str_path = ""


        str_sql_recibo = """
            SELECT NoBoleta
            FROM NominaGB..vw_empleados_no_boleta
            WHERE no_empleado = '%s'
              AND no_periodo = %s
              AND no_empresa = %s
        """ % (str_no_empleado, str_periodo, str_no_empresa)
        arr_no_boleta = get_query(str_sql=str_sql_recibo)

        str_no_boleta = arr_no_boleta[0]["NoBoleta"] if arr_no_boleta else None

        if arr_recibo and DEBUG:
            str_path = "https://nova.ffinter.com/media%s" % arr_recibo[0]['recibo_pdf']
        elif arr_recibo and not DEBUG:
            str_path = "/media%s" % arr_recibo[0]['recibo_pdf']

        for datos in arr_datos:
            if datos['tipo'] == "Ingreso":
                total_ingresos += datos['valor']
            if datos['tipo'] == "Descuento":
                total_egresos += datos['valor']

        data = {
            "result": arr_datos,
            "image": str_path,
            "totalIngresos": total_ingresos,
            "totalEgresos": total_egresos,
            "totalLiquido": (total_ingresos - total_egresos),
            "no_boleta": str_no_boleta,
        }

        return render(request, 'boletas/recibo_pdf.html', data)
    else:
        return render(request, 'boletas/recibo_pdf.html')


@login_required(login_url="/login/")
def save_firma(request):
    str_id_base = request.POST.get('id_base')
    str_no_empleado = request.POST.get('no_empleado')
    str_no_empresa = request.POST.get('no_empresa')
    str_no_periodo = request.POST.get('no_periodo')
    file = request.POST.get('image')

    if file:
        try:
            str_format, str_img = file.split(';base64,')
            ext = str_format.split('/')[-1]
            filename = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10)) + '.' + ext
            filepath = os.path.join('rrhh', 'recibos', filename)

            with open(os.path.join(settings.MEDIA_ROOT, filepath), 'wb') as f:
                f.write(base64.b64decode(str_img))

            str_sql_boletas = """
                INSERT INTO ares..boletas_firmadas 
                (no_empleado, no_periodo, id_base, no_empresa, recibo_pdf, created_at, updated_at)
                VALUES ('%s', %s, %s, %s, '/%s', GETDATE(), GETDATE())
            """ % (str_no_empleado, str_no_periodo, str_id_base, str_no_empresa, filepath)
            insert_query(str_sql_boletas)
            data = {
                "status": True,
                "image": "/media/%s" % filepath
            }

            return JsonResponse(data, safe=False)
        except Exception as e:
            data = {
                "status": False,
                "msg": str(e)
            }
            return JsonResponse(data, safe=False)

    else:
        data = {
            "status": False,
            "msg": "No envio ninguna firma."
        }
        return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def reporte(request):
    return render(request, 'boletas/boletas_reporte.html')


@login_required(login_url='/login/')
def get_users(request):

    arr_users = []
    obj_users = User.objects.filter(
        name__contains=request.POST.get('user', ''),
        active=True,
        is_active=True,
        empleado_id__isnull=False
    ).exclude(id=1)

    for user in obj_users:
        arr_users.append({
            "name": user.name,
            "id": user.id,
        })

    return JsonResponse(arr_users, safe=False)
