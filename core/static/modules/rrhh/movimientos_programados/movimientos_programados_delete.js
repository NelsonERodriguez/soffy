const goBack = () => { window.location = urlBase };

const getEmployee = async (event, objElement) => {
    if (typeof event.key === "undefined" || event.key === "ArrowLeft" || event.key === "ArrowRight" ||
        event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown" ||
        event.key === " " || event.key === "Meta" || event.key === "Tab" || event.key === "Shift" ||
        event.key === "CapsLock" || event.key === "Alt") return false;

    open_loading();
    let strNomina = document.getElementById('slt_nomina').value;
    if((objElement.value).length >= 2 ) {
        let formData = new FormData();
        formData.append('name', objElement.value);
        formData.append('nomina', strNomina);
        formData.append('csrfmiddlewaretoken', valCSRF);
        const response = await fetch(urlGetInfoUsers, {method: 'POST', body: formData});
        const data = await response.json();

        if(data?.status) {
            const content = document.getElementById(objElement.getAttribute('list'));
            let strOptions = '';
            data['response'].map(employee => {
                strOptions += `<option value="${employee.No_Empleado}">${employee.Nombres} ${employee.Apellidos}</option>`;
            });
            content.innerHTML = strOptions;
        }
        else {
            alert_nova.showNotification('Ocurrió un error en la obtención de los movimientos.', 'warning', 'danger');
        }
    }
    close_loading();
};

const deleteMovementByKey = async (intKey, intEmployee) => {
    open_loading();
    let formData = new FormData(),
        sltNomina = document.getElementById('slt_nomina');
    formData.append('key', intKey);
    formData.append('employee', intEmployee);
    formData.append('nomina', sltNomina.value);
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlDeleteMovementsByUser, {method: 'POST', body: formData});
    const data = await response.json();

    if(data.status) {
        alert_nova.showNotification('Movimiento borrado correctamente, espera por favor.', 'add_alert', 'success');
        setTimeout(() => {
            location.reload();
        }, 2500);
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
    close_loading();
};

const drawTableMovementsToUser = async (objMovements) => {
    let content = document.getElementById('tBodyDefault'),
        strElements = '';

    objMovements.map(detail => {
        strElements += `<tr>
                            <td>${detail.No_Empleado}</td>
                            <td>${detail.Nombres} ${detail.Apellidos}</td>
                            <td>${detail.Descripcion}</td>
                            <td>
                                <button type="button" class="btn btn-outline-danger" id="btn-delete-${detail.No_Clave}" onclick="deleteMovementByKey(${detail.No_Clave}, ${detail.No_Empleado})">
                                    <i class="fa fa-trash"></i>
                                </button>
                            </td>
                        </tr>`;
    });
    content.innerHTML = strElements;
};

const getDataMovements = async () => {
    let sltNomina = document.getElementById('slt_nomina'),
        sltEmployee = document.getElementById('employee');
    if(typeof sltNomina == 'undefined' || sltNomina.value == '') {
        alert_nova.showNotification('No puedes buscar sin una nomina seleccionada.', 'warning', 'danger');
        return false;
    }
    if(typeof sltEmployee == 'undefined' || sltEmployee.value == '') {
        alert_nova.showNotification('No puedes buscar sin un empleado seleccionado.', 'warning', 'danger');
        return false;
    }

    open_loading();

    let formData = new FormData();
        formData.append('user', sltEmployee.value);
        formData.append('nomina', sltNomina.value);
        formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetMovementsByUser, {method: 'POST', body: formData});
    const data = await response.json();

    if(data.status) {
        await drawTableMovementsToUser(data.data);
    }
    else {
        let content = document.getElementById('tBodyDefault');
        content.innerHTML = `<tr><td colspan="4" style="text-align: center;">No hay información a mostrar</td></tr>`;
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }

    close_loading();
};