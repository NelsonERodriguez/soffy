const selectAll = async (strContainer) => {
    const elementSelectAll = document.getElementById(`selectedAll_${strContainer}`);
    if(elementSelectAll) {
        const boolSelected = elementSelectAll.checked;
        const allElements = document.querySelectorAll(`.checkbox-empleados_${strContainer}`);
        allElements.forEach((e) => {
            e.checked = boolSelected;
        });
    }
    return true;
};

const modifyPending = async (intIDElement, intPaymentPending, intQuote, strTab) => {
    const elementRemaining = document.getElementById(`saldo_restante_${strTab}_${intIDElement}`),
        elementModification = document.getElementById(`saldo_pendiente_${strTab}_${intIDElement}`);
    if(elementRemaining) {
        let intRemaining = (elementRemaining.value * 1),
            intModification = (elementModification.value * 1 );
        if(intModification > intPaymentPending) {
            elementRemaining.value = intPaymentPending;
            elementModification.value = intPaymentPending;
            alert_nova.showNotification("La cantidad que desea descontar es mayor a la cuota.", "warning", "danger");
        }
        else {
            elementRemaining.value = (intPaymentPending * 1) - (intModification * 1);
        }
    }
    return true;
};

const cleanOtherTabs = async (strContainer) => {
    for(const k in arrGlobalTabs) {
        const d = arrGlobalTabs[k];
        if(d.id_container !== strContainer) {
            let content = document.getElementById(d.id_container);
            if(content)
                content.innerHTML = '';
        }
    }
};

const deleteDetail = async (intMovement) => {
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', csrfToken);
    formData.append('movement', intMovement);
    const response = await fetch(urlDeleteMovement, {method: 'POST', body: formData});
    const data = await response.json();
    if(data) {
        alert_nova.showNotification(data.message, 'add_alert', 'success');
        setTimeout(() => { location.reload(); }, 2000);
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
};

const deleteMovements = async (strContainer) => {
    let formData = new FormData(document.getElementById(`frm_delete_movements_${strContainer}`));
    const response = await fetch(urlDeleteMovements, {method:'POST', body:formData, headers:{"X-CSRFToken": csrfToken}});
    const data = await response.json();
    if(data.status) {
        alert_nova.showNotification(data.message, "add_alert", "success");
        setTimeout(() => {
            location.reload();
        }, 2500);
    }
    else {
        alert_nova.showNotification(data.message, "warning", "danger");
    }
};

const deleteAllData = async (strContainer) => {
    let elementForm = document.getElementById(`frm_delete_movements_${strContainer}`),
        strElements = '';

    let strSearch = strContainer.replace('container-', '');

    let objTabToSave = arrGlobalTabs[strSearch];

    if(objTabToSave) {
        objTabToSave.data.map((detail, keyRow) => {
            strElements += `<div class="row">
                                <input type='hidden' name='movements[]' value='${detail.id}' />
                            </div>`;
        });
    }
    elementForm.innerHTML = strElements;
    deleteMovements(strContainer);
};

const drawMovements = async (strContainer, bool) => {
    await cleanOtherTabs(strContainer);

    let content = document.getElementById(strContainer),
        strElements = '',
        intTotalPending = 0;

    for(const k in arrGlobalTabs) {
        const d = arrGlobalTabs[k];
        if(d.id_container == strContainer) {
            if(Object.keys(d.data).length > 0){
                d.data.map((detail, key) => {
                    intTotalPending += (detail.saldo_pendiente * 1);
                    strElements += `<tr>
                                        <td>
                                            <input id='checkbox-${detail.cod_empleado}-${detail.tipo_movimiento}' type="checkbox" class="form-control checkbox-empleados_${strContainer}" row="${key}" checked>
                                        </td>
                                        <td>
                                            ${detail.cod_empleado} - ${detail.deudor}
                                        </td>
                                        <td style='text-transform: uppercase;'>${detail.nomina}</td>
                                        <td>${detail.cuota}</td>
                                        <td>${detail.saldo_pendiente}</td>
                                        <td>
                                            <input type="text" class="form-control" value="${detail.saldo_pendiente}" id="saldo_pendiente_${strContainer}_${key}" onchange="modifyPending('${key}', '${detail.saldo_pendiente}', '${detail.cuota}', '${strContainer}')">
                                            <input type="hidden" value="0" id="saldo_restante_${strContainer}_${key}">
                                        </td>
                                        <td>
                                            <button type="button" rel="tooltip" class="btn btn-link btn-just-icon btn-danger" data-original-title="Eliminar" onclick="dialogConfirm(deleteDetail, '${detail.id}', '¿Desea eliminar?', '¡No podrás revertir esto!', 'error');">
                                                <i class="material-icons">delete_outline</i>
                                            </button>
                                        </td>
                                    </tr>`;
                });
            }
            else {
                strElements = ` <tr> <td colspan='7'>No hay informacion a mostrar</td> </tr>`;
            }
        }
    }

    if(content) {
        content.innerHTML = `   <div class="row">
                                    <div class="col text-right">
                                        <button type="button" class="btn btn-outline-danger" onclick="dialogConfirm(deleteAllData, '${strContainer}', '¿Desea eliminar?', '¡No podrás revertir esto!', 'error');">
                                            <i class="fa fa-trash"></i>
                                            Eliminar Todos los Registros
                                        </button>
                                    </div>
                                    <div class="col-12">
                                        <table class="table">
                                            <thead>
                                                <tr>
                                                    <th>
                                                        Seleccionar Todos
                                                        <input type="checkbox" name="selectedAll" id="selectedAll_${strContainer}" class="form-control" onclick="selectAll('${strContainer}')" checked>
                                                    </th>
                                                    <th>Empleado</th>
                                                    <th>Nomina</th>
                                                    <th>Cuota</th>
                                                    <th>Saldo Pendiente</th>
                                                    <th>Monto a Descontar</th>
                                                    <th>Opciones</th>
                                                </tr>
                                            </thead>
                                            <tbody id="tBodyContent">${strElements}</tbody>
                                            <tfoot>
                                                <tr>
                                                    <th colspan="3" style='text-align:center;'>Total Saldo Pendiente</th>
                                                    <th>${numberFormat.format((intTotalPending * 1).toFixed(2))}</th>
                                                    <th colspan="3"></th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                        <form id="frm_save_movements_${strContainer}" enctype="multipart/form-data"></form>
                                        <form id="frm_delete_movements_${strContainer}" enctype="multipart/form-data"></form>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-12 text-center">
                                        <button type="button" class="btn btn-outline-success" onclick="saveMovements('${strContainer}');">
                                            <i class="fa fa-save"></i>
                                            Mover a Nomina
                                        </button>
                                    </div>
                                </div>`;
    }
};

const sendMovements = async (strContainer) => {
    let formData = new FormData(document.getElementById(`frm_save_movements_${strContainer}`));
    const response = await fetch(urlSaveMovements, {method:'POST', body:formData, headers:{"X-CSRFToken": csrfToken}});
    const data = await response.json();
    if(data.status) {
        alert_nova.showNotification(data.message, "add_alert", "success");
        setTimeout(() => {
            location.reload();
        }, 2500);
    }
    else {
        alert_nova.showNotification(data.message, "warning", "danger");
    }
};

const saveMovements = (strContainer) => {
    let elementForm = document.getElementById(`frm_save_movements_${strContainer}`),
        strElements = '',
        intSelected = 0;

    let strSearch = strContainer.replace('container-', '');

    let objTabToSave = arrGlobalTabs[strSearch];

    if(objTabToSave) {
        objTabToSave.data.map((detail, keyRow) => {
            let inputCheck = document.getElementById(`checkbox-${detail.cod_empleado}-${detail.tipo_movimiento}`);
            if(inputCheck.checked) {
                let intDiscount = (document.getElementById(`saldo_pendiente_${strContainer}_${keyRow}`).value * 1).toFixed(2),
                    intPending = (document.getElementById(`saldo_restante_${strContainer}_${keyRow}`).value * 1).toFixed(2);
                strElements += `<div class="row">
                                    <input type='hidden' name='deudor[]' value='${detail.cod_empleado}' />
                                    <input type='hidden' name='descontar[]' value='${intDiscount}' />
                                    <input type='hidden' name='pendiente[]' value='${intPending}' />
                                    <input type='hidden' name='tipo_movimiento[]' value='${strSearch}' />
                                </div>`;
                intSelected++;
            }
        });
    }
    if(intSelected <= 0) {
        alert_nova.showNotification("No hay información a guardar, selecciona al menos un empleado.", "warning", "danger");
    }
    elementForm.innerHTML = strElements;
    sendMovements(strContainer);
};

const drawTabs = async (arrTabs) => {
    let strLi = '',
        boolFirst = true,
        strPanes = '',
        strFirst = '';
    for(const k in arrTabs) {
        const d = arrTabs[k];

        let strActive = '';
        if(boolFirst) {
            boolFirst = false;
            strActive = 'active';
            strFirst = d.id_container;
        }
        strLi += `  <li class="nav-item">
                        <a class="nav-link ${strActive}" data-toggle="tab" href="#${d.id_container}" role="tablist" onclick="drawMovements('${d.id_container}', true)">
                            <i class="${d.icon}"></i> ${d.str_name}
                        </a>
                    </li>`;
        strPanes += `<div class="tab-pane ${strActive}" id="${d.id_container}"></div>`;
    }

    let elements = `<ul class="nav nav-pills nav-pills-warning nav-pills-icons justify-content-center" role="tablist"> ${strLi} </ul>
                    <div class="tab-content tab-space tab-subcategories"> ${strPanes} </div>`;
    document.getElementById('content-tabs').innerHTML = elements;

    return strFirst;
};

const makeObjMovements = async () => {
    let arrResult = [];
    arrMovements.map(movement => {
        let strIcon = '',
            strName = '';

        if(movement.tipo_movimiento == 'cuotas_ahorro') {
            strIcon = 'far fa-piggy-bank';
            strName = 'Ahorro';
        }
        else if(movement.tipo_movimiento == 'cuotas_csl') {
            strIcon = 'fas fa-credit-card';
            strName = 'Cuotas San Luis';
        }
        else if(movement.tipo_movimiento == 'cuota_seguro') {
            strIcon = 'fas fa-medkit';
            strName = 'Cuota de Seguro';
        }
        else if(movement.tipo_movimiento == 'cuota_jornadas') {
            strIcon = 'fas fa-syringe';
            strName = 'Cuota de Vacunas, <br> Jornadas y Bazares';
        }
        else if(movement.tipo_movimiento == 'microcreditos') {
            strIcon = 'far fa-coins';
            strName = 'Microcreditos';
        }
        else if(movement.tipo_movimiento == 'cuotas_figua') {
            strIcon = 'fal fa-sack-dollar';
            strName = 'Cuotas Figua';
        }
        else if(movement.tipo_movimiento == 'farmacia') {
            strIcon = 'far fa-briefcase-medical';
            strName = 'Farmacia';
        }
        else if(movement.tipo_movimiento == 'cuotas_otros') {
            strIcon = 'fad fa-random';
            strName = 'Otros';
        }

        if(typeof arrResult[movement.tipo_movimiento] != 'undefined') {
            let objTMP = arrResult[movement.tipo_movimiento];
            objTMP['data'].push(movement);
        }
        else {
            arrResult[movement.tipo_movimiento] = {
                'type_movement': movement.tipo_movimiento,
                'str_name': strName,
                'icon': strIcon,
                'id_container': `container-${movement.tipo_movimiento}`,
                'data': [movement],
            };
        }
    });
    arrGlobalTabs = arrResult;
    let strFirstTab = await drawTabs(arrResult);
    drawMovements(strFirstTab, true)
};

makeObjMovements();