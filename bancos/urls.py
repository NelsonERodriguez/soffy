from django.urls import path
from bancos.controllers.cuentas_conciliacion_cuadratica import cuentas_conciliacion_cuadratica

urlpatterns = [

    path('cuentas_conciliacion_cuadratica/', cuentas_conciliacion_cuadratica.index,
         name='bancos-cuentas_conciliacion_cuadratica'),
    path('cuentas_conciliacion_cuadratica/edit/<int:_id>', cuentas_conciliacion_cuadratica.edit,
         name='bancos-cuentas_conciliacion_cuadratica_edit'),
    path('cuentas_conciliacion_cuadratica/create/', cuentas_conciliacion_cuadratica.create,
         name='bancos-cuentas_conciliacion_cuadratica_create'),

]
