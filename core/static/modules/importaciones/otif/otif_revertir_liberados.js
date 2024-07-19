const sendForm = async () => {
    open_loading();
    let formData = new FormData(document.getElementById('formLiberados'));
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlRevertLiberados, {method:'POST', body:formData});
    const data = await response.json();
    if(data.status) {
        alert_nova.showNotification('Se revirtieron correctamente, espera por favor.', 'add_alert', 'success');
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
        boolFilled = false,
        intTotal = 0;
    contentForm.innerHTML = '';

    arrInputs.forEach(element => {
        if(element.includes('=on')) {
            let name = element.replace("=on","");
            let arrName = name.split('_');
            if(parseInt(arrName[1])) {
                if(!boolFilled)
                    boolFilled = true;
                let strElements = ` <input type='hidden' name='detail-tracking[]' value='${arrName[1]}' >`;
                contentForm.insertAdjacentHTML('beforeend', strElements);
                intTotal += 1;
            }
        }
    });

    if(boolFilled)
        dialogConfirm(sendForm, [], "¿Estás seguro?", `Usted va a revertir ${intTotal} OTIF ya liberado(s)`);
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

const drawData = async (objData) => {
    let container = document.getElementById('content-data');
    let table = `   <table class='table table-striped' id='tblLiberados'>
                        <thead>
                            <tr>
                                <th>¿Revertir Embarque?</th>
                                <th>Producto</th>
                                <th>Puerto</th>
                                <th>Fecha Pedido</th>
                                <th>ID Contenedor</th>
                                <th>ETD</th>
                                <th>Fecha Entrega <br> en Puerto</th>
                                <th>Barco Tentativo</th>
                                <th>Fecha Real <br> de Embarque</th>
                                <th>Barco Real <br> de Embarque</th>
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
                id = (fecha_pedido && puerto) ? `${puerto}-${fecha_pedido}-${data.number_detail}` : "",
                etd = (data.etd) ? data.etd : "",
                fecha_entregada_puerto = (data.fecha_entregada_puerto) ? data.fecha_entregada_puerto : "",
                nombre_barco_tentativo = (data.nombre_barco_tentativo) ? data.nombre_barco_tentativo : "",
                fecha_real_embarque = (data.fecha_real_embarque) ? data.fecha_real_embarque : "",
                nombre_barco_real = (data.nombre_barco_real) ? data.nombre_barco_real : "";
            let strElements = ` <tr>
                                    <td>
                                        <input type='checkbox' name='chk-embarked_${data.id}' class='form-control'>
                                    </td>
                                    <td>${producto}</td>
                                    <td>${puerto}</td>
                                    <td>${fecha_pedido}</td>
                                    <td>${id}</td>
                                    <td>${etd}</td>
                                    <td>${fecha_entregada_puerto}</td>
                                    <td>${nombre_barco_tentativo}</td>
                                    <td>${fecha_real_embarque}</td>
                                    <td>${nombre_barco_real}</td>
                                </tr>`;
            document.getElementById('containerTBody').insertAdjacentHTML('beforeend', strElements);
        });
    }
    else {
        document.getElementById('containerTBody').innerHTML = '<tr colspan="9">No hay datos para mostrar</tr>';
    }
    

    tblLiberados = $('#tblLiberados').DataTable({
        "order": [],
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "All"]
        ],
    });
    drawButtonToSave();
};

const getData = async () => {
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetOtifLiberados, {method:'POST', body:formData});
    const data = await response.json();
    if(data.status)
        drawData(data['data']);
    else
        alert_nova.showNotification(data.message, 'warning', 'danger');
};

const btnSearch = document.getElementById('btnSearch');
if(btnSearch){
    btnSearch.addEventListener('click', () => {
        document.getElementById('content-data').innerHTML = ''
        document.getElementById('contentButton').innerHTML = ''
        getData();
    });
}