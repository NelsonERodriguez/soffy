let arrGlobalCantidadEgreso = [],
    arrGlobalEgresoCalculo = [],
    intRowEgreso = 1,
    intRowIngreso = 1;
const sltEmpresaEgreso = document.getElementById('slt_empresa_egreso'),
    hdnEmpresaEgreso = document.getElementById('empresa_egreso'),
    sltEmpresaIngreso = document.getElementById('slt_empresa_ingreso'),
    hdnEmpresaIngreso = document.getElementById('empresa_ingreso'),
    hdnTipo = document.getElementById('tipo'),
    txtFecha = document.getElementById('fecha'),
    txtCantidad = document.getElementById('cantidad'),
    divProductosEgreso = document.getElementById('divProductosEgreso'),
    tblProductosEgreso = document.getElementById('tblProductosEgreso'),
    tbodyProductosEgreso = document.getElementById('tbodyProductosEgreso'),
    divProductosIngreso = document.getElementById('divProductosIngreso'),
    tblProductosIngreso = document.getElementById('tblProductosIngreso'),
    tbodyProductosIngreso = document.getElementById('tbodyProductosIngreso'),
    theadProductosIngreso = document.getElementById('theadProductosIngreso'),
    txtTotal = document.getElementById('total'),
    tbody = document.getElementById('detalles_producto'),
    hdnNoProducto = document.getElementById('noproducto'),
    txtProducto = document.getElementById('producto'),
    btnAgregar = document.getElementById('btnAgregar'),
    btnTrasladar = document.getElementById('btnTrasladar'),
    btnAgregarIngreso = document.getElementById('btnAgregarIngreso'),
    txtUnidad = document.getElementById('unidad'),
    txtDocumento = document.getElementById('nodocumento'),
    hdnNoMovimientoEgreso = document.getElementById('nomovimiento_egreso'),
    hdnNoMovimientoIngreso = document.getElementById('nomovimiento_ingreso');

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

            getDisponibilidad();

        }

    })
        .focus(function () {

            const objDetalleEgreso = document.querySelectorAll('input[name="linea_egreso[]"]');

            if (objDetalleEgreso.length) {
                this.setAttribute('readonly', 'readonly');
            }
            else {
                this.removeAttribute('readonly');
            }

            if (hdnEmpresaEgreso.value === '') {
                alert_nova.showNotification('Debe seleccionar empresa egreso.', "warning", "danger");
                this.setAttribute('readonly', 'readonly');
            }
            else {
                if (!objDetalleEgreso.length) this.removeAttribute('readonly');
            }
            this.value = '';
            hdnNoProducto.value = '';
            tbody.innerHTML = '';
            btnAgregar.style.display = 'none';

    });

});

const changeEmpresaIngreso = () => {
    const intEmpresaIngreso = sltEmpresaIngreso.value;

    if (intEmpresaIngreso) {
        hdnEmpresaIngreso.value = intEmpresaIngreso;
    }
    else {
        hdnEmpresaIngreso.value = '';
    }
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
              return false;
          }

          txtUnidad.value = data.unidad[0].Descripcion;
          txtCantidad.removeAttribute('readonly');
          let strBody = ``;

          for (let key in data.disponibilidad) {

              const arrDetalle = data.disponibilidad[key];
              const arrSplit = arrDetalle.FechaVencimiento.split('T');
              const arrSplit2 = arrSplit[0].split('-');
              const strFechaVencimiento = arrSplit2[2] + '/' + arrSplit2[1] + '/' + arrSplit2[0];
              const strOrdenCompra = (arrDetalle.NoOrdenCompra === null)? '' : arrDetalle.NoOrdenCompra;

              strBody += `
                <tr>
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
                    <td>${arrDetalle.NoContenedor}</td>
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
          btnAgregar.style.display = '';

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
    let intTotal = 0;
    let intExistenciaTotal = 0;

    if (intCantidad) {

        const objExistencia = document.querySelectorAll(`input[name="Existencia[]"]`);
        let boolError = false;

        objExistencia.forEach(element => {

            const intNoLote = element.id.split('_')[1];
            const objTD = document.getElementById(`td_${intNoLote}`);
            const objCantidadLote = document.getElementById(`Cantidad_${intNoLote}`);
            const objContenedor = document.getElementById(`NoContenedor_${intNoLote}`);
            const intExistencia = (element.value)? parseFloat(element.value) : 0;
            intExistenciaTotal += intExistencia;

            if (intCantidadTMP > 0) {
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
                const strContenedor = objContenedor.value.trim();

                if (strContenedor === '') {
                    alert_nova.showNotification("Lote sin contenedor, primero debe ingresarle contenedor al lote para poder procesar.", "warning", "danger");
                    boolError = true;
                    btnAgregar.style.display = 'none';
                }

            }
            else {
                objTD.innerHTML = '';
                objCantidadLote.value = '';
            }

        });

        if (intCantidad > intExistenciaTotal) {
            alert_nova.showNotification("Cantidad mayor a lo disponible", "warning", "danger");
            btnAgregar.style.display = 'none';
        }
        else {
            btnAgregar.style.display = '';
        }

        if (boolError) {
            btnAgregar.style.display = 'none';
        }

        txtTotal.value = ((intTotal).toFixed(2) * 1);

    }

};

const changeTipo = () => {
    const intTipo = (hdnTipo.value)? parseInt(hdnTipo.value) : 0;

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

    const intEmpresaEgreso = hdnEmpresaEgreso.value;
    const intTipo = hdnTipo.value;

    if (intEmpresaEgreso === '' || intTipo === '') {
        alert_nova.showNotification("Los campos marcados son obligatorios.", "warning", "danger");
        sltEmpresaEgreso.style.border = 'solid #f44336 1px';
        hdnTipo.style.border = 'solid #f44336 1px';
        return false;
    }
    else {
        sltEmpresaEgreso.style.border = '';
        hdnTipo.style.border = '';
    }

    sltEmpresaEgreso.setAttribute('disabled', 'true');
    hdnTipo.setAttribute('disabled', 'true');

    let strTableEgreso = '';
    let strTableIngreso = '';
    const strProducto = document.getElementById('producto').value;
    const arrSplit = strProducto.split('-');
    const strCodigoProducto = arrSplit[0];
    const strNombreProducto = arrSplit[1];
    const strUnidad = txtUnidad.value;
    const objCantidadSeleccionada = document.querySelectorAll(`input[name="Cantidad[]"]`);
    let strContenedorIngreso = '';

    objCantidadSeleccionada.forEach(element => {

        if (element.value !== '') {

            const strId = element.id;
            const arrSplit2 = strId.split('_');
            const strLote = arrSplit2[1];
            const strContenedor = document.getElementById(`NoContenedor_${strLote}`).value;
            strContenedorIngreso = (strContenedorIngreso !== '')? strContenedorIngreso :  document.getElementById(`NoContenedor_${strLote}`).value;
            const intBodega = document.getElementById(`Bodega_${strLote}`).value;
            const intNoProducto = document.getElementById(`NoProducto_${strLote}`).value;

            strTableEgreso += `
            <tr>
                <td>
                    ${intRowEgreso}
                    <input type="hidden" name="linea_egreso[]" id="linea_egreso_${intRowEgreso}" value="${intRowEgreso}">
                    <input type="hidden" name="cantidad_egreso[]" id="cantidad_egreso_${intRowEgreso}" value="${element.value}">
                    <input type="hidden" name="bodega_egreso[]" id="bodega_egreso_${intRowEgreso}" value="${intBodega}">
                    <input type="hidden" name="lote_egreso[]" id="lote_egreso_${intRowEgreso}" value="${strLote}">
                    <input type="hidden" name="producto_egreso[]" id="producto_egreso_${intRowEgreso}" value="${intNoProducto}">
                </td>
                <td>${strCodigoProducto}</td>
                <td>${strNombreProducto}</td>
                <td>${strUnidad}</td>
                <td>${element.value}</td>
                <td>${strLote}</td>
                <td>${strContenedor}</td>
            </tr>
        `;

            intRowEgreso++;
        }

    });

    strTableIngreso += `
        <tr>
            <td>
                ${intRowIngreso}
                <input type="hidden" name="linea_ingreso[]" id="linea_${intRowIngreso}" value="${intRowIngreso}">
                <input type="hidden" name="bodega_ingreso[]" id="bodega_ingreso_${intRowIngreso}" value="1">
            <td>
                <input type="text" name="txt_producto_ingreso[]" id="producto_ingreso_${intRowIngreso}" class="form-control" onfocus="searchProducto(this);" data-row="${intRowIngreso}">
                <input type="hidden" name="hdn_producto_ingreso[]" id="hdn_producto_ingreso_${intRowIngreso}" value="0">
                <input type="hidden" name="hdn_contenedor[]" id="hdn_contenedor_${intRowIngreso}" value="${strContenedorIngreso}">
            </td>
            <td>
                <input type="number" name="cantidad_ingreso[]" id="cantidad_ingreso_${intRowIngreso}" value="" class="form-control">
            </td>
        </tr>
    `;


    tbody.innerHTML = '';
    txtTotal.value = '';
    txtCantidad.value = '';
    hdnNoProducto.value = '';
    txtProducto.value = '';
    txtUnidad.value = '';
    tblProductosEgreso.style.display = '';
    tblProductosIngreso.style.display = '';
    $(tbodyProductosEgreso).append(strTableEgreso);
    theadProductosIngreso.innerHTML = `
                                <tr>
                                    <th>Linea</th>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                </tr>
    `;
    $(tbodyProductosIngreso).append(strTableIngreso);
    btnAgregar.style.display = 'none';
    btnTrasladar.style.display = '';
    btnAgregarIngreso.style.display = '';
};

const searchProducto = (objTxt) => {
    const intRow = objTxt.getAttribute('data-row');
    const hdnProductoIngreso = document.getElementById(`hdn_producto_ingreso_${intRow}`);
    const txtCantidadIngreso = document.getElementById(`cantidad_ingreso_${intRow}`);

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
            hdnProductoIngreso.value = intProductoIngreso;

        }

    }).focus(function () {

        objTxt.value = '';
        hdnProductoIngreso.value = 0;
        txtCantidadIngreso.value = '';

    });

};

const saveTraslado = () => {
    const intNoMovimiento = (hdnNoMovimientoEgreso.value)? parseInt(hdnNoMovimientoEgreso.value) : 0;
    const intEmpresaI = (hdnEmpresaIngreso.value)? parseInt(hdnEmpresaIngreso.value) : 0;

    const arrEncabezado = {
        noempresa: hdnEmpresaEgreso.value,
        noempresai: intEmpresaI,
        tipoegreso: hdnTipo.value,
        tipoingreso: 10,
        fecha: txtFecha.value,
        document: txtDocumento.value,
        observacionegreso: document.getElementById('observacionegreso').value,
        observacioningreso: document.getElementById('observacioningreso').value,
        nomovimiento_egreso: intNoMovimiento,
        nomovimiento_ingreso: 0
    };

    const arrDetalleEgreso = [];
    const arrDetalleIngreso = [];

    const arrLineaEgreso = document.querySelectorAll(`input[name="linea_egreso[]"]`);

    if (!intNoMovimiento) {
        arrLineaEgreso.forEach(elementLinea => {
            const intRow = parseInt(elementLinea.value);
            const intCantidad = parseFloat(document.getElementById(`cantidad_egreso_${intRow}`).value);
            const intBodega = document.getElementById(`bodega_egreso_${intRow}`).value;
            const intLote = document.getElementById(`lote_egreso_${intRow}`).value;
            const intNoProducto = parseInt(document.getElementById(`producto_egreso_${intRow}`).value);

            arrDetalleEgreso.push({
                Linea: intRow,
                Cantidad: `${intCantidad}`,
                Bodega: intBodega,
                Lote: intLote,
                Producto: intNoProducto
            });
        });
    }

    const arrLineaIngreso = document.querySelectorAll(`input[name="linea_ingreso[]"]`);

    let boolError = false;
    arrLineaIngreso.forEach(elementLinea => {
        const intRow = parseInt(elementLinea.value);
        const intCantidad = (document.getElementById(`cantidad_ingreso_${intRow}`))?  parseFloat(document.getElementById(`cantidad_ingreso_${intRow}`).value) : 0;
        const intNoProducto = parseInt(document.getElementById(`hdn_producto_ingreso_${intRow}`).value);
        const strContenedor = document.getElementById(`hdn_contenedor_${intRow}`).value;

        if (intNoProducto) {
            if (!intCantidad) {
                alert_nova.showNotification('Debe ingresar la cantidad a ingresar.', "warning", "danger");
                boolError = true;
            }

            arrDetalleIngreso.push({
                Linea: intRow,
                Cantidad: `${intCantidad}`,
                Producto: intNoProducto,
                Contenedor: strContenedor
            });
        }
        else {
            if (intEmpresaI) {
                alert_nova.showNotification('Por favor si selecciona la empresa ingreso, debe ingresar los productos del ingreso.', "warning", "danger");
                boolError = true;
            }
        }
    });

    if (boolError) {
        return false;
    }

    const form = new FormData();
    form.append('encabezado', JSON.stringify(arrEncabezado));
    if (!intNoMovimiento) {
        form.append('detalleEgreso', JSON.stringify(arrDetalleEgreso));
    }

    if (arrDetalleIngreso.length) {
        if (!intEmpresaI) {
            alert_nova.showNotification('Por favor si selecciona la empresa ingreso.', "warning", "danger");
            return false;
        }
        form.append('detalleIngreso', JSON.stringify(arrDetalleIngreso));
    }

    let csrftoken = getCookie('csrftoken');

    open_loading();

    fetch(strUrlSaveTraslado, {
        method: 'POST',
        body: form,
        headers: {
            "X-CSRFToken": csrftoken
        }
    })
        .then(response => response.json())
        .then( (data) => {

            close_loading();

            hdnNoMovimientoEgreso.value = data.nomivimiento_egreso;
            hdnNoMovimientoIngreso.value = data.nomivimiento_ingreso;
            txtDocumento.value = data.documento_egreso;
            $(txtDocumento).parent().attr('class', 'form-group bmd-form-group is-filled');
            txtDocumento.parentElement.classList.add('is-filled');
            if (data.documento_egreso) {
                document.getElementById('lbl_noegreso').innerHTML = `Documento: ${data.documento_egreso}`;
                alert_nova.showNotification('Egreso grabado.', "add_alert", "success");
            }

            if (data.documento_ingreso) {
                document.getElementById('lbl_noingreso').innerHTML = `Documento: ${data.documento_ingreso}`;
                alert_nova.showNotification('Ingreso grabado.', "add_alert", "success");

                btnTrasladar.style.display = 'none';
                btnAgregarIngreso.style.display = 'none';
                searchMovimientos();
            }


        })
        .catch((error) => {

            close_loading();
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");

        });

};

const searchMovimientos = () => {
    open_loading();

    let csrftoken = getCookie('csrftoken');
    const intNoDocumento = txtDocumento.value;
    const form = new FormData();
    form.append('nodocumento', intNoDocumento);

    fetch(strUrlGetMovimientos, {
        method: 'POST',
        body: form,
        headers: {
            "X-CSRFToken": csrftoken
        }
    })
        .then(response => response.json())
        .then( (data) => {

            close_loading();

            if (data.nomovimiento_egreso) {
                btnAgregar.style.display = 'none';
                txtProducto.value = '';
                txtProducto.setAttribute('readonly', 'readonly');
                hdnNoProducto.value = '';
                tbody.innerHTML = '';
                hdnNoMovimientoEgreso.value = data.nomovimiento_egreso;
                hdnNoMovimientoIngreso.value = data.nomovimiento_ingreso;
                document.getElementById('observacionegreso').value = data.movimiento_egreso[0].Observaciones;
                document.getElementById('observacionegreso').parentElement.classList.add('is-filled');
                // $('#observacionegreso').parent().attr('class', 'form-group bmd-form-group is-filled');
                sltEmpresaEgreso.value = data.movimiento_egreso[0].NoEmpresa;
                hdnEmpresaEgreso.value = data.movimiento_egreso[0].NoEmpresa;
                txtFecha.value = data.movimiento_egreso[0].Fecha.split('T')[0];
                document.getElementById('lbl_noegreso').innerHTML = `Documento: ${data.movimiento_egreso[0].NoDocumento}`;

                let strContenedor = '';
                if (data.detallemovimiento_egreso.length) {

                    let strTableEgreso = '';
                    for (let key in data.detallemovimiento_egreso) {
                        const arrData = data.detallemovimiento_egreso[key];

                        strContenedor = arrData.Contenedor;
                        strTableEgreso += `
                        <tr>
                            <td>
                                ${arrData.Linea}
                                <input type="hidden" name="linea_egreso[]" id="linea_egreso_${arrData.Linea}" value="${arrData.Linea}">
                                <input type="hidden" name="cantidad_egreso[]" id="cantidad_egreso_${intRowEgreso}" value="${arrData.Cantidad}">
                            </td>
                            <td>${arrData.CodigoProducto}</td>
                            <td>${arrData.Producto}</td>
                            <td>${arrData.Unidad}</td>
                            <td>${arrData.Cantidad}</td>
                            <td>${arrData.Lote}</td>
                            <td>${arrData.Contenedor}</td>
                        </tr>
                    `;

                    }
                    tblProductosEgreso.style.display = '';
                    tbodyProductosEgreso.innerHTML = strTableEgreso;

                }

                if (data.detallemovimiento_ingreso.length) {

                    let strTableIngreso = '';
                    for (let key in data.detallemovimiento_ingreso) {
                        const arrData = data.detallemovimiento_ingreso[key];

                        strTableIngreso += `
                        <tr>
                            <td>
                                ${arrData.Linea}
                                <input type="hidden" name="linea_ingreso[]" id="linea_ingreso_${arrData.Linea}" value="${arrData.Linea}">
                            </td>
                            <td>${arrData.CodigoProducto}</td>
                            <td>${arrData.Producto}</td>
                            <td>${arrData.Unidad}</td>
                            <td>${arrData.Cantidad}</td>
                            <td>${arrData.Lote}</td>
                            <td>${arrData.Contenedor}</td>
                        </tr>
                    `;

                    }
                    tblProductosIngreso.style.display = '';
                    theadProductosIngreso.innerHTML = `
                                                <tr>
                                                    <th>Linea</th>
                                                    <th>Código</th>
                                                    <th>Descripción</th>
                                                    <th>Unidad</th>
                                                    <th>Cantidad</th>
                                                    <th>Lote</th>
                                                    <th>Contendor</th>
                                                </tr>
                    `;
                    tbodyProductosIngreso.innerHTML = strTableIngreso;
                    btnAgregarIngreso.style.display = 'none';
                    btnTrasladar.style.display = 'none';

                }
                else {

                    let intRowIngreso = 1;
                    let strTableIngreso = `
                        <tr>
                            <td>
                                ${intRowIngreso}
                                <input type="hidden" name="linea_ingreso[]" id="linea_${intRowIngreso}" value="${intRowIngreso}">
                                <input type="hidden" name="bodega_ingreso[]" id="bodega_ingreso_${intRowIngreso}" value="1">
                            <td>
                                <input type="text" name="txt_producto_ingreso[]" id="producto_ingreso_${intRowIngreso}" class="form-control" onfocus="searchProducto(this);" data-row="${intRowIngreso}">
                                <input type="hidden" name="hdn_producto_ingreso[]" id="hdn_producto_ingreso_${intRowIngreso}" value="0">
                                <input type="hidden" name="hdn_contenedor[]" id="hdn_contenedor_${intRowIngreso}" value="${strContenedor}">
                            </td>
                            <td>
                                <input type="number" name="cantidad_ingreso[]" id="cantidad_ingreso_${intRowIngreso}" value="" class="form-control">
                            </td>
                        </tr>
                    `;

                    tblProductosIngreso.style.display = '';
                    theadProductosIngreso.innerHTML = `
                                                <tr>
                                                    <th>Linea</th>
                                                    <th>Producto</th>
                                                    <th>Cantidad</th>
                                                </tr>
                    `;
                    tbodyProductosIngreso.innerHTML = strTableIngreso;
                    btnAgregarIngreso.style.display = '';
                    btnTrasladar.style.display = '';
                }

                if (data.movimiento_ingreso.length) {
                    sltEmpresaIngreso.value = data.movimiento_ingreso[0].NoEmpresa;
                    hdnEmpresaIngreso.value = data.movimiento_ingreso[0].NoEmpresa;
                    document.getElementById('observacioningreso').value = data.movimiento_ingreso[0].Observaciones;
                    document.getElementById('observacioningreso').parentElement.classList.add('is-filled');
                    // $('#observacioningreso').parent().attr('class', 'form-group bmd-form-group is-filled');
                    document.getElementById('lbl_noingreso').innerHTML = `Documento: ${data.movimiento_ingreso[0].NoDocumento}`;
                }
                else {
                    sltEmpresaIngreso.value = '';
                    hdnEmpresaIngreso.value = '';
                }

            }
            else {
                document.getElementById('lbl_noegreso').innerHTML = '';
                document.getElementById('lbl_noingreso').innerHTML = '';
                tblProductosEgreso.style.display = 'none';
                tbodyProductosEgreso.innerHTML = '';
                tblProductosIngreso.style.display = 'none';
                tbodyProductosIngreso.innerHTML = '';
                btnAgregarIngreso.style.display = 'none';
                btnTrasladar.style.display = 'none';
            }

        })
        .catch((error) => {

            close_loading();
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");

        });
};

const addIngreso = () => {
    let intRowIngreso = 1;

    const objLineasIngreso = document.querySelectorAll('input[name="linea_ingreso[]"]');

    let strContenedor = '';
    objLineasIngreso.forEach(element => {
        const intRowTMP = element.value;
        strContenedor = (strContenedor === '')? document.getElementById(`hdn_contenedor_${intRowTMP}`).value : strContenedor;
        intRowIngreso++;
    });

    let strTableIngreso = `
                    <tr>
                        <td>
                            ${intRowIngreso}
                            <input type="hidden" name="linea_ingreso[]" id="linea_${intRowIngreso}" value="${intRowIngreso}">
                            <input type="hidden" name="bodega_ingreso[]" id="bodega_ingreso_${intRowIngreso}" value="1">
                        <td>
                            <input type="text" name="txt_producto_ingreso[]" id="producto_ingreso_${intRowIngreso}" class="form-control" onfocus="searchProducto(this);" data-row="${intRowIngreso}">
                            <input type="hidden" name="hdn_producto_ingreso[]" id="hdn_producto_ingreso_${intRowIngreso}" value="0">
                            <input type="hidden" name="hdn_contenedor[]" id="hdn_contenedor_${intRowIngreso}" value="${strContenedor}">
                        </td>
                        <td>
                            <input type="number" name="cantidad_ingreso[]" id="cantidad_ingreso_${intRowIngreso}" value="" class="form-control">
                        </td>
                    </tr>
    `;

    $(tbodyProductosIngreso).append(strTableIngreso);
};

if (txtDocumento) {
    txtDocumento.addEventListener('change', searchMovimientos);
}

if (sltEmpresaIngreso) {
    sltEmpresaIngreso.addEventListener('change', changeEmpresaIngreso);
}

if (sltEmpresaEgreso) {
    sltEmpresaEgreso.addEventListener('change', changeEmpresaEgreso);
}

if (txtCantidad) {
    txtCantidad.addEventListener('change', changeCantidad);
}

if (btnAgregar) {
    btnAgregar.addEventListener('click', addProducto);
}

if (hdnTipo) {
    hdnTipo.addEventListener('change', changeTipo);
}
