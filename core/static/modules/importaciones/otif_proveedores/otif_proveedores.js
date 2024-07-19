const syncData = () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', document.getElementsByName('csrfmiddlewaretoken')[0].value);

    fetch(`${urlSyncData}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        close_loading();
        if(data.status) {
            alert_nova.showNotification('Información Sincronizada Correctamente, espere por favor.', 'add_alert', 'success');
            setTimeout(() => {
                location.reload()
            }, 3500)
        }
        else {
            alert_nova.showNotification('Ocurrió un error, contacte con IT', 'warning', 'danger');
        }
    })
    .catch(error => console.error(error))
};

const saveNew = async () => {
    let formData = new FormData(),
        elementPO = document.getElementById('new__po');

    if(elementPO) {
        if(elementPO.value !== '' && elementPO.value !== '0'){
            formData.append('csrfmiddlewaretoken', document.getElementsByName('csrfmiddlewaretoken')[0].value);
            objColumnas.forEach(data => {
                if(data?.new_register) {
                    if(data.new_register) {
                        let element = document.getElementById(`new_${data.position}`);
                        formData.append(`${data.position}`, element.value);
                    }
                }
            });

            try {
                let objResponse = await fetch(`${urlCreateNew}`, {method:'POST', body:formData});
                let objData = await objResponse.json();

                if(objData.status) {
                    window.location.reload();
                }
            } catch(error) {
                console.error(error);
            }
        }
        else {
            alert_nova.showNotification("Debe ingresar al menos un P.O.", "warning", "danger");
        }
    }
};

const getProduct = (event, objElement) => {
    if (typeof event.key === "undefined" || event.key === "ArrowLeft" || event.key === "ArrowRight" ||
        event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown" ||
        event.key === " " || event.key === "Meta" || event.key === "Tab" || event.key === "Shift" ||
        event.key === "CapsLock" || event.key === "Alt") return false;

    if((objElement.value).length >= 3 ) {
        let strIDList = objElement.getAttribute('list'),
            elementList =  document.getElementById(strIDList),
            formData = new FormData();
            formData.append('csrfmiddlewaretoken', document.getElementsByName('csrfmiddlewaretoken')[0].value);
            formData.append('str_search', objElement.value);
        elementList.innerHTML = '';
        fetch(`${urlProducto}`, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if(data.status) {
                let strElements = '';
                for(const k in data.data) {
                    const d = data.data[k];
                    strElements += `<option value='${d.CodigoProducto}'>${d.Descripcion}</option>`;
                }
                elementList.innerHTML = strElements;
            }
        })
        .catch(error => console.error())
    }
};

const getSupplier = (event, objElement) => {
    if (typeof event.key === "undefined" || event.key === "ArrowLeft" || event.key === "ArrowRight" ||
        event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown" ||
        event.key === " " || event.key === "Meta" || event.key === "Tab" || event.key === "Shift" ||
        event.key === "CapsLock" || event.key === "Alt") return false;

    if((objElement.value).length >= 3 ) {
        let strIDList = objElement.getAttribute('list'),
            elementList =  document.getElementById(strIDList),
            formData = new FormData();
            formData.append('csrfmiddlewaretoken', document.getElementsByName('csrfmiddlewaretoken')[0].value);
            formData.append('str_search', objElement.value);
        elementList.innerHTML = '';
        fetch(`${urlProveedor}`, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if(data.status) {
                let strElements = '';
                for(const k in data.data) {
                    const d = data.data[k];
                    strElements += `<option value='${d.CodigoProveedor}'>${d.Nombre}</option>`;
                }
                elementList.innerHTML = strElements;
            }
        })
        .catch(error => console.error())
    }
};

const saveDetail = async (strColumn, intPO, intNoOrdenCompra, strStatus = '') => {
    open_loading();
    const form = new FormData();
    let elementValue = '';
    if(strStatus) {
        elementValue = (strStatus.toUpperCase() == 'ABIERTO') ? false : true;
    }
    else {
        elementValue = document.getElementById(`${strColumn}_${intPO}`).value;
    }

    form.append('csrfmiddlewaretoken', document.getElementsByName('csrfmiddlewaretoken')[0].value);
    form.append('column', strColumn);
    form.append('po', intPO);
    form.append('strValue', elementValue);
    form.append('no_orden', intNoOrdenCompra);

    const response = await fetch(`${urlSave}`,{ method: 'POST', body: form, });
    const data = await response.json();

    if (data) {
        if(data.status) {
            if(strColumn === 'proveedor') {
                let elementList = document.getElementById(`${strColumn}_${intPO}`).getAttribute('list');
                document.getElementById(elementList).innerHTML = '';
                document.getElementById(`${strColumn}_${intPO}`).value = data.str;
            }
            else if(strColumn === 'codigo_producto' || strColumn === 'producto') {
                let elementList = document.getElementById(`${strColumn}_${intPO}`).getAttribute('list');
                document.getElementById(elementList).innerHTML = '';
                document.getElementById(`codigo_producto_${intPO}`).value = data.codigo;
                document.getElementById(`producto_${intPO}`).value = data.str;
            }
            else if(strColumn === 'estado') {
                let button = document.getElementById(`${strColumn}_${intPO}`);
                if(data.str == 'false') {
                    button.classList.remove('btn-outline-success');
                    button.classList.add('btn-outline-danger');
                    button.innerHTML = 'Cerrado';
                    button.removeAttribute('onclick');
                    button.setAttribute('onclick', `saveDetail("${strColumn}", "${intPO}", "${data.no_orden}", "Cerrado")`);
                }
                else if(data.str == 'true') {
                    button.classList.remove('btn-outline-danger');
                    button.classList.add('btn-outline-success');
                    button.innerHTML = 'Abierto';
                    button.removeAttribute('onclick');
                    button.setAttribute('onclick', `saveDetail("${strColumn}", "${intPO}", "${data.no_orden}", "Abierto")`);
                }
            }
            else if (strColumn === 'fecha_tentativa_llegada') {
                document.getElementById(`otif_${intPO}`).innerHTML = data.str;
            }
            else if(strColumn === 'fecha_ingreso_puerto') {
                document.getElementById(`otif_${intPO}`).innerHTML = data.str;
                document.getElementById(`semana_${intPO}`).innerHTML = data.codigo;
            }
            close_loading();
        }
    }
    else {
        console.error(data);
    }

    return true;
};

const drawHeaders = async (arrData) => {
    const content = document.getElementById('contentTable');
    let tHeads = '',
        trs = '';
    objColumnas.forEach(element => {
        let arrText = (element.print).split(' ');
        let strClass = (Object.keys(arrText).length > 3) ? 'tHeadsLarge' : ( (element.position == 'comentarios') ? 'tHeadComentarios' : 'tHeadsNormal');
        tHeads += `<th class='${strClass}'>${element.print}</th>`;
    });

    arrData.forEach(order => {
        trs += `<tr>`;
        objColumnas.forEach(column => {
            let valuePosition = (order[column.position] === 0) ? '' : order[column.position],
                strID = `${column.position}_${order._po}`,
                boolCanEdit = (column.fillable) ? ( (boolGlobalCanEdit) ? true : false ) : false;

            if(!boolCanEdit){
                let strPrint = (column.position === 'estado') ? (order[column.position] == 'False' ? 'Abierto' : 'Cerrado') : order[column.position];
                strPrint = column.position === 'otif' ? (order[column.position] == 'False' ? 0 : 1) : order[column.position];

                trs += `<td id='${strID}'>${strPrint}</td>`;
            }
            else {
                if(column.type !== 'select' && column.type !== 'button') {
                    trs += `<td data-search='${valuePosition}'>
                                <input id='${strID}' type='${column.type}' class='form-control' value='${valuePosition}' name='${strID}' onchange='saveDetail("${column.position}", "${order._po}", "${order.no_orden_compra}")'/>
                            </td>`;
                }
                else if(column.type === 'select') {
                    if(column.position === 'codigo_producto' || column.position === 'producto') {
                        trs += `<td data-search='${valuePosition}'>
                                    <input id='${strID}' type='${column.type}' class='form-control' value='${valuePosition}' name='${strID}' list='list_${strID}' autocomplete='off' onkeyup='getProduct(event, this)' onchange='saveDetail("${column.position}", "${order._po}", "${order.no_orden_compra}")'/>
                                    <datalist id="list_${strID}"></datalist>
                                </td>`;
                    }
                    else if (column.position === 'proveedor') {
                        trs += `<td data-search='${valuePosition}'>
                                    <input id='${strID}' type='${column.type}' class='form-control' value='${valuePosition}' name='${strID}' list='list_${strID}' autocomplete='off' onkeyup='getSupplier(event, this)' onchange='saveDetail("${column.position}", "${order._po}", "${order.no_orden_compra}")'/>
                                    <datalist id="list_${strID}"></datalist>
                                </td>`;
                    }
                }
                else if(column.type === 'button') {
                    let strClass = (valuePosition === '' || valuePosition === 'abierto' || valuePosition == '0' || valuePosition == 'False') ? 'btn-outline-success' : 'btn-outline-danger',
                        strPrint = (valuePosition === '' || valuePosition === 'abierto' || valuePosition == '0' || valuePosition == 'False') ? 'Abierto' : 'Cerrado';
                    trs += `<td data-search='${valuePosition}'>
                                <button type='button' class='btn ${strClass}' id='${strID}' onclick='saveDetail("${column.position}", "${order._po}", "${order.no_orden_compra}", "${strPrint}")'>
                                    ${strPrint}
                                </button>
                            </td>`;
                }
            }
        });

        trs += `</tr>`;
    });

    content.innerHTML = `   <table class='table tableCustomOtif table-striped' id='dtDefault' style='width: 100%;'>
                                <thead>
                                    <tr>
                                        ${tHeads}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${trs}
                                </tbody>
                            </table>`;
    return true;
};

const getData = async (intEstado = 0) => {
    open_loading();
    let formData = new FormData();
    formData.append('estado', intEstado);
    formData.append('csrfmiddlewaretoken', valCSRF);

    try {
        let response = await fetch(`${urlGetData}`, {method:'POST', body:formData});
        let data = await response.json();
        const boolDrawTable = drawHeaders(data.data),
            objProperties = {
                'pageLength': 25,
                scrollY: '600px',
                scrollX:        true,
                scrollCollapse: true,
                fixedColumns:   {
                    left: 0,
                }
            };
        if(boolDrawTable)
             makeDataTableDefault(false, true, objProperties);

        $('#dtDefault > thead > tr').css('margin-top', '-5px');
    } catch (error) {
        console.error(error);
    }
    close_loading();
};

const searchByButton = (strSearch) => {
    const btnAbiertos = document.getElementById('btnAbiertos'),
        btCerrados = document.getElementById('btnCerrados');

    if(strSearch === 'abiertos') {
        intActivo = 0;
        btnAbiertos.classList.remove('btn-outline-success');
        btnAbiertos.classList.add('btn-success');
        btnCerrados.classList.remove('btn-danger');
        btnCerrados.classList.add('btn-outline-danger');

        getData(0);
    }
    else {
        intActivo = 1;
        btCerrados.classList.remove('btn-outline-danger');
        btCerrados.classList.add('btn-danger');
        btnAbiertos.classList.remove('btn-success');
        btnAbiertos.classList.add('btn-outline-success');

        getData(1);
    }
};

const launchModal = () => {
    const content = document.getElementById('modal-body');
    let elements = '';
    objColumnas.forEach(data => {
        if(data?.new_register) {
            if(!data.new_register) { return }
            if(data.type !== 'select' && data.type !== 'button') {
                elements += `   <div class='col-12 col-lg-4 col-md-6' style='margin-top: 10px; margin-bottom: 15px;'>
                                    <p style='margin: 0px; padding: 0px;'>${data.print}</p>
                                    <input id='new_${data.position}' type='${data.type}' class='form-control' name='${data.position}' />
                                </div>`;
            }
            else if(data.type === 'select') {
                if (data.position === 'proveedor') {
                    elements += `   <div class='col-12 col-lg-4 col-md-6' style='margin-top: 10px; margin-bottom: 15px;'>
                                        <p style='margin: 0px; padding: 0px;'>${data.print}</p>
                                        <input id='new_${data.position}' type='${data.type}' class='form-control' name='${data.position}' list='list_new_${data.position}' autocomplete='off' onkeyup='getSupplier(event, this)'/>
                                        <datalist id="list_new_${data.position}"></datalist>
                                    </div>`;
                }
            }
        }
    });
    content.innerHTML = elements;

    document.getElementById('modal-footer').innerHTML = `<button class='btn btn-outline-success' type='button' onclick='saveNew()'>Guardar</button>`;

    $('#modal_cotizacion').modal('show');
};

if(btnSyncData) {
    btnSyncData.addEventListener('click', () => {
        syncData();
    });
}

if(btnNewPO) {
    btnNewPO.addEventListener('click', () => {
        launchModal();
    });
}

getData();