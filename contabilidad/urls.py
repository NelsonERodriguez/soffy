from django.urls import path
from contabilidad.controllers.centros_costo import centros_costo
from contabilidad.controllers.grupos import grupos
from contabilidad.controllers.nomenclatura_contable import nomenclatura_contable
from contabilidad.controllers.presupuestos import presupuestos

urlpatterns = [
    path('centros_costo/', centros_costo.index, name='contabilidad-centros_costo'),
    path('centros_costo/create/', centros_costo.create, name='contabilidad-centros_costo_create'),
    path('centros_costo/edit/<int:_id>', centros_costo.edit, name='contabilidad-centros_costo_edit'),
    path('centros_costo/delete/<int:_id>', centros_costo.delete, name='contabilidad-centros_costo_delete'),

    path('grupos/', grupos.index, name='contabilidad-grupos'),
    path('grupos/create/', grupos.create, name='contabilidad-grupos_create'),
    path('grupos/edit/<int:_id>', grupos.edit, name='contabilidad-grupos_edit'),
    path('grupos/delete/<int:_id>', grupos.delete, name='contabilidad-grupos_delete'),

    path('nomenclatura_contable/', nomenclatura_contable.index, name='contabilidad-nomenclatura_contable'),
    path('nomenclatura_contable/create/', nomenclatura_contable.create,
         name='contabilidad-nomenclatura_contable_create'),
    path('nomenclatura_contable/edit/<int:_id>', nomenclatura_contable.edit,
         name='contabilidad-nomenclatura_contable_edit'),
    path('nomenclatura_contable/delete/<int:_id>', nomenclatura_contable.delete,
         name='contabilidad-nomenclatura_contable_delete'),

    path('presupuestos/', presupuestos.index, name='contabilidad-presupuestos'),
    path('presupuestos/create/', presupuestos.create, name='contabilidad-presupuestos_create'),
    path('presupuestos/edit/<int:_id>', presupuestos.edit, name='contabilidad-presupuestos_edit'),
    path('presupuestos/delete/<int:_id>', presupuestos.delete, name='contabilidad-presupuestos_delete'),
]
