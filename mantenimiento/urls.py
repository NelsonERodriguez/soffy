from django.urls import path
from mantenimiento import views
from mantenimiento.controllers.bancos import bancos
from mantenimiento.controllers.bodega import bodega
from mantenimiento.controllers.documentos import documentos
from mantenimiento.controllers.empresas import empresas

urlpatterns = [
    path('', views.index, name='home'),
    path('empresas/', empresas.index, name='mantenimiento-empresas'),
    path('empresas/edit/<int:pk>', empresas.edit, name='mantenimiento-empresas_edit'),
    path('empresas/create/', empresas.create, name='mantenimiento-empresas_create'),

    path('bodega/', bodega.index, name='mantenimiento-bodega'),
    path('bodega/edit/<int:_id>', bodega.edit, name='mantenimiento-bodega_edit'),
    path('bodega/create/', bodega.create, name='mantenimiento-bodega_create'),
    path('bodega/delete/<int:_id>', bodega.delete, name='mantenimiento-bodega_delete'),

    path('documentos/', documentos.index, name='mantenimiento-documentos'),
    path('documentos/edit/<int:_id>', documentos.edit, name='mantenimiento-documentos_edit'),
    path('documentos/create/', documentos.create, name='mantenimiento-documentos_create'),

    path('bancos/', bancos.index, name='mantenimiento-bancos'),
    path('bancos/edit/<int:_id>', bancos.edit, name='mantenimiento-bancos_edit'),
    path('bancos/create/', bancos.create, name='mantenimiento-bancos_create'),
]
