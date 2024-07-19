from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required

from core.functions import set_notification, get_query, execute_query, insert_query, get_single_query
from datetime import date, datetime, timedelta
from rrhh.models import Log_reprocesar_comisiones, Comision_respaldo_modificacion


@login_required(login_url="/login/")
def index(request):

    if request.method == 'POST':
        str_mes = request.POST.get("mes", None)

        if str_mes == "actual":
            str_query = """
            SET NOCOUNT ON;
            DECLARE @strDate date = getdate();
            DECLARE @intMes int = MONTH(@strDate), @intAnio int = YEAR(@strDate);
            SELECT TOP 1 cerrado FROM NOVA..rrhh_comision_datos WHERE mes = @intMes AND año = @intAnio; 
            """
            obj_cerrado = get_query(str_query)

            if obj_cerrado and obj_cerrado[0] and not obj_cerrado[0]['cerrado']:
                obj_dia = datetime.now()
                int_mes = int(obj_dia.strftime('%m'))
                int_anio = int(obj_dia.strftime('%Y'))
                Log_reprocesar_comisiones.objects.create(
                    mes=int_mes,
                    anio=int_anio,
                    usuario_id=request.user.id,
                )

                str_query = f"""
                    SELECT id, no_factura, no_producto, valor_comision_efectiva, comision_pagada, observaciones,
                        CAST(fecha_modificado AS SMALLDATETIME) AS 'fecha_modificado', numero_recibo
                    FROM NOVA..rrhh_comision_datos
                    WHERE mes = {int_mes} AND año = {int_anio} AND modificado = 1
                """
                obj_modificados = get_query(str_query)

                str_query = """
                    SET NOCOUNT ON;
                    DECLARE @strDate date = getdate();
                    DECLARE @intMes int = MONTH(@strDate), @intAnio int = YEAR(@strDate);
                    
                    DECLARE @strFechaInicial date = datefromparts(@intAnio, @intMes, 1);
                    DECLARE @strFechaFinal date = DATEADD(day, -1, DATEADD(month, 1, @strFechaInicial));
                    
                    select @strFechaInicial, @strFechaFinal;
                    
                    DELETE FROM NOVA..rrhh_comision_datos WHERE mes = @intMes AND año = @intAnio;
                    
                    exec NOVA..sp_rrhh_comisiones_datos @strFechaInicial, @strFechaFinal;
                """
                execute_query(str_query)

                for modificado in obj_modificados:
                    str_query = f"""
                        SELECT top 1 id FROM NOVA..rrhh_comision_datos WHERE mes = {int_mes} AND año = {int_anio}
                        AND no_factura = {modificado['no_factura']} AND no_producto = {modificado['no_producto']}
                        AND numero_recibo = {modificado['numero_recibo']}
                    """
                    obj_datos = get_single_query(str_query)

                    if obj_datos:
                        str_update = f"""
                            UPDATE NOVA..rrhh_comision_datos
                            SET valor_comision_efectiva = {modificado['valor_comision_efectiva']},
                                comision_pagada = {modificado['comision_pagada']},
                                observaciones = '{modificado['observaciones']}',
                                fecha_modificado = '{modificado['fecha_modificado']}',
                                modificado = 1
                            WHERE id = {obj_datos["id"]}
                        """
                        execute_query(str_update)

                        Comision_respaldo_modificacion.objects.filter(
                            id_comision_datos=modificado["id"]
                        ).update(
                            id_comision_datos=obj_datos["id"]
                        )

                set_notification(request, True, "Se reprocesaron las comisiones del mes actual exitosamente.",
                                 "add_alert", "success")
            else:
                set_notification(request, True, 'Las comisiones del mes actual ya se encuentran cerradas.',
                                 'warning', 'danger')
        else:
            str_query = """
                SET NOCOUNT ON;
                DECLARE @strDate date = DATEADD(month, -1, getdate());
                DECLARE @intMes int = MONTH(@strDate), @intAnio int = YEAR(@strDate);
                SELECT TOP 1 cerrado FROM NOVA..rrhh_comision_datos WHERE mes = @intMes AND año = @intAnio; 
                """
            obj_cerrado = get_query(str_query)

            if obj_cerrado and obj_cerrado[0] and not obj_cerrado[0]['cerrado']:
                obj_dia = datetime.now()
                int_mes = int(obj_dia.strftime('%m')) - 1
                int_anio = int(obj_dia.strftime('%Y'))
                int_anio = int_anio if int_mes >= 1 else int_anio - 1
                int_mes = 12 if int_mes < 1 else int_mes
                Log_reprocesar_comisiones.objects.create(
                    mes=int_mes,
                    anio=int_anio,
                    usuario_id=request.user.id,
                )

                str_query = f"""
                    SELECT id, no_factura, no_producto, valor_comision_efectiva, comision_pagada, observaciones,
                        CAST(fecha_modificado AS SMALLDATETIME) AS 'fecha_modificado', numero_recibo
                    FROM NOVA..rrhh_comision_datos
                    WHERE mes = {int_mes} AND año = {int_anio} AND modificado = 1
                """
                obj_modificados = get_query(str_query)

                str_query = """
                    SET NOCOUNT ON;
                    DECLARE @strDate date = DATEADD(month, -1, getdate());
                    DECLARE @intMes int = MONTH(@strDate), @intAnio int = YEAR(@strDate);

                    DECLARE @strFechaInicial date = datefromparts(@intAnio, @intMes, 1);
                    DECLARE @strFechaFinal date = DATEADD(day, -1, DATEADD(month, 1, @strFechaInicial));

                    select @strFechaInicial, @strFechaFinal;

                    DELETE FROM NOVA..rrhh_comision_datos WHERE mes = @intMes AND año = @intAnio;

                    exec NOVA..sp_rrhh_comisiones_datos @strFechaInicial, @strFechaFinal;
                """
                execute_query(str_query)

                for modificado in obj_modificados:
                    str_query = f"""
                        SELECT top 1 id FROM NOVA..rrhh_comision_datos WHERE mes = {int_mes} AND año = {int_anio}
                        AND no_factura = {modificado['no_factura']} AND no_producto = {modificado['no_producto']}
                        AND numero_recibo = {modificado['numero_recibo']}
                    """
                    obj_datos = get_single_query(str_query)

                    if obj_datos:
                        str_update = f"""
                            UPDATE NOVA..rrhh_comision_datos
                            SET valor_comision_efectiva = {modificado['valor_comision_efectiva']},
                                comision_pagada = {modificado['comision_pagada']},
                                observaciones = '{modificado['observaciones']}',
                                fecha_modificado = '{modificado['fecha_modificado']}',
                                modificado = 1
                            WHERE id = {obj_datos["id"]}
                        """
                        execute_query(str_update)

                        Comision_respaldo_modificacion.objects.filter(
                            id_comision_datos=modificado["id"]
                        ).update(
                            id_comision_datos=obj_datos["id"]
                        )

                set_notification(request, True, "Se reprocesaron las comisiones del mes anterior exitosamente.",
                                 "add_alert", "success")
            else:
                set_notification(request, True, 'Las comisiones del mes anterior ya se encuentran cerradas.',
                                 'warning', 'danger')

    return render(request, 'comisiones/reprocesar.html')
