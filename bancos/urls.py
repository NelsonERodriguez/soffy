from django.urls import path
from bancos.controllers.cuentas_conciliacion_cuadratica import cuentas_conciliacion_cuadratica
from bancos.controllers.pago_proveedores import pago_proveedores

urlpatterns = [

    path('cuentas_conciliacion_cuadratica/', cuentas_conciliacion_cuadratica.index,
         name='bancos-cuentas_conciliacion_cuadratica'),
    path('cuentas_conciliacion_cuadratica/edit/<int:_id>', cuentas_conciliacion_cuadratica.edit,
         name='bancos-cuentas_conciliacion_cuadratica_edit'),
    path('cuentas_conciliacion_cuadratica/create/', cuentas_conciliacion_cuadratica.create,
         name='bancos-cuentas_conciliacion_cuadratica_create'),

    path('pago_proveedores/', pago_proveedores.index, name='bancos-pago_proveedores'),
    path('pago_proveedores/edit/<int:_id>', pago_proveedores.edit, name='bancos-pago_proveedores_edit'),
    path('pago_proveedores/create/', pago_proveedores.create, name='bancos-pago_proveedores_create'),

]
