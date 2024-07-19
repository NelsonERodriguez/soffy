from django.urls import path
from . import views
from .controllers.ingreso_ticket import ingreso_ticket
from .controllers.plantillas import plantillas
from .controllers.categorias_plantillas import categorias_plantillas
from .controllers.etiquetas import etiquetas
from .controllers.estados import estados
from .controllers.prioridades import prioridades
from .controllers.reporte_minuta_jsa import reporte_minuta_jsa
from .controllers.tipos_log import tipos_log
from .controllers.dashboard import dashboard
from .controllers.agrupacion import agrupacion
from .controllers.workspace import workspace
from .controllers.reporte_prioridades import reporte_prioridades


urlpatterns = [
    path('', views.index, name='home'),
    path('ingreso_ticket/', ingreso_ticket.index, name='tickets-ingreso_ticket'),
    path('ingreso_ticket/create/<int:id>/', ingreso_ticket.create, name='tickets-ingreso_ticket_create'),

    path('plantillas/', plantillas.index, name='tickets-plantillas'),
    path("plantillas/edit/<int:pk>", plantillas.edit, name="tickets-plantillas_edit"),
    path("plantillas/save/<int:pk>", plantillas.save, name="tickets-plantillas_save"),

    path('categorias_plantillas/', categorias_plantillas.index, name='tickets-categorias_plantillas'),
    path("categorias_plantillas/edit/<int:pk>", categorias_plantillas.edit, name="tickets-categorias_plantillas_edit"),
    path("categorias_plantillas/save/<int:pk>", categorias_plantillas.save, name="tickets-categorias_plantillas_save"),

    path('etiquetas/', etiquetas.index, name='tickets-etiquetas'),
    path("etiquetas/edit/<int:pk>", etiquetas.edit, name="tickets-etiqueta_edit"),
    path("etiquetas/save/<int:pk>", etiquetas.save, name="tickets-etiqueta_save"),

    path('estados/', estados.index, name='tickets-estados'),
    path("estados/edit/<int:pk>", estados.edit, name="tickets-estados_edit"),
    path("estados/save/<int:pk>", estados.save, name="tickets-estados_save"),

    path('prioridades/', prioridades.index, name='tickets-prioridades'),
    path("prioridades/edit/<int:pk>", prioridades.edit, name="tickets-prioridades_edit"),
    path("prioridades/save/<int:pk>", prioridades.save, name="tickets-prioridades_save"),

    path('tipos_log/', tipos_log.index, name='tickets-tipos_log'),
    path("tipos_log/edit/<int:pk>", tipos_log.edit, name="tickets-tipos_log_edit"),
    path("tipos_log/save/<int:pk>", tipos_log.save, name="tickets-tipos_log_save"),

    path('agrupacion/', agrupacion.index, name='tickets-agrupacion'),
    path("agrupacion/edit/<int:pk>", agrupacion.edit, name="tickets-agrupacion_edit"),
    path("agrupacion/save/<int:pk>", agrupacion.save, name="tickets-agrupacion_save"),

    path('workspace/', workspace.index, name='tickets-workspace'),
    path("workspace/edit/<int:pk>", workspace.edit, name="tickets-workspace_edit"),
    path("workspace/save/<int:pk>", workspace.save, name="tickets-workspace_save"),

    path('reporte_prioridades/', reporte_prioridades.index, name='tickets-reporte_prioridades'),
    path('reporte_prioridades/save_ponderacion/', reporte_prioridades.save_ponderacion,
         name='tickets-reporte_prioridades_save_ponderacion'),
    path('reporte_prioridades/get_users/<str:search>/', reporte_prioridades.get_users,
         name='tickets-reporte_prioridades_get_users'),
    path('reporte_prioridades/save_datos/', reporte_prioridades.save_datos,
         name='tickets-reporte_prioridades_save_datos'),

    #
    path('dashboard/', dashboard.index, name='tickets-dashboard'),
    path('dashboard/get_data_for_dashboard/', dashboard.get_data_for_dashboard,
         name='tickets-dashboard_get_data_for_dashboard'),
    path('dashboard/get_api_tickets/', dashboard.get_api_tickets, name='tickets-dashboard_get_api_tickets'),
    path('dashboard/get_api_agrupaciones/', dashboard.get_api_agrupaciones,
         name='tickets-dashboard_get_api_agrupaciones'),
    path('dashboard/post_update_ticket/', dashboard.post_update_ticket, name='tickets-dashboard_post_update_ticket'),
    path('dashboard/post_create_ticket/', dashboard.post_create_ticket, name='tickets-dashboard_post_create_ticket'),
    path('dashboard/get_api_info_ticket/', dashboard.get_api_info_ticket, name='tickets-dashboard_get_api_info_ticket'),
    path('dashboard/post_create_comentario/', dashboard.post_create_comentario,
         name='tickets-dashboard_post_create_comentario'),
    path('dashboard/post_insert_adjunto_ticket/', dashboard.post_insert_adjunto_ticket,
         name='tickets-dashboard_post_insert_adjunto_ticket'),
    path('dashboard/post_save_asignacion/', dashboard.post_save_asignacion,
         name='tickets-dashboard_post_save_asignacion'),
    path('dashboard/post_save_etiquetas/', dashboard.post_save_etiquetas,
         name='tickets-dashboard_post_save_etiquetas'),
    path('dashboard/post_delete_adjunto_ticket/', dashboard.post_delete_adjunto_ticket,
         name='tickets-dashboard_post_delete_adjunto_ticket'),
    path('dashboard/post_update_ticket_estado/', dashboard.post_update_ticket_estado,
         name='tickets-dashboard_post_update_ticket_estado'),
    path('dashboard/post_update_ticket_prioridad/', dashboard.post_update_ticket_prioridad,
         name='tickets-dashboard_post_update_ticket_prioridad'),
    path('dashboard/post_create_agrupacion/', dashboard.post_create_agrupacion,
         name='tickets-dashboard_post_create_agrupacion'),
    path('dashboard/post_update_ticket_fechas/', dashboard.post_update_ticket_fechas,
         name='tickets-dashboard_post_update_ticket_fechas'),
    path('dashboard/get_data_for_workspace/', dashboard.get_data_for_workspace,
         name='tickets-dashboard_get_data_for_workspace'),
    path('dashboard/post_create_workspace/', dashboard.post_create_workspace,
         name='tickets-dashboard_post_create_workspace'),
    path('dashboard/post_deshabilitar_workspace/', dashboard.post_deshabilitar_workspace,
         name='tickets-dashboard_post_deshabilitar_workspace'),
    path('dashboard/post_miembros_workspace/', dashboard.post_miembros_workspace,
         name='tickets-dashboard_post_miembros_workspace'),
    path('dashboard/send_notificaciones_ticket/', dashboard.send_notificaciones_ticket,
         name='tickets-dashboard_send_notificaciones_ticket'),
    path('dashboard/post_save_admin_workspace/', dashboard.post_save_admin_workspace,
         name='tickets-dashboard_post_save_admin_workspace'),
    path('dashboard/post_update_agrupacion_ticket/', dashboard.post_update_agrupacion_ticket,
         name='tickets-dashboard_post_update_agrupacion_ticket'),
    path('dashboard/post_update_grupo/', dashboard.post_update_grupo,
         name='tickets-dashboard_post_update_grupo'),
    path('dashboard/post_delete_ticket/', dashboard.post_delete_ticket,
         name='tickets-dashboard_post_delete_ticket'),
    path('dashboard/post_duplicate_agrupacion/', dashboard.post_duplicate_agrupacion,
         name='tickets-dashboard_post_duplicate_agrupacion'),

    path('reporte_minuta_jsa/', reporte_minuta_jsa.index, name='tickets-reporte_minuta_jsa'),
    path('reporte_minuta_jsa/get_comentarios/', reporte_minuta_jsa.get_comentarios,
         name='tickets-reporte_minuta_jsa_get_comentarios'),
    path('reporte_minuta_jsa/cerrar_ticket/', reporte_minuta_jsa.cerrar_ticket,
         name='tickets-reporte_minuta_jsa_cerrar_ticket'),

]
