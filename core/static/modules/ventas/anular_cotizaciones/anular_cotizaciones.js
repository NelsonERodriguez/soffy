const drawHeaderQuotation = async (objQuotation, container) => {
    objQuotation.Total = numberFormat.format(objQuotation.Total * 1);
    let strCompany = '',
        strQuotation = '';
    if (strOptionSelected == 'cotizaciones') {
        strCompany = `  <div class="row">
                            <div class="col-12">
                                <b>Empresa:</b> ${objQuotation.RazonSocial}
                            </div>
                        </div>`;
        strQuotation = `<div class="row">
                            <div class="col-12">
                                <b>No. Cotización:</b> ${objQuotation.NoDocumento}
                            </div>
                        </div>`;
    } else {
        strQuotation = `<div class="row">
                            <div class="col-12">
                                <b>No. Pedido:</b> ${objQuotation.NoPedido}
                            </div>
                        </div>`;
    }
    const strElementHeader = `  <div class="col-12 col-md-6 offset-md-3 container-header-detail">
                                    ${strCompany}
                                    ${strQuotation}
                                    <div class="row">
                                        <div class="col-12">
                                            <b>Cliente:</b> ${objQuotation.Nombre}
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12">
                                            <b>Fecha:</b> ${objQuotation.Fecha}
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12">
                                            <b>Total:</b> Q ${objQuotation.Total}
                                        </div>
                                    </div>
                                </div>`;
    container.innerHTML += strElementHeader;
    return true;
};

const drawDetailsQuotation = async (objDetails, container) => {
    let strDetails = '';
    objDetails.map(detail => {
        if (strOptionSelected == 'pedidos') {
            detail.VUnitario = numberFormat.format((detail.Total * 1) / (detail.Cantidad * 1));
        } else {
            detail.VUnitario = numberFormat.format(detail.VUnitario * 1);
        }
        detail.Total = numberFormat.format(detail.Total * 1);
        detail.Cantidad = numberFormat.format(detail.Cantidad * 1);

        strDetails += ` <tr>
                            <td>${detail.Linea}</td>
                            <td>${detail.Descripcion}</td>
                            <td>${detail.Cantidad}</td>
                            <td>${detail.VUnitario}</td>
                            <td>${detail.Total}</td>
                        </tr>`;
    });

    const strElementDetails = ` <div class="row">
                                    <div class="col-12">
                                        <div class="table-responsive">
                                            <table class="table">
                                                <thead class=" text-primary">
                                                    <tr>
                                                        <th>Línea</th>
                                                        <th>Descripcion</th>
                                                        <th>Cantidad</th>
                                                        <th>Precio</th>
                                                        <th>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>${strDetails}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>`;
    container.innerHTML += strElementDetails;
};

const drawButtonOptions = async (container) => {
    const strElements = `   <div class="row">
                                <div class="col-12 text-center">
                                    <div class="form-group">
                                        <button type="button" class="btn btn-fill btn-outline-success" id="btnCancel">
                                            Cancelar
                                        </button>
                                        <button type="button" class="btn btn-fill btn-outline-danger" id="btnNull">
                                            Anular
                                        </button>
                                    </div>
                                </div>
                            </div>`;
    container.innerHTML += strElements;
};

const nullQuotation = async (intQuotation) => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('quotation', intQuotation);
    formData.append('option', strOptionSelected);
    try {
        const response = await fetch(strUrlNull, { method: 'POST', body: formData });
        close_loading();
        if (response.ok) {
            const data = await response.json();
            if (data.status) {
                alert_nova.showNotification(data.message, 'add_alert', 'success');
                document.getElementById('container-info').innerHTML = '';
                return true;
            } else {
                alert_nova.showNotification(data.message, 'warning', 'danger');
                return false;
            }
        } else {
            alert_nova.showNotification(`Ocurrió un error al anular el documentos.`, 'warning', 'danger');
        }
    } catch (e) {
        close_loading();
        console.error(e);
        alert_nova.showNotification(`Ocurrió un error al anular el documentos. <br>Error:<br>${e.message}`, 'warning', 'danger');
        return false;
    }
};

const drawDetailQuotationExist = async (objData) => {
    open_loading();
    const container = document.getElementById('container-info');
    container.innerHTML = '';
    if (Object.keys(objData['cotizacion']).length > 0) {
        const objQuotation = objData['cotizacion'];
        const boolDraw = await drawHeaderQuotation(objQuotation, container);

        if (boolDraw && Object.keys(objData['detalles']).length > 0) {
            const objDetails = objData['detalles'];
            await drawDetailsQuotation(objDetails, container);
        }
        await drawButtonOptions(container);
        const btnCancel = document.getElementById('btnCancel'),
            btnNull = document.getElementById('btnNull');
        if (btnCancel)
            btnCancel.addEventListener('click', () => {
                open_loading();
                container.innerHTML = '';
                close_loading();
            });
        if (btnNull)
            btnNull.addEventListener('click', () => {
                if (strOptionSelected === 'cotizaciones') {
                    nullQuotation(objQuotation.NoCotizacion);
                } else {
                    nullQuotation(objQuotation.NoPedido);
                }
            });
    }
    close_loading();
};

const getPedidos = async () => {
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('empresa', document.getElementById('empresa').value);
    formData.append('option', strOptionSelected);
    try {
        open_loading();
        const response = await fetch(strUrlGetDocuments, { method: 'POST', body: formData });
        close_loading();

        if (response.ok) {
            const data = await response.json();
            if (!data?.status && data?.msg) alert_nova.showNotification(data.msg, 'warning', 'danger');
            return (data?.status) ? data.documentos : [];
        } else {
            return []
        }
    } catch (e) {
        close_loading();
        console.error(e);
        alert_nova.showNotification(`Ocurrió un error al obtener los documentos. <br>Error:<br>${e.message}`, 'warning', 'danger');
        return [];
    }
};

const showListPedidos = async () => {
    const container = document.getElementById('container-info');
    const divGrid = document.getElementById('gridRpt');
    if (divGrid) divGrid.remove();
    const objOptions = {
        element: 'div',
        id: 'gridRpt',
        classes: ['text-center']
    };
    const objDivRpt = await createElement(objOptions);
    container.insertAdjacentElement('afterend', objDivRpt);

    const pedidos = await getPedidos();

    if (pedidos.length) {
        const dataGrid = $('#gridRpt').dxDataGrid({
            dataSource: pedidos,
            // remoteOperations: true,
            columnAutoWidth: true,
            columnsAutoWidth: true,
            showBorders: true,
            filterRow: {
                visible: true,
                applyFilter: "auto"
            },
            searchPanel: {
                visible: true,
                placeholder: "Buscar..."
            },
            headerFilter: {
                visible: true
            },
            allowSorting: true,
            /*editing: {
                mode: 'row',
                allowUpdating: false,
                allowAdding: false,
                allowDeleting: true,
                texts: {
                    confirmDeleteMessage: '¿Esta seguro(a)?',
                    deleteRow: 'Anular',
                },
                useIcons: true,
            },
            onRowRemoving(e) {
                console.log('RowRemoving', e);
                const strDocumento = (strOptionSelected === "cotizaciones") ? e.data.NoCotizacion : e.data.Pedido;
                e.cancel = true;
                console.log('strDocumento', strDocumento);
                
                nullQuotation(strDocumento)
                .then(respuesta => {
                    console.log('respuesta', respuesta);
                    console.log('dataGrid', dataGrid);

                    // if (respuesta) {
                        if (strOptionSelected === "cotizaciones") {
                            pedidos.find((pedido, index) => {
                                if (pedido && pedido.NoCotizacion === e.data.NoCotizacion) {
                                    delete pedidos[index];
                                }
                            });
                        } else {
                            pedidos.find((pedido, index) => {
                                if (pedido && pedido.Pedido === e.data.Pedido) {
                                    delete pedidos[index];
                                }
                            });
                        }
                        dataGrid.refresh();
                    // }

                })
                .catch(error => {
                    console.error('Error al anular', error);
                });
            },*/
            // onRowRemoved(e) {
            //     console.log('RowRemoved', e);
            // },
        }).dxDataGrid('instance');
    } else {
        gridRpt.innerHTML = `Sin registros.`;
        gridRpt.style.width = '100%';
    }

};

const showInfoQuotation = async () => {
    document.getElementById('container-info').innerHTML = '';
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    const strEmpresa = document.getElementById('empresa').value;
    const strCotizaion = document.getElementById('cotizacion').value;
    if (strEmpresa === "" && strOptionSelected === "cotizaciones") {
        alert_nova.showNotification('Seleccione la empresa.', 'warning', 'danger');
    } else if (strCotizaion === "") {
        alert_nova.showNotification('Ingrese el Documento.', 'warning', 'danger');
    } else {
        formData.append('empresa', strEmpresa);
        formData.append('cotizacion', strCotizaion);
        formData.append('option', strOptionSelected);
        const response = await fetch(strUrlShow, { method: 'POST', body: formData });
        const data = await response.json();

        if (data.status) {
            await drawDetailQuotationExist(data.data);
        } else {
            alert_nova.showNotification(data.message, 'warning', 'danger');
        }
        await showListPedidos();
    }

};

const setOptionToNull = async (strOption) => {
    open_loading();
    strOptionSelected = strOption;
    let btnAdd = document.getElementById('btnNullQuotations'),
        btnRemove = document.getElementById('btnNullMobiles'),
        cntStrDescQuotation = document.getElementById('str-container-quotation');
    if (strOptionSelected === 'cotizaciones') {
        btnAdd = document.getElementById('btnNullQuotations');
        btnRemove = document.getElementById('btnNullMobiles');
        document.getElementById('container-company').style.display = 'block';
        cntStrDescQuotation.innerHTML = 'No. Cotización';
    } else if (strOptionSelected === 'pedidos') {
        btnAdd = document.getElementById('btnNullMobiles');
        btnRemove = document.getElementById('btnNullQuotations');
        document.getElementById('container-company').style.display = 'none';
        cntStrDescQuotation.innerHTML = 'No. Pedido';
    }
    btnRemove.classList.add('btn-outline-primary');
    btnRemove.classList.remove('btn-primary');
    btnAdd.classList.add('btn-primary');
    btnAdd.classList.remove('btn-outline-primary');

    document.getElementById('container-info').innerHTML = '';
    await showListPedidos();

    close_loading();
};

if (btnSearch) {
    btnSearch.addEventListener('click', () => {
        showInfoQuotation();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setOptionToNull(strOptionSelected);
});
