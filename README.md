- **Nombre del Proyecto**: Soffybiz
- **Descripción**: Proyecto basado en core Soffy y diseño de Dessibyte para venta de software robusto, rapido y confiable.
- **Contribución**: --
- **Autores**: Rony, Pineda Solares, Pedro Humberto; Rodriguez Matul, Nelson Estuardo
- **Agradecimientos**: --
- **Licencia**: MIT
- **Enlace de Autor**: https://github.com/



# [PROYECTO Soffybiz] Intento Mark 1

Sistema desarrollado y creado en django 4.2, Mysql, Javascript, ES6 (si no tengo pereza Vuejs)

<br />

## Estructura del codigo

Este proyecto tiene una estructura estandar de django

```bash
< PROJECT ROOT >
   |
   |-- core/                               # Implements app logic and serve the static assets
   |    |-- settings.py                    # Django app bootstrapper
   |    |-- wsgi.py                        # Start the app in production
   |    |-- urls.py                        # Define URLs served by all apps/nodes
   |    |
   |    |-- static/
   |    |    |-- <css, JS, images>         # CSS files, Javascripts files
   |    |
   |    |-- templates/                     # Templates used to render pages
   |         |
   |         |-- includes/                 # HTML chunks and components
   |         |    |-- navigation.html      # Top menu component
   |         |    |-- sidebar.html         # Sidebar component
   |         |    |-- footer.html          # App Footer
   |         |    |-- scripts.html         # Scripts common to all pages
   |         |
   |         |-- layouts/                  # Master pages
   |         |    |-- base-fullscreen.html # Used by Authentication pages
   |         |    |-- base.html            # Used by common pages
   |         |
   |         |-- accounts/                 # Authentication pages
   |         |    |-- login.html           # Login page
   |         |    |-- register.html        # Register page
   |         |
   |      index.html                       # The default page
   |     page-404.html                     # Error 404 page
   |     page-500.html                     # Error 404 page
   |       *.html                          # All other HTML pages
   |
   |-- authentication/                     # Handles auth routes (login and register)
   |    |
   |    |-- urls.py                        # Define authentication routes  
   |    |-- views.py                       # Handles login and registration  
   |    |-- forms.py                       # Define auth forms  
   |
   |-- app/, module1/, module2/          # A simple app that serve HTML files
   |    |
   |    |-- views.py                       # Serve HTML pages for authenticated users
   |    |-- urls.py                        # Define some super simple routes  
   |
   |-- requirements.txt                    # Development modules - SQLite storage
   |
   |-- .env                                # Inject Configuration via Environment
   |-- manage.py                           # Start the app - Django default start script
   |
   |-- ************************************************************************
```

<br />

## Como instalar

```bash
$ # Clonar el repositorio
$ git clone https://github.com/@usuario/@repositori
$ # Posicionarnos en la carpeta del proyecto
$ cd gruposis/
$
$
$ # Crear el ambiente virtual para python3
$ python3 -m venv .env
$ # Entrar al ambiente
$ source .env/bin/activate
$
$
$ # Al entrar instalar versiones específicas
$ pip install -r requirements-versions.txt
$ 
```

<br />

<br />

## Poner en marcha el proyecto

```bash
$ # Posicionarnos dentro del ambiente
$
$ # Debemos crear las tablas con las migraciones que tiene existentes
$ python3 manage.py migrate
$ 
$ # Si algun dia vas a crear algunas nuevas con nuevos models o los existentes
$ python3 manage.py makemigrations
$ 
$ # Para ejecutarlo y correrlo
$ python3 manage.py runserver
$ 
$ # Para detenerlo
$ command + c
$ 
$ # Para salir del ambiente
$ deactivate
$ 
```

<br />

## Se puede personalizar el puerto si otra aplicacion usa el default (8000)

```bash
$ # Posicionarnos dentro del ambiente
$ python3 manage.py runserver 127.0.0.1:3000
$ # El proyecto estara en http://127.0.0.1:3000
$ 
```

<br />

## Como personalizar algunos comandos

```bash
$ # Puedes personalizar tus comandos para hacerlos mas cortos
$ alias python=python3
$ # Ejemplos de uso:
$ # python manage.py runserver 
$ # python manage.py makemigrations 
$ 
```

<br />

<br />

> Tecnologias usadas

- Bootstrap 4
- Django 4.2
- ES6
- Iconos propios del tema (components-icons.html)
- Javascript
- Jquery (no lo uses, solo esta por librerias)
- Python version 3.9

<br />

> Proyecto DB es de:

- Rony

> Optimización y actualización a cargo de:

- Rodriguez Matul, Nelson Estuardo

> Desarrollado por:

- Pineda Solares, Pedro Humberto
- Rodriguez Matul, Nelson Estuardo

<br />

Existente desde 2021 (dandole crédito del core django a Joshua), actualizado desde 2024 (limpieza, optimizacion, otros estilos).

Pdt. Por que si se puede responsive el tema.