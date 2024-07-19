function add_row() {
    const tbody = document.getElementById('tdoby_rows');
    const objRows = document.querySelectorAll(`input[name="contador[]"]`);
    let intRow = 0;

    objRows.forEach(() => {
         intRow++;
     });
     intRow++;

    tbody.innerHTML += `
        <tr>
            <td>
                ${intRow}
                <input type="hidden" name="contador[]" id="contador" value="${intRow}" class="form-control">
            </td>
            <td>
                <input type="text" name="nombre[]" id="nombre_${intRow}" class="form-control">
            </td>
            <td>
                <input type="text" name="contenedor[]" id="contenedor_${intRow}" class="form-control">
            </td>
            <td>
                <input type="number" name="galones[]" id="galones_${intRow}" class="form-control" onchange="change_galones();">
            </td>
            <td>
                <input type="number" name="exactitud[]" id="exactitud_${intRow}" class="form-control">
            </td>
            <td>
                <input type="number" name="vale_pto[]" id="vale_pto_${intRow}" class="form-control">
            </td>
            <td>
                <input type="text" name="estadia[]" id="estadia_${intRow}" class="form-control">
            </td>
            <td>
                <input type="text" name="vales[]" id="vales_${intRow}" class="form-control">
            </td>
        </tr>
    `;

}

function save_inventario() {

    const objRows = document.querySelector(`input[name="contador[]"]`);

    if (objRows) {

        open_loading();

        const formElement = document.getElementById("frm_diesel");
        const form = new FormData(formElement);

        fetch(strUrlSaveDiesel, {
            method: 'POST',
            body: form
        })
        .then(response => response.json())
        .then( (data) => {
            close_loading();

            if (data.status) {
                window.location.href = strUrlInventarioDiesel;
            }

        })
        .catch((error) => {
            close_loading();
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            console.error(error);
        });

    }

}

function cerrar_inventario() {

    const objRows = document.querySelector(`input[name="contador[]"]`);

    if (objRows) {

        open_loading();

        const formElement = document.getElementById("frm_diesel");
        const form = new FormData(formElement);
        form.append('cerrado', true);

        fetch(strUrlSaveDiesel, {
            method: 'POST',
            body: form
        })
        .then(response => response.json())
        .then( (data) => {
            close_loading();

            if (data.status) {
                window.location.href = strUrlInventarioDiesel;
            }

        })
        .catch((error) => {
            close_loading();
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            console.error(error);
        });

    }

}

function change_galones() {
    const objRows = document.querySelectorAll(`input[name="galones[]"]`);

    let intTotal = 0;
    objRows.forEach((element) => {
        intTotal += (element.value * 1);
    });

    document.getElementById('total_extraido').value = intTotal;

}
