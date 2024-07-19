let objGlobalToDraw = [];

const makeObject = async (objData) => {
    let objReturn = [];
    objData.map(d => {
        let intDisputa = (d.TipoCobro == '1') ? (d.Total * 1) : 0,
            intAntiguo = (d.TipoCobro == '2') ? (d.Total * 1) : 0,
            intSemanaCorriente = (d.TipoCobro == '3') ? (d.Total * 1) : 0,
            intFuturo = (d.TipoCobro == '4') ? (d.Total * 1) : 0,
            objSalesmanExist = objReturn.find(detail => detail.NoVendedor == d.NoVendedor);

        if(objSalesmanExist) {
            objSalesmanExist['totales'].disputa += intDisputa;
            objSalesmanExist['totales'].antiguo += intAntiguo;
            objSalesmanExist['totales'].corriente += intSemanaCorriente;
            objSalesmanExist['totales'].futuro += intFuturo;
            let objClientExist = objSalesmanExist['clientes'].find(detail => detail.CodigoCliente == d.CodigoCliente);
            if(objClientExist) {
                objClientExist['totales'].disputa += intDisputa;
                objClientExist['totales'].antiguo += intAntiguo;
                objClientExist['totales'].corriente += intSemanaCorriente;
                objClientExist['totales'].futuro += intFuturo;
                objClientExist['facturas'].push({
                    'FechaCobro': d.FechaCobro,
                    'SemanaCobro': d.SemanaCobro,
                    'Fecha': d.Fecha,
                    'Numero': d.Numero,
                    'totales': {
                        'disputa': intDisputa,
                        'antiguo': intAntiguo,
                        'corriente': intSemanaCorriente,
                        'futuro': intFuturo,
                    },
                });
            }
            else {
                objSalesmanExist['clientes'].push({
                    'CodigoCliente': d.CodigoCliente,
                    'NombreCliente': d.NombreCliente,
                    'DiasCredito': d.DiasCredito,
                    'totales': {
                        'disputa': intDisputa,
                        'antiguo': intAntiguo,
                        'corriente': intSemanaCorriente,
                        'futuro': intFuturo,
                    },
                    'facturas': [{
                        'FechaCobro': d.FechaCobro,
                        'SemanaCobro': d.SemanaCobro,
                        'Fecha': d.Fecha,
                        'Numero': d.Numero,
                        'totales': {
                            'disputa': intDisputa,
                            'antiguo': intAntiguo,
                            'corriente': intSemanaCorriente,
                            'futuro': intFuturo,
                        },
                    }],
                });
            }
        }
        else {
            objReturn.push({
                'NoVendedor': d.NoVendedor,
                'NombreVendedor': d.NombreVendedor,
                'totales': {
                    'disputa': intDisputa,
                    'antiguo': intAntiguo,
                    'corriente': intSemanaCorriente,
                    'futuro': intFuturo,
                },
                'clientes': [{
                    'CodigoCliente': d.CodigoCliente,
                    'NombreCliente': d.NombreCliente,
                    'DiasCredito': d.DiasCredito,
                    'totales': {
                        'disputa': intDisputa,
                        'antiguo': intAntiguo,
                        'corriente': intSemanaCorriente,
                        'futuro': intFuturo,
                    },
                    'facturas': [{
                        'FechaCobro': d.FechaCobro,
                        'SemanaCobro': d.SemanaCobro,
                        'Fecha': d.Fecha,
                        'Numero': d.Numero,
                        'totales': {
                            'disputa': intDisputa,
                            'antiguo': intAntiguo,
                            'corriente': intSemanaCorriente,
                            'futuro': intFuturo,
                        },
                    }],
                }],
            });
        }
    });
    return objReturn;
};

const hideDetails = async (intKeySalesman) => {
    let collapse = document.getElementsByClassName(`tr-detail-invoices-${intKeySalesman}`);
    for (let i = 0; i < collapse.length; i++) {
        collapse[i].classList.toggle("hide-me");
    }
};

const drawTableClientsBySalesman = async (objData) => {
    let objClient = objData['clientes'],
        containerButtons = document.getElementById('content-buttons-option');
    containerButtons.innerHTML = '';
    containerGeneral.innerHTML = '';

    let strTable = `<table class='table table-bordered' id='tbl-client'>
                        <thead>
                            <tr>
                                <th colspan='6'>Ves la Información de: ${objData.NombreVendedor}</th>
                            </tr>
                            <tr>
                                <th>Cliente</th>
                                <th>En disputa</th>
                                <th>Por Cobrar Antiguo</th>
                                <th>Esta Semana</th>
                                <th>Por Cobrar Futuro</th>
                                <th>Total</th>
                            </tr>    
                        </thead>
                        <tbody id='tbl-client-body'></tbody>
                    </table>`;
    containerGeneral.insertAdjacentHTML('beforeend', strTable);
    const containerRows = document.getElementById('tbl-client-body');

    objClient.map((detail, key) => {
        let intSumTotal = (detail['totales'].disputa * 1) + (detail['totales'].antiguo * 1) + (detail['totales'].corriente * 1) + (detail['totales'].futuro * 1);
        let strTotal = numberFormat.format(intSumTotal.toFixed(2)),
            strDisputa = numberFormat.format(detail['totales']['disputa'].toFixed(2)),
            strAntiguo = numberFormat.format(detail['totales']['antiguo'].toFixed(2)),
            strCorriente = numberFormat.format(detail['totales']['corriente'].toFixed(2)),
            strFuturo = numberFormat.format(detail['totales']['futuro'].toFixed(2)),
            trsDetailInvoices = '';
        
        if(Object.keys(detail['facturas']).length > 0) {
            let strRowsInvoices = '';
            detail['facturas'].map((detailInvoice, keyInvoice) => {
                strRowsInvoices += `<tr>
                                        <td>${detailInvoice['Fecha']}</td>
                                        <td>${detailInvoice['FechaCobro']}</td>
                                        <td>${detailInvoice['Numero']}</td>
                                        <td>${detailInvoice['SemanaCobro']}</td>
                                        <td>${detailInvoice['totales']['disputa']}</td>
                                        <td>${detailInvoice['totales']['antiguo']}</td>
                                        <td>${detailInvoice['totales']['corriente']}</td>
                                        <td>${detailInvoice['totales']['futuro']}</td>
                                    </tr>`;
            });
            trsDetailInvoices = `   <tr class='hide-me tr-detail-invoices-${key}'>
                                        <td colspan='6'>
                                            <table class='table table-bordered'>
                                                <thead>
                                                    <tr>
                                                        <th>Fecha Cobro</th>
                                                        <th>Fecha</th>
                                                        <th>Número</th>
                                                        <th>Semana Cobro</th>
                                                        <th>En disputa</th>
                                                        <th>Por Cobrar Antiguo</th>
                                                        <th>Esta Semana</th>
                                                        <th>Por Cobrar Futuro</th>
                                                    </tr>
                                                </thead>
                                                <tbody>${strRowsInvoices}</tbody>
                                            </table>
                                        </td>
                                    </tr>`;
        }

        let strRow = `  <tr id='tr-client-${key}' class='tr-client' onclick='hideDetails("${key}")'>
                            <td>${detail.NombreCliente}</td>
                            <td class='td-amounts'>${strDisputa}</td>
                            <td class='td-amounts'>${strAntiguo}</td>
                            <td class='td-amounts'>${strCorriente}</td>
                            <td class='td-amounts'>${strFuturo}</td>
                            <td class='td-amounts'>${strTotal}</td>
                        </tr>
                        ${trsDetailInvoices}`;
        containerRows.insertAdjacentHTML('beforeend', strRow);

        let rowEvent = document.getElementById(`tr-client-${key}`);
    });

    let strButtonBack = `  <button class='btn btn-outline-primary' id='btnBackGeneral'>
                                <i class="far fa-undo"></i>
                                Ver por Vendedores
                            </button>`;
    containerButtons.insertAdjacentHTML('beforeend', strButtonBack);

    let btnBack = document.getElementById("btnBackGeneral");
    if(btnBack)
        btnBack.addEventListener('click', () => {
            drawPrincipalTable(objGlobalToDraw);
        });
}

const drawPrincipalTable = async (objData) => {
    document.getElementById('content-buttons-option').innerHTML = '';
    containerGeneral.innerHTML = '';
    let strTable = `<table class='table table-bordered' id='tbl-general'>
                        <thead>
                            <tr>
                                <th>Vendedor</th>
                                <th>En disputa</th>
                                <th>Por Cobrar Antiguo</th>
                                <th>Esta Semana</th>
                                <th>Por Cobrar Futuro</th>
                                <th>Total</th>
                            </tr>    
                        </thead>
                        <tbody id='tbl-general-body'></tbody>
                    </table>`;
    containerGeneral.insertAdjacentHTML('beforeend', strTable);

    const containerRows = document.getElementById('tbl-general-body');
    objData.map((detail, key) => {
        let intSumTotal = (detail['totales'].disputa * 1) + (detail['totales'].antiguo * 1) + (detail['totales'].corriente * 1) + (detail['totales'].futuro * 1);
        let strTotal = numberFormat.format(intSumTotal.toFixed(2)),
            strDisputa = numberFormat.format(detail['totales']['disputa'].toFixed(2)),
            strAntiguo = numberFormat.format(detail['totales']['antiguo'].toFixed(2)),
            strCorriente = numberFormat.format(detail['totales']['corriente'].toFixed(2)),
            strFuturo = numberFormat.format(detail['totales']['futuro'].toFixed(2));
        let strRow = `  <tr id='tr-salesman-${key}' class='tr-salesman'>
                            <td>${detail.NombreVendedor}</td>
                            <td class='td-amounts'>${strDisputa}</td>
                            <td class='td-amounts'>${strAntiguo}</td>
                            <td class='td-amounts'>${strCorriente}</td>
                            <td class='td-amounts'>${strFuturo}</td>
                            <td class='td-amounts'>${strTotal}</td>
                        </tr>`;
        containerRows.insertAdjacentHTML('beforeend', strRow);

        let rowEvent = document.getElementById(`tr-salesman-${key}`);
        if(rowEvent)
            rowEvent.addEventListener('click', () => {
                drawTableClientsBySalesman(detail);
            });
    });
};

const processPrincipalTable = async (objData) => {
    if(Object.keys(objData).length > 0) {
        open_loading();
        objGlobalToDraw = await makeObject(objData);
        close_loading();
        if(Object.keys(objGlobalToDraw).length > 0)
            drawPrincipalTable(objGlobalToDraw);
        else
            alert_nova.showNotification('Ocurrio un error al procesar la informacion dentro de la ventana', 'warning', 'danger');
    }
    else
        alert_nova.showNotification('No hay información para la ventana', 'warning', 'danger');
};

const getData = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetData, { method: 'POST', body: formData });
    const data = await response.json();
    close_loading();
    if(data.status)
        if(Object.keys(data.data).length > 0)
            await processPrincipalTable(data.data);
        else
            alert_nova.showNotification(data.message, 'warning', 'danger');
    else
        alert_nova.showNotification(data.message, 'warning', 'danger');
};

getData();