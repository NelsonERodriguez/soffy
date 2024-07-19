const objBtnDespacho = document.getElementById('btnDespacho'),
    objBtnCotizacion = document.getElementById('btnCotizacionImpresion'),
    objBtnFactura = document.getElementById('btnFacturaImpresion'),
    objBtnOrden = document.getElementById('btnOrdenImpresion'),
    objBtnGuardar = document.getElementById('btnGuardar'),
    objBtnAnular = document.getElementById('btnAnular'),
    objSucursal = document.getElementById('sucursal'),
    objCliente = document.getElementById('cliente'),
    objClienteImpresion = document.getElementById('cliente_impresion'),
    objDetalles = document.getElementById('tbodyDetalle'),
    objDetallesImpresion = document.getElementById('tbodyDetalleImpresion'),
    objNoCotizacion = document.getElementById('nocotizacion'),
    objDocumento = document.getElementById('documento'),
    objDocumentoImpresion = document.getElementById('documento_impresion'),
    objObservaciones = document.getElementById('observaciones'),
    objEmpresa = document.getElementById('empresa'),
    objEmpresaImpresion = document.getElementById('empresa_impresion');

const printDocument = (id, tipo) => {
    const strUrl = strUrlImpresion.replace('/0/', `/${id}/`).replace('/cotizacion/', `/${tipo}/`);
    window.open(strUrl);
};

const searchCotizacion = () => {

    const strEmpresa = objEmpresa.value;
    const strDocumento = objDocumento.value;
    let boolError = false;

    objDetalles.innerHTML = '';
    objNoCotizacion.value = '';
    objCliente.value = '';
    objObservaciones.value = '';
    objSucursal.innerHTML = '';
    objBtnDespacho.style.display = 'none';
    objBtnOrden.style.display = 'none';
    objBtnGuardar.style.display = 'none';

    if (strEmpresa === '') {
        objEmpresa.style.border = 'solid #f44336 1px';
        boolError = true;
    }
    else {
        objEmpresa.style.border = '';
    }

    if (strDocumento === '') {
        objDocumento.style.border = 'solid #f44336 1px';
        boolError = true;
    }
    else {
        objDocumento.style.border = '';
    }

    if (boolError) {
        alert_nova.showNotification("Debe llenar los campos marcados.", "warning", "danger");
        return false;
    }

    const formElement = document.getElementById('frm_cotizacion');
    const form = new FormData(formElement);
    const csrftoken = getCookie('csrftoken');

    open_loading();
    fetch(strUrlGetCotizaciones, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: form
    })
        .then(response => response.json())
        .then( (data) => {

            close_loading();

            if (data) {

                if (data.cotizacion) {
                    objNoCotizacion.value = data.cotizacion.NoCotizacion;
                    objCliente.value = data.cotizacion.Nombre;
                    objBtnGuardar.style.display = '';
                }
                else {
                    alert_nova.showNotification('Documento no encontrado.', "warning", "danger");
                    objBtnGuardar.style.display = 'none';
                }

                if (data.detalles) {

                    let strDetalles = '';
                    let intRow = 1;
                    for (let key in data.detalles) {
                        const arrDetalles = data.detalles[key];
                        strDetalles += `
                            <tr>
                                <td>${intRow}</td>
                                <td>${arrDetalles.CodigoProducto}</td>
                                <td>${arrDetalles.Descripcion}</td>
                                <td>${arrDetalles.Cantidad}</td>
                                <td>${arrDetalles.Cajas}</td>
                                <td>${arrDetalles.Saldo}</td>
                                <td>${arrDetalles.Saldo_cajas}</td>
                                <td>
                                    <input type="hidden" name="linea[]" id="linea_${intRow}" value="${intRow}">
                                    <input type="hidden" name="noproducto[]" id="noproducto_${intRow}" value="${arrDetalles.NoProducto}">
                                    <input type="hidden" name="saldo[]" id="saldo_${intRow}" value="${arrDetalles.Saldo}">
                                    <input type="number" name="despacho[]" id="despacho_${intRow}" onkeypress="return validar_caracteres(event, 7);" step="0.1" class="form-control" data-row="${intRow}" onchange="changeDespacho(this);">
                                </td>
                            </tr>
                        `;
                        intRow += 1;
                    }
                    objDetalles.innerHTML = strDetalles;

                }

                if (data.sucursales) {

                    let strOpciones = '';
                    for (let key in data.sucursales) {
                        const arrSucursal = data.sucursales[key];
                        strOpciones += `<option value="${arrSucursal.NoSucursal}">${arrSucursal.Nombre} - ${arrSucursal.Direccion}</option>`;
                    }
                    objSucursal.innerHTML = strOpciones;

                }

            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification('Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.', "warning", "danger");
        });

};

const setAnulado = (intCotizacion) => {

    open_loading();
    const csrftoken = getCookie('csrftoken');
    const form = new FormData();
    form.append('nocotizacion', intCotizacion);
    form.append('cotizacion', '1');

    fetch(strUrlSetAnulado, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: form
    })
        .then(response => response.json())
        .then((data) => {

            close_loading();

            if (data.status) {
                objEmpresaImpresion.value = '';
                objDocumentoImpresion.value = '';
                objClienteImpresion.value = '';
                $('#modal_impresion').modal('hide');
                simple_redireccion(strUrlPedidos);
            }
            else {
                alert_nova.showNotification("Ocurrió un error al enviar a peso, intente de nuevo. Si continua el error comuníquese con IT.", "add_alert", "success");
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
        });

};

const searchCotizacionImpresion = () => {

    const strEmpresa = objEmpresaImpresion.value;
    const strDocumento = objDocumentoImpresion.value;
    let boolError = false;
    objDetallesImpresion.innerHTML = '';
    if (objBtnCotizacion) objBtnCotizacion.style.display = 'none';
    if (objBtnFactura) objBtnFactura.style.display = 'none';
    if (objBtnOrden) objBtnOrden.style.display = 'none';
    if (objBtnAnular) objBtnAnular.style.display = 'none';
    if (objBtnCotizacion) objBtnCotizacion.removeAttribute('onclick');
    if (objBtnFactura) objBtnFactura.removeAttribute('onclick');
    if (objBtnOrden) objBtnOrden.removeAttribute('onclick');
    if (objBtnAnular) objBtnAnular.removeAttribute('onclick');

    if (strEmpresa === '') {
        objEmpresaImpresion.style.border = 'solid #f44336 1px';
        boolError = true;
    }
    else {
        objEmpresaImpresion.style.border = '';
    }

    if (strDocumento === '') {
        objDocumentoImpresion.style.border = 'solid #f44336 1px';
        boolError = true;
    }
    else if (isNaN(strDocumento)) {
        objDocumentoImpresion.style.border = 'solid #f44336 1px';
        alert_nova.showNotification('Solo puede ingresar números.', "warning", "danger");
        boolError = true;
    }
    else {
        objDocumentoImpresion.style.border = '';
    }

    if (boolError) {
        alert_nova.showNotification("Debe llenar los campos marcados.", "warning", "danger");
        return false;
    }

    const formElement = document.getElementById('frm_impresion');
    const form = new FormData(formElement);
    const csrftoken = getCookie('csrftoken');

    open_loading();
    fetch(strUrlGetDocumentosImpresion, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: form
    })
        .then(response => response.json())
        .then( (data) => {

            close_loading();

            if (data) {

                if (data.cotizacion) {
                    objClienteImpresion.value = data.cotizacion.Nombre;
                    if (objBtnCotizacion) objBtnCotizacion.style.display = '';
                    if (objBtnCotizacion) objBtnCotizacion.setAttribute('onclick', `printDocument(${data.cotizacion.NoCotizacion}, 'cotizacion');`);
                    if (data.cotizacion.NoFactura) {
                        if (objBtnFactura) objBtnFactura.style.display = '';
                        if (objBtnFactura) objBtnFactura.setAttribute('onclick', `printDocument(${data.cotizacion.NoFactura}, 'factura');`);
                    }
                    if (objBtnOrden) objBtnOrden.style.display = '';
                    if (objBtnOrden) objBtnOrden.setAttribute('onclick', `printDocument(${data.cotizacion.NoCotizacion}, 'orden');`);
                    if (objBtnAnular) objBtnAnular.style.display = '';
                    if (objBtnAnular) objBtnAnular.setAttribute('onclick', `dialogConfirm(setAnulado, ${data.cotizacion.NoCotizacion});`);
                }
                else {
                    alert_nova.showNotification('Documento no encontrado o anulado.', "warning", "danger");
                    objClienteImpresion.value = '';
                }

                if (data.despachos) {

                    let strDetalles = '';
                    let intRow = 1;
                    for (let key in data.despachos) {
                        const arrDetalles = data.despachos[key];
                        strDetalles += `
                            <tr>
                                <td>${intRow}</td>
                                <td>${arrDetalles.NoCotizacionSF}</td>
                                <td>${arrDetalles.Direccion}</td>
                                <td>${arrDetalles.FechaDespacho}</td>
                                <td>${arrDetalles.Observaciones}</td>
                                <td>
                                    <button type="button" class="btn btn-outline-info" onclick="printDocument(${arrDetalles.NoCotizacionSF}, 'despacho');">
                                        <i class='material-icons'>print</i> Despacho parcial
                                    </button>
                                </td>
                            </tr>
                        `;
                        intRow += 1;
                    }
                    objDetallesImpresion.innerHTML = strDetalles;

                }

            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification('Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.', "warning", "danger");
        });

};

const changeDespacho = (objNumber) => {
    const intRow = objNumber.getAttribute('data-row');
    const objThisSaldo = document.getElementById(`saldo_${intRow}`);
    const intDespacho = (objNumber.value * 1);
    const intThisSaldo = (objThisSaldo.value * 1);

    if (intDespacho > intThisSaldo) {
        alert_nova.showNotification('La cantidad sobre pasa el saldo disponible.', "warning", "danger");
        objNumber.value = '';
        return false;
    }
};

const getPedidos = () => {
    const divPedidos = document.getElementById('divPedidos')

    const csrftoken = getCookie('csrftoken');
    open_loading();
    fetch(strUrlGetPedidos, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        }
    })
        .then(response => response.json())
        .then( (data) => {

            close_loading();
            let strTable = `<table id="datatables" class="table table-hover table-bordered">
                                <thead>
                                    <tr>
                                        <th>No Pedido</th>
                                        <th>Código Cliente</th>
                                        <th>Cliente</th>
                                        <th>Vendedor</th>
                                        <th>Fecha</th>
                                        <th>Observaciones</th>
                                        <th>No Sucursal</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>`;

            for (let key in data.pedidos) {

                const arrDatos = data.pedidos[key];
                const strObservacion = (arrDatos.Observaciones)? arrDatos.Observaciones : "";
                let strFecha = '';
                if (arrDatos.Fecha) {
                    const arrSplit = arrDatos.Fecha.replace('T', ' ').substr(0, 19).split(' ');
                    const arrSplitFecha = arrSplit[0].split('-');
                    strFecha = `${arrSplitFecha[2]}/${arrSplitFecha[1]}/${arrSplitFecha[0]} ${arrSplit[1]}`;
                }

                const intNoEstado = parseInt(arrDatos.NoEstado);

                let strStyle = '';
                let strOnclick = '';
                if (intNoEstado === 5) {
                    strStyle = 'color: #f44336; cursor: not-allowed;';
                }
                else if (intNoEstado === 6) {
                    strStyle = 'color: green; cursor: pointer;';
                    strOnclick = `goForDetail(${arrDatos.NoPedido});`;
                }
                else {
                    strStyle = 'cursor: pointer;';
                    strOnclick = `goForDetail(${arrDatos.NoPedido});`;
                }

                strTable += `
                    <tr style="${strStyle}" onclick="${strOnclick}">
                        <td>${arrDatos.NoPedido}</td>
                        <td>${arrDatos.CodigoCliente}</td>
                        <td>${arrDatos.Nombre}</td>
                        <td>${arrDatos.name}</td>
                        <td>${strFecha}</td>
                        <td>${strObservacion}</td>
                        <td>${arrDatos.NoSucursal}</td>
                        <td>${arrDatos.Descripcion}</td>
                    </tr>
                `;

            }

            strTable += `</tbody>
                </table>`;

            divPedidos.innerHTML = strTable;

            $('#datatables').DataTable({
                "pagingType": "full_numbers",
                "lengthMenu": [
                    [10, 25, 50, -1],
                    [10, 25, 50, "All"]
                ],
                "order": [0, "desc"],
                iDisplayLength: -1,
                responsive: false,
                language: objLenguajeDataTable,
            });

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification('Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.', "warning", "danger");
        });

};

const saveDespacho = () => {
    const csrftoken = getCookie('csrftoken');
    const formElement = document.getElementById('frm_cotizacion');
    const form = new FormData(formElement);
    const objDespacho = document.querySelectorAll(`input[name="despacho[]"]`);

    if (objSucursal.value === '') {
        alert_nova.showNotification("Debe seleccionar sucursal.", "warning", "danger");
        objSucursal.style.border = 'solid #f44336 1px';
        return false;
    }
    else {
        objSucursal.style.border = '';
    }

    let boolGrabar = false;
    objDespacho.forEach((element) => {
        if (!boolGrabar) {
            boolGrabar = (element.value !== '');
        }
    });

    if (!boolGrabar) {
        alert_nova.showNotification("Debe tener al menos un producto con el despacho ingresado.", "warning", "danger");
        return false;
    }

    open_loading();

    fetch(strUrlSaveDespacho, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: form
    })
        .then(response => response.json())
        .then( (data) => {

            close_loading();

            if (data.status) {
                alert_nova.showNotification(data.msj, "add_alert", "success");
                document.getElementById('nocotizacionsf').value = data.cotizacionsf;
                objBtnDespacho.setAttribute('onclick', `printDocument(${data.cotizacionsf}, 'despacho');`);
                objBtnDespacho.style.display = '';
                objBtnGuardar.style.display = 'none';
            }
            else {
                alert_nova.showNotification(data.msj, "warning", "danger");
                document.getElementById('nocotizacionsf').value = '';
                objBtnDespacho.removeAttribute('onclick');
                objBtnDespacho.style.display = 'none';
                objBtnGuardar.style.display = '';
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification('Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.', "warning", "danger");
        });

};

const goForDetail = (intPedido) => {
    const srUrl = strUrlPedidoDetalle.replace('0', intPedido);
    simple_redireccion(srUrl);
};

getPedidos();
setInterval(getPedidos, 30000);
