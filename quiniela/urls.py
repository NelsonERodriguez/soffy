from django.urls import path
from . import views
from .controllers.inscripcion import inscripcion
from .controllers.quiniela import quiniela
from .controllers.resultados import resultados
from .controllers.clasificacion import clasificacion
from .controllers.registro_pago import registro_pago
# from .controllers.ubicacion_cliente import ubicacion_cliente

urlpatterns = [
    path('', views.index, name='home'),
    path('inscripcion/', inscripcion.index, name='quiniela-inscripcion'),
    path('quiniela/', quiniela.index, name='quiniela-quiniela'),
    path('quiniela/guardar', quiniela.guardar, name='quiniela-guardar'),
    path('quiniela/vaticinios', quiniela.vaticinios, name='quiniela-vaticinios'),
    path('resultados/', resultados.index, name='quiniela-resultados'),
    path('resultados/guardar', resultados.guardar, name='quiniela-resultados_guardar'),
    path('resultados/congelar', resultados.congelar, name='quiniela-resultados_congelar'),
    path('clasificacion/', clasificacion.index, name='quiniela-clasificacion'),
    path('registro_pago/', registro_pago.index, name='quiniela-registro_pago'),
    path('registro_pago/registrar', registro_pago.registrar, name='quiniela-registro_pago_registrar'),
    # path('ubicacion_cliente/', ubicacion_cliente.index, name='auditoria-ubicacion_cliente'),
    # path('ubicacion_cliente/get_clientes/<str:search>', ubicacion_cliente.get_clientes,name='auditoria-ubicacion_cliente_search'),
]