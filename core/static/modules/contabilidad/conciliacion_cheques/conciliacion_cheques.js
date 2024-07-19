let btnSearch = document.getElementById('searchBySheet'),
    intGlobalRelacion = 1,
    intTotalGlobalMov = intTotalGlobalExcel = intSaldoInicial = 0,
    boolGlobalComparado = boolGlobalDataLoaded = strTMP = objTMP = false,
    objGlobalDocument = objGlobalInfoDocument = objGlobalMovEncabezados = objGlobalCuentasEstados = objGlobalExcelNoProcesado = objGlobalReportes = {},
    objGlobalSisTotalesRpt = {10: 0, 20: 0, 30: 0, 40: 0, 50: 0, 60: 0, 70: 0, 80: 0},
    objGlobalExcelTotalesRpt = {10: 0, 20: 0, 30: 0, 40: 0, 50: 0, 60: 0, 70: 0, 80: 0},
    objDuplicates = [];

const elementSearchCuenta = document.getElementById('autocomplete_cuenta'),
    elementHiddenCuenta = document.getElementById('cuenta'),
    objReportes = [
        { 'name': 'circulacion', },
        { 'name': 'anulado', },
        { 'name': 'dep_banco', },
        { 'name': 'dep_conta', },
        { 'name': 'nc_banco', },
        { 'name': 'nc_conta', },
        { 'name': 'nd_banco', },
        { 'name': 'nd_conta', },
        { 'name': 'dep_anulado', },
    ];

if(elementSearchCuenta) {
    $(elementSearchCuenta).autocomplete({
        minLength: 1,
        source: ( request, response ) => {
            open_loading();
            let csrftoken = getCookie('csrftoken');
            strUrlFetch = strUrlGetCuenta.replace('search', request.term);
            let formData = new FormData();
            formData.append('conta', document.getElementById('conta').value);
            fetch(`${strUrlFetch}`, {
                method: 'POST',
                headers: { "X-CSRFToken": csrftoken },
                body: formData,
            })
            .then(response => response.json())
            .then( data => {
                close_loading();
                response($.map(data, function (item) {
                    return {
                        label: item.name,
                        value: item.id
                    }
                }))
            })
            .catch((error) => {
                close_loading();
                console.error(error);
            });
        },
        select: function( event, ui ) {
            event.preventDefault();
            elementSearchCuenta.value = ui.item.label;
            elementHiddenCuenta.value = ui.item.value;
        }
    })
    .focus(function () {
        elementSearchCuenta.value = '';
        elementHiddenCuenta.value = '';
    });
}

document.getElementById('uploadFile').addEventListener('change', handleFileSelect, false);

document.getElementById('btnGetMovEncabezado').addEventListener('click', getMovEncabezado);

document.getElementById('btnComparar').addEventListener('click', processCodigoMovimiento);

document.getElementById('btnSugerencia').addEventListener('click', () => {
    if(boolGlobalComparado)
        makeSugerencia();
    else
        alert_nova.showNotification("Tienes que haber comparado previamente.", "warning", "danger");
});

document.getElementById('conta').addEventListener('change', () => clearInfo);

document.getElementById('btnShowConciliacion').addEventListener('click', resumenConciliacion);

btnSearch.addEventListener('click', async () => {
    intTotalGlobalExcel = 0;
    const sheetSelected = document.getElementById('sltSheet').value,
        strKey = sheetSelected.replace('_', ' '),
        excelRows = XLSX.utils.sheet_to_row_object_array(objGlobalDocument.Sheets[strKey]);

    if(Object.keys(excelRows).length > 0) {
        excelRows.map(d => {
            d.rownum = d.__rowNum__;
        });
        boolGlobalComparado = false;
        let objTMP = objectKeysToLowerCase(excelRows),
            objResultExcel = objTMP.filter(d => (d.fecha !== '' && d.documento !== '' && typeof d.saldo !== 'undefined'));
        objResultExcel.map(d => {
            let saldo = d.saldo;
            if(typeof saldo == 'string')
                saldo = parseFloat(saldo.replaceAll(',', ''));

            if (d?.fecha) {
                if (typeof d.fecha === 'number') {
                    let strDate = excelDateToISODateString(d.fecha);
                    const arrSplit = strDate.split('-');
                    d.fecha = new Date(`${arrSplit[1]}/${arrSplit[2]}/${arrSplit[0]}`);
                }
                else {
                    const arrSplit = d.fecha.split('/');
                    d.fecha = new Date(`${arrSplit[1]}/${arrSplit[0]}/${arrSplit[2]}`);
                }
                intTotalGlobalExcel = saldo;
            }
        });

        if(Object.keys(objGlobalExcelNoProcesado).length > 0)
            objResultExcel = await setExcelNoProcesado(objResultExcel);
        objGlobalInfoDocument = objResultExcel;
        
        drawInfoSheet(objResultExcel);
    }
});

function clearInfo() {
    open_loading();
    document.getElementById('autocomplete_cuenta').value = '';
    document.getElementById('contentExistente').innerHTML = '';
    document.getElementById('contentArchivo').innerHTML = '';
    close_loading();
}

async function setExcelNoProcesado(objTMP) {
    for(let key in objGlobalExcelNoProcesado) {
        const data = objGlobalExcelNoProcesado[key];
        let boolExist = false;
        for(let k in objTMP) {
            let d = objTMP[k];
            if(data.documento == d.documento) {
                let dataDebito = isNaN(data.debito) ? 0 : (data.debito * 1),
                    dDebito = isNaN(d.debito) ? 0 : (d.debito * 1),
                    dataCredito = isNaN(data.credito) ? 0 : (data.credito * 1),
                    dCredito = isNaN(d.credito) ? 0 : (d.credito * 1);

                if((dataDebito == dDebito) || (dataCredito == dCredito)) {
                    boolExist = true;
                    d.linea_excel = data.linea_excel;
                    d.excel = true;
                }
            }
        }
        if(!boolExist) {
            if (typeof data.fecha === 'number') {
                strDate = excelDateToISODateString(data.fecha);
                const arrSplit = strDate.split('-');
                data.fecha = new Date(`${arrSplit[1]}/${arrSplit[2]}/${arrSplit[0]}`);
            }
            else {
                const arrSplit = data.fecha.split('/');
                data.fecha = new Date(`${arrSplit[1]}/${arrSplit[0]}/${arrSplit[2]}`);
            }
            objTMP.push({
                'fecha': data.fecha,
                'documento': data.documento,
                'descripcion': data.descripcion,
                'debito': data.debito,
                'credito': data.credito,
                'saldo': data.saldo,
                'codigo_mov': data.codigo_mov,
                'num_solicitud': data.num_solicitud,
                'linea_excel': data.linea_excel,
                'excel': true,
            });
        }
    }
    return objTMP;
}

function objectKeysToLowerCase(input) {
    if (typeof input !== 'object') return input;
    if (Array.isArray(input)) return input.map(objectKeysToLowerCase);
    return Object.keys(input).reduce(function (newObj, key) {
        let val = input[key],
            newVal = (typeof val === 'object') ? objectKeysToLowerCase(val) : val,
            strKey = key.toLowerCase();
        strKey = strKey.replaceAll(' ', '');
        strKey = strKey.replaceAll('"', '');
        strKey = strKey.replaceAll("'", '');
        strKey = strKey.replaceAll('`', '');
        newObj[strKey] = newVal;
        return newObj;
    }, {});
}

const insertLog = async (strAction) => {
    let formData = new FormData(),
        csrfToken = getCookie('csrftoken');
    formData.append('action', strAction);
    formData.append('csrfmiddlewaretoken', csrfToken);
    formData.append('conta', document.getElementById('conta').value);
    formData.append('cuenta', document.getElementById('cuenta').value);
    const response = await fetch(urlToSaveLog, {method: 'POST', body: formData});
    const data = await response.json();
    if(!data.status)
        console.error(data.message);
    return true;
};

async function processCodigoMovimiento() {
    if(Object.keys(objGlobalCuentasEstados).length > 0 && Object.keys(objGlobalInfoDocument).length > 0) {
        open_loading();
        await insertLog('Comparó');
        const objCuentasEstados = await orderObjCuentasEstados(objGlobalCuentasEstados);
        

        let strTMP = JSON.stringify(objCuentasEstados),
            objTMP = JSON.parse(strTMP),
            objDocumento = await validarPorCodigo(objTMP, objGlobalInfoDocument),
            objRelacionTablas = await relacionarTablas(objDocumento);

        drawInfoSheet(objRelacionTablas.documento, true);
        drawTableExistentes(objRelacionTablas.cuentas, true);
        boolGlobalComparado = true;
        close_loading();
    }
    else
        alert_nova.showNotification("Debes tener información de la cuenta y un archivo de estado de cuenta.", "warning", "danger");
}

async function relacionarTablas(objDocumento) {
    let arrReturn = {};
    objGlobalMovEncabezados.map(data => {
        let numDocumento = data.no_cheque_fisico,
            valor = data.valor;
        objDocumento.map(detail => {
            if((detail.documento == numDocumento) && (detail.codigo_mov == data.codigo_movimiento)) {
                let intTransaccion = ( (detail.credito * 1) > 0 ) ? detail.credito : detail.debito;
                if(!data?.linea_relacion && !detail?.linea_relacion) {
                    if(intTransaccion == valor) {
                        detail.linea_relacion = intGlobalRelacion;
                        detail.tipo_relacion = 'sistema';
                        data.linea_relacion = intGlobalRelacion;
                        data.tipo_relacion = 'sistema';
                        intGlobalRelacion++;
                    }
                }
            }
        });
    });
    arrReturn = {
        'cuentas' : objGlobalMovEncabezados,
        'documento': objDocumento,
    };
    return arrReturn;
}

async function orderObjCuentasEstados(objData) {
    let arrTMP = [],
        int = 0;
    objData.map(detail => {
        if(typeof arrTMP[detail.codigo_mov] == 'undefined') {
            arrTMP[detail.codigo_mov] = [];
            int = 0;
        }
        let objTMP = arrTMP[detail.codigo_mov];
        if(detail) {
            objTMP[int] = detail;
            int++;
        }
    });

    let arrReturn = [],
        i = 0;
    for(let key in arrTMP) {
        arrReturn[i] = arrTMP[key];
        i++;
    }

    return arrReturn;
}

async function validarPorCodigo(objCuentasEstados, objDocumento) {
    for(let key in objDocumento) {
        if(typeof objDocumento[key] !== 'undefined') {
            let data = objDocumento[key],
                strCodigoMov = '';
            for(let ky in objCuentasEstados) {
                let dc = objCuentasEstados[ky],
                    intDone = 0,
                    intPorValidar = 0;

                for(let k in dc) {
                    const d = dc[k];
                    if (d) {
                        const strColumna = d.columna,
                            columna = strColumna.toLowerCase();

                        if (d.relacion === 'y' || !d.relacion)
                            intPorValidar++;

                        if (d.operador === 'es mayor que') {
                            if ((data[`${columna}`] * 1) > (d.valor_busqueda * 1))
                                intDone++;
                            else
                                break;
                        }
                        else if (d.operador === 'contiene') {
                            const contenido = data[`${columna}`];
                            if (typeof contenido === 'string') {
                                const tmpContenido = contenido.toLowerCase();
                                const tmpValor = d.valor_busqueda.toLowerCase();
                                if (tmpContenido.indexOf(tmpValor) >= 0)
                                    intDone++;
                            }
                        }
                        else if (d.operador === 'no contiene') {
                            const contenido = data[`${columna}`];
                            if (typeof contenido === 'string') {
                                const tmpContenido = contenido.toLowerCase();
                                const tmpValor = d.valor_busqueda.toLowerCase();
                                if (tmpContenido.indexOf(tmpValor) < 0)
                                    intDone++;
                            }
                        }
                    }
                }

                if (intDone >= intPorValidar) {
                    strCodigoMov = dc[0].codigo_mov
                    break;
                }
            }
            data.codigo_mov = strCodigoMov;
        }
    }
    return objDocumento;
}

async function getMovEncabezado() {
    open_loading();
    boolGlobalComparado = false;
    const formMovEncabezado = document.getElementById('formMovEncabezado');
    const elmCuenta = document.getElementById('cuenta'),
        elmFInicio = document.getElementById('fecha_inicio'),
        elmFFin = document.getElementById('fecha_fin'),
        elmConta = document.getElementById('conta');
    
    if(elmCuenta.value != '' && elmFInicio.value != '' && elmFFin.value != '' && elmConta.value != '') {
        const form = new FormData(formMovEncabezado);
        const response = await fetch(`${urlGetMovimiento}`, { method: 'POST', body: form });
        let data = {};
        try {
            data = await response.json();
        } catch (error) {
            console.error(error);
        }

        if(data?.status) {
            close_loading();
            if(data?.data_mov_encabezado) {
                data['data_mov_encabezado'].map(d => {
                    if (typeof d.fecha === 'number') {
                        strDate = excelDateToISODateString(d.fecha);
                        const arrSplit = strDate.split('-');
                        d.fecha = new Date(`${arrSplit[1]}/${arrSplit[2]}/${arrSplit[0]}`);
                    }
                    else {
                        const arrSplit = d.fecha.split('/');
                        d.fecha = new Date(`${arrSplit[1]}/${arrSplit[0]}/${arrSplit[2]}`);
                    }
                });
                objGlobalMovEncabezados = data.data_mov_encabezado;
            }
            objGlobalCuentasEstados = data?.data_cuentas_estados;
            objGlobalExcelNoProcesado = data?.data_excel_sin_procesar;
            intSaldoInicial = data?.saldo_inicial;

            drawTableExistentes(objGlobalMovEncabezados);
            if(Object.keys(objGlobalInfoDocument).length > 0) {
                objGlobalInfoDocument = await setExcelNoProcesado(objGlobalInfoDocument);
                drawInfoSheet(objGlobalInfoDocument);
            }
        }
    }
    else
        alert_nova.showNotification('No hay información valida para consultar', 'warning', 'danger');
    close_loading();
}

async function handleFileSelect(evt) {
    let slt = document.getElementById('sltSheet');
    slt.classList.add('noShow');
    slt.innerHTML = '';
    btnSearch.classList.add('noShow');

    const files = evt.target.files;
    const xl2json = await ProcessExcelToJSON(files[0]);
    if(xl2json.boolStatus) {
        boolGlobalComparado = false;
        if(Object.keys(xl2json.sheet).length > 0)
            drawOptionSheets(xl2json);
        else {
            objGlobalInfoDocument = xl2json.data;
            drawInfoSheet(xl2json.data);
        }
    }
}

function ProcessExcelToJSON(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onerror = (ex) => {
            console.error(ex);
            resolve({
                'data': {},
                'sheet': {},
                'boolStatus': false,
            });
        };

        reader.readAsBinaryString(file);

        reader.onload = e => {
            const data = e.target.result,
                workbook = XLSX.read(data, {
                    type: 'binary',
                    //cellDates: true,
                });
            const objSheets = workbook.SheetNames;
            objGlobalDocument = workbook;
            if(Object.keys(objSheets).length == 1) {
                const excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[objSheets[0]]);
                resolve({
                    'data': excelRows,
                    'sheet': {},
                    'boolStatus': true,
                });
            }
            else {
                resolve({
                    'data': workbook,
                    'sheet': objSheets,
                    'boolStatus': true,
                });
            }
        };
    });
}

function drawOptionSheets(objSheets) {
    let slt = document.getElementById('sltSheet');
    objSheets.sheet.map( data => {
        const strKey = data.replaceAll(' ', '_');
        slt.innerHTML += `  <option value='${strKey}'>
                                ${data}
                            </option>`;
    });
    slt.classList.remove('noShow');
    btnSearch.classList.remove('noShow');
}

function excelDateToISODateString(excelDateNumber) {
    return new Date(Math.round((excelDateNumber - 25569) * 86400 * 1000)).toISOString().substring(0, 10);
}

function drawInfoSheet(objData, boolComparado = false) {
    const contentAllInfo = document.getElementById('contentArchivo');
    let tbl = ` <table class='table table-bordered'>
                    <thead>
                        <tr class='tr-titles'>
                            <th>Fecha</th>
                            <th>Documento</th>
                            <th>Descripcion</th>
                            <th>Debito</th>
                            <th>Credito</th>
                            <th>Saldo</th>
                            <th>CodigoMov</th>
                            <th>Fila en Documento</th>
                            <th>NumSolicitud</th>
                            <th>Línea Relación</th>
                        </tr>
                    </thead>
                    <tbody id='tBodyDocumento'></tbody>
                </table>`;
    contentAllInfo.innerHTML = tbl;

    const cntBodyDocumento = document.getElementById('tBodyDocumento');
    objData.map((data, key) => {
        if (data?.fecha && data.fecha !== '' && data.documento !== '') {
            let strDate = data.fecha,
                intFila = key + 1,
                intMonth = strDate.getMonth() + 1,
                strDatePrint = `${strDate.getDate()}/${intMonth}/${strDate.getFullYear()}`,
                strCodigoMov = (data.codigo_mov) ? data.codigo_mov : '',
                strDocumento = (typeof data.documento !== 'undefined' || data.documento !== '') ? data.documento : '',
                intLineaRelacion = (data.linea_relacion) ? data.linea_relacion : '',
                strClassRelacion = (intLineaRelacion != '') ? 'table-success' : ( (boolComparado) ? 'table-danger' : '' ),
                strClassExcelYaProcesado = (data.excel) ? 'excel-ya-procesado': '';

            let tr = `  <tr id='archivo_${key}' class='${strClassRelacion} ${strClassExcelYaProcesado} unselectable' fila-archivo='${key}' linea-relacion='${intLineaRelacion}'>
                            <td id='documento_${key}_fecha'> ${strDatePrint} </td>
                            <td id='documento_${key}_documento'> ${strDocumento} </td>
                            <td id='documento_${key}_descripcion'> ${data.descripcion} </td>
                            <td id='documento_${key}_debito'> ${data.debito} </td>
                            <td id='documento_${key}_credito'> ${data.credito} </td>
                            <td id='documento_${key}_saldo'> ${data.saldo} </td>
                            <td id='documento_${key}_codigo_movimiento'> ${strCodigoMov} </td>
                            <td id='documento_${key}_fila'> ${intFila} </td>
                            <td id='documento_${key}_numero_solicitud'> </td>
                            <td id='documento_${key}_linea_relacion'> ${intLineaRelacion} </td>
                        </tr>`;
            cntBodyDocumento.insertAdjacentHTML('beforeend', tr);
            if(boolComparado) {
                let element = document.getElementById(`archivo_${key}`);
                if(element) {
                    element.addEventListener('click', () => {
                        let listElements = document.querySelectorAll(`tr[linea-relacion='${intLineaRelacion}']`);
                        listElements.forEach(element => {
                            let strID = element.getAttribute('id');
                            if(strID.indexOf('tr_existente') >= 0) {
                                let a = strID.split("_");
                                if(a[2] >= 2)
                                    a[2]--;
                                let str = `${a[0]}_${a[1]}_${a[2]}`;
                                document.getElementById(`${str}`).scrollIntoView();
                            }
                        });
                    });

                    element.addEventListener('dblclick', () => {
                        drawModalAsignarUnaFiladeExistente(key);
                    });

                    element.addEventListener('mouseover', () => {
                        let arrElements = document.querySelectorAll(`tr[linea-relacion="${intLineaRelacion}"]`);
                        arrElements.forEach(element => {
                            element.classList.add('fila-activa');
                        });
                    });

                    element.addEventListener('mouseout', () => {
                        let arrElements = document.querySelectorAll(`tr[linea-relacion="${intLineaRelacion}"]`);
                        arrElements.forEach(element => {
                            element.classList.remove('fila-activa');
                        });
                    });
                }
            }
        }
    });

    if(boolComparado) {
        drawTableCobrados(objData);
    }
}

function drawTableExistentes(objExistentes, boolComparado = false) {
    if(Object.keys(objExistentes).length > 0) {
        const content = document.getElementById('contentExistente');
        let objTMP = [];
        objDuplicates = [];
        const table = ` <table class='table table-bordered'>
                            <thead>
                                <tr class='tr-titles'>
                                    <th>Fecha</th>
                                    <th>Documento</th>
                                    <th>Nombre</th>
                                    <th>Valor</th>
                                    <th>Tipo</th>
                                    <th>CodigoMov</th>
                                    <th>NumSolicitud</th>
                                    <th>Línea Relación</th>
                                </tr>
                            </thead>
                            <tbody id='tBodyExistentes'></tbody>
                        </table>`;
        content.innerHTML = table;
        let cntBodyExistentes = document.getElementById('tBodyExistentes');
        objExistentes.map( (data, key) => {
            if(typeof objTMP[data.no_cheque_fisico] == 'undefined')
                objTMP[data.no_cheque_fisico] = { 'monto': data.valor, };
            else {
                if(objTMP[data.no_cheque_fisico].monto == data.valor)
                    objDuplicates[key] = data.no_cheque_fisico;
            }

            let linea_relacion = (typeof data.linea_relacion !== 'undefined') ? data.linea_relacion : '',
                strClass = (linea_relacion != '') ? 'table-success' : ( (boolComparado) ? 'table-danger' : '' );

            let tr = `  <tr id='tr_existente_${key}' class='${strClass} unselectable' fila-existente='${key}' int_cf='${data.no_cheque_fisico}' linea-relacion='${linea_relacion}'>
                            <td>${data.fecha}</td>
                            <td>${data.no_cheque_fisico}</td>
                            <td>${data.nombre}</td>
                            <td>${data.valor}</td>
                            <td>${data.tipo_mov}</td>
                            <td>${data.codigo_movimiento}</td>
                            <td>${data.numero_solicitud}</td>
                            <td>${linea_relacion}</td>
                        </tr>`;
            cntBodyExistentes.insertAdjacentHTML('beforeend', tr);
            let element = document.getElementById(`tr_existente_${key}`);
            if(boolComparado) {
                if(element) {
                    element.addEventListener('click', () => {
                        let listElements = document.querySelectorAll(`tr[linea-relacion='${linea_relacion}']`);
                        listElements.forEach(element => {
                            let strID = element.getAttribute('id');
                            if(strID.indexOf('archivo_') >= 0) {
                                let a = strID.split("_");
                                if(a[1] >= 2)
                                    a[1]--;
                                
                                let str = `${a[0]}_${a[1]}`;
                                document.getElementById(`${str}`).scrollIntoView();
                            }
                        });
                    });

                    element.addEventListener('dblclick', () => {
                        drawModalAsignarUnaFiladeArchivo(key);
                    });

                    element.addEventListener('mouseover', () => {
                        let arrElements = document.querySelectorAll(`tr[linea-relacion="${linea_relacion}"]`);
                        arrElements.forEach(element => {
                            element.classList.add('fila-activa');
                        });
                    });

                    element.addEventListener('mouseout', () => {
                        let arrElements = document.querySelectorAll(`tr[linea-relacion="${linea_relacion}"]`);
                        arrElements.forEach(element => {
                            element.classList.remove('fila-activa');
                        });
                    });
                }
            }
        });

        objDuplicates.map(data => {
            let collectionElements = document.querySelectorAll(`tr[int_cf='${data}']`);
            collectionElements.forEach(element => {
                element.classList.remove('table-success');
                element.classList.remove('table-danger');
                element.classList.add('table-warning');
            });
        });

        if(boolComparado)
            drawTableCirculacion(objExistentes);
    }
}

function setEventHover(objData) {
    objData.map(data => {
        let element = document.querySelector(`tr[linea-relacion="${data.linea_relacion}"]`);
        if(element) {
            element.addEventListener('mouseover', () => {
                let arrElements = document.querySelectorAll(`tr[linea-relacion="${data.linea_relacion}"]`);
                arrElements.forEach(element => {
                    element.classList.add('fila-activa');
                });
            });

            element.addEventListener('mouseout', () => {
                let arrElements = document.querySelectorAll(`tr[linea-relacion="${data.linea_relacion}"]`);
                arrElements.forEach(element => {
                    element.classList.remove('fila-activa');
                });
            });
        }
    });
}

function drawTableCirculacion(objData) {
    const content = document.getElementById('contentCirculacion');
    let detalles = '';
    objData.map( (data, key) => {
        if(typeof data.linea_relacion == 'undefined' || data.linea_relacion == '') {
            detalles += `  <tr id='tr_circulacion_${key}' class='unselectable'>
                                <td>${data.fecha}</td>
                                <td>${data.no_cheque_fisico}</td>
                                <td>${data.nombre}</td>
                                <td>${data.valor}</td>
                                <td>${data.tipo_mov}</td>
                                <td>${data.codigo_movimiento}</td>
                                <td>${data.numero_solicitud}</td>
                            </tr>`;
        }
    });

    const table = ` <div class='row'>
                        <h3>Tabla de movimientos en circulacion</h3>
                    </div>
                    <div class='row tableFixHead'>
                        <table class='table table-bordered' style='width: 98% !important; max-width: 98% !important;'>
                            <thead>
                                <tr class='tr-titles'>
                                    <th>Fecha</th>
                                    <th>Documento</th>
                                    <th>Nombre</th>
                                    <th>Valor</th>
                                    <th>Tipo</th>
                                    <th>CodigoMov</th>
                                    <th>NumSolicitud</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${detalles}
                            </tbody>
                        </table>
                    </div>`;
    content.innerHTML = table;
}

function drawTableCobrados(objData) {
    const contentAllInfo = document.getElementById('contentCobrados');
    let tbody = '';
    for(let key in objData) {
        const data = objData[key];
        if(data.fecha !== '' && (typeof data.linea_relacion == 'undefined' || data.linea_relacion == '')){
            let strDate = data.fecha,
                intFila = key + 1,
                intMonth = strDate.getMonth() + 1,
                strDatePrint = `${strDate.getDate()}/${intMonth}/${strDate.getFullYear()}`,
                strCodigoMov = (data.codigo_mov) ? data.codigo_mov : '';

            tbody += `  <tr id='cobrado_${key}' class='unselectable' fila-cobrado='${key}' >
                            <td id='documento_${key}_fecha'>
                                ${strDatePrint}
                            </td>
                            <td id='documento_${key}_documento'>
                                ${data.documento}
                            </td>
                            <td id='documento_${key}_descripcion'>
                                ${data.descripcion}
                            </td>
                            <td id='documento_${key}_debito'>
                                ${data.debito}
                            </td>
                            <td id='documento_${key}_credito'>
                                ${data.credito}
                            </td>
                            <td id='documento_${key}_saldo'>
                                ${data.saldo}
                            </td>
                            <td id='documento_${key}_codigo_movimiento'>
                                ${strCodigoMov}
                            </td>
                            <td id='documento_${key}_fila'>
                                ${intFila}
                            </td>
                            <td id='documento_${key}_numero_solicitud'>

                            </td>
                        </tr>`;
        }
    }

    let table = `   <div class='row'>
                        <h3>Tabla de movimientos pendientes</h3>
                    </div>
                    <div class='row tableFixHead'>
                        <table class='table table-bordered unselectable'>
                            <thead>
                                <tr class='tr-titles'>
                                    <th>Fecha</th>
                                    <th>Documento</th>
                                    <th>Descripcion</th>
                                    <th>Debito</th>
                                    <th>Credito</th>
                                    <th>Saldo</th>
                                    <th>CodigoMov</th>
                                    <th>Fila en Documento</th>
                                    <th>NumSolicitud</th>
                                </tr>
                            </thead>
                            <tbody>${tbody}</tbody>
                        </table>
                    </div>`;
    contentAllInfo.innerHTML = table;

    makeObjReports();
}

async function drawModalAsignarUnaFiladeExistente(intKeyArchivo) {
    document.getElementById('modal-header-title').innerHTML = '¿Con que registro deseas relacionarlo?';
    const modal = document.getElementById('modal-body-relacion');
    const table = ` <table>
                        <thead>
                            <tr>
                                <th>Seleccionar</th>
                                <th>Fecha</th>
                                <th>Documento</th>
                                <th>Nombre</th>
                                <th>Valor</th>
                                <th>CodigoMov</th>
                                <th>NumSolicitud</th>
                            </tr>
                        </thead>
                        <tbody id='tbody-relacion-existente'></tbody>
                    </table>`;
    modal.innerHTML = table;
    const cntTBody = document.getElementById('tbody-relacion-existente');
    objGlobalMovEncabezados.map((data, key) => {
        if(data.fecha !== '' && data.documento !== '') {
            let strDate = data.fecha,
                intMonth = strDate.getMonth() + 1,
                strDatePrint = `${strDate.getDate()}/${intMonth}/${strDate.getFullYear()}`;

            let tr = `  <tr id='tr-relacion-existente-${key}' class='unselectable'>
                            <td>
                                <input type='radio' name='existente' value='${key}' class='form-control' />
                            </td>
                            <td>${strDatePrint}</td>
                            <td>${data.no_cheque_fisico}</td>
                            <td>${data.nombre}</td>
                            <td>${data.valor}</td>
                            <td>${data.tipo_mov}</td>
                            <td>${data.numero_solicitud}</td>
                        </tr>`;
            cntTBody.insertAdjacentHTML('beforeend', tr);
        }
    });

    await createButtonsModalRelations(intKeyArchivo, true);

    close_loading();
    $(`#modalRelacion`).modal();
}

async function drawModalAsignarUnaFiladeArchivo(intKey) {
    open_loading();
    document.getElementById('modal-header-title').innerHTML = '¿Con que registro deseas relacionarlo?';
    const modal = document.getElementById('modal-body-relacion');
    const table = ` <table>
                        <thead>
                            <tr>
                                <th>Seleccionar</th>
                                <th>Fecha</th>
                                <th>Documento</th>
                                <th>Descripcion</th>
                                <th>Debito</th>
                                <th>Credito</th>
                                <th>Saldo</th>
                            </tr>
                        </thead>
                        <tbody id='tbody-relacion-archivo'></tbody>
                    </table>`;
    modal.innerHTML = table;
    const cntTBody = document.getElementById('tbody-relacion-archivo');
    objGlobalInfoDocument.map((data, key) => {
        if(data.fecha !== '' && data.documento !== '') {
            let strDate = data.fecha,
                intMonth = strDate.getMonth() + 1,
                strDatePrint = `${strDate.getDate()}/${intMonth}/${strDate.getFullYear()}`;
            let tr = `  <tr id='tr-relacion-archivo-${key}' class='unselectable'>
                            <td>
                                <input type='radio' name='archivo' value='${key}' class='form-control' />
                            </td>
                            <td>${strDatePrint}</td>
                            <td>${data.documento}</td>
                            <td>${data.descripcion}</td>
                            <td>${data.debito}</td>
                            <td>${data.credito}</td>
                            <td>${data.saldo}</td>
                        </tr>`;
            cntTBody.insertAdjacentHTML('beforeend', tr);
        }
    });

    await createButtonsModalRelations(intKey, false);

    close_loading();
    $(`#modalRelacion`).modal();
}

const createButtonsModalRelations = async (intKey, boolExistente) => {
    let btn = ` <button class='btn btn-outline-danger btnFooter' type='button' id='btnQuitarRelacion'>
                    <i class="material-icons">
                        delete_outline
                    </i>
                    Quitar Relación
                </button>
                <button class='btn btn-outline-success btnFooter' type='button' id='btnRelacion'>
                    <i class="material-icons">
                        swipe
                    </i>
                    Hacer Relación Manual
                </button>`;
    document.getElementById('modal-footer-relacion').innerHTML = btn;

    document.getElementById('btnQuitarRelacion').addEventListener('click', () => {
        open_loading();
        if(boolExistente)
            deleteRelacionArchivo(intKey);
        else
            deleteRelacionExistente(intKey);
    });

    document.getElementById('btnRelacion').addEventListener('click', () => {
        let inputSelected = (boolExistente) ? document.querySelector('input[name="existente"]:checked') : document.querySelector('input[name="archivo"]:checked');
        if(inputSelected) {
            open_loading();
            if(boolExistente) {
                let intMov = objGlobalMovEncabezados[inputSelected.value].valor,
                    intFile = ((objGlobalInfoDocument[intKey].debito * 1) > 0) ?
                        (objGlobalInfoDocument[intKey].debito * 1) :
                            (objGlobalInfoDocument[intKey].credito * 1);

                if((intMov * 1) == (intFile * 1))
                    setExistenteAFilaArchivo(inputSelected.value, intKey);
                else {
                    $(`#modalRelacion`).modal('hide');
                    close_loading();
                    alert_nova.showNotification("Los valores no coinciden para hacer la relacion.", "warning", "danger");
                }
            }
            else {
                let intFile = objGlobalMovEncabezados[intKey].valor,
                    intMov = ((objGlobalInfoDocument[inputSelected.value].debito * 1) > 0) ?
                        (objGlobalInfoDocument[inputSelected.value].debito * 1) :
                            (objGlobalInfoDocument[inputSelected.value].credito * 1);

                if((intFile * 1) == (intMov * 1))
                    setFilaArchivoAExistente(inputSelected.value, intKey);
                else {
                    $(`#modalRelacion`).modal('hide');
                    close_loading();
                    alert_nova.showNotification("Los valores no coinciden para hacer la relacion.", "warning", "danger");
                }
            }
        }
    });

    return true;
}

function deleteRelacionArchivo(intKey) {
    if(typeof objGlobalInfoDocument[intKey].linea_relacion !== 'undefined') {
        let intExistente = objGlobalInfoDocument[intKey].linea_relacion;
        objGlobalMovEncabezados.map(data => {
            if(data.linea_relacion == intExistente)
                delete data.linea_relacion;
        });
        setTimeout( () => {
            delete objGlobalInfoDocument[intKey].linea_relacion;
            drawTableExistentes(objGlobalMovEncabezados, true);
            drawInfoSheet(objGlobalInfoDocument, true);

            close_loading();
            $(`#modalRelacion`).modal('hide');
        }, 300);
    }
    else
        close_loading();
}

function deleteRelacionExistente(intKey) {
    if (typeof objGlobalMovEncabezados[intKey].linea_relacion !== 'undefined') {
        let intExistente = objGlobalMovEncabezados[intKey].linea_relacion;
        objGlobalInfoDocument.map(data => {
            if(data.linea_relacion == intExistente)
                delete data.linea_relacion;
        });
        setTimeout( () => {
            delete objGlobalMovEncabezados[intKey].linea_relacion;
            drawTableExistentes(objGlobalMovEncabezados, true);
            drawInfoSheet(objGlobalInfoDocument, true);

            close_loading();
            $(`#modalRelacion`).modal('hide');
        }, 300);
    }
    else
        close_loading();
}

function setFilaArchivoAExistente(intKeyArchivo, intKeyExistente) {
    if(typeof objGlobalMovEncabezados[intKeyExistente].linea_relacion !== 'undefined' &&
        (objGlobalMovEncabezados[intKeyExistente].linea_relacion * 1)> 0) {
        objGlobalInfoDocument.map(data => {
            if(data.linea_relacion == objGlobalMovEncabezados[intKeyExistente].linea_relacion)
                delete data.linea_relacion;
        });
    }
    setTimeout( () => {
        setGlobalObjects(intKeyArchivo, intKeyExistente);
    }, 300);
}

function setExistenteAFilaArchivo(intKeyExistente, intKeyArchivo) {
    if(typeof objGlobalInfoDocument[intKeyArchivo].linea_relacion !== 'undefined' &&
        (objGlobalInfoDocument[intKeyArchivo].linea_relacion * 1)> 0) {
        objGlobalMovEncabezados.map(data => {
            if(data.linea_relacion == objGlobalInfoDocument[intKeyArchivo].linea_relacion)
                delete data.linea_relacion;
        });
    }
    setTimeout( () => {
        setGlobalObjects(intKeyArchivo, intKeyExistente);
    }, 300);
}

function setGlobalObjects(intKeyArchivo, intKeyExistente) {
    objGlobalInfoDocument[intKeyArchivo].linea_relacion = intGlobalRelacion;
    objGlobalInfoDocument[intKeyArchivo].tipo_relacion = 'manual';

    objGlobalMovEncabezados[intKeyExistente].linea_relacion = intGlobalRelacion;
    objGlobalMovEncabezados[intKeyExistente].tipo_relacion = 'manual';

    intGlobalRelacion++;

    drawTableExistentes(objGlobalMovEncabezados, true);
    drawInfoSheet(objGlobalInfoDocument, true);

    close_loading();
    $(`#modalRelacion`).modal('hide');
}

async function makeSugerencia() {
    open_loading();
    await insertLog('Hizo sugerencia');
    objGlobalMovEncabezados.map(d => {
        if(!d?.linea_relacion) {
            delete d.sugerido;
        }
    });
    objGlobalInfoDocument.map(d => {
        if(!d?.linea_relacion) {
            delete d.sugerido;
        }
    });
    const objSugerencia = await makeObjSugerencia();

    if(Object.keys(objSugerencia).length > 0)
        drawModalSugerencia(objSugerencia);
    else {
        close_loading();
        alert_nova.showNotification("Ningun registro coincide con fecha y cantidad.", "warning", "danger");
    }
}

async function makeObjSugerencia() {
    let arrReturn = [];
    for(let key in objGlobalMovEncabezados) {
        let data = objGlobalMovEncabezados[key];
        if(data.fecha !== '' && typeof data.linea_relacion == 'undefined' && typeof data.sugerido == 'undefined') {
            let strDateMov = data.fecha,
                valorMov = data.valor,
                boolFind = false;
            for(let k in objGlobalInfoDocument) {
                let detail = objGlobalInfoDocument[k];
                if(!boolFind && typeof detail.linea_relacion == 'undefined' && typeof detail.sugerido == 'undefined') {
                    let strDateFile = detail.fecha,
                        valorFile = ((detail.credito * 1) > 0) ? (detail.credito * 1) : (detail.debito * 1);
                    if(valorFile == valorMov) {
                        let dayMov = strDateMov.getDate(),
                            monMov = strDateMov.getMonth() + 1,
                            yeaMov = strDateMov.getFullYear(),
                            dayFil = strDateFile.getDate(),
                            monFil = strDateFile.getMonth() + 1,
                            yeaFil = strDateFile.getFullYear(),
                            finallyDateMov = `${dayMov}/${monMov}/${yeaMov}`,
                            finallyDateFil = `${dayFil}/${monFil}/${yeaFil}`;

                        if(finallyDateMov == finallyDateFil) {
                            detail.sugerido = true;
                            data.sugerido = true;
                            arrReturn.push({
                                'fecha': finallyDateFil,
                                'valor': valorFile,
                                'documento_banco': detail.documento,
                                'descripcion': detail.descripcion,
                                'nombre': data.nombre,
                                'documento_nova': data.no_cheque_fisico,
                                'key_mov': key,
                                'key_file': k,
                            });
                            boolFind = true;
                        }
                    }
                }
            }
        }
    }
    return arrReturn;
}

function drawModalSugerencia(objSugerencia) {
    document.getElementById('modal-header-title').innerHTML = '¿Que registros aprobarás segun la sugerencia?';
    const modal = document.getElementById('modal-body-relacion');
    const table = ` <table>
                        <thead>
                            <tr>
                                <th>
                                    Seleccionar Todos
                                    <input class='form-control inputCheckCustomize inputCheckAll' type='checkbox' name='chkAllOptionsSuggestion' id='chkAllOptionsSuggestion'/>
                                </th>
                                <th>Fecha</th>
                                <th>Documento Banco</th>
                                <th>Documento Sistema</th>
                                <th>Nombre</th>
                                <th>Valor</th>
                                <th>Descripcion</th>
                            </tr>
                        </thead>
                        <tbody id='tbody-sugerencia'></tbody>
                    </table>`;
    modal.innerHTML = table;
    for(let key in objSugerencia) {
        const data = objSugerencia[key];
        const content = document.getElementById('tbody-sugerencia');
        content.innerHTML += `  <tr id='tr-sugerencia-${key}' class='unselectable'>
                                    <td>
                                        <input type='checkbox' name='sugerencia' value='${key}' class='form-control inputCheckCustomize' mov='${data.key_mov}' file='${data.key_file}' />
                                    </td>
                                    <td>${data.fecha}</td>
                                    <td>${data.documento_banco}</td>
                                    <td>${data.documento_nova}</td>
                                    <td>${data.nombre}</td>
                                    <td>${data.valor}</td>
                                    <td>${data.descripcion}</td>
                                </tr>`;
    }

    const btn = `   <button class='btn btn-outline-success btnFooter' type='button' id='btnSugerencias'>
                        <i class="material-icons">
                            task_alt
                        </i>
                        Quiero estas sugerencias
                    </button>`;
    document.getElementById('modal-footer-relacion').innerHTML = btn;

    const chkAllOptionsSuggestion = document.getElementById('chkAllOptionsSuggestion');
    if(chkAllOptionsSuggestion) {
        chkAllOptionsSuggestion.addEventListener('click', () => {
            const boolChecked = chkAllOptionsSuggestion.checked;
            selectAllChecksByName('sugerencia', boolChecked);
        });
    }

    document.getElementById('btnSugerencias').addEventListener('click', () => {
        let inputsSelected = document.querySelectorAll('input[name="sugerencia"]:checked');
        if(inputsSelected && Object.keys(inputsSelected).length > 0) {
            open_loading();
            setSugerencias(inputsSelected);
        }
    });
    close_loading();
    $(`#modalRelacion`).modal();
}

function setSugerencias(inputsSelected) {
    
    inputsSelected.forEach(element => {
        let keyMov = element.getAttribute('mov'),
            keyFile = element.getAttribute('file');


        if(objGlobalInfoDocument[keyFile]?.fecha && objGlobalMovEncabezados[keyMov]?.fecha) {
            objGlobalInfoDocument[keyFile].linea_relacion = intGlobalRelacion;
            objGlobalInfoDocument[keyFile].tipo_relacion = 'sugerencia';
            objGlobalInfoDocument[keyFile].no_operar = true;
            objGlobalMovEncabezados[keyMov].linea_relacion = intGlobalRelacion;
            objGlobalMovEncabezados[keyMov].no_operar = true;
            intGlobalRelacion++;
        }
    });
    
    drawTableExistentes(objGlobalMovEncabezados, true);
    drawInfoSheet(objGlobalInfoDocument, true);
    close_loading();
    $(`#modalRelacion`).modal('hide');
}

function makeObjReports() {
    open_loading();
    if(Object.keys(objGlobalMovEncabezados).length > 0 && Object.keys(objGlobalInfoDocument).length > 0) {
        for(let k in objGlobalMovEncabezados) {
            const d = objGlobalMovEncabezados[k];
            if(typeof d.linea_relacion !== 'undefined' && d.linea_relacion) {
                for(let key in objGlobalInfoDocument) {
                    const data = objGlobalInfoDocument[key];
                    if(typeof data.linea_relacion !== 'undefined' && data.linea_relacion) {
                        if(d.linea_relacion == data.linea_relacion) {
                            if(typeof objGlobalReportes[d.tipo] == 'undefined')
                                objGlobalReportes[d.tipo] = [];
                        }
                    }
                }
            }
        }
    }
    close_loading();
}

const makeObjToSaveConciliacion = async () => {
    let arrReturn = [];
    let objEncabezadosNoRelacion = [],
        objDocumentoNoRelacion = [];
    if(Object.keys(objGlobalMovEncabezados).length > 0)
        objEncabezadosNoRelacion = objGlobalMovEncabezados.filter(d => (typeof d.linea_relacion == 'undefined' || d.linea_relacion == "" || d.linea_relacion == "0"));
    if(Object.keys(objGlobalInfoDocument).length > 0)
        objDocumentoNoRelacion = objGlobalInfoDocument.filter(d => (typeof d.linea_relacion == 'undefined' || d.linea_relacion == "" || d.linea_relacion == "0"));
    for(let k in objGlobalMovEncabezados) {
        const d = objGlobalMovEncabezados[k];
        if(typeof d.linea_relacion !== 'undefined' && d.linea_relacion) {
            for(let key in objGlobalInfoDocument) {
                const data = objGlobalInfoDocument[key];
                if(typeof data.linea_relacion !== 'undefined' && data.linea_relacion) {
                    if(d.linea_relacion == data.linea_relacion) {
                        let intDocumento = 0,
                            objPushData = {},
                            strDay = data['fecha'].getDate(),
                            strMonth = data['fecha'].getMonth() + 1,
                            strYear = data['fecha'].getFullYear(),
                            strDate = `${strYear}${zfill(strMonth, 2)}${zfill(strDay, 2)}`,
                            strFormatDate = `${strYear}-${zfill(strMonth, 2)}-${zfill(strDay, 2)}`,
                            intRow = 0,
                            boolExcel = 0;

                        if(data.excel) {
                            boolExcel = 1;
                            intRow = 'NELSON aqui deberia venir un int desde la db';
                        }
                        else {
                            if(data?.rownum) {
                                boolExcel = 1;
                                intRow = parseInt(data.rownum) + 1;
                            }
                        }

                        arrReturn.push({
                            'num_solic': d.numero_solicitud,
                            'no_cheque_fisico': d.no_cheque_fisico,
                            'es_excel': 1,
                            'excel': boolExcel,
                            'descripcion': data.descripcion,
                            'debito': data.debito,
                            'credito': data.credito,
                            'saldo': data.saldo,
                            'documento': data.documento,
                            'valor': d.valor,
                            'nombre': d.nombre,
                            'fechaentera': strDate,
                            'fecha': strFormatDate,
                            'lineaexcel': intRow,
                            'linea_relacion': data.linea_relacion,
                            'codigo_movimiento': data.codigo_mov,
                            'pendiente': 0,
                        });
                    }
                }
            }
        }
        else {
            let a = "NELSON aqui no tengo ninguna relacion, es lo que deberia subir, no?";
        }
    }

    if(Object.keys(objEncabezadosNoRelacion).length > 0) {
        objEncabezadosNoRelacion.map(d => {
            let strDay = d['fecha'].getDate(),
                strMonth = d['fecha'].getMonth() + 1,
                strYear = d['fecha'].getFullYear(),
                strDate = `${strYear}${zfill(strMonth, 2)}${zfill(strDay, 2)}`,
                strFormatDate = `${strYear}-${zfill(strMonth, 2)}-${zfill(strDay, 2)}`;
            arrReturn.push({
                'num_solic': d.numero_solicitud,
                'no_cheque_fisico': d.no_cheque_fisico,
                'es_excel': 0,
                'excel': 0,
                'descripcion': '',
                'debito': 0,
                'credito': 0,
                'saldo': 0,
                'documento': '',
                'valor': d.valor,
                'nombre': d.nombre,
                'fechaentera': strDate,
                'fecha': strFormatDate,
                'lineaexcel': 0,
                'linea_relacion': 0,
                'codigo_movimiento': d.codigo_movimiento,
                'pendiente': 1,
            });
        });
    }

    if(Object.keys(objDocumentoNoRelacion).length > 0) {
        objDocumentoNoRelacion.map(d => {
            let strDay = d['fecha'].getDate(),
                strMonth = d['fecha'].getMonth() + 1,
                strYear = d['fecha'].getFullYear(),
                strDate = `${strYear}${zfill(strMonth, 2)}${zfill(strDay, 2)}`,
                strFormatDate = `${strYear}-${zfill(strMonth, 2)}-${zfill(strDay, 2)}`,
                boolExcel = (d?.excel && d.excel) ? 1 : 0;
            arrReturn.push({
                'num_solic': '',
                'no_cheque_fisico': '',
                'es_excel': 1,
                'excel': boolExcel,
                'descripcion': d.descripcion,
                'debito': d.debito,
                'credito': d.credito,
                'saldo': d.saldo,
                'documento': d.documento,
                'valor': 0,
                'nombre': '',
                'fechaentera': strDate,
                'fecha': strFormatDate,
                'lineaexcel': d.rownum,
                'linea_relacion': 0,
                'codigo_movimiento': d.codigo_mov,
                'pendiente': 1,
            });
        });
    }

    return arrReturn;
};

const sendToSaveAll = async () => {
    let arrReturn = await saveObjectByParts(objToSave, 'formSaveAll', urlSave, 'conciliacion_id', 'POST', 2500, strElementsDefault);
    if (arrReturn?.status && arrReturn.status) {
        alert_nova.showNotification('Datos validados correctamente se recargará automaticamente, espera por favor', "add_alert", "success");
        setTimeout(()=> {
            location.reload();
        }, 2000);
    }
    else
        alert_nova.showNotification(arrReturn.error, "warning", "danger");
};

async function saveConciliacion() {
    if(Object.keys(objGlobalInfoDocument).length > 0) {
        let dateConciliacion = document.getElementById('fecha_fin').value,
            codigoCuenta = document.getElementById('cuenta').value,
            elementDate = document.getElementById('date_send_save'),
            elementCode = document.getElementById('code_send_save'),
            fechaInicial = document.getElementById('fecha_inicio').value,
            fechaFinal = document.getElementById('fecha_fin').value,
            saldoInicialConta = document.getElementById('saldoInicialConta'),
            intTotalGlobalExcelV = document.getElementById('intTotalGlobalExcelV'),
            saldoInicialContaVal = ( (intTotalGlobalMov * 1) +  (intSaldoInicial * 1)).toFixed(2),
            conta = document.getElementById('conta').value,
            strElementsDefault = '';
        if(typeof intTotalGlobalExcel == 'string')
            intTotalGlobalExcel = intTotalGlobalExcel.replaceAll(',', '');
        
        intTotalGlobalExcel = parseFloat(intTotalGlobalExcel);
        intTotalGlobalExcel = intTotalGlobalExcel.toFixed(2);
        if(!elementDate && !elementCode) {
            strElementsDefault = `  <input type='' id='date_send_save' name='date' value='${dateConciliacion}' />
                                    <input type='' id='code_send_save' name='codigoCuenta' value='${codigoCuenta}' />
                                    <input type='' id='saldoInicialConta' name='saldoInicialConta' value='${saldoInicialContaVal}' />
                                    <input type='' id='fechaInicial' name='fechaInicial' value='${fechaInicial}' />
                                    <input type='' id='fechaFinal' name='fechaFinal' value='${fechaFinal}' />
                                    <input type='' id='intSaldoInicial' name='intSaldoInicial' value='${intSaldoInicial}' />
                                    <input type='' id='intTotalGlobalExcelV' name='intTotalGlobalExcelV' value='${intTotalGlobalExcel}' />
                                    <input type='' id='conta_send' name='conta' value='${conta}' />`;
        }
        else {
            elementDate.value = dateConciliacion;
            elementCode.value = codigoCuenta;
            saldoInicialConta.value = saldoInicialContaVal;
            intTotalGlobalExcelV.value = intTotalGlobalExcel;
        }
        const objToSave = await makeObjToSaveConciliacion();
        let arrReturn = await saveObjectByParts(objToSave, 'formSaveConciliacion', urlSave, 'conciliacion_id', 'POST', 2500, strElementsDefault);

        if(arrReturn?.status) {
            await insertLog('Conciliacion completa');
            alert_nova.showNotification('Espera por favor', "add_alert", "success");
            setTimeout(()=> {
                location.reload();
            }, 2000);
        }
        else {
            await insertLog('Error al guardar');
            alert_nova.showNotification(arrReturn.error, "warning", "danger");
        }

        return true;
    }
}

async function makeObjectsTotals() {
    intTotalGlobalMov = 0;
    objGlobalSisTotalesRpt = {10: 0, 20: 0, 30: 0, 40: 0, 50: 0, 60: 0, 70: 0, 80: 0};
    objGlobalExcelTotalesRpt = {10: 0, 20: 0, 30: 0, 40: 0, 50: 0, 60: 0, 70: 0, 80: 0};
    if(Object.keys(objGlobalMovEncabezados).length > 0) {
        objGlobalMovEncabezados.map(d => {
            const intCodigoMov = (d.codigo_movimiento * 1);
            if ( !(typeof d.linea_relacion !== 'undefined' && d.linea_relacion) || (d.no_operar && d.periodo == '0')) {
                let intTotal = 0;
                if(typeof d.valor == 'string')
                    intTotal = d.valor.replaceAll(',', '');
                intTotal = parseFloat(d.valor);
                if (typeof objGlobalSisTotalesRpt[intCodigoMov] !== 'undefined') {
                    if (intCodigoMov === 10 || intCodigoMov === 30 || intCodigoMov === 60 || intCodigoMov === 80)
                        objGlobalSisTotalesRpt[intCodigoMov] -= intTotal;
                    else if (intCodigoMov === 20 || intCodigoMov === 40 || intCodigoMov === 50 || intCodigoMov === 70)
                        objGlobalSisTotalesRpt[intCodigoMov] += intTotal;
                }
            }
            if(d.periodo == '1'){
                if (intCodigoMov === 10 || intCodigoMov === 30 || intCodigoMov === 60 || intCodigoMov === 80)
                    intTotalGlobalMov -= parseFloat( (d.valor.replaceAll(',', '')) );
                else if (intCodigoMov === 20 || intCodigoMov === 40 || intCodigoMov === 50 || intCodigoMov === 70)
                    intTotalGlobalMov += parseFloat( (d.valor.replaceAll(',', '')) );
            }
        });
    }
    objGlobalSisTotalesRpt[10] = objGlobalSisTotalesRpt[10] + objGlobalSisTotalesRpt[50];

    if(Object.keys(objGlobalInfoDocument).length > 0) {
        objGlobalInfoDocument.map(data => {
            const intCodigoMov = data.codigo_mov;
            if ( !(typeof data.linea_relacion !== 'undefined' && data.linea_relacion) ) {
                if (data.fecha !== '') {
                    if (typeof objGlobalExcelTotalesRpt[intCodigoMov] !== 'undefined') {
                        if (intCodigoMov === 10 || intCodigoMov === 30 || intCodigoMov === 60 || intCodigoMov === 80)
                            objGlobalExcelTotalesRpt[intCodigoMov] -= parseFloat(data.debito);
                        else if (intCodigoMov === 20 || intCodigoMov === 40 || intCodigoMov === 70)
                            objGlobalExcelTotalesRpt[intCodigoMov] += parseFloat(data.credito);
                    }
                }
            }
        });
    }
    
    return true;
}

function makePrintConciliacion() {
    let dateConciliacion = document.getElementById('fecha_fin').value,
        codigoCuenta = document.getElementById('cuenta').value,
        conta = document.getElementById('conta').value,
        element = '';

    if(typeof intTotalGlobalExcel == 'string')
        intTotalGlobalExcel = intTotalGlobalExcel.replaceAll(',', '');

    intTotalGlobalExcel = parseFloat(intTotalGlobalExcel);
    intTotalGlobalExcel = intTotalGlobalExcel.toFixed(2);
    let totalCheques = objGlobalSisTotalesRpt['10'].toFixed(2),
        totalDepBanco = objGlobalSisTotalesRpt['20'].toFixed(2),
        totalNDBanco = objGlobalSisTotalesRpt['30'].toFixed(2),
        totalDepanulados = objGlobalSisTotalesRpt['60'].toFixed(2),
        totalNCBanco = objGlobalSisTotalesRpt['40'].toFixed(2),
        totalDepConta = objGlobalExcelTotalesRpt['20'].toFixed(2),
        totalNDConta = objGlobalExcelTotalesRpt['30'].toFixed(2),
        totalNCConta = objGlobalExcelTotalesRpt['40'].toFixed(2),
        saldoInicialConta = ( (intTotalGlobalMov * 1) +  (intSaldoInicial * 1)).toFixed(2),
        totalConta = ( (saldoInicialConta * 1) + (totalDepConta * 1) + (totalNCConta * 1) + (totalNDConta * 1) + (totalDepanulados * 1)).toFixed(2),
        totalBanco = ( (intTotalGlobalExcel * 1) + (totalCheques * 1) + (totalDepBanco * 1) + (totalNDBanco * 1) + (totalNCBanco * 1) ).toFixed(2);

    element += `<input type='hidden' id='date_send_print' name='date' value='${dateConciliacion}' />
                <input type='hidden' id='code_send_print' name='codigoCuenta' value='${codigoCuenta}' />
                <input type='hidden' id='conta_send_print' name='conta' value='${conta}' />

                <input type='hidden' name='intSaldoInicial' value='${intSaldoInicial}' />
                <input type='hidden' name='saldoInicialConta' value='${saldoInicialConta}' />
                <input type='hidden' name='intTotalGlobalExcel' value='${intTotalGlobalExcel}' />

                <input type='hidden' name='totalCheques' value='${totalCheques}' />
                <input type='hidden' name='totalDepBanco' value='${totalDepBanco}' />
                <input type='hidden' name='totalNDBanco' value='${totalNDBanco}' />
                <input type='hidden' name='totalNCBanco' value='${totalNCBanco}' />
                <input type='hidden' name='totalDepConta' value='${totalDepConta}' />
                <input type='hidden' name='totalNDConta' value='${totalNDConta}' />
                <input type='hidden' name='totalNCConta' value='${totalNCConta}' />
                <input type='hidden' name='totalConta' value='${totalConta}' />
                <input type='hidden' name='totalBanco' value='${totalBanco}' />`;

    document.getElementById('formRpt').innerHTML += element;

    document.getElementById('formRpt').submit();
    makePrintReportes();
}

async function makePrintReportes() {
    open_loading();
    const content = document.getElementById('contentFormReports');
    let dateConciliacion = document.getElementById('fecha_fin').value,
        codigoCuenta = document.getElementById('cuenta').value,
        conta = document.getElementById('conta').value;
    for(let key in objReportes) {
        let strReport = objReportes[key].name;
        let element = ` <input type='hidden' name='date' value='${dateConciliacion}' />
                        <input type='hidden' name='codigoCuenta' value='${codigoCuenta}' />
                        <input type='hidden' name='report' value='${strReport}'>
                        <input type='hidden' name='conta' value='${conta}' />`;
        content.innerHTML = element;
        let boolHasContent = await drawFormsToReport(strReport);
        if(boolHasContent)
            document.getElementById('formReports').submit();
    }
    close_loading();
}

async function drawFormsToReport(strReport) {
    let intDetailPrint = 0;
    if(strReport == 'circulacion') {
        intDetailPrint = await makeFormReport(objGlobalMovEncabezados, 10, 50);
    }
    else if(strReport == 'anulado') {
        intDetailPrint = await makeFormReport(objGlobalMovEncabezados, 50);
    }
    else if(strReport == 'dep_banco') {
        intDetailPrint = await makeFormReport(objGlobalMovEncabezados, 20);
    }
    else if(strReport == 'dep_conta') {
        intDetailPrint = await makeFormReport(objGlobalInfoDocument, 20);
    }
    else if(strReport == 'nc_banco') {
        intDetailPrint = await makeFormReport(objGlobalMovEncabezados, 40);
    }
    else if(strReport == 'nc_conta') {
        intDetailPrint = await makeFormReport(objGlobalInfoDocument, 40);
    }
    else if(strReport == 'nd_banco') {
        intDetailPrint = await makeFormReport(objGlobalMovEncabezados, 30);
    }
    else if(strReport == 'nd_conta') {
        intDetailPrint = await makeFormReport(objGlobalInfoDocument, 30);
    }
    else if(strReport == 'dep_anulado') {
        intDetailPrint = await makeFormReport(objGlobalMovEncabezados, 60);
    }

    return (intDetailPrint > 0);
}

async function orderObjByDates(objSearch) {
    objSearch.sort( (a, b) => {
        if(typeof a.fecha !== 'object')
            if (typeof a.fecha == 'string')
                a.fecha = new Date(a.fecha);
            if (typeof b.fecha == 'string')
                b.fecha = new Date(b.fecha);
        return b.fecha + a.fecha;
    });
    return objSearch;
}

async function makeFormReport(objSearch, intCode, intSearchRemove = 0, boolObject = false, strContent ='') {
    const content = (strContent) ? document.getElementById(`${strContent}`) : document.getElementById('contentFormReports');
    let element = '',
        intTotal = intDetail = 0,
        objTMPReturn = [],
        objTMP = await orderObjByDates(objSearch);

    objTMP.map(data => {
        let boolDone = false,
            strDatePrint = '',
            intCodigoMov = (typeof data.codigo_movimiento == 'undefined') ? data.codigo_mov : data.codigo_movimiento;
        if(typeof data.fecha !== 'undefined' && intCodigoMov == intCode &&
            typeof data.linea_relacion == 'undefined') {
            if(typeof data['fecha'] == 'object'){
                try {
                    let strDay = data['fecha'].getDate(),
                        strMonth = data['fecha'].getMonth(),
                        strYear = data['fecha'].getFullYear();
                    let strDate = `${strDay}/${strMonth+1}/${strYear}`;
                    strDatePrint = strDate;
                } catch (error) {
                    strDatePrint = data.fecha;
                }
            }
            else
                strDatePrint = data.fecha;
            
            if(intSearchRemove > 0) {
                let objExist = objSearch.filter(d => (!boolDone && typeof d.fecha !== 'undefined' && d.codigo_movimiento == intSearchRemove));

                objExist.map(d => {
                    if(d?.no_cheque_fisico && !boolDone) {
                        if(d.no_cheque_fisico == data.no_cheque_fisico) {
                            boolDone = true;
                            return false;
                        }
                    }
                });
            }

            if(boolDone)
                return false;

            let num_solicitud = (typeof data.no_cheque_fisico !== 'undefined') ? data.no_cheque_fisico : data.documento
                nombre = (typeof data.nombre !== 'undefined') ? data.nombre : data.descripcion,
                valor = (typeof data.valor !== 'undefined') ? data.valor : ( ( (data.debito * 1) > 0 ) ? data.debito : data.credito );
            intTotal += (valor * 1);
            if(boolObject)
                objTMPReturn.push({
                    'fecha': data.fecha,
                    'fecha_print': strDatePrint,
                    'numero': num_solicitud,
                    'descripcion': nombre,
                    'monto': valor,
                });

            element += `<input type='hidden' name='fecha[]' value='${strDatePrint}' />
                        <input type='hidden' name='numero[]' value='${num_solicitud}' />
                        <input type='hidden' name='descripcion[]' value='${nombre}' />
                        <input type='hidden' name='monto[]' value='${valor}' />`;
            intDetail++;
        }
    });
    element += `<input type='hidden' name='total' value=${intTotal} />`;
    content.innerHTML += element;
    return (boolObject) ? objTMPReturn : intDetail;
}

function resumenConciliacion() {
    if(boolGlobalComparado)
        showResumen();
    else {
        if(Object.keys(objGlobalMovEncabezados).length >= 0)
            showResumen();
        else
            alert_nova.showNotification("No puedes ver el resumen sin haber comparado", "warning", "danger");
    }
}

async function showResumen() {
    open_loading();
    await makeObjectsTotals();
    document.getElementById('modal-header-title').innerHTML = 'Este es el resumen de la conciliacion';
    const modal = document.getElementById('modal-body-relacion');
    if(typeof intTotalGlobalExcel == 'string') {
        intTotalGlobalExcel = intTotalGlobalExcel.replaceAll(',', '');
    }
    intTotalGlobalExcel = parseFloat(intTotalGlobalExcel);
    intTotalGlobalExcel = intTotalGlobalExcel.toFixed(2);
    let totalCheques = objGlobalSisTotalesRpt['10'].toFixed(2),
        totalDepBanco = objGlobalSisTotalesRpt['20'].toFixed(2),
        totalNDBanco = objGlobalSisTotalesRpt['30'].toFixed(2),
        totalNCBanco = objGlobalSisTotalesRpt['40'].toFixed(2),
        totalDepAnulados = objGlobalSisTotalesRpt['60'].toFixed(2),
        totalDepConta = objGlobalExcelTotalesRpt['20'].toFixed(2),
        totalNDConta = objGlobalExcelTotalesRpt['30'].toFixed(2),
        totalNCConta = objGlobalExcelTotalesRpt['40'].toFixed(2),
        saldoInicialConta = ( (intTotalGlobalMov * 1) +  (intSaldoInicial * 1)).toFixed(2),
        totalConta = ( (saldoInicialConta * 1) + (totalDepConta * 1) + (totalNCConta * 1) + (totalNDConta * 1) + (totalDepAnulados * 1) ).toFixed(2),
        totalBanco = ( (intTotalGlobalExcel * 1) + (totalCheques * 1) + (totalDepBanco * 1) + (totalNDBanco * 1) + (totalNCBanco * 1) ).toFixed(2),
        strClassResumen = (totalConta == totalBanco) ? 'done-conciliacion' : 'bad-conciliacion',
        boolDoneConciliacion = ((totalConta * 1) == (totalBanco * 1)) ? true : false;

    let strResumeLog = (strClassResumen == 'done-conciliacion') ? 'Vio resumen cuadrado' : 'Vio resumen descuadrado';
    await insertLog(strResumeLog);
    const table = ` <div class='container'>
                        <div class='row'>
                            <div class='col-12 col-md-5'>
                                <table class='table table-bordered'>
                                    <thead>
                                        <tr> <th colspan='2'> <p style='text-align: center;'>Saldos contabilidad</p> </th> </tr>
                                        <tr>
                                            <th> <p style='text-align: center;'>Inicial</p> </th>
                                            <th> <p style='text-align: center;'>Final (Conciliación)</p> </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style='text-align: center;'>${numberFormat.format(intSaldoInicial)}</td>
                                            <td style='text-align: center;'>${numberFormat.format(saldoInicialConta)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table class='table table-bordered'>
                                    <thead>
                                        <tr> <th> <p style='text-align: center;'>Saldo banco</p> </th> </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style='text-align: center;'>${numberFormat.format(intTotalGlobalExcel)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class='col-12 col-md-7'>
                                <table class='table table-bordered tbl-detail-resume-modal'>
                                    <thead> <tr> <th>Descripcion</th> <th>Conta</th> <th>Banco</th> </tr> </thead>
                                    <tbody>
                                        <tr onclick='drawDetailSaldosIniciales()' class='trDetailSelected'>
                                            <td> <p>Saldos</p> </td>
                                            <td> <p class='strResumenSaldos'>${numberFormat.format(saldoInicialConta)}</p> </td>
                                            <td> <p class='strResumenSaldos'>${numberFormat.format(intTotalGlobalExcel)}</p> </td>
                                        </tr>
                                        <tr onclick='drawDetailResumeInvoices(10, 50)' class='trDetailSelected'>
                                            <td> <p>Cheques en circulación</p> </td>
                                            <td> <p class='strResumenSaldos'>0.00</p> </td>
                                            <td> <p class='strResumenSaldos'>${numberFormat.format(totalCheques)}</p> </td>
                                        </tr>
                                        <tr onclick='drawDetailResumeInvoices(20)' class='trDetailSelected'>
                                            <td> <p>(+) Depósitos banco</p> </td>
                                            <td> <p class='strResumenSaldos'>0.00</p> </td>
                                            <td> <p class='strResumenSaldos'>${numberFormat.format(totalDepBanco)}</p> </td>
                                        </tr>
                                        <tr onclick='drawDetailResumeInvoices(30)' class='trDetailSelected'>
                                            <td> <p>(-) Notas debito banco</p> </td>
                                            <td> <p class='strResumenSaldos'>0.00</p> </td>
                                            <td> <p class='strResumenSaldos'>${numberFormat.format(totalNDBanco)}</p> </td>
                                        </tr>
                                        <tr onclick='drawDetailResumeInvoices(40)' class='trDetailSelected'>
                                            <td> <p>(-) Notas credito banco</p> </td>
                                            <td> <p class='strResumenSaldos'>0.00</p> </td>
                                            <td> <p class='strResumenSaldos'>${numberFormat.format(totalNCBanco)}</p> </td>
                                        </tr>
                                        <tr onclick='drawDetailResumeInvoicesConta(20)' class='trDetailSelected'>
                                            <td> <p>(+) Depósitos conta</p> </td>
                                            <td> <p class='strResumenSaldos'>${numberFormat.format(totalDepConta)}</p> </td>
                                            <td> <p class='strResumenSaldos'>0.00</p> </td>
                                        </tr>
                                        <tr onclick='drawDetailResumeInvoicesConta(30)' class='trDetailSelected'>
                                            <td> <p>(-) Notas debito conta</p> </td>
                                            <td> <p class='strResumenSaldos'>${numberFormat.format(totalNDConta)}</p> </td>
                                            <td> <p class='strResumenSaldos'>0.00</p> </td>
                                        </tr>
                                        <tr onclick='drawDetailResumeInvoicesConta(40)' class='trDetailSelected'>
                                            <td> <p>(+) Notas credito conta</p> </td>
                                            <td> <p class='strResumenSaldos'>${numberFormat.format(totalNCConta)}</p> </td>
                                            <td> <p class='strResumenSaldos'>0.00</p> </td>
                                        </tr>
                                        <tr onclick='drawDetailResumeInvoices(60)' class='trDetailSelected'>
                                            <td> <p>(-) Depositos Anulados Conta</p> </td>
                                            <td> <p class='strResumenSaldos'>${numberFormat.format(totalDepAnulados)}</p> </td>
                                            <td> <p class='strResumenSaldos'>0.00</p> </td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr class='${strClassResumen}'>
                                            <td>Total</td>
                                            <td> <p class='totals-resume'>${numberFormat.format(totalConta)}</p> </td>
                                            <td> <p class='totals-resume'>${numberFormat.format(totalBanco)}</p> </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class='container'>
                        <div class='row' id='contentDetailInvoicesResume'>
                        </div>
                    </div>`;
    modal.innerHTML = table;

    if(boolDoneConciliacion) {
        button = `  <button class="btn btn-success" type="button" id="btnSave" style='margin: 0 10px;'>
                        <i class="material-icons">
                            save_alt
                        </i>
                        Conciliar
                    </button>
                    <button class='btn btn-success' type='button' id='btnReportes'>
                        <i class="material-icons">
                            print
                        </i>
                        Imprimir Reportes
                    </button>`;
        document.getElementById('modal-footer-relacion').innerHTML = button;
        document.getElementById('btnSave').addEventListener('click', () => {
            dialogConfirm(saveConciliacion, false, '¿Estás seguro?', `Este proceso tomará varios minutos <br> ¡No salgas ni recargues por favor!`);
        });

        document.getElementById('btnReportes').addEventListener('click', () => {
            makePrintConciliacion();
        });
    }
    else {
        let button = `  <button class="btn btn-danger" type="button" disabled>
                            <i class="material-icons">
                                error
                            </i>
                            Saldos No Cuadran
                        </button>`;
        document.getElementById('modal-footer-relacion').innerHTML = button;
    }
    $(`#modalRelacion`).modal();
    close_loading();
}

async function drawDetailResumeInvoices(intCode, intSecondCode = 0) {
    const content = document.getElementById('contentDetailInvoicesResume');
    content.innerHTML = '';
    let objMV = [];
    objMV = await makeFormReport(objGlobalMovEncabezados, intCode, intSecondCode, true);
    drawResumeContentInvoices(objMV, content);
}

async function drawDetailResumeInvoicesConta(intCode, intSecondCode = 0) {
    const content = document.getElementById('contentDetailInvoicesResume');
    content.innerHTML = '';
    let objMV = [];
    objMV = await makeFormReport(objGlobalInfoDocument, intCode, intSecondCode, true);
    drawResumeContentInvoices(objMV, content);
}

function drawResumeContentInvoices(objMV, content) {
    let strElements = '';
    if(Object.keys(objMV).length > 0)
        objMV.map(d => {
            let strDate = '';
            try {
                let strDay = d['fecha'].getDate(),
                    strYear = d['fecha'].getFullYear(),
                    strMonth = d['fecha'].getMonth();
                strDate = `${strDay}/${strMonth + 1}/${strYear}`;
            } catch (error) {
                strDate = d['fecha'];
            }
            strElements += `<tr>
                                <td>${d.numero}</td>
                                <td>${d.descripcion}</td>
                                <td>${strDate}</td>
                                <td>${numberFormat.format(d.monto)}</td>
                            </tr>`;
        });
    else
        strElements = `<tr><td colspan='4' style='text-align:center;'>No se encontraron resultados</td></tr>`;

    content.innerHTML = `   <table class='table table-bordered'>
                                <thead>
                                    <tr>
                                        <th>Documento</th>
                                        <th>Descripcion</th>
                                        <th>Fecha</th>
                                        <th>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>${strElements}</tbody>
                            </table>`;
    content.scrollIntoView({ behavior: 'smooth' });
}

function drawDetailSaldosIniciales() {
    const content = document.getElementById('contentDetailInvoicesResume');
    content.innerHTML = `   <table class='table table-bordered'>
                                <thead>
                                    <tr>
                                        <th>Saldo Inicial Contabilidad</th>
                                        <th>Total en Movimientos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>${numberFormat.format(intSaldoInicial)}</td>
                                        <td>${numberFormat.format(intTotalGlobalMov)}</td>
                                    </tr>
                                </tbody>
                            </table>`;
    content.scrollIntoView({ behavior: 'smooth' });
}
