from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
# from faker import Faker

from mantenimiento.models import mempresa
from mantenimiento.forms import mempresaForm


@login_required(login_url="/login/")
def index(request):
    # fake = Faker()
    # list_to_insert = []
    # for _ in range(30):
    #     list_to_insert.append(mempresa(
    #         nombreempresa=fake.name(),
    #         direccion=fake.address(),
    #     ))
    # mempresa.objects.bulk_create(list_to_insert)
    arr_empresas = mempresa.objects.all()

    data = {
        'empresas': arr_empresas,
    }
    return render(request, 'empresas/mantenimiento_empresas.html', data)


@login_required(login_url="/login/")
def edit(request, pk):
    data_edit = mempresa.objects.get(id=pk)

    if request.method == 'POST':
        form = mempresaForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            data_edit.nombreempresa = data['nombreempresa']
            data_edit.direccion = data['direccion']
            data_edit.dirsocial = data['dirsocial']
            data_edit.nitempresa = data['nitempresa']
            data_edit.cloud = data['cloud']
            data_edit.logo = data['logo']
            data_edit.ctaclientes = data['ctaclientes']
            data_edit.tasausd = data['tasausd']
            data_edit.ivatasa = data['ivatasa']
            data_edit.ctaret = data['ctaret']
            data_edit.ctacxp = data['ctacxp']
            data_edit.ctaxliq = data['ctaxliq']
            data_edit.ctaivaxpag = data['ctaivaxpag']
            data_edit.ctaexec = data['ctaexec']
            data_edit.ctautilidades = data['ctautilidades']
            data_edit.ctaperdidas = data['ctaperdidas']
            data_edit.usarlector = data['usarlector']
            data_edit.rolempresa = data['rolempresa']
            data_edit.manejainv = data['manejainv']
            data_edit.usaconta = data['usaconta']
            data_edit.moneda = data['moneda']
            data_edit.tipodocto = data['tipodocto']
            data_edit.regimen = data['regimen']
            data_edit.correoemisor = data['correoemisor']
            data_edit.postal = data['postal']
            data_edit.pais = data['pais']
            data_edit.municipio = data['municipio']
            data_edit.departamento = data['departamento']
            data_edit.preciomanual = data['preciomanual']
            data_edit.agretiva = data['agretiva']
            data_edit.razonsocial = data['razonsocial']
            data_edit.ctaidpimp = data['ctaidpimp']
            data_edit.usafel = data['usafel']
            data_edit.ctaretiva = data['ctaretiva']
            data_edit.replegal = data['replegal']
            data_edit.contadorgeneral = data['contadorgeneral']
            data_edit.certificacion = data['certificacion']
            data_edit.lineasfac = data['lineasfac']
            data_edit.metodoimporta = data['metodoimporta']
            data_edit.ctaivapgtr = data['ctaivapgtr']
            data_edit.ctaivagasto = data['ctaivagasto']
            data_edit.codexport = data['codexport']
            data_edit.idbodega = data['idbodega']
            data_edit.idbodega2 = data['idbodega2']
            data_edit.descripcion = data['descripcion']
            data_edit.noestable = data['noestable']
            data_edit.ctaefectivo = data['ctaefectivo']
            data_edit.ctatransfer = data['ctatransfer']
            data_edit.ctaebanco1 = data['ctaebanco1']
            data_edit.ctaebanco2 = data['ctaebanco2']
            data_edit.certifica = data['certifica']
            data_edit.ctaperygan = data['ctaperygan']
            data_edit.save()
                
            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Registro actualizado."
            request.session['notificacion_icon'] = "add_alert"
            request.session['notificacion_color'] = "success"
            return redirect('mantenimiento-empresas')
        else:
            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Registro no actualizado."
            request.session['notificacion_icon'] = "warning"
            request.session['notificacion_color'] = "danger"

    data = {
        "form": data_edit
    }
    return render(request, 'empresas/mantenimiento_empresas_edit.html', data)


@login_required(login_url="/login/")
def create(request):
    if request.method == 'POST':
        form = mempresaForm(request.POST)

        if form.is_valid():
            data = form.cleaned_data
            print(data['nombreempresa'])
            data_save = mempresa.objects.create(
                nombreempresa=data['nombreempresa'],
                direccion=data['direccion'],
                razonsocial=data['razonsocial'],
                dirsocial=data['dirsocial'],
                nitempresa=data['nitempresa'],
                cloud=data['cloud'],
                logo=data['logo'],
                ctaclientes=data['ctaclientes'],
                tasausd=data['tasausd'],
                ivatasa=data['ivatasa'],
                ctaret=data['ctaret'],
                ctacxp=data['ctacxp'],
                ctaxliq=data['ctaxliq'],
                ctaivaxpag=data['ctaivaxpag'],
                ctaexec=data['ctaexec'],
                ctautilidades=data['ctautilidades'],
                ctaperdidas=data['ctaperdidas'],
                usarlector=data['usarlector'],
                rolempresa=data['rolempresa'],
                manejainv=data['manejainv'],
                usaconta=data['usaconta'],
                moneda=data['moneda'],
                tipodocto=data['tipodocto'],
                regimen=data['regimen'],
                correoemisor=data['correoemisor'],
                postal=data['postal'],
                pais=data['pais'],
                municipio=data['municipio'],
                departamento=data['departamento'],
                preciomanual=data['preciomanual'],
                agretiva=data['agretiva'],
                ctaidpimp=data['ctaidpimp'],
                usafel=data['usafel'],
                ctaretiva=data['ctaretiva'],
                replegal=data['replegal'],
                contadorgeneral=data['contadorgeneral'],
                certificacion=data['certificacion'],
                lineasfac=data['lineasfac'],
                metodoimporta=data['metodoimporta'],
                ctaivapgtr=data['ctaivapgtr'],
                ctaivagasto=data['ctaivagasto'],
                codexport=data['codexport'],
                idbodega=data['idbodega'],
                idbodega2=data['idbodega2'],
                descripcion=data['descripcion'],
                noestable=data['noestable'],
                ctaefectivo=data['ctaefectivo'],
                ctatransfer=data['ctatransfer'],
                ctaebanco1=data['ctaebanco1'],
                ctaebanco2=data['ctaebanco2'],
                certifica=data['certifica'],
                ctaperygan=data['ctaperygan']

            )
            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Registro grabado."
            request.session['notificacion_icon'] = "add_alert"
            request.session['notificacion_color'] = "success"
            return redirect('mantenimiento-empresas')
        else:
            request.session['notificacion'] = True
            request.session['notificacion_message'] = "Registro no grabado."
            request.session['notificacion_icon'] = "warning"
            request.session['notificacion_color'] = "danger"
    else:
        form = mempresaForm()

    return render(request, 'empresas/mantenimiento_empresas_create.html', {"form": form})

