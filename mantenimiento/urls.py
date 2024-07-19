from django.urls import path
from . import views
from .controllers.empresas import empresas

urlpatterns = [
    path('', views.index, name='home'),path('empresas/', empresas.index, name='mantenimiento-empresas'),
    path('empresas/edit/<int:pk>', empresas.edit, name='mantenimiento-empresas_edit'),
    path('empresas/create/', empresas.create, name='mantenimiento-empresas_create'),
]
