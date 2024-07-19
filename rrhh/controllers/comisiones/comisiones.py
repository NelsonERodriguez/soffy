import json
from io import BytesIO

from django.core.files.storage import FileSystemStorage
from django.db.models import Value
from django.db.models.functions import Concat
from xhtml2pdf import pisa

from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect
from django.template.loader import get_template
from django.contrib.auth.decorators import login_required

from core.functions import set_notification, get_query, execute_query, insert_query
from datetime import date, datetime
from rrhh.models import Comision_Regla, Comision_Regla_Rangos, Comision_respaldo_modificacion
from ventas.models import Orden_compra_detalle_sv
from soffybiz.settings import ADJUNTOS_COMISIONES_REQUERIDO
from soffybiz.debug import DEBUG, IMAGEN_GB
from django.core.mail import EmailMessage

arr_meses = [{'id': 1, 'mes': 'Enero'},
             {'id': 2, 'mes': 'Febrero'},
             {'id': 3, 'mes': 'Marzo'},
             {'id': 4, 'mes': 'Abril'},
             {'id': 5, 'mes': 'Mayo'},
             {'id': 6, 'mes': 'Junio'},
             {'id': 7, 'mes': 'Julio'},
             {'id': 8, 'mes': 'Agosto'},
             {'id': 9, 'mes': 'Septiembre'},
             {'id': 10, 'mes': 'Octubre'},
             {'id': 11, 'mes': 'Noviembre'},
             {'id': 12, 'mes': 'Diciembre'}]


@login_required(login_url="/login/")
def index(request):
    obj_hoy = date.today()
    int_mes_actual = obj_hoy.month
    int_anio_actual = obj_hoy.year
    int_vendedor = ""

    arr_anio = [int_anio_actual-2, int_anio_actual-1, int_anio_actual, int_anio_actual+1, int_anio_actual+2]

    str_query = """
        SELECT DISTINCT no_vendedor, nombre_vendedor
        FROM NOVA..rrhh_comision_datos
        WHERE no_vendedor NOT IN (86,90)
        ORDER BY nombre_vendedor
    """
    obj_vendedores = get_query(str_query)

    arr_comisiones = []

    bool_cerrado = True

    sin_total_comision = 0
    sin_total_abono = 0
    sin_total_cajas = 0
    sin_total_supervision = 0
    bool_mayoristas = False
    bool_cerrado_sv = False

    obj_resumen = []
    obj_id_vendedores_dos = {}

    if request.method == 'POST':
        int_mes_post = request.POST.get('sltMes')
        int_anio_post = request.POST.get('sltAnio')
        int_vendedor = request.POST.get('sltVendedor')
        str_mayoristas = request.POST.get('chkMayoristas', None)
        bool_mayoristas = True if str_mayoristas else False
        int_mes_actual = int(int_mes_post)
        int_anio_actual = int(int_anio_post)

        str_filter_vendedor = ""
        str_filter_mayoristas = "and no_vendedor NOT IN (86,90)"

        if bool_mayoristas:
            str_filter_mayoristas = ""

        if int_vendedor and len(int_vendedor) > 0:
            str_filter_vendedor = "and no_vendedor = " + int_vendedor
            int_vendedor = int(int_vendedor)
            str_filter_mayoristas = ""

        str_filter_cerradas = "and cerrado = 1"
        if request.user.has_perm('rrhh.rrhh_comisiones_ver_todas'):
            str_filter_cerradas = ""

        # SE QUITO VENTAS MAYORISTAS 2 Y 3 POR SOLICITUD DE PEDRO
        str_query = f"""
            select top 1 *
            from NOVA..rrhh_comision_datos
            where mes = {int_mes_post} and año = {int_anio_post}
            {str_filter_mayoristas}
            {str_filter_vendedor}
            {str_filter_cerradas}
            order by cerrado desc
        """

        arr_comisiones = get_query(str_query)

        if arr_comisiones:
            if not arr_comisiones[0]["cerrado"]:
                bool_cerrado = False

        obj_id_vendedores = []

        obj_cerrados = Orden_compra_detalle_sv.objects.filter(
            orden_compra_sv__deleted_at__isnull=True, orden_compra_sv__fecha__year=int_anio_actual,
            orden_compra_sv__fecha__month=int_mes_actual, cerrado=True).first()

        bool_cerrado_sv = True if obj_cerrados else False

    data = {
        "meses": arr_meses,
        "anios": arr_anio,
        "vendedores": obj_vendedores,
        "mes_selected": int_mes_actual,
        "anio_selected": int_anio_actual,
        "vendedor_selected": int_vendedor,
        "comisiones": arr_comisiones,
        "bool_cerrado": bool_cerrado,
        "bool_adjuntos_requeridos": ADJUNTOS_COMISIONES_REQUERIDO,
        "bool_mayoristas": bool_mayoristas,
        "bool_cerrado_sv": bool_cerrado_sv,
    }

    return render(request, 'comisiones/comisiones.html', data)


def evaluar_niveles_regla(obj_regla, comision, bool_encontro, sin_comision):
    obj_regla_especifico = obj_regla.filter(no_vendedor=comision["CodVendedor"],
                                            no_cliente=comision["NoCliente"]).first()

    data = {
        "bool_encontro": False,
        "sin_comision": 0,
        "es_porcentaje": False,
        "cajas": "",
        "sin_calculo": "",
    }

    if obj_regla_especifico:
        obj_calculo = calcular_comision(comision, obj_regla_especifico)
        data = obj_calculo
        data["bool_encontro"] = True
    else:
        obj_regla_vendedor = obj_regla.filter(no_vendedor=comision["CodVendedor"], no_cliente=None).first()
        if obj_regla_vendedor:
            obj_calculo = calcular_comision(comision, obj_regla_vendedor)
            data = obj_calculo
            data["bool_encontro"] = True
        else:
            obj_regla_cliente = obj_regla.filter(no_vendedor=None, no_cliente=comision["NoCliente"]).first()
            if obj_regla_cliente:
                obj_calculo = calcular_comision(comision, obj_regla_cliente)
                data = obj_calculo
                data["bool_encontro"] = True
            else:
                obj_regla_general = obj_regla.filter(no_vendedor=None, no_cliente=None).first()
                if obj_regla_general:
                    obj_calculo = calcular_comision(comision, obj_regla_general)
                    data = obj_calculo
                    data["bool_encontro"] = True
    return data


def calcular_comision(obj_comision, obj_regla):
    sin_comision = 0
    dias = obj_comision["Dias"]

    data_return = {
        "sin_comision": sin_comision,
        "es_porcentaje": False,
        "cajas": "",
        "sin_calculo": "",
    }

    obj_rango = Comision_Regla_Rangos.objects.filter(regla_id=obj_regla.id, inicio_rango_dias__lte=dias,
                                                     fin_rango_dias__gte=dias, activo=True).first()

    if obj_regla.es_porcentaje:
        data_return["es_porcentaje"] = True

        if obj_rango:
            data_return["sin_calculo"] = obj_rango.comision
            sin_comision = round(obj_comision["AbonoPrd"] * (obj_rango.comision / 100), 2)
        else:
            data_return["sin_calculo"] = obj_regla.comision_fuera_rango
            sin_comision = round(obj_comision["AbonoPrd"] * (obj_regla.comision_fuera_rango / 100), 2)
    else:
        int_cantidad = obj_comision["Cajas"] if obj_comision["TotalPrd"] == obj_comision["AbonoPrd"] \
            else round((obj_comision["AbonoPrd"] * obj_comision["Cajas"]) / obj_comision["TotalPrd"], 2)
        data_return["cajas"] = int_cantidad
        if obj_rango:
            data_return["sin_calculo"] = obj_rango.comision
            sin_comision = round(int_cantidad * obj_rango.comision, 2)
        else:
            data_return["sin_calculo"] = obj_regla.comision_fuera_rango
            sin_comision = round(int_cantidad * obj_regla.comision_fuera_rango, 2)

    data_return["sin_comision"] = sin_comision

    return data_return


@login_required(login_url="/login/")
def guardar_campo(request):
    str_nombre = request.POST.get("campo")
    fil_archivo = request.FILES.get("filArchivo")
    str_val = request.POST.get("valor")
    sin_val = float(request.POST.get("valor"))
    str_val = request.POST.get("valor")
    str_observacion = request.POST.get("observacion")

    str_usuario = request.user.nickname

    arr_nombre = str_nombre.split("_")
    int_id = str(arr_nombre[1])

    str_query = """
        SELECT abono_producto, cajas_abonadas, comision_es_porcentaje, comision_pagada
        FROM NOVA..rrhh_comision_datos
        WHERE id = %s
    """ % int_id
    obj_comision = get_query(str_query)

    if obj_comision:
        if obj_comision[0]["comision_es_porcentaje"]:
            # sin_comision_nueva = sin_val * (float(obj_comision[0]["abono_producto"])
            #                                 - float(obj_comision[0]["descuento_total"]))
            sin_comision_nueva = (sin_val / 100) * float(obj_comision[0]["abono_producto"])
        else:
            sin_comision_nueva = sin_val * float(obj_comision[0]["cajas_abonadas"])
        sin_comision_nueva = round(sin_comision_nueva, 2)
    else:
        return JsonResponse({"status": False, "msj": 'Error actualizando la comisión seleccionada.'}, safe=False)

    if fil_archivo:
        url = 'media/respaldo_comisiones/'
        fs = FileSystemStorage(location=url)
        file = fs.save(fil_archivo.name, fil_archivo)
        path_file = url + file

        obj_respaldo = Comision_respaldo_modificacion.objects.create(
            id_comision_datos=int(int_id),
            archivo_respaldo=path_file,
        )

    sin_comision_pagada_original = obj_comision[0]["comision_pagada"]

    str_set = """
        valor_comision_efectiva = %s,
        comision_pagada = %s,
        usuario = '%s',
        observaciones = '%s',
        modificado = 1
    """ % (str_val, sin_comision_nueva, str_usuario, str_observacion)

    if len(str_set) > 0:
        str_query = """
            UPDATE NOVA..rrhh_comision_datos
            SET %s
            WHERE id = %s
        """ % (str_set, int_id)
        execute_query(str_query)
    else:
        return JsonResponse({"status": False, "msj": 'Error actualizando la comisión.'}, safe=False)

    str_query = """
            SELECT cast(valor_comision_efectiva as float) AS 'afectiva_float', comision_pagada
            FROM NOVA..rrhh_comision_datos
            WHERE id = %s
        """ % int_id
    obj_comision = get_query(str_query)

    return JsonResponse({"status": True,
                         "msj": 'Se actualizó la comisión exitosamente.',
                         'sin_val': obj_comision[0]["afectiva_float"],
                         'sin_comision_nueva': obj_comision[0]["comision_pagada"],
                         'sin_comision_pagada_original': sin_comision_pagada_original,
                         'int_id': int_id}, safe=False)


@login_required(login_url="/login/")
def cerrar(request):

    int_mes_post = request.POST.get('sltMes')
    int_anio_post = request.POST.get('sltAnio')

    str_query = """
                UPDATE NOVA..rrhh_comision_datos
                SET cerrado = 1
                where mes = %s
                and año = %s
                and cerrado = 0
        """ % (int_mes_post, int_anio_post)
    execute_query(str_query)

    set_notification(request, True, "Comisiones cerradas exitosamente.", "add_alert", "success")

    if not DEBUG:
        filtro = filter(lambda x: x['id'] == int(int_mes_post), arr_meses)
        resultado = next(filtro, None)

        str_html = """
            <table style="width: 100%%;">
                <tbody>
                    <tr>
                        <td width="10%%">&nbsp;</td>
                        <td width="80%%">
                            <table style="width: 100%%; border: 1px solid #dddddd; border-radius: 3px;">
                                <tbody>
                                    <tr>
                                        <td style="background: #333333; color: white; text-align:center;">
                                            <h2>Notificación de Comisiones de Vendedores Cerradas.</h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center; padding: 20px;">
                                            Se le informa que las comisiones de vendedores se han
                                            cerrado para el mes de %s del año %s.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                        <td width="10%%">&nbsp;</td>
                    </tr>
                </tbody>
            </table>
        """ % (resultado["mes"], int_anio_post)

        arr_correos = [
            "nrodriguez@grupobuena.com",
        ]

        msg = EmailMessage("Comisiones de Vendedores Cerradas", str_html, 'nrodriguez@grupobuena.com', arr_correos)
        msg.content_subtype = "html"
        msg.send()

    return redirect("rrhh-comisiones")


@login_required(login_url="/login/")
def solicitud(request):
    int_mes_post = request.POST.get('sltMes')
    int_anio_post = request.POST.get('sltAnio')
    int_mes = int(int_mes_post)
    str_mes = ""
    bool_solicitudes = True
    obj_hoy = datetime.today()
    str_hoy_esp = obj_hoy.strftime('%d/%m/%Y')
    str_hoy_en = obj_hoy.strftime('%Y-%m-%d')
    str_solicitante = request.user.get_full_name()

    str_query = """
        SELECT count(*) as 'cantidad'
        FROM Contabilidad..SolCONTAEncabezado
        WHERE MONTH(Fecha) = %s
        AND YEAR(Fecha) = %s
        AND Descripcion like 'Pago de comisiones sobre cobros correspondientes al mes de%%'
    """ % (int_mes_post, int_anio_post)
    obj_cantidad = get_query(str_query)

    if obj_cantidad:
        if obj_cantidad[0]["cantidad"] > 0:
            bool_solicitudes = False

    for mes in arr_meses:
        if int_mes == int(mes["id"]):
            str_mes = mes["mes"]

    str_descripcion = 'Pago de comisiones sobre cobros correspondientes al mes de '+str_mes+' '+int_anio_post+'.'

    obj_totales = []

    str_query = """
        SELECT CodigoEmpresa, CodigoCuenta, NumCuentaEnBanco, Descripcion
        FROM Contabilidad..CuentasBancos
    """
    obj_bancos = get_query(str_query)
    arr_bancos = []
    obj_cuenta = []
    obj_banco = []
    int_banco_id = 0
    int_banco_actual = 0
    intContador = 0

    for banco in obj_bancos:
        intContador += 1
        int_banco_id = banco['CodigoEmpresa']
        if int_banco_id != int_banco_actual:
            int_banco_actual = int_banco_id
            if obj_cuenta:
                if len(obj_banco["cuentas"]) % 3 == 2:
                    obj_cuenta = {
                        "NumCuentaEnBanco": "",
                        "Descripcion": "",
                        "bool_fin": True,
                        "bool_inicio": False,
                    }
                    obj_banco["cuentas"].append(obj_cuenta)
                elif len(obj_banco["cuentas"]) % 3 == 1:
                    obj_cuenta = {
                        "NumCuentaEnBanco": "",
                        "Descripcion": "",
                        "bool_fin": False,
                        "bool_inicio": False,
                    }
                    obj_banco["cuentas"].append(obj_cuenta)
                    obj_cuenta = {
                        "NumCuentaEnBanco": "",
                        "Descripcion": "",
                        "bool_fin": True,
                        "bool_inicio": False,
                    }
                    obj_banco["cuentas"].append(obj_cuenta)

                arr_bancos.append(obj_banco)

            obj_banco = {
                "id_empresa": banco["CodigoEmpresa"],
                "cuentas": []
            }

            intContador = 1

        obj_cuenta = {
            "NumCuentaEnBanco": banco["NumCuentaEnBanco"],
            "Descripcion": banco["Descripcion"],
            "bool_fin": ((intContador % 3) == 0),
            "bool_inicio": ((intContador - 1) % 3) == 0,
        }

        obj_banco["cuentas"].append(obj_cuenta)

    if obj_cuenta:
        arr_bancos.append(obj_banco)

    if bool_solicitudes:
        #SE QUITO VENTAS MAYORISTAS 2 Y 3 POR SOLICITUD DE PEDRO
        str_query = """
            SELECT SUM(RCD.comision_pagada) as 'comision', RCD.no_vendedor, RCD.nombre_vendedor,
            A.CodigoArea, A.DescripcionArea, E.CodigoEmpresa, E.NombreEmpresa, RCVD.nombre_personalizado
            FROM NOVA..rrhh_comision_datos as RCD
                LEFT JOIN NOVA..rrhh_comision_vendedor_datos as RCVD ON RCD.no_vendedor = RCVD.no_vendedor
                LEFT JOIN Contabilidad..Areas AS A ON A.CodigoArea = RCVD.no_area
                LEFT JOIN Contabilidad..Empresas AS E ON E.CodigoEmpresa = RCVD.codigo_empresa
            WHERE RCD.mes = %s
            AND RCD.año = %s
            AND RCD.no_vendedor NOT IN (86,90)
            GROUP BY RCD.no_vendedor, RCD.nombre_vendedor, A.CodigoArea,
            A.DescripcionArea, E.CodigoEmpresa, E.NombreEmpresa, RCVD.nombre_personalizado
            ORDER BY RCD.no_vendedor
        """ % (int_mes_post, int_anio_post)

        obj_query = get_query(str_query)

        for comision in obj_query:
            if comision["comision"] > 30000:
                sin_isr = round((30000 * 0.05) + ((float(comision["comision"]) - 30000) * 0.07), 2)
            else:
                sin_isr = round(float(comision["comision"]) * 0.05, 2)

            comision["isr"] = sin_isr
            comision["iva"] = round(float(comision["comision"]) * 0.12, 2)
            comision["total"] = round(float(comision["comision"]) - float(comision["isr"])
                                      + float(comision["iva"]), 2)
            comision["haber_banco"] = comision["total"]
            str_nombre_insert = comision["nombre_personalizado"] if comision["nombre_personalizado"]\
                else comision["nombre_vendedor"]

            int_no_solicitud = 0
            str_query = """
                SELECT MAX(NumSolicitud) AS no_solicitud
                FROM Contabilidad..SolCONTAEncabezado
                where codigoempresa = %s
            """ % comision["CodigoEmpresa"]
            obj_correlativo = get_query(str_query)
            if obj_correlativo:
                if obj_correlativo[0]["no_solicitud"]:
                    int_no_solicitud = obj_correlativo[0]["no_solicitud"]
            int_no_solicitud = int_no_solicitud + 1

            comision["no_solicitud"] = int_no_solicitud

            str_query = """
                INSERT INTO Contabilidad..SolCONTAEncabezado
                VALUES (%s,%s,'%s',getdate(),'%s','%s','%s','T','%s',NULL)
            """ % (comision["CodigoEmpresa"], str(int_no_solicitud), str_hoy_en, comision['total'],
                   str_nombre_insert, str_descripcion, str_solicitante)

            #print("\n\n", str_query, "\n\n")
            execute_query(str_query)

            str_query = """
                INSERT INTO Contabilidad..SolCONTADetalleConta
                VALUES
                (%s,%s,1,'Bancos',999,'%s','H', NULL, %s),
                (%s,%s,2,'2120102',999,'%s','D', NULL, %s),
                (%s,%s,3,'1120301',999,'%s','D', NULL, %s),
                (%s,%s,4,'2130103',999,'%s','H', NULL, %s)
            """ % (comision["CodigoEmpresa"], str(int_no_solicitud), comision['haber_banco'], comision['CodigoArea'],
                   comision["CodigoEmpresa"], str(int_no_solicitud), comision['comision'], comision['CodigoArea'],
                   comision["CodigoEmpresa"], str(int_no_solicitud), comision['iva'], comision['CodigoArea'],
                   comision["CodigoEmpresa"], str(int_no_solicitud), comision['isr'], comision['CodigoArea'])

            #print("\n\n", str_query, "\n\n")
            execute_query(str_query)

            obj_solicitud = {
                "comision": comision["comision"],
                "isr": comision["isr"],
                "iva": comision["iva"],
                "total": comision["total"],
                "haber_banco": comision["haber_banco"],
                "codigoempresa": comision["CodigoEmpresa"],
                "NumSolicitud": str(int_no_solicitud),
                "Fecha": str_hoy_esp,
                "valorCheque": comision['total'],
                "GiradoA": str_nombre_insert,
                "Descripcion": str_descripcion,
                "UsuarioGrabo": str_solicitante,
                "Detalle": []
            }

            obj_linea = {
                "CorrelativoLinea": 1,
                "cuenta": 'Bancos',
                "CuentaPresupuesto": 999,
                "valor": comision['haber_banco'],
                "debitoCredito": 'H',
                "codigoArea": comision['CodigoArea'],
            }
            obj_solicitud["Detalle"].append(obj_linea)

            obj_linea = {
                "CorrelativoLinea": 2,
                "cuenta": '2120102',
                "CuentaPresupuesto": 999,
                "valor": comision['comision'],
                "debitoCredito": 'D',
                "codigoArea": comision['CodigoArea'],
            }
            obj_solicitud["Detalle"].append(obj_linea)

            obj_linea = {
                "CorrelativoLinea": 3,
                "cuenta": '1120301',
                "CuentaPresupuesto": 999,
                "valor": comision['iva'],
                "debitoCredito": 'D',
                "codigoArea": comision['CodigoArea'],
            }
            obj_solicitud["Detalle"].append(obj_linea)

            obj_linea = {
                "CorrelativoLinea": 4,
                "cuenta": '2130103',
                "CuentaPresupuesto": 999,
                "valor": comision['isr'],
                "debitoCredito": 'H',
                "codigoArea": comision['CodigoArea'],
            }
            obj_solicitud["Detalle"].append(obj_linea)

            obj_linea = {
                "CorrelativoLinea": 5,
                "cuenta": '',
                "CuentaPresupuesto": '',
                "valor": '',
                "debitoCredito": '',
                "codigoArea": '',
            }
            obj_solicitud["Detalle"].append(obj_linea)

            obj_solicitud["suma_d"] = round(float(comision['comision']) + float(comision['iva']), 2)
            obj_solicitud["suma_h"] = round(float(comision['haber_banco']) + float(comision['isr']), 2)

            obj_totales.append(obj_solicitud)
    else:
        str_query = """
                SELECT SCE.*, SCC.*
                FROM Contabilidad..SolCONTAEncabezado AS SCE
                    INNER JOIN Contabilidad..SolCONTADetalleConta AS SCC
                        ON SCE.codigoempresa = SCC.CodigoEmpresa
                        AND SCE.NumSolicitud = SCC.NumSolicitud
                WHERE MONTH(SCE.Fecha) = %s
                AND YEAR(SCE.Fecha) = %s
                AND SCE.Descripcion like 'Pago de comisiones sobre cobros correspondientes al mes de%%'
                ORDER BY SCE.codigoempresa, SCE.NumSolicitud, SCC.CorrelativoLinea
            """ % (int_mes_post, int_anio_post)
        obj_solicitudes = get_query(str_query)

        str_correlativo_actual = ""
        str_correlativo = ""

        obj_solicitud = None
        obj_linea = []

        for solicitud in obj_solicitudes:
            #prueba
            str_correlativo = str(solicitud['codigoempresa']) + "_" + str(solicitud['NumSolicitud'])
            if str_correlativo_actual != str_correlativo:
                str_correlativo_actual = str_correlativo
                if obj_solicitud:
                    if len(obj_solicitud["Detalle"]) == 4:
                        obj_linea = {
                            "CorrelativoLinea": 5,
                            "cuenta": '',
                            "CuentaPresupuesto": '',
                            "valor": '',
                            "debitoCredito": '',
                            "codigoArea": '',
                        }

                        obj_solicitud["Detalle"].append(obj_linea)
                    obj_totales.append(obj_solicitud)

                obj_solicitud = {}

                obj_solicitud = {
                    "codigoempresa": solicitud["codigoempresa"],
                    "NumSolicitud": solicitud["NumSolicitud"],
                    "Fecha": solicitud["Fecha"].strftime('%d/%m/%Y'),
                    "valorCheque": solicitud["valorCheque"],
                    "GiradoA": solicitud["GiradoA"],
                    "Descripcion": solicitud["Descripcion"],
                    "UsuarioGrabo": solicitud["UsuarioGrabo"],
                    "suma_d": 0,
                    "suma_h": 0,
                    "Detalle": []
                }

            obj_linea = {
                "CorrelativoLinea": solicitud["CorrelativoLinea"],
                "cuenta": solicitud["cuenta"],
                "CuentaPresupuesto": solicitud["CuentaPresupuesto"],
                "valor": solicitud["valor"],
                "debitoCredito": solicitud["debitoCredito"],
                "codigoArea": solicitud["codigoArea"],
            }

            if solicitud["debitoCredito"] == "D":
                obj_solicitud["suma_d"] += solicitud["valor"]
            elif solicitud["debitoCredito"] == "H":
                obj_solicitud["suma_h"] += solicitud["valor"]

            if solicitud["CorrelativoLinea"] == 2:
                obj_solicitud['comision'] = solicitud["valor"]
            elif solicitud["CorrelativoLinea"] == 3:
                obj_solicitud['iva'] = solicitud["valor"]
            elif solicitud["CorrelativoLinea"] == 4:
                obj_solicitud['isr'] = solicitud["valor"]
                #obj_solicitud['comision'] = obj_solicitud['haber_banco'] + obj_solicitud['iva'] - obj_solicitud['isr']
                obj_solicitud['total'] = obj_solicitud['comision'] + obj_solicitud['iva'] - obj_solicitud['isr']

            obj_solicitud["Detalle"].append(obj_linea)

        if obj_solicitud:
            obj_totales.append(obj_solicitud)

    data = {
        "totales": obj_totales,
        "solicitante": str_solicitante,
        "mes": str_mes,
        "anio": int_anio_post,
        "fecha_hoy": str_hoy_esp,
        "descripcion": str_descripcion,
        "bancos": arr_bancos,
    }

    #return render(request, 'comisiones/comisiones-solicitud.html', data)

    pdf = render_to_pdf('comisiones/comisiones-solicitud.html', data)
    return HttpResponse(pdf, content_type='application/pdf')


def render_to_pdf(template_src, context_dict=None):
    if context_dict is None:
        context_dict = {}
    template = get_template(template_src)
    html = template.render(context_dict)
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    if not pdf.err:
        return HttpResponse(result.getvalue(), content_type='application/pdf')
    return None


@login_required(login_url="/login/")
def data_comisiones(request):
    sin_total_comision = 0
    sin_total_abono = 0
    sin_total_cajas = 0

    int_mes_post = request.POST.get('sltMes')
    int_anio_post = request.POST.get('sltAnio')
    int_vendedor = request.POST.get('sltVendedor')
    str_mayoristas = request.POST.get('chkMayoristas', None)
    bool_mayoristas = True if str_mayoristas else False

    str_filter_vendedor = ""
    str_filter_mayoristas = "and no_vendedor NOT IN (86,90)"

    if bool_mayoristas:
        str_filter_mayoristas = ""

    if int_vendedor and len(int_vendedor) > 0:
        str_filter_vendedor = "and rcd.no_vendedor = " + int_vendedor
        str_filter_mayoristas = ""

    str_filter_cerradas = "and rcd.cerrado = 1"
    if request.user.has_perm('rrhh.rrhh_comisiones_ver_todas'):
        str_filter_cerradas = ""

    # SE QUITO VENTAS MAYORISTAS 2 Y 3 POR SOLICITUD DE PEDRO
    str_query = f"""
        select rcd.*, ref.*,
        cast(rcd.valor_comision_efectiva as float) as 'afectiva_float'
        from NOVA..rrhh_comision_datos as rcd
            left join Inventario..Refacturaciones as ref
            on ref.NoFacturaActual = rcd.no_factura
        where rcd.mes = {int_mes_post} and rcd.año = {int_anio_post}
        {str_filter_mayoristas}
        {str_filter_vendedor}
        {str_filter_cerradas}
    """

    arr_comisiones = get_query(str_query)

    for row in arr_comisiones:
        sin_total_comision += float(row["comision_pagada"])
        sin_total_abono += float(row["abono_producto"])
        sin_total_cajas += float(row["cajas_abonadas"])

    data = {
        "status": True,
        "msj": 'Se obtuvieron los datos de comisiones exitosamente.',
        'comisiones': arr_comisiones,
        'total_comision': sin_total_comision,
        'total_abono': sin_total_abono,
        'total_cajas': sin_total_cajas,
    }

    if not arr_comisiones:
        data["status"] = False
        data["msj"] = "No se encontraron datos de comisiones, o no se ha cerrado el mes."

    #return render(request, 'comisiones/comisiones.html', data)
    #clientes de contado
    # en teoria no debe de  tener comision despues de los 6 dias
    # actualmente no se esta detectando
    # cliente: la conejita / tiene 3 dias
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def resumen_vendedores(request):
    int_mes_post = request.POST.get('sltMes')
    int_anio_post = request.POST.get('sltAnio')
    int_vendedor = request.POST.get('sltVendedor')
    str_mayoristas = request.POST.get('chkMayoristas', None)
    bool_mayoristas = True if str_mayoristas else False

    str_filter_vendedor = ""
    str_filter_mayoristas = "and no_vendedor NOT IN (86,90)"

    if bool_mayoristas:
        str_filter_mayoristas = ""

    if int_vendedor and len(int_vendedor) > 0:
        str_filter_vendedor = "and no_vendedor = " + int_vendedor
        str_filter_mayoristas = ""

    # SE QUITO VENTAS MAYORISTAS 2 Y 3 POR SOLICITUD DE PEDRO
    #funcion para consultar los
    str_query = f"""
            select no_vendedor, nombre_vendedor, sum(comision_pagada) as 'total_comision',
                sum(abono_producto) as 'total_abono', sum(cajas_abonadas) as 'total_cajas',
                round(sum(comision_pagada) * 0.12,2) as 'IVA',
                case when sum(comision_pagada) >= 2500
                    then round((sum(comision_pagada) * 0.12)*0.15,2)
                    else 0
                end as 'Reten_IVA',
                case when sum(comision_pagada) >= 2500
                    then round(case when sum(comision_pagada) <= 30000
                                   then sum(comision_pagada) * 0.05
                                   else ((sum(comision_pagada) - 30000) * 0.07) + 1500 end,2)
                    else 0
                end as 'ISR',
                sum(comision_pagada)
                    +
                round(sum(comision_pagada) * 0.12,2)
                    -
                case when sum(comision_pagada) > 2500 then round((sum(comision_pagada) * 0.12)*0.15,2) else 0 end
                    -
                case when sum(comision_pagada) > 2500
                    then round(case when sum(comision_pagada) <= 30000
                               then sum(comision_pagada) * 0.05
                               else ((sum(comision_pagada) - 30000) * 0.07) + 1500 end,2)
                else 0 end
                as 'Neto_a_pagar'
            from NOVA..rrhh_comision_datos
            where mes = {int_mes_post} and año = {int_anio_post}
            {str_filter_mayoristas}
            {str_filter_vendedor}
            group by no_vendedor, nombre_vendedor
            order by no_vendedor
        """

    arr_resumen = get_query(str_query)

    return JsonResponse({"status": True,
                         "msj": 'Se obtuvieron los datos de comisiones exitosamente.',
                         'resumen': arr_resumen},
                        safe=False)


@login_required(login_url="/login/")
def data_refacturacion(request):
    int_no_factura = request.POST.get('intNoFactura')

    str_query = """
        select f.Serie, f.NoDocumento, cast(f.Fecha as date) as Fecha, f.Total, f.Observaciones,
            rf.NombreAnterior, rf.Observaciones as 'ObservacionesN'
        from Inventario..Facturas as f
            inner join Inventario..Refacturaciones as rf on f.NoFactura = rf.NoFacturaAnterior 
        where NoFactura = %s
    """ % int_no_factura

    arr_resumen = get_query(str_query)
    data = arr_resumen[0] if arr_resumen else {}

    return JsonResponse({"status": True,
                         "msj": 'Se obtuvieron los datos de la refacturación exitosamente.',
                         'data': data},
                        safe=False)


@login_required(login_url="/login/")
def listado_salvador(request):
    int_mes_post = request.POST.get('sltMes')
    int_anio_post = request.POST.get('sltAnio')

    obj_cerrados = Orden_compra_detalle_sv.objects.filter(
        orden_compra_sv__deleted_at__isnull=True, orden_compra_sv__fecha__year=int_anio_post,
             orden_compra_sv__fecha__month=int_mes_post, cerrado=True).first()

    bool_cerrada = True if obj_cerrados else False

    obj_data = Orden_compra_detalle_sv.objects.annotate(
        producto=Concat('producto_sv__codigo_producto', Value(' - '), 'producto_sv__producto'),
        esta_cerrada=Value(bool_cerrada)
    ).filter(orden_compra_sv__deleted_at__isnull=True, orden_compra_sv__fecha__year=int_anio_post,
             orden_compra_sv__fecha__month=int_mes_post).values(
        'orden_compra_sv__id', 'orden_compra_sv__fecha', 'orden_compra_sv__total',
        'orden_compra_sv__cliente_sv__cliente', 'producto', 'total', 'id', 'esta_cerrada',
        'porcentaje_comision', 'valor_comision_dolar', 'valor_comision_quetzal'
    )

    arr_response = {
        "data": list(obj_data),
        "msj": "Se muestran las órdenes de compra registradas en el sistema.",
        "status": True
    }

    return JsonResponse(data=arr_response, safe=False)


@login_required(login_url="/login/")
def cambiar_porcentaje(request):
    int_id = request.POST.get("id")
    fil_archivo = request.FILES.get("filArchivo")
    str_val = request.POST.get("valor")
    sin_val = float(str_val)
    str_observacion = request.POST.get("txtObservacion")

    obj_detail = Orden_compra_detalle_sv.objects.get(id=int(int_id))

    if obj_detail:
        if fil_archivo:
            url = 'media/respaldo_comisiones/'
            fs = FileSystemStorage(location=url)
            file = fs.save(fil_archivo.name, fil_archivo)
            path_file = url + file

            obj_detail.path_respaldo = path_file

        obj_detail.porcentaje_comision = sin_val
        obj_detail.observacion = str_observacion

        obj_detail.save()

        return JsonResponse({"status": True,
                             "msj": 'Se actualizó la comisión exitosamente.',
                             'porcentaje_comision': obj_detail.porcentaje_comision,
                             'total': obj_detail.total}, safe=False)

    return JsonResponse({"status": False,
                         "msj": 'No se pudo actualizar la comisión.',
                         'porcentaje_comision': None,
                         'total': None}, safe=False)


@login_required(login_url="/login/")
def cerrar_salvador(request):
    obj_request = json.loads(request.body)

    obj_detalles = Orden_compra_detalle_sv.objects

    if len(obj_request) > 0:

        sin_tipo_cambio = float(obj_request["sinTipoCambio"])
        int_mes_post = obj_request["sltMes"]
        int_anio_post = obj_request["sltAnio"]

        for row in obj_request["comisiones"]:
            obj_detail = Orden_compra_detalle_sv.objects.get(id=int(row["id"]))
            porcentaje = float(obj_detail.porcentaje_comision) if obj_detail.porcentaje_comision is not None else 1
            total = float(obj_detail.total)
            valor_comision_dolar = round((porcentaje) / 100 * (total), 2)
            valor_comision_quetzal = round((porcentaje) / 100 * (total) * sin_tipo_cambio, 2)

            obj_detail.valor_comision_dolar = valor_comision_dolar
            obj_detail.valor_comision_quetzal = valor_comision_quetzal
            obj_detail.porcentaje_comision = porcentaje

            obj_detail.cerrado = True
            obj_detail.tipo_cambio = sin_tipo_cambio
            obj_detail.save()

        if not DEBUG:
            filtro = filter(lambda x: x['id'] == int(int_mes_post), arr_meses)
            resultado = next(filtro, None)

            str_html = """
                <table style="width: 100%%;">
                    <tbody>
                        <tr>
                            <td width="10%%">&nbsp;</td>
                            <td width="80%%">
                                <table style="width: 100%%; border: 1px solid #dddddd; border-radius: 3px;">
                                    <tbody>
                                        <tr>
                                            <td style="background: #333333; color: white; text-align:center;">
                                                <h2>Notificación de Comisiones de El Salvador Cerradas.</h2>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center; padding: 20px;">
                                                Se le informa que las comisiones de El Salvador se han
                                                cerrado para el mes de %s del año %s.
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td width="10%%">&nbsp;</td>
                        </tr>
                    </tbody>
                </table>
            """ % (resultado["mes"], int_anio_post)

            arr_correos = [
                "nrodriguez@grupobuena.com",
            ]

            msg = EmailMessage("Comisiones de Vendedores El Salvador Cerradas", str_html, 'nrodriguez@grupobuena.com',
                               arr_correos)
            msg.content_subtype = "html"
            msg.send()

        return JsonResponse({"status": True,
                             "msj": 'Se cerraron las comisiones correctamente.'}, safe=False)

    return JsonResponse({"status": False,
                         "msj": 'No se pudieron cerrar las comisiones ya que falló el '
                                'envio de datos, intente nuevamente.'}, safe=False)
