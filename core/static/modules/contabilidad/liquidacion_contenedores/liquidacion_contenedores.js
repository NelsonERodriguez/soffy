const elmSearch = document.getElementById('elmSearch'),
    des = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
let valCSRF = getCookie('csrftoken'),
    intGlobalStepCnts = 1,
    objGlobalProducts = [],
    objGlobalTableReq = [],
    objGlobalHeaders = [],
    objGlobalCurrentCompany = [],
    objGlobalTblsExist = [],
    objKeysProduct = [1,4,5,6];

Object.defineProperty(HTMLInputElement.prototype, 'value', {
    get: function() {
        const value = des.get.call(this);
        if (this.type === 'text' && this.list) {
            const opt = [].find.call(this.list.options, o => o.value === value);
            return opt ? opt.dataset.value : value;
        }
        return value;
    }
});

const getRowLine = async (boolFirst, strClassToSearch) => {
    let intReturn = 0,
        tbls = document.getElementsByClassName(strClassToSearch);
    if(boolFirst)
        intReturn = 1;
    else {
        if(Object.keys(tbls).length > 0) {
            for(const elm of tbls) {
                let tRowAttribute = elm.getAttribute('row');
                intReturn = Math.max(parseInt(tRowAttribute), intReturn);
                intReturn += 1;
            }
        }
        else {
            intReturn = 1;
            console.error('No hay filas con esta clase');
        }
    }
    return intReturn;
};

const validatePrevRow = async (intRowValidate) => {
    let boolReturn = false;
    if(Object.keys(objGlobalTableReq).length > 0 && objGlobalCurrentCompany?.CodigoEmpresa) {
        let intCompany = objGlobalCurrentCompany?.CodigoEmpresa,
            boolError = false;
        objGlobalTableReq.map(d => {
            if(d.Obligatorio && !boolError) {
                let elm = document.getElementById(`input-${intCompany}-${d.NoConcepto}_${intRowValidate}`);
                if(elm && typeof elm === 'object') {
                    elm.style = 'border: none;'
                    let strValue = elm.value;
                    if(strValue.trim() === '') {
                        boolError = true;
                        elm.style = 'border: 1px solid red; border-radius: 10px;';
                        alert_nova.showNotification('Aun te falta información para agregar una fila', 'warning', 'danger');
                    }
                    else {
                        boolError = false;
                        boolReturn = true;
                    }
                }
            }
            else {
                if(boolError)
                    boolReturn = false;
                else
                    boolReturn = true;
            }
        });
    }
    return boolReturn;
};

const addLineTable = async (strCompanyKey) => {
    if (strCompanyKey != "") {
        if(objGlobalCurrentCompany?.orden && objGlobalCurrentCompany.orden == 1) {
            let strClass = '';
            if (strCompanyKey != '') {
                strClass = `trs_tbl_${strCompanyKey}`;
            }
            let intRowValidate = await getRowLine(false, strClass);
            intRowValidate -= 1;

            let boolValidate = await validatePrevRow(intRowValidate);
            if (boolValidate)
                await drawRow(false, strCompanyKey)
        }
        else
            alert_nova.showNotification('Por que quieres agregar una línea asi?', 'warning', 'danger');
    }
    else
            alert_nova.showNotification('No hay empresa válida para agregar línea', 'warning', 'danger');
};

const deleteRow = async (strCompanyKey, intRow, boolExist = false) => {
    open_loading();
    let trExist = document.getElementById(`tr_${strCompanyKey}_${intRow}`);
    if(trExist && typeof trExist === 'object') {
        if(!boolExist) {
            trExist.parentNode.removeChild(trExist);
            close_loading();
        }
        else {
            // tengo que mandar a borrar a la db
            console.log('etsiste');
        }
    }
    else
        alert_nova.showNotification('No existe un elemento válido a eliminar', 'warning', 'danger');
};

const setOptionsRow = async (strValue, strCompanyKey, intName, intKey) => {
    let strID = `list-${strCompanyKey}-${intName}_${intKey}`,
        elm = document.getElementById(strID),
        strNewValue = 0;
    if(elm) {
        if(strValue !== '' && !isNaN(strValue))
            strNewValue = strValue;
        else
            strNewValue = '0';

        elm.value = strNewValue;
        objKeysProduct.map(k => {
            let elmVal = document.getElementById(`list-${strCompanyKey}-${k}_${intKey}`),
                elmShow = document.getElementById(`input-${strCompanyKey}-${k}_${intKey}`);
            if(elmVal && typeof elmVal === 'object')
                elmVal.value = strNewValue;
            
            let objProduct = objGlobalProducts.find(d => d.NoProducto == strNewValue);
            if(elmShow && typeof elmShow === 'object')
                if (objProduct?.Descripcion)
                    elmShow.value = objProduct.Descripcion;
                else
                    elmShow.value = "";
        });
    }
    return true;
};

const getOptionsCompanies = async () => {
    let strReturn = '';
    objGlobalProducts.map(d => {
        strReturn += `<option data-value="${d.NoProducto}">${d.Descripcion}</option>`;
    });
    return strReturn
};

const setOptionRow = async () => {};

const drawRow = async (boolFirstRow = false, strCompanyKey = "", objExist = {}) => {
    let strClass = '';
    if (strCompanyKey != '') {
        strClass = `trs_tbl_${strCompanyKey}`;
    }

    let intRow = 0;
    if(objExist?.Linea) {
        if (objExist['columnas'].length > 0) {
            intRow = objExist.Linea;
            objToDrawColumns = objExist.columnas;
        }
        else
            alert_nova.showNotification('Hay lineas existentes pero error en las columnas.', 'warning', 'danger');
    }
    else {
        intRow = await getRowLine(boolFirstRow, strClass);
        objToDrawColumns = objGlobalTableReq;
    }

    console.log(objToDrawColumns, 'xd');
    if(Object.keys(objToDrawColumns).length > 0) {
        let strTds = '',
            strOptionsCompanies = await getOptionsCompanies();
        objToDrawColumns.map(d => {
            let strType = strOtherConfigs = '',
                strValor = (d?.Valor) ? d.Valor : '',
                intConceptoElm = (d?.NoConcepto) ? d.NoConcepto : 'no-tiene';
            strOtherConfigs = (d?.Obligatorio) ? ' required ' : '';
            
            if(d.Sistema == '1' && (d.NoConcepto == '4' || d.NoConcepto == '5' || d.NoConcepto == '6')) {
                strTds += ` <td>
                                <input type="text" class="form-control"
                                    list="list-${strCompanyKey}-${intConceptoElm}_${intRow}"
                                    id="input-${strCompanyKey}-${intConceptoElm}_${intRow}"
                                    oninput="setOptionsRow(this.value, '${strCompanyKey}', '${intConceptoElm}', ${intRow})"
                                    onchange="setOptionRow('NELSON')"
                                    autocomplete="off" required />
                                <datalist id="list-${strCompanyKey}-${intConceptoElm}_${intRow}">
                                    ${strOptionsCompanies}
                                </datalist>
                            </td>`;
            }
            else {
                if(d.TipoCampo === 'Decimal') {
                    strType = 'number';
                    let strSteps = '';
                    if(d?.Decimales) {
                        strSteps = '0.';
                        for(i=0; i < d.Decimales; i++) { strSteps += '9'; }
                    }
                    strOtherConfigs = ` min='0' step='${strSteps}' `;
                }
                else if(d.TipoCampo === 'Alfanumerico')
                    strType = 'text';
                else if(d.TipoCampo === 'Fecha') {
                    strType = 'date';
                    if(strValor === '')
                        strValor = strDateNow;
                }
                else if(d.TipoCampo === 'Bit') {
                    strType = 'checkbox';
                    strOtherConfigs = '';
                }
                strTds += ` <td>
                                <input id="input-${strCompanyKey}-${intConceptoElm}_${intRow}" class='form-control'
                                    type='${strType}' value='${strValor}' ${strOtherConfigs} />
                            </td>`;
            }
        });
        let strTr = `   <tr class='${strClass}' id='tr_${strCompanyKey}_${intRow}' row='${intRow}'>
                            ${strTds}
                            <td>
                                <button type='button' class='btn btn-just-icon btn-link btn-danger'
                                    id='btnDeleteRow_${strCompanyKey}_${intRow}'>
                                    <i class='fa fa-trash'></i>
                                </button>
                            </td>
                        </tr>`;
        let strBody = document.getElementById(`tBody_${strCompanyKey}`);

        if(typeof strBody === 'object') {
            strBody.insertAdjacentHTML('beforeend', strTr);
            let btn = document.getElementById(`btnDeleteRow_${strCompanyKey}_${intRow}`);
            if(btn && typeof btn === 'object')
                btn.addEventListener('click', async () => {
                    await deleteRow(strCompanyKey, intRow, false);
                });
        }
    }
};

const drawNameCompAndButtonAdd = async (objCompany = {}, strCompanyKey = "", boolFirstAndNoClose = false) => {
    let cntButton = document.getElementById(`cntHeader_${strCompanyKey}`);
    if((cntButton && typeof cntButton === 'object') && strCompanyKey != "") {
        cntButton.innerHTML = '';
        let strCompany = (objCompany?.NombreEmpresa)
                            ? `<p class='strNameCompany'>${objCompany.NombreEmpresa}</p>`
                            : `<p class='strNameNoCompany'>No se puede mostrar el nombre</p>`,
            strButton = (boolFirstAndNoClose)
                            ? ` <button type='button' class='btn btn-link btn-success' id='btnAddLine'>
                                    <i class='fas fa-plus-circle'></i>
                                    Agregar
                                </button>`
                            : '';
        let strElm = `  <div class='col-12 col-md-6 text-left'>
                            ${strCompany}
                        </div>
                        <div class='col-12 col-md-6 text-right' id='cntButtonHeader_${strCompanyKey}'>
                            ${strButton}
                        </div>`;
        cntButton.insertAdjacentHTML('beforeend', strElm);
        if((btnAddLine && typeof btnAddLine === 'object') && boolFirstAndNoClose) {
            btnAddLine.addEventListener('click', () => {
                addLineTable(strCompanyKey);
            });
        }
    }
};

const drawTableByCompany = async (objHeaders, strCompanyKey) => {
    if(Object.keys(objHeaders).length > 0 && strCompanyKey) {
        let strThs = '';
        objHeaders.map(d => {
            let strNombre = (d?.Nombre && d.Nombre !== '') ? d.Nombre : '- - - - -';
            strThs += `<th>${strNombre}</th>`;
        });
        strThs += `<th>Opciones</th>`;

        let tbl = ` <div id='cntOnlyTable_${strCompanyKey}' class='col-12 tblSteps'>
                        <table class='table table-bordered' id='tbl_${strCompanyKey}'>
                            <thead class='table-info'>
                                <tr>${strThs}</tr>
                            </thead>
                            <tbody id='tBody_${strCompanyKey}'></tbody>
                        </table>
                    </div>`;
        let cnt = document.getElementById(`cntTable_${strCompanyKey}`);
        if(typeof cnt === 'object')
            cnt.insertAdjacentHTML('beforeend', tbl);
    }
};

const validateHeadersToSave = async (objData) => {
    let boolError = false,
        strMessage = "",
        arrData = [];
    let objReturn = {
        'status': false,
        'data': [],
        'message': 'No se pudo validar el encabezado'
    }
    if(Object.keys(objData).length > 0) {
        objData.map(d => {
            let elm = document.getElementById(`header-${d.NoConcepto}`),
                strVal = '';
            if (d.Obligatorio && d.TipoCampo != 'Bit') {
                if(elm && typeof elm !== 'undefined') {
                    strVal = elm.value;
                    if(strVal.trim() == "" || strVal == '0') {
                        elm.style = "border: 1px solid red; border-radius: 8px;";
                        boolError = true;
                        strMessage += ` La posición ${d.Nombre} tiene un error. `;
                    }
                    else {
                        arrData[d.NoConcepto] = {
                            'valor': strVal,
                            'concepto': d.NoConcepto
                        }
                        elm.style = "border: none;";
                    }
                }
            }
            else {
                if (d.TipoCampo === 'Bit') {
                    arrData[d.NoConcepto] = {
                        'valor': elm.checked,
                        'concepto': d.NoConcepto
                    };
                }
                else {
                    arrData[d.NoConcepto] = {
                        'valor': elm.value,
                        'concepto': d.NoConcepto
                    };
                }
            }
        });
    }

    if(boolError) {
        objReturn.status = false;
        objReturn.data = [];
        objReturn.message = strMessage;
    }
    else {
        objReturn.status = true;
        objReturn.data = arrData;
        objReturn.message = "Encabezado cumple completamente";
    }
    return objReturn;
};

const validateDetailsToSave = async (boolClose = false) => {
    let objReturn = [],
        boolError = false,
        strClass = '',
        strCompanyKey = objGlobalCurrentCompany?.CodigoEmpresa ? objGlobalCurrentCompany.CodigoEmpresa : '';
    if (strCompanyKey != '')
        strClass = `trs_tbl_${strCompanyKey}`;
    let intMaxRow = await getRowLine(false, strClass),
        intElmByRow = objGlobalTableReq.length;
    for(let iRow = 1; iRow < intMaxRow; iRow++) {
        let intElmtsEmpty = 0,
            objOnlyEmptyRow = [];
        objGlobalTableReq.map(d => {
            let strIdElm = `input-${strCompanyKey}-${d.NoConcepto}_${iRow}`,
                boolElmList = false;
            if(d.Sistema && (d.NoConcepto == '4' || d.NoConcepto == '5' || d.NoConcepto == '6'))
                boolElmList = true;
            
            let strElm = document.getElementById(`${strIdElm}`);
            if(strElm && typeof strElm === 'object') {
                let strValElm = strElm.value;
                if(d.Obligatorio) {
                    if (!strValElm || strValElm.trim() === '' || strValElm == '0') {
                        strElm.style = "border: 1px solid red; border-radius: 8px;";
                        boolError = true;
                        objOnlyEmptyRow.push(strElm);
                        intElmtsEmpty++;
                    }
                    else {
                        strElm.style = "border: none;";
                        // EN EL 'strVal', cuando es list, tengo que poner el id hidden y el text, en show
                        //     strIdElm = `list-${strCompanyKey}-${d.NoConcepto}_${iRow}`;
                        if(typeof objReturn[strCompanyKey] === 'undefined') {
                            let objRowAdd = [];
                            objRowAdd[iRow] = {
                                'row': iRow,
                                'columns': [{
                                    'concepto': d.NoConcepto,
                                    'valor': strElm.value
                                }]
                            };
        
                            objReturn[strCompanyKey] = {
                                'rows': objRowAdd,
                                'company': strCompanyKey
                            };
                        }
                        else {
                            let objTMPCompany = objReturn[strCompanyKey];
                            let objExistRows = objTMPCompany['rows'];
        
                            if(typeof objExistRows[iRow] !== 'undefined') {
                                objExistRows[iRow]['columns'].push({
                                    'concepto': d.NoConcepto,
                                    'valor': strElm.value
                                });
                            }
                            else {
                                objExistRows[iRow] = {
                                    'row': iRow,
                                    'columns': [{
                                        'concepto': d.NoConcepto,
                                        'valor': strElm.value
                                    }]
                                };
                            }
                        }
                    }
                }
            }
        });
        if((intElmByRow == intElmtsEmpty) && !boolClose) {
            boolError = false;
            objOnlyEmptyRow.map(elm => {
                elm.style = "border: none;";
            });
        }
    }

    if (boolError)
        objReturn = [];
    return {
        data: objReturn,
        boolError: boolError
    }
};

const validateAllToSave = async (boolClose = false) => {
    let arrReturn = {
        'status': false,
        'data_header': [],
        'data_body': [],
    }
    let objSaveHeaders = await validateHeadersToSave(objGlobalHeaders);
    if(objSaveHeaders?.status) {
        let objDetailsToSave = await validateDetailsToSave(boolClose);
        if(objDetailsToSave?.boolError && objDetailsToSave.boolError) {
            alert_nova.showNotification('Tus detalles tienen información incompleta', 'warning', 'danger');
        }
        else {
            arrReturn['status'] = true;
            arrReturn['data_header'] = objSaveHeaders['data'];
            arrReturn['data_body'] = objDetailsToSave['data'];
        }
    }
    else {
        alert_nova.showNotification('Primero completa tus encabezados', 'warning', 'danger');
    }
    
    return arrReturn;
};

const makeFormToSave = async (objHeaders, objBody = {}, boolClose = false) => {
    if(Object.keys(objHeaders).length > 0) {
        if (formSave && typeof formSave === 'object') {
            formSave.innerHTML = '';
            let elmts = (boolClose) 
                            ? `<div> <input type='hidden' name='cerrado' value="${boolClose}" /> </div>`
                            : '';
            
            objHeaders.map(d => {
                elmts += `  <div>
                                <input type='hidden' name='conceptos[]' value="${d.concepto}" />
                                <input type='hidden' name='valores[]' value="${d.valor}" />
                            </div>`;
            });

            if(Object.keys(objBody).length > 0) {
                let intCompany = '';
                objBody.map(d => {
                    intCompany = d['company'];
                    d['rows'].map(row => {
                        row['columns'].map(column => {
                            elmts += `  <div>
                                            <input type='hidden'
                                                name='detalle_conceptos[]'
                                                value='${column.concepto}' />
                                            <input type='hidden'
                                                name='detalle_valores[]'
                                                value='${column.valor}' />
                                            <input type='hidden'
                                                name='detalle_lineas[]'
                                                value='${row['row']}' />
                                        </div>`;
                        });
                    });
                });
                elmts += `<div> <input type='hidden' name='empresa' value="${intCompany}" /> </div>`;
            }
            formSave.insertAdjacentHTML('beforeend', elmts);
            return true;
        }
        else
            alert_nova.showNotification('Ocurrio un error fatal en el formuluario a guardar.', 'warning', 'danger');
    }
    else
        alert_nova.showNotification('No puedes guardar por falta de información importante.', 'warning', 'danger');
    return false;
};

const sendToSaveForm = async (boolEdit = false) => {
    open_loading();
    let formData = new FormData(formSave),
        dataReturn = {
            'status': false,
            'liquidacion': 0
        },
        data = [],
        strUrlToGo = '';
    formData.append('csrfmiddlewaretoken', valCSRF);
    if(boolEdit) {
        strUrlToGo = urlSaveEdit;
        let liqToSave = 0;
        if(elmSearch && typeof elmSearch === 'object') {
            let strVal = elmSearch.value;
            if(strVal.trim() != '' && !isNaN(strVal))
                liqToSave = strVal;
        }
        if(liqToSave > 0)
            formData.append('liquidacion', liqToSave);
        else
            return dataReturn;
    }
    else
        strUrlToGo = urlSave;
    
    const response = await fetch(strUrlToGo, {method: 'POST', body: formData});
    try {
        data = await response.json();
    } catch(error) {
        console.error(error);
    }
    close_loading();
    if(data?.status) {
        dataReturn['status'] = true;
        dataReturn['liquidacion'] = data?.liquidacion ? data.liquidacion : 0;
    }

    // NELSON, respuesta para que no recarge
    // dataReturn['status'] = false;
    return dataReturn;
};

const drawBtnClose = async (boolLast, strCompanyKey) => {
    if(!boolLast) {
        let strBtn = `  <div id='cntAllOtherTable' class='col-12 text-center'>
                            <button id='btnCloseTable' type='button' class='btn btn-outline-info'>
                                Cerrar
                                <i class='fas fa-check-circle'></i>
                            </button>
                        </div>`;
        let cnt = document.getElementById(`cntBtnClose_${strCompanyKey}`);
        if(typeof cnt === 'object') {
            cnt.insertAdjacentHTML('beforeend', strBtn)
            if(btnCloseTable && typeof btnCloseTable === 'object') {
                btnCloseTable.addEventListener('click', () => {
                    saveFormGeneral(boolGlobalEdit, true);
                });
            }
        }
    }
    return true;
};

const drawTable = async (objHeaders = {}, objCompany = {}, boolLast = false, boolFirstAndNoClose = false, objDataExist = {}) => {
    const cnt = document.getElementById('cntAllTables');
    if(Object.keys(objHeaders).length > 0) {
        let strCompanyKey = (objCompany?.CodigoEmpresa) ? String(objCompany.CodigoEmpresa) : 0;
        if (strCompanyKey) {
            strCompanyKey = strCompanyKey.trim();
            strCompanyKey = strCompanyKey.replaceAll(' ', '');
        
            let cntElmts = `<div id='cntAllTable_${strCompanyKey}' class='col-12 tblSteps'>
                                <div id='cntHeader_${strCompanyKey}' class='row'></div>
                                <div id='cntTable_${strCompanyKey}' class='row'></div>
                                <div id='cntBtnClose_${strCompanyKey}' class='row'></div>
                            </div>`;
            cnt.insertAdjacentHTML('beforeend', cntElmts);

            await drawNameCompAndButtonAdd(objCompany, strCompanyKey, boolFirstAndNoClose);
            await drawTableByCompany(objHeaders, strCompanyKey);
            await drawBtnClose(boolLast, strCompanyKey);
            

            
            if(objDataExist.length > 0) {
                objDataExist.map(async dLine => {
                    let a = await drawRow(true, strCompanyKey, dLine);
                });
            }
            else {
                // dibujo una vacia por que no tengo nada
                await drawRow(true, strCompanyKey);
            }
        }
        else {
            alert_nova.showNotification('No puedes continuar sin empresa.', 'warning', 'danger');
        }
    }
};

const getTableHeadersDetail = async (boolFirst = true) => {
    open_loading();
    let formData = new FormData(),
        data = [];
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('step', intGlobalStepCnts);
    const response = await fetch(urlGetConfigHeaderDetail, {method: 'POST', body: formData});
    try {
        data = await response.json();
    } catch(error) {
        data = [];
    }
    close_loading();
    if(data?.status) {
        objGlobalTableReq = data?.data;
        let boolLast = data?.bool_last ? data.bool_last : false;
        
        const cnt = document.getElementById('cntAllTables');
        cnt.innerHTML = '';
        objGlobalCurrentCompany = data?.company;
        drawTable(data?.data, data?.company, boolLast, boolFirst, {});
    }
    else {
        intGlobalStepCnts -= 1;
        alert_nova.showNotification(data?.message, 'warning', 'danger');
    }
};

const saveFormGeneral = async (boolEdit = false, boolClose = false) => {
    if(objGlobalCurrentCompany?.orden && (objGlobalCurrentCompany.orden == intGlobalStepCnts)) {
        let objToClose = await validateAllToSave(boolClose);
        if(objToClose?.status) {
            let boolMake = await makeFormToSave(objToClose?.data_header, objToClose?.data_body, boolClose);
            if(boolMake) {
                let arrSave = await sendToSaveForm(boolEdit);

                if(arrSave['status']) {
                    let strNewUrl = urlEditLiquidacion;
                    strNewUrl = strNewUrl.replace('0', arrSave.liquidacion);
                    location.href = strNewUrl;
                }
                else {
                    if(boolEdit)
                        alert_nova.showNotification('No se pudo guardar tu información.', 'warning', 'danger');
                    else
                        alert_nova.showNotification('La edición no se hizo correctamente.', 'warning', 'danger');
                }
            }
        }
    }
};

const makeObjTblsExist = async (objData) => {
    let objReturn = [];
    if(Object.keys(objData).length > 0) {
        objData.map(d => {
            let objCompanyExist = objReturn.find(dd => dd.NoEmpresa == d.NoEmpresa);

            if(objCompanyExist?.NoEmpresa) {
                let objLineaExistInCompany = objCompanyExist['lineas'].find(dd => dd.Linea == d.Linea);
                if(objLineaExistInCompany?.Linea) // se sobre entiende que las columnas solo estan una vez
                    objLineaExistInCompany['columnas'].push(d);
                else
                    objCompanyExist['lineas'].push({
                        Linea: d.Linea,
                        columnas: [d]
                    });
            }
            else
                objReturn.push({
                    NoEmpresa: d.NoEmpresa,
                    NombreEmpresa: d.NombreEmpresa,
                    CodigoEmpresa: d.CodigoEmpresa,
                    orden: d.orden_empresa,
                    Cerrado: d.Cerrado,
                    lineas: [{
                        Linea: d.Linea,
                        columnas: [d]
                    }]
                });
        });
    }
    return objReturn;
};

const drawHeaders = async (objData, boolExist = false) => {
    const cnt = document.getElementById('cntHeaders');
    cnt.innerHTML = '';
    if(Object.keys(objData).length > 0) {
        objData.map(d => {
            let strType = strOtherConfigs = '',
                strValor = (d?.Valor) ? d.Valor : '';

            strOtherConfigs = (d?.Obligatorio) ? ' required ' : '';
            
            if(d.TipoCampo === 'Decimal') {
                strType = 'number';
                let strSteps = '';
                if(d?.Decimales) {
                    for(i=0; i < d.Decimales; i++) { strSteps += '9'; }
                }
                strOtherConfigs = ` min='0' step='0.${strSteps}' `;
            }
            else if(d.TipoCampo === 'Alfanumerico')
                strType = 'text';
            else if(d.TipoCampo === 'Fecha') {
                strType = 'date';
                if(strValor === '')
                    strValor = strDateNow;
            }
            else if(d.TipoCampo === 'Bit') {
                strType = 'checkbox';
                strOtherConfigs = "";
            }
            
            let elmt = `<div class='col-4 col-md-2 cntHeaderDiv'>
                            <p class='text-header'>${d.Nombre}</p>
                            <input id='header-${d.NoConcepto}' class='form-control' type='${strType}' value='${strValor}' ${strOtherConfigs} autocomplete="off" />
                        </div>`;
            cnt.insertAdjacentHTML('beforeend', elmt);
        });

        let strButton = `   <div class='col-12 text-center'>
                                <button class='btn btn-outline-success' id='btnSaveFormGeneral'>
                                    <i class='fa fa-save'></i>
                                    Guardar
                                </button>
                            </div>`;
        
        cnt.insertAdjacentHTML('beforeend', strButton);

        if(btnSaveFormGeneral && typeof btnSaveFormGeneral === 'object')
            btnSaveFormGeneral.addEventListener('click', () => {
                saveFormGeneral(boolGlobalEdit);
            });

        // NELSON esto es para que dibuje (o creo solo obtiene encabezados) por defecto la tabla vacia
        if(!boolExist)
            getTableHeadersDetail();
    }
    else
        alert_nova.showNotification('No hay información a mostrar', 'warning', 'danger');
};

const getConfigsHeader = async () => {
    open_loading();
    let formData = new FormData(),
        data = [];
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetConfigHeader, {method: 'POST', body: formData});
    try {
        data = await response.json();
    } catch(error) {
        data = [];
    }
    close_loading();
    if(data?.status) {
        objGlobalHeaders = data?.data ? data.data : [];
        drawHeaders(data?.data);
    }
    else
        alert_nova.showNotification(data?.message, 'warning', 'danger');
};

const drawAllInfoLiquidacionExist = async (objData) => {
    if(Object.keys(objData).length > 0) {
        objGlobalHeaders = objData?.headers;
        drawHeaders(objData?.headers, true);
        objGlobalTblsExist = await makeObjTblsExist(objData?.details);
        if(Object.keys(objGlobalTblsExist).length > 0) {
            let intQuantityEmpresas = objGlobalTblsExist.length;
            let intCurrentCompany = 1,
                boolFirst = true,
                boolFirstAndNoClose = false;

            const cnt = document.getElementById('cntAllTables');
            cnt.innerHTML = '';

            let boolEmpty = false;
            objGlobalTblsExist.map(d => {
                // NELSON, tengo que saber si es la ultima, para que ya no pueda cerrar
                let boolLast = false;
                if(!boolEmpty) {
                    let objCompany = {
                        CodigoEmpresa: d.CodigoEmpresa,
                        NombreEmpresa: d.NombreEmpresa,
                        orden: d.orden
                    };
    
                    let objDetails = d.lineas;
                    if(objDetails.length > 0) {
                        let objHeaders = objDetails[0].columnas;
                        drawTable(objHeaders, objCompany, boolLast, boolFirst, objDetails);
                        boolFirst = false;
                    }
                    else { // sin lineas, tendre que consultar los encabezados
                        boolEmpty = true;
                        getTableHeadersDetail();
                        return false;
                    }
                }

                
                
                
                // si no tiene lineas, es IMPOSIBLE que este cerrado
                

                let boolCerrado = false;
                
                // if(boolFirstDone) {
                //     boolFirstDone = false;
                // }
                if(intQuantityEmpresas == intCurrentCompany) {
                    if(d.Cerrado) {
                        boolCerrado = true;
                    }
                }
                intCurrentCompany++;
            });

            // dibujar tablas y su logica
            // una logica similar a getTableHeadersDetail();
        }
        else {
            getTableHeadersDetail();
        }
    }
};

const validateLiqExist = async () => {
    open_loading();
    if(elmSearch && typeof elmSearch === 'object') {
        let intLiquidacion = elmSearch.value;
        if(intLiquidacion.trim() != '' && !isNaN(intLiquidacion) && intLiquidacion < 2000000000) {
            let formData = new FormData(),
                data = [];
            formData.append('csrfmiddlewaretoken', valCSRF);
            formData.append('liquidacion', intLiquidacion);
            const response = await fetch(urlGetNoLiquidacionExist, {method: 'POST', body: formData});
            try {
                data = await response.json();
            } catch(error) {
                data = [];
            }
            close_loading();
            if(data?.status) {
                let strNewUrl = urlEditLiquidacion;
                strNewUrl = strNewUrl.replace('0', data.liquidacion);
                location.href = strNewUrl;
            }
            else
                alert_nova.showNotification(data?.message ? data.message : 'Error inesperado en la consulta', 'warning', 'danger');
        }
        else {
            close_loading();
            alert_nova.showNotification('Número de liquidación inválido', 'warning', 'danger');
        }
    }
    else {
        close_loading();
        alert_nova.showNotification('No puedes buscar datos, que intentas?', 'warning', 'danger');
    }
};

const searchData = async () => {
    open_loading();
    if(elmSearch && typeof elmSearch === 'object') {
        let intLiquidacion = elmSearch.value;
        if(intLiquidacion.trim() != '' && !isNaN(intLiquidacion)) {
            let formData = new FormData(),
                data = [];
            formData.append('csrfmiddlewaretoken', valCSRF);
            formData.append('liquidacion', intLiquidacion);
            const response = await fetch(urlGetDataLiquidacion, {method: 'POST', body: formData});
            try {
                data = await response.json();
            } catch(error) {
                data = [];
            }

            close_loading();
            if(data?.status)
                drawAllInfoLiquidacionExist(data?.data);
            else
                alert_nova.showNotification(data?.message, 'warning', 'danger');
        }
        else {
            close_loading();
            alert_nova.showNotification("No es una liquidación válida", 'warning', 'danger');
        }
    }
    else {
        close_loading();
        alert_nova.showNotification('Por qué no puedes buscar datos?', 'warning', 'danger');
    }
};

const getProducts = async () => {
    open_loading();
    let formData = new FormData(),
        data = [];
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetProducts, {method: 'POST', body: formData});
    try {
        data = await response.json();
    } catch(error) {
        data = [];
    }

    close_loading();
    if(data?.status)
        objGlobalProducts = (data?.data) ? data.data : [];
};

getProducts();

if(boolGlobalEdit)
    searchData();