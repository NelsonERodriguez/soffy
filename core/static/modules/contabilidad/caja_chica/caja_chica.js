let objGlobalF = [],
    objGlobalFCombustible = [],
    objGlobalE = [],
    objGlobalPC = [],
    intTotalLiquidacion = 0,
    boolGlobalSend = false,
    intTotalLiquidacionPrint;
const btnAddFE = document.getElementById('btnAddFE'),
      btnAddFN = document.getElementById('btnAddFN'),
      btnAddFPC = document.getElementById('btnAddFPC'),
      elementSearchCC = document.getElementById('autocomplete_cuenta_contable'),
      elementSearchArea = document.getElementById('autocomplete_area'),
      elementSearchP = document.getElementById('autocomplete_proveedor'),
      elementAreaRow = document.getElementById('autocomplete_area_row');

drawTableCombustible();
drawTableNormal();
drawTableEspeciales();
drawTablePC();
drawTotalLiquidacion();
setFunctionsSave();

if(typeof boolEdit !== 'undefined')
    setObjGlobals();

if(btnAddFE)
    btnAddFE.addEventListener('click', addFacturaEspecial);

if(btnAddFN)
    btnAddFN.addEventListener('click', addFacturaNormal);

if(btnAddFPC)
    btnAddFPC.addEventListener('click', addFacturaPC);

if(elementSearchCC) {
    $('#autocomplete_cuenta_contable').autocomplete({
        minLength: 1,
        source: ( request, response ) => {
            const strUrl = urls.search_cuenta_contable.replace('strSearch', request.term);
            const data = new FormData();
            data.append('csrfmiddlewaretoken', valCSRF);
            fetch(strUrl, { method: 'POST', body: data, })
            .then(response => response.json())
            .then( data => {
                response($.map(data, function (item) {
                    return { label: `${item.cuenta} ${item.nombre}`, value: item.cuenta }
                }))
            })
            .catch((error) => { console.error(error); });
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById('autocomplete_cuenta_contable').value = ui.item.label;
            document.getElementById('autocomplete_cuenta_contable_id').value = ui.item.value;
        }
    });
}

if(elementSearchP) {
    $('#autocomplete_proveedor').autocomplete({
        minLength: 1,
        source: ( request, response ) => {
            const strUrl = urls.search_proveedor.replace('strSearch', request.term);
            const data = new FormData();
            data.append('csrfmiddlewaretoken', valCSRF);
            fetch(strUrl, { method: 'POST', body: data, })
            .then(response => response.json())
            .then( data => {
                response($.map(data, function (item) {
                    return { label: `${item.codigo_proveedor} ${item.nombre}`, value: item.codigo_proveedor }
                }))
            })
            .catch((error) => { console.error(error); });
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById('autocomplete_proveedor').value = ui.item.label;
            document.getElementById('autocomplete_proveedor_id').value = ui.item.value;
        }
    });
}

if(elementAreaRow) {
    $('#autocomplete_area_row').autocomplete({
        minLength: 1,
        source: ( request, response ) => {
            const strUrl = urls.search_area_row.replace('strSearch', request.term);
            const data = new FormData();
            data.append('csrfmiddlewaretoken', valCSRF);
            fetch(strUrl, { method: 'POST', body: data, })
            .then(response => response.json())
            .then( data => {
                response($.map(data, function (item) {
                    return { label: `${item.codigo_area} ${item.descripcion}`, value: item.codigo_area }
                }))
            })
            .catch((error) => { console.error(error); });
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById('autocomplete_area_row').value = ui.item.label;
            document.getElementById('autocomplete_area_row_id').value = ui.item.value;
        }
    });
}

if(elementSearchArea) {
    $('#autocomplete_area').autocomplete({
        minLength: 1,
        source: ( request, response ) => {
            const strUrl = urls.search_area.replace('strSearch', request.term);
            const data = new FormData();
            data.append('csrfmiddlewaretoken', valCSRF);
            fetch(strUrl, { method: 'POST', body: data, })
            .then(response => response.json())
            .then( data => {
                response($.map(data, function (item) {
                    return { label: `${item.codigo_area} ${item.descripcion}`, value: item.codigo_area }
                }))
            })
            .catch((error) => { console.error(error); });
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById('autocomplete_area').value = ui.item.label;
            document.getElementById('autocomplete_area_id').value = ui.item.value;
        }
    });
}

if(elementSearchP) {
    $('#autocomplete_empresa').autocomplete({
        minLength: 1,
        source: ( request, response ) => {
            const strUrl = urls.search_empresa.replace('strSearch', request.term);
            const data = new FormData();
            data.append('csrfmiddlewaretoken', valCSRF);
            fetch(strUrl, { method: 'POST', body: data, })
            .then(response => response.json())
            .then( data => {
                response($.map(data, function (item) {
                    return { label: `${item.codigo_empresa} ${item.nombre_empresa}`, value: item.codigo_empresa }
                }))
            })
            .catch((error) => { console.error(error); });
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById('autocomplete_empresa').value = ui.item.label;
            document.getElementById('autocomplete_empresa_id').value = ui.item.value;
        }
    });
}

function setObjGlobals(){
    objGlobalFCombustible = objGlobalExistCombustible;
    objGlobalF = objGlobalExistNormal;
    objGlobalE = objGlobalExistEspecial;
    objGlobalPC = objGlobalExistPC;

    drawTableCombustible();
    drawTableNormal();
    drawTableEspeciales();
    drawTablePC();
    drawTotalLiquidacion();
}

function drawFormSelected(strFormDraw, strButtonShow) {
    let forms = document.querySelectorAll('.contentFormF'),
        buttons = document.querySelectorAll('.btnOptionForm');

    forms.forEach((element) => {
        element.classList.add('no-show-form');
        element.classList.remove('show-form');
    });

    buttons.forEach((element) => {
        element.classList.add('btn-outline-primary');
        element.classList.remove('btn-primary');
    });

    let btn = document.getElementById(`${strButtonShow}`);
    btn.classList.remove('btn-outline-primary');
    btn.classList.add('btn-primary');

    let form = document.getElementById(`${strFormDraw}`);
    form.classList.remove('no-show-form');
    form.classList.add('show-form');
    clearElementsForm(document.getElementById('contentGlobalForms'));
}

function addFacturaNormal() {
    const boolCombustible = document.getElementById('combustible').checked;
    if(boolCombustible){
        addFacturaCombustible();
    }
    else {
        let prevTotal = (intTotalLiquidacionPrint * 1) + (document.getElementById('monto').value * 1);
        if (prevTotal <= intGlobalLimit){
            open_loading();
            let cuenta = document.getElementById('autocomplete_cuenta_contable_id').value,
                proveedor = document.getElementById('autocomplete_proveedor_id').value,
                strProveedor = document.getElementById('autocomplete_proveedor').value,
                orden_compra = document.getElementById('orden_compra').value,
                valor = document.getElementById('monto').value,
                subtotal = ((valor * 1) / 1.12).toFixed(2),
                iva = ((subtotal * 1) * 12 / 100).toFixed(2),
                fecha = document.getElementById('fecha').value,
                documento = document.getElementById('documento').value,
                descripcion = document.getElementById('descripcion').value,
                serie = document.getElementById('serie').value,
                area = '';
            if(boolEditRow){
                area = document.getElementById('autocomplete_area_row_id').value;
            }
            else {
                area = document.getElementById('autocomplete_area_id').value;
            }
            if (cuenta == '' || proveedor == '' || area == '' || fecha == '' || documento == '' || valor == '' || descripcion == '' || serie == ''){
                alert_nova.showNotification('Revisa tus campos por que tienes elementos vacios', "warning", "danger");
                close_loading();
            }
            else {
                objGlobalF.push({
                    'cuenta': cuenta,
                    'proveedor': proveedor,
                    'strProveedor': strProveedor,
                    'subtotal': subtotal,
                    'iva': iva,
                    'monto': valor,
                    'fecha': fecha,
                    'documento': documento,
                    'descripcion': descripcion,
                    'area': area,
                    'orden_compra': orden_compra,
                    'serie': serie,
                });
                drawTableNormal();
                close_loading();
                clearElementsForm(document.getElementById('contentGlobalForms'));
            }
        }
        else {
            alert_nova.showNotification('El monto que intentas ingresar exece tu limite en caja', "warning", "danger");
        }
    }
}

function addFacturaCombustible() {
    let prevTotal = (intTotalLiquidacionPrint * 1) + (document.getElementById('monto').value * 1);
    if (prevTotal <= intGlobalLimit){
        open_loading();
        let cuenta = document.getElementById('autocomplete_cuenta_contable_id').value,
            proveedor = document.getElementById('autocomplete_proveedor_id').value,
            strProveedor = document.getElementById('autocomplete_proveedor').value,
            orden_compra = document.getElementById('orden_compra').value,
            valor = document.getElementById('monto').value,
            iva = 0,
            subtotal = 0,
            fecha = document.getElementById('fecha').value,
            documento = document.getElementById('documento').value,
            descripcion = document.getElementById('descripcion').value,
            galones = document.getElementById('galones').value,
            combustible = document.getElementById('tipo_combustible').value,
            serie = document.getElementById('serie').value,
            idp = 0;
        let area = '';
        if(boolEditRow){
            area = document.getElementById('autocomplete_area_row_id').value;
        }
        else {
            area = document.getElementById('autocomplete_area_id').value;
        }
        if (cuenta == '' || proveedor == '' || area == '' || fecha == '' || documento == '' || valor == '' || descripcion == '' || galones == '' || (combustible == '' || combustible == '0') || serie == ''){
            alert_nova.showNotification('Revisa tus campos por que tienes elementos vacios', "warning", "danger");
            close_loading();
        }
        else {
            for(let k in objGlobalCombustible){
                let d = objGlobalCombustible[k];
                if(d.id == combustible){
                    idp = (galones * 1) * d.valor;
                }
            }
            subtotal = (valor * 1) - (idp * 1);
            subtotal = subtotal / 1.12;
            iva = subtotal * 12 / 100;
            let combustibleSelected = document.getElementById('tipo_combustible');
            let intCombustible = 0
            if(combustibleSelected){
                intCombustible = document.getElementById('tipo_combustible').value;
            }
            objGlobalFCombustible.push({
                'cuenta': cuenta,
                'proveedor': proveedor,
                'strProveedor': strProveedor,
                'subtotal': subtotal,
                'iva': iva,
                'monto': valor,
                'fecha': fecha,
                'documento': documento,
                'descripcion': descripcion,
                'galones': galones,
                'idp': idp,
                'valor_combustible': intCombustible,
                'area': area,
                'orden_compra': orden_compra,
                'serie': serie,
            });
            drawTableCombustible();
            close_loading();
            document.getElementById('contentOptionCombustible').innerHTML = '';
            clearElementsForm(document.getElementById('contentGlobalForms'));
        }
    }
    else {
        alert_nova.showNotification('El monto que intentas ingresar exece tu limite en caja', "warning", "danger");
    }
}

function addFacturaEspecial() {
    open_loading();
    let cuenta = document.getElementById('autocomplete_cuenta_contable_id').value,
        proveedor = document.getElementById('autocomplete_proveedor_id').value,
        strProveedor = document.getElementById('autocomplete_proveedor').value,
        orden_compra = document.getElementById('orden_compra').value,
        valor = document.getElementById('valor').value,
        iva = ((valor * 1) / 1.12 * 12 / 100).toFixed(2),
        isr = ((valor * 1) / 1.12 * 5 / 100).toFixed(2),
        porPagar = ((valor * 1) - iva - isr).toFixed(2),
        documento = document.getElementById('no_documento').value,
        descripcion = document.getElementById('descripcion_e').value,
        serie = document.getElementById('serie_e').value,
        area = '';
    if(boolEditRow){
        area = document.getElementById('autocomplete_area_row_id').value;
    }
    else {
        area = document.getElementById('autocomplete_area_id').value;
    }
    let prevTotal = (intTotalLiquidacionPrint * 1) + (porPagar * 1);
    if (prevTotal <= intGlobalLimit){
        if (cuenta == '' || proveedor == '' || area == '' || documento == '' || valor == '' || descripcion == '' || serie == ''){
            alert_nova.showNotification('Revisa tus campos por que tienes elementos vacios', "warning", "danger");
            close_loading();
        }
        else {
            objGlobalE.push({
                'cuenta': cuenta,
                'proveedor': proveedor,
                'strProveedor': strProveedor,
                'orden_compra': orden_compra,
                'valor': valor,
                'iva': iva,
                'isr': isr,
                'porPagar': porPagar,
                'documento': documento,
                'descripcion': descripcion,
                'area': area,
                'serie': serie,
            });
            drawTableEspeciales();
            close_loading();
            clearElementsForm(document.getElementById('contentGlobalForms'));
        }

    }
    else {
        close_loading();
        alert_nova.showNotification('El monto que intentas ingresar exece tu limite en caja', "warning", "danger");
    }
}

function addFacturaPC() {
    let prevTotal = (intTotalLiquidacionPrint * 1) + (document.getElementById('monto_pc').value * 1);
    if (prevTotal <= intGlobalLimit){
        open_loading();
        let cuenta = document.getElementById('autocomplete_cuenta_contable_id').value,
            proveedor = document.getElementById('autocomplete_proveedor_id').value,
            strProveedor = document.getElementById('autocomplete_proveedor').value,
            orden_compra = document.getElementById('orden_compra').value,
            valor = document.getElementById('monto_pc').value,
            fecha = document.getElementById('fecha_pc').value,
            documento = document.getElementById('no_documento_pc').value,
            descripcion = document.getElementById('descripcion_pc').value,
            serie = document.getElementById('serie_pc').value,
            area = '';
        if(boolEditRow){
            area = document.getElementById('autocomplete_area_row_id').value;
        }
        else {
            area = document.getElementById('autocomplete_area_id').value;
        }
        if (cuenta == '' || proveedor == '' || area == '' || documento == '' || valor == '' || descripcion == '' || serie == ''){
            alert_nova.showNotification('Revisa tus campos por que tienes elementos vacios', "warning", "danger");
            close_loading();
        }
        else {
            objGlobalPC.push({
                'cuenta': cuenta,
                'proveedor': proveedor,
                'strProveedor': strProveedor,
                'orden_compra': orden_compra,
                'monto': valor,
                'fecha': fecha,
                'documento': documento,
                'descripcion': descripcion,
                'area': area,
                'serie': serie,
            });
            drawTablePC();
            close_loading();
            clearElementsForm(document.getElementById('contentGlobalForms'));
        }
    }
    else {
        alert_nova.showNotification('El monto que intentas ingresar exece tu limite en caja', "warning", "danger");
    }
}

function drawTableNormal() {
    const content = document.getElementById('contentTableNormales');

    let details = '',
        subtotal = 0,
        subtotalIva = 0,
        subtotalMonto = 0;
    for(let k in objGlobalF){
        const data = objGlobalF[k];
        subtotal = (subtotal * 1) + (data.subtotal * 1);
        subtotalIva = (subtotalIva * 1) + (data.iva * 1);
        subtotalMonto = (subtotalMonto * 1) + (data.monto * 1);
        dsubtotal = (data.subtotal * 1).toFixed(2);
        diva = (data.iva * 1).toFixed(2);
        dmonto = (data.monto * 1).toFixed(2);
        orden_compra = (data.orden_compra !== 'None') ? data.orden_compra : '';

        let strButtonDelete = '',
            strElementsSave = '';
        if(typeof data.id !== 'undefined'){
            if(boolDoneEntregado !== 'True'){
                strButtonDelete = ` <button type="button" rel="tooltip" class="btn btn-just-icon btn-link btn-danger" data-original-title="Eliminar" onclick="deleteDetailExist('${data.id}', 'normal')">
                                        <i class="material-icons">delete_outline</i>
                                    </button>`;
            }
        }
        else {
            strButtonDelete = ` <button type="button" rel="tooltip" class="btn btn-just-icon btn-link btn-danger" data-original-title="Eliminar" onclick="deleteNormal('${k}')">
                                    <i class="material-icons">delete_outline</i>
                                </button>`;
            strElementsSave = ` <input type='hidden' name='arr_fn_cc[]' value='${data.cuenta}' />
                                <input type='hidden' name='arr_fn_proveedor[]' value='${data.proveedor}' />
                                <input type='hidden' name='arr_fn_subtotal[]' value='${dsubtotal}' />
                                <input type='hidden' name='arr_fn_iva[]' value='${diva}' />
                                <input type='hidden' name='arr_fn_monto[]' value='${dmonto}' />
                                <input type='hidden' name='arr_fn_fecha[]' value='${data.fecha}' />
                                <input type='hidden' name='arr_fn_documento[]' value='${data.documento}' />
                                <input type='hidden' name='arr_fn_area[]' value='${data.area}' />
                                <input type='hidden' name='arr_fn_serie[]' value='${data.serie}' />
                                <input type='hidden' name='arr_fn_descripcion[]' value='${data.descripcion}' />
                                <input type='hidden' name='arr_fn_orden_compra[]' value='${data.orden_compra}' />`;
        }

        details += `<tr>
                        <td> ${data.cuenta} </td>
                        <td> ${data.proveedor} </td>
                        <td> ${numberFormat.format(dsubtotal)} </td>
                        <td> ${numberFormat.format(diva)} </td>
                        <td> ${numberFormat.format(dmonto)} </td>
                        <td> ${data.fecha} </td>
                        <td> ${data.documento} </td>
                        <td> ${data.descripcion} </td>
                        <td> ${data.area} </td>
                        <td> ${orden_compra} </td>
                        <td>
                            ${strButtonDelete}
                            ${strElementsSave}
                        </td>
                    </tr>`
    }

    subtotal = (subtotal * 1).toFixed(2);
    subtotalIva = (subtotalIva * 1).toFixed(2);
    subtotalMonto = (subtotalMonto * 1).toFixed(2);
    const table = ` <div class='col-12'>
                        <h5><strong>Facturas de Contribuyentes Normales</strong></h5>
                    </div>
                    <div class='col-12'>
                        <table class='table'>
                            <thead>
                                <tr>
                                    <th>Cuenta Contable</th>
                                    <th>Proveedor</th>
                                    <th>Subtotal</th>
                                    <th>IVA</th>
                                    <th>Monto</th>
                                    <th>Fecha</th>
                                    <th>Documento</th>
                                    <th>Descripcion</th>
                                    <th>Area</th>
                                    <th>Orden de Compra</th>
                                    <th>Opciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${details}
                            </tbody>
                            <tfoot>
                                <tr class='trSubTotal'>
                                    <td colspan='2'><strong>SUB TOTAL</strong></td>
                                    <td><strong>${numberFormat.format(subtotal)}</strong></td>
                                    <td><strong>${numberFormat.format(subtotalIva)}</strong></td>
                                    <td><strong>${numberFormat.format(subtotalMonto)}</strong></td>
                                    <td colspan='8'></td>
                                </tr>
                                <tr class='trTotal'>
                                    <td colspan='2'><strong>TOTAL</strong></td>
                                    <td><strong>Q ${numberFormat.format(subtotalMonto)}</strong></td>
                                    <td colspan='8'></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>`;
    content.innerHTML = table;
    drawTotalLiquidacion();
}

function drawTableCombustible() {
    const content = document.getElementById('contentTableCombustible');
    let combustibleSelected = document.getElementById('tipo_combustible');
    let intCombustible = 0
    if(combustibleSelected){
        intCombustible = document.getElementById('tipo_combustible').value;
    }
    let details = '',
        subtotal = 0,
        subtotalIva = 0,
        subtotalMonto = 0,
        subtotalGalones = 0,
        subtotalIDP = 0;
    for(let k in objGlobalFCombustible){
        const data = objGlobalFCombustible[k];
        subtotal = (subtotal * 1) + (data.subtotal * 1);
        subtotalIva = (subtotalIva * 1) + (data.iva * 1);
        subtotalMonto = (subtotalMonto * 1) + (data.monto * 1);
        subtotalGalones = (subtotalGalones * 1) + (data.galones * 1);
        subtotalIDP = (subtotalIDP * 1) + (data.idp * 1);
        dsubtotal = (data.subtotal * 1).toFixed(2);
        diva = (data.iva * 1).toFixed(2);
        dmonto = (data.monto * 1).toFixed(2);
        dgalones = (data.galones * 1).toFixed(2);
        didp = (data.idp * 1).toFixed(2);
        orden_compra = (data.orden_compra !== 'None') ? data.orden_compra : '';

        let strButtonDelete = '',
            strElementsSave = '';
        if(typeof data.id !== 'undefined'){
            if(boolDoneEntregado !== 'True'){
                strButtonDelete = ` <button type="button" rel="tooltip" class="btn btn-just-icon btn-link btn-danger" data-original-title="Eliminar" onclick="deleteDetailExist('${data.id}', 'combustible')">
                                        <i class="material-icons">delete_outline</i>
                                    </button>`;
            }
        }
        else {
            strButtonDelete = ` <button type="button" rel="tooltip" class="btn btn-just-icon btn-link btn-danger" data-original-title="Eliminar" onclick="deleteCombustible('${k}')">
                                    <i class="material-icons">delete_outline</i>
                                </button>`;
            strElementsSave = ` <input type='hidden' name='arr_fc_cc[]' value='${data.cuenta}' />
                                <input type='hidden' name='arr_fc_proveedor[]' value='${data.proveedor}' />
                                <input type='hidden' name='arr_fc_subtotal[]' value='${dsubtotal}' />
                                <input type='hidden' name='arr_fc_iva[]' value='${diva}' />
                                <input type='hidden' name='arr_fc_monto[]' value='${dmonto}' />
                                <input type='hidden' name='arr_fc_fecha[]' value='${data.fecha}' />
                                <input type='hidden' name='arr_fc_documento[]' value='${data.documento}' />
                                <input type='hidden' name='arr_fc_descripcion[]' value='${data.descripcion}' />
                                <input type='hidden' name='arr_fc_galones[]' value='${dgalones}' />
                                <input type='hidden' name='arr_fc_idp[]' value='${didp}' />
                                <input type='hidden' name='arr_fc_area[]' value='${data.area}' />
                                <input type='hidden' name='arr_fc_serie[]' value='${data.serie}' />
                                <input type='hidden' name='arr_fc_combustible[]' value='${data.valor_combustible}' />
                                <input type='hidden' name='arr_fc_orden_compra[]' value='${data.orden_compra}' />`;
        }

        details += `<tr>
                        <td> ${data.cuenta} </td>
                        <td> ${data.proveedor} </td>
                        <td> ${numberFormat.format(dsubtotal)} </td>
                        <td> ${numberFormat.format(diva)} </td>
                        <td> ${numberFormat.format(dmonto)} </td>
                        <td> ${data.fecha} </td>
                        <td> ${data.documento} </td>
                        <td> ${data.descripcion} </td>
                        <td> ${dgalones} </td>
                        <td> ${didp} </td>
                        <td> ${data.area} </td>
                        <td> ${orden_compra} </td>
                        <td>
                            ${strButtonDelete}
                            ${strElementsSave}
                        </td>
                    </tr>`
    }

    subtotal = ((subtotal * 1) + (subtotalIDP * 1)).toFixed(2);
    subtotalIva = (subtotalIva * 1).toFixed(2);
    subtotalMonto = (subtotalMonto * 1).toFixed(2);
    subtotalGalones = (subtotalGalones * 1).toFixed(2);
    subtotalIDP = (subtotalIDP * 1).toFixed(2);
    const table = ` <div class='col-12'>
                        <h5><strong>Facturas de Combustible</strong></h5>
                    </div>
                    <div class='col-12'>
                        <table class='table'>
                            <thead>
                                <tr>
                                    <th>Cuenta Contable</th>
                                    <th>Proveedor</th>
                                    <th>Subtotal</th>
                                    <th>IVA</th>
                                    <th>Monto</th>
                                    <th>Fecha</th>
                                    <th>Documento</th>
                                    <th>Descripcion</th>
                                    <th>Galones</th>
                                    <th>IDP</th>
                                    <th>Area</th>
                                    <th>Orden de Compra</th>
                                    <th>Opciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${details}
                            </tbody>
                            <tfoot>
                                <tr class='trSubTotal'>
                                    <td colspan='2'><strong>SUB TOTAL</strong></td>
                                    <td><strong>${numberFormat.format(subtotal)}</strong></td>
                                    <td><strong>${numberFormat.format(subtotalIva)}</strong></td>
                                    <td><strong>${numberFormat.format(subtotalMonto)}</strong></td>
                                    <td colspan='3'></td>
                                    <td><strong>${subtotalGalones}</strong></td>
                                    <td><strong>${subtotalIDP}</strong></td>
                                    <td colspan='5'></td>
                                </tr>
                                <tr class='trTotal'>
                                    <td colspan='2'><strong>TOTAL</strong></td>
                                    <td><strong> Q ${numberFormat.format(subtotalMonto)}</strong></td>
                                    <td colspan='10'></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>`;
    content.innerHTML = table;
    drawTotalLiquidacion();
}

function drawTableEspeciales() {
    const content = document.getElementById('contentTableEspeciales');

    let details = '',
        totalPorPagar = 0,
        totalISR = 0,
        totalIVA = 0,
        totalValor = 0;
    for(let k in objGlobalE){
        const data = objGlobalE[k];
        totalPorPagar = (totalPorPagar * 1) + (data.porPagar * 1);
        totalIVA = (totalIVA * 1) + (data.iva * 1);
        totalISR = (totalISR * 1) + (data.isr * 1);
        totalValor = (totalValor * 1) + (data.valor * 1);
        orden_compra = (data.orden_compra !== 'None') ? data.orden_compra : '';
        let strButtonDelete = '',
            strElementsSave = '';
        if(typeof data.id !== 'undefined'){
            if(boolDoneEntregado !== 'True'){
                strButtonDelete = ` <button type="button" rel="tooltip" class="btn btn-just-icon btn-link btn-danger" data-original-title="Eliminar" onclick="deleteDetailExist('${data.id}', 'especial')">
                                        <i class="material-icons">delete_outline</i>
                                    </button>`;
            }
        }
        else {
            strButtonDelete = ` <button type="button" rel="tooltip" class="btn btn-just-icon btn-link btn-danger" data-original-title="Eliminar" onclick="deleteEspecial('${k}')">
                                    <i class="material-icons">delete_outline</i>
                                </button>`;
            strElementsSave = ` <input type='hidden' name='arr_fe_cc[]' value='${data.cuenta}' />
                                <input type='hidden' name='arr_fe_proveedor[]' value='${data.proveedor}' />
                                <input type='hidden' name='arr_fe_por_pagar[]' value='${data.porPagar}' />
                                <input type='hidden' name='arr_fe_iva[]' value='${data.iva}' />
                                <input type='hidden' name='arr_fe_isr[]' value='${data.isr}' />
                                <input type='hidden' name='arr_fe_valor[]' value='${data.valor}' />
                                <input type='hidden' name='arr_fe_documento[]' value='${data.documento}' />
                                <input type='hidden' name='arr_fe_area[]' value='${data.area}' />
                                <input type='hidden' name='arr_fe_serie[]' value='${data.serie}' />
                                <input type='hidden' name='arr_fe_descripcion[]' value='${data.descripcion}' />
                                <input type='hidden' name='arr_fe_orden_compra[]' value='${data.orden_compra}' />`;
        }
        details += `<tr>
                        <td> ${data.cuenta} </td>
                        <td> ${data.proveedor} </td>
                        <td> ${numberFormat.format(data.porPagar)} </td>
                        <td> ${numberFormat.format(data.iva)} </td>
                        <td> ${numberFormat.format(data.isr)} </td>
                        <td> ${numberFormat.format(data.valor)} </td>
                        <td> ${data.documento} </td>
                        <td> ${data.descripcion} </td>
                        <td> ${data.area} </td>
                        <td> ${orden_compra} </td>
                        <td>
                            ${strButtonDelete}
                            ${strElementsSave}
                        </td>
                    </tr>`
    }
    totalPorPagar = (totalPorPagar * 1).toFixed(2);
    totalISR = (totalISR * 1).toFixed(2);
    totalIVA = (totalIVA * 1).toFixed(2);
    totalValor = (totalValor * 1).toFixed(2);
    const table = ` <div class='col-12'>
                        <h5><strong>Facturas Especiales</strong></h5>
                    </div>
                    <div class='col-12'>
                        <table class='table'>
                            <thead>
                                <tr>
                                    <th>Cuenta Contable</th>
                                    <th>Proveedor</th>
                                    <th>Por Pagar</th>
                                    <th>IVA</th>
                                    <th>ISR</th>
                                    <th>Valor del Bien</th>
                                    <th>No de Documento</th>
                                    <th>Descripcion</th>
                                    <th>Area</th>
                                    <th>Orden de Compra</th>
                                    <th>Opciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${details}
                            </tbody>
                            <tfoot>
                                <tr class='trTotal'>
                                    <td colspan='2'><strong>TOTAL</strong></td>
                                    <td><strong>Q ${numberFormat.format(totalPorPagar)}</strong></td>
                                    <td><strong>Q ${numberFormat.format(totalIVA)}</strong></td>
                                    <td><strong>Q ${numberFormat.format(totalISR)}</strong></td>
                                    <td><strong>Q ${numberFormat.format(totalValor)}</strong></td>
                                    <td colspan='5'></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>`;
    content.innerHTML = table;
    drawTotalLiquidacion();
}

function drawTablePC() {
    const content = document.getElementById('contentTablePC');

    let details = '',
        total = 0;
    for(let k in objGlobalPC){
        const data = objGlobalPC[k];
        total = (total * 1) + (data.monto * 1);
        dmonto = (data.monto * 1).toFixed(2);
        orden_compra = (data.orden_compra !== 'None') ? data.orden_compra : '';
        let strButtonDelete = '',
            strElementsSave = '';
        if(typeof data.id !== 'undefined'){
            if(boolDoneEntregado !== 'True'){
                strButtonDelete = ` <button type="button" rel="tooltip" class="btn btn-just-icon btn-link btn-danger" data-original-title="Eliminar" onclick="deleteDetailExist('${data.id}', 'pc')">
                                        <i class="material-icons">delete_outline</i>
                                    </button>`;
            }
        }
        else {
            strButtonDelete = ` <button type="button" rel="tooltip" class="btn btn-just-icon btn-link btn-danger" data-original-title="Eliminar" onclick="deletePC('${k}')">
                                    <i class="material-icons">delete_outline</i>
                                </button>`;
            strElementsSave = ` <input type='hidden' name='arr_fpc_cc[]' value='${data.cuenta}' />
                                <input type='hidden' name='arr_fpc_proveedor[]' value='${data.proveedor}' />
                                <input type='hidden' name='arr_fpc_subtotal[]' value='${dmonto}' />
                                <input type='hidden' name='arr_fpc_fecha[]' value='${data.fecha}' />
                                <input type='hidden' name='arr_fpc_documento[]' value='${data.documento}' />
                                <input type='hidden' name='arr_fpc_descripcion[]' value='${data.descripcion}' />
                                <input type='hidden' name='arr_fpc_serie[]' value='${data.serie}' />
                                <input type='hidden' name='arr_fpc_area[]' value='${data.area}' />
                                <input type='hidden' name='arr_fpc_orden_compra[]' value='${data.orden_compra}' />`;
        }

        details += `<tr>
                        <td> ${data.cuenta} </td>
                        <td> ${data.proveedor} </td>
                        <td> ${numberFormat.format(dmonto)} </td>
                        <td> ${data.fecha} </td>
                        <td> ${data.documento} </td>
                        <td> ${data.descripcion} </td>
                        <td> ${data.area} </td>
                        <td> ${orden_compra} </td>
                        <td>
                            ${strButtonDelete}
                            ${strElementsSave}
                        </td>
                    </tr>`
    }
    total = (total * 1).toFixed(2);
    const table = ` <div class='col-12'>
                        <h5><strong>Facturas de Pequeños Contribuyentes</strong></h5>
                    </div>
                    <div class='col-12'>
                        <table class='table'>
                            <thead>
                                <tr>
                                    <th>Cuenta Contable</th>
                                    <th>Proveedor</th>
                                    <th>Subtotal</th>
                                    <th>Fecha</th>
                                    <th>Documento</th>
                                    <th>Descripcion</th>
                                    <th>Area</th>
                                    <th>Orden de Compra</th>
                                    <th>Opciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${details}
                            </tbody>
                            <tfoot>
                                <tr class='trTotal'>
                                    <td colspan='2'><strong>TOTAL</strong></td>
                                    <td><strong>Q ${numberFormat.format(total)}</strong></td>
                                    <td colspan='6'></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>`;
    content.innerHTML = table;
    drawTotalLiquidacion();
}

function deleteNormal(intKey){
    intKey = intKey * 1;
    delete objGlobalF[intKey];
    drawTableNormal();
}

function deleteCombustible(intKey){
    intKey = intKey * 1;
    delete objGlobalFCombustible[intKey];
    drawTableCombustible();
}

function deleteEspecial(intKey){
    intKey = intKey * 1;
    delete objGlobalE[intKey];
    drawTableEspeciales();
}

function deletePC(intKey){
    intKey = intKey * 1;
    delete objGlobalPC[intKey];
    drawTablePC();
}

function showOptionsCombustible(){
    const boolShow = document.getElementById('combustible').checked,
          content = document.getElementById('contentOptionCombustible');
    if(boolShow) {
        let optionsCombustible = '';

        for(let k in objGlobalCombustible){
            const data = objGlobalCombustible[k];
            optionsCombustible += ` <option value='${data.id}'> ${data.descripcion} </option>`;
        }

        content.innerHTML = `   <div class='col-12 col-md-6'>
                                    <div class="form-group">
                                        <label for="galones" class="bmd-label-floating">Galones</label>
                                        <input type="number" class="form-control" id="galones" name="galones">
                                    </div>
                                </div>
                                <div class='col-12 col-md-6'>
                                    <select name="tipo_combustible" id="tipo_combustible" class="form-control">
                                        <option value="0" selected>Selecciona combustible</option>
                                        ${optionsCombustible}
                                    </select>
                                </div>`;
    }
    else {
        content.innerHTML = '';
    }
}

function drawTotalLiquidacion() {
    intTotalLiquidacion = 0;
    let objPoliza = [],
        totalIvaCombustible = 0,
        totalIvaCreditoFiscal = 0,
        totalIvaIsrFEspecial = 0,
        totalIvaF = 0,
        totalDebe = 0,
        totalHaber = 0;

    for(let k in objGlobalFCombustible){
        const d = objGlobalFCombustible[k];
        if(typeof d.monto !== 'undefined'){
            let dsubtotal = (d.subtotal * 1),
                didp = (d.idp * 1),
                diva = (d.iva * 1);
            intTotalLiquidacion = (intTotalLiquidacion * 1) + (d.monto * 1);
            totalIvaCombustible = (diva * 1) + (totalIvaCombustible * 1);
            let prevtotal = (dsubtotal * 1) + (didp);
            totalDebe = (prevtotal * 1) + (totalDebe * 1);
            strProveedor = (typeof d.strProveedor !== 'undefined') ? d.strProveedor : d.proveedor;
            objPoliza.push({
                'cuenta': d.cuenta,
                'proveedor': strProveedor,
                'debe': prevtotal,
                'haber': 0,
                'descripcion': d.descripcion,
                'area': d.area,
                'orden_compra': d.orden_compra,
            });
        }
    }

    let area = document.getElementById('autocomplete_area_id').value;
    if(totalIvaCombustible > 0){
        totalDebe = (totalDebe * 1) + (totalIvaCombustible * 1);
        objPoliza.push({
            'cuenta': '1120301',
            'proveedor': 'Iva credito fiscal',
            'debe': totalIvaCombustible,
            'haber': 0,
            'descripcion': 'Iva credito fiscal caja chica',
            'area': area,
            'orden_compra': '',
        });
    }

    for(let k in objGlobalF){
        const d = objGlobalF[k];
        if(typeof d.monto !== 'undefined'){
            intTotalLiquidacion = (intTotalLiquidacion * 1) + (d.monto * 1);
            let dmonto = (d.monto * 1).toFixed(2),
                diva = (d.iva * 1).toFixed(2),
                totDebe = (dmonto * 1) - (diva * 1);
            totalIvaF = (totalIvaF * 1) + (diva * 1);
            totalDebe = (totDebe * 1) + (totalDebe * 1);
            objPoliza.push({
                'cuenta': d.cuenta,
                'proveedor': d.proveedor,
                'debe': totDebe,
                'haber': 0,
                'descripcion': d.descripcion,
                'area': d.area,
                'orden_compra': d.orden_compra,
            });
        }
    }
    if(totalIvaF > 0){
        totalDebe = (totalDebe * 1) + (totalIvaF * 1);
        objPoliza.push({
            'cuenta': '1120301',
            'proveedor': 'Iva credito fiscal',
            'debe': totalIvaF,
            'haber': 0,
            'descripcion': 'Iva credito fiscal caja chica',
            'area': area,
            'orden_compra': ''
        });
    }

    for(let k in objGlobalE){
        const d = objGlobalE[k];
        if(typeof d.porPagar !== 'undefined'){
            intTotalLiquidacion = (intTotalLiquidacion * 1) + (d.porPagar * 1);
            let dsubtotal = (d.porPagar * 1),
                disr = (d.isr * 1),
                diva = (d.iva * 1);
            totalIvaCreditoFiscal = (diva * 1) + (totalIvaCreditoFiscal * 1);
            totalIvaIsrFEspecial = ( (disr * 1) + (diva * 1) ) + (totalIvaIsrFEspecial);
            let prevtotal = (dsubtotal * 1) + (disr);
            totalDebe = (prevtotal * 1) + (totalDebe * 1);
            strProveedor = (typeof d.strProveedor !== 'undefined') ? d.strProveedor : d.proveedor;
            objPoliza.push({
                'cuenta': d.cuenta,
                'proveedor': strProveedor,
                'debe': prevtotal,
                'haber': 0,
                'descripcion': d.descripcion,
                'area': d.area,
                'orden_compra': d.orden_compra,
            });
        }
    }
    if(totalIvaCreditoFiscal > 0){
        totalDebe = (totalDebe * 1) + (totalIvaCreditoFiscal * 1);
        objPoliza.push({
            'cuenta': '1120301',
            'proveedor': 'Iva credito fiscal',
            'debe': totalIvaCreditoFiscal,
            'haber': 0,
            'descripcion': 'Iva credito fiscal caja chica',
            'area': area,
            'orden_compra': '',
        });

        totalHaber = (totalHaber * 1) + (totalIvaIsrFEspecial * 1);
        objPoliza.push({
            'cuenta': '2130104',
            'proveedor': 'Iva e isr factura especial',
            'debe': 0,
            'haber': totalIvaIsrFEspecial,
            'descripcion': 'Iva e isr factura especial caja chica',
            'area': area,
            'orden_compra': '',
        });
    }

    for(let k in objGlobalPC){
        const d = objGlobalPC[k];
        if(typeof d.monto !== 'undefined'){
            intTotalLiquidacion = (intTotalLiquidacion * 1) + (d.monto * 1);
            let dmonto = (d.monto * 1);
            totalDebe = (totalDebe * 1) + (dmonto * 1);
            strProveedor = (typeof d.strProveedor !== 'undefined') ? d.strProveedor : d.proveedor;
            objPoliza.push({
                'cuenta': d.cuenta,
                'proveedor': strProveedor,
                'debe': dmonto,
                'haber': 0,
                'descripcion': d.descripcion,
                'area': d.area,
                'orden_compra': d.orden_compra,
            });
        }
    }
    intTotalLiquidacionPrint = intTotalLiquidacion.toFixed(2);

    let strAreaCaja = (objGlobalDetailExist !== 'undefined' && objGlobalDetailExist?.area) ? objGlobalDetailExist.area : '';
    if(totalDebe > 0){
        objPoliza.push({
            'cuenta': '2120101',
            'proveedor': 'Provision mensual de gastos',
            'debe': 0,
            'haber': ((totalDebe * 1) - (totalHaber * 1)),
            'descripcion': `Liquidacion de gastos de caja chica ${strAreaCaja}`,
            'area': area,
            'orden_compra': ''
        });
    }

    const content = document.getElementById('contentTotalLiquidacion');
    content.innerHTML = `   <div class='col-12 col-md-4 offset-md-4 strCenter bg-info text-white strTotalGlobal'>
                                <input type='hidden' name='saldo_final' value='${intTotalLiquidacion}' />
                                <h3>Total de la Liquidación <strong>Q ${numberFormat.format(intTotalLiquidacionPrint)}</strong> </h3>
                            </div>`;

    if(intTotalLiquidacion > 0){
        const content = document.getElementById('contentTablePoliza');
        if(content){
            drawFormPoliza(objPoliza, content);
        }
    }
}

function drawFormPoliza(objPoliza, content){
    let detail = '',
        foot = '',
        totalDebe = 0,
        totalHaber = 0;
    for(let k in objPoliza){
        const d = objPoliza[k];
        totalDebe = (d.debe * 1) + (totalDebe * 1);
        totalHaber = (d.haber * 1) + (totalHaber * 1);
        let ddebe = (d.debe * 1).toFixed(2);
        let dhaber = (d.haber * 1).toFixed(2);
        detail += `  <tr>
                        <td>${d.cuenta}</td>
                        <td>${d.proveedor}</td>
                        <td>${numberFormat.format(ddebe)}</td>
                        <td>${numberFormat.format(dhaber)}</td>
                        <td>${d.descripcion}</td>
                        <td>${d.area}</td>
                        <td>${d.orden_compra}</td>
                    </tr>`;
    }
    totalDebe = (totalDebe * 1).toFixed(2);
    totalHaber = (totalHaber * 1).toFixed(2);
    foot = `<tr class='trTotal'>
                <td colspan='2'></td>
                <td>Q ${numberFormat.format(totalDebe)}</td>
                <td>Q ${numberFormat.format(totalHaber)}</td>
                <td colspan='3'></td>
            </tr>`;
    content.innerHTML = `   <table class='table'>
                                <thead>
                                    <tr>
                                        <th>Cuenta Contable</th>
                                        <th>Proveedor</th>
                                        <th>Debe</th>
                                        <th>Haber</th>
                                        <th>Descripcion</th>
                                        <th>Area</th>
                                        <th>Orden de Compra</th>
                                    </tr>
                                </thead>
                                <tbody>${detail}</tbody>
                                <tfoot>${foot}</tfoot>
                            </table>`;
}

function sendFormSave() {
    open_loading();
    const formElement = document.getElementById("frm_facturas");
    let form = new FormData(formElement)

    fetch(`${urls.save_cajachica}`, {
        method: 'POST',
        body: form
    })
    .then(response => response.json())
    .then( (data) => {
        close_loading();
        if (data[0].status) {
            let id = data[0].caja;
            alert_nova.showNotification(`Guardado correctamente con correlativo ${id}`, "add_alert", "success");
            setTimeout(() => {
                window.location.reload();
            }, 1000 );
        }
        else {
            alert_nova.showNotification(data[0].error, "warning", "danger");
        }
    })
    .catch((error) => {
        close_loading();
        console.error(error);
    });
}

function sendFormPrintResume() {
    let objResume = [
        { 'name': 'resumen' },
    ];
    if(boolViewResume == 'True'){
        objResume.push({ 'name': 'poliza' });
    }
    for(let k in objResume){
        const data = objResume[k];
        document.getElementById('contentFormPrint').innerHTML = `   <input type='hidden' name='caja' value='${objGlobalDetailExist.id}' />
                                                                    <input type='hidden' name='impresion' value='${data.name}' />`;
        document.getElementById('formRpt').submit();
    }
}

function deleteDetailExist(idDetailExist, strTable) {
    let formData = new FormData();
    formData.append('tabla', strTable);
    formData.append('id', idDetailExist);
    fetch(`${urls.delete_detail}`, {
        method: 'POST',
        headers: { "X-CSRFToken": valCSRF },
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if(data[0].status){
            window.location.reload();
        }
    })
    .catch(error => console.error(error) )
}

function sendFormEdit() {
    open_loading();
    const formElement = document.getElementById("frm_facturas");
    let form = new FormData(formElement)
    fetch(`${urls.edit_cajachica}`, {
        method: 'POST',
        body: form
    })
    .then(response => response.json())
    .then( (data) => {
        close_loading();
        if (data[0].status) {
            let id = data[0].caja;
            alert_nova.showNotification(`Guardado correctamente con correlativo ${id}`, "add_alert", "success");
            setTimeout(() => {
                sendFormPrintResume();
                setTimeout(()=>{
                    window.location.reload();
                }, 4000);
            }, 1000 );
        }
        else {
            alert_nova.showNotification('Ocurrió un error, revisa tu información y que todos los campos estén completos', "warning", "danger");
        }
    })
    .catch((error) => {
        close_loading();
        console.error(error);
    });
}

function setFunctionsSave() {
    if(typeof objGlobalDetailExist !== 'undefined' && Object.keys(objGlobalDetailExist).length > 0 && objGlobalDetailExist?.id){
        const btnSave = document.getElementById('btnUpdate'),
              btnApprove = document.getElementById('btnApprove'),
              btnDenied = document.getElementById('btnDenied');
        if(btnSave){
            btnSave.addEventListener('click', ()=> {
                dialogConfirm(sendFormEdit);
            });
        }
        if(btnApprove) {
            btnApprove.addEventListener('click', () => {
                dialogConfirm(sendApproved);
            });
        }
        if(btnDenied) {
            btnDenied.addEventListener('click', () => {
                dialogConfirm(sendDenied);
            });
        }
    }
    else {
        const btnSave = document.getElementById('btnSave');
        if(btnSave){
            if(!boolGlobalSend){
                boolGlobalSend = true;
                btnSave.addEventListener('click', ()=> {
                    dialogConfirm(sendFormSave);
                });
            }
        }

    }
}

function sendApproved() {
    formSendApproved(true);
}

function sendDenied() {
    formSendApproved(false);
}

function formSendApproved(boolApproved) {
    let formData = new FormData();
    formData.append('id', objGlobalDetailExist.id);
    formData.append('approved', boolApproved);
    formData.append('csrfmiddlewaretoken', valCSRF);
    fetch(`${urls.approved_cajachica}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        close_loading();
        if(data[0].status){
            alert_nova.showNotification(`${data[0].msj}`, "add_alert", "success");
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
        else {
            alert_nova.showNotification('Ocurrió un error, contacta con soporte', "warning", "danger");
        }
    })
    .catch(error => {console.error(error)});
}