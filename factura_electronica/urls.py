from django.urls import path
from . import views, functions


urlpatterns = [
    path('', views.index, name='factura_electronica-home'),
    path('validate_nit/', functions.validate_nit, name='factura_electronica-validate_nit')
]
