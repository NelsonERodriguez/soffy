const des = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
Object.defineProperty(HTMLInputElement.prototype, 'value', {
    get: function() {
        const value = des.get.call(this);
        if (this.type === 'text' && this.list) {
            const opt = [].find.call(this.list.options, o => o.value === value);
            return opt ? opt.dataset.value : value;
        }
        return value;
    }
});

const sendFormSave = async () => {
    open_loading();
    let form = document.getElementById('form-transfer-container'),
        formData = new FormData(form);
    formData.append('csrfmiddlewaretoken', valCSRF);

    const response = await fetch(urlSaveTransfer, { method: 'POST', body: formData });
    let data = [];
    try {
        data = await response.json();
    } catch (error) {
        data = [];
    }

    if(data?.status) {
        alert_nova.showNotification(data.message, "add_alert", "success");
        setTimeout(() => {
            location.reload();
        }, 2500);
    }
    else {
        if(Object.keys(data?.errors).length > 0) {
            data['errors'].map(d => {
                alert_nova.showNotification(`El contenedor ${d.container} no se pudo guardar`, "warning", "danger");
            });
            boolClick = false;
        }
        else {
            alert_nova.showNotification(data.message, "warning", "danger");
            boolClick = false;
        }
    }
    close_loading();
};

const makeFormFillAll = async (container, lot, product, custodian, carrier, cost, diesel, chasis, planta) => {
    let boolError = false,
        strMessageReturn = '',
        optionsContainer = container.split('='),
        optionsLot = lot.split('='),
        optionsProduct = product.split('='),
        optionsCustodian = custodian.split('='),
        optionsCarrier = carrier.split('='),
        optionsCost = cost.split('='),
        optionsDiesel = diesel.split('='),
        optionsChasis = chasis.split('='),
        optionsPlanta = planta.split('=');

    if (typeof optionsContainer[1] !== 'undefined') {
        if (typeof optionsLot[1] !== 'undefined' && typeof optionsProduct[1] !== 'undefined' &&
        typeof optionsCustodian[1] !== 'undefined' && typeof optionsCarrier[1] !== 'undefined' &&
        typeof optionsCost[1] !== 'undefined' && typeof optionsDiesel[1] !== 'undefined' &&
        typeof optionsChasis[1] !== 'undefined' && typeof optionsPlanta[1] !== 'undefined') {
            let contentForm = document.getElementById('form-transfer-container');
            let intCost = optionsCost[1],
                intDiesel = optionsDiesel[1],
                intGuardian = optionsCustodian[1],
                intCarrier = optionsCarrier[1],
                intProduct = optionsProduct[1],
                intLot = optionsLot[1],
                intContainer = decodeURI(optionsContainer[1]),
                strChasis = optionsChasis[1],
                strPlanta = optionsPlanta[1];
            intContainer = intContainer.replaceAll('%', ' ');

            if (intCost == '' || intDiesel == '' || intGuardian == '' || intCarrier == '' || strChasis == '' || strPlanta == '') {
                boolError = true;
                strMessageReturn = `El contendor ${intContainer}, no tiene informacion valida para guardar.`;
            }
            else {
                contentForm.innerHTML += `  <input type="hidden" name="no_container[]" value="${intContainer}" />
                                            <input type="hidden" name="cost[]" value="${intCost}" />
                                            <input type="hidden" name="diesel[]" value="${intDiesel}" />
                                            <input type="hidden" name="custodian[]" value="${intGuardian}" />
                                            <input type="hidden" name="carrier[]" value="${intCarrier}" />
                                            <input type="hidden" name="product[]" value="${intProduct}" />
                                            <input type="hidden" name="lot[]" value="${intLot}" />
                                            <input type="hidden" name="chasis[]" value="${strChasis}" />
                                            <input type="hidden" name="planta[]" value="${strPlanta}" />`;
            }
        }
        else {
            boolError = true;
            strMessageReturn = `El contenedor '${optionsContainer[1]}', no tiene datos validos para guardar.`;
        }
    }
    else {
        boolError = true;
        strMessageReturn = `No es un dato valido para guardar`;
    }

    return {'error': boolError, 'message': strMessageReturn};
};

const makeFormOnlyContainer = async (container, lot) => {
    let boolError = false,
        optionsContainer = container.split('='),
        optionsLot = lot.split('=');

    if (typeof optionsContainer[1] !== 'undefined' && typeof optionsLot[1] !== 'undefined') {
        let contentForm = document.getElementById('form-transfer-container'),
            intLot = optionsLot[1],
            intContainer = optionsContainer[1];

        if(intContainer == '' || intLot == '')
            boolError = true;
        
        contentForm.innerHTML += `  <input type="hidden" name="no_container[]" value="${intContainer}" />
                                    <input type="hidden" name="lot[]" value="${intLot}" />`;
    }
    else
        boolError = true;

    return boolError;
};

const validateFormAndDraw = async () => {
    let boolFilled = false,
        boolError = false,
        strMessageError = '',
        strContainersDone = '';

    let strInputs = tblDetail.$("input").serialize();
    let arrInputs = strInputs.split("&");
    let arrTMP = [];

    arrInputs.forEach(element => {
        let options = element.split("=");
        if((options[0].search('selected') * 1) >= 0)
            arrTMP.push(options[0]);
    });

    await arrTMP.map(async (str) => {
        if(!boolError) {
            if(!boolFilled)
                boolFilled = true;
            let a = str.split("_");
            let container = arrInputs.find(strDetail => (strDetail.search(`no_container_${a[1]}=`) * 1) >= 0),
                lot = arrInputs.find(strDetail => (strDetail.search(`lot_${a[1]}=`) * 1) >= 0 );
            if (document.getElementById('fill-all').value == 'true') {
                let product = arrInputs.find(strDetail => (strDetail.search(`product_${a[1]}=`) * 1) >= 0),
                    custodian = arrInputs.find(strDetail => (strDetail.search(`custodian_${a[1]}=`) * 1) >= 0),
                    carrier = arrInputs.find(strDetail => (strDetail.search(`carrier_${a[1]}=`) * 1) >= 0),
                    cost = arrInputs.find(strDetail => (strDetail.search(`cost_${a[1]}=`) * 1) >= 0),
                    diesel = arrInputs.find(strDetail => (strDetail.search(`diesel_${a[1]}=`) * 1) >= 0),
                    chasis = arrInputs.find(strDetail => (strDetail.search(`chasis_${a[1]}=`) * 1) >= 0),
                    planta = arrInputs.find(strDetail => (strDetail.search(`planta_${a[1]}=`) * 1) >= 0);

                const arrErrorFill = await makeFormFillAll(container, lot, product, custodian, carrier, cost, diesel, chasis, planta);
                if(arrErrorFill['error']) {
                    strMessageError = arrErrorFill['message'];
                    boolError = true;
                    return false;
                }

                optionsContainer = container.split('=')
                intContainer = decodeURI(optionsContainer[1]);
                optionsContainer = container.split('=')
                intContainer = intContainer.replaceAll('%', ' ');
                if(strContainersDone == '')
                    strContainersDone += '<br>'
                strContainersDone += `${intContainer} <br>`;
            }
            else {
                const boolDraw = await makeFormOnlyContainer(container, lot);
                if(!boolDraw) {
                    strMessageError = 'No se puede guardar solamente el contenedor, ocurrio un problema';
                    boolError = true;
                    return false;
                }
                strContainersDone += `${container} <br>`;
            }
        }
    });
    return {
        'filled': boolFilled,
        'error': boolError,
        'messageError': strMessageError,
        'strContainersDone': strContainersDone,
    };
};

const makeObjToSave = async () => {
    if(!boolClick) {
        boolClick = true;
        const form = document.getElementById('form-transfer-container'),
            actually = document.getElementById('actually').value,
            destiny = document.getElementById('destiny').value,
            productoId = document.getElementById('productoId').value,
            intAllForm = (document.getElementById('fill-all').value == 'true') ? 1 : 0;

        form.innerHTML = `  <input type="hidden" name="destiny" value="${destiny}" />
                            <input type="hidden" name="actually" value="${actually}" />
                            <input type="hidden" name="product_id" value="${productoId}" />
                            <input type="hidden" name="details_carrier" value="${intAllForm}" />`;

        let arrResponse = await validateFormAndDraw(),
            boolFilled = arrResponse['filled'],
            boolError = arrResponse['error'],
            messageError = arrResponse['messageError'];

        boolClick = false;
        if(!boolFilled)
            alert_nova.showNotification('No hay ningún contenedor para guardar.', 'warning', 'danger');
        else if(boolError)
            alert_nova.showNotification(`Error. ${messageError}`, 'warning', 'danger');
        else
            dialogConfirm(sendFormSave, [], 'Usted va a mover contenedores ¿Estás seguro?', `Contenedores a mover: ${arrResponse['strContainersDone']}`, 'error');
    }
};

const showButtonCleanCarrier = async (intKeyElement) => {
    const btn = document.getElementById(`btn-clean-${intKeyElement}`);
    btn.style.display = 'inline-block';
    btn.disabled = false;
    btn.style.cursor = 'pointer';
};

const setCost = async (intKeyElement) => {
    if(objProducto?.id) {
        let elmCost = document.getElementById(`cost_${intKeyElement}`),
            elmProductoId = document.getElementById('productoId');
        if(elmCost && elmProductoId) {
            elmCost.value = parseFloat(objProducto.precio);
            elmProductoId.value = objProducto.id;
        }
        else
            alert_nova.showNotification('El elemento no existe, contacta con soporte.', 'warning', 'danger');
    }
    else
        alert_nova.showNotification('El traslado no tiene precio valido, no podras hacer orden de compra automatica.', 'warning', 'danger');
};

const setOptionsRow = async (strValue, setElementID, strOption, intKeyElement) => {
    if(strValue !== '' && !isNaN(strValue)) {
        document.getElementById(setElementID).value = strValue;
        if(strOption === 'carrier') {
            await setCost(intKeyElement);
            await showButtonCleanCarrier(intKeyElement);
        }
    }
    else {
        document.getElementById(setElementID).value = 0;
        if(strOption === 'carrier')
            document.getElementById(`cost_${intKeyElement}`).value = 0;
    }
};

const drawOptionsCarriers = async () => {
    let strReturn = '';
    objDataCarriers.map(detail => {
        strReturn += `<option data-value="${detail.id}">${detail.name}</option>`;
    });
    return strReturn;
};

const drawOptionsChasis = async () => {
    let strReturn = '';
    if(Object.keys(objDataChasis).length)
        objDataChasis.map(detail => {
            strReturn += `<option data-value="${detail.id}">${detail.nombre}</option>`;
        });
    else
        strReturn = `<option data-value="0">Sin opciones</option>`;
    return strReturn;
};

const drawOptionsPlanta = async () => {
    let strReturn = '';
    if(Object.keys(objDataPlanta).length)
        objDataPlanta.map(detail => {
            strReturn += `<option data-value="${detail.id}">${detail.nombre}</option>`;
        });
    else
        strReturn = `<option data-value="0">Sin opciones</option>`;
    return strReturn;
};

const cleanCarrierToDetail = async (intKey) => {
    document.getElementById(`input_list_carrier_${intKey}`).value = '';
    document.getElementById(`carrier_${intKey}`).value = '';
    const btn = document.getElementById(`btn-clean-${intKey}`);
    btn.style.display = 'none';
    btn.disabled = true;
    btn.style.cursor = 'not-allowed';
};

const drawTableContainers = async (objData) => {
    let strElementsCarriers = await drawOptionsCarriers(),
        strElementsChasis = await drawOptionsChasis(),
        strElementsPlanta = await drawOptionsPlanta();
    document.getElementById('fill-all').value = boolFillAll;
    const contentTable = document.getElementById('content-dtDefault');
    contentTable.innerHTML = `<table class="table" id="dtDefault" style="width:100%"></table>`;
    let strTHeads = (boolFillAll) ? `   <th>Custodio</th>
                                        <th>Transportista</th>
                                        <th>Costo</th>
                                        <th>Diesel</th>
                                        <th>Chasis</th>
                                        <th>Planta</th>` : '';

    let content = document.getElementById('dtDefault');
    const table = ` <thead>
                        <tr>
                            <th>Seleccionar</th>
                            <th>No Contenedor</th>
                            <th>Codigo</th>
                            <th>Producto</th>
                            <th>Libras</th>
                            ${strTHeads}
                        </tr>
                    </thead>
                    <tbody id='tBody-table-containers'></tbody>`;
    content.innerHTML = table;

    objData.map(async (detail, key) => {
        let strTds = '';
        if (boolFillAll) {
            strTds += `<td>
                            <input type="text" class="form-control" id='input_list_guardian_${key}' list="list_guardian_${key}" oninput="setOptionsRow(this.value, 'guardian_${key}', 'guardian', '${key}')" autocomplete="off" required />
                            <input name='custodian_${key}' type="hidden" id="guardian_${key}" />
                            <datalist id="list_guardian_${key}">
                                <option data-value="0">No</option>
                                <option data-value="1">Si</option>
                            </datalist>
                        </td>
                        <td>
                            <input type="text" class="form-control input-carrier" id="input_list_carrier_${key}" list="list_carrier_${key}" oninput="setOptionsRow(this.value, 'carrier_${key}', 'carrier', '${key}')" autocomplete="off" required />
                            <input name='carrier_${key}' type="hidden" id="carrier_${key}" />
                            <datalist id="list_carrier_${key}">
                                ${strElementsCarriers}
                            </datalist>
                            <button type='button' class='btn-delete-detail' id="btn-clean-${key}" onclick='cleanCarrierToDetail("${key}");' disabled><p>x</p></button>
                        </td>
                        <td>
                            <input name='cost_${key}' type="number" class="form-control" id="cost_${key}" />
                        </td>
                        <td>
                            <input name='diesel_${key}' type="number" class="form-control" id="diesel_${key}" />
                        </td>
                        <td>
                            <input type="text" class="form-control input-chasis" id="input_list_chasis_${key}" list="list_chasis_${key}" oninput="setOptionsRow(this.value, 'chasis_${key}', 'chasis', '${key}')" autocomplete="off" required />
                            <input name='chasis_${key}' type="hidden" id="chasis_${key}" />
                            <datalist id="list_chasis_${key}">
                                ${strElementsChasis}
                            </datalist>
                        </td>
                        <td>
                            <input type="text" class="form-control input-planta" id="input_list_planta_${key}" list="list_planta_${key}" oninput="setOptionsRow(this.value, 'planta_${key}', 'planta', '${key}')" autocomplete="off" required />
                            <input name='planta_${key}' type="hidden" id="planta_${key}" />
                            <datalist id="list_planta_${key}">
                                ${strElementsPlanta}
                            </datalist>
                        </td>`;
        }
        let strTr = `   <tr>
                            <td>
                                <input name='selected_${key}' type="checkbox" class="form-control check-containers" no-container="${detail.nocontenedor}" no-product="${detail.CodigoProducto}" no-key='${key}' />
                            </td>
                            <td data-search="${detail.nocontenedor}" data-order="${detail.nocontenedor}">
                                ${detail.nocontenedor}
                                <input name='no_container_${key}' type="hidden" class="form-control" id="no_container_${key}" value="${detail.nocontenedor}" />
                                <input name='lot_${key}' type="hidden" class="form-control" id="no_lot_${key}" value="${detail.NoLote}" />
                            </td>
                            <td data-search="${detail.CodigoProducto}" data-order="${detail.CodigoProducto}">
                                ${detail.CodigoProducto}
                                <input name='product_${key}' type="hidden" class="form-control" id="codigo_producto_${key}" value="${detail.CodigoProducto}" />
                            </td>
                            <td data-search="${detail.Descripcion}" data-order="${detail.Descripcion}">
                                ${detail.Descripcion}
                                <input type="hidden" class="form-control" id="description_${key}" value="${detail.Descripcion}" />
                            </td>
                            <td data-search="${detail.Cantidad}" data-order="${detail.Cantidad}">
                                ${detail.Cantidad}
                                <input type="hidden" class="form-control" id="quantity_${key}" value="${detail.Cantidad}" />
                            </td>
                            ${strTds}
                        </tr>`;
        document.getElementById('tBody-table-containers').insertAdjacentHTML('beforeend', strTr);
        // return true;
    });
    let objColumns = [ null, null, null, null, null ];
    if (boolFillAll) {
        objColumns = [
            null,
            null,
            null,
            null,
            null,
            { "bSearchable": false, orderable: false },
            { "bSearchable": false, orderable: false, "width": "250px" },
            { "bSearchable": false, orderable: false },
            { "bSearchable": false, orderable: false },
            { "bSearchable": false, orderable: false, "width": "80px" },
            { "bSearchable": false, orderable: false, "width": "80px" }
        ];
    }

    if(Object.keys(objData).length > 0) {
        tblDetail = $('#dtDefault').DataTable({
            "pagingType": "full_numbers",
            "lengthMenu": [
                [10, 25, 50, -1],
                [10, 25, 50, "Todos"]
            ],
            language: objLenguajeDataTable,
            pageLength: '10',
            columns: objColumns
        });
    }
};

const setOptionsInListDestination = async (objData) => {
    let strElements = '';
    objData.map(detail => {
        strElements += `<option data-value="${detail.id}">${detail.name}</option>`;
    });
    const content = document.getElementById('list_destiny');
    content.innerHTML = strElements;
};

const getDestinationCellars = async (intCellar) => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('no_cellar', intCellar);
    const response = await fetch(urlGetDestinationCellars, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status)
        await setOptionsInListDestination(data.data);
    else
        console.error(data.message);
    close_loading();
};

const getContainersInCellar = async (intCellar) => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('no_cellar', intCellar);
    const response = await fetch(urlSearchContainer, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status) {
        await drawTableContainers(data.data);
        objDataContainers = data.data;
        await getDestinationCellars(intCellar);
    }
    else
        console.error(data.message);
    close_loading();
};

const cleanCarrierAndCost = async () => {
    open_loading();
    let elements = document.querySelectorAll('.check-containers');
    elements.forEach(element => {
        let key = element.getAttribute('no-key'),
            elementCarrier = document.getElementById(`input_list_carrier_${key}`),
            elementGuardian = document.getElementById(`input_list_guardian_${key}`),
            elementList = document.getElementById(`carrier_${key}`),
            elementListGuardian = document.getElementById(`guardian_${key}`),
            elementCost = document.getElementById(`cost_${key}`);
        if(elementGuardian && elementCarrier && elementList && elementCost) {
            elementGuardian.value = '';
            elementListGuardian.value = '';
            elementCarrier.value = '';
            elementList.value = '';
            elementCost.value = '';
            cleanCarrierToDetail(key);
        }
    });
    close_loading();
    return true;
};

const getProductToTransfer = async () => {
    objProducto = [];
    let formData = new FormData(),
        actually = document.getElementById('actually'),
        destiny = document.getElementById('destiny');

    if(actually && destiny) {
        let strActually = actually.value,
            strDestiny = destiny.value;

        if(strActually.trim() != '' && strDestiny != '') {
            open_loading();
            let data = [];
            formData.append('csrfmiddlewaretoken', valCSRF);
            formData.append('actually', actually.value);
            formData.append('destiny', destiny.value);
            const response = await fetch(urlGetPriceProduct, {method: 'POST', body: formData});

            try {
                data = await response.json();
            } catch (e) {
                data = [];
                console.error(`Error en el fetch ${e}`);
            }

            if(data?.status) {
                objProducto = data?.data ? data.data : [];
            }
            close_loading();
        }
        else {
            alert_nova.showNotification('Recuerda que ahora usamos el producto, debes tener bodega Actual y Destino', 'warning', 'info');
            actually.value = '';
            document.getElementById('input-list-destiny').value = '';
        }
    }
    else
        alert_nova.showNotification('No puedes consultar por que falta información.', 'warning', 'info');
    

    
};

const setOptionFilterData = async (strValue, strOption) => {
    if(strValue !== '' && !isNaN(strValue)) {
        document.getElementById(strOption).value = strValue;
        if(strOption == 'actually')
            getContainersInCellar(strValue);
        if(strOption == 'destiny')
            getProductToTransfer();
    }
    else {
        document.getElementById(strOption).value = 0;
        if(strOption == 'actually') {
            document.getElementById('input-list-destiny').value = '';
            const content = document.getElementById('list_destiny');
            content.innerHTML = `<option data-value="0">No hay información a mostrar</option>`;
        }
        await cleanCarrierAndCost();
    }
};

const getChasis = async () => {
    let formData = new FormData(),
        data = [];
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetChasis, {method: 'POST', body: formData});
    try {
        data = await response.json();
    } catch(error) {
        console.error(error);
    }

    if(data?.status)
        objDataChasis = data?.data;
    else
        console.error(data?.message);
    return true
};

const getPlantas = async () => {
    let formData = new FormData(),
        data = [];
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetPlantas, {method: 'POST', body: formData});
    try {
        data = await response.json();
    } catch(error) {
        console.error(error);
    }

    if(data?.status)
        objDataPlanta = data?.data;
    else
        console.error(data?.message);
    return true
};

const getCarriers = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetCarriers, {method: 'POST', body: formData});
    let data = [];
    try {
        data = await response.json();
    } catch (error) {
        data = [];
    }
    if (data?.status) {
        await getChasis();
        await getPlantas();
        objDataCarriers = data.data;
    }
    else
        console.error(data.message);
    close_loading();
};

getCarriers();