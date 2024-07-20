
APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'administracion',
    'core',
    'logs',
    'user_auth',
    'factura_electronica',
    'tickets',
    'quiniela',
    'rest_framework',
    'durin',
    'api_bridge',
    'mantenimiento',
    'contabilidad',
    # 'clientes', #robar de termino
    # 'ventas', #robar de termino
    # 'dashboard', #robar de termino
]


# NELSON INSTALLED_APPS
# Obtiene todos loas queryas para eliminar las tablas
# SELECT concat('DROP TABLE IF EXISTS `', table_name, '`;')
# FROM information_schema.tables
# WHERE table_schema = 'erp';