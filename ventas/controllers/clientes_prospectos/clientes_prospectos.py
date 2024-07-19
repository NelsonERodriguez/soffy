import uuid
from django.shortcuts import render, redirect
from core.functions import set_notification
from datetime import datetime
from django.core.files.storage import FileSystemStorage
from ventas.models import Cliente_prospecto, Cliente_actualizacion, Ingreso_devolucion
from sqlescapy import sqlescape
from os.path import splitext
from soffybiz.debug import DEBUG
from django.core.mail import EmailMessage


def index(request):

    if request.method == "POST":
        str_accion = request.POST.get("hdnAccion", None)

        str_nit = request.POST.get("nit", None)
        if str_nit:
            str_nit = sqlescape(str_nit)
            str_nit = str_nit.replace("-", "")

        if str_accion == "ingreso":
            obj_cliente_existe = Cliente_prospecto.objects.filter(nit=str_nit)

            if not obj_cliente_existe:
                url = 'media/clientes_prospectos/'

                file_rtu = request.FILES.get('rtu')
                file_dpi = request.FILES.get('dpi')

                fs = FileSystemStorage(location=url)

                path_rtu = None
                path_dpi = None

                str_uuid = str(uuid.uuid4())

                attachments = []

                if file_rtu:
                    nombre_archivo = file_rtu.name
                    extension = splitext(nombre_archivo)[1]
                    path_rtu = fs.save(str_uuid+'_rtu' + extension, file_rtu)

                    # content = open(file_rtu, 'rb').read()
                    # attachment = (file_rtu.name, content, 'application/pdf')
                    # attachments.append(attachment)

                if file_dpi:
                    nombre_archivo = file_dpi.name
                    extension = splitext(nombre_archivo)[1]
                    path_dpi = fs.save(str_uuid + '_dpi' + extension, file_dpi)

                    # content = open(file_dpi, 'rb').read()
                    # attachment = (file_dpi.name, content, 'application/pdf')
                    # attachments.append(attachment)

                str_nombre_cliente = request.POST.get("nombre_cliente", None)
                str_nombre_contacto = request.POST.get("nombre_contacto", None)
                str_direccion_entrega = request.POST.get("direccion_entrega", None)
                str_nombre_negocio = request.POST.get("nombre_negocio", None)
                str_direccion_fiscal = request.POST.get("direccion_fiscal", None)
                str_tipo_negocio = request.POST.get("tipo_negocio", None)
                str_telefono = request.POST.get("telefono", None)
                str_email = request.POST.get("email", None)
                str_email_model = str_email if len(str_email) > 0 else None
                str_cumpleanios_contacto = request.POST.get("cumpleanios_contacto", None)
                str_cumpleanios_contacto_model = str_cumpleanios_contacto if len(str_cumpleanios_contacto) > 0 else None
                str_observaciones = request.POST.get("observaciones", None)
                str_observaciones_model = str_observaciones if len(str_observaciones) > 0 else None
                str_nombre_vendedor = request.POST.get("nombre_vendedor", None)

                Cliente_prospecto.objects.create(
                    nit=str_nit,
                    nombre_cliente=str_nombre_cliente,
                    nombre_contacto=str_nombre_contacto,
                    direccion_entrega=str_direccion_entrega,
                    nombre_negocio=str_nombre_negocio,
                    direccion_fiscal=str_direccion_fiscal,
                    tipo_negocio=str_tipo_negocio,
                    telefono=str_telefono,
                    email=str_email_model,
                    cumpleanios_contacto=str_cumpleanios_contacto_model,
                    observaciones=str_observaciones_model,
                    rtu_path=path_rtu,
                    dpi_path=path_dpi,
                    nombre_vendedor=str_nombre_vendedor,
                )

                if not DEBUG:

                    str_html = f"""
                        <table style="width: 100%;">
                            <tbody>
                                <tr>
                                    <td width="10%">&nbsp;</td>
                                    <td width="80%">
                                        <table style="width: 100%; border: 1px solid #dddddd; border-radius: 3px;">
                                            <tbody>
                                                <tr>
                                                    <td style="background: #333333; color: white; text-align:center;" colspan="2">
                                                        <h2>Notificación de Ingreso de Cliente Nuevo.</h2>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="background: #333333; color: white; text-align:center;" colspan="2">
                                                        <h3>Información:</h3>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: left; padding: 20px;" width="20%">
                                                        NIT:
                                                    </td>
                                                    <td style="text-align: left; padding: 20px;" width="80%">
                                                        {str_nit}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: left; padding: 20px;" width="20%">
                                                        Nombre del cliente:
                                                    </td>
                                                    <td style="text-align: left; padding: 20px;" width="80%">
                                                        {str_nombre_cliente}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: left; padding: 20px;" width="20%">
                                                        Nombre del contacto:
                                                    </td>
                                                    <td style="text-align: left; padding: 20px;" width="80%">
                                                        {str_nombre_contacto}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: left; padding: 20px;" width="20%">
                                                        Dirección de entrega:
                                                    </td>
                                                    <td style="text-align: left; padding: 20px;" width="80%">
                                                        {str_direccion_entrega}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: left; padding: 20px;" width="20%">
                                                        Nombre de negocio:
                                                    </td>
                                                    <td style="text-align: left; padding: 20px;" width="80%">
                                                        {str_nombre_negocio}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: left; padding: 20px;" width="20%">
                                                        Dirección fiscal:
                                                    </td>
                                                    <td style="text-align: left; padding: 20px;" width="80%">
                                                        {str_direccion_fiscal}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: left; padding: 20px;" width="20%">
                                                        Tipo de negocio:
                                                    </td>
                                                    <td style="text-align: left; padding: 20px;" width="80%">
                                                        {str_tipo_negocio}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: left; padding: 20px;" width="20%">
                                                        Teléfono:
                                                    </td>
                                                    <td style="text-align: left; padding: 20px;" width="80%">
                                                        {str_telefono}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: left; padding: 20px;" width="20%">
                                                        Email:
                                                    </td>
                                                    <td style="text-align: left; padding: 20px;" width="80%">
                                                        {str_email}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: left; padding: 20px;" width="20%">
                                                        Cumpleaños de contacto:
                                                    </td>
                                                    <td style="text-align: left; padding: 20px;" width="80%">
                                                        {str_cumpleanios_contacto}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: left; padding: 20px;" width="20%">
                                                        Observaciones:
                                                    </td>
                                                    <td style="text-align: left; padding: 20px;" width="80%">
                                                        {str_observaciones}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: left; padding: 20px;" width="20%">
                                                        Nombre del Vendedor:
                                                    </td>
                                                    <td style="text-align: left; padding: 20px;" width="80%">
                                                        {str_nombre_vendedor}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                    <td width="10%">&nbsp;</td>
                                </tr>
                            </tbody>
                        </table>
                    """

                    arr_correos = [
                        "nrodriguez@grupobuena.com",
                    ]

                    msg = EmailMessage("Ingreso de Cliente Nuevo", str_html, 'nova@grupobuena.com',
                                       arr_correos)

                    if path_rtu:
                        nombre_archivo = file_rtu.name
                        extension = splitext(nombre_archivo)[1]
                        with open(url + path_rtu, 'rb') as f:
                            msg.attach("RTU."+extension, f.read(), file_rtu.content_type)
                    if path_dpi:
                        nombre_archivo = file_dpi.name
                        extension = splitext(nombre_archivo)[1]
                        with open(url + path_dpi, 'rb') as f:
                            msg.attach("DPI."+extension, f.read(), file_dpi.content_type)
                    msg.content_subtype = "html"
                    msg.send()

                set_notification(request, True, "Cliente ingresado exitosamente.", "add_alert", "success")
            else:
                set_notification(request, True, "El cliente ya se había ingresado anteriormente.", "add_alert",
                                 "success")

        elif str_accion == "actualizar":
            str_codigo_cliente = request.POST.get("codigo_cliente", None)
            str_razon_social = request.POST.get("razon_social", None)
            str_direccion_fiscal = request.POST.get("direccion_fiscal", None)
            str_direccion_entrega = request.POST.get("direccion_entrega", None)
            str_otra_sucursal = request.POST.get("otra_sucursal", None)
            str_nombre_vendedor = request.POST.get("nombre_vendedor", None)

            url = 'media/clientes_prospectos/'
            file_rtu = request.FILES.get('rtu', None)
            file_dpi = request.FILES.get('dpi', None)
            fs = FileSystemStorage(location=url)
            path_rtu = None
            path_dpi = None
            str_uuid = str(uuid.uuid4())
            if file_rtu:
                nombre_archivo = file_rtu.name
                extension = splitext(nombre_archivo)[1]
                path_rtu = fs.save(str_uuid+'_rtu' + extension, file_rtu)
            if file_dpi:
                nombre_archivo = file_dpi.name
                extension = splitext(nombre_archivo)[1]
                path_dpi = fs.save(str_uuid + '_dpi' + extension, file_dpi)

            Cliente_actualizacion.objects.create(
                codigo_cliente=str_codigo_cliente,
                razon_social=str_razon_social,
                nit=str_nit,
                direccion_fiscal=str_direccion_fiscal,
                direccion_entrega=str_direccion_entrega,
                otra_sucursal=str_otra_sucursal,
                nombre_vendedor=str_nombre_vendedor,
                rtu_path=path_rtu,
                dpi_path=path_dpi,
            )

            if not DEBUG:
                str_html = f"""
                    <table style="width: 100%;">
                        <tbody>
                            <tr>
                                <td width="10%">&nbsp;</td>
                                <td width="80%">
                                    <table style="width: 100%; border: 1px solid #dddddd; border-radius: 3px;">
                                        <tbody>
                                            <tr>
                                                <td style="background: #333333; color: white; text-align:center;" colspan="2">
                                                    <h2>Notificación Actualización Información de Cliente.</h2>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="background: #333333; color: white; text-align:center;" colspan="2">
                                                    <h3>Información:</h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Código Cliente:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_codigo_cliente}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Razón Social:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_razon_social}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    NIT:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_nit}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Dirección fiscal:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_direccion_fiscal}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Dirección de entrega:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_direccion_entrega}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Otra Sucursal:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_otra_sucursal}
                                                </td>
                                            </tr>
                                            
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Nombre del Vendedor:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_nombre_vendedor}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td width="10%">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                """

                arr_correos = [
                    "nrodriguez@grupobuena.com",
                ]

                msg = EmailMessage("Actualización Información de Cliente", str_html, 'nova@grupobuena.com',
                                   arr_correos)

                if path_rtu:
                    nombre_archivo = file_rtu.name
                    extension = splitext(nombre_archivo)[1]
                    with open(url + path_rtu, 'rb') as f:
                        msg.attach("RTU." + extension, f.read(), file_rtu.content_type)
                if path_dpi:
                    nombre_archivo = file_dpi.name
                    extension = splitext(nombre_archivo)[1]
                    with open(url + path_dpi, 'rb') as f:
                        msg.attach("DPI." + extension, f.read(), file_dpi.content_type)

                msg.content_subtype = "html"
                msg.send()

            set_notification(request, True, "Información para actualización enviada exitosamente.", "add_alert",
                             "success")

        elif str_accion == "devoluciones":
            str_vendedor = request.POST.get("vendedor_dev", None)
            str_cliente = request.POST.get("cliente_dev", None)
            str_fecha = request.POST.get("fecha_dev", None)
            str_producto = request.POST.get("producto_dev", None)
            str_factura = request.POST.get("factura_dev", None)
            str_motivo = request.POST.get("motivo_dev", None)
            str_otro_motivo = request.POST.get("otro_motivo_dev", None)

            Ingreso_devolucion.objects.create(
                vendedor=str_vendedor,
                cliente=str_cliente,
                fecha=str_fecha,
                producto=str_producto,
                factura=str_factura,
                motivo=str_motivo,
                otro_motivo=str_otro_motivo,
            )

            date_format = '%Y-%m-%d'
            obj_date = datetime.strptime(str_fecha, date_format)
            str_date_es = obj_date.strftime("%d/%m/%Y")

            if not DEBUG:
                str_motivo_visible = ""

                if str_motivo == "VENDEDOR":
                    str_motivo_visible = "Error Vendedor"
                elif str_motivo == "CLIENTE":
                    str_motivo_visible = "Error Cliente"
                elif str_motivo == "PRESENTACION":
                    str_motivo_visible = "Presentación del Producto"
                elif str_motivo == "OTRO":
                    str_motivo_visible = "Otro"

                str_html = f"""
                    <table style="width: 100%;">
                        <tbody>
                            <tr>
                                <td width="10%">&nbsp;</td>
                                <td width="80%">
                                    <table style="width: 100%; border: 1px solid #dddddd; border-radius: 3px;">
                                        <tbody>
                                            <tr>
                                                <td style="background: #333333; color: white; text-align:center;" colspan="2">
                                                    <h2>Notificación Devolución de Producto.</h2>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="background: #333333; color: white; text-align:center;" colspan="2">
                                                    <h3>Información:</h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Vendedor:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_vendedor}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Cliente:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_cliente}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Fecha:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_date_es}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Producto:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_producto}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Cajas o Libras:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_factura}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Motivo:
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_motivo_visible}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="text-align: left; padding: 20px;" width="20%">
                                                    Explicación/motivo de la devolución::
                                                </td>
                                                <td style="text-align: left; padding: 20px;" width="80%">
                                                    {str_otro_motivo}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td width="10%">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                """

                arr_correos = [
                    "nrodriguez@grupobuena.com",
                ]

                msg = EmailMessage("Devolución de Producto", str_html, 'nova@grupobuena.com',
                                   arr_correos)

                msg.content_subtype = "html"
                msg.send()

            set_notification(request, True, "Información para actualización enviada exitosamente.", "add_alert",
                             "success")

        return redirect('ventas-clientes_prospectos')

    str_hoy = datetime.today().strftime('%Y-%m-%d')
    data = {
        "hoy": str_hoy
    }
    return render(request, 'clientes_prospectos/clientes_prospectos.html', data)
