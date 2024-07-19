let objQuotations = [],
    objGlobalDetailQuotation = [],
    objResidualProducts = [],
    objGlobalLots = [],
    objGlobalProductsFulled = [],
    objGlobalProductsSolicited = [],
    objGlobalDestinationCellars = [],
    objDataCarriers = [],
    intGlobalSolicited = 0;

const des = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
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

const changeBackgroundSize = async (intPercentage) => {
    // por algun montivo no funciona el crearlo con comillas inversas (``)
    let strSize = intPercentage + "% 100%";
    document.getElementById('rect').style.backgroundSize = strSize;
    document.getElementById('text-percentage').innerHTML = `${intPercentage}%`;
    return true;
};

const showAllLots = async () => {
    await objGlobalLots.map(detail => {
        let contentLot = document.getElementById(`contentLot_${detail.NoLote}`),
            tdResidualLot = document.getElementById(`td-content-residual-lot-${detail.NoLote}`);

        if(contentLot)
            contentLot.style.display = 'block';

        if(tdResidualLot)
            tdResidualLot.innerHTML = numberFormat.format((detail.ExistenciaLote * 1).toFixed(2));
    });
    return true;
};

const makeFormSaveContainers = async () => {
    open_loading();
    const formElement = document.getElementById('formNewContainer');
    let formData = new FormData(formElement);
    formData.append('csrfmiddlewaretoken', document.getElementsByName('csrfmiddlewaretoken')[0].value);
    let numberContainer = document.getElementById('inputContainer').value,
        int_container = document.getElementById('inputCOrigen').value,
        intCarrier = document.getElementById('carrier').value,
        quotation = document.getElementById('globalSelectedQuotation').value,
        boolError = false;
    console.log(int_container, 'int_container');
    if(numberContainer == '' && !boolError) {
        boolError = true;
        document.getElementById('inputContainer').style.background = 'linear-gradient(0deg,#f44336 2px,rgba(244,67,54,0) 0),linear-gradient(0deg,#d2d2d2 1px,hsla(0,0%,82%,0) 0)';
        alert_nova.showNotification('Debes de ingresar un numero de contenedor trasegado', 'warning', 'danger');
    }
    else {
        document.getElementById('inputContainer').style.background = '';
    }

    if(int_container == '' && !boolError) {
        boolError = true;
        document.getElementById('inputCOrigen').style.background = 'linear-gradient(0deg,#f44336 2px,rgba(244,67,54,0) 0),linear-gradient(0deg,#d2d2d2 1px,hsla(0,0%,82%,0) 0)';
        alert_nova.showNotification('Debes de ingresar un numero de contenedor origen', 'warning', 'danger');
    }
    else {
        document.getElementById('inputCOrigen').style.background = '';
    }

    if(intCarrier == '' && !boolError) {
        boolError = true;
        document.getElementById('input_list_carrier').style.background = 'linear-gradient(0deg,#f44336 2px,rgba(244,67,54,0) 0),linear-gradient(0deg,#d2d2d2 1px,hsla(0,0%,82%,0) 0)';
        alert_nova.showNotification('Debes de ingresar un transportista', 'warning', 'danger');
    }
    else {
        document.getElementById('input_list_carrier').style.background = '';
    }


    if (!boolError) {
        let objExist = objGlobalLots.find(d => d.LoteProduccion == int_container);
        if (!objExist?.NoLote) {
            if(Object.keys(objGlobalLots).length > 0)
                objExist = objGlobalLots[0];
            else
                objExist = {
                    'NoLote': '1010101',
                    'LoteProduccion': '1010101',
                    'NoEmpresa': objGlobalDetailQuotation.NoEmpresa,
                    'NoProducto': objGlobalDetailQuotation.NoProducto,
                    'Cantidad': '58000'
                };
        }
        
        if(objExist?.NoLote) {
            formData.append('number_container', numberContainer);
            formData.append('int_container', int_container);
            formData.append('quotation', quotation);
            formData.append('int_lot', objExist.NoLote);
            formData.append('str_lot_production', objExist.LoteProduccion);
            formData.append('no_empresa', objExist.NoEmpresa);
            formData.append('no_producto', objExist.NoProducto);
            formData.append('int_cantidad', objExist.Cantidad);
            formData.append('carrier', intCarrier);
            const response = await fetch(`${urlSaveContainers}`, { method: 'POST', body: formData, });
            const data = await response.json();
            if(data.status) {
                alert_nova.showNotification(data.message, 'add_alert', 'success');
                setTimeout(() => { location.reload(); }, 3000);
            }
            else
                alert_nova.showNotification(data.message, 'warning', 'danger');
        }
        else
            alert_nova.showNotification('Error inesperado, contacta con soporte.', 'warning', 'danger');
    }
    
    close_loading();
};

const drawRowsCompleteProduct = async () => {
    let boolDrawButtonSave = false,
        intProductsFulled = 0;
    objGlobalProductsFulled.map(detail => {
        if(detail){
            let tr = document.getElementById(`tr-required-${detail.CodigoProducto}`);
            if(tr) {
                tr.classList.remove('tr-showing');
                tr.classList.add('tr-complete');
            }
        }
    });

    let boolDrawWhatever = false,
        contentButton = document.getElementById('cntButtonSave'),
        trSelected = '';
    objGlobalProductsSolicited.map(detail => {
        let objExist = objGlobalProductsFulled.find(d => detail.CodigoProducto == d.CodigoProducto);
        if(!objExist) {
            boolDrawWhatever = true;
            trSelected = detail.CodigoProducto;
        }
        else {
            intProductsFulled = (intProductsFulled * 1) + (objExist.Cantidad * 1);
        }
    });

    let tr = document.getElementById(`tr-required-${trSelected}`);
    if(tr) {
        tr.click();
        // await onlyHideLotsExistence();
    }

    if(intGlobalSolicited == intProductsFulled) { boolDrawButtonSave = true; }
    if(!boolDrawWhatever) { contentLotsExist.innerHTML = ''; }

//    if(boolDrawButtonSave) {
//    contentButton.innerHTML = ` <div class="col text-center">
//                                    <button class="btn btn-outline-primary" id='btnSave'>
//                                        <i class="fa fa-save"></i>
//                                        Guardar
//                                    </button>
//                                </div>`;
//    const button = document.getElementById('btnSave');
//    if(button) {
//        button.addEventListener('click', () => {
//            makeFormSaveContainers();
//        });
//    }
//    }
};

const makeProductComplete = async () => {
    objGlobalProductsSolicited.map(async (d) => {
        let objExists = objResidualProducts.filter(detail => detail.code_product == d.CodigoProducto),
            intQuantity = 0;
        if(objExists) {
            objExists.map(detail => {
                intQuantity += (detail.quantity * 1);
            });

            let intResidual = (d.Cantidad * 1) - (intQuantity * 1);
            if(intResidual <= 0) {
                const objExist = objGlobalProductsFulled.find(detail => detail.CodigoProducto == d.CodigoProducto);
                if(!objExist) {
                    await objGlobalProductsFulled.push(d);
                }
                await drawRowsCompleteProduct();
            }
        }
    });
};

const onlyHideLotsExistence = async () => {
    await objResidualProducts.map(async (detail) => {
        let objLotExist = objGlobalLots.find(d => d.NoLote == detail.no_lot);
        if(objLotExist) {
            let intDifference = (objLotExist.ExistenciaLote * 1) - (detail.quantity * 1);
            if(intDifference <= 0) {
                let elementContentLot = document.getElementById(`contentLot_${objLotExist.NoLote}`);
                if(elementContentLot)
                    elementContentLot.style.display = 'none';
            }
            else {
                intDifference = numberFormat.format( (intDifference * 1).toFixed(2) );
                let tdResidualLot = document.getElementById(`td-content-residual-lot-${objLotExist.NoLote}`);
                if(tdResidualLot)
                    tdResidualLot.innerHTML = intDifference;
            }
        }
    });
    return true;
};

const validateLotsExistence = async () => {
    await showAllLots();
    await onlyHideLotsExistence();
    return await makeProductComplete();
};

const drawPercentageTruck = async () => {
    let intUsage = 0;
    objResidualProducts.map(detail => {
        intUsage = (intUsage * 1) + (detail.quantity * 1);
    });
    let intPercentage = (((intUsage / intCapacity) * 100).toFixed(0) * 1);
    return await changeBackgroundSize(intPercentage);
};

const deleteLot = async (intNoLot) => {
    let objLotDelete = null;
    objResidualProducts.map((detail, key) => {
        if(detail.no_lot === intNoLot) {
            objLotDelete = detail;
            objResidualProducts.splice(key, 1);
        }
    });
    for(const k in objGlobalProductsFulled) {
        const d = objGlobalProductsFulled[k];
        if(d.CodigoProducto == objLotDelete.code_product) {
            objGlobalProductsFulled.splice(k, 1);
        }
    }

    if(objLotDelete) {
        await drawLots(objLotDelete.code_product); // tengo que probar que pasa si no mando a dibujar los lotes
        await drawLotsAdded();
        await drawPercentageTruck();
        await validateLotsExistence();

        let tr = document.getElementById(`tr-required-${objLotDelete.code_product}`);
        if(tr) {
            let trsShowing = document.querySelectorAll('.tr-showing');
            trsShowing.forEach(element => {
                element.classList.remove('tr-showing');
            });

            tr.classList.remove('tr-complete');
            tr.classList.add('tr-showing');
        }
//        document.getElementById('cntButtonSave').innerHTML = '';
    }
    else {
        alert_nova.showNotification('Ocurrió un error al borrar el detalle, contacta con IT.', 'warning', 'danger');
    }
};

const drawLotsAdded = async () => {
    let strTRows = '';
    objResidualProducts.map(detail => {
        strTRows += `   <tr>
                            <td>
                                ${detail.code_product} - ${detail.product}
                                <input type='hidden' name='code_product[]' value='${detail.no_product}'/>
                            </td>
                            <td>
                                ${detail.no_lot}
                                <input type='hidden' name='no_lot[]' value='${detail.no_lot}'/>
                            </td>
                            <td>
                                ${numberFormat.format(detail.quantity * 1)}
                                <input type='hidden' name='quantity[]' value='${detail.quantity}'/>
                                <input type='hidden' name='company[]' value='${detail.company}'/>
                                <input type='hidden' name='lot_production[]' value='${detail.lot_production}'/>
                            </td>
                            <td>
                                <button type="button" class="btn btn-just-icon btn-link btn-danger" onclick='deleteLot("${detail.no_lot}")'>
                                    <i class="fa fa-trash"></i>
                                </button>
                            </td>
                        </tr>`;
    });

    const container = document.getElementById('formNewContainer');
    let table = `   <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>No. Lote</th>
                                <th>Cantidad Utilizada</th>
                                <th>Opciones</th>
                            </tr>
                        </thead>
                        <tbody>${strTRows}</tbody>
                    </table>`;
    container.innerHTML = table;

    let boolDrawTruck = await drawPercentageTruck();
    return boolDrawTruck;
};

const addLot = async (intNoLot) => {
    open_loading();
    const objLot = objGlobalLots.find(detail => detail.NoLote == intNoLot);
    let existenceAdd = (document.getElementById('existence_lot').value).replaceAll(',', '').replaceAll('Q', ''),
        quantityAdd = (document.getElementById('quantity_lot').value).replaceAll(',', '').replaceAll('Q', ''),
        objTMPResidualExist = objResidualProducts.find(detail => detail.code_product == objLot.CodigoProducto);

    if (!objTMPResidualExist) {
        let intResidual = (objLot.ExistenciaLote * 1) - (existenceAdd);
        objResidualProducts.push({
            'code_product': objLot.CodigoProducto,
            'no_product': objLot.NoProducto,
            'company': objLot.NoEmpresa,
            'lot_production': objLot.LoteProduccion,
            'product': objLot.Descripcion,
            'no_lot': intNoLot,
            'quantity': quantityAdd,
            'residual': intResidual,
        });
    }
    else {
        let objPrevAdded = objResidualProducts.filter(detail => detail.code_product == objLot.CodigoProducto),
            intPrevQuantityAdded = 0;
        objPrevAdded.map(detail => {
            intPrevQuantityAdded += (detail.quantity * 1);
        });
        intTotalRest = (objLot.Cantidad * 1) - (intPrevQuantityAdded);
        if(quantityAdd > ((intTotalRest).toFixed(2) * 1)) {
            alert_nova.showNotification('No puede agregar una cantidad mayor a la solicitada', 'warning', 'danger');
        }
        else {
            let objPrevExist = objResidualProducts.find(d => d.no_lot == objLot.NoLote);

            if(!objPrevExist) {
                let intResidual = (objLot.ExistenciaLote * 1) - (existenceAdd);
                objResidualProducts.push({
                    'code_product': objLot.CodigoProducto,
                    'no_product': objLot.NoProducto,
                    'company': objLot.NoEmpresa,
                    'lot_production': objLot.LoteProduccion,
                    'product': objLot.Descripcion,
                    'no_lot': intNoLot,
                    'quantity': quantityAdd,
                    'residual': intResidual,
                });
            }
            else {
                alert_nova.showNotification('Ya has agregado este lote antes, eliminalo para poder volverlo a agregar.', 'warning', 'danger');
            }
        }
    }

    let boolReturn = await drawLotsAdded();
    $('#modalAddLot').modal('hide');
    await validateLotsExistence();
    close_loading();
};

const setLotNewContainer = async (intNoLot) => {
    const objLot = objGlobalLots.find(detail => detail.NoLote == intNoLot);
    let elements = '',
        boolHasError = false,
        intTMPExistence = (objLot.ExistenciaLote * 1),
        intTMPQuantity = (objLot.Cantidad * 1),
        intTotalLot = 0,
        intTotalRest = 0,
        intResidual = 0,
        intPrevQuantityAdded = 0,
        objPrevExist = objResidualProducts.find(detail => detail.code_product == objLot.CodigoProducto);

    if(!objPrevExist) {
        if(intTMPExistence >= intTMPQuantity) {
            intTotalRest = intTMPQuantity;
            intResidual = (intTotalLot * 1) - (intTotalRest * 1);
        }
        else {
            intTotalRest = intTMPExistence;
        }
    }
    else {
        objPrevExist = objResidualProducts.filter(detail => detail.code_product == objLot.CodigoProducto)

        objPrevExist.map(detail => { intPrevQuantityAdded += (detail.quantity * 1); });
        intTotalRest = (objLot.Cantidad * 1) - (intPrevQuantityAdded);
        if((intTotalRest * 1) >= intTMPExistence) {
            intTotalRest = intTMPExistence;
        }
    }

    document.getElementById('modal-body-add-lot').innerHTML = ` <div class="row">
                                                                    <div class='col-12 col-md-6'>
                                                                        <label>Existencia en Lote</label>
                                                                        <input type='text' class="form-control" id='existence_lot' value="${numberFormat.format( (intTMPExistence * 1).toFixed(2) )}" />
                                                                    </div>
                                                                    <div class='col-12 col-md-6'>
                                                                        <label>Cantidad a Rebajar</label>
                                                                        <input type='text' class="form-control" id='quantity_lot' value="${numberFormat.format( (intTotalRest * 1).toFixed(2) )}" />
                                                                    </div>
                                                                </div>`;
    document.getElementById('modal-footer-add-lot').innerHTML = `   <button type='button' class="btn btn-outline-primary" onclick='addLot("${intNoLot}");'>
                                                                        <i class="fa fa-plus-circle"></i>
                                                                        Añadir
                                                                    </button>`;

    $('#modalAddLot').modal('show');

};

const setStyleRowProductRequired = async (code_product) => {
    let trSelected = document.getElementById(`tr-required-${code_product}`),
        allTrs = document.querySelectorAll('.tr-products-required');

    allTrs.forEach(tr => {
        if(tr)
            tr.classList.remove('tr-showing');
    });
    if(trSelected)
        trSelected.classList.add('tr-showing');
    return true;
};

const drawLots = async (code_product) => {
    const objExist = objGlobalProductsFulled.find(detail => detail.CodigoProducto == code_product);
    if(objExist) { return false; }

    let elements = '';
    await setStyleRowProductRequired(code_product);
//    <td rowspan="7">
//        <button type='button' class='btn btn-outline-success' onclick='setLotNewContainer("${detail.NoLote}")'>
//            <i class="fa fa-plus-circle"></i>
//            Agregar
//        </button>
//    </td>
    await objGlobalLots.map(detail => {
        if(detail.CodigoProducto == code_product) {
            elements += `   <div class="col-12 col-md-6 content-lot-detail" id='contentLot_${detail.NoLote}' product='${detail.CodigoProducto}' lot='${detail.NoLote}'>
                                <table class='table table-striped table-detail-lot'>
                                    <thead></thead>
                                    <tbody>
                                        <tr>
                                            <td>Producto:</td>
                                            <td>${detail.CodigoProducto} - ${detail.Descripcion}</td>
                                        </tr>
                                        <tr>
                                            <td>Bodega:</td>
                                            <td>${detail.NoBodega}</td>
                                        </tr>
                                        <tr>
                                            <td>Ubicacion:</td>
                                            <td>${detail.NoUbicacion} - ${detail.DescripcionUbicacion}</td>
                                        </tr>
                                        <tr>
                                            <td>Lote:</td>
                                            <td>${detail.NoLote}</td>
                                        </tr>
                                        <tr>
                                            <td>Contenedor:</td>
                                            <td>${detail.LoteProduccion}</td>
                                        </tr>
                                        <tr>
                                            <td>Fecha de Vencimiento:</td>
                                            <td>${detail.FechaVencimiento}</td>
                                        </tr>
                                        <tr>
                                            <td>Cantidad Disponible:</td>
                                            <td id='td-content-residual-lot-${detail.NoLote}'>${numberFormat.format( (detail.ExistenciaLote * 1).toFixed(2) )}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>`;
        }
    });
    document.getElementById('contentLotsExist').innerHTML = elements;
    return true;
};

const drawProductsInQuotation = async () => {
    const content = document.getElementById('contentProductsQuotation');
    let tmpProducts = '';
    let table = `   <table class="table table-bordered">
                        <thead>
                            <tr class='tr-title-required'>
                                <th>Producto dentro de Cotización</th>
                                <th>Cantidad Solicitada</th>
                            </tr>
                        </thead>
                        <tbody id='tBodyTableProductsRequired'></tbody>
                    </table>`;
    content.innerHTML = table;
    let contentTBody = document.getElementById('tBodyTableProductsRequired');
    await objGlobalLots.map(detail => {
        let objTMPExist = objGlobalProductsSolicited.find(d => d.CodigoProducto == detail.CodigoProducto);
        if(!objTMPExist) {
            intGlobalSolicited = (intGlobalSolicited * 1) + (detail.Cantidad * 1);
            objGlobalProductsSolicited.push(detail);

            contentTBody.innerHTML += ` <tr id='tr-required-${detail.CodigoProducto}' class='tr-products-required' onclick='drawLots("${detail.CodigoProducto}")'>
                                            <td>${detail.CodigoProducto} - ${detail.Descripcion}</td>
                                            <td>${numberFormat.format((detail.Cantidad * 1).toFixed(2))}</td>
                                        </tr>`;
        }
    });

    if(Object.keys(objGlobalProductsSolicited).length > 0) {
        const firstPosition = objGlobalProductsSolicited.slice(0, 1).shift();
        await drawLots(firstPosition.CodigoProducto);
    }
};

const getLots = async (intNoQuotation) => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('quotation', intNoQuotation);
    const response = await fetch(urlGetLots, {method: 'POST', body: formData});
    const data = await response.json();

    if(data.status) {
        objGlobalLots = data.result;
        drawProductsInQuotation();
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
    close_loading();
};

const getOptionsDestinationCellars = async () => {
    let strReturn = '';
    if(Object.keys(objGlobalDestinationCellars).length > 0) {
        objGlobalDestinationCellars.map(detail => {
            strReturn += `<option data-value="${detail.id}">${detail.name}</option>`;
        });
    }
    return strReturn;
};

const setOptionDestinyCellar = async (strValue, strOption) => {
    if(strValue !== '' && !isNaN(strValue)) {
        document.getElementById(strOption).value = strValue;
    }
    else {
        document.getElementById(strOption).value = 0;
        document.getElementById(`input-${strOption}`).value = '';
    }
};

const setOptionsRow = async (strValue, setElementID, strOption) => {
    if(strValue !== '' && !isNaN(strValue)) {
        document.getElementById(setElementID).value = strValue;
    }
    else {
        document.getElementById(setElementID).value = 0;
    }
};

const drawContentLots = async (intNoQuotation) => {
    let strOptions = await getOptionsDestinationCellars();
    let strElementsCarriers = await drawOptionsCarriers();
    document.getElementById('content-lots').innerHTML = `
                            <div class="col-12 col-md-6">
                                <div class="row">
                                    <p class='title-capacity'>Lotes Existentes</p>
                                </div>
                                <div class="row" id="contentLotsExist"></div>
                            </div>
                            <div class="col-12 col-md-6">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="row">
                                            <p class="title-capacity">Capacidad ${numberFormat.format(intCapacity)} lb</p>
                                        </div>
                                        <div class="row">
                                            <table class="table">
                                                <thead></thead>
                                                <tbody>
                                                    <tr class='tr-truck'>
                                                        <td class="td-truck" colspan='2'>
                                                            <div class="form-group">
                                                                <label for='inputContainer' class='bmd-label-floating'>
                                                                    Contenedor <strong>TRASEGADO</strong>
                                                                </label>
                                                                <input class='form-control input-margin' type='text'
                                                                    name='inputContainer' id='inputContainer' />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td class="td-truck" colspan='2'>
                                                            <div class="form-group">
                                                                <label for='inputCOrigen' class='bmd-label-floating'>
                                                                    Contenedor <strong>ORIGEN</strong>
                                                                </label>
                                                                <input class='form-control input-margin' type='text'
                                                                    name='inputCOrigen' id='inputCOrigen' />
                                                            </div>
                                                        </td>    
                                                    </tr>
                                                    <tr>
                                                        <td class="td-truck" colspan='2'>
                                                            <div class="form-group">
                                                                <label for='input_list_carrier' class='bmd-label-floating'>
                                                                    Transportista
                                                                </label>
                                                                <input type="text" class="form-control input-carrier" id="input_list_carrier" list="list_carrier" oninput="setOptionsRow(this.value, 'carrier', 'carrier')" autocomplete="off" required />
                                                                <input name='carrier' type="hidden" id="carrier" />
                                                                <datalist id="list_carrier">
                                                                    ${strElementsCarriers}
                                                                </datalist>
                                                            </div>
                                                        </td>    
                                                    </tr>
                                                    <tr class='tr-truck'>
                                                        <td class="td-truck">
                                                            <div id="truck">
                                                                <div class="rect" id='rect'>
                                                                    <p id="text-percentage" class="text-percentage">0%</p>
                                                                </div>
                                                                <div class="front">
                                                                    <div class="window"></div>
                                                                    <div class="f_hood"></div>
                                                                </div>
                                                                <div class="back_tyres"></div>
                                                                <div class="back_tyres_t"></div>
                                                                <div class="front_tyres"></div>
                                                                <div class="front_tyres_t"></div>
                                                                <div class="front_tyre"></div>
                                                                <div class="hood"></div>
                                                            </div>
                                                        </td>
                                                        <td class="td-truck">
                                                            <div id='contentProductsQuotation'></div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-12" id='cntProductsAggregate'>
                                        <form id='formNewContainer'></form>
                                    </div>
                                </div>
                                <div class="row" id='cntButtonSave'>
                                    <div class="col text-center">
                                        <button class="btn btn-outline-primary" id='btnSave'>
                                            <i class="fa fa-save"></i>
                                            Guardar
                                        </button>
                                    </div>
                                </div>
                            </div>`;
    const button = document.getElementById('btnSave');
    if(button) {
        button.addEventListener('click', () => {
            makeFormSaveContainers();
        });
    }
    getLots(intNoQuotation);
};

const getDestinationCellars = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('no_cellar', 10);
    const response = await fetch(urlGetDestinationCellar, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status)
        objGlobalDestinationCellars = data.data;
    else
        console.error("No se pudieron obtener las bodegas de destino desde los contenedores creados.");
    close_loading();
};

const getProductsByQuotation = async (intNoQuotation) => {
    let objDetailQuotation = objQuotations.find(detail => detail.NoCotizacion == intNoQuotation);
    objGlobalDetailQuotation = objDetailQuotation;
    let intTotal = numberFormat.format((objDetailQuotation.Total * 1).toFixed(2)),
        strPrevDate = new Date(objGlobalDetailQuotation.Fecha),
        strDate = `${strPrevDate.getDate()}/${strPrevDate.getMonth()+1}/${strPrevDate.getFullYear()}`;

    let strElements = ` <div class="col-12 col-md-4 content-detail-quotation" id='content_${objDetailQuotation.NoCotizacion}'>
                            <input type='hidden' value='${objDetailQuotation.NoCotizacion}' name='globalSelectedQuotation' id='globalSelectedQuotation' />
                            <div class='row'>
                                <div class='col-6'>
                                    No. Documento: ${objDetailQuotation.NoDocumento}
                                </div>
                                <div class='col-6'>
                                    Fecha: ${strDate}
                                </div>
                            </div>
                            <div class='row'>
                                <div class='col-12'>
                                    Descripción: ${objDetailQuotation.Observaciones}
                                </div>
                            </div>
                            <div class='row'>
                                <div class='col-12'>
                                    Cliente: ${objDetailQuotation.Nombre}
                                </div>
                            </div>
                        </div>`;
    document.getElementById('contentQuotations').innerHTML = strElements;
    document.getElementById('contentTableResume').innerHTML = '';
    await getDestinationCellars();
    drawContentLots(intNoQuotation);
};

const drawListQuotations = async (objData) => {
    let content = document.getElementById('contentQuotations');

    content.innerHTML = '';
    objData.map(detail => {
        let strPrevDate = new Date(detail.Fecha),
            strDate = `${strPrevDate.getDate()}/${strPrevDate.getMonth()+1}/${strPrevDate.getFullYear()}`,
            intTotal = numberFormat.format((detail.Total * 1).toFixed(2));
        let strElements = `<div class="content-detail-quotation" id='content_${detail.NoCotizacion}' onclick="getProductsByQuotation(${detail.NoCotizacion})">
                                <div class='row'>
                                    <div class='col-6'>
                                        No. Documento: ${detail.NoDocumento}
                                    </div>
                                    <div class='col-6'>
                                        Fecha: ${strDate}
                                    </div>
                                </div>
                                <div class='row'>
                                    <div class='col-12'>
                                        Descripción: ${detail.Observaciones}
                                    </div>
                                </div>
                                <div class='row'>
                                    <div class='col-12'>
                                        Cliente: ${detail.Nombre}
                                    </div>
                                </div>
                            </div>`;
        content.innerHTML += strElements;
    });
};

const clearInfo = async () => {
    intGlobalSolicited = 0;
    objGlobalLots = [];
    objResidualProducts = [];
    objGlobalProductsFulled = [];
    objGlobalDetailQuotation = [];
    objGlobalProductsSolicited = [];
};

const drawTableDetails = async (objData) => {
    const contentGeneral = document.getElementById('contentTableResume');
    let strTable = `<table class='table table-bordered'>
                        <thead class='table-dark'>
                            <tr>
                                <td>Nombre Cliente</td>
                                <td>Total</td>
                            </tr>
                        </thead>
                        <tbody id='table-resume'></tbody>
                    </table>`;
    contentGeneral.innerHTML = strTable;
    let content = document.getElementById('table-resume');
    objData.map(detail => {
        let intTotal = parseFloat(detail.Total),
            strClassRow = 'row-green';
        if(intTotal <= 30000.00)
            strClassRow = 'row-red';
        else if(intTotal <= 45000.00)
            strClassRow = 'row-yellow';
        let strElement = `  <tr class='${strClassRow}'>
                                <td>${detail.nombre}</td>
                                <td>${detail.Total}</td>
                            </tr>`;
        content.innerHTML += strElement;
    });
};

const getQuotations = async () => {
    open_loading();
    clearInfo();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlQuotations, {method: 'POST', body: formData});
    const data = await response.json();


    document.getElementById('contentQuotations').innerHTML = '';
    document.getElementById('content-lots').innerHTML = '';
    if(data.status) {
        objQuotations = data.result;
        objListTable = data.list_table;
        drawTableDetails(data.list_table);
        drawListQuotations(data.result);
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
    close_loading();
};

const drawOptionsCarriers = async () => {
    let strReturn = '';
    objDataCarriers.map(detail => {
        strReturn += `<option data-value="${detail.id}">${detail.name}</option>`;
    });
    return strReturn;
};

const getCarriers = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetCarriers, {method: 'POST', body: formData});
    let data = [];
    try {
        data = await response.json();
    } catch (error) {
        data = [];
    }
    if (data?.status) {
        objDataCarriers = data.data;
    }
    else
        console.error(data.message);
    close_loading();
};

getQuotations();
getCarriers();

