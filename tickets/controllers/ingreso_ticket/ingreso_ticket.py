from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import set_notification
from django.core.files.storage import FileSystemStorage
from django.db.models import F
from django.core.mail import EmailMessage
from tickets.models import Ticket, Ticket_adjunto, Ticket_etiqueta, Ticket_log, Estado, Prioridad, Tipo_log, Plantilla,\
    Plantilla_etiqueta, Agrupacion
from datetime import datetime
from soffybiz.debug import DEBUG, IMAGEN_GB


@login_required(login_url="/login/")
def index(request):
    plantillas = Plantilla.objects.annotate(plantilla_id=F('id'), categoria=F('plantilla_categoria__nombre'),
                                            orden=F('plantilla_categoria__orden')). \
        values('plantilla_categoria_id', 'plantilla_id', 'categoria', 'titulo', 'descripcion', 'color', 'icono',
               'orden').filter(activo=True, plantilla_categoria__activo=True).order_by('orden')

    arr_plantillas = {}
    for plantilla in plantillas:
        if not plantilla['plantilla_categoria_id'] in arr_plantillas:
            arr_plantillas[plantilla['plantilla_categoria_id']] = {
                "id": plantilla['plantilla_categoria_id'],
                "categoria": plantilla['categoria'],
                "orden": plantilla['orden'],
                "plantillas": [],
            }

        arr_plantillas[plantilla['plantilla_categoria_id']]["plantillas"].append({
            "id": plantilla['plantilla_id'],
            "titulo": plantilla['titulo'],
            "descripcion": plantilla['descripcion'],
            "icono": plantilla['icono'],
            "color": plantilla['color'],
        })

    data = {
        "plantillas": arr_plantillas
    }
    return render(request, 'ingreso_ticket/seleccion_planillas_ticket.html', data)


@login_required(login_url="/login/")
def create(request, id):
    arr_plantilla = Plantilla.objects.annotate(plantilla_id=F('id'), categoria=F('plantilla_categoria__nombre'),
                                               orden=F('plantilla_categoria__orden')). \
        values('plantilla_categoria_id', 'plantilla_id', 'categoria', 'titulo', 'descripcion', 'color', 'icono',
               'orden', 'agrupacion_id', 'departamento_id', 'correo_notificacion').\
        filter(activo=True, plantilla_categoria__activo=True, id=id).order_by('orden').first()

    if request.method == "POST":

        arr_etiquetas = Plantilla_etiqueta.objects.values('etiqueta_id').filter(plantilla_id=id)

        estado = Estado.objects.filter(activo=True, orden=1).first()
        prioridad = Prioridad.objects.filter(activo=True, orden=1).first()
        tipo = Tipo_log.objects.filter(activo=True, identificador__contains="insert_ticket").first()

        files = request.FILES.getlist('adjuntos[]')
        str_titulo = request.POST.get('titulo', '')
        str_descripcion = request.POST.get('descripcion', '')
        str_causa = request.POST.get('causa', '')
        str_posible_solucion = request.POST.get('posible_solucion', '')
        int_estado = estado.id
        int_prioridad = prioridad.id
        int_agrupacion = arr_plantilla['agrupacion_id']
        int_departamento = arr_plantilla['departamento_id']

        ticket = Ticket.objects.create(
            titulo=str_titulo,
            descripcion=str_descripcion,
            causa=str_causa,
            posible_solucion=str_posible_solucion,
            estado_id=int_estado,
            prioridad_id=int_prioridad,
            fecha_creacion=datetime.now(),
            user_create_id=request.user.id,
            ticket_padre_id=None,
            es_personal=False,
            ticket_dependiente_id=None,
            fecha_hora_inicio=None,
            fecha_hora_fin=None,
            activo=True,
            archivado=False,
            plantilla_id=id,
            agrupacion_id=int_agrupacion,
            departamento_id=int_departamento,
            agrupacion=None
        )

        if tipo:
            Ticket_log.objects.create(
                ticket_id=ticket.id,
                tipo_log_id=tipo.id,
                valor_nuevo=str_titulo,
                activo=True,
                afectado_id=None,
                user_id=request.user.id
            )

        for etiqueta in arr_etiquetas:
            Ticket_etiqueta.objects.create(
                ticket_id=ticket.id,
                etiqueta_id=etiqueta['etiqueta_id'],
                activo=True
            )

        if files:
            for file in files:
                fs = FileSystemStorage()
                str_path = 'tickets/%s/%s' % (ticket.id, file.name)
                fs.save(str_path, file)

                Ticket_adjunto.objects.create(
                    ticket_id=ticket.id,
                    file=str_path,
                    descripcion=file.name,
                    activo=True
                )

        try:
            agrupacion = Agrupacion.objects.get(id=int_agrupacion)
            str_subject = 'Ingreso de ticket #%s' % ticket.id
            str_body = '%s ingreso el ticket <b>"#%s %s"</b> ' \
                       '<br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           request.user.name, ticket.id, str_titulo, agrupacion.workspace.nombre, agrupacion.nombre,
                           ticket.id, str_titulo)

            str_html = """
                <table style="width: 100%%;">
                    <tbody>
                        <tr>
                            <td width="25%%">&nbsp;</td>
                            <td width="50%%">
                                <table style="width: 100%%; border: 1px solid #dddddd; border-radius: 3px;">
                                    <tbody>
                                        <tr>
                                            <td style="text-align: center; padding: 20px;">
                                                <img src="%s" 
                                                alt="No se puedo cargar la imagen" style="width: 100%%" width="100%%">
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="background: #333333; color: white; text-align:center;">
                                                <h2>Notificación del modulo de My Day.</h2>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center; padding: 20px;">
                                                %s
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td width="35%%">&nbsp;</td>
                        </tr>
                    </tbody>
                </table>
            """ % (IMAGEN_GB, str_body)

            if not DEBUG:
                arr_correo = arr_plantilla['correo_notificacion'].split(';') if arr_plantilla['correo_notificacion'] else []

                arr_emails = []
                for correo in arr_correo:
                    arr_emails.append(correo)

                msg = EmailMessage(str_subject, str_html, 'nova@grupobuena.com', arr_emails)
                msg.content_subtype = "html"  # Main content is now text/html
                msg.send()

        except ValueError:
            pass

        set_notification(request, True, "Ticket generado exitosamente.", "add_alert", "success")

        return redirect('tickets-ingreso_ticket')

    data = {
        "plantilla": arr_plantilla
    }
    return render(request, 'ingreso_ticket/ingreso_ticket.html', data)
