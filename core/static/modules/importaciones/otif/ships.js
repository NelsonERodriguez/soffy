let objDataShips = [];

const makeTableExcel = async () => {
    if(Object.keys(objDataShips).length > 0) {
        open_loading();

        const cnt = document.getElementById('cntTable');
        let trs = '';
        objDataShips.map(d => {
            trs += `<tr>
                        <td>${d.nombre}</td>
                        <td>${d.CodigoProducto}</td>
                        <td>${d.producto}</td>
                        <td>${d.contenedores_disponibles}</td>
                        <td>${d.contenedores_liberados}</td>
                        <td>${d.contenedores_pedidos}</td>
                        <td>${d.contenedores_reales}</td>
                    </tr>`;
        });
        let elements = `<table id='tblResume'>
                            <thead>
                                <tr>
                                    <th>Barco</th>
                                    <th>CodigoProducto</th>
                                    <th>Producto</th>
                                    <th>Contenedores Disponibles</th>
                                    <th>Contenedores Liberados</th>
                                    <th>Contenedores Pedidos</th>
                                    <th>Contenedores Reales</th>
                                </tr>
                            </thead>
                            <tbody>${trs}</tbody>
                        </table>`;
        cnt.innerHTML = elements;

        exportTableToExcel('tblResume', `barcos_otif_${semana}_${year}`);
        cnt.innerHTML = '';
        close_loading();
    }
    else {
        alert_nova.showNotification('No hay información a descargar', 'warning', 'danger');
    }
};

const makeObjShips = async (objData) => {
    let objResult = [];
    objData.map(d => {
        if(typeof objResult[d.barco_id] == 'undefined') {
            objResult[d.barco_id] = [];
            if(typeof objResult[d.barco_id][d.producto_id] == 'undefined') {
                objResult[d.barco_id][d.producto_id] = d;
            }
            else {
                let dd = objResult[d.barco_id][d.producto_id];
                dd['contenedores_disponibles'] = d.contenedores_disponibles * 1 + (dd['contenedores_disponibles'] * 1);
                dd['contenedores_liberados'] = d.contenedores_liberados * 1 + (dd['contenedores_liberados'] * 1);
                dd['contenedores_pedidos'] = d.contenedores_pedidos * 1 + (dd['contenedores_pedidos'] * 1);
                dd['contenedores_reales'] = d.contenedores_reales * 1 + (dd['contenedores_reales'] * 1);
            }
        }
        else {
            if(typeof objResult[d.barco_id][d.producto_id] == 'undefined') {
                objResult[d.barco_id][d.producto_id] = d;
            }
            else {
                let dd = objResult[d.barco_id][d.producto_id];
                dd['contenedores_disponibles'] = d.contenedores_disponibles * 1 + (dd['contenedores_disponibles'] * 1);
                dd['contenedores_liberados'] = d.contenedores_liberados * 1 + (dd['contenedores_liberados'] * 1);
                dd['contenedores_pedidos'] = d.contenedores_pedidos * 1 + (dd['contenedores_pedidos'] * 1);
                dd['contenedores_reales'] = d.contenedores_reales * 1 + (dd['contenedores_reales'] * 1);
            }
        }
    });
    return objResult;
}

const drawShips = async (objData) => {
    if(Object.keys(objData).length > 0) {
        let objResult = await makeObjShips(objData);
        if(Object.keys(objResult).length > 0) {
            const cnt = document.getElementById('cntShips');
            cnt.innerHTML = '';
            objResult.map((d, k) => {
                let elmDivs = '',
                    nameShip = '';
                d.map(dd => {
                    nameShip = dd.nombre;
                    elmDivs += `<div class='cntInfoProduct'>
                                    <div class='cntNameShip'>
                                        <div class='strNameProduct'>
                                            ${dd.producto}
                                        </div>
                                    </div>
                                    <div class='detailProducts'>
                                        <div class='rowInfo'>
                                            <div>Disponibles</div>
                                            <div>${dd.contenedores_disponibles}</div>
                                        </div>
                                        <div class='rowInfo'>
                                            <div>Liberados</div>
                                            <div>${dd.contenedores_liberados}</div>
                                        </div>
                                        <div class='rowInfo'>
                                            <div>Pedidos</div>
                                            <div>${dd.contenedores_pedidos}</div>
                                        </div>
                                        <div class='rowInfo rowReal'>
                                            <div>Reales</div>
                                            <div>${dd.contenedores_reales}</div>
                                        </div>
                                    </div>
                                </div>`;
                });

                let tbl = ` <div class='col-12 col-md-4 offset-md-1'>
                                <div class='cntShip'>
                                    <div class='cntNameShip'>
                                        <div class='strNameShip'>
                                            <i class="fas fa-ship fa-3x"></i>
                                            <br>
                                            ${nameShip}
                                        </div>
                                    </div>
                                    <div class='cntShipProducts'>
                                        ${elmDivs}
                                    </div>
                                </div>
                            </div>`;
                
                cnt.insertAdjacentHTML('beforeend', tbl);
            })
        }
    }
};

const getDataShips = async () => {
    open_loading();
    let formData = new FormData(),
        data = [];
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('otif', otifID);
    const response = await fetch(urlGetShips, {method: 'POST', body: formData});
    try {
        data = await response.json();
    } catch (error) {
        console.error(error);
        data = [];
    }
    close_loading();

    if(data?.status) {
        objDataShips = data?.data;
        drawShips(data?.data);
    }
};

getDataShips();