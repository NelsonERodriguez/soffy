const objEmpresa = document.getElementById('empresa'),
    objHiddenEmpresa = document.getElementById('empresa_id'),
    objEmpresaF = document.getElementById('empresa_f'),
    objEmpresaE = document.getElementById('empresa_e'),
    objDirEmpresa = document.getElementById('direccion_empresa'),
    objRuta = document.getElementById('ruta'),
    objSucursal = document.getElementById('sucursal'),
    objDirSucursal = document.getElementById('direccion_sucursal'),
    objHdnSucursal = document.getElementById('hdn_sucursal'),
    objCliente = document.getElementById('cliente'),
    objNoCliente = document.getElementById('nocliente'),
    objNitCliente = document.getElementById('nit_cliente'),
    objNitFactura = document.getElementById('nit'),
    objNombreFactura = document.getElementById('nombre'),
    objDireccionFactura = document.getElementById('direccion'),
    objObservacionesFactura = document.getElementById('observaciones'),
    objObservacionesCliente = document.getElementById('observacion_cliente'),
    objCodigoCliente = document.getElementById('codigo_cliente'),
    objDocumento = document.getElementsByName('documento'),
    objDespacho = document.getElementsByName('despacho'),
    objFechaDespacho = document.getElementsByName('fecha_despacho'),
    objBodega = document.getElementsByName('bodega'),
    objTotal = document.getElementById('total'),
    objTdSaldo = document.getElementById('td_saldo'),
    objTdDiasDisponibles = document.getElementById('td_dias_disponibles'),
    objTdDisponibilidad = document.getElementById('td_disponibilidad'),
    objMontoDisponible = document.getElementById('monto_disponible'),
    objTdDiasCredito = document.getElementById('td_dias_credito'),
    objTdLimiteCredito = document.getElementById('td_limite_credito'),
    objVendedor = document.getElementById('vendedor'),
    objNoVendedor = document.getElementById('novendedor'),
    objNoUsuario = document.getElementById('nousuario'),
    objFecha = document.getElementById('fecha'),
    objDiesporciento = document.getElementById('dies_porciento'),
    objBtnFactura = document.getElementById('btnFactura'),
    objBtnCotizacion = document.getElementById('btnCotizacion'),
    objdivBuscarPedido = document.getElementById('divBuscarPedido'),
    objBuscarPedido = document.getElementById('buscar_pedido'),
    objBtnAnular = document.getElementById('btnAnular'),
    objBtnImpresion = document.getElementById('btnImpresion'),
    objBtnTomaPeso = document.getElementById('btnTomaPeso'),
    objEsCredito = document.getElementById('escredito'),
    objBtnSaldo = document.getElementById('btnSaldo'),
    objBtnImpresionOrden = document.getElementById('btnImpresionOrden'),
    objBtnImpresionCotizacion = document.getElementById('btnImpresionCotizacion'),
    objBtnImpresionFactura = document.getElementById('btnImpresionFactura'),
    objBtnAdd = document.getElementById('btn_add'),
    objDivDisponible = document.getElementById('divDisponible'),
    objDivDias = document.getElementById('divDias'),
    objFormaPago = document.getElementById('formapago'),
    objFormaEnvio = document.getElementById('formaenvio'),
    objCodigoNuevo = document.getElementById('codigo_cliente_nuevo'),
    objNitNuevo = document.getElementById('nit_cliente_nuevo'),
    objNombreNuevo = document.getElementById('nombre_cliente_nuevo'),
    objTelNuevo = document.getElementById('tel_cliente_nuevo'),
    objEmailNuevo = document.getElementById('email_cliente_nuevo'),
    objDirNuevo = document.getElementById('direccion_cliente_nuevo'),
    objDirSucursalNuevo = document.getElementById('direccion_sucursal_nuevo'),
    objTdTotalGlobal = document.getElementById('td_total_global'),
    objCambioNombre = document.getElementById('cambio_nombre'),
    objCambioNit = document.getElementById('cambio_nit'),
    objDate = new Date(),
    objNextDate = new Date(),
    lastDayOfMonth = new Date(objDate.getFullYear(), objDate.getMonth() + 1, 0),
    numberFormatCurrency = new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ',
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    }),
    numberFormatLocal = new Intl.NumberFormat('es-GT', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    });
objNextDate.setDate(objDate.getDate() + 1);

const printDocument = (id, tipo) => {
    const strUrl = strUrlImpresion.replace('/0/', `/${id}/`).replace('/cotizacion/', `/${tipo}/`);
    window.open(strUrl);
};

const setPesado = () => {

    open_loading();
    const csrftoken = getCookie('csrftoken');
    const form = new FormData();
    const objPedido = document.getElementById('pedido');
    const intPedido = (objPedido) ? objPedido.value : 0;
    form.append('pedido', intPedido);

    fetch(strUrlSetPesado, {
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
                simple_redireccion(strUrlPedidos);
            } else {
                alert_nova.showNotification("Ocurrió un error al enviar a peso, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
        });

};

const getCotizacion = () => {

    open_loading();
    const csrftoken = getCookie('csrftoken');
    const form = new FormData();
    const strDocumento = objBuscarPedido.value.trim();
    form.append('cotizacion', strDocumento);

    fetch(strUrlGetCotizacion, {
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

                objNoCliente.value = data.cotizacion.cotizacion.NoCliente;
                objCliente.value = data.cotizacion.cotizacion.NombreCliente;
                // getInfoSaldos(true);
                objCliente.setAttribute('readonly', 'readonly');
                setClass(objCliente);
                objVendedor.value = data.cotizacion.cotizacion.Vendedor;
                setClass(objVendedor);
                objNoVendedor.value = data.cotizacion.cotizacion.NoVendedor;
                setClass(objNoVendedor);
                objNitCliente.setAttribute('readonly', 'readonly');
                objNitCliente.value = data.cotizacion.cotizacion.NIT;
                setClass(objNitCliente);
                objCodigoCliente.setAttribute('readonly', 'readonly');
                objCodigoCliente.value = data.cotizacion.cotizacion.CodigoCliente;
                setClass(objCodigoCliente);
                objEmpresa.value = data.cotizacion.cotizacion.NombreComercial;
                setClass(objEmpresa);
                objDirEmpresa.value = data.cotizacion.cotizacion.DirComercial;
                setClass(objDirEmpresa);
                getSucursales();
                objSucursal.value = data.cotizacion.cotizacion.NoSucursal;
                objSucursal.setAttribute('readonly', 'readonly');
                //objDirSucursal.value = data.cotizacion.cotizacion.RutaSucursal;
                objHdnSucursal.value = data.cotizacion.cotizacion.DireccionEntrega;
                objDirSucursal.value = data.cotizacion.cotizacion.Direccion;
                setClass(objDirSucursal);

                objRuta.value = data.cotizacion.cotizacion.Sucursal;
                objObservacionesFactura.value = data.cotizacion.cotizacion.Observaciones;
                objObservacionesFactura.setAttribute('readonly', 'readonly');
                setClass(objObservacionesFactura);
                objObservacionesCliente.value = data.cotizacion.cotizacion.ObservacionesPedido;
                objObservacionesCliente.setAttribute('readonly', 'readonly');
                setClass(objObservacionesCliente);
                objNitFactura.value = data.cotizacion.cotizacion.NoNit;
                objNitFactura.setAttribute('readonly', 'readonly');
                setClass(objNitFactura);
                objNombreFactura.value = data.cotizacion.cotizacion.Nombre;
                objNombreFactura.setAttribute('readonly', 'readonly');
                setClass(objNombreFactura);
                objDireccionFactura.value = data.cotizacion.cotizacion.DireccionFactura;
                objDireccionFactura.setAttribute('readonly', 'readonly');
                setClass(objDireccionFactura);
                objFecha.value = (data.cotizacion.cotizacion.Fecha) ? data.cotizacion.cotizacion.Fecha.split("T")[0] : "";
                objFecha.setAttribute('readonly', 'readonly');
                setClass(objFecha);

                if (data.cotizacion.cotizacion.GeneraFE === "F") {
                    objDocumento[0].checked = true;
                    objDocumento[1].setAttribute('disabled', 'disabled');
                } else if (data.cotizacion.cotizacion.GeneraFE === "E") {
                    objDocumento[0].setAttribute('disabled', 'disabled');
                    objDocumento[1].checked = true;
                }

                if (data.cotizacion.cotizacion.DespachoER === "E") {
                    objDespacho[0].checked = true;
                    objDespacho[1].setAttribute('disabled', 'disabled');
                    objDespacho[2].setAttribute('disabled', 'disabled');
                } else if (data.cotizacion.cotizacion.GeneraFE === "R") {
                    objDespacho[0].setAttribute('disabled', 'disabled');
                    objDespacho[1].checked = true;
                    objDespacho[2].setAttribute('disabled', 'disabled');
                } else if (data.cotizacion.cotizacion.GeneraFE === "V") {
                    objDespacho[0].setAttribute('disabled', 'disabled');
                    objDespacho[1].setAttribute('disabled', 'disabled');
                    objDespacho[2].checked = true;
                }

                if (data.cotizacion.cotizacion.FDespachoHM === "H") {
                    objFechaDespacho[0].checked = true;
                    objFechaDespacho[1].setAttribute('disabled', 'disabled');
                } else if (data.cotizacion.cotizacion.FDespachoHM === "M") {
                    objFechaDespacho[0].setAttribute('disabled', 'disabled');
                    objFechaDespacho[1].checked = true;
                }

                if (data.cotizacion.cotizacion.PedidoPorCliente === "G") {
                    objBodega[0].checked = true;
                    objBodega[1].setAttribute('disabled', 'disabled');
                } else if (data.cotizacion.cotizacion.PedidoPorCliente === "S") {
                    objBodega[0].setAttribute('disabled', 'disabled');
                    objBodega[1].checked = true;
                }

                //objFormaPago.value = data.cotizacion.cotizacion.FormaPago;
                //objFormaPago.setAttribute('disabled', 'disabled');

                let objFormaPagoEs = document.querySelector(`input[name="formapago"][value="${data.cotizacion.cotizacion.FormaPago}"]`);
                objFormaPagoEs.checked = true;

                document.querySelectorAll(`input[name="formapago"]`).forEach(function(input){
                    input.removeAttribute('disabled');
                    input.parentNode.parentNode.style.display = 'block';
                    if( !input.checked ){
                        input.setAttribute('disabled', 'disabled');

                        if( input.value !== "O" && input.value !== "R" ){
                            input.parentNode.parentNode.style.display = 'none';
                        }
                    }
                });


                //objFormaEnvio.value = data.cotizacion.cotizacion.FormaEnvio;
                if( data.cotizacion.cotizacion.FormaEnvio !== null ){
                    let objFormaEnvioEs = document.querySelector(`input[name="formaenvio"][value="${data.cotizacion.cotizacion.FormaEnvio}"]`);
                    objFormaEnvioEs.checked = true;
                }
                //objFormaEnvio.setAttribute('disabled', 'disabled');

                document.querySelectorAll(`input[name="formaenvio"]`).forEach(function(input){
                    input.removeAttribute('disabled');

                    if( !input.checked ){
                        input.setAttribute('disabled', 'disabled');
                        //input.parentNode.parentNode.style.display =  'none';
                    }
                });

                /*
                document.querySelector('input[name="formaenvio"]').forEach(function(input){
                    input.setAttribute('readonly', 'readonly');
                });
                */

                document.getElementById(`tbodyDetalles`).innerHTML = '';

                let intRow = 1;
                for (let key in data.cotizacion.detalles) {
                    const arrDetalle = data.cotizacion.detalles[key];
                    addRow();

                    const objProducto = document.getElementById(`producto_id_${intRow}`);
                    objProducto.value = arrDetalle.NoProducto;
                    const objCodigoProducto = document.getElementById(`producto_${intRow}`);
                    objCodigoProducto.value = arrDetalle.CodigoProducto;
                    objCodigoProducto.setAttribute('disabled', 'disabled');
                    const objTdDescripcion = document.getElementById(`td_descripcion_${intRow}`);
                    objTdDescripcion.innerText = arrDetalle.Descripcion;
                    const objLibras = document.getElementById(`libras_${intRow}`);
                    objLibras.value = arrDetalle.Cantidad;
                    objLibras.setAttribute('disabled', 'disabled');
                    const objCajas = document.getElementById(`td_cajas_${intRow}`);
                    objCajas.innerText = arrDetalle.Cajas;
                    const objUnitario = document.getElementById(`td_unitario_${intRow}`);
                    objUnitario.innerText = arrDetalle.VUnitario;
                    const objTotal = document.getElementById(`td_total_${intRow}`);
                    objTotal.innerText = arrDetalle.Total;

                    const objUnitarioHdn = document.getElementById(`unitario_${intRow}`);
                    objUnitarioHdn.value = parseFloat(arrDetalle.VUnitario);
                    const objUnitarioOriginalHdn = document.getElementById(`unitario_original_${intRow}`);
                    objUnitarioOriginalHdn.value = parseFloat(arrDetalle.VUnitario);

                    const objEliminar = document.getElementById(`btnEliminar_${intRow}`);
                    if (objEliminar) objEliminar.remove();

                    intRow++;
                }

                if (objBtnAdd) objBtnAdd.style.setProperty('display', 'none');
                // if (objBtnFactura) objBtnFactura.style.setProperty('display', 'none');
                if (objBtnCotizacion) objBtnCotizacion.style.setProperty('display', 'none');
                if (objBtnTomaPeso) objBtnTomaPeso.style.setProperty('display', 'none');
                if (objBtnImpresion) objBtnImpresion.style.removeProperty('display');
                if (objBtnImpresionOrden) objBtnImpresionOrden.setAttribute('onclick', `printDocument(${data.cotizacion.cotizacion.NoCotizacion}, 'orden')`);
                if (objBtnImpresionCotizacion) objBtnImpresionCotizacion.setAttribute('onclick', `printDocument(${data.cotizacion.cotizacion.NoCotizacion}, 'cotizacion')`);
                if (objBtnImpresionFactura && data.cotizacion.cotizacion.NoFactura) objBtnImpresionFactura.setAttribute('onclick', `printDocument(${data.cotizacion.cotizacion.NoFactura}, 'factura')`);

                objCambioNombre.value = "0";
                objCambioNit.value = "0";

            } else {
                alert_nova.showNotification("Pedido no encontrado.", "warning", "danger");
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
        });

};

const setAnulado = () => {

    open_loading();
    const csrftoken = getCookie('csrftoken');
    const form = new FormData();
    const objPedido = document.getElementById('pedido');
    const intPedido = (objPedido) ? objPedido.value : 0;
    form.append('pedido', intPedido);

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
                simple_redireccion(strUrlPedidos);
            } else {
                alert_nova.showNotification("Ocurrió un error al enviar a peso, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
        });

};

const changeFormaPago = () => {
    const strFormaPago = document.querySelector('input[name="formapago"]:checked').value;

    //const strFormapago = objFormaPago.value;

    if (strFormaPago === 'R') {
        objEsCredito.value = 1;
    } else {
        objEsCredito.value = 0;
    }

};

const validateForm = (strType) => {
    const boolFacturacion = (strType === 'factura');
    const obtElements = document.querySelectorAll(`form[name="frm_pedido"] input[type="text"], form[name="frm_pedido"] select`);

    try {

        let boolError = false;
        obtElements.forEach(element => {
            if (element.id !== "contenedor") {
                if (element.name === 'producto[]') {
                    const intRow = element.getAttribute('data-row');
                    const objCantidad = document.getElementById(`libras_${intRow}`);
                    const objProductoId = document.getElementById(`producto_id_${intRow}`);
                    const intCantidad = parseFloat(objCantidad.value);
                    if (element.value.trim() === '' && (isNaN(intCantidad) || intCantidad === 0) || element.value.trim() === '0' && (isNaN(intCantidad) || intCantidad === 0)) {
                        removeRow(intRow);
                    } else {
                        if ((isNaN(intCantidad) || intCantidad === 0)) {
                            objCantidad.style.border = 'solid #f44336 1px';
                            boolError = true;
                            document.querySelector('.contenedores').scrollTo(0, document.querySelector('.contenedores').scrollHeight);
                        } else {
                            objCantidad.style.border = '';
                        }
                        if (element.value.trim() === '' || element.value.trim() === '0' || objProductoId.value === '' || objProductoId.value === '0') {
                            element.style.border = 'solid #f44336 1px';
                            boolError = true;
                            document.querySelector('.contenedores').scrollTo(0, document.querySelector('.contenedores').scrollHeight);
                        } else {
                            element.style.border = '';
                        }
                    }
                } else {
                    if (element.value.trim() === '') {
                        element.style.border = 'solid #f44336 1px';
                        boolError = true;
                    } else {
                        element.style.border = '';
                    }
                }
            } else {
                const intValorFormaEnvio = document.querySelector('input[name="formaenvio"]:checked').value;
                if (intValorFormaEnvio === '4') {
                    if (element.value === '') {
                        element.style.border = 'solid #f44336 1px';
                        boolError = true;
                    } else {
                        element.style.border = '';
                    }
                }
            }
        });

        const objFormaPago = document.querySelector('input[name="formapago"]:checked');
        if (!objFormaPago || objFormaPago.value === "") {
            alert_nova.showNotification("Debe seleccionar una forma de pago.", "warning", "danger");
            return false;
        }

        const objProductos = document.querySelectorAll(`input[name="producto_id[]"]`);

        if (boolError) {
            alert_nova.showNotification("Debe llenar los campos marcados.", "warning", "danger");
            return false;
        }

        if (objProductos.length === 0) {
            alert_nova.showNotification("Debe ingresar productos.", "warning", "danger");
            return false;
        } else {
            if (boolPedido) {
                let boolExistencia = true;
                objProductos.forEach(element => {
                    const intRow = element.getAttribute('data-row');
                    const objExistencia = document.getElementById(`existencia_${intRow}`);
                    const intExistencia = parseFloat(objExistencia.value);
                    const objCantidad = document.getElementById(`libras_${intRow}`);
                    const intCantidad = parseFloat(objCantidad.value);
                    const objProducto = document.getElementById(`descripcion_${intRow}`);

                    if (intExistencia < intCantidad) {
                        boolExistencia = false;
                        // alert_nova.showNotification(`Cuenta únicamente con ${intExistencia} de existencia para ${objProducto.value}.`, "warning", "danger");
                        alert_nova.showNotification(`No cuenta con existencia para ${objProducto.value}.`, "warning", "danger");
                    }
                });

                if (!boolExistencia) {
                    return false;
                }
            }
        }
        dialogConfirm(processVenta, boolFacturacion);

    } catch (error) {
        console.error(error);
        alert_nova.showNotification(`Ocurrio un error al validar el formulario, recargue la ventana y pruebe de nuevo, si continua el error comuníquese con IT para revisión.`, "warning", "danger");
    }
};

const processVenta = (boolFacturacion) => {

    if (objdivBuscarPedido) objdivBuscarPedido.style.setProperty('display', 'none');
    open_loading();
    const csrftoken = getCookie('csrftoken');
    const frmElement = document.getElementById('frm_pedido');
    const form = new FormData(frmElement);

    form.append('create_cotizacion', 1);
    if (boolFacturacion) form.append('create_factura', 1);

    fetch(strUrlProcessVenta, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: form
    })
        .then(response => response.json())
        .then((data) => {

            close_loading();
            if (data.status_cotizacion || data.status_factura) {

                if (objBtnAnular) objBtnAnular.style.display = 'none';
                if (objBtnCotizacion) objBtnCotizacion.style.display = 'none';
                // if (objBtnFactura) objBtnFactura.style.display = 'none';
                if (objBtnTomaPeso) objBtnTomaPeso.style.display = 'none';
                if (objBtnImpresion) objBtnImpresion.style.display = '';
                if (objBtnImpresionOrden) objBtnImpresionOrden.setAttribute('onclick', `printDocument(${data.cotizacion}, 'orden')`);
                if (objBtnImpresionCotizacion) objBtnImpresionCotizacion.setAttribute('onclick', `printDocument(${data.cotizacion}, 'cotizacion')`);
                if (objBtnAdd) objBtnAdd.style.setProperty('display', 'none');

                const objButtonsDelete = document.querySelectorAll(`button[id^="btnEliminar_"]`);
                objButtonsDelete.forEach(element => {
                    const intRow = element.getAttribute('data-row');
                    element.style.display = 'none';
                    document.getElementById(`producto_${intRow}`).setAttribute('readonly', 'readonly');
                    document.getElementById(`libras_${intRow}`).setAttribute('readonly', 'readonly');
                    objNitCliente.setAttribute('readonly', 'readonly');
                    objCliente.setAttribute('readonly', 'readonly');
                    objCodigoCliente.setAttribute('readonly', 'readonly');
                    objSucursal.setAttribute('readonly', 'readonly');
                    //objFormaPago.setAttribute('readonly', 'readonly');
                    document.querySelectorAll('input[name="formapago"]').forEach(function(input){
                        input.setAttribute('readonly', 'readonly');
                    });
                    //objFormaEnvio.setAttribute('readonly', 'readonly');
                    document.querySelectorAll('input[name="formaenvio"]').forEach(function(input){
                        input.setAttribute('readonly', 'readonly');
                    });
                    objNitFactura.setAttribute('readonly', 'readonly');
                    objNombreFactura.setAttribute('readonly', 'readonly');
                    objDireccionFactura.setAttribute('readonly', 'readonly');
                });

                if (boolFacturacion) {
                    if (data.status_factura && data.status_fel) {
                        if (objBtnImpresionFactura && data.factura) objBtnImpresionFactura.setAttribute('onclick', `printDocument(${data.factura}, 'factura')`);
                        printDocument(data.factura, 'factura');
                        alert_nova.showNotification("Factura generada.", "add_alert", "success");
                    } else if (data.status_factura && !data.status_fel) {
                        alert_nova.showNotification("Error al firmar el documento: " + data.message_factura, "warning", "danger");
                    } else {
                        alert_nova.showNotification("Error al generar el documento: " + data.message_factura, "warning", "danger");
                    }
                }

                if (data.status_cotizacion) {
                    alert_nova.showNotification("Cotización generada.", "add_alert", "success");
                    if (!boolSalaVentas) simple_redireccion(strUrlNuevoPedido);
                    // if (document.getElementById('DivnoDocumento')) {
                    //     document.getElementById('DivnoDocumento').style.display = '';
                    //     if (document.getElementById('span_nodocumento')) document.getElementById('span_nodocumento').innerHTML = data.nodocumento;
                    // }
                }

            } else {
                alert_nova.showNotification("Error al generar el documento, intente de nuevo. Si continúa el error comuníquese con IT. <br> Error: " + data.error_message, "warning", "danger");
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
        });
};

const changeFecha = () => {
    const objDespacho = document.querySelector('input[name="fecha_despacho"]:checked')

    const intHour = objDate.getHours();
    let strMonth = objDate.getMonth() + 1;
    strMonth = (strMonth > 9) ? strMonth : `0${strMonth}`;
    let strDay = objDate.getDate();
    strDay = (strDay > 9) ? strDay : `0${strDay}`;
    let strNextMonth = objNextDate.getMonth() + 1;
    strNextMonth = (strNextMonth > 9) ? strNextMonth : `0${strNextMonth}`;
    let strNextDay = objNextDate.getDate();
    strNextDay = (strNextDay > 9) ? strNextDay : `0${strNextDay}`;
    const strNextDate = `${objNextDate.getFullYear()}-${strNextMonth}-${strNextDay}`;
    const strDate = `${objDate.getFullYear()}-${strMonth}-${strDay}`;

    const intDay = objDate.getDay();
    if (intDay === 6 || lastDayOfMonth.getDate() === objDate.getDate()) {
        objFecha.value = strDate;
    } else {
        if (intHour > 14) {
            objFecha.value = strNextDate;
        } else {

            if (objDespacho.value === 'H') {
                objFecha.value = strDate;
            } else {
                objFecha.value = strNextDate;
            }

        }
    }

};

const changeDocumento = () => {
    const objDocumento = document.querySelector('input[name="documento"]:checked');

    if (objDocumento) {

        let intNoEmpresa;
        let intNoEmpresaFel;

        if (objDocumento.value === 'F') {
            const strEmpresa = (objEmpresaF.value !== '' && objEmpresaF.value !== 'null') ? objEmpresaF.value : '';
            const strDireccion = (objEmpresaF.value !== '' && objEmpresaF.value !== 'null') ? objEmpresaF.getAttribute('data-direccion') : '';
            intNoEmpresa = (objEmpresaF.value !== '' && objEmpresaF.value !== 'null') ? objEmpresaF.getAttribute('data-noempresa') : '';
            intNoEmpresaFel = (objEmpresaF.value !== '' && objEmpresaF.value !== 'null') ? objEmpresaF.getAttribute('data-empresaidf') : '';
            objEmpresa.value = strEmpresa;
            objDirEmpresa.value = strDireccion;
            //validateNitFactura();

        } else {
            const strEmpresa = (objEmpresaE.value !== '' && objEmpresaE.value !== 'null') ? objEmpresaE.value : '';
            const strDireccion = (objEmpresaE.value !== '' && objEmpresaE.value !== 'null') ? objEmpresaE.getAttribute('data-direccion') : '';
            intNoEmpresa = (objEmpresaE.value !== '' && objEmpresaE.value !== 'null') ? objEmpresaE.getAttribute('data-noempresa') : '';
            intNoEmpresaFel = (objEmpresaE.value !== '' && objEmpresaE.value !== 'null') ? objEmpresaE.getAttribute('data-empresaidf') : '';
            objEmpresa.value = strEmpresa;
            objDirEmpresa.value = strDireccion;

            //let selectedIndex = objSucursal.selectedIndex;
            //let selectedOption = objSucursal.options[selectedIndex];
            //let selectedText = selectedOption.text;

            //if( objCliente.value.length > 0 ) objNombreFactura.value = objCliente.value;
            //if( objNitCliente.value.length > 0 ) objNitFactura.value = objNitCliente.value;
            //if( objSucursal.value.length > 0 ) objDireccionFactura.value = objSucursal.value;
            //if( selectedText.length > 0 ) objDireccionFactura.value = selectedText;
        }

        objHiddenEmpresa.value = intNoEmpresa;
        objHiddenEmpresa.setAttribute('empresa_id', intNoEmpresaFel);

    }

};

const addNewCliente = () => {

    let boolError = false;
    if (objNombreNuevo.value.trim() === '') {
        objNombreNuevo.style.border = 'solid #f44336 1px';
        boolError = true;
    } else {
        objNombreNuevo.style.border = '';
        setClass(objNombreNuevo);
    }

    if (objCodigoNuevo.value.trim() === '') {
        objCodigoNuevo.style.border = 'solid #f44336 1px';
        boolError = true;
    } else {
        objCodigoNuevo.style.border = '';
        setClass(objCodigoNuevo);
    }

    if (objNitNuevo.value.trim() === '') {
        objNitNuevo.style.border = 'solid #f44336 1px';
        boolError = true;
    } else {
        objNitNuevo.style.border = '';
        setClass(objNitNuevo);
    }

    if (objDirNuevo.value.trim() === '') {
        objDirNuevo.style.border = 'solid #f44336 1px';
        boolError = true;
    } else {
        objDirNuevo.style.border = '';
        setClass(objDirNuevo);
    }

    if (objDirSucursalNuevo.value.trim() === '') {
        objDirSucursalNuevo.style.border = 'solid #f44336 1px';
        boolError = true;
    } else {
        objDirSucursalNuevo.style.border = '';
        setClass(objDirSucursalNuevo);
    }

    if (objTelNuevo.value.trim() === '') {
        objTelNuevo.style.border = 'solid #f44336 1px';
        boolError = true;
    } else {
        if (!regexPhoneNumbers.test(objTelNuevo.value.trim())) {
            objTelNuevo.style.border = 'solid #f44336 1px';
            boolError = true;
        }
        else {
            objTelNuevo.style.border = '';
            setClass(objTelNuevo);
        }
    }

    if (boolError) {
        alert_nova.showNotification("Debe ingresar nombre, código, nit y teléfono válido para grabar.", "warning", "danger");
        return false;
    }

    open_loading();
    const csrftoken = getCookie('csrftoken');
    const frmElement = document.getElementById('frm_cliente_nuevo');
    const form = new FormData(frmElement);

    fetch(strUrlAddCliente, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: form
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            if (data.no_cliente) {
                alert_nova.showNotification("Cliente grabado.", "add_alert", "success");
                objNitCliente.value = document.getElementById('nit_cliente_nuevo').value.trim();

                $('#modal_cliente').modal("hide");
            } else if (data.cliente_exist) {
                objNitNuevo.value = '';
                alert_nova.showNotification("El cliente ya existe en el sistema.", "warning", "danger");
            } else {
                alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
        });

};

const addRow = async (boolForce = false, event = undefined) => {
    if (objNoCliente.value === '') {
        alert_nova.showNotification("Para ingresar productos, primero debe seleccionar cliente.", "warning", "danger");
        return false;
    }

    let boolFocus = false;
    if (event !== undefined) {
        if (event.key === "Enter") {
            boolFocus = true;
        } else {
            return false;
        }
    }

    const objTr = document.querySelectorAll(`.tr`);

    let intRowDetail = 0;
    let boolError = false;
    objTr.forEach(element => {
        const intRowTMP = parseInt(element.getAttribute('data-row'));
        const objThisProductoId = document.getElementById(`producto_id_${intRowTMP}`);
        const objThisProducto = document.getElementById(`producto_${intRowTMP}`);
        const intProductoId = objThisProductoId.value;
        const objThisLibras = document.getElementById(`libras_${intRowTMP}`);
        const intLibras = objThisLibras.value;

        if (intProductoId === '0' || intProductoId === '') {
            boolError = true;
            objThisProducto.style.border = 'solid #f44336 1px';
        } else {
            objThisProducto.style.border = '';
        }

        if (intLibras === '0' || intLibras === '') {
            boolError = true;
            objThisLibras.style.border = 'solid #f44336 1px';
        } else {
            objThisLibras.style.border = '';
        }

        if (intRowTMP > intRowDetail) {
            intRowDetail = intRowTMP;
        }

    });
    intRowDetail++;

    if (!boolError || boolForce) {

        let strTdLibras = `
            <input type="number" step="0.01" class="form-control" name="libras[]" id="libras_${intRowDetail}" onkeypress="return validar_caracteres(event, 7);" onchange="changeCantidad(this);" onkeyup="addRow(false, event)" data-row="${intRowDetail}" readonly min="0" autocomplete="new-password">
        `;

        if(  boolSalaVentas ){
            let strChecked = "";
            const objPrecioMayorista = document.getElementById('precio_mayorista');
            if (objPrecioMayorista && objPrecioMayorista.checked){
                strChecked = "checked";
            }
            strTdLibras = `
                <div class="togglebutton">
                    <span class="bmd-form-group" style="display: inline-block;">
                        <input type="number" step="0.01" class="form-control" name="libras[]" id="libras_${intRowDetail}" onkeypress="return validar_caracteres(event, 7);" onchange="changeCantidad(this);" onkeyup="addRow(false, event)" data-row="${intRowDetail}" readonly min="0" autocomplete="new-password">
                    </span>
                    <label title="Precio de Caja" rel="tooltip">
                        <input type="checkbox" name="precio_caja_[]" id="precio_caja_${intRowDetail}" ${strChecked} onchange="setPrecioCaja(${intRowDetail});">
                        <span class="toggle"></span>
                    </label>
                </div>
            `;
        }

        const strTr = `
            <tr class="tr" id="tr_${intRowDetail}" data-row="${intRowDetail}">
                <td>${intRowDetail}</td>
                <td id="td_codigo_${intRowDetail}">
                    <input type="hidden" name="lote_id[]" id="lote_id_${intRowDetail}" value="0" data-row="${intRowDetail}">
                    <input type="hidden" name="producto_id[]" id="producto_id_${intRowDetail}" value="0" data-row="${intRowDetail}">
                    <input type="hidden" name="descripcion[]" id="descripcion_${intRowDetail}" value="" data-row="${intRowDetail}">
                    <input type="hidden" name="presentacion[]" id="presentacion_${intRowDetail}" value="" data-row="${intRowDetail}">
                    <input type="hidden" name="cajas[]" id="cajas_${intRowDetail}" value="" data-row="${intRowDetail}">
                    <input type="hidden" name="unitario[]" id="unitario_${intRowDetail}" value="" data-row="${intRowDetail}">
                    <input type="hidden" name="unitario_original[]" id="unitario_original_${intRowDetail}" value="" data-row="${intRowDetail}">
                    <input type="hidden" name="total[]" id="total_${intRowDetail}" value="" data-row="${intRowDetail}">
                    <input type="hidden" name="existencia[]" id="existencia_${intRowDetail}" value="" data-row="${intRowDetail}">
                    <input type="text" name="producto[]" id="producto_${intRowDetail}" value="" class="form-control" data-row="${intRowDetail}">
                </td>
                <td id="td_descripcion_${intRowDetail}"></td>
                <td id="td_libras_${intRowDetail}">
                    ${strTdLibras}
                </td>
                <td id="td_cajas_${intRowDetail}"></td>
                <td id="td_unitario_${intRowDetail}"></td>
                <td id="td_total_${intRowDetail}"></td>
                <td>
                    <button type="button" rel="tooltip" class="btn btn-link btn-just-icon btn-danger" data-original-title="Eliminar" onclick="removeRow(${intRowDetail});" id="btnEliminar_${intRowDetail}" data-row="${intRowDetail}">
                        <i class="material-icons">delete_outline</i>
                    </button>
                </td>
            </tr>
    `;

        document.getElementById(`tbodyDetalles`).insertAdjacentHTML('beforeend', strTr);
        document.querySelector('.contenedores').scrollTo(0, document.querySelector('.contenedores').scrollHeight);

        try {
            $('[rel="tooltip"]').tooltip();

            $(`#producto_${intRowDetail}`).autocomplete({
                minLength: 1,
                source: (request, response) => {
                    document.getElementById(`lote_id_${intRowDetail}`).value = '';
                    document.getElementById(`producto_id_${intRowDetail}`).value = '';
                    document.getElementById(`td_descripcion_${intRowDetail}`).innerHTML = '';
                    document.getElementById(`descripcion_${intRowDetail}`).value = '';
                    document.getElementById(`libras_${intRowDetail}`).value = '';
                    document.getElementById(`presentacion_${intRowDetail}`).value = '';
                    document.getElementById(`existencia_${intRowDetail}`).value = '';
                    document.getElementById(`td_unitario_${intRowDetail}`).innerHTML = '';
                    document.getElementById(`td_total_${intRowDetail}`).innerHTML = '';
                    document.getElementById(`unitario_${intRowDetail}`).value = '';

                    recalculateMontos();
                    if (objNoCliente.value !== '') {

                        const csrftoken = getCookie('csrftoken');
                        const form = new FormData();
                        const intEmpresa = (document.querySelector(`input[name="bodega"]:checked`).value === "G") ? 1 : 2;

                        const objFormaEnvioRd = document.querySelector('input[name="formaenvio"]:checked');
                        const objContenedor = document.getElementById('contenedor');

                        form.append('busqueda', request.term.trim());
                        form.append('nocliente', objNoCliente.value);
                        form.append('empresa', intEmpresa);
                        if( objFormaEnvioRd ){
                            form.append('formaenvio', objFormaEnvioRd.value);
                        }
                        if( objContenedor ){
                            form.append('nolote', objContenedor.value);
                        }

                        const objPrecioMayorista = document.getElementById('precio_mayorista');
                        if (objPrecioMayorista && objPrecioMayorista.checked) {
                            form.append('precio_mayorista', true);
                        }

                        open_loading();
                        fetch(strUrlGetProductos, {
                            method: 'POST',
                            headers: {
                                'X-CSRFToken': csrftoken
                            },
                            body: form,
                        })
                            .then(response => response.json())
                            .then((data) => {

                                if (data.productos.length) {
                                    response($.map(data.productos, function (producto) {
                                        return {
                                            label: `${producto.CodigoProducto} - ${producto.Descripcion}`,
                                            value: producto.CodigoProducto,
                                            NoProducto: producto.NoProducto,
                                            CodigoProducto: producto.CodigoProducto,
                                            Descripcion: producto.Descripcion,
                                            Presentacion: producto.Presentacion,
                                            Unitario: producto.Unitario,
                                            Existencia: producto.Existencia,
                                        }
                                    }));
                                }

                                close_loading();

                            })
                            .catch((error) => {
                                close_loading();
                                if (error.name !== "AbortError") {
                                    console.error(error);
                                    alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
                                }
                            });
                    }
                },
                select: (event, ui) => {
                    const arrProducto = ui.item;

                    event.preventDefault();

                    const intRow = intRowDetail;
                    const objHiddenNoProducto = document.getElementById(`producto_id_${intRow}`);
                    const objProductos = document.querySelectorAll(`input[id^="producto_id_"]`);

                    const objTdDescripcion = document.getElementById(`td_descripcion_${intRow}`);
                    const objNumberLibras = document.getElementById(`libras_${intRow}`);
                    const objHiddenDescripcion = document.getElementById(`descripcion_${intRow}`);
                    const objHiddenPresentacion = document.getElementById(`presentacion_${intRow}`);
                    const objHiddenExistencia = document.getElementById(`existencia_${intRow}`);
                    const objTdUnitario = document.getElementById(`td_unitario_${intRow}`);
                    const objHiddenUnitario = document.getElementById(`unitario_${intRow}`);
                    const objHiddenUnitarioOriginal = document.getElementById(`unitario_original_${intRow}`);

                    let boolNinguno = false;
                    let boolError = false;

                    objHiddenNoProducto.value = arrProducto.NoProducto;

                    objProductos.forEach(element => {
                        if (objHiddenNoProducto !== element && element.value == arrProducto.NoProducto) {
                            boolError = true;
                        }
                    });

                    if (boolError) {
                        alert_nova.showNotification("Producto ya agregado previamente.", "warning", "danger");
                        this.value = '';
                        return false;
                    }
                    if (arrProducto.CodigoProducto === "10000" || arrProducto.Descripcion === "Servicios") {
                        const objOptions = {
                            element: 'input',
                            type: 'text',
                            classes: ['form-control'],
                        };
                        objNumberLibras.value = 1;

                        createElement(objOptions)
                            .then((objInputUnitario) => {
                                objTdUnitario.innerHTML = '';
                                objInputUnitario.onkeypress = (event) => {
                                    return validar_caracteres(event, 7);
                                };
                                objInputUnitario.onchange = (event) => {
                                    const unitarioServicios = isNaN(parseFloat(event.target.value).toFixed(4)) ? 0 : parseFloat(event.target.value).toFixed(4);
                                    objHiddenUnitario.value = unitarioServicios;
                                    changeCantidad(objNumberLibras);
                                };
                                objTdUnitario.appendChild(objInputUnitario);

                                // objHiddenUnitario.value = parseFloat(intUnitario).toFixed(4);
                                objNumberLibras.setAttribute('readonly', 'readonly');
                                if (objInputUnitario) {
                                    setTimeout(() => {
                                        objInputUnitario.focus();
                                    }, 300)
                                }
                            });
                    } else {
                        const intUnitario = arrProducto.Unitario;
                        objTdUnitario.innerHTML = numberFormatCurrency.format(intUnitario);
                        objHiddenUnitario.value = parseFloat(intUnitario).toFixed(4);
                        objHiddenUnitarioOriginal.value = parseFloat(intUnitario).toFixed(4);
                        objNumberLibras.removeAttribute('readonly');
                        objNumberLibras.focus();
                    }

                    boolNinguno = true;

                    const objFormaEnvioRd = document.querySelector('input[name="formaenvio"]:checked');
                    const objContenedor = document.getElementById('contenedor');

                    if( objFormaEnvioRd.value === "4" && objContenedor ){
                        document.getElementById(`lote_id_${intRow}`).value = document.querySelector(`input[data-contenedor="${objContenedor.value}"]`).getAttribute('data-lote');
                    }

                    objTdDescripcion.innerHTML = arrProducto.Descripcion;
                    objHiddenDescripcion.value = arrProducto.Descripcion;
                    objHiddenPresentacion.value = arrProducto.Presentacion;
                    objHiddenExistencia.value = arrProducto.Existencia;
                    event.target.value = arrProducto.CodigoProducto;
                    setDiasporciento();

                }
            });

            if (boolFocus && document.getElementById(`libras_${(intRowDetail - 1)}`).value !== "") {
                const objTmpProducto = document.getElementById(`producto_${intRowDetail}`);
                if (objTmpProducto) {
                    setTimeout(() => {
                        objTmpProducto.focus();
                    }, 300)
                }
            }
        } catch (error) {
            console.error(error);
        }

    }

};

const removeRow = (intRow) => {
    document.getElementById(`tr_${intRow}`).remove();
    recalculateMontos();
};

const recalculateMontos = () => {
    let intSumaTotal = 0;
    const objDetalles = document.querySelectorAll('input[id^="libras_"]');
    objDetalles.forEach(element => {
        const intRowDetail = element.getAttribute('data-row');
        const intUnitario = document.getElementById(`unitario_${intRowDetail}`).value;
        const intCantidad = element.value;
        if (intCantidad !== '') {
            intSumaTotal += (intCantidad * intUnitario);
        }
    });

    objTdTotalGlobal.innerHTML = (intSumaTotal)? numberFormatCurrency.format(intSumaTotal) : "";
    objTotal.value = (intSumaTotal)? (intSumaTotal).toFixed(4) : 0;

    const intTotalDisponible = parseFloat(document.getElementById('monto_disponible').value);

    if (intSumaTotal > intTotalDisponible && !boolClienteContado) {
        alert_nova.showNotification("El monto total excede al disponible.", "warning", "danger");
        if (objBtnCotizacion) objBtnCotizacion.style.display = 'none';
        // if (objBtnFactura) objBtnFactura.style.display = 'none';
        objTdTotalGlobal.style.setProperty('color', 'red');
        // return false;
    } else {
        if (objBtnCotizacion) objBtnCotizacion.style.display = '';
        // if (objBtnFactura) objBtnFactura.style.display = '';
        objTdTotalGlobal.style.removeProperty('color');
    }
};

const setDiasporciento = () => {

    const objProductos = document.querySelectorAll(`input[name="producto_id[]"]`);

    if (objProductos.length) {
        const intTotalDisponible = parseFloat(document.getElementById('monto_disponible').value);

        let intSumaTotal = 0;
        objProductos.forEach(element => {

            const intRow = element.getAttribute('data-row');
            const objLibras = document.getElementById(`libras_${intRow}`);
            const objUnitario = document.getElementById(`unitario_${intRow}`);
            const objUnitarioOriginal = document.getElementById(`unitario_original_${intRow}`);
            //const objCajas = document.getElementById(`cajas_${intRow}`);
            const objTdUnitario = document.getElementById(`td_unitario_${intRow}`);
            const objTdTotal = document.getElementById(`td_total_${intRow}`);
            const objTotal = document.getElementById(`total_${intRow}`);
            const intUnitario = (objDiesporciento.checked) ? ((objUnitarioOriginal.value * 1) * 1.1).toFixed(4) : ((objUnitarioOriginal.value * 1)).toFixed(4);
            const intCantidad = parseFloat(objLibras.value);
            const intTotal = (intUnitario * intCantidad);
            objTdUnitario.innerHTML = numberFormatCurrency.format(intUnitario);
            objUnitario.value = intUnitario;
            if( !isNaN(intCantidad) ){
                //const intCajas = (objCajas.value === '')? 1 : (objCajas.value * 1);
                objTdTotal.innerHTML = numberFormatCurrency.format(intTotal);
                objTotal.value = (intTotal).toFixed(4);
                intSumaTotal += intTotal;
            }
        });

        if (intSumaTotal > intTotalDisponible && !boolClienteContado) {
            if (objBtnCotizacion) objBtnCotizacion.style.display = 'none';
            // if (objBtnFactura) objBtnFactura.style.display = 'none';
            if (objDiesporciento.checked) alert_nova.showNotification("No puede aumentar el 10% ya que el monto total excede al disponible.", "warning", "danger");
            objTdTotalGlobal.style.setProperty('color', 'red');
        } else {
            if (objBtnCotizacion) objBtnCotizacion.style.display = '';
            // if (objBtnFactura) objBtnFactura.style.display = '';
            objTdTotalGlobal.style.removeProperty('color');
        }

        objTdTotalGlobal.innerHTML = numberFormatCurrency.format(intSumaTotal);
        objTotal.value = (intSumaTotal).toFixed(4);

    }

};

const changeCantidad = (objLibras) => {

    let intSumaTotal = 0;
    if (objLibras.value !== '') {

        const intRow = objLibras.getAttribute('data-row');
        const intThisExistencia = parseFloat(document.getElementById(`existencia_${intRow}`).value);
        const intThisCantidad = (objLibras.value * 1);

        if (intThisCantidad === 0) {
            alert_nova.showNotification("No puede ingresar 0 como cantidad.", "warning", "danger");
            objLibras.value = '';
            return false;
        }
        if (intThisExistencia < intThisCantidad) {
            // alert_nova.showNotification(`Solo cuenta con ${intThisExistencia} de existencia.`, "warning", "danger");
            alert_nova.showNotification(`No cuenta con suficiente existencia.`, "warning", "danger");
            if (objBtnCotizacion) objBtnCotizacion.style.display = 'none';
            // if (objBtnFactura) objBtnFactura.style.display = 'none';
            objLibras.value = '';
            return false;
        }

        const intTotalDisponible = parseFloat(document.getElementById('monto_disponible').value);
        const objDetalles = document.querySelectorAll('input[id^="libras_"]');
        const intThisUnitario = parseFloat(document.getElementById(`unitario_${intRow}`).value);
        const objTdTotal = document.getElementById(`td_total_${intRow}`);
        const objHiddenTotal = document.getElementById(`total_${intRow}`);
        const objTdCajas = document.getElementById(`td_cajas_${intRow}`);
        const intTotal = (intThisCantidad * intThisUnitario);

        objDetalles.forEach(element => {
            const intRowDetail = element.getAttribute('data-row');
            const intUnitario = parseFloat(document.getElementById(`unitario_${intRowDetail}`).value);
            const intCantidad = parseFloat(element.value);

            if (intCantidad > 0 && objLibras !== element) {
                intSumaTotal += (intCantidad * intUnitario);
            }

        });

        intSumaTotal = (intSumaTotal + (intTotal));

        if (intSumaTotal > intTotalDisponible && !boolClienteContado) {
            // objLibras.value = '';
            // objTdTotal.innerHTML = '';
            // objHiddenTotal.value = '';
            // objTdCajas.innerHTML = '';
            alert_nova.showNotification("El monto total excede al disponible.", "warning", "danger");
            if (objBtnCotizacion) objBtnCotizacion.style.display = 'none';
            // if (objBtnFactura) objBtnFactura.style.display = 'none';
            objTdTotalGlobal.style.setProperty('color', 'red');
            // return false;
        } else {
            if (objBtnCotizacion) objBtnCotizacion.style.display = '';
            // if (objBtnFactura) objBtnFactura.style.display = '';
            objTdTotalGlobal.style.removeProperty('color');
        }

        const objPresentacion = document.getElementById(`presentacion_${intRow}`);
        objHiddenTotal.value = (intTotal).toFixed(4);
        objTdTotal.innerHTML = numberFormatCurrency.format(intTotal);

        if (objPresentacion.value !== '' && objPresentacion.value !== 'null') {
            objTdCajas.innerHTML = (intThisCantidad / objPresentacion.value).toFixed(2);
        }

    }

    objTdTotalGlobal.innerHTML = numberFormatCurrency.format(intSumaTotal);
    objTotal.value = (intSumaTotal).toFixed(4);

};

const validateNitFactura = (boolDirectoInput = false) => {
    const csrftoken = getCookie('csrftoken');
    const form = new FormData();
    let strNit = objNitFactura.value.trim();

    // if (boolSalaVentas) objNombreFactura.setAttribute('readonly', 'readonly');
    if( boolDirectoInput ){
        objCambioNit.value = "1";
    }

    let boolCui = false;
    // if (strNit.length === 13 && parseFloat(objTotal.value) >= 2500) {
    if (strNit.length === 13) {
        if (cuiIsValid(strNit)) {
            boolCui = true;
            if (boolSalaVentas) objNombreFactura.removeAttribute('readonly');
        } else {
            if (boolSalaVentas) objNombreFactura.setAttribute('readonly', 'readonly');
        }
    }

    if (strNit !== '' && !boolCui) {

        strNit = strNit.toUpperCase().replace('-', '');
        if (strNit === 'cf' || strNit === 'CF' || strNit === 'C/F' || strNit === 'c/f') {
            if (document.querySelector('input[name="documento"]:checked').value === "F") {
                alert_nova.showNotification("El NIT no es valido.", "warning", "danger");
                objNitFactura.value = '';
            }
            return false;
        }

        objNitFactura.value = strNit;
        form.append('nit', strNit);
        if (objHiddenEmpresa.value !== '' && objHiddenEmpresa.getAttribute('empresa_id')
            && objHiddenEmpresa.getAttribute('empresa_id') !== '')
            form.append('empresa_id', objHiddenEmpresa.getAttribute('empresa_id'));

        open_loading();
        fetch(strUrlValidateNit, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            },
            body: form
        })
            .then(response => response.json())
            .then((data) => {
                close_loading();

                if (data.datos) {

                    if (data.datos.status) {
                        objNitFactura.value = data.datos.nit;
                        setClass(objNitFactura);
                        if (!boolDirectoInput) {
                            objNombreFactura.value = data.datos.nombre;
                        }
                        else {
                            objNombreFactura.value = "";
                        }
                        setClass(objNombreFactura);
                        if (objNoCliente.value !== "129292" && objNoCliente.value !== "112681") {
                            if (data.datos.direcciones) {
                                objDireccionFactura.value = data.datos.direcciones.direccion;
                            }
                        }
                        setClass(objDireccionFactura);
                    } else {
                        objNitFactura.value = '';
                        objNombreFactura.value = '';
                        objDireccionFactura.value = '';
                        alert_nova.showNotification(data.datos.error.error.desc_error, "warning", "danger");
                        console.error(data.datos.error.error.desc_error);
                    }

                } else {
                    alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
                }
            })
            .catch((error) => {
                close_loading();
                console.error(error);
                alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            });
    }

};

const validateNitClienteNuevo = () => {
    const csrftoken = getCookie('csrftoken');
    const form = new FormData();
    let strNit = objNitNuevo.value.trim();
    objNitNuevo.value = strNit;

    let boolCUI = false;
    if (strNit.length === 13) {
        if (cuiIsValid(strNit)) boolCUI = true;
    }

    if (strNit !== '' && !boolCUI) {
        strNit = strNit.toUpperCase().replace('-', '');
        objNitNuevo.value = strNit;
        form.append('nit', strNit);
        form.append('cliente_existe', 1);

        open_loading();
        fetch(strUrlValidateNit, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            },
            body: form
        })
            .then(response => response.json())
            .then((data) => {
                close_loading();

                if (data.cliente_exist) {
                    objNitNuevo.value = '';
                    alert_nova.showNotification("El cliente ya existe en el sistema.", "warning", "danger");
                    return false;
                }

                if (data.datos) {

                    if (data.datos.status) {
                        objNitNuevo.value = data.datos.nit;
                        setClass(objNitNuevo);
                        objNombreNuevo.value = data.datos.nombre;
                        setClass(objNombreNuevo);
                        objDirSucursalNuevo.value = "";
                        setClass(objDirSucursalNuevo);
                        if (data.datos.direcciones) {
                            objDirNuevo.value = data.datos.direcciones.direccion;
                        }
                        setClass(objDirNuevo);

                    } else {
                        objNitNuevo.value = '';
                        objNombreNuevo.value = '';
                        objDirSucursalNuevo.value = '';
                        objDirNuevo.value = "CIUDAD";
                        alert_nova.showNotification(data.datos.error.error.desc_error, "warning", "danger");
                    }

                } else {
                    alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
                }
            })
            .catch((error) => {
                close_loading();
                console.error(error);
                alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            });
    }
};

const setClass = (objElement) => {
    objElement.parentElement.classList.add('bmd-form-group');
    objElement.parentElement.classList.add('is-filled');
};

const modalClienteNuevo = () => {
    objCodigoNuevo.value = "";
    objTelNuevo.value = "";
    objNombreNuevo.value = "";
    objEmailNuevo.value = "";
    objDirNuevo.value = "CIUDAD";
    objDirSucursalNuevo.value = "";
    validateNitClienteNuevo();
    getCodigoCliente();
    $('#modal_cliente').modal("show");
};

const getCodigoCliente = () => {
    const csrftoken = getCookie('csrftoken');

    open_loading();
    fetch(strUrlGetCodigoCliente, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            if (data.status) objCodigoNuevo.value = data.codigo;

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
        });

};

const getSucursales = () => {

    const intNoCliente = objNoCliente.value;
    const csrftoken = getCookie('csrftoken');
    const form = new FormData();
    form.append('nocliente', intNoCliente);

    open_loading();
    fetch(strUrlGetSucursales, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: form
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            objSucursal.innerHTML = "<option value='' data-direccion='' data-ruta=''></option>";

            if (data.sucursales) {

                let intRow = 0;
                let strSucursal = '';
                let strDirSucursal = '';
                let strRuta = '';
                for (let key in data.sucursales) {
                    const arrSucursal = data.sucursales[key];
                    const objOpt = document.createElement('option');
                    objOpt.value = arrSucursal.NoSucursal;
                    strSucursal = arrSucursal.NoSucursal;
                    strDirSucursal = arrSucursal.Direccion;
                    strRuta = arrSucursal.Descripcion;
                    // objOpt.innerHTML = arrSucursal.Nombre;
                    objOpt.innerHTML = arrSucursal.Direccion;
                    objOpt.setAttribute('data-direccion', arrSucursal.Direccion);
                    objOpt.setAttribute('data-ruta', arrSucursal.Descripcion);
                    if (intRow === 0) {
                        objOpt.setAttribute('selected', 'selected');
                        objSucursal.value = strSucursal;
                        //objDirSucursal.value = strDirSucursal;
                        objHdnSucursal.value = strDirSucursal;
                        objRuta.value = strRuta;
                        //setClass(objDirSucursal);
                    }
                    objSucursal.appendChild(objOpt);
                    intRow++;
                }

                if (intRow === 1) {
                    objSucursal.value = strSucursal;
                    //objDirSucursal.value = strDirSucursal;
                    objHdnSucursal.value = strDirSucursal;
                    objRuta.value = strRuta;
                    //setClass(objDirSucursal);
                }

            } else {
                alert_nova.showNotification("Cliente no cuenta con sucursales asignadas.", "warning", "danger");
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
        });

};

const changeSucursal = () => {
    const options = objSucursal.options;

    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (option.selected) {
            //objDirSucursal.value = option.getAttribute('data-direccion');
            objHdnSucursal.value = option.getAttribute('data-direccion');
            objRuta.value = option.getAttribute('data-ruta');
            //setClass(objDirSucursal);
        }
    }

};

const getInfoSaldos = (boolNotButtons = false, recalcularSaldos = false) => {

    const intNoCliente = (objNoCliente.value * 1);
    const csrftoken = getCookie('csrftoken');
    const form = new FormData();
    form.append('nocliente', intNoCliente);

    open_loading();
    fetch(strUrlGetSaldosCliente, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: form
    })
        .then(response => response.json())
        .then((data) => {

            close_loading();
            let boolProcess = true;

            if (data) {
                objTdSaldo.innerHTML = currencyFormat.format(data.Saldo);
                objTdSaldo.style.color = (data.saldo_red) ? 'red' : '';
                objTdDiasDisponibles.innerHTML = data.Dias_Disponibles;
                objTdDiasDisponibles.style.color = (data.Dias_Disponibles < 0) ? 'red' : '';
                boolClienteContado = (data.cliente_contado);
                boolPagoContado = (data.pago_contado);

                document.querySelectorAll(`input[name="formapago"]`).forEach(function(input){
                    input.removeAttribute('disabled');
                    input.parentNode.parentNode.style.display = 'block';
                    input.check = false;

                    if (boolPagoContado || boolClienteContado) {
                        if (input.value === "O") {
                            input.check = true;
                        }
                        else{
                            input.setAttribute('disabled', 'disabled');
                            input.parentNode.parentNode.style.display = 'none';
                        }
                    } else {
                        if( input.value !== "O" && input.value !== "R" ){
                            input.setAttribute('disabled', 'disabled');
                            input.parentNode.parentNode.style.display = 'none';
                        }
                    }
                });

                /*
                objFormaPago.options[0].selected = true;
                for (let i = 0; objFormaPago.options.length > i; i++) {
                    if (boolPagoContado) {
                        if (objFormaPago.options[i].value === "" || objFormaPago.options[i].value === "O") {
                            objFormaPago.options[i].style.removeProperty('display');
                            objFormaPago.options[i].selected = true;
                        } else {
                            objFormaPago.options[i].style.setProperty('display', 'none');
                        }
                    } else if (boolClienteContado) {
                        if (objFormaPago.options[i].value === "" || objFormaPago.options[i].value === "C" || objFormaPago.options[i].value === "T" || objFormaPago.options[i].value === "E") {
                            objFormaPago.options[i].style.removeProperty('display');
                        } else {
                            objFormaPago.options[i].style.setProperty('display', 'none');
                        }
                    } else {
                        objFormaPago.options[i].style.removeProperty('display');
                    }
                }
                */

                if (data.Dias_Disponibles < 0) {
                    if (objBtnAdd) objBtnAdd.style.setProperty('display', 'none');
                    if (objBtnCotizacion) objBtnCotizacion.style.setProperty('display', 'none');
                    // if (objBtnFactura) objBtnFactura.style.setProperty('display', 'none');
                    if (objBtnTomaPeso) objBtnTomaPeso.style.setProperty('display', 'none');
                    boolProcess = false;
                    objDivDias.style.removeProperty('display');
                } else {
                    if (objBtnAdd && !boolNotButtons) objBtnAdd.style.removeProperty('display');
                    if (objBtnCotizacion && !boolNotButtons) objBtnCotizacion.style.removeProperty('display');
                    // if (objBtnFactura && !boolNotButtons) objBtnFactura.style.removeProperty('display');
                    if (objBtnTomaPeso && !boolNotButtons) objBtnTomaPeso.style.removeProperty('display');
                    objDivDias.style.setProperty('display', 'none');
                }

                if (data.disponibilidad_red || ((objTotal.value * 1) > (data.Disponibilidad * 1))) {
                    if (objBtnCotizacion) objBtnCotizacion.style.setProperty('display', 'none');
                    // if (objBtnFactura) objBtnFactura.style.setProperty('display', 'none');
                    if (objBtnTomaPeso) objBtnTomaPeso.style.setProperty('display', 'none');
                    objDivDisponible.style.removeProperty('display');
                    boolProcess = false;
                } else {
                    if (objBtnCotizacion && !boolNotButtons) objBtnCotizacion.style.removeProperty('display');
                    // if (objBtnFactura && !boolNotButtons) objBtnFactura.style.removeProperty('display');
                    if (objBtnTomaPeso && !boolNotButtons) objBtnTomaPeso.style.removeProperty('display');
                    objDivDisponible.style.setProperty('display', 'none');
                }

                objTdDisponibilidad.innerHTML = currencyFormat.format(data.Disponibilidad);
                objTdDisponibilidad.style.color = (data.disponibilidad_red) ? 'red' : '';
                objMontoDisponible.value = data.Disponibilidad;
                document.getElementById('dias_credito').value = data.Dias_Credito;
                document.getElementById('limite_credito').value = data.Limite_Credito;
                objTdDiasCredito.innerHTML = data.Dias_Credito;
                objTdDiasCredito.style.color = (data.Dias_Credito < 0) ? 'red' : '';
                objTdLimiteCredito.innerHTML = currencyFormat.format(data.Limite_Credito);
                objTdLimiteCredito.style.color = (data.credito_red) ? 'red' : '';
                if (recalcularSaldos) recalculateMontos();
            }

            if (boolProcess) {
                if (objBtnCotizacion && !boolNotButtons) objBtnCotizacion.style.removeProperty('display');
                // if (objBtnFactura && !boolNotButtons) objBtnFactura.style.removeProperty('display');
            } else {
                if (objBtnCotizacion) objBtnCotizacion.style.setProperty('display', 'none');
                // if (objBtnFactura) objBtnFactura.style.setProperty('display', 'none');
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
        });

};

const mostrarEnvio = (objEnvio) => {
    const divContendores = document.getElementById('divContendores');
    // document.getElementById(`tbodyDetalles`).innerHTML = '';

    if (objEnvio.value === "4") {
        divContendores.style.removeProperty('display');
        // if (objBtnAdd) objBtnAdd.style.setProperty('display', 'none');
    } else {
        divContendores.style.setProperty('display', 'none');
        document.getElementById('contenedor').value = '';
        // document.getElementById('lote').value = '';
        if (objBtnAdd && !boolPedido) objBtnAdd.style.removeProperty('display');

        document.querySelectorAll('[id^="lote_id_"]').forEach((inputElement) => {
            inputElement.value = "";
        });
    }
};

const selectContenedor = async (objContenedor) => {
    if (objNoCliente.value === '') {
        alert_nova.showNotification("Para seleccionar contenedor, primero debe ingresar el cliente.", "warning", "danger");
        objContenedor.value = "";
        document.getElementById(`tbodyDetalles`).innerHTML = '';
        recalculateMontos();
        return false;
    }

    if (!boolPedido) {
        document.getElementById(`tbodyDetalles`).innerHTML = '';
        const objLotes = document.querySelectorAll(`input[data-contenedor="${objContenedor.value}"]`);
        let intRow = 1;
        for (const element of objLotes) {
            addRow(true)
                .then(() => {
                    recalculateMontos();

                    const csrftoken = getCookie('csrftoken');
                    const form = new FormData();
                    const intEmpresa = (document.querySelector(`input[name="bodega"]:checked`).value === "G") ? 1 : 2;
                    form.append('busqueda', element.value);
                    form.append('nocliente', objNoCliente.value);
                    form.append('empresa', intEmpresa);
                    form.append('boolNoProducto', true);

                    const objPrecioMayorista = document.getElementById('precio_mayorista');
                    if (objPrecioMayorista && objPrecioMayorista.checked) {
                        form.append('precio_mayorista', true);
                    }

                    const objFormaEnvioRd = document.querySelector('input[name="formaenvio"]:checked');
                    const objContenedor = document.getElementById('contenedor');
                    if( objFormaEnvioRd ){
                        form.append('formaenvio', objFormaEnvioRd.value);
                    }
                    if( objContenedor ){
                        form.append('nolote', objContenedor.value);
                    }

                    open_loading();
                    fetch(strUrlGetProductos, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrftoken
                        },
                        body: form,
                    })
                        .then(response => response.json())
                        .then((data) => {

                            if (data.productos.length === 1) {
                                const arrProducto = data.productos[0];
                                const objHiddenNoProducto = document.getElementById(`producto_id_${intRow}`);
                                const objProductos = document.querySelectorAll(`input[id^="producto_id_"]`);
                                document.getElementById(`producto_${intRow}`).value = arrProducto.CodigoProducto;

                                const objTdDescripcion = document.getElementById(`td_descripcion_${intRow}`);
                                const objNumberLibras = document.getElementById(`libras_${intRow}`);
                                const objHiddenDescripcion = document.getElementById(`descripcion_${intRow}`);
                                const objHiddenPresentacion = document.getElementById(`presentacion_${intRow}`);
                                const objHiddenExistencia = document.getElementById(`existencia_${intRow}`);
                                const objTdUnitario = document.getElementById(`td_unitario_${intRow}`);
                                const objHiddenUnitario = document.getElementById(`unitario_${intRow}`);

                                let boolNinguno = false;
                                let boolError = false;

                                objProductos.forEach(element => {
                                    if (objHiddenNoProducto !== element && element.value === arrProducto.NoProducto) {
                                        boolError = true;
                                    }
                                });

                                if (boolError) {
                                    alert_nova.showNotification("Producto ya agregado previamente.", "warning", "danger");
                                    this.value = '';
                                    return false;
                                }

                                const intUnitario = arrProducto.Unitario;
                                objTdUnitario.innerHTML = numberFormatCurrency.format(intUnitario);
                                objHiddenUnitario.value = parseFloat(intUnitario).toFixed(4);
                                objNumberLibras.removeAttribute('readonly');
                                objNumberLibras.focus();

                                boolNinguno = true;
                                objHiddenNoProducto.value = arrProducto.NoProducto;
                                objTdDescripcion.innerHTML = arrProducto.Descripcion;
                                objHiddenDescripcion.value = arrProducto.Descripcion;
                                objHiddenPresentacion.value = arrProducto.Presentacion;
                                objHiddenExistencia.value = arrProducto.Existencia;

                                document.getElementById(`lote_id_${intRow}`).value = element.getAttribute('data-lote');
                            }

                            close_loading();
                            intRow++;

                        })
                        .catch((error) => {
                            close_loading();
                            if (error.name !== "AbortError") {
                                console.error(error);
                                alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
                            }
                        });
                });
        }
    }
};

const setPrecioCaja = async (intCorrelativoP) => {
    const csrftoken = getCookie('csrftoken');
    const form = new FormData();
    const intEmpresa = (document.querySelector(`input[name="bodega"]:checked`).value === "G") ? 1 : 2;
    form.append('no_producto', document.getElementById(`producto_id_${intCorrelativoP}`).value);
    form.append('nocliente', objNoCliente.value);
    form.append('empresa', intEmpresa);
    const objPrecioMayorista = document.getElementById(`precio_caja_${intCorrelativoP}`);
    if (objPrecioMayorista && objPrecioMayorista.checked) {
        form.append('precio_mayorista', true);
    }

    open_loading();
    fetch(strUrlGetPrecioProducto, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: form,
    })
        .then(response => response.json())
        .then((data) => {

            if (data.productos.length) {
                const arrProducto = data.productos[0];

                const intRow = intCorrelativoP;
                const objHiddenNoProducto = document.getElementById(`producto_id_${intRow}`);

                const objNumberLibras = document.getElementById(`libras_${intRow}`);
                const objTdUnitario = document.getElementById(`td_unitario_${intRow}`);
                const objHiddenUnitario = document.getElementById(`unitario_${intRow}`);
                const objHiddenUnitarioOriginal = document.getElementById(`unitario_original_${intRow}`);

                objHiddenNoProducto.value = arrProducto.NoProducto;

                if (arrProducto.CodigoProducto !== "10000" && arrProducto.Descripcion !== "Servicios") {
                    const intUnitario = arrProducto.Unitario;
                    objTdUnitario.innerHTML = numberFormatCurrency.format(intUnitario);
                    objHiddenUnitario.value = parseFloat(intUnitario).toFixed(4);
                    objHiddenUnitarioOriginal.value = parseFloat(intUnitario).toFixed(4);
                    changeCantidad(objNumberLibras);
                    setDiasporciento();
                }
            }

            close_loading();

        })
        .catch((error) => {
            close_loading();
            if (error.name !== "AbortError") {
                console.error(error);
                alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            }
        });
};

const cambioNombre = async () => {
    objCambioNombre.value = "1";
}

if (boolPedido) {
    //validateNitFactura();
}

$(document).ready(() => {
    $("#cliente").autocomplete({
        minLength: 1,
        source: (request, response) => {
            objDocumento[0].checked = true;

            objVendedor.value = '';
            objNoVendedor.value = '';
            objNoUsuario.value = '';
            objNoCliente.value = '';
            objEmpresa.value = '';
            objDirEmpresa.value = '';
            objDirSucursal.value = '';
            objHdnSucursal.value = '';
            objSucursal.value = '';
            objNitFactura.removeAttribute('readonly');
            objNombreFactura.removeAttribute('readonly');
            objDireccionFactura.removeAttribute('readonly');
            objNitFactura.value = '';
            objNombreFactura.value = '';
            objDireccionFactura.value = '';
            objObservacionesFactura.value = '';
            document.getElementById(`tbodyDetalles`).innerHTML = '';
            document.getElementById(`td_total_global`).innerHTML = '';
            objTotal.value = '';
            objTdSaldo.innerHTML = '';
            objTdDiasDisponibles.innerHTML = '';
            objTdDisponibilidad.innerHTML = '';
            objMontoDisponible.value = '';
            objTdDiasCredito.innerHTML = '';
            objTdLimiteCredito.innerHTML = '';
            objBtnSaldo.style.display = 'none';

            objCodigoCliente.value = '';
            objNitCliente.value = '';
            // objCliente.value = '';
            objRuta.value = '';
            objObservacionesCliente.value = '';

            const csrftoken = getCookie('csrftoken');
            const form = new FormData();
            form.append('busqueda', request.term.toUpperCase().trim());
            form.append('tipo', 'nombre');

            open_loading();
            fetch(strUrlGetDatosClientes, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken
                },
                body: form
            })
                .then(response => response.json())
                .then((data) => {
                    if (data.clientes.length) {
                        response($.map(data.clientes, function (cliente) {
                            return {
                                label: cliente.label,
                                value: cliente.NoCliente,
                                nocliente: cliente.NoCliente,
                                nit: cliente.NIT,
                                codigocliente: cliente.CodigoCliente,
                                cliente: cliente.Cliente,
                                nombrecomercial: cliente.NombreComercial,
                                observacion_cliente: cliente.observacion_cliente,
                                noempresaf: (cliente.NoEmpresaF) ? cliente.NoEmpresaF : '',
                                empresaidf: (cliente.EmpresaIDF) ? cliente.EmpresaIDF : '',
                                nombrecomercialf: (cliente.NombreComercialF) ? cliente.NombreComercialF : '',
                                dircomercialf: (cliente.DirComercialF) ? cliente.DirComercialF : '',
                                noempresae: (cliente.NoEmpresaE) ? cliente.NoEmpresaE : '',
                                empresaide: (cliente.EmpresaIDE) ? cliente.EmpresaIDE : '',
                                nombrecomerciale: (cliente.NombreComercialE) ? cliente.NombreComercialE : '',
                                dircomerciale: (cliente.DirComercialE) ? cliente.DirComercialE : '',
                                vendedor: cliente.Vendedor,
                                novendedor: cliente.NoVendedor,
                                nousuario: cliente.NoUsuario,
                                direccion: cliente.Direccion,
                            }
                        }));

                    } else {
                        if (boolSalaVentas) dialogConfirm(modalClienteNuevo, false, '¿Es cliente nuevo?', '¡No se encontro ningún cliente, desea crear uno nuevo!');
                    }

                    close_loading();

                })
                .catch((error) => {
                    close_loading();

                    if (error.name !== "AbortError") {
                        console.error(error);
                        alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
                    }

                });
        },
        select: (event, ui) => {
            event.preventDefault();

            const arrCliente = ui.item;

            this.value = ui.item.cliente;

            objNoCliente.value = arrCliente.nocliente;
            objNoVendedor.value = arrCliente.novendedor;
            objNoUsuario.value = arrCliente.nousuario;
            objVendedor.value = arrCliente.vendedor;

            objNitFactura.setAttribute('readonly', 'readonly');
            objNombreFactura.setAttribute('readonly', 'readonly');
            objDireccionFactura.setAttribute('readonly', 'readonly');
            setClass(objVendedor);
            objCliente.value = arrCliente.cliente;
            setClass(objCliente);
            objNitCliente.value = arrCliente.nit;
            setClass(objNitCliente);
            objNitFactura.value = arrCliente.nit;
            setClass(objNitFactura);
            objNombreFactura.value = arrCliente.cliente;
            setClass(objNombreFactura);
            objCodigoCliente.value = arrCliente.codigocliente;
            setClass(objCodigoCliente);
            objObservacionesCliente.value = arrCliente.observacion_cliente;
            setClass(objObservacionesCliente);
            objHdnSucursal.value = arrCliente.direccion;
            objDirSucursal.value = arrCliente.direccion;
            setClass(objDirSucursal);

            objDireccionFactura.value = arrCliente.direccion;
            setClass(objDireccionFactura);


            const objDocumento = document.querySelector('input[name="documento"]:checked');

            objEmpresa.value = (objDocumento && objDocumento.value === "F") ? arrCliente.nombrecomercialf : ((arrCliente.nombrecomerciale !== '' && arrCliente.nombrecomerciale !== 'null') ? arrCliente.nombrecomerciale : '');
            objHiddenEmpresa.value = (objDocumento && objDocumento.value === "F") ? arrCliente.noempresaf : ((arrCliente.noempresae !== '' && arrCliente.noempresae !== 'null') ? arrCliente.noempresae : '');
            objHiddenEmpresa.setAttribute('empresa_id', ((objDocumento && objDocumento.value === "F") ? arrCliente.empresaidf : ((arrCliente.empresaide !== '' && arrCliente.empresaide !== 'null') ? arrCliente.empresaide : '')));
            objDirEmpresa.value = (objDocumento && objDocumento.value === "F") ? arrCliente.dircomercialf : ((arrCliente.dircomerciale !== '' && arrCliente.dircomerciale !== 'null') ? arrCliente.dircomerciale : '');
            objEmpresaF.value = arrCliente.nombrecomercialf;
            objEmpresaF.setAttribute('data-direccion', arrCliente.dircomercialf);
            objEmpresaF.setAttribute('data-noempresa', arrCliente.noempresaf);
            objEmpresaE.value = ((arrCliente.nombrecomerciale !== '' && arrCliente.nombrecomerciale !== 'null') ? arrCliente.nombrecomerciale : '');
            objEmpresaE.setAttribute('data-direccion', ((arrCliente.dircomerciale !== '' && arrCliente.dircomerciale !== 'null') ? arrCliente.dircomerciale : ''));
            objEmpresaE.setAttribute('data-noempresa', ((arrCliente.noempresae !== '' && arrCliente.noempresae !== 'null') ? arrCliente.noempresae : ''));
            setClass(objEmpresa);
            setClass(objDirEmpresa);

            getSucursales();
            getInfoSaldos();
            //validateNitFactura();
            objBtnSaldo.style.display = '';
            changeFecha();

            objCambioNombre.value = "0";
            objCambioNit.value = "0";

            if (objSucursal) objSucursal.focus();

        }
    });

});
