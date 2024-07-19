import json
from io import BytesIO

import requests
import xmltodict
import xlwt

from Soffybiz import settings
from transporte.controllers.traslado_contenedores.traslado_contenedores import send_email_manual_cron
from user_auth.models import User
from core.functions import insert_query, get_query
from soffybiz.debug import DEBUG, IMAGEN_GB
from tickets.models import Ticket_log, Ticket_notificacion, Ticket, Ticket_usuario, Estado, Prioridad, Etiqueta
from django.core.mail import EmailMessage, EmailMultiAlternatives
from django.db.models import Q
from datetime import datetime, date


def api_get_horas_foxcore():
    if not DEBUG:

        arr_ips = ["http://172.16.10.15/iWsService"]

        for ip in arr_ips:
            str_soap = """<?xml version=\"1.0\" encoding=\"utf-8\" ?>
                        <soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">
                            <soap:Body>
                                <GetAttLog><ArgComKey>0</ArgComKey><Arg><PIN></PIN></Arg></GetAttLog>
                            </soap:Body>
                        </soap:Envelope>"""
            # headers
            headers = {
                'Content-Type': 'text/xml; charset=utf-8'
            }

            # POST request
            # url = "http://172.16.10.15/iWsService"
            response = requests.request("POST", ip, headers=headers, data=str_soap)
            str_xml = response.text

            arr_dic = xmltodict.parse(str_xml)
            str_json = json.dumps(arr_dic)
            str_json = json.loads(str_json)

            if str_json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['GetAttLogResponse']:

                bool_register = False
                if str(type(
                        str_json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['GetAttLogResponse'][
                            'Row'])) == "<class 'list'>":
                    for row in str_json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['GetAttLogResponse']['Row']:
                        str_sql = """
                        INSERT INTO foxcore..empleado_asistencias (codigo, fecha, estatus)
                        VALUES
                        ('%s', '%s', %s)
                        """ % (row['PIN'], row['DateTime'], row['Status'])
                        insert_query(str_sql)
                        bool_register = True

                elif str(type(
                        str_json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['GetAttLogResponse'][
                            'Row'])) == "<class 'dict'>":
                    row = str_json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['GetAttLogResponse']['Row']

                    str_sql = """
                    INSERT INTO foxcore..empleado_asistencias (codigo, fecha, estatus)
                    VALUES
                    ('%s', '%s', %s)
                    """ % (row['PIN'], row['DateTime'], row['Status'])
                    insert_query(str_sql)
                    bool_register = True

                if bool_register:
                    str_sql = """
                    INSERT INTO foxcore..asistencia_logs (user_id, fecha)
                    VALUES
                    (1, GETDATE())
                    """
                    insert_query(str_sql)

                    str_soap_delete = """<?xml version=\"1.0\" encoding=\"utf-8\" ?>
                                        <soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">
                                            <soap:Body>
                                                <ClearData><ArgComKey>0</ArgComKey><Arg><Value>3</Value></Arg></ClearData>
                                            </soap:Body>
                                        </soap:Envelope>"""

                    # headers
                    headers = {
                        'Content-Type': 'text/xml; charset=utf-8'
                    }
                    # POST request
                    # url = "http://172.16.10.15/iWsService"
                    requests.request("POST", ip, headers=headers, data=str_soap_delete)
                    # str_xml = response.text


def api_send_notificaciones_ticket():
    arr_logs = Ticket_log.objects.values('ticket_id', 'tipo_log__identificador', 'valor_anterior', 'valor_nuevo',
                                         'user__name', 'id'). \
        filter(tipo_log__identificador__in=('insert_ticket_usuario', 'insert_ticket_comentario',
                                            'ticket_mencion_comentario'), activo=True). \
        exclude(id__in=Ticket_notificacion.objects.values('ticket_log_id').filter(activo=True))

    for arr_log in arr_logs:

        ticket = Ticket.objects.values('id', 'titulo', 'user_create__email', 'user_create_id',
                                       'agrupacion__workspace__nombre',
                                       'agrupacion__nombre', 'departamento_id').get(id=arr_log['ticket_id'])

        # arr_users_notificados = [ticket['user_create_id']]
        # arr_emails = [ticket['user_create__email']]
        arr_users_notificados = []
        arr_emails = []

        users = Ticket_usuario.objects.values('usuario__email', 'usuario_id'). \
            filter(ticket_id=arr_log['ticket_id'], activo=True)
        for user in users:
            if ticket['user_create__email'] != user['usuario__email']:
                arr_emails.append(user['usuario__email'])
            arr_users_notificados.append(user['usuario_id'])

        if arr_log['tipo_log__identificador'] == "insert_ticket":
            str_subject = 'Ingreso de ticket #%s' % arr_log['ticket_id']
            str_body = '%s ingreso el ticket <b>"%s"</b> ' \
                       '<br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           arr_log['user__name'], arr_log['valor_nuevo'], ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "update_ticket":
            str_subject = 'Actualización de datos en ticket #%s' % arr_log['ticket_id']
            str_body = '%s actualizo <b>"%s"</b> por <b>"%s..."</b> ' \
                       '<br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           arr_log['user__name'], (arr_log['valor_anterior'] if arr_log['valor_anterior'] else '-'),
                           arr_log['valor_nuevo'], ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "insert_ticket_comentario":
            str_subject = 'Ingreso de comentario en ticket #%s' % arr_log['ticket_id']
            str_body = '%s ingreso un comentario: "%s" ' \
                       '<br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           arr_log['user__name'], arr_log['valor_nuevo'], ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "ticket_mencion_comentario":
            user_mencion = User.objects.filter(id=arr_log['valor_nuevo']).first()
            arr_emails = [user_mencion.email]
            str_subject = 'Has sido mencionado en el ticket #%s' % arr_log['ticket_id']
            str_body = '%s te menciono en un comentario de un ticket. ' \
                       '<br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           arr_log['user__name'], ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "insert_ticket_usuario":
            if arr_log['valor_nuevo']:
                str_subject = 'Asigno usuario en ticket #%s' % arr_log['ticket_id']
                user = User.objects.get(id=arr_log['valor_nuevo'])
            else:
                str_subject = 'Desasigno usuario en ticket #%s' % arr_log['ticket_id']
                user = User.objects.get(id=arr_log['valor_anterior'])
            str_body = '%s cambio asignación <b>"%s"</b> <br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                arr_log['user__name'], user.name, ticket['agrupacion__workspace__nombre'], ticket['agrupacion__nombre'],
                ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "insert_ticket_adjunto":
            str_subject = 'Agrego un adjunto en ticket #%s' % arr_log['ticket_id']
            str_body = '%s agrego el adjunto <b>"%s"</b>  <br><br> El ticket se ubica en <b>"%s -> %s ->' \
                       ' #%s %s"</b>' % (
                           arr_log['user__name'], arr_log['valor_nuevo'], ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "delete_ticket_adjunto":
            str_subject = 'Elimino un adjunto en ticket #%s' % arr_log['ticket_id']
            str_body = '%s elimino el adjunto <b>"%s"</b> <br><br> El ticket se ubica en <b>"%s -> %s -> ' \
                       '#%s %s"</b>' % (
                           arr_log['user__name'], arr_log['valor_anterior'], ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "update_ticket_estado":
            str_subject = 'Cambio de estado en ticket #%s' % arr_log['ticket_id']

            if not arr_log['valor_anterior']:
                str_estado_anterior = '-'

            else:
                estado = Estado.objects.get(id=arr_log['valor_anterior'])
                str_estado_anterior = estado.nombre

            if arr_log['valor_nuevo']:
                estado = Estado.objects.get(id=arr_log['valor_nuevo'])
                str_estado_nuevo = estado.nombre

            else:
                str_estado_nuevo = '-'

            str_body = '%s cambio de estado <b>"%s"</b> a <b>"%s"</b>' \
                       ' <br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           arr_log['user__name'], str_estado_anterior, str_estado_nuevo,
                           ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "update_ticket_prioridad":
            str_subject = 'Cambio de prioridad en ticket'

            if arr_log['valor_anterior']:
                prioridad = Prioridad.objects.get(id=arr_log['valor_anterior'])
                str_prioridad_anterior = prioridad.nombre

            else:
                str_prioridad_anterior = '-'

            if arr_log['valor_nuevo']:
                prioridad = Prioridad.objects.get(id=arr_log['valor_nuevo'])
                str_prioridad_nuevo = prioridad.nombre

            else:
                str_prioridad_nuevo = '-'

            str_body = '%s cambio de prioridad <b>"%s"</b> a "%s"' \
                       ' <br><br> El ticket se ubica en <b>"%s -> %s -> #%s %s"</b>' % (
                           arr_log['user__name'], str_prioridad_anterior, str_prioridad_nuevo,
                           ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        elif arr_log['tipo_log__identificador'] == "update_ticket_etiqueta":
            str_subject = 'Se agrego etiqueta en ticket' if arr_log['valor_anterior'] else 'Se quito etiqueta en ticket'

            etiqueta = Etiqueta.objects. \
                get(id=arr_log['valor_anterior'] if arr_log['valor_anterior'] else arr_log['valor_nuevo'])
            str_etiqueta = etiqueta.nombre

            str_body = '%s cambio de etiqueta <b>"%s"</b> <br><br> El ticket se ubica en <b>"%s -> %s -> ' \
                       '#%s %s"</b>' % (
                           arr_log['user__name'], str_etiqueta, ticket['agrupacion__workspace__nombre'],
                           ticket['agrupacion__nombre'], ticket['id'], ticket['titulo'])

        else:
            str_subject = 'Notificación de ticket'
            str_body = 'Notificación de ticket'

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

        if not DEBUG and len(arr_emails):
            msg = EmailMessage(str_subject, str_html, 'nova@grupobuena.com', arr_emails)
            msg.content_subtype = "html"
            msg.send()

            for arr_user in arr_users_notificados:
                Ticket_notificacion.objects.create(
                    ticket_log_id=arr_log['id'],
                    user_notificado_id=arr_user,
                )

    # envio de correos de tickets por vencer el dia de hoy o vencidos todos los dias a las 10 am
    int_hour = datetime.now().hour
    if int_hour == 10:
        today = date.today()
        tickets_por_vencer = Ticket.objects.select_related('agrupacion', 'agrupacion__workspace'). \
            filter(activo=True, archivado=False, fecha_hora_fin__day=today.day, fecha_hora_fin__month=today.month,
                   fecha_hora_fin__year=today.year, aviso_por_vencer=False, agrupacion__activo=True,
                   agrupacion__workspace__activo=True).exclude(estado_id=5)

        for ticket in tickets_por_vencer:
            str_subject = 'Ticket por vencer'
            str_body = 'Se te informa que el ticket <b>"%s -> %s -> #%s %s"</b> vence el día de hoy.' % (
                ticket.agrupacion.workspace.nombre, ticket.agrupacion.nombre, ticket.id, ticket.titulo
            )
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

            users_por_vencer = Ticket_usuario.objects.values('usuario__email').filter(ticket_id=ticket.id,
                                                                                      activo=True)

            arr_emails_por_vencer = []
            for user in users_por_vencer:
                arr_emails_por_vencer.append(user['usuario__email'])

            if not DEBUG and arr_emails_por_vencer:
                msg = EmailMessage(str_subject, str_html, 'nova@grupobuena.com', arr_emails_por_vencer)
                msg.content_subtype = "html"
                msg.send()

                ticket.aviso_por_vencer = True
                ticket.save()

        tickets_vencidos = Ticket.objects.select_related('agrupacion', 'agrupacion__workspace'). \
            filter(activo=True, archivado=False, fecha_hora_fin__lt=today, agrupacion__activo=True,
                   agrupacion__workspace__activo=True). \
            filter(Q(fecha_aviso_vencido__lt=today) | Q(fecha_aviso_vencido__isnull=True)).exclude(estado_id=5)

        str_subject = 'Ticket vencido'
        if tickets_vencidos:

            arr_correos = {}
            for ticket in tickets_vencidos:
                users_por_vencer = Ticket_usuario.objects.values('usuario__email').filter(ticket_id=ticket.id,
                                                                                          activo=True)

                ticket.fecha_aviso_vencido = today
                ticket.save()

                for user in users_por_vencer:
                    if user['usuario__email'] not in arr_correos:
                        arr_correos[user['usuario__email']] = {
                            "correo": ""
                        }

                    arr_correos[user['usuario__email']]["correo"] += '<b>"%s -> %s -> #%s %s"</b>. <br><br>' % (
                        ticket.agrupacion.workspace.nombre, ticket.agrupacion.nombre, ticket.id, ticket.titulo
                    )

            for correo in arr_correos:
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
                                                    <img src="%s" alt="No se puedo cargar la imagen" 
                                                    style="width: 100%%" width="100%%">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="background: #333333; color: white; text-align:center;">
                                                    <h2>Notificación del modulo de My Day.</h2>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: center; padding: 20px;">
                                                    Se te informa que los siguientes tickets están vencidos: <br> %s
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td width="35%%">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                """ % (IMAGEN_GB, arr_correos[correo]['correo'])

                if not DEBUG:
                    msg = EmailMessage(str_subject, str_html, 'nova@grupobuena.com', [correo])
                    msg.content_subtype = "html"
                    msg.send()


def api_send_reporte_existencias_condiciones():
    if not DEBUG:
        str_sql = """
            SELECT NoClasificacion=min(c.noclasificacion),
                   Clasificacion=min(c.descripcion),
                   Producto=min(p.codigoproducto),
                   Descripcion=min(p.descripcion),
                   Condicion=min(d.Descripcion),
                   ExistenciaU=sum(e.existencia),
                   ExistenciaC=sum(convert(decimal(14, 2), coalesce(e.existencia / r.cantidad, 0)))
            FROM Inventario..lotes l
                     INNER JOIN Inventario..condiciones d on d.NoCondicion = l.NoCondicion
                     INNER JOIN Inventario..productos p on p.NoProducto = l.NoProducto
                     INNER JOIN Inventario..clasificaciones c on c.noclasificacion = p.noclasificacion
                     INNER JOIN Inventario..existenciaslotes e on e.NoLote = l.NoLote and e.NoProducto = l.NoProducto
                     LEFT OUTER JOIN Inventario..productospresentaciones r on r.noproducto = p.noproducto
            WHERE e.existencia > 0
              AND e.noempresa = 1
            GROUP BY l.NoProducto, l.NoCondicion
            ORDER BY NoClasificacion, l.NoProducto, l.NoCondicion
        """
        arr_reporte = get_query(str_sql)

        excel = BytesIO()
        wb = xlwt.Workbook(encoding='UTF-8')
        ws = wb.add_sheet('Hoja 1')
        style = xlwt.XFStyle()
        style.num_format_str = '0'

        ws.write(0, 0, 'NoClasificacion')
        ws.write(0, 1, 'Clasificacion')
        ws.write(0, 2, 'Producto')
        ws.write(0, 3, 'Descripcion')
        ws.write(0, 4, 'Condicion')
        ws.write(0, 5, 'ExistenciaU')
        ws.write(0, 6, 'ExistenciaC')

        int_row = 1
        for reporte in arr_reporte:
            ws.write(int_row, 0, reporte['NoClasificacion'])
            ws.write(int_row, 1, reporte['Clasificacion'])
            ws.write(int_row, 2, reporte['Producto'])
            ws.write(int_row, 3, reporte['Descripcion'])
            ws.write(int_row, 4, reporte['Condicion'])
            ws.write(int_row, 5, reporte['ExistenciaU'], style)
            ws.write(int_row, 6, reporte['ExistenciaC'], style)
            int_row += 1

        wb.save(excel)

        email = EmailMultiAlternatives(
            "Existencias Condiciones",
            "",
            settings.EMAIL_HOST_USER,
            ['nrodriguez@grupobuena.com']
        )
        email.cc = ['nrodriguez@grupobuena.com']

        email.attach('Existencias Condiciones.xls', excel.getvalue(), 'application/vnd.ms-excel')
        email.send()


def api_send_email_manual_traslado_cron():
    if not DEBUG:
        str_sql = """
            SELECT ba.nombre AS 'bodega_actual',
                   bd.nombre AS 'bodega_destino',
                   bd.id     AS 'bodega_destino_id',
                   ba.id     AS 'bodega_actual_id',
                   l.NoContenedor,
                   p.CodigoProducto,
                   p.Descripcion,
                   tl.Custodio,
                   tl.costo,
                   tl.id,
                   ba.codigo AS 'bodega_actual_codigo',
                   l.FechaElaboracion,
                   tl.created_at,
                   tll.bool_email,
                   tll.bool_transfer,
                   tll.bool_filled,
                   t.name    as 'transportista',
                   1         AS 'bool_reverse'
            FROM nova..transporte_traslado_contenedores_log tll
                     JOIN inventario..traslado_lotes tl
                          ON tll.transfer_id = tl.id
                     JOIN ares..Transportistas t
                          ON tl.Transportista = t.id
                     JOIN foxcore..clientes_mayoristas ba
                          ON tl.BodegaA = ba.codigo
                     JOIN foxcore..clientes_mayoristas bd
                          ON tl.BodegaD = bd.id
                     JOIN Inventario..Lotes l
                          ON tl.NoLote = l.NoLote
                     JOIN Inventario..Productos p
                          ON l.NoProducto = p.NoProducto
            WHERE tl.activo = 1
              AND CAST(tl.created_at AS DATE) = GETDATE()
              AND tll.user_id = 69
              AND bd.id NOT IN (1, 2, 17, 24)
              AND tll.bool_email = 0
        """
        arr_reporte = get_query(str_sql)

        for reporte in arr_reporte:
            send_email_manual_cron(reporte['id'])


def api_send_refacturaciones():
    if not DEBUG:
        str_query = """
            select case when c.generaFE ='E' then 'Envio' else 'Factura' end as TipoDoc,   f.nodocumento as NoFactura,
                f.Serie, f.Nombre, f.Total, f.Observaciones
            from Inventario..Cotizaciones c join Inventario..facturas f on c.nofactura = f.nofactura
            join Inventario..empresas s on f.NoEmpresa = s.NoEmpresa
            where c.formaenvio = 2
            and cast(f.operado as date) = cast(getdate() as date)
        """
        obj_query = get_query(str_query)

        if obj_query:
            str_rows = ""

            for row in obj_query:
                str_rows += """
                    <tr style="border-bottom: 1px solid gray;">
                        <td style="border-bottom: 1px solid gray;">%s</td>
                        <td style="border-bottom: 1px solid gray;">%s</td>
                        <td style="border-bottom: 1px solid gray;text-align: right;">%s</td>
                        <td style="border-bottom: 1px solid gray;">%s</td>
                        <td style="border-bottom: 1px solid gray;text-align: right;">%s</td>
                        <td style="border-bottom: 1px solid gray;">%s</td>
                    </tr>
                """ % (str(row["TipoDoc"]), str(row["Serie"]), str(row["NoFactura"]), str(row["Nombre"]), str(row["Total"]),
                       str(row["Observaciones"]))

            str_html = """
                <table style="width: 100%%;">
                    <tbody>
                        <tr>
                            <td width="10%%">&nbsp;</td>
                            <td width="80%%">
                                <table style="width: 100%%; border: 1px solid #dddddd; border-radius: 3px;">
                                    <tbody>
                                        <tr>
                                            <td style="text-align: center; padding: 20px;">
                                                <img src="%s" alt="No se puedo cargar la imagen" 
                                                style="width: 100%%" width="100%%">
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="background: #333333; color: white; text-align:center;">
                                                <h2>Notificación de Refacturaciones del día.</h2>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center; padding: 20px;">
                                                <table cellspacing="0">
                                                    <thead>
                                                        <tr style="border-bottom: 1px solid gray;">
                                                            <th style="text-align: left;border-bottom: 1px solid gray;">Tipo Documento</th>
                                                            <th style="text-align: left;border-bottom: 1px solid gray;">Serie</th>
                                                            <th style="text-align: left;border-bottom: 1px solid gray;">No. Documento</th>
                                                            <th style="text-align: left;border-bottom: 1px solid gray;">Nombre</th>
                                                            <th style="text-align: left;border-bottom: 1px solid gray;">Total</th>
                                                            <th style="text-align: left;border-bottom: 1px solid gray;">Observaciones</th>
                                                        </td>
                                                    </thead>
                                                    <tbody>
                                                        %s
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td width="10%%">&nbsp;</td>
                        </tr>
                    </tbody>
                </table>
            """ % (IMAGEN_GB, str_rows)

            arr_correos = [
                "nrodriguez@grupobuena.com",
            ]

            msg = EmailMessage("Refacturaciones del Día", str_html, 'nova@grupobuena.com', arr_correos)
            msg.content_subtype = "html"
            msg.send()
