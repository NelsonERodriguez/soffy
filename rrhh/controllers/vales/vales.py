# Create your views here.
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Max
from rrhh.models import Vales
from core.functions import set_notification
import qrcode
import datetime


@login_required(login_url="/login/")
def index(request):
    now = datetime.datetime.now()
    user_extra = None
    correlativo = 0
    if request.method == 'POST':
        user = request.POST.get('empleado_id', 0)
        user_extra = request.POST.get('user_extra', None)
        correlativo = request.POST.get('correlativo', 0)
    else:
        user = f"{request.user.id}"

    year = f"{now.year}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )

    if user_extra:
        if not correlativo:
            correlativo = Vales.objects.filter(user_id=user).aggregate(last=Max('correlativo'))['last']
            if correlativo:
                correlativo += 1
            else:
                correlativo = 1

            Vales.objects.create(
                user_id=user,
                estado=0,
                pavo_pierna=request.POST.get('pavo_pierna', 'pavo'),
                correlativo=correlativo,
                empleado=request.POST.get('nombre', ''),
                year=year
            )
        else:
            vale = Vales.objects.filter(user_id=user, correlativo=correlativo)
            if vale:
                correlativo = vale[0].correlativo
            else:
                correlativo = Vales.objects.filter(user_id=user).aggregate(last=Max('correlativo'))['last']
                if correlativo:
                    correlativo += 1
                else:
                    correlativo = 1
                Vales.objects.create(
                    user_id=user,
                    estado=0,
                    pavo_pierna=request.POST.get('pavo_pierna', 'pavo'),
                    correlativo=correlativo,
                    empleado=request.POST.get('nombre', ''),
                    year=year
                )

        qr.add_data(
            f'https://nova.ffinter.com/rrhh/vales/qr_validar/params/user___{user}|year___{year}|correlativo___{year}')

    else:
        qr.add_data(f'https://nova.ffinter.com/rrhh/vales/qr_validar/params/user___{user}|year___{year}')
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    if user_extra:
        str_img = f"media/rrhh/qr/vales/user_{user}_{correlativo}_{year}.png"
        str_path = f"/media/rrhh/qr/vales/user_{user}_{correlativo}_{year}.png"
    else:
        str_img = f"media/rrhh/qr/vales/user_{user}_{year}.png"
        str_path = f"/media/rrhh/qr/vales/user_{user}_{year}.png"

    try:
        img.save(str_img)
    except ValueError:
        pass

    if correlativo and user_extra:
        vales = Vales.objects.filter(user__id=user, correlativo=correlativo, year=year).first()
    else:
        vales = Vales.objects.filter(user__id=user, year=year).first()

    data = {
        "image": str_path,
        "vales": vales
    }

    return render(request, 'vales/mi_vale.html', data)


@login_required(login_url="/login/")
def qr_validar(request, params):
    vale = None
    if params != "user":
        arr_split = params.split('|')
        str_user_param = arr_split[0]
        str_year_param = arr_split[1] if 1 in arr_split else f'year___{datetime.datetime.now().year}'
        user = str_user_param.split('___')[1]
        year = str_year_param.split('___')[1]
        correlativo = arr_split[2].split('___')[1] if len(arr_split) == 3 else 0

        vale = Vales.objects.filter(
            user__id=user,
            year=year,
            correlativo=correlativo
        )

        if vale:
            vale = vale[0]

    if request.POST.get('canjear', None):
        now = datetime.datetime.now()
        user = request.POST.get('empleado_id', 0)
        vale = Vales.objects.filter(
            user_id=user,
            year=request.POST.get('year', now.year),
            correlativo=request.POST.get('correlativo', 0)
        )[0]
        vale.estado = 1
        vale.save()
        vale = None

        set_notification(request, True, "Vale canjeado.", "add_alert", "success")

    data = {
        "vale": vale
    }

    return render(request, 'vales/qr_scan.html', data)


@login_required(login_url="/login/")
def qr_user_reporte(request):
    now = datetime.datetime.now()
    year = f"{now.year}"
    vales = Vales.objects.filter(year=year)

    data = {
        "vales": vales
    }

    return render(request, 'vales/vales_reporte.html', data)
