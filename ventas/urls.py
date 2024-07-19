from django.urls import path
from . import views
from .controllers.anular_documentos import anular_documentos
from .controllers.precio_productos import precio_productos
from .controllers.encuestas import encuestas
from .controllers.reporte_encuestas import reporte_encuestas
# from .controllers.pedido_factura import pedido_factura
from .controllers.negociaciones_dci import negociaciones_dci
from .controllers.anular_cotizaciones import anular_cotizaciones
from .controllers.anular_facturas import anular_facturas
from .controllers.encuestas_voz_clientes import encuestas_voz_clientes
from .controllers.pedido_cotizacion import pedido_cotizacion
from .controllers.planeacion_demanda import planeacion_demanda, \
     indicador_planeacion_demanda, planeacion_demanda_cuadriles
from .controllers.presupuesto_vendedores import presupuesto_vendedores
from .controllers.clientes_prospectos import clientes_prospectos
from .controllers.ventas_sv import productos_sv, tipos_producto_sv, clientes_sv, orden_compra_sv
from . import functions

urlpatterns = [
    path('', views.index, name='ventas-home'),
    path('precio_productos/', precio_productos.index,
         name='ventas-precio_productos'),
    path('precio_productos/get_productos', precio_productos.get_productos,
         name='ventas-precio_productos_get_productos'),

    path('encuestas/', encuestas.index, name='ventas-encuestas'),
    path('encuestas/set_valor/', encuestas.set_valor,
         name='ventas-encuestas_set_valor'),

    path('reporte_encuestas/', reporte_encuestas.index,
         name='ventas-reporte_encuestas'),
    # path('pedido_factura/', pedido_factura.index, name='ventas-pedido_factura'),

    path('negociaciones_dci/', negociaciones_dci.index,
         name='ventas-negociaciones_dci'),
    path('negociaciones_dci/create_edit/<int:id>', negociaciones_dci.create_edit,
         name='ventas-negociaciones_dci_create_edit'),
    path('negociaciones_dci/get_productos/', negociaciones_dci.get_productos,
         name='ventas-negociaciones_dci_get_productos'),

    path('anular_cotizaciones/', anular_cotizaciones.index,
         name='ventas-anular_cotizaciones'),
    path('anular_cotizaciones/show/', anular_cotizaciones.show,
         name='ventas-anular_cotizaciones_show'),
    path('anular_cotizaciones/anular/', anular_cotizaciones.anular,
         name='ventas-anular_cotizaciones_anular'),
    path('anular_cotizaciones/get_documentos/', anular_cotizaciones.get_documentos,
         name='ventas-anular_cotizaciones_get_documentos'),

    # path('pedido_factura/por_facturar/data_table/', pedido_factura.por_facturar_datatable,
    # name='ventas-pedido_factura_por_facturar_datatable'),
    # path('pedido_factura/facturas/data_table/', pedido_factura.facturas_datatable,
    # name='ventas-pedido_factura_facturas_datatable'),
    # path('pedido_factura/guardar/', pedido_factura.guardar, name='ventas-pedido_factura_guardar'),
    path('encuestas_voz_clientes/', encuestas_voz_clientes.index,
         name='ventas-encuestas_voz_clientes'),
    path('encuestas_voz_clientes/buscar_cliente/', encuestas_voz_clientes.buscar_cliente,
         name='ventas-encuestas_voz_clientes_buscar_cliente'),
    path('encuestas_voz_clientes/save/', encuestas_voz_clientes.save,
         name='ventas-encuestas_voz_clientes_save'),
    path('encuestas_voz_clientes/interno/', encuestas_voz_clientes.index_interno,
         name='ventas-encuestas_voz_clientes_interno'),
    path('encuestas_voz_clientes/save/interno/', encuestas_voz_clientes.save_interno,
         name='ventas-encuestas_voz_clientes_save_interno'),
    path('encuestas_voz_clientes/get_clientes/<str:search>', encuestas_voz_clientes.get_clientes,
         name='ventas-encuestas_voz_clientes_get_clientes'),

    path('pedido_cotizacion/', pedido_cotizacion.index,
         name='ventas-pedido_cotizacion'),
    path('pedido_cotizacion/get_pedidos/', pedido_cotizacion.get_pedidos,
         name='ventas-pedido_cotizacion_get_pedidos'),
    path('pedido_cotizacion/pedido_detalle/<int:id>', pedido_cotizacion.pedido_detalle,
         name='ventas-pedido_cotizacion_pedido_detalle'),
    path('pedido_cotizacion/get_datos_cliente/', pedido_cotizacion.get_datos_cliente,
         name='ventas-pedido_cotizacion_get_datos_cliente'),
    path('pedido_cotizacion/get_sucursales/', pedido_cotizacion.get_sucursales,
         name='ventas-pedido_cotizacion_get_sucursales'),
    path('pedido_cotizacion/get_saldos_cliente/', pedido_cotizacion.get_saldos_cliente,
         name='ventas-pedido_cotizacion_get_saldos_cliente'),
    path('pedido_cotizacion/get_productos/', pedido_cotizacion.get_productos,
         name='ventas-pedido_cotizacion_get_productos'),
    path('pedido_cotizacion/add_cliente/', pedido_cotizacion.add_cliente,
         name='ventas-pedido_cotizacion_add_cliente'),
    path('pedido_cotizacion/process_venta/', pedido_cotizacion.process_venta,
         name='ventas-pedido_cotizacion_process_venta'),
    path('pedido_cotizacion/set_pesado/', pedido_cotizacion.set_pesado,
         name='ventas-pedido_cotizacion_set_pesado'),
    path('pedido_cotizacion/impresion/<int:id>/<str:tipo>/', pedido_cotizacion.impresion,
         name='ventas-pedido_cotizacion_impresion'),
    path('pedido_cotizacion/get_cotizacion/', pedido_cotizacion.get_cotizacion_despacho,
         name='ventas-pedido_cotizacion_get_cotizacion'),
    path('pedido_cotizacion/save_despacho/', pedido_cotizacion.save_despacho,
         name='ventas-pedido_cotizacion_save_despacho'),
    path('pedido_cotizacion/get_documentos_impresion/', pedido_cotizacion.get_documentos_impresion,
         name='ventas-pedido_cotizacion_get_documentos_impresion'),
    path('pedido_cotizacion/set_anulado/', pedido_cotizacion.set_anulado,
         name='ventas-pedido_cotizacion_set_anulado'),
    path('pedido_cotizacion/get_codigo_cliente/', pedido_cotizacion.get_codigo_cliente,
         name='ventas-pedido_cotizacion_get_codigo_cliente'),
    path('pedido_cotizacion/api_get_cotizacion/', pedido_cotizacion.api_get_cotizacion,
         name='ventas-pedido_cotizacion_api_get_cotizacion'),
    path('pedido_cotizacion/get_precio_producto/', pedido_cotizacion.get_precio_producto,
         name='ventas-pedido_cotizacion_get_precio_producto'),

    path('pedido_facturacion/', pedido_cotizacion.facturacion,
         name='ventas-pedido_facturacion'),

    path('enviar_cola_fel/', pedido_cotizacion.enviar_cola_fel,
         name='ventas-enviar_cola_fel'),

    path('api_enviar_cola_fel/', functions.api_enviar_cola_fel,
         name='ventas-api_enviar_cola_fel'),

    path('factura/process_factura/', functions.process_factura,
         name='ventas-factura_process_factura'),

    path('planeacion_demanda/', planeacion_demanda.index,
         name='ventas-planeacion_demanda'),
    path('planeacion_demanda/get_productos/', planeacion_demanda.get_productos,
         name='ventas-planeacion_demanda_get_productos'),
    path('planeacion_demanda/get_inventario_transito_pedido/', planeacion_demanda.get_inventario_transito_pedido,
         name='ventas-planeacion_demanda_get_inventario_transito_pedido'),
    path('planeacion_demanda/save_planeacion_detalle/', planeacion_demanda.save_planeacion_detalle,
         name='ventas-planeacion_demanda_save_planeacion_detalle'),
    path('planeacion_demanda/delete_planeacion_detalle/', planeacion_demanda.delete_planeacion_detalle,
         name='ventas-planeacion_demanda_delete_planeacion_detalle'),
    path('planeacion_demanda/cerrar_planeacion/', planeacion_demanda.cerrar_planeacion,
         name='ventas-planeacion_demanda_cerrar_planeacion'),
    path('planeacion_demanda/get_inventario_existencia/', planeacion_demanda.get_inventario_existencia,
         name='ventas-planeacion_demanda_get_inventario_existencia'),

    path('planeacion_demanda_cuadriles/', planeacion_demanda_cuadriles.index,
        name='ventas-planeacion_demanda_cuadriles'),
    path('planeacion_demanda_cuadriles/get_productos/',
        planeacion_demanda_cuadriles.get_productos,
        name='ventas-planeacion_demanda_cuadriles_get_productos'),
    path('planeacion_demanda_cuadriles/get_inventario_transito_pedido/',
        planeacion_demanda_cuadriles.get_inventario_transito_pedido,
        name='ventas-planeacion_demanda_cuadriles_get_inventario_transito_pedido'),
    path('planeacion_demanda_cuadriles/save_planeacion_detalle/',
        planeacion_demanda_cuadriles.save_planeacion_detalle,
        name='ventas-planeacion_demanda_cuadriles_save_planeacion_detalle'),
    path('planeacion_demanda_cuadriles/delete_planeacion_detalle/',
        planeacion_demanda_cuadriles.delete_planeacion_detalle,
        name='ventas-planeacion_demanda_cuadriles_delete_planeacion_detalle'),
    path('planeacion_demanda_cuadriles/cerrar_planeacion/',
        planeacion_demanda_cuadriles.cerrar_planeacion,
        name='ventas-planeacion_demanda_cuadriles_cerrar_planeacion'),
    path('planeacion_demanda_cuadriles/get_inventario_existencia/',
        planeacion_demanda_cuadriles.get_inventario_existencia,
        name='ventas-planeacion_demanda_cuadriles_get_inventario_existencia'),

    path('indicador_planeacion_demanda/', indicador_planeacion_demanda.index,
         name='ventas-indicador_planeacion_demanda'),

    path('anular_facturas/', anular_facturas.index,
         name='ventas-anular_facturas'),
    path('anular_facturas/show/', anular_facturas.show,
         name='ventas-anular_facturas_show'),
    path('anular_facturas/anular/', anular_facturas.anular,
         name='ventas-anular_facturas_anular'),

    path('presupuesto_vendedores/', presupuesto_vendedores.index,
         name='ventas-presupuesto_vendedores'),

    path('ingreso_clientes/', clientes_prospectos.index, name='ventas-clientes_prospectos'),

    path('anular_documentos/', anular_documentos.index, name='ventas-anular_documentos'),
    path('anular_documentos/get_facturas_anular/', anular_documentos.get_facturas_anular,
         name='ventas-anular_documentos_get_facturas_anular'),
    path('anular_documentos/get_notas_anular/', anular_documentos.get_notas_anular,
         name='ventas-anular_documentos_get_notas_anular'),
    path('anular_documentos/post_anular_factura/', anular_documentos.post_anular_factura,
         name='ventas-anular_documentos_post_anular_factura'),
    path('anular_documentos/post_anular_envio/', anular_documentos.post_anular_envio,
         name='ventas-anular_documentos_post_anular_envio'),
    path('anular_documentos/post_anular_nota/', anular_documentos.post_anular_nota,
         name='ventas-anular_documentos_post_anular_nota'),

    path('ventas_sv/productos_sv/', productos_sv.index, name='ventas-productos_sv'),
    path('ventas_sv/productos_sv/listado/', productos_sv.listado, name='ventas-productos_sv_listado'),
    path('ventas_sv/productos_sv/get_data/', productos_sv.get_data, name='ventas-productos_sv_get_data'),
    path('ventas_sv/productos_sv/guardar/', productos_sv.guardar, name='ventas-productos_sv_guardar'),
    path('ventas_sv/productos_sv/eliminar/', productos_sv.eliminar, name='ventas-productos_sv_eliminar'),
    path('ventas_sv/productos_sv/get_codigo_nuevo/', productos_sv.get_codigo_nuevo,
         name='ventas-productos_sv_get_codigo_nuevo'),

    path('ventas_sv/tipos_producto_sv/', tipos_producto_sv.index, name='ventas-tipos_producto_sv'),
    path('ventas_sv/tipos_producto_sv/listado/', tipos_producto_sv.listado, name='ventas-tipos_productos_sv_listado'),
    path('ventas_sv/tipos_producto_sv/get_data/', tipos_producto_sv.get_data,
         name='ventas-tipos_productos_sv_get_data'),
    path('ventas_sv/tipos_producto_sv/guardar/', tipos_producto_sv.guardar, name='ventas-tipos_productos_sv_guardar'),
    path('ventas_sv/tipos_producto_sv/eliminar/', tipos_producto_sv.eliminar,
         name='ventas-tipos_productos_sv_eliminar'),

    path('ventas_sv/clientes_sv/', clientes_sv.index, name='ventas-clientes_sv'),
    path('ventas_sv/clientes_sv/listado/', clientes_sv.listado, name='ventas-clientes_sv_listado'),
    path('ventas_sv/clientes_sv/get_data/', clientes_sv.get_data, name='ventas-clientes_sv_get_data'),
    path('ventas_sv/clientes_sv/guardar/', clientes_sv.guardar, name='ventas-clientes_sv_guardar'),
    path('ventas_sv/clientes_sv/eliminar/', clientes_sv.eliminar, name='ventas-clientes_sv_eliminar'),
    path('ventas_sv/clientes_sv/get_codigo_nuevo/', clientes_sv.get_codigo_nuevo,
         name='ventas-clientes_sv_get_codigo_nuevo'),

    path('ventas_sv/orden_compra_sv/', orden_compra_sv.index, name='ventas-orden_compra_sv'),
    path('ventas_sv/orden_compra_sv/listado/', orden_compra_sv.listado, name='ventas-orden_compra_sv_listado'),
    path('ventas_sv/orden_compra_sv/get_form/', orden_compra_sv.get_form, name='ventas-orden_compra_sv_get_form'),
    path('ventas_sv/orden_compra_sv/guardar/', orden_compra_sv.guardar, name='ventas-orden_compra_sv_guardar'),
    path('ventas_sv/orden_compra_sv/anular/', orden_compra_sv.anular, name='ventas-orden_compra_sv_anular'),

]
