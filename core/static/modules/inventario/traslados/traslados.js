let arrGlobalCantidadEgreso = [],
    arrGlobalEgresoCalculo = [],
    intRowEgreso = 1,
    intRowIngreso = 1,
    boolUpdated = false,
    arrDataDisponibilidad = [];
const sltEmpresaEgreso = document.getElementById('slt_empresa_egreso'),
    hdnEmpresaEgreso = document.getElementById('empresa_egreso'),
    sltEmpresaIngreso = document.getElementById('slt_empresa_ingreso'),
    hdnEmpresaIngreso = document.getElementById('empresa_ingreso'),
    sltTipo = document.getElementById('slt_tipo'),
    hdnTipo = document.getElementById('tipo'),
    txtFecha = document.getElementById('fecha'),
    txtCantidad = document.getElementById('cantidad'),
    divProductosEgreso = document.getElementById('divProductosEgreso'),
    tblProductosEgreso = document.getElementById('tblProductosEgreso'),
    tbodyProductosEgreso = document.getElementById('tbodyProductosEgreso'),
    divProductosIngreso = document.getElementById('divProductosIngreso'),
    tblProductosIngreso = document.getElementById('tblProductosIngreso'),
    tbodyProductosIngreso = document.getElementById('tbodyProductosIngreso'),
    txtTotal = document.getElementById('total'),
    tbody = document.getElementById('detalles_producto'),
    hdnNoProducto = document.getElementById('noproducto'),
    txtProducto = document.getElementById('producto'),
    btnAgregar = document.getElementById('btnAgregar'),
    btnUpdateContainers = document.getElementById('btnUpdateContainers'),
    btnTrasladar = document.getElementById('btnTrasladar'),
    txtUnidad = document.getElementById('unidad');

$(document).ready(function () {
    $( "#producto" ).autocomplete({
        minLength: 1,
        source: function( request, response ) {
            const form = new FormData(document.getElementById('frm_mantenimiento_claves'));
            form.append('busqueda', request.term);
            open_loading();
            fetch(strUrlGetProductos, {
              method: 'POST',
              body: form
            })
                .then(response => response.json())
                .then( (data) => {
                    close_loading();
                    response($.map(data, function (item) {
                        return {
                            label: item.name,
                            value: item.id,
                            cantidad: item.Cantidad,
                            unidad: item.Unidad
                        }
                    }));
                })
                .catch((error) => {
                    close_loading();
                    console.error(error);
                    alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
                });
        },
        select: function( event, ui ) {
            event.preventDefault();
            const strProducto = ui.item.label;
            const intProducto = ui.item.value * 1;
            this.value = strProducto;
            hdnNoProducto.value = intProducto;
            arrGlobalCantidadEgreso[intProducto] = ui.item.cantidad * 1;

            if (arrGlobalCantidadEgreso[intProducto] === 0 && parseInt(sltTipo.value) !== 14) {
                alert_nova.showNotification('Producto no cuenta con presentación específica.', "warning", "danger");
                return false;
            }

            getDisponibilidad();
        }
    })
        .focus(function () {
            if (hdnEmpresaEgreso.value === '') {
                alert_nova.showNotification('Debe seleccionar empresa egreso.', "warning", "danger");
            }
            this.value = '';
            hdnNoProducto.value = '';
            tbody.innerHTML = '';
            btnAgregar.style.display = 'none';
            btnUpdateContainers.style.display = 'none';
        });
});

const changeEmpresaIngreso = () => {
    const intEmpresaIngreso = sltEmpresaIngreso.value;
    if (intEmpresaIngreso)
        hdnEmpresaIngreso.value = intEmpresaIngreso;
    else
        hdnEmpresaIngreso.value = '';
};

const changeEmpresaEgreso = () => {
    const intEmpresaEgreso = sltEmpresaEgreso.value;
    const txtProducto = document.getElementById('producto');

    if (intEmpresaEgreso) {
        hdnEmpresaEgreso.value = intEmpresaEgreso;
        txtProducto.removeAttribute('readonly');
    }
    else {
        txtProducto.setAttribute('readonly', 'readonly');
        txtProducto.value = '';
        hdnEmpresaEgreso.value = '';
    }
};

const getDisponibilidad = () => {
    const form = new FormData(document.getElementById('frm_mantenimiento_claves'));

    open_loading();
    fetch(strUrlGetDisponibilidad, {
      method: 'POST',
      body: form
    })
        .then(response => response.json())
        .then( (data) => {
            close_loading();

            tbody.innerHTML = '';
            if (data.disponibilidad.length === 0) {
                alert_nova.showNotification('Producto sin existencia.', "warning", "danger");
                btnAgregar.style.display = 'none';
                btnUpdateContainers.style.display = 'none';
                return false;
            }

            txtUnidad.value = data.unidad[0].Descripcion;
            txtCantidad.removeAttribute('readonly');
            let strBody = ``,
                boolShowUpdateContainers = false;

            arrDataDisponibilidad = data.disponibilidad;
            for (let key in data.disponibilidad) {
                const arrDetalle = data.disponibilidad[key];
                const arrSplit = arrDetalle.FechaVencimiento.split('T');
                const arrSplit2 = arrSplit[0].split('-');
                const strFechaVencimiento = arrSplit2[2] + '/' + arrSplit2[1] + '/' + arrSplit2[0];
                const strOrdenCompra = (arrDetalle.NoOrdenCompra === null)? '' : arrDetalle.NoOrdenCompra;
                let strNoContenedor = '',
                    strDisabled = '';
                if (!arrDetalle?.NoContenedor) {
                    strDisabled = 'disabled';
                    boolShowUpdateContainers = true;
                    boolUpdated = false;
                    strNoContenedor = ` <input id='contenedor_show_${arrDetalle.NoLote}' name='contenedor_show[]'
                                            ubicacion='${arrDetalle.NoUbicacion}'
                                            bodega='${arrDetalle.NoBodega}'
                                            lote='${arrDetalle.NoLote}'
                                            class='form-control' />`;
                }
                else {
                    strNoContenedor = ` <input id='contenedor_show_${arrDetalle.NoLote}' name='contenedor_show[]' class='form-control' value='${arrDetalle.NoContenedor}' disabled />`;
                }

                strBody += `
                    <tr>
                        <td>
                            <input type="checkbox" name="selectLote[]" id="selectLote_${arrDetalle.NoLote}" value="${arrDetalle.NoLote}" class="form-control" onclick="selectLotes(${arrDetalle.NoLote});" ${strDisabled} style="display: none;">
                        </td>
                        <td>
                            ${arrDetalle.NoLote}
                            <input type="hidden" name="NoLote[]" id="NoLote_${arrDetalle.NoLote}" value="${arrDetalle.NoLote}">
                            <input type="hidden" name="NoContendor[]" id="NoContenedor_${arrDetalle.NoLote}" value="${arrDetalle.NoContenedor}">
                            <input type="hidden" name="Existencia[]" id="Existencia_${arrDetalle.NoLote}" value="${arrDetalle.Existencia}">
                            <input type="hidden" name="Cantidad[]" id="Cantidad_${arrDetalle.NoLote}" value="${arrDetalle.Cantidad}">
                            <input type="hidden" name="Bodega[]" id="Bodega_${arrDetalle.NoLote}" value="${arrDetalle.NoBodega}">
                            <input type="hidden" name="NoProducto[]" id="NoProducto_${arrDetalle.NoLote}" value="${hdnNoProducto.value}">
                            <input type="hidden" name="NoUbicacion[]" id="NoUbicacion_${arrDetalle.NoLote}" value="${arrDetalle.NoUbicacion}">
                        </td>
                        <td>${strNoContenedor}</td>
                        <td>${strFechaVencimiento}</td>
                        <td style="text-align: right;">${arrDetalle.Existencia}</td>
                        <td style="text-align: right;" id="td_${arrDetalle.NoLote}">${arrDetalle.Cantidad}</td>
                        <td>${arrDetalle.NoBodega}</td>
                        <td>${arrDetalle.NoUbicacion}</td>
                        <td>${arrDetalle.Condicion}</td>
                        <td>${strOrdenCompra}</td>
                    </tr>
                `;
            }
            tbody.innerHTML = strBody;
            
            if(boolShowUpdateContainers) {
                btnUpdateContainers.style.display = '';
            }
            else {
                btnAgregar.style.display = '';
            }
        })
        .catch((error) => {
            close_loading();
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            console.error(error);
        });
};

const changeCantidad = () => {
    const objCantidad = document.getElementById('cantidad');
    const intCantidad = (objCantidad.value)? parseFloat(objCantidad.value) : 0;
    let intCantidadTMP = intCantidad;
    let intTotal = 0,
        intExistenciaTotal = 0,
        boolError = false;

    if (intCantidad) {
        const objCheckBox = document.querySelectorAll(`input[name="selectLote[]"]`);
        objCheckBox.forEach(element => {
            if(element.disabled)
                boolError = true;
            element.style.display = '';
        });

        const objExistencia = document.querySelectorAll(`input[name="Existencia[]"]`);

        objExistencia.forEach(element => {
            if(boolError)
                return false
            const intNoLote = element.id.split('_')[1];
            const objTD = document.getElementById(`td_${intNoLote}`);
            const objCheckbox = document.getElementById(`selectLote_${intNoLote}`);
            const objCantidadLote = document.getElementById(`Cantidad_${intNoLote}`);
            const objContenedor = document.getElementById(`NoContenedor_${intNoLote}`);
            const strContenedor = objContenedor.value.trim();
            const intExistencia = (element.value)? parseFloat(element.value) : 0;
            intExistenciaTotal += intExistencia;

            if (intCantidadTMP > 0 && strContenedor !== '') {
                if (intExistencia <= intCantidadTMP) {
                    objTD.innerHTML = intExistencia;
                    objCantidadLote.value = intExistencia;
                    intTotal += (intExistencia * 1);
                    intCantidadTMP = ((intCantidadTMP - intExistencia).toFixed(2) * 1);
                }
                else {
                    objTD.innerHTML = intCantidadTMP;
                    objCantidadLote.value = intCantidadTMP;
                    intTotal += (intCantidadTMP * 1);
                    intCantidadTMP = ((intCantidadTMP - intExistencia).toFixed(2) * 1);
                }

                objCheckbox.checked = true;
                document.getElementById(`td_${intNoLote}`).parentElement.style.backgroundColor = '#f5f5f5';

                if (strContenedor === '')
                    boolError = true;
            }
            else {
                objCheckbox.checked = false;
                document.getElementById(`td_${intNoLote}`).parentElement.style.backgroundColor = '';
                objTD.innerHTML = '';
                objCantidadLote.value = '';
            }

        });

        if (intCantidad > intExistenciaTotal) {
            alert_nova.showNotification("Cantidad mayor a lo disponible", "warning", "danger");
            btnAgregar.style.display = 'none';
        }
        else
            btnAgregar.style.display = '';

        if (boolError) {
            alert_nova.showNotification("No puede utilizar un lote sin contenedor, por favor ingrese el contenedor al lote.", "warning", "danger");
            btnAgregar.style.display = 'none';
        }

        txtTotal.value = ((intTotal).toFixed(2) * 1);
    }
    else {
        const objCheckBox = document.querySelectorAll(`input[name="selectLote[]"]`);
        objCheckBox.forEach(element => {
            element.style.display = 'none';
        });

        const objExistencia = document.querySelectorAll(`input[name="Existencia[]"]`);

        objExistencia.forEach(element => {
            const intNoLote = element.id.split('_')[1];
            document.getElementById(`td_${intNoLote}`).parentElement.style.backgroundColor = '';
            document.getElementById(`Cantidad_${intNoLote}`).value = '';
            document.getElementById(`td_${intNoLote}`).innerHTML = '';
            document.getElementById(`selectLote_${intNoLote}`).checked = false;
        });

        btnAgregar.style.display = 'none';
    }
};

const selectLotes = (intNoLote) => {
    const objContenedor = document.getElementById(`NoContenedor_${intNoLote}`);
    const strContenedor = objContenedor.value.trim();
    const objCheckbox = document.getElementById(`selectLote_${intNoLote}`);

    if (strContenedor === '') {
        objCheckbox.checked = false;
        alert_nova.showNotification("No puede seleccionar un lote sin contenedor.", "warning", "danger");
        return false;
    }

    const objCantidad = document.getElementById('cantidad');
    const intTotal = (objCantidad.value)? parseInt(objCantidad.value) : 0;
    const objCheckeados = document.querySelectorAll(`input[name="selectLote[]"]:checked`);

    if (intTotal) {
        const objExistencia = document.querySelectorAll(`input[name="Existencia[]"]`);

        objExistencia.forEach(element => {
            const intNoLoteTMP = element.id.split('_')[1];
            document.getElementById(`td_${intNoLoteTMP}`).parentElement.style.backgroundColor = '';
        });

        btnAgregar.style.display = (objCheckeados.length === 0)? 'none' : '';

        let intTotalTMP = 0;
        objCheckeados.forEach(element => {
            const intLote = parseInt(element.value);
            const objCantidadLote = document.getElementById(`Cantidad_${intLote}`);
            const intCantidadLote = parseFloat(objCantidadLote.value);

            intTotalTMP += (!objCheckbox.checked || objCheckbox !== element)? intCantidadLote : 0;
            document.getElementById(`td_${intLote}`).parentElement.style.backgroundColor = '#f5f5f5';
        });

        if (intTotalTMP < intTotal) {
            let intRestante = ((intTotal - intTotalTMP).toFixed(2) * 1);
            const intExistencia = parseFloat(document.getElementById(`Existencia_${intNoLote}`).value);
            if (intRestante > intExistencia)
                intRestante = intExistencia;

            if (objCheckbox.checked) {
                intTotalTMP += intRestante;
                document.getElementById(`Cantidad_${intNoLote}`).value = intRestante;
                document.getElementById(`td_${intNoLote}`).innerHTML = intRestante;
                document.getElementById(`td_${intNoLote}`).parentElement.style.backgroundColor = '#f5f5f5';
            }
            else {
                document.getElementById(`Cantidad_${intNoLote}`).value = '';
                document.getElementById(`td_${intNoLote}`).innerHTML = '';
                document.getElementById(`td_${intNoLote}`).parentElement.style.backgroundColor = '';
            }

        }
        else {
            objCheckbox.checked = false;
            alert_nova.showNotification("Cantidad limite.", "warning", "danger");
            document.getElementById(`Cantidad_${intNoLote}`).value = '';
            document.getElementById(`td_${intNoLote}`).innerHTML = '';
        }

        txtTotal.value = ((intTotalTMP).toFixed(2) * 1);

    }
    else {
        objCheckbox.checked = false;
        alert_nova.showNotification("Primero ingrese la cantidad.", "warning", "danger");
    }
};

const changeTipo = () => {
    const intTipo = (sltTipo.value)? parseInt(sltTipo.value) : 0;

    hdnTipo.value = intTipo;
    if (intTipo && intTipo === 14) {
        sltEmpresaIngreso.value = 2;
        hdnEmpresaIngreso.value = 2;
    }
    else {
        sltEmpresaIngreso.value = '';
        hdnEmpresaIngreso.value = '';
    }
};

const addProducto = () => {
    const intEmpresaIngreso = hdnEmpresaIngreso.value;
    const intEmpresaEgreso = hdnEmpresaEgreso.value;
    const intTipo = sltTipo.value;
    const intCantidad = parseFloat(txtCantidad.value);

    if (intEmpresaEgreso === '' || intEmpresaIngreso === '' || intTipo === '') {
        alert_nova.showNotification("Los campos marcados son obligatorios.", "warning", "danger");
        sltEmpresaEgreso.style.border = 'solid #f44336 1px';
        sltEmpresaIngreso.style.border = 'solid #f44336 1px';
        sltTipo.style.border = 'solid #f44336 1px';
        return false;
    }
    else {
        sltEmpresaEgreso.style.border = '';
        sltEmpresaIngreso.style.border = '';
        sltTipo.style.border = '';
    }

    sltEmpresaEgreso.setAttribute('disabled', 'true');
    sltEmpresaIngreso.setAttribute('disabled', 'true');
    sltTipo.setAttribute('disabled', 'true');

    arrGlobalEgresoCalculo[hdnNoProducto.value] = 0;
    if (arrGlobalCantidadEgreso[hdnNoProducto.value]) {
        arrGlobalEgresoCalculo[hdnNoProducto.value] = ((intCantidad / arrGlobalCantidadEgreso[hdnNoProducto.value]).toFixed(2) * 1);
    }

    let strTableEgreso = '',
        strTableIngreso = '';

    const strProducto = document.getElementById('producto').value;

    if(strProducto.trim() == '') {
        alert_nova.showNotification('No hay producto valido', 'warning', 'danger');
        return false;
    }

    const arrSplit = strProducto.split('-'),
        strCodigoProducto = arrSplit[0],
        strNombreProducto = arrSplit[1],
        strUnidad = txtUnidad.value;
    const objCantidadSeleccionada = document.querySelectorAll(`input[name="Cantidad[]"]`);

    objCantidadSeleccionada.forEach(element => {
        if (element.value !== '' && element.value != '0') {
            const strId = element.id;
            const arrSplit2 = strId.split('_');
            const strLote = arrSplit2[1];
            const strContenedor = document.getElementById(`NoContenedor_${strLote}`).value;
            const intBodega = document.getElementById(`Bodega_${strLote}`).value;
            const intNoProducto = document.getElementById(`NoProducto_${strLote}`).value;
            const intNoUbicacion = document.getElementById(`NoUbicacion_${strLote}`).value;

            strTableEgreso += `
                <tr>
                    <td>
                        ${intRowEgreso}
                        <input type="hidden" name="linea_egreso[]" id="linea_egreso_${intRowEgreso}" value="${intRowEgreso}">
                        <input type="hidden" name="cantidad_egreso[]" id="cantidad_egreso_${intRowEgreso}" value="${element.value}">
                        <input type="hidden" name="bodega_egreso[]" id="bodega_egreso_${intRowEgreso}" value="${intBodega}">
                        <input type="hidden" name="lote_egreso[]" id="lote_egreso_${intRowEgreso}" value="${strLote}">
                        <input type="hidden" name="producto_egreso[]" id="producto_egreso_${intRowEgreso}" value="${intNoProducto}">
                        <input type="hidden" name="contenedor_egreso[]" id="contenedor_egreso_${intRowEgreso}" value="${strContenedor}">
                    </td>
                    <td>${strCodigoProducto}</td>
                    <td>${strNombreProducto}</td>
                    <td>${strUnidad}</td>
                    <td>${element.value}</td>
                    <td>${strLote}</td>
                    <td>${strContenedor}</td>
                </tr>
            `;

            if (parseInt(intTipo) === 14) {
                strTableIngreso += `
                    <tr>
                        <td>
                            ${intRowIngreso}
                            <input type="hidden" name="linea_ingreso[]" id="linea_${intRowIngreso}" value="${intRowIngreso}">
                            <input type="hidden" name="cantidad_ingreso[]" id="cantidad_ingreso_${intRowIngreso}" value="${element.value}">
                            <input type="hidden" name="empaques_ingreso[]" id="empaques_ingreso_${intRowIngreso}" value="${arrGlobalEgresoCalculo[intNoProducto]}">
                            <input type="hidden" name="bodega_ingreso[]" id="bodega_ingreso_${intRowIngreso}" value="${intBodega}">
                            <input type="hidden" name="producto_ingreso[]" id="hdn_producto_ingreso_${intRowIngreso}" value="${intNoProducto}">
                            <input type="hidden" name="ubicacion_ingreso[]" id="ubicacion_ingreso_${intRowIngreso}" value="8">
                            <input type="hidden" name="lote_ingreso[]" id="lote_ingreso_${intRowIngreso}" value="${strLote}">
                            <input type="hidden" name="contenedor_ingreso[]" id="contenedor_ingreso_${intRowIngreso}" value="${strContenedor}">
                        </td>
                        <td>${strCodigoProducto} - ${strNombreProducto}</td>
                        <td>${strUbicacion}</td>
                        <td>${strUnidad}</td>
                        <td>${element.value}</td>
                        <td id="td_empaques_${intRowIngreso}">${arrGlobalEgresoCalculo[intNoProducto]}</td>
                        <td>${strLote}</td>
                        <td>
                            <input type="text" name="noorden_ingreso[]" id="noorden_ingreso_${intRowIngreso}" value="" class="form-control">
                        </td>
                        <td>${strContenedor}</td>
                    </tr>
                `;
            }
            else {
                strTableIngreso += `
                    <tr>
                        <td>
                            ${intRowIngreso}
                            <input type="hidden" name="linea_ingreso[]" id="linea_${intRowIngreso}" value="${intRowIngreso}">
                            <input type="hidden" name="bodega_ingreso[]" id="bodega_ingreso_${intRowIngreso}" value="${intBodega}">
                        <td>
                            <input type="text" name="txt_producto_ingreso[]" id="producto_ingreso_${intRowIngreso}" class="form-control" onfocus="searchProducto(this, ${intNoProducto});" data-row="${intRowIngreso}">
                            <input type="hidden" name="producto_ingreso[]" id="hdn_producto_ingreso_${intRowIngreso}">
                            <input type="hidden" name="lote_ingreso[]" id="lote_ingreso_${intRowIngreso}" value="${strLote}">
                            <input type="hidden" name="contenedor_ingreso[]" id="contenedor_ingreso_${intRowIngreso}" value="${strContenedor}">
                        </td>
                        <td>
                            <select name="ubicacion_ingreso[]" id="ubicacion_ingreso_${intRowIngreso}" class="form-control">
                                ${strOptions}
                            <select>
                        </td>
                        <td id="td_unidad_${intRowIngreso}"></td>
                        <td>
                            <input type="number" name="cantidad_ingreso[]" id="cantidad_ingreso_${intRowIngreso}" value="${element.value}" class="form-control" readonly>
                        </td>
                        <td>
                            <input type="number" name="empaques_ingreso[]" id="empaques_ingreso_${intRowIngreso}" value="${element.value}" class="form-control" readonly>
                        </td>
                        <td>${strLote}</td>
                        <td>
                            <input type="text" name="noorden_ingreso[]" id="noorden_ingreso_${intRowIngreso}" value="" class="form-control">
                        </td>
                        <td>${strContenedor}</td>
                    </tr>
                `;
            }

            intRowEgreso++;
            intRowIngreso++;
        }
    });

    tbody.innerHTML = '';
    txtTotal.value = '';
    txtCantidad.value = '';
    hdnNoProducto.value = '';
    txtProducto.value = '';
    txtUnidad.value = '';
    tblProductosEgreso.style.display = '';
    tblProductosIngreso.style.display = '';
    $(tbodyProductosEgreso).append(strTableEgreso);
    $(tbodyProductosIngreso).append(strTableIngreso);
    btnAgregar.style.display = 'none';
    btnTrasladar.style.display = '';
};

const searchProducto = (objTxt, intProductoEgreso) => {
    const intRow = objTxt.getAttribute('data-row');
    const tdUnidad = document.getElementById(`td_unidad_${intRow}`);
    const hdnProductoIngreso = document.getElementById(`hdn_producto_ingreso_${intRow}`);
    const txtCantidadIngreso = document.getElementById(`cantidad_ingreso_${intRow}`);
    const txtEmpaquesIngreso = document.getElementById(`empaques_ingreso_${intRow}`);

    $( objTxt ).autocomplete({
        minLength: 1,
        source: function( request, response ) {
            const form = new FormData(document.getElementById('frm_mantenimiento_claves'));
            form.append('busqueda', request.term);
            open_loading();

            fetch(strUrlGetProductos, {
              method: 'POST',
              body: form
            })
                .then(response => response.json())
                .then( (data) => {

                    close_loading();
                    response($.map(data, function (item) {
                        return {
                            label: item.name,
                            value: item.id,
                            cantidad: item.Cantidad,
                            unidad: item.Unidad,
                        }
                    }));
                })
                .catch((error) => {
                    close_loading();
                    console.error(error);
                    alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
                });
        },
        select: function( event, ui ) {
            event.preventDefault();
            const strProductoIngreso = ui.item.label;
            const intProductoIngreso = ui.item.value * 1;
            objTxt.value = strProductoIngreso;
            tdUnidad.innerHTML = ui.item.unidad;
            hdnProductoIngreso.value = intProductoIngreso;

            txtEmpaquesIngreso.value = arrGlobalEgresoCalculo[intProductoEgreso];
            if (arrGlobalEgresoCalculo[intProductoEgreso] <= 0) {
                txtCantidadIngreso.value = ((txtCantidad.value).toFixed(2) * 1);
                txtEmpaquesIngreso.value = ((txtCantidad.value / ui.item.cantidad).toFixed(2) * 1);
            }
            else {
                txtCantidadIngreso.value = ((arrGlobalEgresoCalculo[intProductoEgreso] * ui.item.cantidad).toFixed(2) * 1);
            }
        }
    }).focus(function () {
        objTxt.value = '';
        txtEmpaquesIngreso.value = '';
        tdUnidad.innerHTML = '';
        hdnProductoIngreso.value = '';
        txtCantidadIngreso.value = '';
    });
};

const saveTraslado = async () => {
    open_loading();
    const arrEncabezado = {
        noempresa: hdnEmpresaEgreso.value,
        noempresai: hdnEmpresaIngreso.value,
        tipoegreso: hdnTipo.value,
        tipoingreso: (parseInt(hdnTipo.value) === 14)? 12 : 26,
        fecha: txtFecha.value,
        observacionegreso: document.getElementById('observacionegreso').value,
        observacioningreso: document.getElementById('observacioningreso').value
    };

    const arrDetalleEgreso = [],
        arrDetalleIngreso = [],
        arrLineaEgreso = document.querySelectorAll(`input[name="linea_egreso[]"]`),
        arrLineaIngreso = document.querySelectorAll(`input[name="linea_ingreso[]"]`);

    arrLineaEgreso.forEach(elementLinea => {
        const intRow = parseInt(elementLinea.value),
            intCantidad = parseFloat(document.getElementById(`cantidad_egreso_${intRow}`).value),
            intBodega = document.getElementById(`bodega_egreso_${intRow}`).value,
            intLote = document.getElementById(`lote_egreso_${intRow}`).value,
            intNoProducto = parseInt(document.getElementById(`producto_egreso_${intRow}`).value);

        arrDetalleEgreso.push({
            Linea: intRow,
            Cantidad: `${intCantidad}`,
            Bodega: intBodega,
            Lote: intLote,
            Producto: intNoProducto
        });
    });

    arrLineaIngreso.forEach(elementLinea => {
        const intRow = parseInt(elementLinea.value),
            intCantidad = parseFloat(document.getElementById(`cantidad_ingreso_${intRow}`).value),
            intBodega = (parseInt(hdnTipo.value) === 14)? 10 : parseInt(document.getElementById(`bodega_ingreso_${intRow}`).value),
            intNoProducto = parseInt(document.getElementById(`hdn_producto_ingreso_${intRow}`).value),
            intUbicacion = parseInt(document.getElementById(`ubicacion_ingreso_${intRow}`).value),
            intEmpaques = parseFloat(document.getElementById(`empaques_ingreso_${intRow}`).value),
            strNoOrdenCompra = document.getElementById(`noorden_ingreso_${intRow}`).value,
            strContenedor = document.getElementById(`contenedor_ingreso_${intRow}`).value;

        arrDetalleIngreso.push({
            Linea: intRow,
            Bodega: intBodega,
            Producto: intNoProducto,
            Cantidad: `${intCantidad}`,
            Empaques: `${intEmpaques}`,
            Ubicacion: intUbicacion,
            Contenedor: `${strContenedor}`,
            NoOrdenCompra: `${strNoOrdenCompra}`
        });
    });

    const form = new FormData(),
        csrftoken = getCookie('csrftoken');
    let data = [];
    form.append('encabezado', JSON.stringify(arrEncabezado));
    form.append('detalleEgreso', JSON.stringify(arrDetalleEgreso));
    form.append('detalleIngreso', JSON.stringify(arrDetalleIngreso));
    form.append('csrfmiddlewaretoken', csrftoken);

    const response = await fetch(strUrlSaveTraslado, { method: 'POST', body: form });
    close_loading();
    try {
        data = await response.json();
    } catch (error) {
        data = [];
        console.error(error);
        alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
    }

    if(data?.status) {
        document.getElementById('lbl_noegreso').innerHTML = `Documento: ${data.data.Egreso}`;
        document.getElementById('lbl_noingreso').innerHTML = `Documento: ${data.data.Ingreso}`;
        btnTrasladar.style.display = 'none';
        alert_nova.showNotification('Movimientos generales.');
    }
};

const updateNoContainers = async () => {
    open_loading();
    const objCheckBox = document.querySelectorAll(`input[name="contenedor_show[]"]`);
    let boolError = false,
        csrftoken = getCookie('csrftoken');
    
    await objCheckBox.forEach(async elm => {
        if(elm.value.trim() != '') {
            let ubicacion = elm.getAttribute('ubicacion'),
                bodega = elm.getAttribute('bodega'),
                lote = elm.getAttribute('lote'),
                noContenedor = elm.value;

            if(ubicacion && bodega && lote && noContenedor) {
                if(!boolError) {
                    let form = new FormData(),
                        data = [];
                    form.append('lote', lote);
                    form.append('ubicacion', ubicacion);
                    form.append('bodega', bodega);
                    form.append('contenedor', noContenedor);
                    form.append('csrfmiddlewaretoken', csrftoken);
                    const response = await fetch(strUrlSaveNoContainer, { method: 'POST', body: form });

                    try {
                        data = response.json();
                    } catch(error) {
                        data = [];
                        boolError = true;
                    }

                    if(!data?.status)
                        boolError = true;
                }
            }
        }
    });
    
    if(boolError)
        alert_nova.showNotification('Ocurrio un problema al actualizar los nombres, contacta con soporte', 'warning', 'danger');
    else
        location.reload();
    close_loading();
};

if (sltEmpresaIngreso)
    sltEmpresaIngreso.addEventListener('change', changeEmpresaIngreso);

if (sltEmpresaEgreso)
    sltEmpresaEgreso.addEventListener('change', changeEmpresaEgreso);

if (txtCantidad)
    txtCantidad.addEventListener('change', changeCantidad);

if (btnAgregar)
    btnAgregar.addEventListener('click', addProducto);

if (sltTipo)
    sltTipo.addEventListener('change', changeTipo);

if(btnUpdateContainers)
    btnUpdateContainers.addEventListener('click', updateNoContainers);