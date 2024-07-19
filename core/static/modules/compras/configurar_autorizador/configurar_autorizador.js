(function () {
    window.body = document.getElementById('bodyTable');

    window.removeRow = (intRow) => {
        document.getElementById(`tr_${intRow}`).remove();
    };

    window.addRow = () => {
        if (body.children.length < countRows) {
            const row = body.insertRow(body.children.length);
            row.id = `tr_${body.children.length}`;

            const cell1 = row.insertCell(0);
            const cell2 = row.insertCell(1);
            const cell3 = row.insertCell(2);
            const cell4 = row.insertCell(3);

            cell1.innerHTML = `<select name="usuario_id[]" class="form-control text-center">
                                            <option value=""></option>
                                            ${optionsConfigurados}
                                        </select>`;
            cell2.innerHTML = `<input type="number" min="1" name="orden_id[]" class="form-control text-center">`;
            cell3.innerHTML = `<input type="number" min="1" name="monto[]" class="form-control text-center">`;
            if (!permMonto) {
                cell3.style.display = 'none';
            }
            cell4.classList.add('text-center')
            cell4.innerHTML = `<input type="hidden" min="1" name="id[]" value="0">
                                        <button class="btn btn-link btn-danger btn-outline-danger" type="button" 
                                        onclick="dialogConfirm(removeRow, ${body.children.length});">
                                            <span class="material-icons">delete</span>
                                        </button>`;
        } else {
            alert_nova.showNotification('No puede configurar mas usuarios.', "warning", "danger");
        }
    };

    window.checkForm = () => {
        // Obtiene todos los elementos select e input
        let selects = document.querySelectorAll('select[name="usuario_id[]"]');
        let inputs = document.querySelectorAll('input[name="orden_id[]"]');

        let selectValues = [];
        let inputValues = [];
        let isDuplicate = false;
        let isEmpty = false;

        // Verifica duplicados en selects
        selects.forEach((select) => {
            if (select.value === "") {
                isEmpty = true;
                return;
            }
            if (selectValues.includes(select.value)) {
                isDuplicate = true;
                return;
            }
            selectValues.push(select.value);
        });

        // Verifica duplicados en inputs
        inputs.forEach((input) => {
            if (input.value === "") {
                isEmpty = true;
                return;
            }
            if (inputValues.includes(input.value)) {
                isDuplicate = true;
                return;
            }
            inputValues.push(input.value);
        });

        // Si hay duplicados, evita que el formulario se envíe
        if (isEmpty) {
            alert_nova.showNotification('No pueden ir datos vacíos.', "warning", "danger");
        } else if (isDuplicate) {
            alert_nova.showNotification('No puede tener la misma configuración duplicada.', "warning", "danger");
        } else {
            dialogConfirm(simple_submit, 'frm_configuracion');
        }
    };
})();
