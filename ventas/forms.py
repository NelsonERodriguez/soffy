from django import forms

class Encuestas_voz_clientesForm(forms.Form):
    NoCliente = forms.IntegerField()
    telefono = forms.CharField(required=True)

    pregunta_evalua_servicio = forms.CharField(max_length=9)

    pregunta_comunicacion = forms.CharField(max_length=15)

    detalle_pregunta_comunicacion = forms.CharField(required=False)

    pregunta_realizar_pedido = forms.CharField( max_length=14)

    pregunta_metodo_pedido = forms.CharField( max_length=8)

    detalle_pregunta_metodo_pedido = forms.CharField(required=False)
    pregunta_vendedor_ofrece = forms.IntegerField()
    pregunta_cambio_precio = forms.IntegerField()

    pregunta_visitas_vendedor = forms.CharField( max_length=9 )

    comentario = forms.CharField(required=False)