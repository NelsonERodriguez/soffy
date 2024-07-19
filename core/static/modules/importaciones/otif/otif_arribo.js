const sendForm = async () => {
    open_loading();
    let formData = new FormData(document.getElementById('formArribo'));
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlRevertLiberados, {method:'POST', body:formData});
    const data = await response.json();
    if(data.status) {
        alert_nova.showNotification('Se guardaron correctamente, espera por favor.', 'add_alert', 'success');
        setTimeout(() => { location.reload(); }, 2500);
    }
    else {
        open_loading();
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
};

const makeFormSave = async () => {
    let strInputs = tblArribo.$("input").serialize(),
        arrInputs = strInputs.split("&"),
        contentForm = document.getElementById('formArribo'),
        boolFilled = false,
        intTotal = 0;
    contentForm.innerHTML = '';

    arrInputs.forEach(element => {
        if(element.includes('=on')) {
            let name = element.replace("=on","");
            let arrName = name.split('_');
            if(parseInt(arrName[1])) {
                let strDateArrive = arrInputs.find(e => e.includes(`date-arrive_${arrName[1]}`)),
                    strDateReal = '';
                    if(strDateArrive)
                        strDateReal = strDateArrive.replace(`date-arrive_${arrName[1]}=`,"");
                
                if(strDateReal !== '') {
                    if(!boolFilled)
                        boolFilled = true;
                    let strElements = ` <input type='hidden' name='detail-tracking[]' value='${arrName[1]}' >
                                        <input type='hidden' name='date-real[]' value='${strDateReal}' >`;
                    contentForm.insertAdjacentHTML('beforeend', strElements);
                    intTotal += 1;
                }
            }
        }
    });

    if(boolFilled)
        dialogConfirm(sendForm, [], "¿Estás seguro?", `Usted va a asignarle fecha de arribo a ${intTotal} detalle(s)`);
    else
        alert_nova.showNotification("No hay información valida o completa para guardar", 'warning', 'danger');
};

const hideModalALot = async (boolClean = false) => {
    $('#modalAddALot').modal('hide');
    if(boolClean){
        objGlobalTMPArrive = {
            'max-date': '',
            'details': []
        };
        let btn = document.getElementById('btnSetLot');
        if(btn)
            btn.parentNode.removeChild(btn);
    }
};

const asignALot = async () => {
    let dateArrive = document.getElementById('date-arrive').value;
    if(dateArrive == '') {
        alert_nova.showNotification('No puedes poner información incompleta', 'warning', 'danger');
    }
    else {
        open_loading();
        if(Object.keys(objGlobalTMPArrive).length > 1) {
            objGlobalTMPArrive.map(id => {
                document.getElementById(`date_arrive_${id}`).value = dateArrive;
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
    if(Object.keys(objGlobalTMPArrive).length <= 0) {
        $('#modalAddALot').modal('hide');
        alert_nova.showNotification('Ocurrio un error al buscar elementos seleccionados', 'warning', 'danger');
    }
};

const setALotArrive = async () => {
    objGlobalTMPArrive = [];
    let strInputs = tblArribo.$("input").serialize(),
        arrInputs = strInputs.split("&");
    arrInputs.forEach(element => {
        let arrInputValue = element.split('='),
            arrInput = (arrInputValue[0]) ? arrInputValue[0].split('_') : [],
            intID = (arrInput[1]) ? arrInput[1] : 0;
        let boolInclude = element.includes('=on');
        if(intID && boolInclude) {
            objGlobalTMPArrive.push(intID);
        }
    });
    let btn = document.getElementById('btnSetLot');
    if(Object.keys(objGlobalTMPArrive).length > 1) {
        if(!btn) {
            let strButton = `   <button type='button' class='btn btn-outline-primary' id='btnSetLot'>
                                    <i class="fad fa-exchange-alt"></i>
                                    Una Misma Fecha
                                </button>`;
            document.getElementById('contentButton').insertAdjacentHTML('beforeend', strButton);
            document.getElementById('btnSetLot').addEventListener('click', () => {
                showModal();
            });
        }
    }
    else {
        objGlobalTMPArrive = [];
        if(btn)
            btn.parentNode.removeChild(btn);
    }
};

const drawData = async (objData) => {
    let container = document.getElementById('content-data');
    let table = `   <table class='table' id='tblArribo'>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Puerto</th>
                                <th>Fecha Pedido</th>
                                <th>ID <br> Contenedor</th>
                                <th>ETD</th>
                                <th>Fecha Entrega <br> en Puerto</th>
                                <th>Barco Tentativo</th>
                                <th>Fecha Real <br> de Embarque</th>
                                <th>Barco Real <br> de Embarque</th>
                                <th>¿Arribó?</th>
                                <th>Fecha Real <br> de Arribo</th>
                            </tr>
                        </thead>
                        <tbody id='containerTBody'></tbody>
                    </table>`;
    container.insertAdjacentHTML('beforeend', table);

    if(Object.keys(objData).length > 0) {
        objData.map(data => {
            let producto = (data.producto) ? data.producto : "",
                puerto = (data.puerto) ? data.puerto : "",
                fecha_pedido = (data.fecha_pedido) ? data.fecha_pedido : "",
                id = data.number_detail,
                etd = (data.etd) ? data.etd : "",
                fecha_entregada_puerto = (data.fecha_entregada_puerto) ? data.fecha_entregada_puerto : "",
                nombre_barco_tentativo = (data.nombre_barco_tentativo) ? data.nombre_barco_tentativo : "",
                fecha_real_embarque = (data.fecha_real_embarque) ? data.fecha_real_embarque : "",
                nombre_barco_real = (data.nombre_barco_real) ? data.nombre_barco_real : "";
            let strElements = ` <tr>
                                    <td>${producto}</td>
                                    <td>${puerto}</td>
                                    <td>${fecha_pedido}</td>
                                    <td>${id}</td>
                                    <td>${etd}</td>
                                    <td>${fecha_entregada_puerto}</td>
                                    <td>${nombre_barco_tentativo}</td>
                                    <td>${fecha_real_embarque}</td>
                                    <td>${nombre_barco_real}</td>
                                    <td>
                                        <input type='checkbox' name='chk-embarked_${data.id}' id='chk-embarked_${data.id}' class='form-control' onchange='setALotArrive()'>
                                    </td>
                                    <td>
                                        <input type='date' name='date-arrive_${data.id}' id='date_arrive_${data.id}' class='form-control'>
                                    </td>
                                </tr>`;
            document.getElementById('containerTBody').insertAdjacentHTML('beforeend', strElements);
        });
    }
    else {
        document.getElementById('containerTBody').innerHTML = '<tr colspan="11">No hay datos para mostrar</tr>';
    }
    

    tblArribo = $('#tblArribo').DataTable({
        "order": [],
        "lengthMenu": [ [-1], ["All"] ],
    });
};

const getData = async () => {
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetOtifForArrive, {method:'POST', body:formData});
    const data = await response.json();
    if(data.status)
        drawData(data['data']);
    else
        alert_nova.showNotification(data.message, 'warning', 'danger');
};

const btn = document.getElementById('btnSave');
if(btn) {
    btn.addEventListener('click', () => {
        makeFormSave();
    });
}

getData();
