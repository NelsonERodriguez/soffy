from django.urls import path
from . import views
from rrhh.controllers import departamentos as departamentos_rrhh, vacaciones_admin, puestos, empleados_puestos, \
    empleados_suspensiones
from rrhh.controllers.vales import vales
from rrhh.controllers.ingreso_horas_extras import ingreso_horas_extras
from rrhh.controllers.reporte_horas_extras import reporte_horas_extras
from rrhh.controllers.registro_horas_extras import registro_horas_extras
from rrhh.controllers.planificacion_vacaciones import planificacion_vacaciones
from rrhh.controllers.actualizacion_datos import actualizacion_datos
from rrhh.controllers.confirmar_datos import confirmar_datos
from rrhh.controllers.carga_archivos_pagos import carga_archivos_pagos
from rrhh.controllers.reglas_comision import reglas_comision, reglas_comision_v2, reglas_comision_v3
from rrhh.controllers.movimientos_programados import movimientos_programados
from rrhh.controllers.comisiones import comisiones, indicador_comisiones, comisiones_modificadas, reprocesar
from rrhh.functions import get_departamento, get_puesto
from rrhh.controllers.asistencia import asistencia
from rrhh.controllers.libreria import productos, egresos, reporte_existencia, reporte_movimientos, ingreso_bodega
from rrhh.controllers.matriz_telefonos import matriz_telefonos
from rrhh.controllers.administracion_telefonos import administracion_telefonos
from rrhh.controllers.boletas import boletas
from rrhh.controllers.reporte_telefonos import reporte_telefonos
from rrhh.controllers.vacaciones import reporte_vacaciones_empleados, autorizacion_rrhh
from rrhh.controllers.horarios import horarios
from rrhh.controllers.horarios_empleados import empleados_horarios
from rrhh.controllers.solicitud_vacaciones import solicitud_vacaciones
from rrhh.controllers.listado_pasivos import listado_pasivos
from rrhh.controllers.aprobar_vacaciones import aprobar_vacaciones
from rrhh.controllers.impresion_vacaciones import impresion_vacaciones
from rrhh.controllers.revision_vacaciones_periodos import revision_vacaciones_periodos
from rrhh.controllers.reporte_sueldos import reporte_sueldos
from rrhh.controllers.ficha_empleados import ficha_empleados
from rrhh.controllers.distribucion_polizas import distribucion_polizas
from rrhh.controllers.permisos_tipos import permisos_tipos
from rrhh.controllers.permisos_aprobar import permisos_aprobar
from rrhh.controllers.permisos_impresion import permisos_impresion
from rrhh.controllers.permisos_revision import permisos_revision
from rrhh.controllers.permisos_solicitud import permisos_solicitud
from rrhh.controllers.consulta_nomina import consulta_nomina

urlpatterns = [
    path('', views.index, name='home'),
    path('departamentos/', departamentos_rrhh.index, name='rrhh-departamentos'),
    path('departamentos/create', departamentos_rrhh.create, name='rrhh-departamentos_create'),
    path('departamentos/edit/<int:pk>', departamentos_rrhh.edit, name='rrhh-departamentos_edit'),
    path('departamentos/delete/<int:pk>', departamentos_rrhh.delete, name='rrhh-departamentos_delete'),
    path('puestos/', puestos.index, name='rrhh-puestos'),
    path('puestos/create', puestos.create, name='rrhh-puestos_create'),
    path('puestos/edit/<int:pk>', puestos.edit, name='rrhh-puestos_edit'),
    path('puestos/delete/<int:pk>', puestos.delete, name='rrhh-puestos_delete'),
    path('empleados-puestos/', empleados_puestos.index, name='rrhh-empleados_puestos'),
    path('empleados-puestos/create', empleados_puestos.create, name='rrhh-empleados_puestos_create'),
    path('empleados-puestos/edit/<int:pk>', empleados_puestos.edit, name='rrhh-empleados_puestos_edit'),
    path('empleados-puestos/delete/<int:pk>', empleados_puestos.delete, name='rrhh-empleados_puestos_delete'),
    path('solicitud-vacaciones/', vacaciones_admin.index, name='rrhh-solicitud_vacaciones'),
    path('solicitud-vacaciones/create', vacaciones_admin.create, name='rrhh-solicitud_vacaciones_create'),
    path('solicitud-vacaciones/edit/<int:pk>', vacaciones_admin.edit, name='rrhh-solicitud_vacaciones_edit'),
    path('solicitud-vacaciones/delete/<int:pk>', vacaciones_admin.delete, name='rrhh-solicitud_vacaciones_delete'),
    path('solicitud-vacaciones/aprobar/<int:pk>', vacaciones_admin.aprobar, name='rrhh-solicitud_vacaciones_aprobar'),
    path('solicitud-vacaciones/imprimir/<int:pk>', vacaciones_admin.imprimir,
         name='rrhh-solicitud_vacaciones_imprimir'),
    path("search_departamento/<str:search>/", get_departamento, name="rrhh-search_departamento"),
    path("search_puesto/<str:search>/<int:departamento_id>", get_puesto, name="rrhh-search_puesto"),
    path("vales/qr_user/", vales.index, name="rrhh-vales_qr_user"),
    path("vales/qr_validar/params/<str:params>", vales.qr_validar, name="rrhh-vales_qr_validar"),
    path("vales/qr_reporte/", vales.qr_user_reporte, name="rrhh-vales_qr_user_reporte"),
    path('empleados_suspensiones', empleados_suspensiones.index, name='rrhh-empleados_suspensiones'),
    path('empleados_suspensiones/create', empleados_suspensiones.create, name='rrhh-empleados_suspensiones_create'),
    path('empleados_suspensiones/edit/<int:pk>', empleados_suspensiones.edit, name='rrhh-empleados_suspensiones_edit'),
    path('ingreso_horas_extras/', ingreso_horas_extras.index, name='rrhh-ingreso_horas_extras'),
    path('ingreso_horas_extras/get_horarios/', ingreso_horas_extras.get_horarios,
         name='rrhh-ingreso_horas_extras_get_horarios'),
    path('ingreso_horas_extras/cerrar_quincena/', ingreso_horas_extras.cerrar_quincena,
         name='rrhh-ingreso_horas_extras_cerrar_quincena'),
    path('reporte_horas_extras/', reporte_horas_extras.index, name='rrhh-reporte_horas_extras'),
    path('reporte_horas_extras/ver_reporte/<int:id>', reporte_horas_extras.ver_reporte,
         name='rrhh-reporte_horas_extras_ver_reporte'),
    path('reporte_horas_extras/abrir/<int:id>', reporte_horas_extras.abrir,
         name='rrhh-reporte_horas_extras_abrir'),
    path('registro_horas_extras/', registro_horas_extras.index, name='rrhh-registro_horas_extras'),
    path('registro_horas_extras/ver_reporte/<int:id>', registro_horas_extras.ver_reporte,
         name='rrhh-registro_horas_extras_ver_reporte'),
    path('planificacion_vacaciones/', planificacion_vacaciones.index, name='rrhh-planificacion_vacaciones'),
    path('planificacion_vacaciones/get_empresas/', planificacion_vacaciones.get_empresas,
         name='rrhh-planificacion_vacaciones_get_empresas'),
    path('planificacion_vacaciones/get_empleados/', planificacion_vacaciones.get_empleados,
         name='rrhh-planificacion_vacaciones_get_empleados'),
    path('planificacion_vacaciones/get_vacaciones/', planificacion_vacaciones.get_vacaciones,
         name='rrhh-planificacion_vacaciones_get_vacaciones'),
    path('planificacion_vacaciones/get_dias_disponibles/', planificacion_vacaciones.get_dias_disponibles,
         name='rrhh-planificacion_vacaciones_get_dias_disponibles'),
    path('planificacion_vacaciones/save_vacaciones/', planificacion_vacaciones.save_vacaciones,
         name='rrhh-planificacion_vacaciones_save_vacaciones'),
    path('planificacion_vacaciones/delete_vacaciones/', planificacion_vacaciones.delete_vacaciones,
         name='rrhh-planificacion_vacaciones_delete_vacaciones'),

    path('actualizacion_datos/', actualizacion_datos.index, name='rrhh-actualizacion_datos'),
    path('actualizacion_datos/guardar/', actualizacion_datos.guardar, name='rrhh-actualizacion_datos_guardar'),

    path('confirmar_datos/', confirmar_datos.index, name='rrhh-confirmar_datos'),
    path('confirmar_datos/get_info/', confirmar_datos.get_info, name='rrhh-confirmar_datos_get_info'),
    path('confirmar_datos/save/', confirmar_datos.save, name='rrhh-confirmar_datos_save'),

    path('carga_archivos_pagos/', carga_archivos_pagos.index, name='rrhh-carga_archivos'),
    path('carga_archivos_pagos/movimientos', carga_archivos_pagos.get_movements_pending,
         name='rrhh-carga_archivos_movimientos'),
    path('carga_archivos_pagos/guardar', carga_archivos_pagos.process_file, name='rrhh-carga_archivos_guardar'),
    path('carga_archivos_pagos/guardar_nomina', carga_archivos_pagos.guardar_nomina,
         name='rrhh-carga_archivos_guardar_nomina'),
    path('carga_archivos_pagos/borrar_registro', carga_archivos_pagos.borrar_registro,
         name='rrhh-carga_archivos_borrar_registro'),
    path('carga_archivos_pagos/borrar_registros', carga_archivos_pagos.borrar_registros,
         name='rrhh-carga_archivos_borrar_registros'),

    path('reglas_comision/', reglas_comision.index, name='rrhh-reglas_comision'),
    path("reglas_comision/edit/<int:pk>", reglas_comision.edit, name="rrhh-reglas_comision_edit"),
    path('reglas_comision/get_cliente/<str:search>/', reglas_comision.get_cliente,
         name='rrhh-reglas_comision_get_cliente'),
    path('reglas_comision/get_vendedor/<str:search>/', reglas_comision.get_vendedor,
         name='rrhh-reglas_comision_get_vendedor'),
    path('reglas_comision/get_producto/<str:search>/', reglas_comision.get_producto,
         name='rrhh-reglas_comision_get_producto'),
    path("reglas_comision/save/<int:pk>", reglas_comision.save, name="rrhh-reglas_comision_save"),

    path('reglas_comision_v2/', reglas_comision_v2.index, name='rrhh-reglas_comision_v2'),
    path('reglas_comision_v2/get_reglas/', reglas_comision_v2.get_reglas, name='rrhh-reglas_comision_v2_get_reglas'),
    path('reglas_comision_v2/edit/', reglas_comision_v2.edit, name='rrhh-reglas_comision_v2_edit'),
    path('reglas_comision_v2/get_producto/<str:search>/<str:union>/', reglas_comision_v2.get_producto,
         name='rrhh-reglas_comision_v2_get_producto'),
    path('reglas_comision_v2/get_cliente/<str:search>/<str:union>/', reglas_comision_v2.get_cliente,
         name='rrhh-reglas_comision_v2_get_cliente'),
    path('reglas_comision_v2/get_vendedor/<str:search>/<str:union>/', reglas_comision_v2.get_vendedor,
         name='rrhh-reglas_comision_v2_get_vendedor'),
    path('reglas_comision_v2/save/', reglas_comision_v2.save, name='rrhh-reglas_comision_v2_save'),

    path('reglas_comision_v3/', reglas_comision_v3.index, name='rrhh-reglas_comision_v3'),
    path('reglas_comision_v3/get_reglas/', reglas_comision_v3.get_reglas, name='rrhh-reglas_comision_v3_get_reglas'),
    path('reglas_comision_v3/edit/', reglas_comision_v3.edit, name='rrhh-reglas_comision_v3_edit'),
    path('reglas_comision_v3/get_producto/<str:search>/<str:union>/', reglas_comision_v3.get_producto,
         name='rrhh-reglas_comision_v3_get_producto'),
    path('reglas_comision_v3/get_cliente/<str:search>/<str:union>/', reglas_comision_v3.get_cliente,
         name='rrhh-reglas_comision_v3_get_cliente'),
    path('reglas_comision_v3/get_vendedor/<str:search>/<str:union>/', reglas_comision_v3.get_vendedor,
         name='rrhh-reglas_comision_v3_get_vendedor'),
    path('reglas_comision_v3/save/', reglas_comision_v3.save, name='rrhh-reglas_comision_v3_save'),
    path('reglas_comision_v3/descargar_excel/', reglas_comision_v3.descargar_excel,
         name='rrhh-reglas_comision_v3_descargar_excel'),

    path('movimientos_programados/', movimientos_programados.index, name="rrhh-movimientos_programados"),
    path('movimientos_programados/create', movimientos_programados.create, name="rrhh-movimientos_programados_create"),
    path('movimientos_programados/save', movimientos_programados.save, name="rrhh-movimientos_programados_save"),
    path('movimientos_programados/delete', movimientos_programados.delete,
         name='rrhh-movimientos_programados_delete'),
    path('movimientos_programados/get_users', movimientos_programados.get_users,
         name="rrhh-movimientos_programados_get_users"),
    path('movimientos_programados/get_employees', movimientos_programados.get_employees,
         name="rrhh-movimientos_programados_get_employees"),
    path('movimientos_programados/calculate_figua', movimientos_programados.calculate_figua,
         name="rrhh-movimientos_programados_calculate_figua"),
    path('movimientos_programados/save_figua', movimientos_programados.save_figua,
         name="rrhh-movimientos_programados_save_figua"),
    path('movimientos_programados/calculate_upa', movimientos_programados.calculate_upa,
         name="rrhh-movimientos_programados_calculate_upa"),
    path('movimientos_programados/save_upa', movimientos_programados.save_upa,
         name="rrhh-movimientos_programados_save_upa"),
    path('movimientos_programados/get_movements_by_user', movimientos_programados.get_movements_by_user,
         name="rrhh-movimientos_programados_get_movements_by_user"),
    path('movimientos_programados/delete_movements_by_user', movimientos_programados.delete_movements_by_user,
         name="rrhh-movimientos_programados_delete_movements_by_user"),

    path('comisiones/', comisiones.index, name='rrhh-comisiones'),
    path('comisiones/guardar_campo/', comisiones.guardar_campo, name='rrhh-comisiones_guardar_campo'),
    path('comisiones/cerrar/', comisiones.cerrar, name='rrhh-comisiones_cerrar'),
    path('comisiones/solicitud/', comisiones.solicitud, name='rrhh-comisiones_solicitud'),
    path('comisiones/data/', comisiones.data_comisiones, name='rrhh-comisiones_data'),
    path('comisiones/resumen/', comisiones.resumen_vendedores, name='rrhh-comisiones_resumen'),
    path('comisiones/data_refacturacion/', comisiones.data_refacturacion, name='rrhh-comisiones_data_refacturacion'),
    path('indicador_comisiones/', indicador_comisiones.index, name='rrhh-indicador_comisiones'),
    path('comisiones/listado_salvador/', comisiones.listado_salvador, name='rrhh-comisiones_listado_salvador'),
    path('comisiones/cambiar_porcentaje/', comisiones.cambiar_porcentaje, name='rrhh-comisiones_cambiar_porcentaje'),
    path('comisiones/cerrar_salvador/', comisiones.cerrar_salvador, name='rrhh-comisiones_cerrar_salvador'),

    path('asistencia/', asistencia.index, name='rrhh-asistencia'),
    path('asistencia/empleados/', asistencia.empleados, name='rrhh-asistencia_empleados'),
    path('asistencia/horas_empleados/', asistencia.horas_empleados, name='rrhh-asistencia_horas_empleados'),
    path('asistencia/departamento/', asistencia.departamento, name='rrhh-asistencia_departamento'),
    path('asistencia/horas_departamento/', asistencia.horas_departamento, name='rrhh-asistencia_horas_departamento'),

    path('productos/', productos.index, name='rrhh-libreria_productos'),
    path('productos/listado/', productos.listado, name='rrhh-libreria_productos_get_productos'),
    path('productos/guardar_nuevos/', productos.save_productos, name='rrhh-libreria_productos_save_productos'),
    path('productos/ingreso_existencia/', productos.ingreso_existencia,
         name='rrhh-libreria_productos_ingreso_existencia'),
    path('productos/eliminar_producto/', productos.eliminar_producto, name='rrhh-libreria_productos_eliminar_producto'),
    path('productos/historial_producto/', productos.historial_producto,
         name='rrhh-libreria_productos_historial_producto'),
    path('productos/info/', productos.info, name='rrhh-libreria_producto_info'),
    path('productos/actualizar_producto/', productos.actualizar_producto, name='rrhh-libreria_actualizar_producto'),

    path('libreria/egresos/', egresos.index, name='rrhh-libreria_egresos'),
    path('libreria/get_users/', egresos.get_users, name='rrhh-libreria_get_users'),
    path('libreria/get_productos/', egresos.get_productos, name='rrhh-libreria_get_productos'),
    path('libreria/save_egreso/', egresos.save_egreso, name='rrhh-libreria_save_egreso'),

    path('libreria/reporte_existencia/', reporte_existencia.index, name='rrhh-libreria_reporte_existencia'),
    path('libreria/reporte_existencia/listado/', reporte_existencia.listado,
         name='rrhh-libreria_reporte_existencia_listado'),

    path('libreria/reporte_movimientos/', reporte_movimientos.index, name='rrhh-libreria_reporte_movimientos'),
    path('libreria/reporte_movimientos/listado/', reporte_movimientos.listado,
         name='rrhh-libreria_reporte_movimientos_listado'),

    path('libreria/ingreso_bodega/', ingreso_bodega.index, name='rrhh-libreria_ingreso_bodega'),
    path('libreria/ingreso_bodega/listado/', ingreso_bodega.listado, name='rrhh-libreria_ingreso_bodega_listado'),
    path('libreria/ingreso_bodega/form/', ingreso_bodega.ingreso_bodega_form, name='rrhh-libreria_ingreso_bodega_form'),
    path('libreria/ingreso_bodega/get_orden_compra/', ingreso_bodega.get_orden_compra,
         name='rrhh-libreria_ingreso_bodega_get_orden_compra'),
    path('libreria/ingreso_bodega/get_users/', ingreso_bodega.get_users, name='rrhh-libreria_ingreso_bodega_get_users'),
    path('libreria/ingreso_bodega/get_productos/', ingreso_bodega.get_productos,
         name='rrhh-libreria_ingreso_bodega_get_productos'),
    path('libreria/ingreso_bodega/save_ingreso_bodega/', ingreso_bodega.save_ingreso_bodega,
         name='rrhh-libreria_ingreso_bodega_save_ingreso_bodega'),
    path('ordelibrerian/ingreso_bodega/imprimir/<int:id>', ingreso_bodega.imprimir_orden,
         name='rrhh-libreria_ingreso_bodega_imprimir'),

    path('telefonos/matriz_descuentos/', matriz_telefonos.index, name='rrhh-telefonos_matriz_descuentos'),
    path('telefonos/matriz_descuentos/procesar/', matriz_telefonos.procesar,
         name='rrhh-telefonos_matriz_descuentos_procesar'),
    path('telefonos/matriz_descuentos/guardar/', matriz_telefonos.guardar,
         name='rrhh-telefonos_matriz_descuentos_guardar'),

    path('telefonos/administracion_telefonos/', administracion_telefonos.index,
         name='rrhh-telefonos_administracion_telefonos'),
    path('telefonos/administracion_telefonos/get_telefonos/', administracion_telefonos.get_telefonos,
         name='rrhh-telefonos_administracion_telefonos_get_telefonos'),
    path('telefonos/administracion_telefonos/edit/', administracion_telefonos.edit,
         name='rrhh-telefonos_administracion_telefonos_edit'),
    path('telefonos/administracion_telefonos/get_usuarios/<str:search>/', administracion_telefonos.get_usuarios,
         name='rrhh-telefonos_administracion_telefonos_get_usuarios'),
    path('telefonos/administracion_telefonos/get_cuentas/<str:search>/', administracion_telefonos.get_cuentas,
         name='rrhh-telefonos_administracion_telefonos_get_cuentas'),
    path('telefonos/administracion_telefonos/save/', administracion_telefonos.save,
         name='rrhh-telefonos_administracion_telefonos_save'),

    path('boletas/', boletas.index, name='rrhh-boletas'),
    path('boletas/get_periodos/', boletas.get_periodos, name='rrhh-boletas_get_periodos'),
    path('boletas/get_boleta/', boletas.get_boleta, name='rrhh-boletas_get_boleta'),
    path('boletas/save_firma/', boletas.save_firma, name='rrhh-boletas_save_firma'),
    path('boletas_reporte/', boletas.reporte, name='rrhh-boletas_reporte'),
    path('boletas_reporte/get_users/', boletas.get_users, name='rrhh-boletas_reporte_get_users'),

    path('telefonos/reporte_telefonos/', reporte_telefonos.index,
         name='rrhh-telefonos_reporte_telefonos'),
    path('telefonos/reporte_telefonos/get_data/', reporte_telefonos.get_data,
         name='rrhh-telefonos_reporte_telefonos_get_data'),

    path('comisiones_modificadas/', comisiones_modificadas.index, name='rrhh-comisiones_modificadas'),
    path('comisiones_modificadas/data/', comisiones_modificadas.data_comisiones,
         name='rrhh-comisiones_modificadas_data'),

    path('vacaciones/reporte_empleados/', reporte_vacaciones_empleados.index, name='rrhh-reporte_vacaciones_empleados'),
    path('vacaciones/reporte_empleados/data/', reporte_vacaciones_empleados.data,
         name='rrhh-reporte_vacaciones_empleados_data'),
    path('vacaciones/reporte_empleados/get_empleados/', reporte_vacaciones_empleados.get_empleados,
         name='rrhh-reporte_vacaciones_empleados_get_empleados'),

    path('solicitud_vacaciones/', solicitud_vacaciones.index, name='rrhh-solicitud_vacaciones_calendar'),
    path('solicitud_vacaciones/save_solicitud_vacaciones/', solicitud_vacaciones.save_solicitud_vacaciones,
         name='rrhh-solicitud_vacaciones_calendar_save_solicitud_vacaciones'),

    path('aprobar_vacaciones/', aprobar_vacaciones.index, name='rrhh-aprobar_vacaciones'),
    path('aprobar_vacaciones/vacacion/', aprobar_vacaciones.vacacion, name='rrhh-aprobar_vacaciones_vacacion'),
    path('aprobar_vacaciones/aprobar_vacacion/', aprobar_vacaciones.aprobar_vacacion,
         name='rrhh-aprobar_vacaciones_aprobar_vacacion'),
    path('aprobar_vacaciones/rechazar_vacacion/', aprobar_vacaciones.rechazar_vacacion,
         name='rrhh-aprobar_vacaciones_rechazar_vacacion'),

    path('horarios/', horarios.index, name='rrhh-horarios'),
    path('horarios/get_horarios/', horarios.get_horarios, name='rrhh-horarios_get_horarios'),
    path('horarios/get_horario/', horarios.get_horario, name='rrhh-horarios_get_horario'),
    path('horarios/save_horario/', horarios.save_horario, name='rrhh-horarios_save_horario'),

    path('empleados_horarios/', empleados_horarios.index, name='rrhh-empleados_horarios'),
    path('empleados_horarios/save_horarios_empleados/', empleados_horarios.save_horarios_empleados,
         name='rrhh-empleados_horarios_save_horarios_empleados'),

    path('listado_pasivos/', listado_pasivos.index, name='rrhh-listado_pasivos'),
    path('listado_pasivos/empresas/', listado_pasivos.empresas, name='rrhh-listado_pasivos_empresas'),
    path('listado_pasivos/listado/', listado_pasivos.listado, name='rrhh-listado_pasivos_listado'),

    path('vacaciones/autorizacion_rrhh/', autorizacion_rrhh.index, name='rrhh-vacaciones_autorizacion_rrhh'),
    path('vacaciones/autorizacion_rrhh/listado_solicitudes/', autorizacion_rrhh.listado_solicitudes,
         name='rrhh-vacaciones_autorizacion_rrhh_listado_solicitudes'),
    path('vacaciones/autorizacion_rrhh/get_empleados/', autorizacion_rrhh.get_empleados,
         name='rrhh-vacaciones_autorizacion_rrhh_get_empleados'),
    path('vacaciones/autorizacion_rrhh/imprimir/<int:pk>/', autorizacion_rrhh.imprimir,
         name='rrhh-vacaciones_autorizacion_rrhh_imprimir'),
    path('vacaciones/autorizacion_rrhh/finalizar/', autorizacion_rrhh.finalizar,
         name='rrhh-vacaciones_autorizacion_rrhh_finalizar'),
    path('vacaciones/autorizacion_rrhh/ver/', autorizacion_rrhh.ver, name='rrhh-vacaciones_autorizacion_rrhh_ver'),
    path('vacaciones/autorizacion_rrhh/rechazar/', autorizacion_rrhh.rechazar,
         name='rrhh-vacaciones_autorizacion_rrhh_rechazar'),
    path('vacaciones/autorizacion_rrhh/imprimir_constancia/<int:pk>/', autorizacion_rrhh.imprimir_constancia,
         name='rrhh-vacaciones_autorizacion_rrhh_imprimir_constancia'),

    path('impresion_vacaciones/', impresion_vacaciones.index, name='rrhh-impresion_vacaciones'),
    path('impresion_vacaciones/listado_solicitudes_impresion/', impresion_vacaciones.listado_solicitudes_impresion,
         name='rrhh-impresion_vacaciones_listado_solicitudes_impresion'),

    path('revision_vacaciones_periodos/', revision_vacaciones_periodos.index, name='rrhh-revision_vacaciones_periodos'),
    path('revision_vacaciones_periodos/get_users/', revision_vacaciones_periodos.get_users,
         name='rrhh-revision_vacaciones_periodos_get_users'),
    path('revision_vacaciones_periodos/get_periodos/', revision_vacaciones_periodos.get_periodos,
         name='rrhh-revision_vacaciones_periodos_get_periodos'),

    path('reporte_sueldos/', reporte_sueldos.index, name='rrhh-reporte_sueldos'),
    path('reporte_sueldos/get_data', reporte_sueldos.get_data, name='rrhh-reporte_sueldos_get_data'),

    path('ficha_empleados/', ficha_empleados.index, name='rrhh-ficha_empleados'),
    path('ficha_empleados/<int:pk>', ficha_empleados.get_ficha, name='rrhh-ficha_empleados_get_ficha'),

    path('permisos_tipos/', permisos_tipos.index, name='rrhh-permisos_tipos'),
    path('permisos_tipos/get_tipos/', permisos_tipos.get_tipos, name='rrhh-permisos_tipos_get_tipos'),
    path('permisos_tipos/get_tipo/', permisos_tipos.get_tipo, name='rrhh-permisos_tipos_get_tipo'),
    path('permisos_tipos/save_tipo/', permisos_tipos.save_tipo, name='rrhh-permisos_tipos_save_tipo'),

    path('permisos_solicitud/', permisos_solicitud.index, name='rrhh-permisos_solicitud'),
    path('permisos_solicitud/get_solicitudes/', permisos_solicitud.get_solicitudes,
         name='rrhh-permisos_solicitud_get_solicitudes'),
    path('permisos_solicitud/get_solicitud/', permisos_solicitud.get_solicitud,
         name='rrhh-permisos_solicitud_get_solicitud'),
    path('permisos_solicitud/save_solicitud/', permisos_solicitud.save_solicitud,
         name='rrhh-permisos_solicitud_save_solicitud'),

    path('permisos_aprobar/', permisos_aprobar.index, name='rrhh-permisos_aprobar'),
    path('permisos_aprobar/aprobar_permiso/', permisos_aprobar.aprobar_permiso,
         name='rrhh-permisos_aprobar_aprobar_permiso'),
    path('permisos_aprobar/rechazar_permiso/', permisos_aprobar.rechazar_permiso,
         name='rrhh-permisos_aprobar_rechazar_permiso'),

    path('ficha_empleados/', ficha_empleados.index,
         name='rrhh-ficha_empleados'),
    path('ficha_empleados/<int:pk>', ficha_empleados.get_ficha,
         name='rrhh-ficha_empleados_get_ficha'),

    path('distribucion_polizas/', distribucion_polizas.index,
         name='rrhh-distribucion_polizas'),
    path('distribucion_polizas/get_data', distribucion_polizas.get_data,
         name='rrhh-distribucion_polizas_get_data'),
    path('distribucion_polizas/get_nomenclaturas',
         distribucion_polizas.get_nomenclaturas,
         name='rrhh-distribucion_polizas_get_nomenclaturas'),
    path('distribucion_polizas/get_areas',
         distribucion_polizas.get_areas,
         name='rrhh-distribucion_polizas_get_areas'),
    path('distribucion_polizas/save',
         distribucion_polizas.save,
         name='rrhh-distribucion_polizas_save'),
    path('distribucion_polizas/edit_poliza_empleado/<int:pk>',
         distribucion_polizas.edit_poliza_empleado,
         name='rrhh-distribucion_polizas_edit_poliza_empleado'),

    path('permisos_impresion/', permisos_impresion.index, name='rrhh-permisos_impresion'),
    path('permisos_impresion/listado_permisos_impresion/', permisos_impresion.listado_permisos_impresion,
         name='rrhh-permisos_impresion_listado_permisos_impresion'),
    path('permisos_impresion/imprimir/<int:int_id>/', permisos_impresion.imprimir,
         name='rrhh-permisos_impresion_imprimir'),

    path('permisos_revision/', permisos_revision.index, name='rrhh-permisos_revision'),
    path('permisos_revision/listado_permisos/', permisos_revision.listado_permisos,
         name='rrhh-permisos_revision_listado_permisos'),
    path('permisos_revision/finalizar_permiso/', permisos_revision.finalizar_permiso,
         name='rrhh-permisos_revision_finalizar_permiso'),

    path('reprocesar_comisiones/', reprocesar.index, name='rrhh-comisiones_reprocesar'),

    path('consulta_nomina/', consulta_nomina.index, name='rrhh-consulta_nomina'),
    path('consulta_nomina/empresas/', consulta_nomina.get_empresas, name='rrhh-consulta_nomina_empresas'),
    path('consulta_nomina/periodos/', consulta_nomina.get_periodos, name='rrhh-consulta_nomina_periodos'),
    path('consulta_nomina/get_nomina/', consulta_nomina.get_nomina, name='rrhh-consulta_nomina_get_nomina'),
    path('consulta_nomina/get_impresion/', consulta_nomina.get_impresion, name='rrhh-consulta_nomina_get_impresion'),

]
