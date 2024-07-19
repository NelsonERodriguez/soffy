const reverseContainer = async (intIDTransaction) => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('transfer', intIDTransaction);
    const response = await fetch(urlReverseMovement, {method: 'POST', body: formData})
    const data = await response.json();
    if (data.status)
        location.reload();
    else
        console.error(data.message);
    close_loading();
};

const transferContainer = async (intIDTransaction) => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('transfer', intIDTransaction);
    const response = await fetch(urlTransferContainer, {method: 'POST', body: formData})
    const data = await response.json();
    if (data.status) {
        alert_nova.showNotification('Transferencia ejecutada correctamente', 'add_alert', 'success')
        setTimeout(() => {
            location.reload();
        }, 2500);
    }
    else
        alert_nova.showNotification(data.message, 'warning', 'danger');
    close_loading();
};

const sendEmail = async (intIDTransaction) => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('transfer', intIDTransaction);
    const response = await fetch(urlSendEmail, {method: 'POST', body: formData})
    const data = await response.json();
    if (data.status) {
        alert_nova.showNotification('Correo enviado correctamente', 'add_alert', 'success')
        setTimeout(() => {
            location.reload();
        }, 2500);
    }
    else
        alert_nova.showNotification(data.message, 'warning', 'danger');
    close_loading();
};

const drawTableData = async (objData) => {
    let strElements = '';
    if (Object.keys(objData).length > 0) {
        objData.map(detail => {
            let strCustodio = (detail.Custodio == 0) ? 'No' : 'Si',
                intPrice = (!isNaN(detail.costo * 1)) ? detail.costo : '',
                strButtons = (boolReverse) ? `  <button type="button" class="btn btn-outline-danger" onclick="dialogConfirm(reverseContainer, '${detail.id}', 'Revertirás el traslado de este contenedor ¿Deseas continuar?', '¡No podrás revertir esto!', 'error');">
                                                    <i class="far fa-undo-alt"></i>
                                                </button>` : '';
            if(boolChangeTransfer) {
                if(detail.bool_transfer == 'False') {
                    strButtons += ` <button type="button" class="btn btn-outline-warning" onclick="dialogConfirm(transferContainer, '${detail.id}', 'Moverás el contenedor ¿Deseas continuar?', '¡Se enviará tambien el correo!');">
                                        <i class="far fa-exchange"></i>
                                    </button>`;
                }
                else if (detail.bool_email == 'False') {
                    strButtons += ` <button type="button" class="btn btn-outline-success" onclick="dialogConfirm(sendEmail, '${detail.id}', 'Enviarás el correo de este movimiento ¿Deseas continuar?', '');">
                                        <i class="fal fa-envelope-open-text"></i>
                                    </button>`;
                }
            }

            if(!(detail.bool_reverse * 1)) {
                strButtons = '';
            }

            strElements += `<tr>
                                <td data-filter="${detail.NoContenedor}">${detail.NoContenedor}</td>
                                <td data-filter="${detail.CodigoProducto}">${detail.CodigoProducto}</td>
                                <td data-filter="${detail.Descripcion}">${detail.Descripcion}</td>
                                <td data-filter="${detail.bodega_actual}">${detail.bodega_actual}</td>
                                <td data-filter="${detail.bodega_destino}">${detail.bodega_destino}</td>
                                <td data-filter="${detail.transportista}">${detail.transportista}</td>
                                <td data-filter="${strCustodio}">${strCustodio}</td>
                                <td>Q ${numberFormat.format(intPrice)}</td>
                                <td> ${strButtons} </td>
                            </tr>`;
        });
    }
    else {
        strElements = `<tr> <td colspan='9' style='text-align:center;'>No existe informacion a mostrar</td> </tr>`;
    }
    let table = `   <table class="table" id="dtDefault" style="width:100%">
                        <thead>
                            <tr>
                                <th>No Contenedor</th>
                                <th>Codigo</th>
                                <th>Producto</th>
                                <th>Bodega Origen</th>
                                <th>Bodega Destino</th>
                                <th>Transportista</th>
                                <th>Custodio</th>
                                <th>Costo</th>
                                <th>Opciones</th>
                            </tr>
                        </thead>
                        <tbody>${strElements}</tbody>
                    </table>`;
    const content = document.getElementById('contentTable');
    content.innerHTML = table;
    return true;
};

const getTransfersToReverse = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('date-filter', document.getElementById('date-filter').value);
    const response = await fetch(urlGetDataTransferToReverse, {method: 'POST', body: formData})
    const data = await response.json();
    if (data.status) {
        if(Object.keys(data.data).length > 0) {
            let boolMake = await drawTableData(data.data);
            $('#dtDefault').DataTable({
                "pagingType": "full_numbers",
                "lengthMenu": [
                    [10, 25, 50, -1],
                    [10, 25, 50, "Todos"]
                ],
                language: objLenguajeDataTable,
                pageLength: '20',
            });
        }
        else {
            let boolMake = await drawTableData({});
        }
    }
    else {
        console.error(data.message);
    }
    close_loading();
};

getTransfersToReverse();