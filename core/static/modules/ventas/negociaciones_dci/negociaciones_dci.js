document.addEventListener("DOMContentLoaded", (e) => {
    const objProductos = document.querySelectorAll(`input[id^="producto_"]`);
    objProductos.forEach(element => {
        setAutocomplete(element);
    });
});

const addRow = () => {
    const tbodyNegociaciones = document.getElementById('tbodyNegociaciones');
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
        <tr>
            <td>
                <input type="text" id="producto_${intRow}" class="form-control" data-row="${intRow}">
                <input type="hidden" name="detalle_id[]" id="detalle_id_${intRow}" value="0">
                <input type="hidden" name="producto_id[]" id="producto_id_${intRow}" value="0">
                <input type="hidden" name="row[]" id="row_${intRow}" value="${intRow}">
            </td>
            <td>
                <input type="number" name="contenedores_negociados[]" id="contenedores_negociados_${intRow}" class="form-control">
            </td>
            <td>
                <input type="date" name="fecha_entrega[]" id="fecha_entrega_${intRow}" class="form-control">
            </td>
            <td>
                <select name="estados[]" id="estados[]" class="form-control">
                    <option value="negociado">Negociado</option>
                    <option value="cotizado">Cotizado</option>
                </select>
            </td>
        </tr>
    `;

    tbodyNegociaciones.insertAdjacentHTML('beforeend', strTr);

    setAutocomplete(document.getElementById(`producto_${intRow}`));
};

const setAutocomplete = (objInput) => {
    const intRow = objInput.getAttribute('data-row');
    const objProductoID = document.getElementById(`producto_id_${intRow}`);
    $(objInput).autocomplete({
        minLength: 1,
        source: function( request, response ) {

            const form = new FormData();
            const csrftoken = getCookie('csrftoken');
            form.append('busqueda', request.term);
            open_loading();

            fetch(strUrlGetProductos, {
                method: 'POST',
                headers: { "X-CSRFToken": csrftoken },
                body: form
            })
                .then(response => response.json())
                .then( (data) => {

                    close_loading();
                    response($.map(data.productos, function (item) {
                        return {
                            label: item.name,
                            value: item.id
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
            const strProducto = ui.item.label;
            const intProducto = ui.item.value * 1;
            this.value = strProducto;
            objProductoID.value = intProducto;
        }
    })
        .focus(function () {
            this.value = '';
            objProductoID.value = 0;
        });
};

const saveDatos = (boolCerrar = false) => {

    const objImputs = document.querySelectorAll(`#frm_negociaciones_dci input`);

    if (objImputs.length === 0) {
        alert_nova.showNotification('No tienen ningun dato ingresado.', "warning", "danger");
        return false;
    }

    let boolError = false;
    objImputs.forEach(element => {
        if (element.name !== 'id' && element.name !== 'detalle_id') {
            if (element.value.trim() === '') {
                boolError = true;
                element.style.border = 'solid #f44336 1px';
            }
            else {
                element.style.border = '';
            }
        }
    });

    if (boolError) {
        alert_nova.showNotification('Debe ingresar todos los campos requeridos.', "warning", "danger");
        return false;
    }

    const formElmenet = document.getElementById('frm_negociaciones_dci');
    const form = new FormData(formElmenet);
    if (boolCerrar) {
        form.append('cerrado', 1);
    }

    open_loading();

    fetch(strUrlSave, {
        method: 'POST',
        body: form
    })
        .then(response => response.json())
        .then( (data) => {

            close_loading();
            if (data.status) {
                const intID = parseInt(document.getElementById('id').value);
                const intNewId = parseInt(data.id);

                const strPath = (intID !== intNewId)? strUrlSave.replace(intID, data.id) : strUrlSave;
                simple_redireccion(strPath);
            }

        })
        .catch((error) => {

            close_loading();
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");

        });
};

const btnAgregar = document.getElementById('btnAgregar');
if (btnAgregar) {
    btnAgregar.addEventListener('click', addRow);
}

const btnSave = document.getElementById('btnSave');
if (btnSave) {
    btnSave.addEventListener('click', () => {
        saveDatos(false);
    });
}

const btnCerrar = document.getElementById('btnCerrar');
if (btnCerrar) {
    btnCerrar.addEventListener('click', () => {
        saveDatos(true);
    });
}
