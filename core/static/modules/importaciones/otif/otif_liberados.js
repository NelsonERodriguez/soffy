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

const sendForm = async () => {
    open_loading();
    let formData = new FormData(document.getElementById('formLiberados'));
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlSaveLiberados, {method:'POST', body:formData});
    const data = await response.json();
    if(data.status) {
        alert_nova.showNotification('Se guardaron correctamente los contenedores como embarcados', 'add_alert', 'success');
        setTimeout(() => { location.reload(); }, 2500);
    }
    else {
        open_loading();
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
};

const makeFormSave = async () => {
    let strInputs = tblLiberados.$("input").serialize(),
        arrInputs = strInputs.split("&"),
        contentForm = document.getElementById('formLiberados'),
        boolError = false,
        intTotal = intEmbarked = 0;
    contentForm.innerHTML = '';

    let strFilter = 'pais_',
        arrTMP = arrInputs.filter(element => element.includes(strFilter));
    arrTMP.forEach(element => {
        let arrInputValue = element.split('='),
            arrInput = (arrInputValue[0]) ? arrInputValue[0].split('_') : [],
            intID = (arrInput[1]) ? arrInput[1] : 0,
            strElementPais = arrInputs.find(e => e.includes(`pais_${intID}`)),
            strPais = (strElementPais) ? strElementPais.replace(`pais_${intID}=`,"") : '',
            strElements = `<input type='hidden' name='country[]' value='${strPais}' />`,
            dateDelivered = arrInputs.find(e => e.includes(`date-entregada_${intID}`)),
            strDateDelivered = dateDelivered.replace(`date-entregada_${intID}=`,"");;
        if(intID && !boolError) {
            if(arrInputValue[1] !== '') {
                let objTMPChecked = arrInputs.find(e => e.includes(`chk-embarked_${intID}=on`)),
                    strDateReal = strShipReal = '';
                strElements += `<input type='hidden' name='detail-tracking[]' value='${intID}' >
                                <input type='hidden' name='detail-delivered-port[]' value='${strDateDelivered}' >`;
                if(objTMPChecked) {
                    let strElementDateReal = arrInputs.find(e => e.includes(`date-real_${intID}`)),
                        strElementShipReal = arrInputs.find(e => e.includes(`ship-real_${intID}`));
                    if(strElementDateReal)
                        strDateReal = strElementDateReal.replace(`date-real_${intID}=`,"");
                    if(strElementShipReal)
                        strShipReal = strElementShipReal.replace(`ship-real_${intID}=`,"");
                    
                    if(strDateReal == '' || (strShipReal == '' || strShipReal == '0'))
                        boolError = true;
                    else
                        intEmbarked++
                }
                strElements += `<input type='hidden' name='date-real[]' value='${strDateReal}' />
                                <input type='hidden' name='ship-real[]' value='${strShipReal}' />`;
                contentForm.insertAdjacentHTML('beforeend', strElements);
                intTotal += 1;
            }
        }
    });

    if(!boolError && intTotal > 0)
        dialogConfirm(sendForm, [], "¿Estás seguro?", `Usted va a guardar ${intTotal} detalle(s), embarcando ${intEmbarked} `);
    else
        alert_nova.showNotification("No hay información valida o completa para guardar", 'warning', 'danger');
};

const drawButtonToSave = async () => {
    const container = document.getElementById('contentButton');
    let strElement = `  <button type='button' class='btn btn-outline-success' id='btnSave'>
                            <i class='fa fa-save'></i>
                            Guardar
                        </button>`;
    container.insertAdjacentHTML('beforeend', strElement);

    const btn = document.getElementById('btnSave');
    if(btn) {
        btn.addEventListener('click', () => {
            makeFormSave();
        });
    }
};

const getAllShips = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(strUrlGetShip, {method:'POST', body:formData});
    const data = await response.json();
    if(data.status)
        objGlobalShips = data.data;
    else
        console.error(data.message);
    close_loading();
    return true;
};

const drawOptionsShips = async () => {
    let strReturnOptions = '';
    objGlobalShips.map(ship => {
        strReturnOptions += `<option data-value="${ship.id}">${ship.nombre}</option>`;
    });
    return strReturnOptions;
};

const setOptionsRow = async (strValue, intKeyElement = '') => {
    let strID = `ship-real`;
    if(intKeyElement !== '')
        strID = `ship-real_${intKeyElement}`
    if(strValue !== '' && !isNaN(strValue))
        document.getElementById(strID).value = strValue;
    else
        document.getElementById(strID).value = '0';
};

const hideModalALot = async (boolClean = false) => {
    $('#modalAddALot').modal('hide');
    if(boolClean){
        objGlobalTMPElementDelivered = {
            'max-date': '',
            'details': []
        };
        let btn = document.getElementById('btnSetLot');
        if(btn)
            btn.parentNode.removeChild(btn);
    }
};

const asignALot = async () => {
    let dateReal = document.getElementById('date-real').value,
        shipReal = document.getElementById('ship-real').value;
    if(dateReal == '' || (shipReal == '' || shipReal == '0')) {
        alert_nova.showNotification('No puedes poner información incompleta', 'warning', 'danger');
    }
    else {
        open_loading();
        if(Object.keys(objGlobalTMPElementDelivered['details']).length > 1) {
            let objShip = objGlobalShips.find(d => d.id == shipReal);
            objGlobalTMPElementDelivered['details'].map(id => {
                document.getElementById(`date-real_${id}`).value = dateReal;
                document.getElementById(`ship-real_${id}`).value = shipReal;
                document.getElementById(`name_ship-real_${id}`).value = objShip.nombre;
            });
            hideModalALot(true);
        }
        close_loading();
    }
};

const showModal = async () => {
    $('#modalAddALot').modal({
        show: true,
        backdrop: 'static',
        keyboard: false,
    });
    let container = document.getElementById('modal-body-add');
    container.innerHTML = '';
    if(Object.keys(objGlobalTMPElementDelivered['details']).length > 1) {
        open_loading();
        let strElementShips = await drawOptionsShips();
        let strNote = `Recuerda que NO puedes poner una fecha menor a ${objGlobalTMPElementDelivered['max-date']}`,
            formatDateMin = objGlobalTMPElementDelivered['max-date'].replaceAll('/', '-');
        let elements = `<div class='row'>
                            <div class='col-12' style='background: red; color:white; font-size: 20px; text-align: center; font-weight: bold; margin-bottom:25px; border-radius: 10px;'>
                                ${strNote}
                            </div>
                            <div class='col-12 col-md-6'>
                                <label>Fecha Real de Embarque</label>
                                <input class='form-control' type='date' id='date-real' min='${formatDateMin}'/>
                            </div>
                            <div class='col-12 col-md-6'>
                                <label>Barco Real de Embarque</label>
                                <input type="text" class="form-control" list="list_ship-real" oninput="setOptionsRow(this.value)" autocomplete="off" required />
                                <input type="hidden" id="ship-real" />
                                <datalist id="list_ship-real">
                                    ${strElementShips}
                                </datalist>
                            </div>
                        </div>`;
        container.insertAdjacentHTML('beforeend', elements);
        close_loading();
    }
    else {
        $('#modalAddALot').modal('hide');
        alert_nova.showNotification('Ocurrio un error al buscar elementos seleccionados', 'warning', 'danger');
    }
};

const validateSetLotRealDate = async () => {
    objGlobalTMPElementDelivered['details'] = [];
    let strInputs = tblLiberados.$("input").serialize(),
        arrInputs = strInputs.split("&"),
        contentForm = document.getElementById('formLiberados');
    contentForm.innerHTML = '';

    let strFilter = 'puede-agruparse_',
        arrTMP = arrInputs.filter(element => element.includes(strFilter));
    arrTMP.forEach(element => {
        let arrInputValue = element.split('='),
            arrInput = (arrInputValue[0]) ? arrInputValue[0].split('_') : [],
            intID = (arrInput[1]) ? arrInput[1] : 0;
        if(intID) {
            let objTMPChecked = arrInputs.find(e => e.includes(`chk-embarked_${intID}=on`)),
                strElementDateReal = arrInputs.find(e => e.includes(`date-real_${intID}`)),
                strElementShipReal = arrInputs.find(e => e.includes(`ship-real_${intID}`));
            if(strElementDateReal)
                strDateReal = strElementDateReal.replace(`date-real_${intID}=`,"");
            if(strElementShipReal)
                strShipReal = strElementShipReal.replace(`ship-real_${intID}=`,"");

            if(objTMPChecked && (strDateReal == '' || (strShipReal == '' || strShipReal == '0'))) {
                let delivered = document.getElementById(`date-entregada_${intID}`);
                
                if(!delivered)
                    return false;

                if(objGlobalTMPElementDelivered['max-date'] == '') {
                    let prevDate = delivered.value;
                    prevDate = prevDate.replaceAll('-', '/');
                    objGlobalTMPElementDelivered['max-date'] = prevDate;
                }
                else {
                    let formatDateDelivered = objGlobalTMPElementDelivered['max-date'],
                        prevTryDate = delivered.value,
                        formatTryDate = prevTryDate.replaceAll('-', '/');

                    const dateDelivered = new Date(formatDateDelivered),
                        dateEmbarked = new Date(formatTryDate);

                    let diffDates = (dateEmbarked - dateDelivered) / (1000 * 60 * 60 * 24);
                    if(diffDates > 0)
                        objGlobalTMPElementDelivered['max-date'] = formatTryDate;
                }
                objGlobalTMPElementDelivered['details'].push(intID);
            }
        }
    });

    let btn = document.getElementById('btnSetLot');
    if(Object.keys(objGlobalTMPElementDelivered['details']).length > 1) {
        if(!btn) {
            let strButton = `   <button type='button' class='btn btn-outline-primary' id='btnSetLot'>
                                    <i class="fad fa-exchange-alt"></i>
                                    Unificar Datos
                                </button>`;
            document.getElementById('contentButton').insertAdjacentHTML('beforeend', strButton);
            document.getElementById('btnSetLot').addEventListener('click', () => {
                showModal();
            });
        }
    }
    else {
        objGlobalTMPElementDelivered = {
            'details': [],
            'max-date': '',
        };
        if(btn)
            btn.parentNode.removeChild(btn);
    }
};

const setColorRow = async (element, intID) => {
    let row = document.getElementById(`tr-liberados-${intID}`);
    if(element.checked) {
        row.style.cssText = `background: #17AAB1; color: white; font-weight: bold;`;
    }
    else {
        row.style.cssText = `background: white; color: #333333; font-weight: 100;`;
    }
    validateSetLotRealDate();
};

const validateDateDelivered = async (element, intID) => {
    let delivered = document.getElementById(`date-entregada_${intID}`);
    if(delivered.value !== '' && element.value !== '') {
        let prevDateDelivered = delivered.value,
            formatDateDelivered = prevDateDelivered.replaceAll('-', '/'),
            prevDateEmbarked = element.value,
            formatDateEmbarked = prevDateEmbarked.replaceAll('-', '/');

        const dateDelivered = new Date(formatDateDelivered),
            dateEmbarked = new Date(formatDateEmbarked);

        let diffDates = (dateEmbarked - dateDelivered) / (1000 * 60 * 60 * 24);

        if(diffDates < 0) {
            element.value = '';
            alert_nova.showNotification('No puedes poner un "Fecha Real de Embarque" menor a la de "Fecha Entrega en Puerto".', 'warning', 'danger');
        }
    }
    else {
        element.value = '';
        alert_nova.showNotification('No puedes ponerle una fecha de embarque sin que haya pasado por el puerto.', 'warning', 'danger');
    }
};

const setCountrySelected = async (intID) => {
    let elementSelect = document.getElementById(`select_pais_${intID}`),
        elementHidden = document.getElementById(`pais_${intID}`);
    if(elementSelect && elementHidden)
        elementHidden.value = elementSelect.value;
};

const drawData = async (objData, objDataPaises = {}) => {
    let strElementShips = await drawOptionsShips();
    let container = document.getElementById('content-data');
    let table = `   <table class='table table-bordered' id='tblLiberados'>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Puerto</th>
                                <th>Fecha <br> Pedido</th>
                                <th>ID <br> Contenedor</th>
                                <th>ETD</th>
                                <th>Barco Tentativo</th>
                                <th>Pais</th>
                                <th>Fecha Entrega <br> en Puerto</th>
                                <th>¿Embarcar?</th>
                                <th>Fecha Real <br> de Embarque</th>
                                <th>Barco Real <br> de Embarque</th>
                            </tr>
                        </thead>
                        <tbody id='containerTBody'></tbody>
                    </table>`;
    container.insertAdjacentHTML('beforeend', table);
    let intQuantity = Object.keys(objData).length;
    if(intQuantity > 0) {
        objData.map(data => {
            let strOptions = '';
            objDataPaises.map(d => {
                let strSelected = (d.id == data.pais_id) ? 'selected' : '';
                strOptions += `<option value='${d.id}' ${strSelected}>${d.nombre}</option>`;
            });
            let producto = (data.producto) ? data.producto : "",
                puerto = (data.puerto) ? data.puerto : "",
                fecha_pedido = (data.fecha_pedido) ? data.fecha_pedido : "",
                id = (data?.number_detail) ? data.number_detail : 0,
                etd = (data.etd) ? data.etd : "",
                nombre_barco_tentativo = (data.nombre_barco_tentativo) ? data.nombre_barco_tentativo : "",
                fecha_entregada_puerto = (data.fecha_entregada_puerto) ? data.fecha_entregada_puerto : "",
                str_entragada_but_pending = (data.fecha_entregada_puerto) ? "tr-delivered-but-pending" : "",
                strElementALot = (str_entragada_but_pending == '') ? '' : `<input type='hidden' name='puede-agruparse_${data.id}' id='puede-agruparse_${data.id}' />`,
                fecha_order_pedido = parseInt(fecha_pedido.replaceAll('-', ''));
            let strElements = ` <tr id='tr-liberados-${data.id}' class='${str_entragada_but_pending}'>
                                    <td>${producto}</td>
                                    <td>${puerto}</td>
                                    <td data-order='${fecha_order_pedido}'>${fecha_pedido}</td>
                                    <td>${id}</td>
                                    <td>${etd}</td>
                                    <td>${nombre_barco_tentativo}</td>
                                    <td>
                                        <select class='form-control' name='select_pais_${data.id}' id='select_pais_${data.id}' onchange='setCountrySelected("${data.id}")'>${strOptions}</select>
                                        <input type='hidden' name='pais_${data.id}' id='pais_${data.id}' value=${data.pais_id} />
                                    </td>
                                    <td>
                                        <input type='date' name='date-entregada_${data.id}' id='date-entregada_${data.id}' class='form-control' value='${fecha_entregada_puerto}'>
                                    </td>
                                    <td>
                                        ${strElementALot}
                                        <input type='checkbox' name='chk-embarked_${data.id}' id='chk-embarked_${data.id}' class='form-control' onchange='setColorRow(this, "${data.id}")'>
                                    </td>
                                    <td>
                                        <input type='date' name='date-real_${data.id}' id='date-real_${data.id}' class='form-control' onchange='validateDateDelivered(this, "${data.id}")'>
                                    </td>
                                    <td>
                                        <input type="text" class="form-control" id="name_ship-real_${data.id}" list="list_ship-real_${data.id}" oninput="setOptionsRow(this.value, '${data.id}')" autocomplete="off" required />
                                        <input type="hidden" id="ship-real_${data.id}" name="ship-real_${data.id}" />
                                        <datalist id="list_ship-real_${data.id}">
                                            ${strElementShips}
                                        </datalist>
                                    </td>
                                </tr>`;
            document.getElementById('containerTBody').insertAdjacentHTML('beforeend', strElements);
        });
    }
    else {
        document.getElementById('containerTBody').innerHTML = '<tr colspan="10">No hay datos para mostrar</tr>';
    }
    

    tblLiberados = $('#tblLiberados').DataTable({
        order: [[2, 'asc']],
        dom: 'lfritp',
        "lengthMenu": [ [-1], ["All"] ],
    });
    drawButtonToSave();
    document.getElementById("tblLiberados_info").style.cssText = `font-weight: bold; font-size: 20px; text-transform: uppercase; text-align: center;`;
    if(intQuantity < 100)
        document.getElementById('tblLiberados_info').style.color = 'green';
    else
        document.getElementById('tblLiberados_info').style.color = 'red';
};

const getData = async () => {
    let boolGetShips = await getAllShips();
    if(boolGetShips) {
        let formData = new FormData();
        formData.append('csrfmiddlewaretoken', valCSRF);
        const response = await fetch(urlGetOtifLiberados, {method:'POST', body:formData});
        const data = await response.json();
        if(data.status)
            drawData(data['data'], data?.data_paises);
        else
            alert_nova.showNotification(data.message, 'warning', 'danger');
    }
};

getData();