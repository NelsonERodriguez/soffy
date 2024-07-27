from django.urls import path
from mantenimiento import views
from mantenimiento.controllers.bancos import bancos
from mantenimiento.controllers.bodega import bodega
from mantenimiento.controllers.canales import canales
from mantenimiento.controllers.documentos import documentos
from mantenimiento.controllers.empresas import empresas
from mantenimiento.controllers.usuarios_documentos import usuarios_documentos

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

    path('usuarios_documentos/', usuarios_documentos.index, name='mantenimiento-usuarios_documentos'),
    path('usuarios_documentos/edit/<int:_id>', usuarios_documentos.edit, name='mantenimiento-usuarios_documentos_edit'),
    path('usuarios_documentos/delete/', usuarios_documentos.delete, name='mantenimiento-usuarios_documentos_delete'),
    path('usuarios_documentos/create/<int:usuario_id>', usuarios_documentos.create,
         name='mantenimiento-usuarios_documentos_create'),

    path('canales/', canales.index, name='mantenimiento-canales'),
    path('canales/edit/<int:_id>', canales.edit, name='mantenimiento-canales_edit'),
    path('canales/create/', canales.create, name='mantenimiento-canales_create'),

]
