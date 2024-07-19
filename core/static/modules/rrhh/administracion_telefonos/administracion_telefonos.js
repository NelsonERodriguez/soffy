const fntDataTable = async (strContent) => {
    if( objTblTelefonos ) objTblTelefonos.destroy();
    $("#tblMatriz > tbody").html(strContent);
    objTblTelefonos = $("#tblMatriz").DataTable({
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50],
            [10, 25, 50]
        ],
        responsive: false,
        language: objLenguajeDataTable,
        autoPrint: false
    });
    $('[rel="tooltip"]').tooltip();
};

const fntGetData = async () => {
    let formData = new FormData();
    let strActivos = document.getElementById("sltActivos").value;
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    formData.append('strActivos', strActivos);

    open_loading();
    fetch(`${strUrlGetData}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        let strHtml = "";

        data.data.forEach((value)=>{
            /* */
            let sinSubsidio = currencyFormat.format(value.subsidio);
            let strCuentaSubsidio = value.cuenta_subsidio ? value.cuenta_subsidio : "--";
            let strCuentaDescuento = value.cuenta_descuento ? value.cuenta_descuento : "--";
            let strEmpleado = value.empleado ? value.empleado : "N/A";
            let strActivo = value.activo ? "Si" : "No";
            let strClass = value.empleado ? "" : "table-danger";

            strHtml += `
                <tr class="${strClass}">
                    <td class="text-right">${value.numero}</td>
                    <td class="text-left">${strEmpleado}</td>
                    <td class="text-right">${sinSubsidio}</td>
                    <td class="text-right">${strCuentaSubsidio}</td>
                    <td class="text-right">${strCuentaDescuento}</td>
                    <td class="text-center">${strActivo}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary" onclick="fntEdit(this, ${value.id});" rel="tooltip" title="Editar" position="left">
                            <i class="fas fa-pencil fa-2x"></i>
                        </button>
                    </td>
                </tr>
            `;
            /* */
        });

        fntDataTable(strHtml);
        close_loading();
        //window.location.reload();
    })
    .catch(error => {
        close_loading();
        alert_nova.showNotification('Ocurrió un error, contacte con IT', 'warning', 'danger');
        console.error(error)
    });
};

const fntEdit = async (objButton, intRow) => {
    $(objButton).blur();
    window.id_telefono = intRow;

    let intTelefono = intRow;

    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    formData.append('intTelefono', intTelefono);

    fetch(strUrlEdit, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(data => {
        $("#divContentEdit").html(data);

        $("#divContentIndex").hide(800);
        $("#divContentEdit").show(800);

        fntMakeAutocompletes();

        close_loading();
    })
    .catch(error => {
        console.error(error)
        close_loading();
    })

};

const fntPreguntaRegresar = async () => {
    dialogConfirm(fntRegresar, false, '¿Estás seguro?', '¡No se guardarán los datos que has cambiado o has ingresado!')
}

const fntPreguntaGuardar = async () => {
    let boolGuardar = true;

    if( document.getElementById("numero").value.trim().length === 0 ){
        alert_nova.showNotification("El número de teléfono es obligatorio", "add_alert", "danger");
        boolGuardar = false;
    }

    if( document.getElementById("subsidio").value.trim().length === 0 ){
        alert_nova.showNotification("El subsidio es obligatorio", "add_alert", "danger");
        boolGuardar = false;
    }

    if( boolGuardar ){
        dialogConfirm(fntGuardar, false, '¿Estás seguro?', '¡Se guardarán los datos que has cambiado o has ingresado!', 'info')
    }
}

const fntRegresar = async () => {
    $("#divContentEdit").hide(800);
    $("#divContentIndex").show(800, function(e){
        $("#divContentEdit").html("");
    });
};

const fntMakeAutocompletes = async () => {
    $("#usuario").autocomplete({
        minLength: 2,
        source: function( request, response ) {
            open_loading();
            let strUrl = strUrlBuscarUsuarios;
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
            document.getElementById(`id_usuario`).value = (ui.item.value == "Todos" ? "" : ui.item.value);
            this.value = ui.item.label;
        },
        focus: function( event, ui ) {
            this.value = ui.item.label;
            return false;
        },
        change: function( event, ui ){
            if( ui.item == null ){
                this.value = '';
                document.getElementById(`id_usuario`).value = "";
                return false;
            }
        }
    });

    $("#cuenta_subsidio_show").autocomplete({
        minLength: 2,
        source: function( request, response ) {
            open_loading();
            let strUrl = strUrlBuscarCuentas;
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
            document.getElementById(`cuenta_subsidio`).value = ui.item.value;
            this.value = ui.item.label;
        },
        focus: function( event, ui ) {
            this.value = ui.item.label;
            return false;
        },
        change: function( event, ui ){
            if( ui.item == null ){
                this.value = '';
                document.getElementById(`cuenta_subsidio`).value = "";
                return false;
            }
        }
    });

    $("#cuenta_descuento_show").autocomplete({
        minLength: 2,
        source: function( request, response ) {
            open_loading();
            let strUrl = strUrlBuscarCuentas;
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
                }));
            })
            .catch((error) => {
                close_loading();
                console.error(error);
            });
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById(`cuenta_descuento`).value = ui.item.value;
            this.value = ui.item.label;
        },
        focus: function( event, ui ) {
            this.value = ui.item.label;
            return false;
        },
        change: function( event, ui ){
            if( ui.item == null ){
                this.value = '';
                document.getElementById(`cuenta_descuento`).value = "";
                return false;
            }
        }
    });
}

const fntGuardar = async () => {
    let intTelefono = window.id_telefono;

    open_loading();
    const formElement = document.getElementById("frm_telefono");
    let formData = new FormData(formElement);
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    formData.append('intTelefono', intTelefono);

    fetch(strUrlSave, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        fntRegresar();
        close_loading();
        alert_nova.showNotification(data.msj, "add_alert", "success");
        fntGetData();
    })
    .catch(error => {
        console.error(error)
        close_loading();
    })
};

document.addEventListener("DOMContentLoaded", () => {
    fntGetData();
});