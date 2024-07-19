function select_bodega(intBodega, objButton) {

    const objCheckbox = document.getElementById('bodega_' + intBodega);
    const chequedo = document.querySelector(`input[name="bodega[]"]:checked`);

    if (chequedo && chequedo !== objCheckbox) {
        select_bodega(chequedo.value, document.getElementById('button_' + chequedo.value));
        get_contenedores();
    }

    if (objCheckbox.checked) {
        objCheckbox.checked = false;
        objButton.classList.remove('btn-primary');
        objButton.classList.add('btn-white')
    }
    else {
        objCheckbox.checked = true;
        objButton.classList.remove('btn-white')
        objButton.classList.add('btn-primary');
    }

}

function get_contenedores() {

    const objCheckbox = document.querySelector(`input[name="bodega[]"]:checked`);
    const divTablero = document.getElementById('divTablero');
    const divAgregar = document.getElementById('divAgregar');

    if (objCheckbox) {

        open_loading();
        const formElement = document.getElementById("frm_contenderes");
        const form = new FormData(formElement);

        fetch(strUrlGetContenedores, {
            method: 'POST',
            body: form
        })
        .then(response => response.json())
        .then( (data) => {

            close_loading();

            let boolFirst = true;
            let intBodega = 0;
            let intRow = 1;
            let intContador = 1;
            let strTable = '';
            let boolCerrado = false;
            for (let key in data.contenedores) {

                const arrContenedores = data.contenedores[key];
                //
                if (arrContenedores.cerrado) {
                    boolCerrado = true;
                //     document.getElementById('btnSave').style.display = 'none';
                //     document.getElementById('btnCerrarBodega').style.display = 'none';
                }

                if (!boolFirst && intBodega !== arrContenedores.NoBodega) {

                    strTable += `
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th>${arrContenedores.Bodega}</th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                    `;

                    intBodega = arrContenedores.NoBodega;

                }

                if (boolFirst) {

                    strTable += `
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>No.</th>
                                    <th></th>
                                    <th>Fecha/Ven.</th>
                                    <th>Contenedor</th>
                                    <th>Codigo</th>
                                    <th>Producto</th>
                                    <th>Embarque</th>
                                    <th>Ing. Ferro Sur</th>
                                    <th>Temp.</th>
                                    <th>Gls. Utilizados</th>
                                    <th>Observación</th>
                                    <th>Planta</th>
                                </tr>
                            </thead>
                            <tbody id="tbodyContenido">
                    `;

                    boolFirst = false;
                    intBodega = arrContenedores.NoBodega;

                }

                const strSelectedAlta = (arrContenedores.planta === "alta")? "selected" : "";
                const strSelectedBaja = (arrContenedores.planta === "baja")? "selected" : "";
                const strSelectedSin = (arrContenedores.planta === "sin")? "selected" : "";
                const Embarque = arrContenedores.Embarque;
                let strFechaEmbarque = '';
                let strEmbarque = '';

                if (Embarque !== null && Embarque !== '') {
                    strFechaEmbarque = Embarque.substr(0, 4) + '-' + Embarque.substr(4, 2) + '-' + Embarque.substr(6, 2);
                    strEmbarque = Embarque.substr(6, 2) + '/' + Embarque.substr(4, 2) + '/' + Embarque.substr(0, 4);
                }

                const strDisplay = (arrContenedores.activo)? '' : 'none';
                const boolActivo = (arrContenedores.activo)? 1 : 0;
                const arrSplit = arrContenedores.FechaVencimiento.split('-');
                const strFechaVencimiento = `${arrSplit[2]}/${arrSplit[1]}/${arrSplit[0]}`;
                const strReadonly = (boolCerrado)? "readonly" : "";

                const strButtonDelete = (boolCerrado)? '' : `
                    <button type="button" class="btn btn-link btn-just-icon btn-danger" rel="tooltip" data-original-title="Eliminar" onclick="eliminar_fila(${intRow});">
                        <span class="material-icons">delete</span>
                    </button>
                `;

                strTable += `
                    <tr style="display: ${strDisplay};" onclick="click_fila(this);">
                        <td style="border: solid black 1px;">
                            ${strButtonDelete}
                        </td>
                        <td style="border: solid black 1px;">
                            ${intContador}
                            <input type="hidden" name="detalle_bodega[]" value="${arrContenedores.NoBodega}">
                            <input type="hidden" name="activo[]" value="${boolActivo}" data-activo="${intRow}" id="activo_${intRow}">
                        </td>
                        <td style="border: solid black 1px;">
                            <input type="color" list="colors_${intRow}" name="color[]" value="${arrContenedores.color}" ${strReadonly}/>
                            <datalist id="colors_${intRow}">
                                <option>#00ff00</option>
                                <option>#ffff00</option>
                                <option>#ff0000</option>
                                <option>#0000ff</option>
                            </datalist>
                        </td>
                        <td style="border: solid black 1px;">
                            ${strFechaVencimiento}
                            <input type="date" name="fecha_vencimiento[]" style="display: none;" value="${arrContenedores.fecha_vencimiento}" class="form-control" ${strReadonly}>
                        </td>
                        <td style="border: solid black 1px;">
                            ${arrContenedores.Contenedor}
                            <input type="text" name="contenedor[]" style="display: none;" value="${arrContenedores.Contenedor}" ${strReadonly}>
                        </td>
                        <td style="border: solid black 1px;">
                            ${arrContenedores.Codigo}
                            <input type="text" name="codigo[]" style="display: none;" value="${arrContenedores.Codigo}" ${strReadonly}>
                        </td>
                        <td style="border: solid black 1px;">
                            ${arrContenedores.Producto}
                        </td>
                        <td style="border: solid black 1px;">
                            <input type="date" name="fecha_embarque[]" value="${strFechaEmbarque}" class="form-control" ${strReadonly}>
                        </td>
                        <td style="border: solid black 1px;">
                            <input type="date" name="fecha_ing_ferro_sur[]" id="fecha_ing_${arrContenedores.detalle_id}" value="${arrContenedores.fecha_ing_ferro_sur}" class="form-control" ${strReadonly}>
                        </td>
                        <td style="border: solid black 1px;">
                            <input type="number" name="temperatura[]" class="form-control" value="${arrContenedores.temperatura}" onkeydown="solo_enteros(event);" ${strReadonly}>
                        </td>
                        <td style="border: solid black 1px;">
                            <input type="number" name="gls_utilizados[]" class="form-control" value="${arrContenedores.gls_utilizados}" onkeydown="solo_enteros(event);" ${strReadonly}>
                        </td>
                        <td style="border: solid black 1px;">
                            <textarea class="form-control" name="observacion[]" ${strReadonly}>${arrContenedores.observaciones}</textarea>
                        </td>
                        <td style="border: solid black 1px;">
                            <select class="form-control" name="planta[]" ${strReadonly}>
                                <option value="alta" ${strSelectedAlta}>Alta</option>
                                <option value="baja" ${strSelectedBaja}>Baja</option>
                                <option value="sin" ${strSelectedSin}>Sin</option>
                            </select>
                        </td>
                    </tr>
                `;

                if (arrContenedores.activo) intContador++;
                intRow++;

            }

            strTable += `
                    </tbody>
                </table>
            `;

            if (!boolFirst) {
                divTablero.innerHTML = strTable;
                if (!boolCerrado) divAgregar.style.display = '';

                document.getElementById('divBotones').innerHTML = `
                    <div class="row" style="margin-top: 25px; margin-bottom: 25px;">
                        <div class="col-12 text-center">
                            <button type="button" class="btn btn-outline-success" id="btnSave" onclick="validate_datos(false);">
                                <span class="material-icons">save</span>Guardar
                            </button>
    
                            <button type="button" class="btn btn-outline-info" id="btnCerrarBodega" onclick="validate_datos(true);">
                                <span class="material-icons">https</span>Cerrar bodega
                            </button>
    
                            <button type="button" class="btn btn-outline-warning" id="btnCerrarDia" onclick="dialogConfirm(send_email);">
                                <span class="material-icons">email</span>Enviar email
                            </button>
                        </div>
                    </div>
                `;

                if (boolCerrado) {
                    document.getElementById('btnSave').style.display = 'none';
                    document.getElementById('btnCerrarBodega').style.display = 'none';
                }

            }
            else {
                document.getElementById('divBotones').innerHTML = '';
            }

        })
        .catch((error) => {

            close_loading();
            console.error(error);
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");

        });

    }
    else {

        divTablero.innerHTML = '';
        divAgregar.style.display = 'none';

    }

}

function validate_datos(boolCerrar) {

    const objFechaVencimiento = document.querySelectorAll('input[name="fecha_vencimiento[]"]');
    const objFechaEmbarque = document.querySelectorAll('input[name="fecha_embarque[]"]');
    const objFechaIngFerroSur = document.querySelectorAll('input[name="fecha_ing_ferro_sur[]"]');
    const objContenedor = document.querySelectorAll('input[name="contenedor[]"]');
    const objCodigo = document.querySelectorAll('input[name="codigo[]"]');
    let boolError = false;

    if (objFechaVencimiento) {

        let intRow = 0;
        objFechaVencimiento.forEach(fecha_vencimiento => {

            // const boolNew = fecha_vencimiento.getAttribute('data-nuevo');

            // if (boolNew) {

            if (objFechaEmbarque[intRow].value === '') {
                objFechaEmbarque[intRow].style.display = '';
            }
            else {
                objFechaEmbarque[intRow].style.display = 'none';
            }

            if (fecha_vencimiento.value === '' || objFechaEmbarque[intRow].value === '' || objFechaIngFerroSur[intRow].value === ''
                || objContenedor[intRow].value === '' || objCodigo[intRow].value === '') {
                fecha_vencimiento.style.background = '#f44336';
                objFechaEmbarque[intRow].style.background = '#f44336';
                objFechaIngFerroSur[intRow].style.background = '#f44336';
                objContenedor[intRow].style.background = '#f44336';
                objCodigo[intRow].style.background = '#f44336';
                boolError = true;
            }
            else {
                fecha_vencimiento.style.background = '';
                objFechaEmbarque[intRow].style.background = '';
                objFechaIngFerroSur[intRow].style.background = '';
                objContenedor[intRow].style.background = '';
                objCodigo[intRow].style.background = '';
            }

            // }

            intRow++;
        });

        if (boolError) {
            alert_nova.showNotification("Debe ingresar llenar los campos marcados.", "warning", "danger");
            return false;
        }
        else {
            if (boolCerrar) {
                dialogConfirm(cerrar_contenedores);
            }
            else {
                dialogConfirm(save_contenedores);
            }
        }
    }

}

function save_contenedores() {

    open_loading();
    const formElement = document.getElementById("frm_contenderes");
    const form = new FormData(formElement);

    fetch(strUrlSaveContenedores, {
        method: 'POST',
        body: form
    })
    .then(response => response.json())
    .then( (data) => {

        close_loading();

        if (data.status) {
            alert_nova.showNotification("Registros grabados.", "add_alert", "success");
            get_contenedores();
        }

    })
    .catch((error) => {

        close_loading();
        alert_nova.showNotification("Ocurrió un error al grabar los registros, intente nuevamente, si continua comuníquese con IT.", "warning", "danger");
        console.error(error);

    });

}

function cerrar_contenedores() {

    open_loading();
    const formElement = document.getElementById("frm_contenderes");
    const form = new FormData(formElement);
    form.append('bool_cerrar', true);

    fetch(strUrlCerrarContenedores, {
        method: 'POST',
        body: form
    })
    .then(response => response.json())
    .then( (data) => {

        close_loading();

        if (data.status) {
            alert_nova.showNotification("Registros cerrados.", "add_alert", "success");
            window.location = strUrlRedirection;
        }

    })
    .catch((error) => {

        close_loading();
        alert_nova.showNotification("Ocurrió un error al cerrar los registros, intente nuevamente, si continua comuníquese con IT.", "warning", "danger");
        console.error(error);

    });

}

function eliminar_fila(intRow) {

    const objActivo = document.getElementById('activo_' + intRow);
    objActivo.value = 0;
    $('#activo_' + intRow).parent().parent().css({
        "display": "none"
    });

}

function agregar_fila() {
    const objContenido = document.getElementById('tbodyContenido');

    if (objContenido) {
        const objActivos = document.querySelectorAll(`input[name="activo[]"]`);

        let intRow = 1;
        objActivos.forEach(element => {
            const intTMPRow = element.getAttribute('data-activo') * 1;
            if (intTMPRow >= intRow) {
                intRow = intTMPRow + 1;
            }
        });

        const chequedo = document.querySelector(`input[name="bodega[]"]:checked`);

        objContenido.innerHTML += `
            <tr onclick="click_fila(this);">
                <td style="border: solid black 1px;">
                    <button type="button" class="btn btn-link btn-just-icon btn-danger" rel="tooltip" data-original-title="Eliminar" onclick="eliminar_fila(${intRow});">
                        <span class="material-icons">delete</span>
                    </button>
                </td>
                <td style="border: solid black 1px;">
                    ${intRow}
                    <input type="hidden" name="detalle_bodega[]" value="${chequedo.value}">
                    <input type="hidden" name="activo[]" value="1" data-activo="${intRow}" id="activo_${intRow}">
                </td>
                <td style="border: solid black 1px;">
                    <input type="color" list="colors_${intRow}" name="color[]">
                    <datalist id="colors_${intRow}">
                        <option>#00ff00</option>
                        <option>#ffff00</option>
                        <option>#ff0000</option>
                    </datalist>
                </td>
                <td style="border: solid black 1px;">
                    <input type="date" name="fecha_vencimiento[]" class="form-control" data-nuevo="1">
                </td>
                <td style="border: solid black 1px;">
                    <input type="text" name="contenedor[]" class="form-control">
                </td>
                <td style="border: solid black 1px;">
                    <input type="text" name="codigo[]" class="form-control">
                </td>
                <td style="border: solid black 1px;">
                    
                </td>
                <td style="border: solid black 1px;">
                    <input type="date" name="fecha_embarque[]" class="form-control">
                </td>
                <td style="border: solid black 1px;">
                    <input type="date" name="fecha_ing_ferro_sur[]" class="form-control">
                </td>
                <td style="border: solid black 1px;">
                    <input type="number" name="temperatura[]" class="form-control" onkeydown="solo_enteros(event);">
                </td>
                <td style="border: solid black 1px;">
                    <input type="number" name="gls_utilizados[]" class="form-control" onkeydown="solo_enteros(event);">
                </td>
                <td style="border: solid black 1px;">
                    <textarea class="form-control" name="observacion[]"></textarea>
                </td>
                <td style="border: solid black 1px;">
                    <select class="form-control" name="planta[]">
                        <option value="alta">Alta</option>
                        <option value="baja">Baja</option>
                        <option value="sin">Sin</option>
                    </select>
                </td>
            </tr>
        `;

    }

}

function click_fila(objFila) {
    const objClicks = document.querySelectorAll('tr[data-click="1"]');

    objClicks.forEach(element => {
       element.removeAttribute('data-click');
       element.style.background = '';
    });

    objFila.setAttribute('data-click', 1);
    objFila.style.background = '#00bcd4';

}

function send_email() {

    open_loading();
    const formElement = document.getElementById("frm_contenderes");
    const form = new FormData(formElement);

    fetch(strUrlSendEmail, {
        method: 'POST',
        body: form
    })
    .then(response => response.json())
    .then( (data) => {

        close_loading();

        if (data.status) {
            alert_nova.showNotification("Email enviado.", "add_alert", "success");
            window.location = strUrlRedirection;
        }

    })
    .catch((error) => {

        close_loading();
        alert_nova.showNotification("Ocurrió un error al cerrar los registros, intente nuevamente, si continua comuníquese con IT.", "warning", "danger");
        console.error(error);

    });

}
