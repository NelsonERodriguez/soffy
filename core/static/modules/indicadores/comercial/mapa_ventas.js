const makeObjByCountry = async (objData) => {
    let objCurrent = [],
        objCompare = [];

    for(const k in objData.data_current) {
        const d = objData.data_current[k];
        if(typeof objCurrent[d.codigopostal] == 'undefined') {
            objCurrent[d.codigopostal] = {
                'total': 0,
                'country': d.Departamento,
                'postal': d.codigopostal,
            };
        }
        objCurrent[d.codigopostal].total = (objCurrent[d.codigopostal].total * 1) + ( (d.TotalProductoDesc * 1));
    }

    for(const k in objData.data_compare) {
        const d = objData.data_compare[k];
        if(typeof objCompare[d.codigopostal] == 'undefined') {
            objCompare[d.codigopostal] = {
                'total': 0,
                'country': d.Departamento,
                'postal': d.codigopostal,
            };
        }
        objCompare[d.codigopostal].total = (objCompare[d.codigopostal].total * 1) + ( (d.TotalProductoDesc * 1));
    }

    return {
        'current': objCurrent,
        'compare': objCompare,
    };
};

const getOptionSelected = async () => {
    const mapTypes = document.querySelectorAll('input[name="chkTypeMapParticipation"]');
    let optionSelected = '';
    mapTypes.forEach(element => {
        if(element.checked) {
            optionSelected = element.value;
        }
    });
    return optionSelected;
};

const drawMapParticipationByFilter = async () => {
    let objResult = await makeObjByUnits(objGlobalDataParticipation.result);
    let arrResult = await drawTableDataParticipation(objGlobalDataParticipation.result, objResult, objGlobalDataParticipation.int_months);
    $('#tblParticipation').DataTable({
        "order": [3, "desc"],
        'pageLength': 25,
        dom: 'lBfrtip',
        buttons: [{
            extend: 'excel',
            text: 'Excel',
            className: 'btn btn-default',
            exportOptions: {
                modifier: {
                    page: 'current'
                }
            }
        }]
    });
    await drawGraphicParticipation(arrResult, objGlobalDataParticipation.result);

    let objBubbles = await drawGraphicBubbleParticipation(),
        boolTableBubbles = await drawTableBubbleParticipation(objBubbles);
};

const compareObjCurrent = (objComparing, arrResult) => {
    for(const k in objCountriesGT) {
        const strKeyCountry = objCountriesGT[k];
        if(typeof objComparing.current[strKeyCountry] !== 'undefined') {
            arrResult[strKeyCountry] = objComparing.current[strKeyCountry].total;
        }
        else {
            arrResult[strKeyCountry] = 0;
        }
    }
    return arrResult;
};

const makeGraphicCompare = async (objData) => {
    const objComparing = await makeObjByCountry(objData);
    let arrResult = [];
    let tmp = await compareObjCurrent(objComparing, arrResult);

    for(const k in objCountriesGT) {
        const strKeyCountry = objCountriesGT[k];
        let intTMP = 0
        if(typeof objComparing.compare[strKeyCountry] !== 'undefined') {
            intTMP = (objComparing.compare[strKeyCountry].total * 1);
        }
        else {
            intTMP = 0;
        }

        if(arrResult[strKeyCountry]) {
            arrResult[strKeyCountry] = (arrResult[strKeyCountry] * 1) - intTMP;
        }
        else {
            arrResult[strKeyCountry] = intTMP * -1;
        }
    }

    let arrReturn = [];
    for(const k in arrResult) {
        const d = arrResult[k];
        let intResult = d.toFixed(2);
        arrReturn.push({
            'postal-code': k,
            'value': (intResult * 1),
        });
    }
    return {
        'detail': arrReturn,
        'result': arrResult,
    };
};

const drawTableModalCountry = async (objCurrent, objCompare) => {
    let strMonthCurrent = document.getElementById('month').value,
        strMonthCompare = document.getElementById('month_compare').value,
        dateCurrent = new Date(`${strMonthCurrent}-10`),
        dateCompare = new Date(`${strMonthCompare}-10`);

    let strCountry = '',
        elements = '',
        arrTMPDraw = [],
        strMonthOne = monthNamesSpanish[dateCurrent.getMonth()],
        strMonthTwo = monthNamesSpanish[dateCompare.getMonth()];

    objCurrent.map(detail => {
        strCountry = detail['Departamento'];
        let intUnits = (detail['Unidades'] * 1).toFixed(0),
            objTMPClient = [];

        if(typeof arrTMPDraw[detail['NoCliente']] == 'undefined') {
            arrTMPDraw[detail['NoCliente']] = {
                'productos': [],
                'cliente': detail['nombre'],
            };
            objTMPClient = arrTMPDraw[detail['NoCliente']].productos;
        }
        else {
            objTMPClient = arrTMPDraw[detail['NoCliente']].productos;
        }

        if(typeof objTMPClient[detail['CodProducto']] == 'undefined') {
            objTMPClient[detail['CodProducto']] = {
                'description': detail['Descripcion'],
                'name': detail['nombre'],
                'salesman': detail['NombreVendedor'],
                'current': 0,
                'compare': 0,
                'opt': 'current',
            };
        }
        objTMPClient[detail['CodProducto']].current = (objTMPClient[detail['CodProducto']].current * 1) + (detail['Unidades'] * 1);
    });

    objCompare.map(detail => {
        strCountry = detail['Departamento'];
        let intUnits = (detail['Unidades'] * 1).toFixed(0),
            objTMPClient = [];

        if(typeof arrTMPDraw[detail['NoCliente']] == 'undefined') {
            arrTMPDraw[detail['NoCliente']] = {
                'productos': [],
                'cliente': detail['nombre'],
            };
            objTMPClient = arrTMPDraw[detail['NoCliente']].productos;
        }
        else {
            objTMPClient = arrTMPDraw[detail['NoCliente']].productos;
        }

        if(typeof objTMPClient[detail['CodProducto']] == 'undefined') {
            objTMPClient[detail['CodProducto']] = {
                'description': detail['Descripcion'],
                'name': detail['nombre'],
                'salesman': detail['NombreVendedor'],
                'current': 0,
                'compare': 0,
                'opt': 'current',
            };
        }
        objTMPClient[detail['CodProducto']].compare = (objTMPClient[detail['CodProducto']].compare * 1) + (detail['Unidades'] * 1);
    });

    arrTMPDraw.map(detail => {
        let objProducts = detail.productos,
            intRowSpan = Object.keys(objProducts).length,
            rowsProducts = '',
            elementsFirstRow = '',
            boolFirstRow = true;

        for(const k in objProducts) {
            const product = objProducts[k];
            let intDifference = product.current - product.compare;
            let strClass = (intDifference > 0) ? 'str-green' : 'str-red';
            if(boolFirstRow) {
                elementsFirstRow += `<td class='tdTableDetailByCountry'>${product.description}</td>
                                    <td class='tdTableDetailByCountry'>${numberFormat.format( (product.current).toFixed(2) )}</td>
                                    <td class='tdTableDetailByCountry'>${numberFormat.format( (product.compare).toFixed(2) )}</td>
                                    <td class='${strClass}'>${numberFormat.format( (intDifference).toFixed(2) )}</td>
                                    <td class='tdTableDetailByCountry'>${product.salesman}</td>`;
                boolFirstRow = false;
            }
            else {
                rowsProducts += `   <tr>
                                        <td class='tdTableDetailByCountry'>${product.description}</td>
                                        <td class='tdTableDetailByCountry'>${numberFormat.format( (product.current).toFixed(2) )}</td>
                                        <td class='tdTableDetailByCountry'>${numberFormat.format( (product.compare).toFixed(2) )}</td>
                                        <td class='${strClass}'>${numberFormat.format( (intDifference).toFixed(2) )}</td>
                                        <td class='tdTableDetailByCountry'>${product.salesman}</td>
                                    </tr>`;
            }
        }
        elements += `   <tr>
                            <td rowspan="${intRowSpan}">${detail.cliente}</td>
                            ${elementsFirstRow}
                        </tr>
                        ${rowsProducts}`;
    });

    const table = ` <div class='row'>
                        <table class='table table-london'>
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Producto</th>
                                    <th>Unidades Venta en ${strMonthOne}</th>
                                    <th>Unidades Venta en ${strMonthTwo}</th>
                                    <th>Comparativo ${strMonthOne} vrs. ${strMonthTwo}</th>
                                    <th>Vendedor</th>
                                </tr>
                            </thead>
                            <tbody>${elements}</tbody>
                        </table>
                    </div>`;

    document.getElementById('modalDetailCountryTitle').innerHTML = `Detalle de Presencia en "${strCountry}"`;
    document.getElementById('modalDetailCountryBody').innerHTML = table;
    return true;
};

const drawModalByCountrySelected = async (strCountry, objAllData) => {
    const objFilterCurrent = objAllData.data_current.filter(element => element.codigopostal == strCountry),
        objFilterCompare = objAllData.data_compare.filter(element => element.codigopostal == strCountry);

    if(Object.keys(objFilterCurrent).length > 0 || Object.keys(objFilterCompare).length > 0) {
        const boolDraw = await drawTableModalCountry(objFilterCurrent, objFilterCompare);

        if(boolDraw) {
            $('#modalDetailCountry').modal("show");
        }
    }
    else {
        alert_nova.showNotification("El departamento no contiene informacion sobre ventas", "warning", "danger");
    }
};

const showDetailByCountry = async (strCountry, objCountries, objAllData) => {
    if(typeof objCountries[strCountry] !== 'undefined') {
        open_loading();
        let draw = await drawModalByCountrySelected(strCountry, objAllData);
        close_loading();
    }
    else {
        alert_nova.showNotification("No se pudo encontrar información sobre el departamento, contacta con soporte", "warning", "danger");
    }
};

const drawGraphic = async (arrResult, objAllData) => {
    const response = await fetch(strUrlJSON);
    const topology = await response.json();

    Highcharts.mapChart('cntMap', {
        chart: {
            type: 'map',
            map: topology,
            renderTo: 'container',
            borderWidth: 1
        },
        title: {
            text: 'Resultados'
        },
        legend: {
            align: 'right',
            verticalAlign: 'top',
            x: -100,
            y: 70,
            floating: true,
            layout: 'vertical',
            valueDecimals: 0,
            backgroundColor: (
                Highcharts.defaultOptions &&
                Highcharts.defaultOptions.legend &&
                Highcharts.defaultOptions.legend.backgroundColor
            ) || 'rgba(255, 255, 255, 0.85)'
        },
        mapNavigation: {
            enabled: true,
            enableButtons: false
        },
        colorAxis: {
            dataClasses: [{
                from: -10000000000,
                to: 0,
                color: '#F44336',
                name: 'Reducción'
            }, {
                from: 0,
                to: 10000000000,
                color: '#4CAF50',
                name: 'Incremento'
            }]
        },
        series: [{
            data: arrResult.detail,
            joinBy: 'postal-code',
            dataLabels: {
                enabled: true,
                color: '#FFFFFF',
                format: '{point.postal-code}',
                style: { textTransform: 'uppercase' },
            },
            name: '',
            tooltip: { ySuffix: ' %' },
            cursor: 'pointer',
            events: {
                click: function(e) {
                    showDetailByCountry(e.point['postal-code'], arrResult.result, objAllData);
                }
            },
        }, {
            name: 'Separators',
            type: 'mapline',
            nullColor: 'silver',
            showInLegend: false,
            enableMouseTracking: false,
            accessibility: { enabled: false }
        }]
    });
};

const makeObjByMonths = async (objAllData) => {
    let arrReturn = [];
    objAllData.map(detail => {
        if(typeof arrReturn[detail.Mes] == 'undefined')
            arrReturn[detail.Mes] = [];

        let objTMP = arrReturn[detail.Mes];
        if(typeof objTMP[detail.codigopostal] == 'undefined')
            objTMP[detail.codigopostal] = [];

        objTMP[detail.codigopostal].push(detail);
    });
    return arrReturn;
};

const drawTableAllData = async (objAllData) => {
    let objResult = await makeObjByMonths(objAllData),
        intLengthObj = Object.keys(objResult).length,
        intTotalColumnsTable = (intLengthObj * 2) + 1,
        intKeyMonthPrev = 0,
        strTHs = '',
        strTBody = '',
        strFamily = document.getElementById('family').value,
        strMonth = document.getElementById('month').value,
        arrMonth = strMonth.split('-');
        strYear = arrMonth[0],
        strFirstMonth = monthNamesSpanish[1],
        strLastMonth = monthNamesSpanish[intLengthObj - 1];

    objResult.map((month, key) => {
        strTHs += `<th class='th-month'>${monthNamesSpanish[key - 1]}</th>`;
        if(typeof objResult[intKeyMonthPrev] != 'undefined') {
            strTHs += `<th class='th-month-compare'>Comparativo ${monthNamesSpanish[intKeyMonthPrev - 1]} vrs. ${monthNamesSpanish[key - 1]}</th>`;
        }
        intKeyMonthPrev++;
    });

    let objTotals = [];
    objCountriesGT.map(strCountry => {
        let strTDs = '',
            strCountryPrint = '',
            intTotalPrevMonth = 0,
            intTotalByRow = 0;
        intKeyMonthPrev = 0;

        objResult.map((month, key) => {
            let intTotalCurrentMonth = 0;

            if(typeof month[strCountry] !== 'undefined') {
                let objCountryTMP = month[strCountry];
                objCountryTMP.map(d => {
                    strCountryPrint = d.Departamento;
                    intTotalCurrentMonth += (d.Unidades * 1);
                });
            }
            else {
                strCountryPrint = strCountry;
            }

            intTotalByRow += (intTotalCurrentMonth * 1);
            strTDs += `<td class='td-detail'>${numberFormat.format( (intTotalCurrentMonth).toFixed(0) )}</td>`;

            if(typeof objTotals[key] === 'undefined') {
                objTotals[key] = { 'total': intTotalCurrentMonth, };
            }
            else {
                objTotals[key].total += intTotalCurrentMonth * 1;
            }

            if(typeof objResult[intKeyMonthPrev] != 'undefined') {
                let intDifference = (intTotalCurrentMonth - intTotalPrevMonth),
                    strClass = (intDifference > 0) ? 'str-green' : 'str-red';
                if(typeof objTotals[`compare_${key}`] === 'undefined') {
                    objTotals[`compare_${key}`] = { 'total': intDifference, };
                }
                else {
                    objTotals[`compare_${key}`].total += intDifference * 1;
                }

                strTDs += `<td class='td-detail ${strClass}'>${numberFormat.format( (intDifference).toFixed(0) )}</td>`;
            }

            intTotalPrevMonth = intTotalCurrentMonth;
            intKeyMonthPrev++;
        });

        if(typeof objTotals[999] === 'undefined') {
            objTotals[999] = { 'total': intTotalByRow, };
        }
        else {
            objTotals[999].total += intTotalByRow * 1;
        }

        strTBody += `   <tr>
                            <td data-order='${strCountryPrint}'>${strCountryPrint}</td>
                            ${strTDs}
                            <td class='td-detail'>${numberFormat.format( (intTotalByRow).toFixed(0) )}</td>
                        </tr>`;
    });

    let strTFoot = '',
        strTFootContainers = '';
    objTotals.map((d, k) => {
        strTFoot += `<th class='th-footer-total'>${numberFormat.format( (d.total * 1).toFixed(0) )}</th>`;
        strTFootContainers += `<th class='th-footer-total'>${numberFormat.format( (d.total / 58000).toFixed(0) )}</th>`;
        if(typeof objTotals[`compare_${k}`] !== 'undefined') {
            let intTotalFooter = objTotals[`compare_${k}`].total * 1,
                strColorFooter = (intTotalFooter > 0) ? 'black': 'red';
            strTFoot += `<th style='color: ${strColorFooter};' class='th-footer-total'>${numberFormat.format( (intTotalFooter).toFixed(0) )}</th>`;
            strTFootContainers += `<th class='th-footer-total th-footer-total-compare'>${numberFormat.format( (intTotalFooter / 58000).toFixed(0) )}</th>`;
            delete objTotals[`compare_${k}`];
        }
    });

    let table = `   <table class='' id='tblDetailVentas'>
                        <thead>
                            <tr>
                                <th colspan='${intTotalColumnsTable}'>
                                    <h5 class='strTitleTable'>VENTAS EN LIBRAS COMPARATIVO MES A MES</h5>
                                    <h5 class='strTitleTable'>${strFamily}</h5>
                                    <h5 class='strTitleTable'>DE ${strFirstMonth} A ${strLastMonth} ${strYear}.</h5>
                                </th>
                            </tr>
                            <tr> <th>Departamento</th> ${strTHs} <th>ACUMULADO ${strYear}</th> </tr>
                        </thead>
                        <tbody>${strTBody}</tbody>
                        <tfoot>
                            <tr style='background: #D9D9D9;'> <th>Total General</th> ${strTFoot} </tr>
                            <tr> <th>CONTENEDORES</th> ${strTFootContainers} </tr>
                        </tfoot>
                    </table>`;
    document.getElementById('cntTableAllDetail').innerHTML = table;
};

const drawGraphicParticipation = async (arrResult, objAllData) => {
    const response = await fetch(strUrlJSON);
    const topology = await response.json();
    Highcharts.mapChart('cntMapParticipation', {
        chart: {
            type: 'map',
            map: topology,
            renderTo: 'container',
            borderWidth: 1
        },
        title: {
            text: 'Resultados'
        },
        legend: {
            align: 'right',
            verticalAlign: 'top',
            x: -100,
            y: 70,
            floating: true,
            layout: 'vertical',
            valueDecimals: 0,
            backgroundColor: (
                Highcharts.defaultOptions &&
                Highcharts.defaultOptions.legend &&
                Highcharts.defaultOptions.legend.backgroundColor
            ) || 'rgba(255, 255, 255, 0.85)'
        },
        mapNavigation: {
            enabled: true,
            enableButtons: false
        },
        colorAxis: { min: 0 },
        series: [{
            data: arrResult.detail,
            joinBy: 'postal-code',
            dataLabels: {
                enabled: true,
                color: '#FFFFFF',
                format: '{point.postal-code}',
                style: { textTransform: 'uppercase' },
            },
            name: '',
            tooltip: { ySuffix: ' %' },
            cursor: 'pointer',
            credits: { enabled: false },
            events: {
                click: function(e) {
                    // showDetailByCountry(e.point['postal-code'], arrResult.result, objAllData);
                }
            },
            states: {
                hover: {
                    color: '#BADA55'
                }
            },
            color: '#ed8929',
        }, {
            name: 'Separators',
            type: 'mapline',
            nullColor: 'silver',
            showInLegend: false,
            enableMouseTracking: false,
            accessibility: { enabled: false }
        }]
    });
};

const getDetailDepartment = async (str_code) => {
    let objReturn = {
            'poblacion': 0,
            'consumo': 0,
            'unidades': 0,
            'departamento': '',
        },
        formData = new FormData();
    formData.append('str_code', str_code);
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetDataCountry, {'method': 'POST', 'body': formData});
    const data = await response.json();
    if(data.status){ objReturn = data.result[0]; }

    return objReturn;
};

const drawTableDataParticipation = async (objData, objResultTable, int_months = 1) => {
    let elements = '',
        intTotalPeople = 0,
        intTotalLb = 0,
        intTotalUnits = 0,
        arrReturn = [],
        strOptionMap = await getOptionSelected();

    for(const k in objCountriesGT) {
        const strKeyCountry = objCountriesGT[k],
            strDefault = 'No hay registro este mes';
        let objDetail = objData.find(d => d.codigo_postal == strKeyCountry);

        let strCountry = strKeyCountry,
            strPeople = strDefault,
            strConsume = strDefault,
            strParticipation = 0,
            strUnits = strDefault,
            strDifference = strDefault,
            intValGraphic = 0,
            strColor = '#F88';

        if(!objDetail) {
            objDetail = await getDetailDepartment(strKeyCountry);
        }

        if(objDetail) {
            strCountry = objDetail.departamento;
            strPeople = numberFormat.format(objDetail.poblacion);
            let intConsume = (objDetail.consumo * 1) * (int_months);
            strConsume = numberFormat.format(intConsume);
            strUnits = numberFormat.format((objDetail.unidades * 1).toFixed(0));
            intTotalPeople += (objDetail.poblacion * 1);
            intTotalLb += (intConsume * 1);
            intTotalUnits += (objDetail.unidades * 1);
            intValGraphic = objDetail.unidades * 1;
            let intDesviacion = objDetail.unidades - intConsume;
            if(intDesviacion > 0) { strColor = '#F88'; }
            strDifference = numberFormat.format((intDesviacion).toFixed(0));
            strParticipation = (strOptionMap == 'participation') ? (objDetail.participacion * 100).toFixed(0) : (intDesviacion * -1).toFixed(0);
        }

        arrReturn.push({
            'postal-code': strKeyCountry,
            'value': (strParticipation * 1),
        });
        elements += `   <tr>
                            <td>${strCountry}</td>
                            <td>${strPeople}</td>
                            <td>${strConsume}</td>
                            <td data-order='${intValGraphic}'>${strUnits}</td>
                            <td style='background: ${strColor}'>${strDifference}</td>
                            <td>${numberFormat.format(strParticipation)} %</td>
                        </tr>`;
    }

    let intTotalParticipation = numberFormat.format(((intTotalLb * 1) / (intTotalUnits * 1) * 1).toFixed(0));
    let table = `   <table class='table table-london' id='tblParticipation'>
                        <thead>
                            <tr>
                                <th>Departamento</th>
                                <th>Población</th>
                                <th>Consumo</th>
                                <th>Unidades Vendidas</th>
                                <th>Desviación</th>
                                <th>Participación</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${elements}
                        </tbody>
                        <tfooter>
                            <tr>
                                <td>Total General</td>
                                <td>${numberFormat.format( intTotalPeople.toFixed(0) )} personas</td>
                                <td>${numberFormat.format( intTotalLb.toFixed(0) )} lb de consumo</td>
                                <td>${numberFormat.format( intTotalUnits.toFixed(0) )} lb vendidas</td>
                                <td>- - -</td>
                                <td>${intTotalParticipation} %</td>
                            </tr>
                        </tfooter>
                    </table>`;
    document.getElementById('cntTableAllDetailParticipation').innerHTML = table;
    return {
        'detail': arrReturn,
    };
};

const makeObjByUnits = async (objData) => {
    let arrReturn = [];
    for(const k in objData) {
        const d = objData[k];
        let intUnits = (d.unidades * 1).toFixed(0);

        if(typeof arrReturn[intUnits] == 'undefined') {
            arrReturn[intUnits] = d;
        }
        else {
            intUnits = intUnits + 1;
            arrReturn[intUnits] = d;
        }
    }
    return arrReturn;
};

const getInfoTableCompare = async () => {
    open_loading();
    const init = document.getElementById('month'),
        family = document.getElementById('family');
    let formData = new FormData();
    formData.append('month', init.value);
    formData.append('family', family.value);
    formData.append('csrfmiddlewaretoken', valCSRF);

    const response = await fetch(urlGetAllYear, {'method': 'POST', 'body': formData});

    if(response) {
        const data = await response.json();
        if(data?.status && data.status) {
            await drawTableAllData(data.result);
            $('#tblDetailVentas').DataTable({
                "order": [0, "asc"],
                'pageLength': 25,
                responsive: false,
                language: objLenguajeDataTable,
                dom: 'lBfrtip',
                buttons: [ {
                    extend: 'excel',
                    text: 'Descargar en Excel',
                    className: 'btn btn-outline-success',
                    exportOptions: { modifier: { page: 'current' } }
                } ],
            });
        }
    }

    close_loading();
};

const makeObjCountries = async (objData) => {
    let arrReturn = [];

    objData.map(detail => {
        if(detail.NoVendedor != '18') {
            if(typeof arrReturn[detail.codigopostal] === 'undefined') {
                arrReturn[detail.codigopostal] = {
                    'data': [],
                    'country': detail.Departamento,
                };
            }
            let tmp = arrReturn[detail.codigopostal].data,
                intKey = 0,
                intLength = Object.keys(tmp).length;

            if(intLength !== 0) {
                let objPrev = tmp[intLength - 1];
                intKey = (objPrev.key_position * 1) + 1;
            }

            detail.key_position = intKey;
            tmp.push(detail);
        }
    });
    return arrReturn;
};

const makeObjOnlyCoordinates = async (objData) => {
    let arrReturn = [];

    for(const k in objData) {
        const d = objData[k];
        if(Object.keys(d.clients).length > 0){
            for(const key in d.clients){
                const client = d.clients[key];
                arrReturn.push({
                    'units': (client['units'].toFixed(0) * 1),
                    'client': client['client'],
                    'z': (client['units'].toFixed(0) * 1),
                    'abbrev': client.abbrev,
                    'lat': client.latitude * 1,
                    'lon': client.longitude * 1,
                });
            }
        }
    }

    return arrReturn;
};

const makeObjOnlyCoordinates_deprecate = async (objData) => {
    let arrReturn = [];
    for(const k in objData) {
        const d = objData[k];
        if(Object.keys(d.data).length) {
            for(const key in d.data) {
                const detail = d.data[key];
                let tmpLatitude = detail.latitud,
                    tmpLongitude = detail.longitud,
                    intUnits = 0,
                    intTotal = 0,
                    strAbbrev = '',
                    strClient = '';
                let objResults = d['data'].filter(detailSearch => (detailSearch.latitud == tmpLatitude && detailSearch.longitud == tmpLongitude) );

                objResults.map(result => {
                    strAbbrev = result.codigopostal;
                    strClient = result.nombre;
                    intUnits = (intUnits * 1) + (result.Unidades * 1);
                    intTotal = (intTotal * 1) + (result.TotalProductoDesc * 1);
                    delete objData[k].data[result.key_position];
                });

                if(tmpLatitude && tmpLongitude){
                    arrReturn.push({
                        'units': (intUnits.toFixed(0) * 1),
                        'client': strClient,
                        'z': (intUnits.toFixed(0) * 1),
                        'total': (intTotal.toFixed(0) * 1),
                        'abbrev': strAbbrev,
                        'lat': tmpLatitude * 1,
                        'lon': tmpLongitude * 1,
                    });
                }
            }
        }
    }
    return arrReturn;
};

const makeObjClientsByCountry = async (objData, boolMakeHasLocation = true) => {
    let arrReturn = [];

    for(const k in objData) {
        const d = objData[k];
        let arrClients = [];
        for(const key in d.data) {
            const detail = d.data[key];

            if(boolMakeHasLocation) {
                if(detail.latitud && detail.longitud) {
                    if(typeof arrClients[detail.NoCliente] === 'undefined') {
                        arrClients[detail.NoCliente] = {
                            'municipality': detail.Municipio,
                            'client': detail.nombre,
                            'abbrev': detail.codigopostal,
                            'latitude': detail.latitud,
                            'longitude': detail.longitud,
                            'units': 0,
                            'total_product': 0,
                        };
                    }
                    let tmp = arrClients[detail.NoCliente];
                    tmp.units = (tmp.units * 1) + (detail.Unidades * 1);
                    tmp.total_product = (tmp.total_product * 1) + (detail.TotalProductoDesc * 1);
                }
            }
            else {
                if(!detail.latitud && !detail.longitud) {
                    if(typeof arrClients[detail.NoCliente] === 'undefined') {
                        arrClients[detail.NoCliente] = {
                            'municipality': detail.Municipio,
                            'client': detail.nombre,
                            'abbrev': detail.codigopostal,
                            'latitude': '',
                            'longitude': '',
                            'units': 0,
                            'total_product': 0,
                        };
                    }
                    let tmp = arrClients[detail.NoCliente];
                    tmp.units = (tmp.units * 1) + (detail.Unidades * 1);
                    tmp.total_product = (tmp.total_product * 1) + (detail.TotalProductoDesc * 1);
                }
            }
        }
        arrReturn[k] = {
            'country': d.country,
            'clients': arrClients,
        };
    }

    return arrReturn;
};

const makeTableClientsNoHasLocation = async (objClients) => {
    let tRows = '';
    for(const k in objClients) {
        const d = objClients[k];
        for(const key in d.clients) {
            const detail = d.clients[key];
            tRows += `  <tr>
                            <td>${d.country} - ${detail.municipality}</td>
                            <td>${detail.client}</td>
                            <td data-order='${detail.units}'>${numberFormat.format((detail.units * 1).toFixed(0))}</td>
                        </tr>`;
        }
    }
    let table = `   <div class="row">
                        <h4>Clientes sin localizacion</h4>
                    </div>
                    <div class="row">
                        <table class="table table-london" id='tblClientsNoLocation'>
                            <thead>
                                <tr>
                                    <th>Departamento y Municipio</th>
                                    <th>Cliente</th>
                                    <th>Unidades</th>
                                </tr>
                            </thead>
                            <tbody>${tRows}</tbody>
                        </table>
                    </div>`;

    document.getElementById('cntTableNoLocation').innerHTML = table;

    $('#tblClientsNoLocation').DataTable({
        "order": [2, "desc"],
        'pageLength': 25,
        responsive: false,
        dom: 'lBfrtip',
        buttons: [{
            extend: 'excel',
            text: 'Excel',
            className: 'btn btn-default',
            exportOptions: {
                modifier: {
                    page: 'current'
                }
            }
        }]
    });
};

const drawGraphicBubbleParticipation = async () => {
    open_loading();
    const init = document.getElementById('month'),
        family = document.getElementById('family'),
        initParticipation = document.getElementById('init'),
        endParticipation = document.getElementById('end');
    let formData = new FormData(),
        objClients = [],
        arrReturn = [];
    if (init) { formData.append('month', init.value); }
    if (initParticipation) { formData.append('init_participation', initParticipation.value); }
    if (endParticipation) { formData.append('end_participation', endParticipation.value); }
    formData.append('family', family.value);
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetAllYear, {'method': 'POST', 'body': formData});
    if(response) {
        const data = await response.json();
        arrReturn = data;
        if(data?.status && data.status) {
            let objCountries = await makeObjCountries(data.result),
                objTMPClients = await makeObjClientsByCountry(objCountries);

            objClients = await makeObjOnlyCoordinates(objTMPClients);

            let objTMPClientsNoLocation = await makeObjClientsByCountry(objCountries, false);
            await makeTableClientsNoHasLocation(objTMPClientsNoLocation);
        }
    }
    const responseTopology = await fetch(strUrlJSON);
    const topology = await responseTopology.json();

    Highcharts.mapChart('cntMapBubbles', {
        chart: { events: { load: function(){ this.mapZoom(1); } } },
        mapNavigation: {
            enabled: true,
            buttonOptions: {
                theme: {
                    r: 8,
                },
                verticalAlign: 'bottom'
            }
        },
        title: { text: 'Ventas por Localización' },
        tooltip: {
            pointFormat: '{point.abbrev}<br>' +
                'Unidades: {point.units}<br>' +
                'Cliente: {point.client}<br>'
        },
        xAxis: {
            crosshair: {
                zIndex: 5,
                dashStyle: 'dot',
                snap: false,
                color: 'gray'
            }
        },
        yAxis: {
            crosshair: {
                zIndex: 5,
                dashStyle: 'dot',
                snap: false,
                color: 'gray'
            }
        },
        series: [{
            name: 'Basemap',
            mapData: topology,
            accessibility: { exposeAsGroupOnly: true },
            borderColor: '#606060',
            nullColor: 'rgba(200, 200, 200, 0.2)',
            showInLegend: false
        }, {
            type: 'mapbubble',
            dataLabels: {
                enabled: true,
                format: '{point.abbrev}'
            },
            accessibility: { point: { valueDescriptionFormat: '{point.abbrev}' } },
            name: 'Ventas por Localización',
            data: objClients,
            maxSize: '12%',
            color: '#7CB5EC',
        }]
    });

    close_loading();
    return arrReturn;
};

const drawTableBubbleParticipation = async (objData) => {
    const content = document.getElementById('cntTableBubblesDetail');
    let objCountries = await makeObjCountries(objData.result),
        objClients = await makeObjClientsByCountry(objCountries),
        trs = '';

    for(const k in objClients){
        const d = objClients[k];
        if(Object.keys(d.clients).length > 0){
            for(const key in d.clients) {
                const client = d.clients[key];
                trs += `<tr>
                            <td>${d.country} - ${client.municipality}</td>
                            <td>${client.client}</td>
                            <td>${numberFormat.format((client.units * 1).toFixed(0))}</td>
                        </tr>`;
            }
        }
    }
    let table = `   <table class="table" id='tableDetailBubbles'>
                        <thead>
                            <tr style="background: #1A4F77; color: #F2E32E; text-align:center;">
                                <th style='font-weight:bold;'>Municipio</th>
                                <th style='font-weight:bold;'>Cliente</th>
                                <th style='font-weight:bold;'>Unidades</th>
                            </tr>
                        </thead>
                        <tbody>${trs}</tbody>
                    </table>`;
    content.innerHTML = table;

    $('#tableDetailBubbles').DataTable({
        "order": [2, "desc"],
        'pageLength': 25,
        dom: 'lBfrtip',
        buttons: [{
            extend: 'excel',
            text: 'Excel',
            className: 'btn btn-default',
            exportOptions: {
                modifier: {
                    page: 'current'
                }
            }
        }]
    });
    return true;
};

const getData = async () => {
    open_loading();
    const init = document.getElementById('month'),
        end = document.getElementById('month_compare'),
        family = document.getElementById('family'),
        initParticipation = document.getElementById('init'),
        endParticipation = document.getElementById('end');
    let formData = new FormData();
    if (init) { formData.append('month', init.value); }
    if (end) { formData.append('month_compare', end.value); }
    if (initParticipation) { formData.append('init_participation', initParticipation.value); }
    if (endParticipation) { formData.append('end_participation', endParticipation.value); }

    formData.append('family', family.value);
    formData.append('csrfmiddlewaretoken', valCSRF);

    const response = await fetch(urlGetData, {'method': 'POST', 'body': formData});
    close_loading();
    if(response) {
        const data = await response.json();
        if(data.status) {
            if(family.value == 'participacion') {
                objGlobalDataParticipation = data;
                await drawMapParticipationByFilter();
            }
            else {
                let arrResult = await makeGraphicCompare(data.result);
                await drawGraphic(arrResult, data.result);
                getInfoTableCompare();
            }
        }
    }
    else {
        alert_nova.showNotification('Ocurrió un error inesperado, contacta con soporte', 'warning', 'danger');
    }

};

const validateGetData = (strFamily) => {
    const init = document.getElementById('month'),
        end = document.getElementById('month_compare'),
        initByMonth = document.getElementById('init');

    if(init || initByMonth) {
        if((init && !init.value && init.value == '') || (initByMonth && !initByMonth.value && initByMonth.value == '')) {
            alert_nova.showNotification('Debes tener un mes principal seleccionado.', 'warning', 'danger');
        }
        if(strFamily == 'participacion') {
            getData();
        }
        else {
            if(!end.value && end.value == '') {
                alert_nova.showNotification('Debes seleccionar un mes a comparar', 'warning', 'danger');
            }
            else {
                getData();
            }
        }
    }
    else {
        alert_nova.showNotification('Ocurrió un error inesperado, contacta con soporte', 'warning', 'danger');
    }
};

const showParticipationFilters = async () => {
    let content = document.getElementById('content-filters-participation'),
        element = '';
    if(document.getElementById('mode').checked) {
        element = ` <div class='row'>
                        <div class='col-12 col-md-6'>
                            <div class="form-group">
                                <label for="month" class="bmd-label-floating">Selecciona tu mes:</label>
                                <input type="month" class="form-control" id="month" name="month" value="${month_now}" max="${month_now}">
                            </div>
                        </div>
                    </div>`;
    }
    else {
        element = `<div class='row'>
                        <div class='col-12 col-md-6'>
                            <div class="form-group">
                                <label for="init" class="bmd-label-floating">Fecha Inicio:</label>
                                <input type="date" class="form-control" id="init" name="init" value="${strToday}">
                            </div>
                        </div>
                        <div class='col-12 col-md-6'>
                            <div class="form-group">
                                <label for="end" class="bmd-label-floating">Fecha Fin:</label>
                                <input type="date" class="form-control" id="end" name="end" value="${strToday}" max="${strToday}">
                            </div>
                        </div>
                    </div>`;
    }
    content.innerHTML = element;
};

const elementsFilterToSearch = (strFamily) => {
    let strSecondMonth = '',
        filterRangeDates = '',
        strClassSize = 'col-lg-4 col-md-5';
        strClassFilter = 'col-12',
        strContainers = '';
    if(strFamily !== 'participacion') {
        strSecondMonth = `  <div class="col-12 col-lg-4 col-md-5">
                                <div class="form-group">
                                    <label for="month_compare" class="bmd-label-floating">Selecciona mes a comparar:</label>
                                    <input type="month" class="form-control" id="month_compare" name="month_compare" value="${prev_month}" max="${prev_month}">
                                </div>
                            </div>`;
        strContainers = `   <div class="row">
                                <div class="col-12 col-md-6 offset-md-3">
                                    <div id="cntMap" class='containerParticipationMap'></div>
                                </div>
                            </div>
                            <div class="row" style='margin-top: 50px;'>
                                <div class="col-12" id="cntTableAllDetail"></div>
                            </div>`;
    }
    else {
        strClassSize = 'col-md-8';
        strClassFilter = 'col-12 col-md-6';
        filterRangeDates = `<div class="col-12 col-md-2">
                                <div class="form-check">
                                    <label class="form-check-label">Ver Por Mes Completo
                                        <input class="form-check-input" type="checkbox" id="mode" name="mode" onchange='showParticipationFilters()' checked>
                                        <span class="form-check-sign">
                                            <span class="check"></span>
                                        </span>
                                    </label>
                                </div>
                            </div>`;
        strContainers = `   <div class="row" style='margin-top: 50px;'>
                                <div class="col-12 col-md-6">
                                    <div class='row'>
                                        <div class='col-12 col-md-6'>
                                            <div class="form-check">
                                                <label class="form-check-label">
                                                    <input class="form-check-input" type="radio" onclick='drawMapParticipationByFilter()' name="chkTypeMapParticipation" value="participation" checked>Ver por Participación
                                                    <span class="circle">
                                                        <span class="check"></span>
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                        <div class='col-12 col-md-6'>
                                            <div class="form-check">
                                                <label class="form-check-label">
                                                    <input class="form-check-input" type="radio" onclick='drawMapParticipationByFilter()' name="chkTypeMapParticipation" value="deviation">Ver por Desviación
                                                    <span class="circle">
                                                        <span class="check"></span>
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class='row'>
                                        <div class='col-12'>
                                            <div id="cntMapParticipation" class='containerParticipationMap'></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div id="cntMapBubbles" class='containerBubblesMap'></div>
                                </div>
                            </div>
                            <div class="row" style='margin-top: 50px;'>
                                <div class="col-12 col-md-6" id="cntTableAllDetailParticipation"></div>
                                <div class="col-12 col-md-6" id="cntTableBubblesDetail"></div>
                            </div>
                            <div class="row" style='margin-top: 50px;'>
                                <div class="col-12 col-md-8 offset-md-2" id="cntTableNoLocation"></div>
                            </div>`;
    }
    return `<div class="row">
                ${filterRangeDates}
                <div class="col-12 ${strClassSize}" id="content-filters-participation">
                    <div class='row'>
                        <div class='${strClassFilter}'>
                            <div class="form-group">
                                <label for="month" class="bmd-label-floating">Selecciona tu mes:</label>
                                <input type="month" class="form-control" id="month" name="month" value="${month_now}" max="${month_now}">
                            </div>
                        </div>
                    </div>
                </div>
                ${strSecondMonth}
                <div class="col-12 col-lg-1 col-md-2">
                    <button type="button" class="btn btn-outline-primary" onclick="validateGetData('${strFamily}')">
                        <i class="fa fa-search"></i>
                        Buscar
                    </button>
                </div>
            </div>
            ${strContainers}`;
};

const drawElementsIntoTabs = async (strElementID, boolFirst = false) => {
    let elem = document.getElementById('family');
    if(elem){
        const elements = document.querySelectorAll('.tab-pane');
        elements.forEach(element => {
            element.innerHTML = '';
        });
    }
    const content = document.getElementById(`${strElementID}`);
    content.innerHTML = '';
    content.innerHTML += `<input type='hidden' id='family' value='${strElementID}' />`;
    const strElementSearch = await elementsFilterToSearch(strElementID);

    $('#yearPicker').datetimepicker({
        format: "YYYY",
        viewMode: "years",
    });
    content.innerHTML += strElementSearch;
};

drawElementsIntoTabs('cuadriles', true);