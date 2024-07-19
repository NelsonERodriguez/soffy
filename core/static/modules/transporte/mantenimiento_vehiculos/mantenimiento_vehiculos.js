$(document).ready(function(){

    $("#proveedor").autocomplete({
        minLength: 1,
        source: function (request, response) {
            open_loading();
            const data = new FormData();
            data.append('csrfmiddlewaretoken', document.getElementsByName('csrfmiddlewaretoken')[0].value);
            data.append('busqueda', request.term);

            fetch(strUrlGetProveedores, {
                method: 'POST',
                body: data
            })
                .then(response => response.json())
                .then((data) => {
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
        select: function (event, ui) {
            event.preventDefault();
            document.getElementById('id_proveedor').value = ui.item.value;
            this.value = ui.item.label;
        }
    })
        .focus(function () {
            $(this).val('');document.getElementById('id_proveedor').value = '';
        });

    $("#camion").autocomplete({
        minLength: 1,
        source: function (request, response) {
            open_loading();
            const data = new FormData();
            data.append('csrfmiddlewaretoken', document.getElementsByName('csrfmiddlewaretoken')[0].value);
            data.append('busqueda', request.term);

            fetch(strUrlGetCamiones, {
                method: 'POST',
                body: data
            })
                .then(response => response.json())
                .then((data) => {
                    close_loading();
                    response($.map(data.camiones, function (item) {
                        return {
                            label: item.Descripcion,
                            value: item.NoCamion
                        }
                    }))
                })
                .catch((error) => {
                    close_loading();
                    console.error(error);
                });
        },
        select: function (event, ui) {
            event.preventDefault();
            document.getElementById('NoCamion').value = ui.item.value;
            this.value = ui.item.label;
        },
        change: function (event, ui) {
            if (ui.item == null) {
                this.value = '';
                return false;
            }
        }
    })
        .focus(function () {
            $(this).val('');
            document.getElementById('NoCamion').value = '';
        });

});

const addRow = () => {
    const tbodyDetalles = document.getElementById('tbodyDetalles');
    const objRows = document.querySelectorAll(`input[name="row[]"]`);
    let intRow = 0;

    objRows.forEach(element => {
        const intRowTMP = parseInt(element.value);

        if (intRowTMP > intRow) {
            intRow = intRowTMP;
        }

    });

    intRow = (intRow)? intRow + 1 : 1;

    const strTr = `
        <tr id="tr_${intRow}">
            <td>
                <input type="text" id="gastos_${intRow}" name="gastos[]" class="form-control" data-row="${intRow}" required>
                <input type="hidden" name="NoConceptosGastos[]" id="NoConceptosGastos_${intRow}" value="0">
                <input type="hidden" name="row[]" id="row_${intRow}" value="${intRow}">
            </td>
            <td>
                <input type="number" name="Cantidad[]" id="Cantidad_${intRow}" class="form-control" required>
            </td>
            <td>
                <input type="number" name="Valor[]" id="Valor_${intRow}" class="form-control" step="0.01" required>
            </td>
            <td style="text-align: center;">
                <button class="btn btn-link btn-just-icon btn-danger" type="button" onclick="deleteRow(${intRow});">
                    <i class="material-icons">delete</i>
                </button>
            </td>
        </tr>
    `;

    tbodyDetalles.insertAdjacentHTML('beforeend', strTr);

    setAutocomplete(document.getElementById(`gastos_${intRow}`));
};

const setAutocomplete = (objInput) => {
    const intRow = objInput.getAttribute('data-row');
    const objGastos = document.getElementById(`NoConceptosGastos_${intRow}`);
    $(objInput).autocomplete({
        minLength: 1,
        source: function( request, response ) {

            const form = new FormData();
            const csrftoken = getCookie('csrftoken');
            form.append('busqueda', request.term);
            open_loading();

            fetch(strUrlGetGastos, {
                method: 'POST',
                headers: { "X-CSRFToken": csrftoken },
                body: form
            })
                .then(response => response.json())
                .then( (data) => {

                    close_loading();
                    response($.map(data.gastos, function (item) {
                        return {
                            label: item.Descripcion,
                            value: item.NoConceptosGastos
                        }
                    }));

                })
                .catch((error) => {

                    close_loading();
                    console.error(error);
                    alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");

                });
        },
        select: function( event, ui ) {

            event.preventDefault();
            const strGasto = ui.item.label;
            const intGasto = ui.item.value * 1;
            this.value = strGasto;
            objGastos.value = intGasto;
        }
    })
        .focus(function () {
            this.value = '';
            objGastos.value = 0;
        });
};

const deleteRow = (intRow) => {
    document.getElementById(`tr_${intRow}`).remove();
};
