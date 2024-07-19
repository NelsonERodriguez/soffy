from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from core.functions import get_query, set_notification, insert_query
from rrhh.models import Horas_extras
from django.core.mail import EmailMessage
from nova.debug import IMAGEN_GB


@login_required(login_url="/login/")
def index(request):

    horas = Horas_extras.objects.filter(
        user_id=request.user.id,
        cerrado=True,
        procesado=False
    )

    if not horas:
        horas = Horas_extras.objects.filter(
            cerrado=True,
            procesado=False
        )

    data = {
        "horas": horas
    }
    return render(request, 'registro_horas_extras/registro_horas_extras.html', data)


@login_required(login_url="/login/")
def ver_reporte(request, id):

    try:
        horas = Horas_extras.objects.get(id=id)

        str_sql = """
            SELECT
                AU.name, 
                NE.No_Empleado, 
                NP.Descripcion AS Puesto,
                ISNULL(CAST((NE.Sueldo + NE.Bonificacion + NE.Bonificacion_Extra) AS DECIMAL (14,02)),0) AS SueldoTotal,
                ISNULL(CAST((( (NE.Sueldo + NE.Bonificacion + NE.Bonificacion_Extra)/30)/8) AS DECIMAL (14,02)),0) AS 
                HORAS,
                ISNULL(CAST(((( (NE.Sueldo + NE.Bonificacion + NE.Bonificacion_Extra)/30)/8)*1.5) AS DECIMAL (14,02)),0) 
                AS HORAS_SIMPLE,
                ISNULL(CAST(((( (NE.Sueldo + NE.Bonificacion + NE.Bonificacion_Extra)/30)/8)*2) AS DECIMAL (14,02)),0) 
                AS HORAS_DOBLE,
                ISNULL(SUM(NHD.horas_simples),0) AS Simples,
                ISNULL(SUM(NHD.horas_dobles),0) AS Dobles,
                ISNULL(CAST((((( (NE.Sueldo + NE.Bonificacion + NE.Bonificacion_Extra)/30)/8)*1.5) * 
                SUM(NHD.horas_simples)) AS DECIMAL (14,02)),0) AS valor_simple,
                ISNULL(CAST((((( (NE.Sueldo + NE.Bonificacion + NE.Bonificacion_Extra)/30)/8)*2) * 
                SUM(NHD.horas_dobles)) AS DECIMAL (14,02)),0) AS valor_doble
            FROM
                NOVA..rrhh_horas_extras NH
            INNER JOIN NOVA..rrhh_horas_extras_detalle NHD ON NHD.hora_extra_id = NH.id
            INNER JOIN ares..users AU ON AU.id = NHD.user_id
            INNER JOIN ares..empleados_base AEB ON AEB.empleado_id = AU.empleado_id
            INNER JOIN NominaGB..Empleados NE ON NE.No_Empleado = AEB.no_empleado
            INNER JOIN NominaGB..Puestos NP ON NP.No_Puesto = NE.No_Puesto
            WHERE
                NH.id = %s
            AND NH.cerrado = 1
            AND NH.procesado = 0
            AND NE.Fecha_Baja IS NULL
            AND AEB.base_id = 46
            AND AEB.fecha_baja IS NULL
            GROUP BY
                AU.id, AU.name, NE.No_Empleado, NP.Descripcion, ne.Sueldo, ne.Bonificacion, ne.Bonificacion_Extra
                     """ % id
        arr_detalles_tmp = get_query(str_sql)
        arr_detalles = []

        for detalle_tmp in arr_detalles_tmp:
            arr_detalles.append(
                {
                    "CodigoEmpleado": detalle_tmp['No_Empleado'],
                    "Empleado": detalle_tmp['name'],
                    "Puesto": detalle_tmp['Puesto'],
                    "SueldoTotal": format(detalle_tmp['SueldoTotal']),
                    "Horas": format(detalle_tmp['HORAS']),
                    "HORA_SIMPLE": format(detalle_tmp['HORAS_SIMPLE']),
                    "HORA_DOBLE": format(detalle_tmp['HORAS_DOBLE']),
                    "Suma_Simples": format(detalle_tmp['Simples']),
                    "Suma_Dobles": format(detalle_tmp['Dobles']),
                    "Valor_Simple": format(detalle_tmp['valor_simple']),
                    "Valor_Doble": format(detalle_tmp['valor_doble']),
                }
            )

        if request.method == "POST":
            str_sql = """
            SELECT 
                TOP 1 No_Periodo, Tipo_Periodo 
            FROM
                NominaGB..periodos
            WHERE 
                Fecha_Cerro IS NULL
            ORDER BY Fecha_Inicial DESC
            """
            arr_periodo = get_query(str_sql)

            if arr_periodo:
                str_no_periodo = int(arr_periodo[0]['No_Periodo'])
                str_tipo_periodo = arr_periodo[0]['Tipo_Periodo']

                arr_codigo_empleado = request.POST.getlist('CodigoEmpleado[]', None)
                arr_cantidad_simples = request.POST.getlist('CantidadSimples[]', None)
                arr_cantidad_dobles = request.POST.getlist('CantidadDobles[]', None)
                arr_valor_simples = request.POST.getlist('ValorSimples[]', None)
                arr_valor_dobles = request.POST.getlist('ValorDobles[]', None)

                int_row = 0
                for codigo_empleado in arr_codigo_empleado:

                    int_cantidad_simple = float(arr_cantidad_simples[int_row])
                    int_cantidad_dobles = float(arr_cantidad_dobles[int_row])
                    int_valor_simple = float(arr_valor_simples[int_row])
                    int_valor_dobles = float(arr_valor_dobles[int_row])

                    if int_cantidad_simple:
                        str_sql = """
                        INSERT INTO NominaGB..Movimientos 
                        (No_Empleado, No_Clave, Tipo_Periodo, No_Periodo, Tipo_Movimiento, Cantidad, Valor, Referencia)
                        VALUES
                        ('%s', 9, '%s', '%s', 'F', %s, %s, 0) 
                        """ % (codigo_empleado, str_tipo_periodo, str_no_periodo, int_cantidad_simple, int_valor_simple)
                        insert_query(str_sql)

                    if int_cantidad_dobles:
                        str_sql = """
                        INSERT INTO NominaGB..Movimientos 
                        (No_Empleado, No_Clave, Tipo_Periodo, No_Periodo, Tipo_Movimiento, Cantidad, Valor, Referencia)
                        VALUES
                        ('%s', 10, '%s', '%s', 'F', %s, %s, 0) 
                        """ % (codigo_empleado, str_tipo_periodo, str_no_periodo, int_cantidad_dobles, int_valor_dobles)
                        insert_query(str_sql)

                    int_row += 1

                horas.procesado = True
                horas.save()

                str_table = """<table cellpadding="10" cellspacing="0"> 
                    <thead>
                        <tr> 
                            <th style="text-align: center;">CÓDIGO</th> 
                            <th style="text-align: center;">EMPLEADO</th> 
                            <th style="text-align: center;">PUESTO</th> 
                            <th style="text-align: center; font-weight: bold;">SUELDO</th> 
                            <th style="text-align: center; font-weight: bold;">HORA</th> 
                            <th style="text-align: center; background: #92dbff; font-weight: bold;">HORA SIMPLE</th> 
                            <th style="text-align: center; background: #d7ffa6; font-weight: bold;">HORA DOBLE</th> 
                            <th style="text-align: center; background: #92dbff; font-weight: bold;">
                                SUMA DE HORAS SIMPLES
                            </th> 
                            <th style="text-align: center; background: #d7ffa6; font-weight: bold;">
                                SUMA DE HORAS DOBLES
                            </th> 
                            <th style="text-align: center; background: #92dbff; font-weight: bold;">
                                VALOR TOTAL DE HORAS SIMPLES
                            </th>
                            <th style="text-align: center; background: #d7ffa6; font-weight: bold;">
                                VALOR TOTAL DE HORAS DOBLES
                            </th> 
                        </tr> 
                    </thead>
                    <tbody>
                """

                for detalle in arr_detalles:
                    str_table += """ 
                        <tr>
                            <td style="text-align: center; border-bottom: black solid 1px;">%s</td>
                            <td style="text-align: center; border-bottom: black solid 1px;">%s</td>
                            <td style="text-align: center; border-bottom: black solid 1px;">%s</td>
                            <td style="text-align: center; border-bottom: black solid 1px; font-weight: bold;">Q%s</td>
                            <td style="text-align: center; border-bottom: black solid 1px; font-weight: bold;">Q%s</td>
                            <td style="text-align: center; border-bottom: black solid 1px; background: #92dbff; 
                            font-weight: bold;">Q%s</td>
                            <td style="text-align: center; border-bottom: black solid 1px; background: #d7ffa6; 
                            font-weight: bold;">Q%s</td>
                            <td style="text-align: center; border-bottom: black solid 1px; background: #92dbff; 
                            font-weight: bold;">%s</td>
                            <td style="text-align: center; border-bottom: black solid 1px; background: #d7ffa6; 
                            font-weight: bold;">%s</td>
                            <td style="text-align: center; border-bottom: black solid 1px; background: #92dbff; 
                            font-weight: bold;">Q%s</td>
                            <td style="text-align: center; border-bottom: black solid 1px; background: #d7ffa6; 
                            font-weight: bold;">Q%s</td>
                        </tr>
                    """ % (
                        detalle['CodigoEmpleado'],
                        detalle['Empleado'],
                        detalle['Puesto'],
                        detalle['SueldoTotal'],
                        detalle['Horas'],
                        detalle['HORA_SIMPLE'],
                        detalle['HORA_DOBLE'],
                        detalle['Suma_Simples'] if detalle['Suma_Simples'] else '',
                        detalle['Suma_Dobles'] if detalle['Suma_Dobles'] else '',
                        detalle['Valor_Simple'] if detalle['Valor_Simple'] else '',
                        detalle['Valor_Doble'] if detalle['Valor_Doble'] else '',
                    )

                str_table += """ 
                    </tbody> 
                </table>"""

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
                                                    <h2>Horas extras del año %s mes %s %sA quincena.</h2>
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
                                <td width="20%%">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                """ % (IMAGEN_GB, horas.year, horas.month, horas.quincena, str_table)

                arr_emails = ['iramirez@grupobuena.com', 'agodinez@grupobuena.com']
                if horas.departamento == 3:
                    arr_emails.append('jporras@grupobuena.com')
                elif horas.departamento == 4:
                    arr_emails.append('hrivera@grupobuena.com')

                msg = EmailMessage("Reporte de horas extras a nomina", str_html, 'nova@grupobuena.com', arr_emails)
                msg.content_subtype = "html"  # Main content is now text/html
                msg.send()

                set_notification(request, True, "Registros grabados en nomina.", "add_alert", "success")
                return redirect('rrhh-registro_horas_extras')

    except Horas_extras.DoesNotExist:
        set_notification(request, True, "Registro no encontrado.", "warning", "danger")
        return redirect('rrhh-registro_horas_extras')

    data = {
        "horas": horas,
        "detalles": arr_detalles
    }
    return render(request, 'registro_horas_extras/registro_horas_extras_detalle.html', data)
