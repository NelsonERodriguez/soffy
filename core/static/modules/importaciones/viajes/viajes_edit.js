const makeOptPorts = (objPorts, option = '') => {
    let strReturn = '';
    if(option && !isNaN(option)) {
        if(Object.keys(objPorts).length > 0) {
            objPorts.map(d => {
                let strSelected = (d.id == option) ? 'selected' : '';
                strReturn += `<option value='${d.id}' ${strSelected}>${d.name}</option>`;
            });
        }
    }
    return strReturn;
};

const getNamePort = (objPorts, option = '') => {
    let strReturn = '';
    if(option && !isNaN(option)) {
        if(Object.keys(objPorts).length > 0) {
            let objExist = objPorts.find(d => d.id == option);
            if(objExist)
                strReturn = objExist.name;
        }
    }
    return strReturn;
};

const getNextIntRow = async () => {
    const objTr = document.querySelectorAll(`tr[id^="tr_"]`);
    let intReturn = 1;
    objTr.forEach(element => {
        const strId = element.id,
            arrSplitId = strId.split('_'),
            intId = parseInt(arrSplitId[1]);
        if (intId > intReturn)
            intReturn = intId;
    });
    intReturn++;
    return intReturn;
};

const formatDateTimeAnStr = (strDate) => {
    let strReturn = (strDate.getFullYear()) ? `${strDate.getFullYear()}-${zfill(strDate.getMonth() + 1, 2)}-${zfill(strDate.getDate(), 2)}T${zfill(strDate.getHours(), 2)}:${zfill(strDate.getMinutes(), 2)}` : '';
    return strReturn;
};

const deleteShip = async (intRowDelete) => {
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('detail', intRowDelete);
    const response = await fetch(urlDeleteDetail, {method: 'POST', body: formData});
    const data = await response.json();
    if(data?.status)
        return data.status;
    return false;
};

const drawManualPrevRowAtDelete = async (objPrev, objToReplaceRow, objNext) => {
    let elementPrevRow = document.getElementById(`tr_${objPrev.row}`),
        boolEdit = !elementPrevRow.classList.contains('table-info');

    let strOptions = makeOptPorts(objGlobalOptPorts, parseInt(objToReplaceRow.id)),
        elementPort = elementLlegada = elementSalida = elementBarco = '';

    let last_arrive = document.getElementById(`fecha_llegada_${objPrev.row}`).value,
        elementExist = document.getElementById(`exist_${objPrev.row}`),
        dateOut = new Date(last_arrive),
        prevOut = new Date(last_arrive);

    let intHoursStay = (objToReplaceRow?.transfer_time ? objToReplaceRow.transfer_time : 0) * 3600000;
    prevOut.setTime(dateOut.getTime() + intHoursStay);
    let last_out = formatDateTimeAnStr(prevOut);

    let strExist = (elementExist) ? `<input type='hidden' id='exist_${objPrev.row}' value='${objPrev.row}' name='exist[]' />` : '';
    if(boolEdit) {
        elementPort = `${strExist}<select name="pais[]" id="pais_${objPrev.row}" class="form-control">${strOptions}</select>`;
        elementLlegada = `<input type="datetime-local" name="fecha_llegada[]"
                onchange="changeDateAuto('${objPrev.row}', 'llegada')"
                id="fecha_llegada_${objPrev.row}" class="form-control" value="${last_arrive}" />`;
        elementSalida = `<input type="datetime-local" name="fecha_salida[]"
                            onchange="changeDateAuto('${objPrev.row}', 'salida')"
                            id="fecha_salida_${objPrev.row}" class="form-control" value="${last_out}" />`;
    }
    else {
        let prevDateArrive = new Date(last_arrive),
            prevDateOut = new Date(last_out),
            strArriveShow = `${zfill(prevDateArrive.getDate(), 2)}/${zfill(prevDateArrive.getMonth() + 1, 2)}/${prevDateArrive.getFullYear()} ${zfill(prevDateArrive.getHours(), 2)}:${zfill(prevDateArrive.getMinutes(), 2)}`,
            strOutShow = `${zfill(prevDateOut.getDate(), 2)}/${zfill(prevDateOut.getMonth() + 1, 2)}/${prevDateOut.getFullYear()} ${zfill(prevDateOut.getHours(), 2)}:${zfill(prevDateOut.getMinutes(), 2)}`;
        elementPort = ` ${strExist}
                        <p>${objToReplaceRow.name}</p>
                        <input type='hidden' name='pais[]' id='pais_${objPrev.row}' value='${objToReplaceRow.id}' />`;
        elementLlegada = `  <p>${strArriveShow}</p>
                            <input type='hidden' name='fecha_llegada[]' id="fecha_llegada_${objPrev.row}" value='${last_arrive}' />`;
        elementSalida = `   <p>${strOutShow}</p>
                            <input type='hidden' name='fecha_salida[]' id="fecha_salida_${objPrev.row}" value='${last_out}' />`;
    }
    elementPrevRow.children[1].innerHTML = elementPort;
    elementPrevRow.children[2].innerHTML = elementLlegada;
    elementPrevRow.children[3].innerHTML = elementSalida;
    return true;
};

const getLastRowInRule = async () => {
    let intLastRowRule = 0;
    objGlobalOptPorts.map(d => {
        if(d.initial_lap)
            intLastRowRule = d.id;
    });
    return intLastRowRule;
};

const getNameNexShip = async (intLastRowInRule) => {
    let elmLastNameShip = document.getElementById(`detalle_nombre_barco_${intLastRowInRule}`);
    if(elmLastNameShip) {
        let strLastNameShip = elmLastNameShip.value;
        let arrNames = strLastNameShip.split(' ');
        let strPrev = '';
        arrNames.forEach(str => {
            if(str !== '' && !isNaN(str))
                str = (str * 1) + 1;
            strPrev += `${str} `;
        });
        return strPrev.trim();
    }
    return '';
};

const sendFormToCreateNew = async (boolLastInRule = false) => {
    let formData = new FormData(document.getElementById('formNewShip'));
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('proveedor_barco', intID);
    const response = await fetch(urlSaveData, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status) {
        if(boolLastInRule)
            alert_nova.showNotification('Nuevo barco creado correctamente, espera por favor.');
        return true;
    }
    else {
        if(boolLastInRule)
            alert_nova.showNotification('Ocurrio un error al guardar el nuevo barco, contacta con soporte.', 'warning', 'danger');
        return false;
    }
};

const makeNewShipSuggestion = async (intLastRowInRule, boolLastInRule = false) => {
    let strNameShip = '',
        objRowsNewShip = document.querySelectorAll(`tr[id^="tr_"]`),
        containerForm = document.getElementById('formNewShip'),
        elementProvider = document.getElementById('proveedor_barco');
    if(Object.keys(objRowsNewShip).length > 0) {
        containerForm.innerHTML = '';
        let strElements = '';
        let intLengthShips = Object.keys(objRowsNewShip).length;
        let intLastElement = objRowsNewShip[intLengthShips - 1];
        if(intLastElement) {
            let intRowLastElement = intLastElement.getAttribute('row'),
                elmNameShip = document.getElementById(`detalle_nombre_barco_${intRowLastElement}`);
            if(elmNameShip) {
                strNameShip = elmNameShip.value;
                objRowsNewShip.forEach(element => {
                    const intAttrRow = element.getAttribute('row');
                    if(intAttrRow) {
                        let boolDraw = (boolLastInRule) ? ((intAttrRow * 1) >= (intLastRowInRule * 1)) : ((intAttrRow * 1) > (intLastRowInRule * 1));

                        if(boolDraw) {
                            let elmCountry = document.getElementById(`pais_${intAttrRow}`),
                                elmDateArrive = document.getElementById(`fecha_llegada_${intAttrRow}`),
                                elmDateOut = document.getElementById(`fecha_salida_${intAttrRow}`);
                            if(elmCountry && elmDateArrive && elmDateOut) {
                                strElements += `<div class='containers-new-dates'>
                                                    <input type='hidden' class='new-suggestion' name='exist[]' value='0' />
                                                    <input type='hidden' name='pais[]' value='${elmCountry.value}' />
                                                    <input type='hidden' name='fecha_salida[]' value='${elmDateOut.value}' />
                                                    <input type='hidden' name='fecha_llegada[]' value='${elmDateArrive.value}' />
                                                    <input type='hidden' name='detalle_nombre_barco[]' value='${strNameShip}' />
                                                    <input class='form-control' type='hidden' name='barco[]' value='0' >
                                                </div>`;
                            }
                        }
                    }
                });
                strElements += `<input type='hidden' name='nombre' value='${strNameShip}' />
                                <input type='hidden' name='proveedor_barco' value='${elementProvider.value}' />`;
                containerForm.insertAdjacentHTML('beforeend', strElements);

                return boolMakeNewShip = await sendFormToCreateNew(boolLastInRule);
            }
        }
    }
    return false;
};

const addAllRowsSuggestion = async (intLastRowInRule, boolLastInRule = false) => {
    if(boolExistData) {
        open_loading();
        let strNewNameShip = '',
            objAllRoutesInRule = [];

        if(boolLastInRule) {
            strNewNameShip = await getNameNexShip(intLastRowInRule);
            objAllRoutesInRule = objGlobalOptPorts.filter(d => d.initial_lap == true);
        }
        else {
            let elmLastPais = document.getElementById(`pais_${intLastRowInRule}`),
                elmLastNameShip = document.getElementById(`detalle_nombre_barco_${intLastRowInRule}`);
            if(elmLastPais && elmLastNameShip) {
                strNewNameShip = elmLastNameShip.value;
                objAllRoutesInRule = objGlobalOptPorts.filter(d => (d.initial_lap == true && d.id > parseInt(elmLastPais.value)));
            }
        }

        const objDateOut = document.getElementById(`fecha_salida_${intLastRowInRule}`),
            objDateArrive = document.getElementById(`fecha_llegada_${intLastRowInRule}`),
            strNameShip = strNewNameShip,
            strDateOut = objDateOut.value.trim(),
            strDateArrive = objDateArrive.value.trim();
        if(strDateOut !== '' && strDateArrive !== '' && Object.keys(objAllRoutesInRule).length > 0) {
            let last_arrive = strDateArrive,
                last_out = strDateOut,
                intRow = await getNextIntRow(),
                timeNow = new Date(),
                dayNow = timeNow.getDay();
            
            objAllRoutesInRule.map((detail) => {
                let dateArrive = new Date(last_out),
                    prevArrive = new Date(last_out),
                    intHoursStay = detail.stay_end * 3600000,
                    intHoursTransfer = (detail?.transfer_time ? detail.transfer_time : 0) * 3600000;
                prevArrive.setTime(dateArrive.getTime() + intHoursTransfer);
                last_arrive = formatDateTimeAnStr(prevArrive);
                let dateOut = new Date(last_arrive),
                    prevOut = new Date(last_arrive);
                prevOut.setTime(dateOut.getTime() + intHoursStay);
                last_out = formatDateTimeAnStr(prevOut);

                let intDifferenceTime = intGlobalDifferenceTime;
                if(dayNow === 1)
                    intDifferenceTime = (intGlobalDifferenceTime * 3);

                let formatOut = new Date(last_out),
                    boolCanEdit = (!((timeNow.getTime() - formatOut.getTime()) > intDifferenceTime)),
                    strExist = strLlegada = strSalida = strClass = strButton = strElementNameShip = '';
                if(boolCanEdit) {
                    let strOptions = makeOptPorts(objGlobalOptPorts, detail.id);
                    strElementNameShip = `<input name='detalle_nombre_barco[]' id='detalle_nombre_barco_${intRow}' type='text' class='form-control' value='${strNameShip}' />
                                            <input class='form-control' type='hidden' name='barco[]' value='0' >`;

                    strExist = `<select name="pais[]" id="pais_${intRow}" class="form-control">${strOptions}</select>`;

                    strLlegada = `  <input type="datetime-local" name="fecha_llegada[]"
                                        onchange="changeDateAuto('${intRow}', 'llegada')"
                                        id="fecha_llegada_${intRow}" class="form-control" value="${last_arrive}" />`;

                    strSalida = `<input type="datetime-local" name="fecha_salida[]"
                                    onchange="changeDateAuto('${intRow}', 'salida')"
                                    id="fecha_salida_${intRow}" class="form-control" value="${last_out}" />`;

                    strButton = `   <button class="btn btn-outline-danger" type="button" onclick="dialogConfirm(deleteRow, [${intRow}, false]);">
                                        <span class="material-icons">delete</span>
                                    </button>`;
                }
                else {
                    strClass = 'table-info';
                    strElementNameShip = `<input name='detalle_nombre_barco[]' id='detalle_nombre_barco_${intRow}' type='hidden' class='form-control' value='${strNameShip}' />
                                    <input class='form-control' type='hidden' name='barco[]' value='0' >
                                    <p id='p_detalle_nombre_barco_${intRow}'>${strNameShip}</p>`;
                    strExist = `<p>${detail.name}</p>
                                <input type='hidden' name='pais[]' id='pais_${intRow}' value='${detail.id}' />`
                    let prevDateArrive = new Date(last_arrive),
                        prevDateOut = new Date(last_out),
                        strArriveShow = `${zfill(prevDateArrive.getDate(), 2)}/${zfill(prevDateArrive.getMonth() + 1, 2)}/${prevDateArrive.getFullYear()} ${zfill(prevDateArrive.getHours(), 2)}:${zfill(prevDateArrive.getMinutes(), 2)}`,
                        strOutShow = `${zfill(prevDateOut.getDate(), 2)}/${zfill(prevDateOut.getMonth() + 1, 2)}/${prevDateOut.getFullYear()} ${zfill(prevDateOut.getHours(), 2)}:${zfill(prevDateOut.getMinutes(), 2)}`;
                    strLlegada = `<p>${strArriveShow}</p>
                                    <input type='hidden' name='fecha_llegada[]' id="fecha_llegada_${intRow}" value='${last_arrive}' />`;
                    strSalida = `<p>${strOutShow}</p>
                                    <input type='hidden' name='fecha_salida[]' id="fecha_salida_${intRow}" value='${last_out}' />`;
                }
                
                let strShip = document.getElementById('nombre').value;
                let strRow = `  <tr id="tr_${intRow}" row="${intRow}" class='${strClass} trSuggestion'>
                                    <td>${strElementNameShip}</td>
                                    <td>${strExist}</td>
                                    <td>${strLlegada}</td>
                                    <td>${strSalida}</td>
                                    <td class="text-center" id='content-buttons-${intRow}'>${strButton}</td>
                                </tr>`;
                document.getElementById('tBodyPrincipal').insertAdjacentHTML('beforeend', strRow);
                intRow++;
            });

            let boolNewShip = await makeNewShipSuggestion(intLastRowInRule, boolLastInRule);
            
            if(boolNewShip)
                sendFormToSave(true);
        }
        else
            alert_nova.showNotification('No hay informacion valida para calcular', 'warning', 'danger');
        close_loading();
    }
    else
        alert_nova.showNotification('Tienes que guardar para poder hacer una proyección.', 'warning', 'danger');
};

const addButtonSuggestion = async () => {
    const objTrs = document.querySelectorAll(`tr[id^="tr_"]`),
        btnExistSuggestion = document.getElementById('btnSuggestionRoute');
    if(btnExistSuggestion)
        btnExistSuggestion.parentNode.removeChild(btnExistSuggestion);

    let intLastRowInRule = 0,
        defaultLastRowInRule = await getLastRowInRule(),
        boolLastInRule = false;
    objTrs.forEach(element => {
        const intRw = element.getAttribute('row');
        if(intRw) {
            let strElement = document.getElementById(`pais_${intRw}`);
            intLastRowInRule = intRw;
            if(strElement && strElement.value == defaultLastRowInRule) {
                boolLastInRule = true;
            }
            else
                boolLastInRule = false;
        }
    });

    const contentButton = document.getElementById(`content-buttons-${intLastRowInRule}`);
    if(boolExistData) {
        if(contentButton) {
            let strBtnSuggestion = `<button class='btn btn-success' type='button' id='btnSuggestionRoute' row-sugestion="${intLastRowInRule}">
                                        <i class="far fa-fast-forward"></i>
                                    </button>`;
            contentButton.insertAdjacentHTML('beforeend', strBtnSuggestion);

            let btnSuggestion = document.getElementById('btnSuggestionRoute');
            btnSuggestionRoute.addEventListener('click', () => {
                addAllRowsSuggestion(intLastRowInRule, boolLastInRule);
            });
        }
    }
};

const deleteRow = async (arrParams) => {
    open_loading();
    let intRowDelete = (arrParams[0]) ? arrParams[0] : 0,
        boolExist = (arrParams[1]) ? arrParams[1] : false;
    const objTr = document.querySelectorAll(`tr[id^="tr_"]`);
    let objPrev = {},
        objCurrent = {},
        objNext = {},
        boolFind = false;

    objTr.forEach((element, k) => {
        let intRw = element.getAttribute('row');
        if (intRw) {
            let intPort = document.getElementById(`pais_${intRw}`).value;
            if(!boolFind) {
                if((intRw == intRowDelete)) {
                    let objFind = objGlobalOptPorts.find(d => d.id == intPort);
                    objFind.row = intRw;

                    boolFind = true;
                    objCurrent = objFind;
                    if (typeof objTr[k - 1] !== 'undefined') {
                        let elm = objTr[k - 1];
                        let iRw = elm.getAttribute('row');
                        let iPrt = document.getElementById(`pais_${iRw}`).value;
                        let objFind = objGlobalOptPorts.find(d => d.id == iPrt);
                        objFind.row = iRw;
                        objPrev = objFind;
                    }

                    if (typeof objTr[k + 1] !== 'undefined') {
                        let elm = objTr[k + 1];
                        let iRw = elm.getAttribute('row');
                        let iPrt = document.getElementById(`pais_${iRw}`).value;
                        let objFind = objGlobalOptPorts.find(d => d.id == iPrt);
                        objFind.row = iRw;
                        objNext = objFind;
                    }
                }
            }
        }
    });

    if(boolExist && (!objPrev?.id || !objNext?.id)) {
        let boolDelete = await deleteShip(intRowDelete);
        if (boolDelete) {
            document.getElementById(`tr_${intRowDelete}`).remove();
            alert_nova.showNotification('Registro eliminado correctamente');
        }
    }
    else if(objPrev.id && objCurrent.id && objNext.id) {
        let objToReplaceRow = objGlobalOptPorts.find(d => d.initial_port_id == objPrev.initial_port_id && d.final_port_id == objNext.initial_port_id);

        if(!objToReplaceRow)
            alert_nova.showNotification(`No puedes eliminar si no hay una ruta entre ${objPrev.port_init} y ${objNext.port_init}`, 'warning', 'danger');
        else {
            let drawPrev = await drawManualPrevRowAtDelete(objPrev, objToReplaceRow, objNext);
            // NELSON esto funciona, solo esta comentado para que no me lo borre :(
            if(boolExist) {
                boolDelete = await deleteShip(intRowDelete);
            }
            document.getElementById(`tr_${intRowDelete}`).remove();
            changeDateAuto(objPrev.row, 'salida', true);
        }
    }
    else if(!boolExist) {
        document.getElementById(`tr_${intRowDelete}`).remove();
    }
    close_loading();
    addButtonSuggestion();
};

const validateFormToAdd = async () => {
    let boolReturn = false;
    const strNameCountry = document.getElementById('nombre'),
        strNamePort = document.getElementById('new_country'),
        strDateOut = document.getElementById('new_date_out'),
        strDateArrive = document.getElementById('new_date_arrive');
    if(strNameCountry.value.trim() === '')
        strNameCountry.style.setProperty('border', '1px red solid')
    else if (strNamePort.value.trim() === '')
        strNamePort.style.setProperty('border', '1px red solid')
    else if (strDateArrive.value.trim() === '')
        strDateArrive.style.setProperty('border', '1px red solid')
    else if (strDateOut.value.trim() === '')
        strDateOut.style.setProperty('border', '1px red solid')
    else {
        boolReturn = true;
        strNameCountry.style.removeProperty('border');
        strNamePort.style.removeProperty('border');
        strDateOut.style.removeProperty('border');
        strDateArrive.style.removeProperty('border');
    }
    return boolReturn;
};

const addIndividualRow = async () => {
    strLastPort = '';
    let boolValidate = await validateFormToAdd();
    if(boolValidate) {
        const objPort = document.getElementById('new_country'),
            strDateOut = document.getElementById('new_date_out').value.trim(),
            strDateArrive = document.getElementById('new_date_arrive').value.trim(),
            strPais = objPort.value.trim();
        let intRow = await getNextIntRow(),
            strOptions = makeOptPorts(objGlobalOptPorts, strPais),
            timeNow = new Date(),
            dayNow = timeNow.getDay();

        let intDifferenceTime = intGlobalDifferenceTime;
        if(dayNow === 1)
            intDifferenceTime = (intGlobalDifferenceTime * 3);

        let formatOut = new Date(strDateOut);
        let boolCanEdit = (!((timeNow.getTime() - formatOut.getTime()) > intDifferenceTime)),
            strRow = '',
            strNombreBarco = document.getElementById('nombre').value;

        if(boolCanEdit) {
            strRow = `  <tr id="tr_${intRow}" row="${intRow}">
                            <td>
                                <input type='text' class='form-control' id='detalle_nombre_barco_${intRow}' value='${strNombreBarco}' name='detalle_nombre_barco[]' />
                                <input class='form-control' type='hidden' name='barco[]' value='0' >
                            </td>
                            <td>
                                <input type='hidden' value='0' name='exist[]' />
                                <select name="pais[]" id="pais_${intRow}" class="form-control">${strOptions}</select>
                            </td>
                            <td><input type="datetime-local" name="fecha_llegada[]" id="fecha_llegada_${intRow}" class="form-control" value="${strDateArrive}"></td>
                            <td><input type="datetime-local" name="fecha_salida[]" id="fecha_salida_${intRow}" class="form-control" value="${strDateOut}"></td>
                            <td class="text-center" id='content-buttons-${intRow}'>
                                <button class="btn btn-outline-danger" type="button" onclick="dialogConfirm(deleteRow, [${intRow}, false]);">
                                    <span class="material-icons">delete</span>
                                </button>
                            </td>
                        </tr>`;
        }
        else {
            let prevDateArrive = new Date(strDateArrive),
                prevDateOut = new Date(strDateOut),
                strArriveShow = `${zfill(prevDateArrive.getDate(), 2)}/${zfill(prevDateArrive.getMonth() + 1, 2)}/${prevDateArrive.getFullYear()} ${zfill(prevDateArrive.getHours(), 2)}:${zfill(prevDateArrive.getMinutes(), 2)}`,
                strOutShow = `${zfill(prevDateOut.getDate(), 2)}/${zfill(prevDateOut.getMonth() + 1, 2)}/${prevDateOut.getFullYear()} ${zfill(prevDateOut.getHours(), 2)}:${zfill(prevDateOut.getMinutes(), 2)}`;
            let strNamePort = getNamePort(objGlobalOptPorts, parseInt(strPais));
            strRow = `  <tr id="tr_${intRow}" row="${intRow}" class='table-info'>
                            <td>
                                <p id='p_detalle_nombre_barco_${intRow}'>${strNombreBarco}</p>
                                <input type='hidden' class='form-control' id='detalle_nombre_barco_${intRow}' value='${strNombreBarco}' name='detalle_nombre_barco[]' />
                                <input class='form-control' type='hidden' name='barco[]' value='0' >
                            </td>
                            <td>
                                <input type='hidden' value='0' name='exist[]' />
                                <p>${strNamePort}</p>
                                <input type='hidden' name='pais[]' id='pais_${intRow}' value='${strPais}' />
                            </td>
                            <td>
                                <p>${strArriveShow}</p>
                                <input type="hidden" name="fecha_llegada[]" id="fecha_llegada_${intRow}" value="${strDateArrive}">
                            </td>
                            <td>
                                <p>${strOutShow}</p>
                                <input type="hidden" name="fecha_salida[]" id="fecha_salida_${intRow}" value="${strDateOut}">
                            </td>
                            <td class="text-center" id='content-buttons-${intRow}'></td>
                        </tr>`;
        }
        document.getElementById('tBodyPrincipal').insertAdjacentHTML('beforeend', strRow);
    }
    else
        alert_nova.showNotification("Ingrese los valores requeridos", "warning", "danger");

    addButtonSuggestion();
};

const changeDateAuto = (intCurrentRow, strInput, boolReload = false) => {
    if(Object.keys(objGlobalOptPorts).length > 0) {
        let inputEdited = document.getElementById(`fecha_${strInput}_${intCurrentRow}`);
        if(inputEdited) {
            let last_arrive = inputEdited.value,
                last_out = inputEdited.value,
                dataPrevRow = {},
                boolFind = false;

            const objRows = document.querySelectorAll(`tr[id^="tr_"]`);
            objRows.forEach(row => {
                let intRow = row.getAttribute('row'),
                    boolNotOperar = row.classList.contains('no-operar');
                if(((intRow == intCurrentRow) || boolFind) && !boolNotOperar) {
                    const strPais = document.getElementById(`pais_${intRow}`);
                    if (strPais) {
                        let objExist = objGlobalOptPorts.find(d => d.id == strPais.value);
                        if(objExist) {
                            if(!boolFind) {
                                last_arrive = inputEdited.value;
                                let dateOut = new Date(last_arrive),
                                    prevOut = new Date(last_arrive),
                                    intHoursStay = objExist.stay_end * 3600000,
                                    elementSalida = document.getElementById(`fecha_salida_${intRow}`);

                                if (strInput == 'llegada') {
                                    prevOut.setTime(dateOut.getTime() + intHoursStay);
                                    last_out = formatDateTimeAnStr(prevOut);
                                    elementSalida.value = last_out;
                                }
                                else if(strInput == 'salida')
                                    last_out = inputEdited.value;
                                dataPrevRow = objExist;
                            }
                            else {
                                if (dataPrevRow) {
                                    let objExistRoute = objGlobalOptPorts.find(d => d.initial_port_id == dataPrevRow.id && d.final_port_id == objExist.id);

                                    if(objExistRoute)
                                        dataPrevRow = objExistRoute;
                                    else
                                        dataPrevRow = objExist;
                                    let dateArrive = new Date(last_out),
                                        prevArrive = new Date(last_out);
                                    prevArrive.setTime(dateArrive.getTime() + (objExist.transfer_time * 3600000));
                                    last_arrive = formatDateTimeAnStr(prevArrive);
                                    document.getElementById(`fecha_llegada_${intRow}`).value = last_arrive;

                                    let dateOut = new Date(last_arrive),
                                        prevOut = new Date(last_arrive);
                                    prevOut.setTime(dateOut.getTime() + (objExist.stay_end * 3600000));
                                    last_out = formatDateTimeAnStr(prevOut);
                                    document.getElementById(`fecha_salida_${intRow}`).value = last_out;
                                }
                            }
                            boolFind = true;
                        }
                    }
                }
                else if((intRow == intCurrentRow) || boolFind){
                    if (dataPrevRow) {
                        const strPais = document.getElementById(`pais_${intRow}`);
                        let intPrevRow = row.getAttribute('prev-row');
                        let prevLlegadaRow = document.getElementById(`fecha_llegada_${intPrevRow}`).value
                        document.getElementById(`fecha_llegada_${intRow}`).value = prevLlegadaRow;

                        let prevSalidaRow = document.getElementById(`fecha_salida_${intPrevRow}`).value
                        document.getElementById(`fecha_salida_${intRow}`).value = prevSalidaRow;
                    }
                }
            });

            if(boolReload)
                sendFormToSave();
        }
        else
            console.error('Error inesperado, el elemento que buscamos no existe');
    }
    else
        console.error('Error inesperado, el objeto de puertos esta vacio');
};

const drawAutoRowsByPorts = async (objToPorts, strPortInit) => {
    open_loading();
    const objDateOut = document.getElementById('new_date_out'),
        objDateArrive = document.getElementById('new_date_arrive'),
        strNameShip = document.getElementById('nombre').value,
        strDateOut = objDateOut.value.trim(),
        strDateArrive = objDateArrive.value.trim();
    if(strDateOut !== '' && strDateArrive !== '') {
        let last_arrive = strDateArrive,
            last_out = strDateOut,
            intRow = await getNextIntRow(),
            boolInitProcess = false,
            prevPosition = {};

        let timeNow = new Date(),
            dayNow = timeNow.getDay();
        
        objToPorts.map((detail) => {
            if((detail.id == strPortInit || boolInitProcess) && detail.initial_lap) {
                if(!boolInitProcess) {
                    let intHoursStay = detail.stay_end * 3600000,
                        intHoursTransfer = detail.transfer_time * 3600000;
                    boolInitProcess = true;
                    let dateArrive = new Date(last_arrive),
                        prevArrive = new Date(last_arrive),
                        dateOut = new Date(last_out),
                        prevOut = new Date(last_out),
                        totalHours = intHoursStay + intHoursTransfer;
                    prevArrive.setTime(dateArrive.getTime());
                    prevOut.setTime(dateOut.getTime());
                    last_arrive = formatDateTimeAnStr(prevArrive);
                    last_out = formatDateTimeAnStr(prevOut);
                }
                else {
                    let dateArrive = new Date(last_out),
                        prevArrive = new Date(last_out),
                        intHoursStay = detail.stay_end * 3600000,
                    intHoursTransfer = (detail?.transfer_time ? detail.transfer_time : 0) * 3600000;
                    prevArrive.setTime(dateArrive.getTime() + intHoursTransfer);
                    last_arrive = formatDateTimeAnStr(prevArrive);
                    let dateOut = new Date(last_arrive),
                        prevOut = new Date(last_arrive);
                    prevOut.setTime(dateOut.getTime() + intHoursStay);
                    last_out = formatDateTimeAnStr(prevOut);
                    prevPosition = detail;
                }

                let intDifferenceTime = intGlobalDifferenceTime;
                if(dayNow === 1)
                    intDifferenceTime = (intGlobalDifferenceTime * 3);

                let formatOut = new Date(last_out);
                let boolCanEdit = (!((timeNow.getTime() - formatOut.getTime()) > intDifferenceTime));

                let strExist = strLlegada = strSalida = strClass = strButton = strElementNameShip = '';
                if(boolCanEdit) {
                    let strOptions = makeOptPorts(objGlobalOptPorts, detail.id);
                    strElementNameShip = `<input name='detalle_nombre_barco[]' id='detalle_nombre_barco_${intRow}' type='text' class='form-control' value='${strNameShip}' />
                                            <input class='form-control' type='hidden' name='barco[]' value='0' >`;

                    strExist = `<select name="pais[]" id="pais_${intRow}" class="form-control">${strOptions}</select>`;

                    strLlegada = `  <input type="datetime-local" name="fecha_llegada[]"
                                        onchange="changeDateAuto('${intRow}', 'llegada')"
                                        id="fecha_llegada_${intRow}" class="form-control" value="${last_arrive}" />`;

                    strSalida = `<input type="datetime-local" name="fecha_salida[]"
                                    onchange="changeDateAuto('${intRow}', 'salida')"
                                    id="fecha_salida_${intRow}" class="form-control" value="${last_out}" />`;

                    strButton = `   <button class="btn btn-outline-danger" type="button" onclick="dialogConfirm(deleteRow, [${intRow}, false]);">
                                        <span class="material-icons">delete</span>
                                    </button>`;
                }
                else {
                    strClass = 'table-info';
                    strElementNameShip = `<input name='detalle_nombre_barco[]' id='detalle_nombre_barco_${intRow}' type='hidden' class='form-control' value='${strNameShip}' />
                                            <input class='form-control' type='hidden' name='barco[]' value='0' >
                                            <p id='p_detalle_nombre_barco_${intRow}'>${strNameShip}</p>`;
                    strExist = `<p>${detail.name}</p>
                                <input type='hidden' name='pais[]' id='pais_${intRow}' value='${detail.id}' />`
                    let prevDateArrive = new Date(last_arrive),
                        prevDateOut = new Date(last_out),
                        strArriveShow = `${zfill(prevDateArrive.getDate(), 2)}/${zfill(prevDateArrive.getMonth() + 1, 2)}/${prevDateArrive.getFullYear()} ${zfill(prevDateArrive.getHours(), 2)}:${zfill(prevDateArrive.getMinutes(), 2)}`,
                        strOutShow = `${zfill(prevDateOut.getDate(), 2)}/${zfill(prevDateOut.getMonth() + 1, 2)}/${prevDateOut.getFullYear()} ${zfill(prevDateOut.getHours(), 2)}:${zfill(prevDateOut.getMinutes(), 2)}`;
                    strLlegada = `<p>${strArriveShow}</p>
                                    <input type='hidden' name='fecha_llegada[]' id="fecha_llegada_${intRow}" value='${last_arrive}' />`;
                    strSalida = `<p>${strOutShow}</p>
                                    <input type='hidden' name='fecha_salida[]' id="fecha_salida_${intRow}" value='${last_out}' />`;
                }
                
                let strShip = document.getElementById('nombre').value;
                let strRow = `  <tr id="tr_${intRow}" row="${intRow}" class='${strClass}'>
                                    <td>${strElementNameShip}</td>
                                    <td>${strExist}</td>
                                    <td>${strLlegada}</td>
                                    <td>${strSalida}</td>
                                    <td class="text-center" id='content-buttons-${intRow}'>${strButton}</td>
                                </tr>`;
                document.getElementById('tBodyPrincipal').insertAdjacentHTML('beforeend', strRow);
                intRow++;
            }
        });
    }
    else
        alert_nova.showNotification('No hay informacion valida para calcular', 'warning', 'danger');
    close_loading();

    addButtonSuggestion();
};

const addCalculateRoute = async () => {
    const objPort = document.getElementById('new_country'),
        intPort = objPort.value.trim();
    let boolValidate = await validateFormToAdd();
    
    if (boolValidate && Object.keys(objGlobalOptPorts).length > 0) {
        let objValidForCalculate = objGlobalOptPorts.find(d => d.id == intPort && d.initial_lap);

        if (objValidForCalculate)
            await drawAutoRowsByPorts(objGlobalOptPorts, intPort);
        else
            alert_nova.showNotification("El puerto no tiene configurada esta opción.", "warning", "danger");
    }
    else
        alert_nova.showNotification("Ingrese los valores requeridos", "warning", "danger");
};

const drawDetailExists = async (arrDataExist) => {
    const container = document.getElementById('tBodyPrincipal');
    if(Object.keys(arrDataExist).length) {
        let prevRow = 0,
            timeNow = new Date(),
            dayNow = timeNow.getDay(),
            datePrevRow = '';
        arrDataExist.map(detail => {
            let intRow = detail.id,
                strNameShip = detail.nombre_barco,
                strDateToCompare = detail.fecha_llegada;
            last_arrive = detail.fecha_llegada;
            last_out = detail.fecha_salida;
            let intDifferenceTime = intGlobalDifferenceTime;
            if(dayNow === 1)
                intDifferenceTime = (intGlobalDifferenceTime * 3);
            let formatOut = new Date(last_out);
            let boolCanEdit = (!((timeNow.getTime() - formatOut.getTime()) > intDifferenceTime));
            let strExist = strLlegada = strSalida = strClass = strButton = strShipExist = '';
            if(boolCanEdit) {
                let strOptions = makeOptPorts(objGlobalOptPorts, parseInt(detail.pais));
                strShipExist = `<input class='form-control' type='text' name='detalle_nombre_barco[]' id='detalle_nombre_barco_${intRow}' value='${strNameShip}' />
                                <input class='form-control' type='hidden' name='barco[]' value='${detail.viaje_id}' >`;

                strExist = `<select name="pais[]" id="pais_${intRow}" class="form-control">${strOptions}</select>`;

                strLlegada = `  <input type="datetime-local" name="fecha_llegada[]"
                                    onchange="changeDateAuto('${intRow}', 'llegada')"
                                    id="fecha_llegada_${intRow}" class="form-control" value="${last_arrive}" />`;

                strSalida = `<input type="datetime-local" name="fecha_salida[]"
                                onchange="changeDateAuto('${intRow}', 'salida')"
                                id="fecha_salida_${intRow}" class="form-control" value="${last_out}" />`;

                strButton = `   <button class="btn btn-outline-danger" type="button" onclick="dialogConfirm(deleteRow, [${intRow}, true]);">
                                    <span class="material-icons">delete</span>
                                </button>`;
            }
            else {
                strClass = 'table-info';
                let strName = getNamePort(objGlobalOptPorts, parseInt(detail.pais));
                strShipExist = `<input class='form-control' type='hidden' name='detalle_nombre_barco[]' id='detalle_nombre_barco_${intRow}' value='${strNameShip}' />
                                <p id='p_detalle_nombre_barco_${intRow}'>${strNameShip}</p>
                                <input class='form-control' type='hidden' name='barco[]' value='${detail.viaje_id}' >`;
                strExist = `<p>${strName}</p>
                            <input type='hidden' name='pais[]' id='pais_${intRow}' value='${detail.pais}' />`
                let prevDateArrive = new Date(last_arrive),
                    prevDateOut = new Date(last_out),
                    strArriveShow = `${zfill(prevDateArrive.getDate(), 2)}/${zfill(prevDateArrive.getMonth() + 1, 2)}/${prevDateArrive.getFullYear()} ${zfill(prevDateArrive.getHours(), 2)}:${zfill(prevDateArrive.getMinutes(), 2)}`,
                    strOutShow = `${zfill(prevDateOut.getDate(), 2)}/${zfill(prevDateOut.getMonth() + 1, 2)}/${prevDateOut.getFullYear()} ${zfill(prevDateOut.getHours(), 2)}:${zfill(prevDateOut.getMinutes(), 2)}`;
                strLlegada = `<p>${strArriveShow}</p>
                                <input type='hidden' name='fecha_llegada[]' id="fecha_llegada_${intRow}" value='${last_arrive}' />`;
                strSalida = `<p>${strOutShow}</p>
                                <input type='hidden' name='fecha_salida[]' id="fecha_salida_${intRow}" value='${last_out}' />`;
            }
            
            let strStyleRow = "";
            if(String(datePrevRow) === String(strDateToCompare)) {
                strStyleRow = `style="display: none;"`;
                strClass += ' no-operar';
            }
            datePrevRow = strDateToCompare;
            let strShip = document.getElementById('nombre').value;
            let strRow = `  <tr id="tr_${intRow}" row="${intRow}" class="${strClass}" prev-row="${prevRow}" ${strStyleRow}>
                                <td>${strShipExist}</td>
                                <td>
                                    <input type='hidden' id='exist_${intRow}' value='${intRow}' name='exist[]' />
                                    ${strExist}
                                </td>
                                <td>${strLlegada}</td>
                                <td>${strSalida}</td>
                                <td class="text-center" id='content-buttons-${intRow}'>${strButton}</td>
                            </tr>`;
            document.getElementById('tBodyPrincipal').insertAdjacentHTML('beforeend', strRow);
            prevRow = detail.id;
        });
    }
    addButtonSuggestion();
};

const getRoutePorts = async () => {
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetGeneralPorts, { method:'POST', body:formData });
    const data = await response.json();
    if (data.status) {
        return data['data'];
    }
    return [];
};

const drawPrincipalTable = async (arrDataExist = []) => {
    if(Object.keys(objGlobalOptPorts).length <= 0) {
        objGlobalOptPorts = await getRoutePorts();
    }
    const container = document.getElementById('containerPrincipalTable');
    let strOptions = makeOptPorts(objGlobalOptPorts, 1);
    let strTable = `<table class='table table-striped'>
                        <thead>
                            <tr>
                                <th>Barco</th>
                                <th>Pais</th>
                                <th>Fecha Llegada Inicial</th>
                                <th>Fecha Salida Inicial</th>
                                <th>Opciones</th>
                            </tr>
                        </thead>
                        <tbody id='tBodyPrincipal'>
                            <tr class='table-info'>
                                <td></td>
                                <td>
                                    <select id='new_country' class='form-control'>${strOptions}</select>
                                </td>
                                <td><input type="datetime-local" id="new_date_arrive" class="form-control" value=""></td>
                                <td><input type="datetime-local" id="new_date_out" class="form-control" value=""></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td colspan='6' class='text-center'>
                                    <button type='button' class='btn btn-outline-info' onclick='addIndividualRow()'>
                                        <span class="material-icons">straight</span> Agregar Ruta Individual
                                    </button>
                                    <button type='button' class='btn btn-outline-primary' onclick='addCalculateRoute()'>
                                        <span class="material-icons">alt_route</span> Calcular Ruta
                                    </button>
                                </td>
                            </tr>    
                        </tbody>
                    </table>`;
    container.innerHTML = strTable;
    if(Object.keys(arrDataExist).length > 0)
        drawDetailExists(arrDataExist);
};

const drawPrincipalFilters = (objDataExist = {}, objDetailsExist = []) => {
    const container = document.getElementById('containerPrincipalFilters');
    let strName = (objDataExist?.name) ? objDataExist.name : "";
    let strElements = '';
    
    if(!objDataExist?.name || objDataExist.name == '') {
        strElements = ` <div class="col-4">
                            <div class="form-group">
                                <label for="nombre" class="bmd-label-floating">Nombre Barco</label>
                                <input type="hidden" class="form-control" name="proveedor_barco" id="proveedor_barco" value="${intID}" autocomplete="off">
                                <input type="text" class="form-control" name="nombre" id="nombre" value="${strName}" autocomplete="off">
                            </div>
                        </div>`;
    }
    container.innerHTML = strElements;

    if(Object.keys(objDetailsExist).length > 0) {
        boolExistData = true;
        drawPrincipalTable(objDetailsExist);
    }
    else
        drawPrincipalTable();
};

const getData = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('id', intID);
    const response = await fetch(urlGetData, {method: 'POST', body: formData});
    const data = await response.json();
    close_loading();
    if(data.status)
        if(Object.keys(data['data']).length > 0)
            drawPrincipalFilters(data['data']['viaje'], data['data']['detalle']);
        else
            drawPrincipalFilters();
    else
        alert_nova.showNotification('No hay informacion a mostrar, contacta con soporte', 'warning', 'danger');
};

const deleteElementsNew = async () => {
    let elements = document.querySelectorAll(`.trSuggestion`);
    elements.forEach(divContainer => {
        divContainer.parentNode.removeChild(divContainer);
    });
    return true;
};

const sendFormToSave = async (boolDeleteNews = false) => {
    open_loading();
    if(boolDeleteNews) {
        let boolDeleteSuggestion = deleteElementsNew();
    }
    let formData = new FormData(document.getElementById('formGeneral'));
    formData.append('csrfmiddlewaretoken', valCSRF);
    if(intID !== 0)
        formData.append('viaje', intID);
    const response = await fetch(urlSaveData, {method: 'POST', body: formData});
    const data = await response.json();
    close_loading();
    if(data.status) {
        alert_nova.showNotification('Datos guardados correctamente, espera por favor.');
        setTimeout(() => {
            const urlEdit = urlEditCreate.replace('0', data.id);
            window.location = urlEdit;
        }, 2500);
    }
    else
        alert_nova.showNotification('Ocurrio un error al guardar la informacion, contacta con soporte.', 'warning', 'danger');
};

getData();

if(btnSave)
    btnSave.addEventListener('click', () => {
        sendFormToSave();
    });