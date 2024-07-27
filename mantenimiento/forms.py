from django import forms

from contabilidad.forms import Mcuentas, Mccos
from mantenimiento.models import Mbodega, Mdocumentos
from user_auth.models import User


class mempresaForm(forms.Form):
    nombreempresa = forms.CharField(max_length=100, required=False)
    direccion = forms.CharField(max_length=200, required=False)
    telefono = forms.CharField(max_length=50, required=False)
    nitempresa = forms.CharField(max_length=20, required=False)
    cloud = forms.IntegerField(required=False)
    logo = forms.CharField(max_length=200, required=False)
    ctaclientes = forms.CharField(max_length=10, required=False)
    tasausd = forms.DecimalField(max_digits=10, decimal_places=4, required=False)
    ivatasa = forms.DecimalField(max_digits=10, decimal_places=2, required=False)
    ctaiva = forms.CharField(max_length=10, required=False)
    ctaret = forms.CharField(max_length=10, required=False)
    ctacxp = forms.CharField(max_length=10, required=False)
    ctaxliq = forms.CharField(max_length=10, required=False)
    ctaivaxpag = forms.CharField(max_length=10, required=False)
    ctaexec = forms.CharField(max_length=10, required=False)
    ctautilidades = forms.CharField(max_length=10, required=False)
    ctaperdidas = forms.CharField(max_length=10, required=False)
    usarlector = forms.IntegerField(required=False)
    rolempresa = forms.IntegerField(required=False)
    manejainv = forms.IntegerField(required=False)
    usaconta = forms.CharField(max_length=2, required=False)
    moneda = forms.CharField(max_length=3, required=False)
    tipodocto = forms.CharField(max_length=10, required=False)
    regimen = forms.CharField(max_length=3, required=False)
    correoemisor = forms.CharField(max_length=200, required=False)
    postal = forms.CharField(max_length=10, required=False)
    pais = forms.CharField(max_length=5, required=False)
    municipio = forms.CharField(max_length=30, required=False)
    departamento = forms.CharField(max_length=30, required=False)
    preciomanual = forms.IntegerField(required=False)
    agretiva = forms.CharField(max_length=2, required=False)
    razonsocial = forms.CharField(max_length=100, required=False)
    dirsocial = forms.CharField(max_length=100, required=False)
    ctaidpimp = forms.CharField(max_length=10, required=False)
    usafel = forms.CharField(max_length=2, required=False)
    ctaretiva = forms.CharField(max_length=10, required=False)
    replegal = forms.CharField(max_length=200, required=False)
    contadorgeneral = forms.CharField(max_length=200, required=False)
    certificacion = forms.CharField(max_length=400, required=False)
    lineasfac = forms.IntegerField(required=False)
    metodoimporta = forms.IntegerField(required=False)
    ctaivapgtr = forms.CharField(max_length=10, required=False)
    ctaivagasto = forms.CharField(max_length=10, required=False)
    codexport = forms.CharField(max_length=15, required=False)
    idbodega = forms.IntegerField(required=False)
    idbodega2 = forms.IntegerField(required=False)
    descripcion = forms.DecimalField(max_digits=1, decimal_places=0, required=False)
    noestable = forms.DecimalField(max_digits=3, decimal_places=0, required=False)
    ctaefectivo = forms.CharField(max_length=10, required=False)
    ctatransfer = forms.CharField(max_length=10, required=False)
    ctaebanco1 = forms.CharField(max_length=10, required=False)
    ctaebanco2 = forms.CharField(max_length=10, required=False)
    certifica = forms.CharField(max_length=2, required=False)
    ctaperygan = forms.CharField(max_length=10, required=False)


class MbodegaForm(forms.Form):
    nbodega = forms.CharField(max_length=100, required=True)
    ubicacion = forms.CharField(max_length=100, required=True)
    activo = forms.BooleanField(required=False)
    predet = forms.BooleanField(required=False)
    ctacontable = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                         required=False,
                                         widget=forms.Select(attrs={'class': 'form-control'}),
                                         empty_label='Cuenta contable')
    cencos = forms.ModelChoiceField(queryset=Mccos.objects.filter(activo=True), to_field_name='id', required=False,
                                    widget=forms.Select(attrs={'class': 'form-control'}), empty_label='Centro de costo')


class MdocumentosForm(forms.Form):
    tipodocumento = forms.CharField(max_length=50, required=True)
    fechainicio = forms.DateField(required=True)
    fechavence = forms.DateField(required=True)
    serie = forms.CharField(max_length=20, required=True)
    desde = forms.IntegerField(required=True)
    hasta = forms.IntegerField(required=True)
    ultimano = forms.IntegerField(required=False)
    resolucion = forms.CharField(max_length=50, required=True)
    idsucursal = forms.ModelChoiceField(queryset=Mbodega.objects.filter(activo=True), to_field_name='id',
                                        required=True, widget=forms.Select(attrs={'class': 'form-control'}),
                                        empty_label='Bodega')
    describedocumento = forms.CharField(max_length=50, required=False)
    noestable = forms.DecimalField(max_digits=3, decimal_places=0, required=False)
    cortecaja = forms.CharField(max_length=2, required=False)


class MbancosForm(forms.Form):
    cueban = forms.CharField(required=True, max_length=50)
    nomban = forms.CharField(max_length=100, required=True)
    chequesigue = forms.IntegerField(required=False)
    ctacon = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                    required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                    empty_label='Cuenta contable')
    piecheq = forms.CharField(max_length=20, required=False)
    sobregiro = forms.BooleanField(required=False)
    moneda = forms.CharField(max_length=10, required=False)
    bloqueado = forms.BooleanField(required=False)
    saldoinicial = forms.DecimalField(max_digits=18, decimal_places=2, required=False)
    fechainicial = forms.DateField(required=False)


class MusersForm(forms.Form):
    iduser = forms.ModelChoiceField(queryset=User.objects.all(), to_field_name='id', required=True,
                                    widget=forms.Select(attrs={'class': 'form-control'}), empty_label='Usuario')
    seriepedido = forms.ModelChoiceField(queryset=Mdocumentos.objects.all(), to_field_name='id',
                                         required=True, widget=forms.Select(attrs={'class': 'form-control'}),
                                         empty_label='Serie Pedido')
    seriefactura = forms.ModelChoiceField(queryset=Mdocumentos.objects.all(), to_field_name='id',
                                          required=True, widget=forms.Select(attrs={'class': 'form-control'}),
                                          empty_label='Serie Factura')
    todas = forms.BooleanField(required=False)
    anulafacturas = forms.BooleanField(required=False)
    cambiaprecios = forms.BooleanField(required=False)


class Mbodega02Form(forms.Form):
    iduser = forms.ModelChoiceField(queryset=User.objects.all(), to_field_name='id', required=True,
                                    widget=forms.Select(attrs={'class': 'form-control'}), empty_label='Usuario')
    idbodega = forms.ModelChoiceField(queryset=Mbodega.objects.all(), to_field_name='id', required=True,
                                      widget=forms.Select(attrs={'class': 'form-control'}), empty_label='Bodega')


class McanalesForm(forms.Form):
    canal = forms.CharField(max_length=50, required=True)
    ocrcode = forms.CharField(max_length=10, required=False)
    agrupador = forms.CharField(max_length=30, required=True)


class MgruposocioForm(forms.Form):
    gruposocio = forms.CharField(max_length=50, required=True)
    ctacontable = forms.ModelChoiceField(queryset=Mcuentas.objects.filter(activo=True), to_field_name='id',
                                         required=False, widget=forms.Select(attrs={'class': 'form-control'}),
                                         empty_label='Cuenta contable')
