const setAutocomplete = async (strSearch = 'product', intRow = 0, intRowFather = 0) => {
    let objInput = document.getElementById(`${strSearch}-${intRow}-show`),
        strSendSearch = (strSearch == 'product') ? strUrlGetProductos : ( (strSearch == 'provider') ? strUrlGetProveedores : strUrlGetShip ),
        objElementToSend = document.getElementById(`${strSearch}-${intRow}`);

    if(intRowFather > 0) {
        objInput = document.getElementById(`${strSearch}-${intRowFather}-${intRow}-show`);
        objElementToSend = document.getElementById(`${strSearch}-${intRowFather}-${intRow}`);
    }
    
    $(objInput).autocomplete({
        minLength: 1,
        source: function( request, response ) {
            const form = new FormData();
            const csrftoken = getCookie('csrftoken');
            form.append('busqueda', request.term);
            open_loading();

            fetch(strSendSearch, {
                method: 'POST',
                headers: { "X-CSRFToken": csrftoken },
                body: form
            })
                .then(response => response.json())
                .then( (data) => {
                    close_loading();
                    let objProducts = data.productos;
                    response( objProducts.map(item => {
                        return {
                            label: item.name,
                            value: item.id
                        }
                    }) );
                })
                .catch((error) => {
                    close_loading();
                    console.error(error);
                    alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
                });
        },
        select: function( event, ui ) {
            event.preventDefault();
            const strProducto = ui.item.label,
                intProducto = ui.item.value;
            this.value = strProducto;
            objElementToSend.value = intProducto;
        }
    })
        .focus(function () {
            this.value = '';
            objElementToSend.value = 0;
        });
};

const deletePort = async (intRow, intIDFather = 0) => {
    open_loading();
    let formData = new FormData();
    formData.append('port', intRow);
    if(intIDFather > 0) {
        formData.append('product', intIDFather);
        let elementAvailable = document.getElementById(`total_available-${intIDFather}`),
            elementConfirmed = document.getElementById(`total_confirmed-${intIDFather}`);
        if(elementAvailable)
            formData.append('available', elementAvailable.value);
        if(elementConfirmed)
            formData.append('confirmed', elementConfirmed.value);
    }
    formData.append('csrfmiddlewaretoken', valCSRF)
    const response = await fetch(strUrlDeletePort, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status) {
        alert_nova.showNotification('Puerto borrado correctamente');
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
    close_loading();
};

const deleteRowDetail = async (strKeys) => {
    let arrTMPKeys = strKeys.split('_');
    
    let intIDFather = intRow = 0;
    if(arrTMPKeys[0])
        intIDFather = arrTMPKeys[0];
    if(arrTMPKeys[1])
        intRow = arrTMPKeys[1];
    const tr = document.getElementById(`tr-detail-${intIDFather}-${intRow}`);
    if(tr) {
        tr.parentNode.removeChild(tr);
        await changeTotalContainers('available', intIDFather);
        await changeTotalContainers('confirmed', intIDFather);

        if(tr.hasAttribute('exist'))
            await deletePort(intRow, intIDFather);
    }
};

const validateFormProduct = async (intIDFather) => {
    let boolReturn = true,
        provider = document.getElementById(`provider-${intIDFather}`),
        product = document.getElementById(`product-${intIDFather}`),
        totalOrdered = document.getElementById(`total_order_product-${intIDFather}`);
    if(provider) {
        if(provider.value == '' || provider.value == '0') {
            document.getElementById(`content_provider-${intIDFather}`).classList.add('has-danger');
            document.getElementById(`provider-${intIDFather}-show`).focus();
            boolReturn = false;
        }
    }
    else {
        boolReturn = false;
    }

    if(product && boolReturn) {
        if(product.value == '' || product.value == '0') {
            document.getElementById(`content_product-${intIDFather}`).classList.add('has-danger');
            document.getElementById(`product-${intIDFather}-show`).focus();
            boolReturn = false;
        }
    }
    else {
        boolReturn = false;
    }

    if(totalOrdered && boolReturn) {
        if(totalOrdered.value == '' || (totalOrdered.value * 1) < 0) {
            document.getElementById(`content_total_order_product-${intIDFather}`).classList.add('has-danger');
            totalOrdered.focus();
            boolReturn = false;
        }
    }
    else {
        boolReturn = false;
    }

    return boolReturn;
};

const validateFormPortByProduct = async (intIDFather, intRow) => {
    let boolReturn = true,
        port = document.getElementById(`port-${intIDFather}-${intRow}`),
        containersAvailable = document.getElementById(`containers-available-${intIDFather}-${intRow}`);
    
    if(port) {
        if(port.value == '') {
            document.getElementById(`content_port-${intIDFather}-${intRow}`).classList.add('has-danger');
            port.focus();
            boolReturn = false;
        }
    }
    else {
        boolReturn = false;
    }

    if(containersAvailable && boolReturn) {
        if(containersAvailable.value == '') {
            document.getElementById(`content_containers-available-${intIDFather}-${intRow}`).classList.add('has-danger');
            containersAvailable.focus();
            boolReturn = false;
        }
    }
    else {
        boolReturn = false;
    }
    return boolReturn;
};

const changeTotalContainers = async (strOption, intIDFather) => {
    let objElements = document.querySelectorAll(`input[id^="containers-${strOption}-${intIDFather}"]`);
    if(objElements) {
        let intTotalByProduct = 0;
        objElements.forEach(element => {
            intTotalByProduct += parseInt(element.value);
        });
        let elementShowTotal = document.getElementById(`total_${strOption}-${intIDFather}-show`),
            elementTotal = document.getElementById(`total_${strOption}-${intIDFather}`);
        if(elementShowTotal && elementTotal) {
            elementShowTotal.value = intTotalByProduct;
            elementTotal.value = intTotalByProduct;
        }
    }
};

const addDetailPort = async (intIDFather, objDataExist = {}) => {
    const container = document.getElementById(`tBodyDetail-${intIDFather}`),
            objRows = document.querySelectorAll(`input[name="row_${intIDFather}[]"]`);
    let intRow = 0,
        boolError = false,
        strExist = '',
        namePort = '',
        containersAvailable = 0,
        containersConfirmed = 0,
        dateLiberation = '',
        dateTentative = '',
        shipTentative = '',
        nameShip = '';
    if(objDataExist?.id){
        strExist = `exist='${objDataExist.id}'`;
        nameShip = '';
        intRow = objDataExist.id;
        namePort = objDataExist.puerto;
        containersAvailable = objDataExist.contenedores_disponibles;
        containersConfirmed = (objDataExist.contenedores_liberados == 'None') ? 0 : objDataExist.contenedores_liberados;
        dateLiberation = (objDataExist.fecha_liberacion == 'None') ? 0 : objDataExist.fecha_liberacion;
        dateTentative = (objDataExist.fecha_tentativa_embarque == 'None') ? 0 : objDataExist.fecha_tentativa_embarque;
        shipTentative = (objDataExist.barco_tentativo_id == 'None') ? 0 : objDataExist.barco_tentativo_id;
        nameShip = (objDataExist.nombre_barco == 'None') ? '' : objDataExist.nombre_barco;
    }
    else {
        const boolValidateForm = await validateFormProduct(intIDFather);
        if(!boolValidateForm) {
            alert_nova.showNotification("No puedes agregar un puerto sin el detalle del producto.", "warning", "danger");
            return false;
        }
        
        objRows.forEach(element => {
            if(!boolError) {
                const intRowTMP = parseInt(element.value);
                intRow = (intRowTMP > intRow) ? intRowTMP : 0;
                let validatePorts = validateFormPortByProduct(intIDFather, intRowTMP);
                if(!validatePorts)
                    boolError = true;
            }
            else {
                return false;
            }
        });
        if(boolError) {
            alert_nova.showNotification("No puedes agregar otro puerto a este producto sin completar.", "warning", "danger");
            return false;
        }
        intRow = (intRow) ? intRow + 1 : 1;
    }

    if(container) {
        const strElements = `   <tr id='tr-detail-${intIDFather}-${intRow}' ${strExist}>
                                    <td>
                                        <input type="hidden" name="row_${intIDFather}[]" id="row_${intIDFather}_${intRow}" value="${intRow}">
                                        <input type="hidden" name="port_exist-${intIDFather}-${intRow}" value="${intRow}">
                                        <button class='btn btn-outline-danger' type='button' id='btn-delete-detail-${intIDFather}_${intRow}'
                                            onclick='dialogConfirm(deleteRowDetail, "${intIDFather}_${intRow}", "¿Estás seguro?", "Usted va a eliminar un puerto.", "error");'>
                                            <i class='fa fa-trash'></i>
                                            Eliminar Puerto
                                        </button>
                                    </td>
                                    <td>
                                        <div class="form-group" id='content_port-${intIDFather}-${intRow}'>
                                            <input type="text" name="port-${intIDFather}-${intRow}" id="port-${intIDFather}-${intRow}" class="form-control" value='${namePort}'>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="form-group" id='content_containers-available-${intIDFather}-${intRow}'>
                                            <input type="number" name="containers-available-${intIDFather}-${intRow}" id="containers-available-${intIDFather}-${intRow}"
                                                class="form-control" value='${containersAvailable}' onchange='changeTotalContainers("available", "${intIDFather}")'>
                                        </div>
                                    </td>
                                    <td>
                                        <input type='text' class='form-control' name='containers-confirmed-${intIDFather}-${intRow}' id='containers-confirmed-${intIDFather}-${intRow}'
                                            value='${containersConfirmed}' onchange='changeTotalContainers("confirmed", "${intIDFather}")' />
                                    </td>
                                    <td>
                                        <input type='date' class='form-control' name='date_confirmed-${intIDFather}-${intRow}' id='date_confirmed-${intIDFather}-${intRow}' value='${dateLiberation}'/>
                                    </td>
                                    <td>
                                        <input type='date' class='form-control' name='date_tentative-${intIDFather}-${intRow}' id='date_tentative-${intIDFather}-${intRow}' value='${dateTentative}'/>
                                    </td>
                                    <td>
                                        <input type="text" id="ship_tentative-${intIDFather}-${intRow}-show" class="form-control" value='${nameShip}'>
                                        <input type="hidden" name="ship_tentative-${intIDFather}-${intRow}" id="ship_tentative-${intIDFather}-${intRow}" value='${shipTentative}'>
                                    </td>
                                </tr>`;
        container.insertAdjacentHTML('beforeend', strElements);
        setAutocomplete('ship_tentative', intRow, intIDFather);
    }
};

const deleteProduct = async (intRow) => {
    open_loading();
    let formData = new FormData();
    formData.append('product', intRow);
    formData.append('csrfmiddlewaretoken', valCSRF)
    const response = await fetch(strUrlDeleteProduct, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status) {
        alert_nova.showNotification('Producto y sus puertos borrados correctamente');
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
    close_loading();
};

const deleteRowProduct = async (intRow) => {
    const tr = document.getElementById(`row-content-product-${intRow}`);
    if(tr) {
        tr.parentNode.removeChild(tr);
        if(tr.hasAttribute('exist')) {
            await deleteProduct(intRow);
        }
    }
};

const drawForm = async (objDataExist = {}) => {
    const container = document.getElementById('row-content-table-general'),
        objRows = document.querySelectorAll(`input[name="row[]"]`);
    let intRow = 0,
        nameProvider = '',
        nameProduct = '',
        productId = '',
        providerId = '',
        containerOrdered = 0,
        containerConfirmed = 0,
        containerAvailable = 0,
        strExist = '';
    
    if(objDataExist?.id) {
        strExist = `exist='${objDataExist.id}'`;
        intRow = objDataExist.id;
        nameProvider = objDataExist.name_proveedor;
        nameProduct = objDataExist.name_producto;
        productId = objDataExist.producto_id;
        providerId = objDataExist.proveedor_id;
        containerOrdered = objDataExist.contenedores_pedidos;
        containerConfirmed = objDataExist.contenedores_liberados;
        containerAvailable = objDataExist.contenedores_disponibles;
    }
    else {
        objRows.forEach(element => {
            const intRowTMP = parseInt(element.value);
            intRow = (intRowTMP > intRow) ? intRowTMP : 0;
        });
        intRow = (intRow) ? intRow + 1 : 1;
    }

    const strTable = `  <div class='row row-detail-form' id='row-content-product-${intRow}' ${strExist}>
                            <div class='col-12'>
                                <div class='row content-btn-delete-product'>
                                    <div class='col text-center'>
                                        <button class='btn btn-outline-danger' type='button' id='btn-delete-product-${intRow}'
                                         onclick='dialogConfirm(deleteRowProduct, ["${intRow}"], "¿Estás seguro?", "Usted va a eliminar un producto y toda la información de los puertos.", "error");'>
                                            <i class='fa fa-trash'></i>
                                            Eliminar Producto
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class='col-12 col-md-3'>
                                <input type="hidden" name="row[]" id="row_${intRow}" value="${intRow}">
                                <input type="hidden" name="product_exist-${intRow}" value="${intRow}">
                                <label for="provider-${intRow}" class="bmd-label-floating">Proveedor</label>
                                <div class="form-group" id='content_provider-${intRow}'>
                                    <input type="text" id="provider-${intRow}-show" class="form-control" value='${nameProvider}'>
                                    <input type="hidden" name="provider-${intRow}" id="provider-${intRow}" value='${providerId}'>
                                </div>
                            </div>
                            <div class='col-12 col-md-3'>
                                <label for="product-${intRow}" class="bmd-label-floating">Producto</label>
                                <div class="form-group" id='content_product-${intRow}'>
                                    <input type="text" id="product-${intRow}-show" class="form-control" value='${nameProduct}'>
                                    <input type="hidden" name="product-${intRow}" id="product-${intRow}" value='${productId}'>
                                </div>
                            </div>
                            <div class='col-12 col-md-2'>
                                <label for="total_order_product-${intRow}" class="bmd-label-floating">Total Pedido Producto</label>
                                <div class="form-group" id='content_total_order_product-${intRow}'>
                                    <input type="number" name="total_order_product-${intRow}" id="total_order_product-${intRow}" class="form-control" value='${containerOrdered}'>
                                </div>
                            </div>
                            <div class='col-12 col-md-2'>
                                <label for="total_available-${intRow}" class="bmd-label-floating">Total Disponible</label>
                                <div class="form-group" id='content_total_available-${intRow}'>
                                    <input type="number" id="total_available-${intRow}-show" class="form-control" value='${containerAvailable}' disabled>
                                    <input type="hidden" name="total_available-${intRow}" id="total_available-${intRow}" value='${containerAvailable}'>
                                </div>
                            </div>
                            <div class='col-12 col-md-2'>
                                <label for="total_confirmed-${intRow}" class="bmd-label-floating">Total Liberado Producto</label>
                                <div class="form-group" id='content_total_confirmed-${intRow}'>
                                    <input type="number" id="total_confirmed-${intRow}-show" class="form-control" value='${containerConfirmed}' disabled>
                                    <input type="hidden" name="total_confirmed-${intRow}" id="total_confirmed-${intRow}" value='${containerConfirmed}'>
                                </div>
                            </div>
                            <div class='col-12'>
                                <div class='row'>
                                    <table class='table tableDetail'>
                                        <thead class='tHeadDetails'>
                                            <th>
                                                <button class='btn btn-warning' rel='tooltip' data-original-title='Agregar Puerto' type='button' id='btn-add-port-${intRow}' onclick='addDetailPort("${intRow}")'>
                                                    <i class="material-icons">add</i>
                                                    Agregar <br>
                                                    Puerto
                                                </button>
                                            </th>
                                            <th>Nombre Puerto</th>
                                            <th>Contenedores / Libras <br> Disponible</th>
                                            <th>Contenedores / Libras <br> Liberados</th>
                                            <th>Fecha Liberación</th>
                                            <th>Fecha Tentativa de Embarque</th>
                                            <th>Barco Tentativo</th>
                                        </thead>
                                        <tbody id='tBodyDetail-${intRow}'></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>`;
    container.insertAdjacentHTML('beforeend', strTable);
    setAutocomplete('provider', intRow);
    setAutocomplete('product', intRow);
};

const validateFormOrder = async () => {
    let boolReturn = true,
        date_order = document.getElementById('date_order'),
        week = document.getElementById('week');
    
    if(date_order) {
        if(date_order.value == '') {
            boolReturn = false;
            document.getElementById('content_date_order').classList.add('has-danger');
            date_order.focus();
        }
    }
    else {
        boolReturn = false;
    }

    if(week && boolReturn) {
        if(week.value == '') {
            boolReturn = false;
            document.getElementById('content_week').classList.add('has-danger');
            week.focus();
        }
    }
    else {
        boolReturn = false;
    }

    return boolReturn
};

const makeFormToSave = async (boolClose = false) => {
    open_loading();
    let formData = new FormData(document.getElementById('frm_otif'));
    if (boolClose)
        formData.append('cerrado', 1);
    
    let response = await fetch(urlSendToSave, {method: 'POST', body: formData});
    let data = await response.json();
    if(data.status) {
        alert_nova.showNotification(data.message, 'add_alert', 'success');
        const intID = parseInt(globalOtifID),
            intNewId = parseInt(data['id']);
        let strPath = (intID !== intNewId) ? urlSendToSave.replace(intID, intNewId) : urlSendToSave;
        setTimeout(() => { window.location = strPath; });
    }
    else {
        close_loading();
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
};

const validateAllForms = async () => {
    const objRows = document.querySelectorAll(`input[name="row[]"]`);
    let boolValidateForm = true;
    if(objRows) {
        objRows.forEach((element) => {
            const intRowFather = parseInt(element.value);
            boolValidateForm = validateFormProduct(intRowFather);
            if(boolValidateForm) {
                const objRowsDetails = document.querySelectorAll(`input[name="row_${intRowFather}[]"]`);
                if(objRowsDetails) {
                    objRowsDetails.forEach((e) => {
                        if(boolValidateForm) {
                            const intRowTMP = parseInt(e.value);
                            boolValidateForm = validateFormPortByProduct(intRowFather, intRowTMP);
                        }
                        else {
                            return false;
                        }
                    });
                }
            }
            else {
                return false;
            }
        });
    }
    return boolValidateForm;
};

const validateAllFunctionsToSave = async (boolClose = false) => {
    let boolFormOrder = await validateFormOrder(),
        boolValidateForms = await validateAllForms();

    if(boolFormOrder && boolValidateForms) {
        await makeFormToSave(boolClose);
    }
    else {
        alert_nova.showNotification('No se puede guardar si tienes información incompleta', 'warning', 'danger');
    }
};

const processObjectExist = async (objData) => {
    let objResult = {
            'date_ordered': '',
            'week': '',
            'closed': false,
            'products': [],
        },
        strWeek = '';
    objData.map(data => {
        if(strWeek == '') {
            let intWeek = String(data.semana).padStart(2, '0');
            strWeek = `${data.year}-W${intWeek}`;
            objResult['week'] = strWeek;
            objResult['date_ordered'] = data.date_ordered;
            objResult['closed'] = (data.cerrado == 'False') ? false : true;
        }

        let objExist = objResult['products'].find(d => d.producto_id == data.producto_id),
            objDetails = {},
            strProductId = '';
        if(data?.product_id && data.product_id !== 'None') {
            if(!objExist) {
                let objTMPPort = [];
                if(data?.ship_id && data.ship_id !== 'None'){
                    objTMPPort.push({
                        'id': data.ship_id,
                        'puerto': data.puerto,
                        'contenedores_disponibles': data.p_contenedores_disponibles,
                        'contenedores_liberados': data.p_contenedores_liberados,
                        'fecha_liberacion': data.fecha_liberacion,
                        'fecha_tentativa_embarque': data.fecha_tentativa_embarque,
                        'barco_tentativo_id': data.barco_tentativo_id,
                        'nombre_barco': data.nombre_barco,
                        'producto_id': data.producto_id,
                    });
                }
                objResult['products'].push({
                    'name_proveedor': data.name_proveedor,
                    'name_producto': data.name_producto,
                    'producto_id': data.producto_id,
                    'proveedor_id': data.proveedor_id,
                    'contenedores_pedidos': data.contenedores_pedidos,
                    'contenedores_liberados': data.contenedores_liberados,
                    'contenedores_disponibles': data.contenedores_disponibles,
                    'id': data.product_id,
                    'ports': objTMPPort,
                });
            }
            else {
                objExist = objResult['products'].find(d => d.producto_id == data.producto_id);
                if(objExist) {
                    let intKeyProduct = 0;
                    objResult['products'].map((d,k) => {
                        if(d.producto_id == data.producto_id) {
                            intKeyProduct = k;
                        }
                    });
                    let objExistPort = objExist['ports'].find(d => d.producto_id == data.producto_id && d.id == data.ship_id);
                    if(!objExistPort && (data?.ship_id && data.ship_id !== 'None')) {
                        objResult['products'][intKeyProduct]['ports'].push({
                            'id': data.ship_id,
                            'puerto': data.puerto,
                            'contenedores_disponibles': data.p_contenedores_disponibles,
                            'contenedores_liberados': data.p_contenedores_liberados,
                            'fecha_liberacion': data.fecha_liberacion,
                            'fecha_tentativa_embarque': data.fecha_tentativa_embarque,
                            'barco_tentativo_id': data.barco_tentativo_id,
                            'nombre_barco': data.nombre_barco,
                            'producto_id': data.producto_id,
                        });
                    }
                }
            }
        }
    });
    return objResult;
};

const drawInfoExist = async () => {
    open_loading();
    let objProccess = await processObjectExist(objGlobalData),
        elementWeek = document.getElementById('week'),
        elementDataOrdered = document.getElementById('date_order');
    if(objProccess?.week && elementWeek)
        elementWeek.value = objProccess.week;

    if(objProccess?.date_ordered && elementDataOrdered)
        elementDataOrdered.value = objProccess.date_ordered;

    if(objProccess?.closed && objProccess.closed) {
        let btnAdd = document.getElementById('btnAgregar'),
            btnSave = document.getElementById('btnSave'),
            btnClose = document.getElementById('btnClose');
        if(btnAdd)
            btnAdd.parentNode.removeChild(btnAdd);
        if(btnSave)
            btnSave.parentNode.removeChild(btnSave);
        if(btnClose)
            btnClose.parentNode.removeChild(btnClose);
    }

    if(Object.keys(objProccess['products']).length > 0) {
        objProccess['products'].map(async (product) => {
            await drawForm(product);

            if(Object.keys(product['ports']).length > 0) {
                product['ports'].map(async (port) => {
                    await addDetailPort(product.id, port);
                    if(objProccess?.closed && objProccess.closed) {
                        let btnDeleteDetail = document.getElementById(`btn-delete-detail-${product.id}_${port.id}`);
                        if(btnDeleteDetail)
                            btnDeleteDetail.parentNode.removeChild(btnDeleteDetail);
                    }
                })
            }
            if(objProccess?.closed && objProccess.closed) {
                let btnDeleteProduct = document.getElementById(`btn-delete-product-${product.id}`),
                    btnAddPort = document.getElementById(`btn-add-port-${product.id}`);
                if(btnDeleteProduct)
                    btnDeleteProduct.parentNode.removeChild(btnDeleteProduct);
                if(btnAddPort)
                    btnAddPort.parentNode.removeChild(btnAddPort);
            }
        });
    }
    close_loading();
};


const btnAgregar = document.getElementById('btnAgregar'),
    btnSave = document.getElementById('btnSave'),
    btnClose = document.getElementById('btnClose');

if(btnAgregar) {
    btnAgregar.addEventListener('click', async () => {
        let boolFormOrder = await validateFormOrder();
        if(boolFormOrder) {
            drawForm();
        }
        else {
            alert_nova.showNotification("No puedes agregar producto sin datos validos", "warning", "danger");
        }
    });
}

if(btnSave) {
    btnSave.addEventListener('click', async () => {
        validateAllFunctionsToSave();
    });
}

if(btnClose) {
    if(globalOtifID > 0) {
        btnClose.addEventListener('click', async () => {
            dialogConfirm(validateAllFunctionsToSave, [true], "¿Estás seguro?", "Usted va a cerrar la información de un OTIF y no podrá editarlo.", "error");
        });
    }
    else {
        btnClose.setAttribute('disabled', true);
        btnClose.style.cursor = 'not-allowed';
    }
}

if(Object.keys(objGlobalData).length > 0 && globalOtifID !== 0) {
    drawInfoExist();
}