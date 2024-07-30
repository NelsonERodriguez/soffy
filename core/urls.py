from django.urls import path
from core import views
from core.controllers.interfaces import interfaces
from core.controllers.empresas import empresas
from core.controllers.localidades import localidades
from core.controllers.notifications import birthday, football
from core.controllers.app_ventas_privacidad import app_ventas_privacidad
from core.controllers.paises import paises
from core.controllers.departamentos import departamentos
from core.controllers.municipios import municipios
from core.controllers.crear_ventanas import crear_ventanas
from core import functions


urlpatterns = [
    path('', views.pages, name='home_pages'),
    path('index/', views.index, name='home_core'),
    path('index/primera_carga', views.primera_carga, name='home_primera_carga'),
    path('index/primera_ventanas', views.crear_ventanas_existentes,
        name='home_primera_ventanas'),
    path('index_dashboard/', views.index_dashboard, name='core-dashboard'),
    path('login/', views.login, name="login"),
    path("logout/", views.logoutRequest, name="logout"),
    path("core/interfaces/", interfaces.index, name="core-interfaces"),
    path("core/interfaces/get_links/<int:pk>", interfaces.get_links, name="core-get_links"),
    path("core/interfaces/create", interfaces.create, name="core-interfaces_create"),
    path("core/interfaces/edit/<int:pk>", interfaces.edit, name="core-interfaces_edit"),
    path("core/notification/", views.notification, name="core-notification"),
    path("core/empresas/", empresas.index, name="core-empresas"),
    path("core/empresas/create", empresas.create, name="core-empresas_create"),
    path("core/empresas/edit/<int:pk>", empresas.edit, name="core-empresas_edit"),
    path("core/empresas/delete/<int:pk>", empresas.delete, name="core-empresas_delete"),
    path("core/localidades/", localidades.index, name="core-localidades"),
    path("core/localidades/create", localidades.create, name="core-localidades_create"),
    path("core/localidades/edit/<int:pk>", localidades.edit, name="core-localidades_edit"),
    path("core/localidades/delete/<int:pk>", localidades.delete, name="core-localidades_delete"),
    path("core/notificaciones/birthday", birthday.index, name='core-notifications_birthday'),
    path("core/notificaciones/football", football.index, name='core-notifications_football'),
    path("core/notificaciones/done-football", football.mark_as_done, name='core-notifications_football_done'),
    path("core/buscador", functions.buscador, name='core-buscador'),
    
    path("core/get_styles_custom", views.get_styles_custom, name='core-get_styles_custom'),
    path("core/save_custom_styles", views.save_custom_styles, name='core-save_custom_styles'),
    path("core/validate_login/", views.validate_login, name='core-validate_login'),
    path("core/login_fetch/", views.login_fetch, name='core-login_fetch'),

    path('app_ventas/privacidad/', app_ventas_privacidad.index, name='core-app_ventas_privacidad'),
    path('public/', views.public_site, name='core-public_site'),

    path('core/get_user_to_emulate/', views.get_user_to_emulate, name='core-get_user_to_emulate'),
    path('core/emulate_login/', views.emulate_login, name='core-emulate_login'),
    path('core/get_asistencias/', views.get_asistencias, name='core-get_asistencias'),

    path("core/paises/", paises.index, name="core-paises"),
    path("core/paises/create", paises.create, name="core-paises_create"),
    path("core/paises/edit/<int:pk>", paises.edit, name="core-paises_edit"),
    path("core/paises/delete/<int:pk>", paises.delete, name="core-paises_delete"),

    path("core/departamentos/", departamentos.index, name="core-departamentos"),
    path("core/departamentos/create", departamentos.create, name="core-departamentos_create"),
    path("core/departamentos/edit/<int:pk>", departamentos.edit, name="core-departamentos_edit"),
    path("core/departamentos/delete/<int:pk>", departamentos.delete, name="core-departamentos_delete"),

    path("core/municipios/", municipios.index, name="core-municipios"),
    path("core/municipios/create", municipios.create, name="core-municipios_create"),
    path("core/municipios/edit/<int:pk>", municipios.edit, name="core-municipios_edit"),
    path("core/municipios/delete/<int:pk>", municipios.delete, name="core-municipios_delete"),

    path("core/crear_ventanas/", crear_ventanas.index, name="core-crear_ventanas"),
    path("core/crear_ventanas/edit/<int:pk>", crear_ventanas.edit, name="core-crear_ventanas_edit"),
]
