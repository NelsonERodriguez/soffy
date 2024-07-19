btn.addEventListener('click', () => {
    let boolMensajeInicio = false;
    $("input[id^='inicio_rango_dias_']").each(function(){
        if( $.trim($(this).val()).length == 0 ){
            boolMensajeInicio = true;
        }
    });
    if( boolMensajeInicio ){
        alert_nova.showNotification('El campo Día Inicio es requerido en cada una de las reglas', "warning", "danger");
    }

    let boolMensajeFin = false;
    $("input[id^='fin_rango_dias_']").each(function(){
        if( $.trim($(this).val()).length == 0 ){
            boolMensajeFin = true;
        }
    });
    if( boolMensajeFin ){
        alert_nova.showNotification('El campo Día Fin es requerido en cada una de las reglas', "warning", "danger");
    }

    let boolMensajeComision = false;
    $("input[id^='comision_rango_']").each(function(){
        if( $.trim($(this).val()).length == 0 ){
            boolMensajeComision = true;
        }
    });
    if( boolMensajeComision ){
        // alert_nova.showNotification("Email enviado.", "add_alert", "success");
        alert_nova.showNotification('El campo Comisión es requerido en cada una de las reglas', "warning", "danger");
    }

    let boolMensajeArchivoAdjunto = false;
    let filInputFile = document.getElementById('filInputFile');
    if( boolAdjuntosRequeridos ){
        if( filInputFile.files.length === 0 ){
            alert_nova.showNotification(`El archivo de respaldo de la modificación es requerido`, "warning", "danger");
            return false;
        }
    }

    let boolMensajeRangos = false;
    $("input[id^='inicio_rango_dias_']").each(function(){
        let strId = $(this).attr("id");
        let arrSplit = strId.split("_");
        let valueInicial = parseFloat($(this).val());
        let valueFinal = parseFloat($("#fin_rango_dias_"+arrSplit[3]).val());
        $("input[id^='inicio_rango_dias_']").each(function(){
            let arrSplit2 = $(this).attr("id").split("_");
            let valueInicial2 = parseFloat($(this).val());
            let valueFinal2 = parseFloat($("#fin_rango_dias_"+arrSplit2[3]).val());
            if( strId != $(this).attr("id") ){
                if( ((valueInicial >= valueInicial2) && (valueInicial <= valueFinal2) ) ){
                    boolMensajeRangos = true;
                }
                if( ((valueFinal >= valueInicial2) && (valueFinal <= valueFinal2) ) ){
                    boolMensajeRangos = true;
                }
            }
        });

        if( valueInicial >= valueFinal ){
            boolMensajeRangos = true;
        }
    });

    if( boolMensajeRangos ){
        alert_nova.showNotification('Los rangos no están correctamente configurados', "warning", "danger");
        alert_nova.showNotification('Ejemplo de rangos: 0-5, 6-10. 11-15.', "info", "info");
    }

    if( $.trim($("#comision_base").val()).length == 0 ){
        alert_nova.showNotification('El campo Comisón Base es requerido', "warning", "danger");
        boolMensajeComision = true;
    }

    if( $.trim($("#comision_fuera_rango").val()).length == 0 ){
        alert_nova.showNotification('El campo Comisón Fuera de Rango es requerido', "warning", "danger");
        boolMensajeComision = true;
    }

    if( $.trim($("#tipoProducto").val()).length == 0 ){
        alert_nova.showNotification('El campo Tipo de Producto Fuera de Rango es requerido', "warning", "danger");
        boolMensajeComision = true;
    }

    if( !boolMensajeInicio && !boolMensajeFin && !boolMensajeComision && !boolMensajeRangos && !boolMensajeArchivoAdjunto ){
        saveInterfaz();
    }
});

btnRegresar.addEventListener('click', () => {
    dialogConfirm(redirectIndex, false, '¿Estás seguro?', '¡No se guardaran los datos que has cambiado o has ingresado!')
});

const saveInterfaz = () => {
    dialogConfirm(submitForm);
}

const submitForm = () => {
    document.frm_interfaz.submit();
}

const redirectIndex = () => {
    document.location = strUrlIndex;
}

const addRow = () => {
    let strRow = `
        <tr>
            <td>
                <input type="number" class="form-control" id="inicio_rango_dias_${intCorrelativo}" name="inicio_rango_dias_${intCorrelativo}" value="" onkeypress="return validar_caracteres(event, 2);">
                <input type="hidden" name="id_rango_detalle_${intCorrelativo}" id="id_rango_detalle_${intCorrelativo}" value="0">
            </td>
            <td>
                <input type="number" class="form-control" id="fin_rango_dias_${intCorrelativo}" name="fin_rango_dias_${intCorrelativo}" value="" onkeypress="return validar_caracteres(event, 2);">
            </td>
            <td>
                <input type="number" class="form-control" id="comision_rango_${intCorrelativo}" name="comision_rango_${intCorrelativo}" value="" onkeypress="return validar_caracteres(event, 7);">
            </td>
            <td>
                <a href="#" onclick="$(this).parent().parent().remove();"><i class="far fa-trash-alt"></i></a>
            </td>
        </tr>`;

    $("#tbodyDetalle").append(strRow);

    intCorrelativo++;
}

const removeRow = (obj) => {
    $(obj).parent().parent().find("[id^='hdn_eliminar']").val("1");

    let objClon = $(obj).parent().parent().clone();
    $("#tfootDetalle").append(objClon);

    $(obj).parent().parent().remove();
}

$(document).ready(function(){
    $("#cliente").autocomplete({
        minLength: 2,
        source: function( request, response ) {
            open_loading();
            let strUrl = strUrlBuscarCliente;
            strUrl = strUrl.replace('search', request.term);
            const data = new FormData();
            data.append('csrfmiddlewaretoken', valCSRF);

            fetch(strUrl, {
                method: 'POST',
                body: data,
            })
            .then(response => response.json())
            .then( (data) => {
                close_loading();
                response($.map(data, function (item) {
                    return {
                        label: item.name,
                        value: item.id
                    }
                }))
            })
            .catch((error) => {
                close_loading();
                console.error(error);
            });
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById(`nocliente`).value = (ui.item.value == "Todos" ? "" : ui.item.value);
            this.value = ui.item.label;
        },
        focus: function( event, ui ) {
            this.value = ui.item.label;
            return false;
        },
        change: function( event, ui ){
            if( ui.item == null ){
                this.value = '';
                return false;
            }
        }
    });

    $("#vendedor").autocomplete({
        minLength: 2,
        source: function( request, response ) {
            open_loading();
            let strUrl = strUrlBuscarVendedor;
            strUrl = strUrl.replace('search', request.term);
            const data = new FormData();
            data.append('csrfmiddlewaretoken', valCSRF);

            fetch(strUrl, {
                method: 'POST',
                body: data,
            })
            .then(response => response.json())
            .then( (data) => {
                close_loading();
                response($.map(data, function (item) {
                    return {
                        label: item.name,
                        value: item.id
                    }
                }))
            })
            .catch((error) => {
                close_loading();
                console.error(error);
            });
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById(`novendedor`).value = (ui.item.value == "Todos" ? "" : ui.item.value);
            this.value = ui.item.label;
        },
        focus: function( event, ui ) {
            this.value = ui.item.label;
            return false;
        },
        change: function( event, ui ){
            if( ui.item == null ){
                this.value = '';
                return false;
            }
        }
    });

    $("#producto").autocomplete({
        minLength: 2,
        source: function( request, response ) {
            open_loading();
            let strUrl = strUrlBuscarProducto;
            strUrl = strUrl.replace('search', request.term);
            const data = new FormData();
            data.append('csrfmiddlewaretoken', valCSRF);

            fetch(strUrl, {
                method: 'POST',
                body: data,
            })
            .then(response => response.json())
            .then( (data) => {
                close_loading();
                response($.map(data, function (item) {
                    return {
                        label: item.name,
                        value: item.id
                    }
                }))
            })
            .catch((error) => {
                close_loading();
                console.error(error);
            });
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById(`noproducto`).value = (ui.item.value == "Todos" ? "" : ui.item.value);
            this.value = ui.item.label;
        },
        focus: function( event, ui ) {
            this.value = ui.item.label;
            return false;
        },
        change: function( event, ui ){
            if( ui.item == null ){
                this.value = '';
                return false;
            }
        }
    });

    $("#btnSave").on("click", function(){
        

    });
});