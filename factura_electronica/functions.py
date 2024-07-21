from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import JsonResponse
from core.functions import get_query, insert_query, get_json_response_xml, get_convert_json_response_xml, \
    execute_query, send_email
# from core.inventario_models import FacturasInventario
from soffybiz.debug import DEBUG
from soffybiz.settings import FEL_AMBIENT
from .models import cola_facturacion, cola_facturacion_detalle
# from ventas import functions
# from ventas.models import Facturas
from datetime import timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

import datetime
import requests
import uuid


def clean_tax(tax_emission):
    tax = 'CF'
    if tax_emission != '':
        tax = tax_emission.replace('-', '').replace(' ', '').replace('_', '').upper()
    return tax


def get_correctly_date(str_date):
    return str_date.strftime("%Y-%m-%dT%H:%M:%SZ")


# generamos token para fel
def make_tokens():
    try:
        str_error = ''
        str_query_api_url = """
            SELECT 
                FEL.id,
                FEL.url 
            FROM 
                ares..fel_api_urls FEL 
            WHERE 
                FEL.name = 'solicitarToken' 
            AND FEL.type = '%s'""" % FEL_AMBIENT
        arr_api_url = get_query(str_query_api_url)

        int_url_id = arr_api_url[0]['id'] if arr_api_url else ''
        str_url = arr_api_url[0]['url'] if arr_api_url else ''

        str_query_companies = """
            SELECT 
                id, 
                usuario, 
                apikey, 
                nombre
            FROM 
                ares..empresas
            WHERE 
                fel = 1"""
        arr_companies = get_query(str_query_companies)

        for company in arr_companies:
            str_xml_token = """<?xml version="1.0" encoding="UTF-8"?>
                                <SolicitaTokenRequest>
                                    <usuario>%s</usuario>
                                    <apikey>%s</apikey>
                                </SolicitaTokenRequest>""" % (company['usuario'], company['apikey'])
            headers = {
                'Content-Type': 'text/xml;'
            }

            # response = requests.request("POST", str_url, data=str_xml_token, headers=HEADERS)
            response = requests.post(str_url, headers=headers, data=str_xml_token)
            if response.status_code == 200:

                json_response = get_json_response_xml(response)

                if 'SolicitaTokenResponse' in json_response:
                    solicita_response = json_response['SolicitaTokenResponse']
                    if 'listado_errores' in solicita_response:
                        str_error += '\n La empresa %s (%s), no genero token correctamente' % \
                                     (company['id'], company['name'])
                    elif 'token' in solicita_response:
                        str_token = solicita_response['token']
                        str_token = str_token['$']
                        date_vigencia = solicita_response['vigencia']
                        date_vigencia = date_vigencia['$']
                        arr_split_vigencia = date_vigencia.split('T')
                        arr_date = arr_split_vigencia[0].split('-')
                        arr_time = arr_split_vigencia[1].split('-')[0].split(':')
                        date_vigencia = datetime.datetime(
                            int(arr_date[0]),
                            int(arr_date[1]),
                            int(arr_date[2]),
                            int(arr_time[0]),
                            int(arr_time[1]),
                            int(arr_time[2])
                        ).strftime('%Y-%m-%d %H:%M:%S')
                        str_query_insert = """
                            INSERT INTO ares..fel_tokens 
                            VALUES 
                            ('%s', '%s', '%s', '%s', GETDATE(), GETDATE())
                        """ % (int_url_id, company['id'], str_token, date_vigencia)
                        insert_query(str_query_insert)

                else:
                    str_error += """
                        \n Ocurrió un error no identificable al intentar generar el token de la empresa %s (%s)
                    """ % (company.id, company.name)
            else:
                str_error += 'Ocurrió un error: no se obtuvo respuesta de FEL'

        return {
            'status': True if str_error == '' else False,
            'message': 'Tokens generados correctamente' if str_error == '' else str_error
        }
    except ValueError:
        return {
            'status': False,
            'message': 'Fallo al generar los tokens: %s' % ValueError
        }


# busco el token de la empresa
def get_token(int_empresa):
    str_sql_token = """
        SELECT
            TOP 1 token
        FROM
            ares..fel_tokens
        WHERE
            empresa_id = %s
        ORDER BY
            id DESC
    """
    arr_token = get_query(str_sql=str_sql_token, params=(int_empresa,))
    str_token = arr_token[0]['token'] if arr_token else ''
    return str_token


# busco el url para fel
def get_api_url(str_tipo, str_ambient=FEL_AMBIENT):
    str_sql_api_url = """
        SELECT 
            FEL.url 
        FROM 
            ares..fel_api_urls FEL 
        WHERE 
            FEL.name = %s
        AND FEL.type = %s"""
    return get_query(str_sql=str_sql_api_url, params=(str_tipo, str_ambient))


# validación a fel si existe en nit
def get_datos_nit(str_nit='', int_empresa=1):
    # Cambio para que valide el nit en production siempre, ya que no afecta en nada
    str_token = get_token(int_empresa)
    str_nit = str(str_nit).replace('-', '')
    arr_api_url = get_api_url('retornarDatosCliente', str_ambient='production')

    str_url = arr_api_url[0]['url'] if arr_api_url else ''

    # xml para validar el nit
    str_soap = f"""<?xml version="1.0" encoding="UTF-8"?> 
                <RetornaDatosClienteRequest>
                    <nit>{str_nit}</nit> 
                </RetornaDatosClienteRequest>"""

    headers = {
        'Content-Type': 'text/xml;',
        'Authorization': f'Bearer {str_token}'
    }

    response = requests.post(str_url, headers=headers, data=str_soap)

    if response.status_code == 200:
        str_xml = response.text
        arr_json = get_convert_json_response_xml(str_xml)

        # obtengo todos los datos del cliente en fel
        if arr_json and 'RetornaDatosClienteResponse' in arr_json and \
                'tipo_respuesta' in arr_json['RetornaDatosClienteResponse'] and \
                int(arr_json['RetornaDatosClienteResponse']['tipo_respuesta']) == 0:
            arr_datos = {
                "nombre": arr_json['RetornaDatosClienteResponse']['nombre'],
                "direcciones": arr_json['RetornaDatosClienteResponse']['direcciones'],
                "status": True,
                'error': '',
                'nit': str_nit
            }

        else:
            arr_datos = {
                "nombre": '',
                "direcciones": '',
                "status": False,
                'error': arr_json['RetornaDatosClienteResponse']['listado_errores'],
                'nit': str_nit
            }

    else:
        arr_datos = None

    return arr_datos


# api para validar el nit si es cliente nuevo si existe en el sistema y luego válida en la sat
@login_required(login_url="/login/")
def validate_nit(request):
    str_nit = request.POST.get('nit', '')
    str_nit = str_nit.upper()
    # int_empresa = request.POST.get('empresa_id', 1)
    int_empresa = 1

    # if validar_nit(str_nit):
    if request.POST.get('cliente_existe'):

        str_exists_client_sql = """
            SELECT
                NoCliente
            FROM
                Inventario..Clientes
            WHERE
                REPLACE(NIT, '-', '') = REPLACE('%s', '-', '')
        """ % str_nit
        arr_cliente = get_query(str_exists_client_sql)

        if arr_cliente:
            data = {
                "cliente_exist": True
            }

            return JsonResponse(data, safe=False)

    arr_nit = get_datos_nit(str_nit, int_empresa)

    data = {
        "datos": arr_nit
    }

    return JsonResponse(data, safe=False)


# valida el nit en guatemala
def validar_nit(nit):
    nit_n = nit.replace(' ', '')
    nit_ok = nit_n.replace('-', '')
    base = 1

    dig_validador = nit_ok[-1]

    dig_nit = list(nit_ok[0:-1])

    dig_nit.reverse()  # None

    try:
        suma = 0
        for n in dig_nit:
            base += 1
            suma += int(n) * base

        resultado = suma % 11
        comprobacion = 11 - resultado

        if suma >= 11:
            resultado = suma % 11
            comprobacion = 11 - resultado

        if comprobacion == 10:
            if dig_validador.upper() == 'K':
                return True

        elif comprobacion == int(dig_validador):
            return True

        else:
            return False

    except ValueError:
        return False


def process_factura_electronica(int_cotizacion, int_user):
    # Busco la cotización
    # arr_cotizacion = functions.get_cotizacion(int_cotizacion, True)
    # int_usuario = functions.get_usuario_sistemas(int_user)
    # # busco los detalles de la cotización
    # arr_detalles = functions.get_cotizacion_detalle(int_cotizacion)
    # # busco la empresa
    # arr_empresa = functions.get_empresa(arr_cotizacion['NoEmpresa'])[0]
    # int_establecimiento = 2 if int_usuario == 50 or int_usuario == 205 else 1
    arr_empresa= []
    str_nombre_comercial = "Alimentos Gosnell 2" if 0 == 2 else arr_empresa['nombre_comercial']
    str_dir_comercial = "Alimentos Gosnell 2" if 0 == 2 else arr_empresa['direccion_comercial']

    # la frase por defecto sería esta
    frases = [{
        "CodigoEscenario": 1,
        "TipoFrase": 1,
    }]

    # para preasa y escalas lleva otra frase
    if arr_empresa['id'] == 2 or arr_empresa['id'] == 5 or arr_empresa['id'] == 1 or arr_empresa['id'] == 4:
        frases.append(
            {
                "CodigoEscenario": 1,
                "TipoFrase": 2,
            }
        )

    arr_cotizacion = []

    arr_cola = cola_facturacion.objects.filter(
        tabla="facturas",
        campo="nofactura",
        valor_campo=arr_cotizacion['NoFactura'],
    ).first()

    if arr_cola:
        if arr_cola.firmado:
            return {
                "status": True,
                "message": "El documento ya esta firmado",
            }

        else:
            id_cola = arr_cola.id

    else:
        arr_cola = cola_facturacion.objects.create(
            tabla="facturas",
            campo="nofactura",
            valor_campo=arr_cotizacion['NoFactura'],
            firmado=False,
        )
        id_cola = arr_cola.id

    # si es crédito la fecha de pago sería los días que tiene el cliente configurado
    if arr_cotizacion['EsCredito'] == 1:
        obj_fecha_vencimiento = datetime.datetime.now() + timedelta(days=arr_cotizacion['DiasCredito'])
        str_fecha_vencimiento = obj_fecha_vencimiento.strftime('%Y-%m-%d')
    else:
        str_fecha_vencimiento = datetime.datetime.now().strftime('%Y-%m-%d')

    # genero el uuid
    str_uuid = str(uuid.uuid4()).upper()

    # armo el listado para generar el xml
    arr_datos = {
        "UUID": str_uuid,
        "Tipo": "FCAM",
        "FechaHoraEmision": str(arr_cotizacion['Fecha'].replace(tzinfo=ZoneInfo("America/Guatemala"))).replace(' ',
                                                                                                               'T'),
        "CodigoEstablecimiento": 0,
        "CorreoEmisor": arr_empresa['email'],
        "NITEmisor": arr_empresa['nit'],
        "NombreComercial": str_nombre_comercial,
        "NombreEmisor": arr_empresa['nombre'],
        "DireccionEmisor": str_dir_comercial,
        "IDReceptor": arr_cotizacion['NoNit'].replace('-', ''),
        "NombreReceptor": arr_cotizacion['Nombre'].replace('&', ''),
        "Direccion": arr_cotizacion['Direccion'],
        "Total": arr_cotizacion['Total'],
        "Frases": frases,
        "FechaVencimiento": str_fecha_vencimiento,
        "detalles": [],
    }

    # creo el xml
    str_xml = build_xml_document_fel(arr_datos)
    # busco el token
    str_token = get_token(arr_empresa['id'])
    # firmo el documento
    arr_firma = firmar_document_fel(str_token, str_xml, id_cola)

    # si firma bien el documento procedemos
    if arr_firma['status']:
        # armo el xml para registrar el documento en fel
        str_xml_a_registrar = build_xml_document_firmado(str_uuid, arr_firma['xml_dte'])
        # vamos a registrar el xml a fel
        arr_registro = registrar_documento_fel(str_token, str_xml_a_registrar, id_cola)

        # si procesamos bien grabamos en la db
        if arr_registro['status']:

            # formateo la fecha de la certificación que viene en el xml
            arr_split_fecha = arr_registro['fecha_certificacion'].split('.')
            str_fecha_certificacion = arr_split_fecha[0].replace('T', ' ')

            # armo los detalles para grabar fel
            arr_datos_fel = {
                "uuid": str_uuid,
                "empresa_id": arr_empresa['id'],
                "fel_tipo_id": 2,
                "fecha_emision": arr_cotizacion['Fecha'].strftime("%Y-%m-%d %H:%M:%S"),
                "numero_autorizacion": arr_registro['autorizacion'],
                "fel_serie": arr_registro['serie'],
                "fel_numero": arr_registro['numero'],
                "fecha_autorizacion": str_fecha_certificacion,
                "inventario_referencia_id": int_cotizacion,
                "inventario_documento_id": arr_cotizacion['NoFactura'],
                "is_fiscal": False,
            }

            # grabo en la tabla de fel
            save_fel(arr_datos_fel)
            arr_datos = {
                "Serie": arr_registro['serie'],
                "NoDocumento": arr_registro['numero'],
                "NoFactura": arr_cotizacion['NoFactura'],
            }
            update_factura(arr_datos)
            # actualizo ventas generales
            update_ventas_generales(arr_datos)
            # aquí actualizo la cuenta corriente
            update_auxiliarcxc(arr_datos)

            arr_cola.firmado = True
            arr_cola.serie = arr_registro['serie']
            arr_cola.numero = arr_registro['numero']
            arr_cola.numero_autorizacion = arr_registro['autorizacion']
            arr_cola.fecha_autorizacion = str_fecha_certificacion
            arr_cola.save()

            return arr_registro

        else:
            str_subject = 'NoFactura %s no firmada ' % arr_cotizacion['NoFactura']
            if not DEBUG:
                send_email(str_subject=str_subject, str_body=arr_registro['message'], bool_send=False)
            # retorno el error al registrar
            return arr_registro

    else:
        # retorno el error al firmar
        return arr_firma


# aquí actualizo ventas generales
def update_ventas_generales(arr_datos):
    return execute_query(
        sql="UPDATE ares..ventas_generales SET Serie = %s, Numero = %s WHERE NoFactura = %s",
        params=(arr_datos['Serie'], arr_datos['NoDocumento'], arr_datos['NoFactura'])
    )


# actualizo el número y serie de la factura
def update_factura(arr_datos):
    try:
        # factura = Facturas.objects.get(nofactura=arr_datos['NoFactura'])
        # factura.serie = arr_datos['Serie']
        # factura.nodocumento = arr_datos['NoDocumento']
        # factura.save()

        # factura_inventario = FacturasInventario.objects.get(nofactura=arr_datos['NoFactura'])
        factura_inventario = []
        factura_inventario.serie = arr_datos['Serie']
        factura_inventario.nodocumento = arr_datos['NoDocumento']
        factura_inventario.save()
    except ValueError:
        pass

    return execute_query(
        sql="UPDATE Inventario..Facturas SET Serie = %s, NoDocumento = %s WHERE NoFactura = %s",
        params=(arr_datos['Serie'], arr_datos['NoDocumento'], arr_datos['NoFactura'])
    )


# aquí actualizo la cuenta corriente
def update_auxiliarcxc(arr_datos):
    return execute_query(
        sql="UPDATE cuentacorriente..auxiliarcxc SET Serie = %s, NoDocumento = %s WHERE Nopoliza = %s",
        params=(arr_datos['Serie'], arr_datos['NoDocumento'], arr_datos['NoFactura'])
    )


# aquí grabo los datos de fel
def save_fel(arr_datos):
    str_table = "fel_documentos_fiscal" if arr_datos['is_fiscal'] else "fel_documentos"
    str_sql_fel = """
        INSERT INTO ares..%s
        (uuid, empresa_id, fel_certificador_id, fel_tipo_id, fecha_emision, numero_autorizacion, fel_serie, 
        fel_numero, fecha_autorizacion, inventario_referencia_id, inventario_documento_id, anulado, fel_pdf, 
        created_at, updated_at, xml_anular)
        VALUES 
        ('%s', %s, 1, %s, '%s', '%s', '%s',
        '%s', '%s', %s, %s, 0, NULL,
        GETDATE(), GETDATE(), NULL)
    """ % (
        str_table,
        arr_datos['uuid'],
        arr_datos['empresa_id'],
        arr_datos['fel_tipo_id'],
        arr_datos['fecha_emision'],
        arr_datos['numero_autorizacion'],
        arr_datos['fel_serie'],
        arr_datos['fel_numero'],
        arr_datos['fecha_autorizacion'],
        arr_datos['inventario_referencia_id'],
        arr_datos['inventario_documento_id'],
    )
    arr_fel = insert_query(str_sql_fel)
    return arr_fel['id'] if arr_fel else False


def registrar_documento_fel(str_token, str_xml, id_cola):
    cola_detalle = cola_facturacion_detalle.objects.create(
        cola_id=id_cola,
        paso=2,
        data_enviada=str_xml,
        fecha_envio=datetime.datetime.now(),
    )

    # busco el url para registrar
    arr_api_url = get_api_url('registrarDocumentoXML')
    str_url = arr_api_url[0]['url'] if arr_api_url else ''

    # header del api con su token
    headers = {
        'Content-Type': 'text/xml;',
        'Authorization': 'Bearer %s' % str_token
    }
    # enviamos el xml a firmar
    response = requests.post(str_url, headers=headers, data=str_xml.encode())
    cola_detalle.data_recibida = response.text
    cola_detalle.fecha_recibido = datetime.datetime.now()
    cola_detalle.save()

    # si firma bien retornara un xml con la firma
    if response.status_code == 200:
        str_xml = response.text
        arr_json = get_convert_json_response_xml(str_xml)
        str_serie = ""
        str_numero = ""
        str_autorizacion = ""
        str_fecha_certificacion = ""

        if arr_json and 'RegistraDocumentoXMLResponse' in arr_json:
            if 'xml_dte' in arr_json['RegistraDocumentoXMLResponse']:
                str_xml_dte = arr_json['RegistraDocumentoXMLResponse']['xml_dte']
                arr_json_dte = get_convert_json_response_xml(str_xml_dte.replace('dte:', ''))
                if arr_json_dte:
                    arr_certificacion = arr_json_dte['GTDocumento']['SAT']['DTE']['Certificacion']
                    str_serie = arr_certificacion['NumeroAutorizacion']['@Serie']
                    str_numero = arr_certificacion['NumeroAutorizacion']['@Numero']
                    str_autorizacion = arr_certificacion['NumeroAutorizacion']['#text']
                    str_fecha_certificacion = arr_certificacion['FechaHoraCertificacion']

            elif 'listado_errores' in arr_json['RegistraDocumentoXMLResponse']:
                if 'error' in arr_json['RegistraDocumentoXMLResponse']['listado_errores']:
                    arr_errores_registro = arr_json['RegistraDocumentoXMLResponse']['listado_errores']
                    arr_errores = get_errores(arr_errores_registro)

                    return {
                        "status": False,
                        "codigo": arr_errores['codigo'],
                        "message": "Error: Documento no firmado, %s, comuníquese con IT" % arr_errores['message']
                    }

        return {
            "status": True,
            "serie": str_serie,
            "numero": str_numero,
            "autorizacion": str_autorizacion,
            "fecha_certificacion": str_fecha_certificacion,
            "message": "Documento firmado."
        }

    elif response.status_code == 406:
        str_xml = response.text

        return {
            "status": False,
            "message": str_xml,
        }

    else:
        return {
            "status": False,
            "message": "No se obtuvo respuesta de Megaprint en el registro"
        }


# busco los errores que viene en los api de fel
def get_errores(arr_errores):
    str_codigo = ""
    str_desc = ""
    # si son muchos errores trae todos los mensajes
    if str(type(arr_errores['error'])) == "<class 'list'>":
        for arr_listado in arr_errores['error']:
            if 'cod_error' in arr_listado:
                str_codigo += "\n %s" % arr_listado['cod_error']
            if 'desc_error' in arr_listado:
                str_desc += "\n %s" % arr_listado['desc_error']

    # si es solo uno retorna el error
    elif str(type(arr_errores['error'])) == "<class 'dict'>":
        str_codigo = arr_errores['error']['cod_error'] if 'cod_error' in arr_errores['error'] else ''
        str_desc = arr_errores['error']['desc_error'] if 'desc_error' in arr_errores['error'] else ''

    return {
        "message": str_desc,
        "codigo": str_codigo,
    }


# creo el xml que se envio a registrar el documento
def build_xml_document_firmado(str_uuid, xml):
    str_xml = """<?xml version="1.0" encoding="UTF-8"?>
                <RegistraDocumentoXMLRequest id="%s">
                    <xml_dte><![CDATA[%s]]></xml_dte>
                </RegistraDocumentoXMLRequest>""" % (str_uuid, xml)
    return str_xml


# vamos a megaprint a firmar el documento
def firmar_document_fel(str_token, str_xml, id_cola, bool_anular=False):
    if bool_anular:
        cola_detalle = cola_facturacion_detalle.objects.create(
            cola_id=id_cola,
            paso=3,
            data_enviada=str_xml,
            fecha_envio=datetime.datetime.now(),
        )
    else:
        cola_detalle = cola_facturacion_detalle.objects.create(
            cola_id=id_cola,
            paso=1,
            data_enviada=str_xml,
            fecha_envio=datetime.datetime.now(),
        )

    # busco el url para firmar
    arr_api_url = get_api_url('solicitaFirma')
    str_url = arr_api_url[0]['url'] if arr_api_url else ''

    # header del api con su token
    headers = {
        'Content-Type': 'text/xml;',
        'Authorization': 'Bearer %s' % str_token
    }

    # enviamos el xml a firmar
    response = requests.post(str_url, headers=headers, data=str_xml)
    cola_detalle.data_recibida = response.text
    cola_detalle.fecha_recibido = datetime.datetime.now()
    cola_detalle.save()

    # si firma bien retornara un xml con la firma
    if response.status_code == 200:
        str_xml = response.text
        arr_json = get_convert_json_response_xml(str_xml)

        if arr_json and 'FirmaDocumentoResponse' in arr_json:
            if 'tipo_respuesta' in arr_json['FirmaDocumentoResponse'] and \
                    int(arr_json['FirmaDocumentoResponse']['tipo_respuesta']) == 1:
                if 'listado_errores' in arr_json['FirmaDocumentoResponse']:
                    if arr_json['FirmaDocumentoResponse']['listado_errores'] and \
                            'error' in arr_json['FirmaDocumentoResponse']['listado_errores']:
                        arr_errores_firma = arr_json['FirmaDocumentoResponse']['listado_errores']
                        # busco los errores del xml
                        arr_errores = get_errores(arr_errores_firma)

                        return {
                            "status": False,
                            "codigo": arr_errores['codigo'],
                            "message": "Error: Documento no firmado, %s, comuníquese con IT" % arr_errores['message']
                        }

        return {
            "status": True,
            "xml_dte": arr_json['FirmaDocumentoResponse']['xml_dte'] if arr_json else '',
        }

    # si ocurre algún error con el xml retorna cuales fueron
    elif response.status_code == 406:
        str_xml = response.text
        arr_json = get_convert_json_response_xml(str_xml)

        if arr_json and 'FirmaDocumentoResponse' in arr_json:
            if 'tipo_respuesta' in arr_json['FirmaDocumentoResponse'] and \
                    int(arr_json['FirmaDocumentoResponse']['tipo_respuesta']) == 1:
                if 'listado_errores' in arr_json['FirmaDocumentoResponse']:
                    if 'error' in arr_json['FirmaDocumentoResponse']['listado_errores']:
                        arr_errores_firma = arr_json['FirmaDocumentoResponse']['listado_errores']
                        # voy a traer todos los errores
                        arr_errores = get_errores(arr_errores_firma)

                        return {
                            "status": False,
                            "codigo": arr_errores['codigo'],
                            "message": "Error: Documento no firmado, %s, comuníquese con IT" % arr_errores['message']
                        }

    else:
        return {
            "status": False,
            "codigo": "",
            "message": "No se obtuvo respuesta de Megaprint en la firma"
        }


def build_xml_document_fel(arr_datos):
    if arr_datos['Tipo'] == "FCAM":
        str_frases = """<dte:Frases>"""
        for frases in arr_datos['Frases']:
            str_frases += """<dte:Frase CodigoEscenario="%s" TipoFrase="%s"/>""" % (
                frases['CodigoEscenario'],
                frases['TipoFrase'],
            )
        str_frases += """</dte:Frases>"""

        str_complemento = """<dte:Complemento IDComplemento="1" NombreComplemento="Abono"
                            URIComplemento="http://www.sat.gob.gt/dte/fel/CompCambiaria/0.1.0">
                            <cfc:AbonosFacturaCambiaria xmlns:cfc="http://www.sat.gob.gt/dte/fel/CompCambiaria/0.1.0" 
                            Version="1">
                            <cfc:Abono>
                                <cfc:NumeroAbono>1</cfc:NumeroAbono>
                                <cfc:FechaVencimiento>%s</cfc:FechaVencimiento>
                                <cfc:MontoAbono>%s</cfc:MontoAbono>
                            </cfc:Abono>
                            </cfc:AbonosFacturaCambiaria>
                        </dte:Complemento> """ % (arr_datos['FechaVencimiento'], "{:.2f}".format(arr_datos['Total']))

    else:
        str_frases = ""
        str_complemento = """<dte:Complemento IDComplemento="1" NombreComplemento="NOTA CREDITO"
                                URIComplemento="http://www.sat.gob.gt/face2/ComplementoReferenciaNota/0.1.0">
                            <cno:ReferenciasNota xmlns:cno="http://www.sat.gob.gt/face2/ComplementoReferenciaNota/0.1.0"
                            FechaEmisionDocumentoOrigen="%s" MotivoAjuste="%s" 
                            NumeroAutorizacionDocumentoOrigen="%s" Version="1"/>
                            </dte:Complemento>""" % (
            arr_datos['FechaEmisionDocumentoOrigen'],
            arr_datos['MotivoAjuste'],
            arr_datos['NumeroAutorizacionDocumentoOrigen'],
        )

    str_tipo_especial = 'TipoEspecial="CUI"' if len(arr_datos['IDReceptor']) == 13 else ""

    str_xml = """<?xml version="1.0" encoding="UTF-8"?>
    <FirmaDocumentoRequest id="%s">
        <xml_dte><![CDATA[<?xml version="1.0" encoding="UTF-8" standalone="no"?>
            <dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0" 
            xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Version="0.1">
                <dte:SAT ClaseDocumento="dte">
                    <dte:DTE ID="DatosCertificados">
                        <dte:DatosEmision ID="DatosEmision">
                            <dte:DatosGenerales CodigoMoneda="GTQ" FechaHoraEmision="%s" Tipo="%s"/>
                            <dte:Emisor AfiliacionIVA="GEN" CodigoEstablecimiento="%s" CorreoEmisor="%s" NITEmisor="%s" 
                                NombreComercial="%s" NombreEmisor="%s">
                                <dte:DireccionEmisor>
                                    <dte:Direccion>%s</dte:Direccion>
                                    <dte:CodigoPostal>01010</dte:CodigoPostal>
                                    <dte:Municipio>Guatemala</dte:Municipio>
                                    <dte:Departamento>Guatemala</dte:Departamento>
                                    <dte:Pais>GT</dte:Pais>
                                </dte:DireccionEmisor>
                            </dte:Emisor>
                            <dte:Receptor %s IDReceptor="%s" NombreReceptor="%s">
                                <dte:DireccionReceptor>
                                    <dte:Direccion>%s</dte:Direccion>
                                    <dte:CodigoPostal>01001</dte:CodigoPostal>
                                    <dte:Municipio/>
                                    <dte:Departamento/>
                                    <dte:Pais>GT</dte:Pais>
                                </dte:DireccionReceptor>
                            </dte:Receptor>
                            %s
                            <dte:Items>""" % (
        arr_datos['UUID'],
        arr_datos['FechaHoraEmision'],
        arr_datos['Tipo'],
        arr_datos['CodigoEstablecimiento'],
        arr_datos['CorreoEmisor'],
        arr_datos['NITEmisor'],
        arr_datos['NombreComercial'],
        arr_datos['NombreEmisor'],
        arr_datos['DireccionEmisor'],
        str_tipo_especial,
        arr_datos['IDReceptor'],
        arr_datos['NombreReceptor'],
        arr_datos['Direccion'],
        str_frases,
    )

    for detalle in arr_datos['detalles']:
        str_xml += """\n<dte:Item BienOServicio="B" NumeroLinea="%s">
                                <dte:Cantidad>%s</dte:Cantidad>
                                <dte:UnidadMedida>%s</dte:UnidadMedida>
                                <dte:Descripcion>%s</dte:Descripcion>
                                <dte:PrecioUnitario>%s</dte:PrecioUnitario>
                                <dte:Precio>%s</dte:Precio>
                                <dte:Descuento>0.0000</dte:Descuento>
                                <dte:Impuestos>
                                    <dte:Impuesto>
                                        <dte:NombreCorto>IVA</dte:NombreCorto>
                                        <dte:CodigoUnidadGravable>1</dte:CodigoUnidadGravable>
                                        <dte:MontoGravable>%s</dte:MontoGravable>
                                        <dte:MontoImpuesto>%s</dte:MontoImpuesto>
                                    </dte:Impuesto>
                                </dte:Impuestos>
                                <dte:Total>%s</dte:Total>
                            </dte:Item>""" % (
            detalle['Linea'],
            detalle['Cantidad'],
            detalle['NoUnidad'],
            detalle['Descripcion'],
            "{:.4f}".format(detalle['VUnitario']),
            "{:.4f}".format(detalle['Total']),
            "{:.4f}".format(detalle['Total'] / Decimal(1.12)),
            "{:.4f}".format((detalle['Total'] / Decimal(1.12)) * Decimal(0.12)),
            "{:.4f}".format(detalle['Total']),
        )

    str_xml += """</dte:Items>
                            <dte:Totales>
                                <dte:TotalImpuestos>
                                    <dte:TotalImpuesto NombreCorto="IVA" TotalMontoImpuesto="%s"/>
                                </dte:TotalImpuestos>
                                <dte:GranTotal>%s</dte:GranTotal>
                            </dte:Totales>
                            <dte:Complementos>
                                %s
                            </dte:Complementos>
                        </dte:DatosEmision>
                    </dte:DTE>
                </dte:SAT>
            </dte:GTDocumento>]]></xml_dte>
        </FirmaDocumentoRequest>""" % (
        "{:.2f}".format((arr_datos['Total'] / Decimal(1.12)) * Decimal(0.12)),
        "{:.2f}".format(arr_datos['Total']),
        str_complemento
    )

    return str_xml


def process_anular_factura_electronica(int_invoice, int_user, arr_data_invoice, bool_anula_movimiento=True):
    # aquí ya tengo validado que no tenga saldo (lo hago desde su view)
    str_uuid = str(uuid.uuid4()).upper()
    arr_return = {
        'status': False,
        'message': 'No se pudo anular electrónicamente, contacta con soporte.',
    }
    if 'NoMovimientoEgreso' in arr_data_invoice:
        # tengo que traer la información del cliente y la empresa
        arr_invoice_data = get_invoice_to_null(invoice=int_invoice)

        if arr_invoice_data['status']:
            if not DEBUG:
                arr_cola = cola_facturacion.objects.filter(
                    tabla="facturas",
                    campo="nofactura",
                    valor_campo=arr_invoice_data['data']['factura_id'],
                ).first()

                if arr_cola:
                    if arr_cola.anulado:
                        arr_return['status'] = False
                        arr_return['message'] = "El documento ya esta anulado"
                        return arr_return
                    else:
                        id_cola = arr_cola.id
                else:
                    arr_cola = cola_facturacion.objects.create(
                        tabla="facturas",
                        campo="nofactura",
                        valor_campo=arr_invoice_data['data']['factura_id'],
                        firmado=False,
                    )
                    id_cola = arr_cola.id

                # creo el xml
                xml_to_signed = build_xml_document_firma_anular(str_uuid=str_uuid, data=arr_invoice_data['data'])
                # busco el token
                str_token = get_token(int_empresa=arr_invoice_data['data']['empresa_id'])
                # firmo el documento
                arr_firma = firmar_document_fel(str_token=str_token, str_xml=xml_to_signed, id_cola=id_cola,
                                                bool_anular=True)
                if arr_firma['status']:
                    str_xml_a_cancelar = build_xml_to_null(str_uuid=str_uuid, xml_cancel=arr_firma['xml_dte'])
                    arr_anulado = anular_documento_fel(str_token=str_token, xml_to_cancel=str_xml_a_cancelar,
                                                       id_cola=id_cola)
                    if arr_anulado['status']:
                        arr_null_local = anulate_invoice_local(int_user=int_user, arr_invoice_data=arr_invoice_data['data'],
                                                               bool_anula_movimiento=bool_anula_movimiento)
                        if arr_null_local['status']:
                            cola_anular = cola_facturacion.objects.get(id=id_cola)
                            cola_anular.anulado = True
                            cola_anular.save()
                            arr_return['status'] = True
                            arr_return['message'] = "Factura anulada correctamente."
                        else:
                            arr_return['message'] = f"""Ocurrió un problema al anular 
                                                        la factura localmente, {arr_null_local['message']}."""
                    else:
                        if 'message' in arr_anulado:
                            arr_return['message'] = f"Ocurrió un problema al anular con SAT, {arr_anulado['message']}."
                        else:
                            arr_return['message'] = """Ocurrió un problema al anular con SAT, Inesperado."""
                else:
                    if 'message' in arr_firma:
                        arr_return['message'] = """Ocurrió un problema en la firma 
                                                    para su anulación, %s.""" % arr_firma['message']
                    else:
                        arr_return['message'] = """Ocurrió un problema en la firma 
                                                    para su anulación, Inesperado."""
            else:
                arr_null_local = anulate_invoice_local(int_user=int_user, arr_invoice_data=arr_invoice_data['data'],
                                                       bool_anula_movimiento=bool_anula_movimiento)
                if arr_null_local['status']:
                    arr_return['status'] = True
                    arr_return['message'] = "Factura anulada correctamente."
                else:
                    arr_return['message'] = f"""Ocurrió un problema al anular 
                                                la factura localmente, {arr_null_local['message']}."""
        else:
            # arr_return['message'] = "No se encuentra la información del cliente o la empresa para anular."
            arr_return['message'] = arr_invoice_data['message']
    else:
        arr_return['message'] = "No se puede anular una factura que no encuentra el sistema."

    return arr_return


def anulate_invoice_local(int_user, arr_invoice_data, bool_anula_movimiento=True):
    arr_return = {
        "status": True,
        "msj": "Anulación exitosa",
        "msg": "Anulación exitosa",
        "message": "Anulación exitosa",
    }
    try:
        str_update_fel_documento = """UPDATE [ares]..[fel_documentos] SET [anulado] = 1 WHERE [id] = %s"""
        bool_fel_documento = execute_query(sql=str_update_fel_documento, params=(arr_invoice_data['fel_id'],))
        if bool_fel_documento:
            with transaction.atomic():
                # factura = Facturas.objects.get(nofactura=arr_invoice_data['factura_id'])
                # factura.noestado = 3
                # factura.anulado = True
                # factura.nomovimientoingreso = 0
                # factura.save()

                # factura_inventario = FacturasInventario.objects.get(nofactura=arr_invoice_data['factura_id'])
                factura_inventario = []
                factura_inventario.noestado = 3
                factura_inventario.anulado = True
                factura_inventario.nomovimientoingreso = 0
                factura_inventario.save()

            if bool_anula_movimiento:
                if not execute_query(sql="EXEC [Inventario]..[AnulaMovimiento] %s, %s, 'Anulación de factura', 0",
                                     params=(arr_invoice_data['NoMovimientoEgreso'], int_user)):
                    raise Exception("No se pudo correr el proceso de anulación, contacta con soporte")
    except ValueError as e:

    # except FacturasInventario.DoesNotExist:
        arr_return = {
            "status": False,
            "msj": "Factura no encontrada",
            "msg": "Factura no encontrada",
            "message": "Factura no encontrada",
        }

    # except Facturas.DoesNotExist:
    #     arr_return = {
    #         "status": False,
    #         "msj": "Factura no encontrada",
    #         "msg": "Factura no encontrada",
    #         "message": "Factura no encontrada",
    #     }

    except Exception as E:
        arr_return = {
            "status": False,
            "msj": f"Ocurrió un problema al actualizar el estado de la factura : <br> {str(E)}",
            "msg": f"Ocurrió un problema al actualizar el estado de la factura : <br> {str(E)}",
            "message": f"Ocurrió un problema al actualizar el estado de la factura : <br> {str(E)}",
        }

    return arr_return


def get_invoice_to_null(invoice):
    arr_return = {
        'status': False,
        'message': 'No se puede obtener la información de la factura',
        'data': {},
    }
    str_query = """
        SELECT [Facturas].[NoNit] AS nit_cliente, [Facturas].[NoFactura] AS factura_id,
            [Facturas].[NoMovimientoEgreso], [empresas].[id] AS empresa_id, [empresas].[nit] AS nit_empresa,
            [fel_documentos].[id] AS fel_id, [fel_documentos].[numero_autorizacion], [fel_documentos].[fecha_emision]
        FROM [Inventario]..[Facturas]
            JOIN [ares]..[fel_documentos] ON [Facturas].[NoFactura] = [fel_documentos].[inventario_documento_id] 
            JOIN [ares]..[empresa_database] ON [Facturas].NoEmpresa = [empresa_database].[codigo] AND database_id = 41
            JOIN [ares]..[empresas] ON [empresa_database].[empresa_id] = [empresas].[id]
        WHERE [Facturas].[NoFactura] = %s"""
    try:
        arr_response = get_query(str_sql=str_query, params=(invoice,))
        if len(arr_response) > 0:
            arr_return['status'] = True
            arr_return['message'] = "Datos obtenidos correctamente."
            arr_return['data'] = arr_response[0]
        else:
            arr_return['status'] = False
            arr_return['message'] = "No se encontró nada con respecto a esta factura"
    except ValueError:
        arr_return['message'] = "No se puede consultar la información de la factura antes de anularla"
    return arr_return


def build_xml_document_firma_anular(str_uuid, data):
    fecha_emision = str(data['fecha_emision'].replace(tzinfo=ZoneInfo("America/Guatemala"))).replace(' ', 'T')
    prev_date_now = datetime.datetime.now()
    fecha_actual = str(prev_date_now.replace(tzinfo=ZoneInfo("America/Guatemala"))).replace(' ', 'T')
    str_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
                <FirmaDocumentoRequest id="{str_uuid}">
                <xml_dte><![CDATA[<?xml version="1.0" encoding="utf-8"?>
                <ns:GTAnulacionDocumento xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
                xmlns:ns="http://www.sat.gob.gt/dte/fel/0.1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                Version="0.1">
                    <ns:SAT>
                        <ns:AnulacionDTE ID="DatosCertificados">
                        <ns:DatosGenerales ID="DatosAnulacion" NumeroDocumentoAAnular="{data['numero_autorizacion']}" 
                        NITEmisor="{data['nit_empresa']}" IDReceptor="{data['nit_cliente']}" 
                        FechaEmisionDocumentoAnular="{fecha_emision}" FechaHoraAnulacion="{fecha_actual}"
                         MotivoAnulacion="Anulación de factura" />
                        </ns:AnulacionDTE>
                    </ns:SAT>
                </ns:GTAnulacionDocumento>]]></xml_dte>
                </FirmaDocumentoRequest>"""
    return str_xml


def build_xml_to_null(str_uuid, xml_cancel):
    str_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
                <AnulaDocumentoXMLRequest id="{str_uuid}">
                    <xml_dte><![CDATA[{xml_cancel}]]></xml_dte>
                </AnulaDocumentoXMLRequest>"""
    return str_xml


def anular_documento_fel(str_token, xml_to_cancel, id_cola):
    cola_detalle = cola_facturacion_detalle.objects.create(
        cola_id=id_cola,
        paso=4,
        data_enviada=xml_to_cancel,
        fecha_envio=datetime.datetime.now(),
    )
    # busco el url para registrar
    arr_api_url = get_api_url('anularDocumentoXML')
    str_url = arr_api_url[0]['url'] if arr_api_url else ''
    # header del api con su token
    headers = {
        'Content-Type': 'text/xml;',
        'Authorization': 'Bearer %s' % str_token
    }
    # enviamos el xml a anular
    response = requests.post(str_url, headers=headers, data=xml_to_cancel.encode())
    cola_detalle.data_recibida = response.text
    cola_detalle.fecha_recibido = datetime.datetime.now()
    cola_detalle.save()

    if response.status_code == 200:
        str_xml = response.text
        arr_json = get_convert_json_response_xml(str_xml)

        if arr_json and 'AnulaDocumentoXMLResponse' in arr_json:
            if 'tipo_respuesta' in arr_json['AnulaDocumentoXMLResponse'] and \
                    int(arr_json['AnulaDocumentoXMLResponse']['tipo_respuesta']) == 1:
                if 'listado_errores' in arr_json['AnulaDocumentoXMLResponse']:
                    if 'error' in arr_json['AnulaDocumentoXMLResponse']['listado_errores']:
                        arr_errores_registro = arr_json['AnulaDocumentoXMLResponse']['listado_errores']
                        arr_errores = get_errores(arr_errores_registro)
                        return {
                            "status": False,
                            "message": "Error: Documento no firmado, %s, comuníquese con IT" % arr_errores['message']
                        }
            elif 'tipo_respuesta' in arr_json['AnulaDocumentoXMLResponse'] and \
                    int(arr_json['AnulaDocumentoXMLResponse']['tipo_respuesta']) == 0:
                return {
                    "status": True,
                    "message": "Documento anulado correctamente."
                }

        if not DEBUG:
            str_subject = 'Revisión de anulación FEL'
            send_email(str_subject=str_subject, str_body=f'Caso no contemplado de anulación: id_cola={id_cola}',
                       bool_send=False)
        return {
            "status": True,
            "message": "Documento anulado correctamente."
        }
    elif response.status_code == 406:
        str_xml = response.text
        return {
            "status": False,
            "message": str_xml,
        }
    else:
        return {
            "status": False,
            "message": "No se obtuvo respuesta de Megaprint en la anulacion"
        }
