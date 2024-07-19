from django.urls import path
from django.contrib.auth import views
from user_auth.controllers.usuarios import usuarios
from user_auth.controllers.groups import groups
from user_auth.controllers.users_groups import users_groups
from user_auth.controllers.permissions import permissions
from user_auth.functions import get_usuarios
from user_auth.controllers.admin_usuarios import admin_usuarios


urlpatterns = [
    path("myaccount", usuarios.myaccount, name="myaccount"),
    path("groups/", groups.index, name="user-groups"),
    path("groups/create", groups.create, name="user-groups_create"),
    path("groups/edit/<int:pk>", groups.edit, name="user-groups_edit"),
    path("groups/delete/<int:pk>", groups.delete, name="user-groups_delete"),
    path("users_groups/", users_groups.index, name="user-users_groups"),
    path("users_groups/get_group/<str:search>/", users_groups.get_group, name="user-users_groups_get_group"),
    path("users_groups/edit/<int:pk>", users_groups.edit, name="user-users_groups_edit"),
    path("password/", usuarios.PasswordsChangeView.as_view(template_name='usuarios/change_password.html'),
         name="user-change_password"),
    path("password_success/", usuarios.password_success, name="user-success_password"),
    path("permissions/", permissions.index, name="user-permissions"),
    path("permissions/get_permisos/", permissions.get_permisos, name="user-permissions_get_permisos"),
    path("permissions/edit/<int:id>", permissions.edit, name="user-permissions_edit"),
    path("permissions/create", permissions.create, name="user-permissions_create"),
    path("search_user/<str:search>/", get_usuarios,
         name="user-search_user"),
    path("users/", usuarios.users, name="user-users"),

    path("admin_usuarios/", admin_usuarios.index, name="user-admin_usuarios"),
    path("admin_usuarios/get_data_incompleta/", admin_usuarios.get_data_incompleta,
         name="user-admin_usuarios_get_data_incompleta"),
    path("admin_usuarios/get_data_completa/", admin_usuarios.get_data_completa,
         name="user-admin_usuarios_get_data_completa"),
    path("admin_usuarios/get_data_inactivo/", admin_usuarios.get_data_inactivo,
         name="user-admin_usuarios_get_data_inactivo"),
    path("admin_usuarios/get_data_user/", admin_usuarios.get_data_user,
         name="user-admin_usuarios_get_data_user"),
    path("admin_usuarios/update_data_user/", admin_usuarios.update_data_user,
         name="user-admin_usuarios_update_data_user"),
    path("admin_usuarios/desactivar_user/", admin_usuarios.desactivar_user,
         name="user-admin_usuarios_desactivar_user"),
    path("admin_usuarios/activar_user/", admin_usuarios.activar_user,
         name="user-admin_usuarios_activar_user"),

]
