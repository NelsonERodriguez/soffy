let boolInfoDrawed = false,
    objDataShowed = [],
    bntSearch = document.getElementById('btnSearchData'),
    show_only_ordered = document.getElementById('show_only_ordered'),
    filter_date_option = document.getElementById('filter_date_option'),
    boolTranslate = false,
    objStrTitles = {
        'esp': {
            'filters': [
                {
                    'container': 'label_desde',
                    'str_print': 'Buscar Desde',
                },
                {
                    'container': 'label_hasta',
                    'str_print': 'Buscar Hasta',
                },
                {
                    'container': 'label_check',
                    'str_print': 'Solo Pedidos',
                },
                {
                    'container': 'label_filter_date',
                    'str_print': '¿Por Fecha Embarque?',
                },
                {
                    'container': 'btnSearchData',
                    'str_print': `  <i class="fa fa-search"></i>
                                    Buscar`,
                },
            ],
            'principal': [
                '',
                'Fecha Pedido / Producto',
                'Fecha Embarque',
                'Pedidos',
                'Barco',
                'Disponibles',
                'Liberados',
                'Diferencia',
                '% Cumplimiento',
                'Cumplimiento Mensual',
                'Mes Embarque',
            ],
        },
        'en': {
            'filters': [
                {
                    'container': 'label_desde',
                    'str_print': 'From',
                },
                {
                    'container': 'label_hasta',
                    'str_print': 'To',
                },
                {
                    'container': 'label_check',
                    'str_print': 'Only Orders',
                },
                {
                    'container': 'label_filter_date',
                    'str_print': '¿By Shipment Date?',
                },
                {
                    'container': 'btnSearchData',
                    'str_print': `  <i class="fa fa-search"></i>
                                    Search`,
                },
            ],
            'principal': [
                '',
                'Order Date / Product',
                'Shipment Date',
                'Ordered',
                'Ship',
                'Available',
                'Released',
                'Difference',
                '% Compliance',
                'Monthly Compliance',
                'Shipment Month'
            ],
        },
    };;

const makeObjectToDetail = async (objData, boolIgnoreNoOrdered = false) => {
    let objReturn = [];
    if(Object.keys(objData).length > 0) {
        objData.map(detail => {
            let objExist = objReturn.find(d => d.date_ordered == detail.date_ordered);
            let strShip = (detail?.nombre_barco && detail.nombre_barco != 'null') ? detail.nombre_barco : 'No tiene barco';
            detail.nombre_barco = strShip;
            if(boolIgnoreNoOrdered) {
                if((detail.contenedores_pedidos * 1) <= 0)
                    return false;
            }
            if(objExist) {
                let objExistProducts = objExist['products'].find(d => d.producto_id == detail.producto_id && d.descripcion == detail.Descripcion);
                if(objExistProducts) {
                    objExistProducts['ports'].push({
                        'puerto': detail.puerto,
                        'disponibles_puerto': detail.disponibles_puerto,
                        'liberados_puerto': detail.liberados_puerto,
                    });
                }
                else {
                    objExist['products'].push({
                        'barco_viaje_id': detail.barco_viaje_id,
                        'producto_id': detail.producto_id,
                        'descripcion': detail.Descripcion,
                        'nombre_barco': detail.nombre_barco,
                        'contenedores_pedidos': detail.contenedores_pedidos,
                        'contenedores_disponibles': detail.contenedores_disponibles,
                        'contenedores_liberados': detail.contenedores_liberados,
                        'fecha_real_embarque': detail.fecha_real_embarque,
                        'date_ordered': detail.date_ordered,
                        'ports': [{
                            'puerto': detail.puerto,
                            'disponibles_puerto': detail.disponibles_puerto,
                            'liberados_puerto': detail.liberados_puerto,
                        }],
                    });
                }
            }
            else {
                objReturn.push({
                    'date_ordered': detail.date_ordered,
                    'semana': detail.semana,
                    'products': [{
                        'barco_viaje_id': detail.barco_viaje_id,
                        'producto_id': detail.producto_id,
                        'descripcion': detail.Descripcion,
                        'nombre_barco': detail.nombre_barco,
                        'contenedores_pedidos': detail.contenedores_pedidos,
                        'contenedores_disponibles': detail.contenedores_disponibles,
                        'contenedores_liberados': detail.contenedores_liberados,
                        'fecha_real_embarque': detail.fecha_real_embarque,
                        'date_ordered': detail.date_ordered,
                        'ports': [{
                            'puerto': detail.puerto,
                            'disponibles_puerto': detail.disponibles_puerto,
                            'liberados_puerto': detail.liberados_puerto,
                        }],
                    }]
                });
            }
        });
    }
    return objReturn;
};

const hideDetails = async (intPedido, boolPorts = false, intKeyPedido = '') => {
    let collapse = document.getElementsByClassName(`tr-detail-pedido-${intPedido}`);
    if(boolPorts)
        collapse = document.getElementsByClassName(`tr-detail-pedido-ports-${intKeyPedido}-${intPedido}`);
    else {
        let trDetailPorts = document.querySelectorAll(`[class^="tr-detail-pedido-ports-${intPedido}-"]`);
        if(trDetailPorts){
            trDetailPorts.forEach(element => {
                element.classList.remove('hide-me');
                element.classList.add('hide-me');
            });
        }
    }
    for (let i = 0; i < collapse.length; i++) {
        collapse[i].classList.toggle("hide-me");
    }
};

const makePercentageByMonths = async (objData = {}) => {
    if(Object.keys(objData).length > 0) {
        let objResult = [];
        objData.map(detail => {
            let objExist = objResult.find(d => d.month == detail.month),
                intPedidos = intLiberados = 0;
            detail['ships'].map(ship => {
                intPedidos += (ship.contenedores_pedidos * 1);
                intLiberados += (ship.contenedores_liberados * 1);
            });
            if(objExist?.month) {
                objExist['total_pedidos'] += intPedidos;
                objExist['total_liberados'] += intLiberados;
            }
            else {
                objResult.push({
                    'month': detail.month,
                    'total_pedidos': intPedidos,
                    'total_liberados': intLiberados,
                });
            }
        });

        if(Object.keys(objResult).length > 0) {
            objResult.map(detail => {
                let intPercentage = ((detail.total_liberados / detail.total_pedidos) * 100).toFixed(0);
                let elmTDS = document.querySelectorAll(`.td-cumplimiento-${detail.month}`);
                elmTDS.forEach(element => {
                    element.innerHTML = `${intPercentage} %`;
                });
            });
        }
    }
};

const makeInfoToDraw = async (objData, boolIgnoreNoOrdered = false) => {
    open_loading();
    if(Object.keys(objData).length > 0) {
        const objResult = await makeObjectToDetail(objData, boolIgnoreNoOrdered),
            boolOptionDate = document.getElementById('filter_date_option').checked;
        if(Object.keys(objResult).length > 0) {
            const container = document.getElementById('container-data');
            container.innerHTML = '';
            let strPedidos = '',
                intTotalGlobalOrders = intTotalGlobalAvailable = intTotalGlobalReleased = intTotalGlobalDifference = 0,
                objByMonthsResult = [],
                strPrevMonth = '',
                objPrevMonthTotals = {},
                strTotals = (boolTranslate) ? 'Totals' : 'Totales',
                intLastLine = (objResult.length - 1);
            objResult.map((detail, keyPedido) => {
                let strTrProducts = '',
                    objShips = [],
                    objByMonths = [];
                    intTotalOrdered = intTotalAvailable = intTotalLibered =  0;
                if(Object.keys(detail['products']).length > 0) {
                    detail['products'].map((detailProduct, keyProduct) => {
                        let intDifference = (detailProduct.contenedores_liberados * 1) - (detailProduct.contenedores_pedidos),
                            intPercentageProducts = 0,
                            strElementsPorts = '',
                            strDetailPorts = '',
                            dateReal = new Date(detailProduct.fecha_real_embarque),
                            prevMonth = `00${dateReal.getMonth() + 1}`,
                            strNameMonth = (boolTranslate) ? monthNamesEnglish[dateReal.getMonth()] : monthNamesSpanish[dateReal.getMonth()],
                            strMonth = `${dateReal.getFullYear()}-${prevMonth.slice(-2)}`;

                        intTotalOrdered += (detailProduct.contenedores_pedidos * 1);
                        intTotalAvailable += (detailProduct.contenedores_disponibles * 1);
                        intTotalLibered += (detailProduct.contenedores_liberados * 1);
                        if(detailProduct.contenedores_pedidos != 0)
                            intPercentageProducts = (detailProduct.contenedores_liberados * 1) / (detailProduct.contenedores_pedidos * 1 / 100);

                        let objNameShip = objShips.find(d => d.nombre_barco == detailProduct.nombre_barco);

                        if(!objNameShip?.nombre_barco && detailProduct?.nombre_barco) {
                            objShips.push({
                                'nombre_barco': detailProduct.nombre_barco,
                                'total': parseInt(detailProduct['contenedores_pedidos']),
                                'fecha_real_embarque': (detailProduct?.fecha_real_embarque && detailProduct.fecha_real_embarque) ? detailProduct.fecha_real_embarque : 'Sin Fecha',
                                'fecha_pedido': (detailProduct?.date_ordered && detailProduct.date_ordered) ? detailProduct.date_ordered : 'Sin Fecha',
                            });
                        }
                        else
                            objNameShip['total'] = (objNameShip['total'] * 1) + parseInt(detailProduct['contenedores_pedidos']);

                        if(Object.keys(detailProduct['ports']).length > 0) {
                            detailProduct['ports'].map((detailPort, keyPort) => {
                                strDetailPorts += ` <tr>
                                                        <td>${detailPort.puerto}</td>
                                                        <td>${detailPort.disponibles_puerto}</td>
                                                        <td>${detailPort.liberados_puerto}</td>
                                                    </tr>`;
                            });
                            if (strDetailPorts !== '') {
                                let strPort = "Nombre Puerto",
                                    strAvailablePort = "Disponible Puerto",
                                    strLiberedPort = "Liberado Puerto";
                                if(boolTranslate){
                                    strPort = "Port Name";
                                    strAvailablePort = "Available Port";
                                    strLiberedPort = "Released Port";
                                }
                                strElementsPorts += `   <tr class='hide-me tr-detail-pedido-ports-${keyPedido}-${keyProduct}'>
                                                            <td colspan='11'>
                                                                <table class='table table-bordered table-detail-ports'>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>${strPort}</th>
                                                                            <th>${strAvailablePort}</th>
                                                                            <th>${strLiberedPort}</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>${strDetailPorts}</tbody>
                                                                </table>
                                                            </td>
                                                        </tr>`;
                            }
                        }
                        let strButton = '';
                        if(strElementsPorts !== '') {
                            strButton = `   <button type='button' class='btn btn-danger' onclick='hideDetails("${keyProduct}", true, "${keyPedido}")'>
                                                <i class="fas fa-caret-up"></i>
                                            </button>`;
                        }

                        let intPercentageProductsShow = '';
                        let strClassDoneProvider = 'td-details-yellow';
                        if(detailProduct.contenedores_pedidos != '0') {
                            intPercentageProductsShow = `${numberFormat.format((intPercentageProducts * 1).toFixed(0))} %`;
                            strClassDoneProvider = ((intPercentageProducts * 1) >= 100) ? 'td-details-green' : 'td-details-red';
                        }
                        strTrProducts += `  <tr class='hide-me tr-detail-pedido-${keyPedido} tr-details'>
                                                <td>${strButton}</td>
                                                <td>${detailProduct.descripcion}</td>
                                                <td class='${strClassDoneProvider}'>${detailProduct.fecha_real_embarque}</td>
                                                <td class='${strClassDoneProvider}'>${detailProduct.contenedores_pedidos}</td>
                                                <td class='${strClassDoneProvider}'>${detailProduct.nombre_barco}</td>
                                                <td class='${strClassDoneProvider}'>${detailProduct.contenedores_disponibles}</td>
                                                <td class='${strClassDoneProvider}'>${detailProduct.contenedores_liberados}</td>
                                                <td class='${strClassDoneProvider}'>${intDifference}</td>
                                                <td class='${strClassDoneProvider}'>${intPercentageProductsShow}</td>
                                                <td class='td-cumplimiento-${strMonth} ${strClassDoneProvider}'></td>
                                                <td class='${strClassDoneProvider}'>${strNameMonth}</td>
                                            </tr>
                                            ${strElementsPorts}`;

                        if(boolOptionDate) {
                            let tmpExistMonth = objByMonths.find(d => d.month == strMonth);
                            if(tmpExistMonth) {
                                let tmExistShip = tmpExistMonth['ships'].find(d => d.barco_viaje_id == detailProduct.barco_viaje_id);
                                if(tmExistShip) {
                                    tmExistShip['contenedores_pedidos'] += isNaN(detailProduct.contenedores_pedidos) ? 0 : ( (detailProduct.contenedores_pedidos * 1).toFixed(0) * 1);
                                    tmExistShip['contenedores_liberados'] += isNaN(detailProduct.contenedores_liberados) ? 0 : ( (detailProduct.contenedores_liberados * 1).toFixed(0) * 1);
                                }
                                else {
                                    tmpExistMonth['ships'].push({
                                        'month': strMonth,
                                        'barco_viaje_id': detailProduct.barco_viaje_id,
                                        'contenedores_pedidos': isNaN(detailProduct.contenedores_pedidos) ? 0 : ( (detailProduct.contenedores_pedidos * 1).toFixed(0) * 1),
                                        'contenedores_liberados': isNaN(detailProduct.contenedores_liberados) ? 0 : ( (detailProduct.contenedores_liberados * 1).toFixed(0) * 1),
                                    });
                                }
                            }
                            else {
                                objByMonths.push({
                                    'month': strMonth,
                                    'ships': [{
                                        'month': strMonth,
                                        'barco_viaje_id': detailProduct.barco_viaje_id,
                                        'contenedores_pedidos': isNaN(detailProduct.contenedores_pedidos) ? 0 : ( (detailProduct.contenedores_pedidos * 1).toFixed(0) * 1),
                                        'contenedores_liberados': isNaN(detailProduct.contenedores_liberados) ? 0 : ( (detailProduct.contenedores_liberados * 1).toFixed(0) * 1),
                                    }],
                                });
                            }
                        }
                    });
                }

                let strShips = 'No tiene Barco',
                    strDatesOrder = 'No tiene Fecha',
                    strMonthReal = '';
                
                if(Object.keys(objShips).length > 0) {
                    objShips.sort((a, b) => {
                        return ((b.total > a.total)) ? 1 : -1;
                    });
                    strShips = objShips[0].nombre_barco;
                    strMonthReal = objShips[0].fecha_real_embarque;

                    if(boolOptionDate)
                        strDatesOrder = objShips[0].fecha_real_embarque;
                    else
                        strDatesOrder = objShips[0].fecha_pedido;
                }

                let intPercentage = (intTotalLibered * 1) / (intTotalOrdered * 1 / 100),
                    intTotalDifference = (intTotalLibered * 1) - (intTotalOrdered * 1);
                intPercentage = `${numberFormat.format( (intPercentage * 1).toFixed(0) )} %`;

                let strMonthMax = '';
                if(!boolOptionDate) {
                    let dateReal = new Date(detail.date_ordered),
                        intPrevMonth = `000${dateReal.getMonth() + 1}`;
                    strMonthMax = `${dateReal.getFullYear()}-${intPrevMonth.slice(-2)}`;

                    objByMonthsResult.push({
                        'month': strMonthMax,
                        'ships': [{
                            'barco_viaje_id': 0,
                            'contenedores_liberados': intTotalLibered,
                            'contenedores_pedidos': intTotalOrdered,
                            'month': strMonthMax,
                        },],
                    });
                }
                else {
                    let intKeyMax = intMax = 0;
                    objByMonths.map(detail => {
                        detail['ships'].sort((a, b) => {
                            return ((b.contenedores_liberados > a.contenedores_liberados)) ? 1 : -1;
                        });
                    });
                    if(Object.keys(objByMonths).length >= 2) {
                        objByMonths.map((detail, keyKey) => {
                            if(typeof detail['ships'][0] !== 'undefined') {
                                let intPedidos = (detail['ships'][0].contenedores_pedidos * 1);
                                if(intPedidos > intMax) {
                                    intMax = intPedidos;
                                    intKeyMax = keyKey;
                                }
                            }
                        });
                    }
                    strMonthMax = objByMonths[intKeyMax].month;
                    objByMonthsResult.push(objByMonths[intKeyMax]);
                }

                let dateOrderF = new Date(strDatesOrder),
                    strMonthShow = 'SIN FECHA';
                if(!isNaN(dateOrderF.getMonth()))
                    strMonthShow = (boolTranslate) ? monthNamesEnglish[dateOrderF.getMonth()] : monthNamesSpanish[dateOrderF.getMonth()];



                let strRowTotals = '';
                if(strPrevMonth != '') {
                    if(strPrevMonth != strMonthShow || intLastLine == keyPedido) {
                        strRowTotals = `<tr class='tr-totals-details'>
                                            <td colspan='3'>${strTotals}</td>
                                            <td>${objPrevMonthTotals['intTotalOrdered']}</td>
                                            <td></td>
                                            <td>${objPrevMonthTotals['intTotalAvailable']}</td>
                                            <td>${objPrevMonthTotals['intTotalLibered']}</td>
                                            <td>${objPrevMonthTotals['intTotalDifference']}</td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                        </tr>`;
                        
                        if(intLastLine == keyPedido) {
                            objPrevMonthTotals['intTotalOrdered'] = (intTotalOrdered * 1) + (objPrevMonthTotals['intTotalOrdered'] * 1);
                            objPrevMonthTotals['intTotalAvailable'] = (intTotalAvailable * 1) + (objPrevMonthTotals['intTotalAvailable'] * 1);
                            objPrevMonthTotals['intTotalLibered'] = (intTotalLibered * 1) + (objPrevMonthTotals['intTotalLibered'] * 1);
                            objPrevMonthTotals['intTotalDifference'] = (intTotalDifference * 1) + (objPrevMonthTotals['intTotalDifference'] * 1);    
                            strRowTotals = `<tr class='tr-totals-details'>
                                                <td colspan='3'>${strTotals}</td>
                                                <td>${objPrevMonthTotals['intTotalOrdered']}</td>
                                                <td></td>
                                                <td>${objPrevMonthTotals['intTotalAvailable']}</td>
                                                <td>${objPrevMonthTotals['intTotalLibered']}</td>
                                                <td>${objPrevMonthTotals['intTotalDifference']}</td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                            </tr>`;
                        }
                        else {
                            objPrevMonthTotals = {
                                'intTotalOrdered': intTotalOrdered,
                                'intTotalAvailable': intTotalAvailable,
                                'intTotalLibered': intTotalLibered,
                                'intTotalDifference': intTotalDifference,
                            };
                        }
                    }
                    else {
                        objPrevMonthTotals['intTotalOrdered'] = (intTotalOrdered * 1) + (objPrevMonthTotals['intTotalOrdered'] * 1);
                        objPrevMonthTotals['intTotalAvailable'] = (intTotalAvailable * 1) + (objPrevMonthTotals['intTotalAvailable'] * 1);
                        objPrevMonthTotals['intTotalLibered'] = (intTotalLibered * 1) + (objPrevMonthTotals['intTotalLibered'] * 1);
                        objPrevMonthTotals['intTotalDifference'] = (intTotalDifference * 1) + (objPrevMonthTotals['intTotalDifference'] * 1);
                    }
                }
                else {
                    objPrevMonthTotals = {
                        'intTotalOrdered': intTotalOrdered,
                        'intTotalAvailable': intTotalAvailable,
                        'intTotalLibered': intTotalLibered,
                        'intTotalDifference': intTotalDifference,
                    };
                }
                strPrevMonth = strMonthShow;

                let strFinalTotalRow = '';
                if(intLastLine == keyPedido) {
                    strFinalTotalRow = strRowTotals;
                    strRowTotals = '';
                }

                strPedidos += ` ${strRowTotals}<tr class='tr-pedido-${keyPedido} tr-title-ordered'>
                                    <td>
                                        <button type='button' class='btn btnCollapseProducts' onclick='hideDetails("${keyPedido}")'>
                                            <i class="fas fa-caret-up"></i>
                                        </button>
                                    </td>
                                    <td>${detail.date_ordered}</td>
                                    <td>${strMonthReal}</td>
                                    <td>${intTotalOrdered}</td>
                                    <td>${strShips}</td>
                                    <td>${intTotalAvailable}</td>
                                    <td>${intTotalLibered}</td>
                                    <td>${intTotalDifference}</td>
                                    <td>${intPercentage}</td>
                                    <td class='td-cumplimiento-${strMonthMax}'></td>
                                    <td>${strMonthShow}</td>
                                </tr>
                                ${strTrProducts}
                                ${strFinalTotalRow}`;
                intTotalGlobalOrders += (intTotalOrdered * 1);
                intTotalGlobalAvailable += (intTotalAvailable * 1);
                intTotalGlobalReleased += (intTotalLibered * 1);
                intTotalGlobalDifference += (intTotalDifference * 1);
            });

            let intPercentageGlobal = (intTotalGlobalReleased * 1) / (intTotalGlobalOrders * 1 / 100);
            intPercentageGlobal = `${numberFormat.format( (intPercentageGlobal * 1).toFixed(0) )} %`;
            strPedidos += ` <tr class='tr-totals'>
                                <td colspan='3'>${strTotals}</td>
                                <td>${intTotalGlobalOrders}</td>
                                <td></td>
                                <td>${intTotalGlobalAvailable}</td>
                                <td>${intTotalGlobalReleased}</td>
                                <td>${intTotalGlobalDifference}</td>
                                <td>${intPercentageGlobal}</td>
                                <td></td>
                                <td></td>
                            </tr>`;
            container.insertAdjacentHTML('beforeend', strPedidos);

            makePercentageByMonths(objByMonthsResult);
        }
    }
    close_loading();
};

const getData = async () => {
    let formData = new FormData(),
        sltProvider = document.getElementById('sltProvider'),
        elmDateInit = document.getElementById('date_init'),
        elmDateEnd = document.getElementById('date_end'),
        elmChkDateEmbarqued = document.getElementById('filter_date_option');

    if (sltProvider && elmDateInit) {
        open_loading();
        formData.append('csrfmiddlewaretoken', valCSRF);
        formData.append('provider', sltProvider.value);
        formData.append('date_init', elmDateInit.value);
        formData.append('date_end', elmDateEnd.value);
        formData.append('filter_date_option', elmChkDateEmbarqued.checked);
        const response = await fetch(urlGetData, {method: 'POST', body: formData});
        const data = await response.json();
        close_loading();
        if(data.status) {
            if(Object.keys(data.data).length > 0) {
                boolInfoDrawed = true;
                objDataShowed = data.data;
                makeInfoToDraw(data.data, show_only_ordered.checked);
            }
            else {
                boolInfoDrawed = false;
                let strError = (boolTranslate) ? "There is no information to display" : data.message;
                alert_nova.showNotification(strError, 'warning', 'danger');    
            }
        }
        else {
            boolInfoDrawed = false;
            let strError = (boolTranslate) ? "An unexpected problem occurred, contact support" : "Ocurrio un problema inesperado, contacta con soporte";
            alert_nova.showNotification(strError, 'warning', 'danger');
            console.error(data.message);
        }
    }
    else {
        boolInfoDrawed = false;
        let strError = (boolTranslate) ? "You cannot make the query, contact support" : "No puedes hacer la consulta, contacta con soporte";
        alert_nova.showNotification(strError, 'warning', 'danger');
    }
};

const drawTheadPrincipal = async () => {
    open_loading();
    const container = document.getElementById('title-container-data');
        strOption = (boolTranslate) ? 'en' : 'esp';

    container.innerHTML = '';
    let strElements = '';

    objStrTitles[strOption]['filters'].map(detail => {
        let objElement = document.getElementById(detail.container);
        objElement.innerHTML = detail.str_print;
    });

    objStrTitles[strOption]['principal'].map(detail => {
        strElements += `<th>${detail}</th>`;
    });
    container.insertAdjacentHTML('beforeend', strElements);

    makeInfoToDraw(objDataShowed, show_only_ordered.checked);
    close_loading();
};

const changeLanguage = () => {
    let btn = document.getElementById('btnChangeLanguage');
    if (boolTranslate) {
        boolTranslate = false;
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-outline-danger');
    }
    else {
        boolTranslate = true;
        btn.classList.remove('btn-outline-danger');
        btn.classList.add('btn-danger');
    }
    drawTheadPrincipal();
};

drawTheadPrincipal();

if (bntSearch)
    bntSearch.addEventListener('click', () => {
        getData();
    });

if(show_only_ordered)
    show_only_ordered.addEventListener('click', () => {
        if(boolInfoDrawed)
            makeInfoToDraw(objDataShowed, show_only_ordered.checked);
    });