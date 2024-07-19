drawElementsIntoTabs('mixtos', true);

async function drawElementsIntoTabs(strElementID, boolFirst = false) {
    let elem = document.getElementById('family');
    if(elem){
        const elements = document.querySelectorAll('.tab-pane');
        elements.forEach(element => {
            element.innerHTML = '';
        })
    }
    const content = document.getElementById(`${strElementID}`);
    content.innerHTML = '';
    content.innerHTML += `<input type='hidden' id='family' value='${strElementID}' />`;
    const strElementSearch = await elementsFilterToSearch();
    content.innerHTML += strElementSearch;

    if(boolFirst) {
        getAllData();
    }
}

async function getWeeksInOptions(){
    let strReturn = '';
    arrWeeks.map(week => {
        strReturn += `<option value="${week.year}-${week.week}">Semana: ${week.week} Inicia: ${week.init} Termina: ${week.end}</option>`;
    });
    return strReturn;
};

async function elementsFilterToSearch(){
    if(globalStrOptions == '') {
        globalStrOptions = await getWeeksInOptions();
        strOptionsWeeks = globalStrOptions;
    }
    
    const strChecked = (boolContainers) ? 'checked' : '';
    return `<div class='row'>
                <div class='col-12'>
                    <div class='row'>
                        <div class='col-12 col-md-2'>
                            <div class="form-group">
                                <label for="date_init" class="bmd-label-floating">Buscar mes desde:</label>
                                <input type="date" class="form-control" id="date_init" name="date_init" value='${strDateDefault}' onchange='searchMonths()'>
                            </div>
                        </div>
                        <div class='col-12 col-md-2'>
                            <div class="form-group">
                                <label for="date_end" class="bmd-label-floating">Buscar mes hasta:</label>
                                <input type="date" class="form-control" id="date_end" name="date_end" value="${strDateDefault}" onchange='searchMonths()'>
                            </div>
                        </div>
                        <div class='col-12 col-md-5'>
                            <div class="form-group bmd-form-group is-filled">
                                <label for="date_week" class="bmd-label-floating">Buscar cuatro semanas atrás desde:</label>
                                <select name="date_week" id="date_week" class="form-control" onchange='searchWeeks()'>
                                    ${strOptionsWeeks}
                                </select>
                            </div>
                        </div>
                        <div class='col-12 col-md-2'>
                            <div class="form-check">
                                <label class="form-check-label">Ver Por Contenedores
                                    <input class="form-check-input" type="checkbox" id="mode" name="mode" ${strChecked} onchange='getAllData()'>
                                    <span class="form-check-sign">
                                        <span class="check"></span>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class='row'>
                        <div class='col-12 col-md-6' id='contentInfoMonths'></div>
                        <div class='col-12 col-md-6' id='contentInfoWeeks'></div>
                    </div>
                </div>
            </div>`;
}

async function getAllData(e = this) {
    e.preventDefault;
    await searchMonths();
    await searchWeeks();
}

async function searchMonths() {
    open_loading();
    const elementFamily = document.getElementById('family'),
        elementInit = document.getElementById('date_init'),
        elementEnd = document.getElementById('date_end'),
        elementMode = document.getElementById('mode');

    let formData = new FormData();
    formData.append('family', elementFamily.value);
    formData.append('init', elementInit.value);
    formData.append('end', elementEnd.value);
    formData.append('mode', elementMode.checked);
    formData.append('csrfmiddlewaretoken', valCSRF);
    fetch(`${urlGetMonths}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(async(data) => {
        if(data.status){
            if(Object.keys(data.result).length > 0) {
                let objLabelsChart = await drawInfoTableMonths(data, elementMode.checked),
                    objSerieToDay = [];
                data['result'].map(detail => {
                    if(detail.month == data.str_today_month) {
                        let intTotal = (!elementMode.checked) ? (detail.str_total / 58000) : detail.str_total;
                        let a = (intTotal / 30) * data.str_today;
                        objSerieToDay.push(a);
                    }
                    else {
                        objSerieToDay.push(0);
                    }
                });
                drawChartMonths(objLabelsChart, objSerieToDay);
            }
            else {
                alert_nova.showNotification("No hay información a mostrar, intenta cambiar los filtros.", "warning", "danger");
            }
            close_loading();
        }
    })
    .catch(error => console.error(error))
}

async function searchWeeks() {
    open_loading();
    await searchMonths();
    const elementFamily = document.getElementById('family'),
          elementWeek = document.getElementById('date_week'),
          elementMode = document.getElementById('mode');

    let objReturn = {},
        formData = new FormData();
    formData.append('family', elementFamily.value);
    formData.append('week', elementWeek.value);
    formData.append('mode', elementMode.checked);
    formData.append('csrfmiddlewaretoken', valCSRF);
    fetch(`${urlGetWeeks}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(async(data) => {
        if(data.status){
            if(Object.keys(data.result).length > 0) {
                let objLabelsChart = await drawInfoTableWeeks(data, elementMode.checked);
                drawChartWeeks(objLabelsChart);
            }
            else {
                alert_nova.showNotification("No hay información a mostrar, intenta cambiar los filtros.", "warning", "danger");
            }
            close_loading();
        }
    })
    .catch(error => console.error(error))
}

async function drawInfoTableMonths(objData, strValueMode) {
    let intPeriod = objData.percentage_period,
        objResult = objData.result;
    const contentGraphicsWeeks = document.getElementById('contentInfoMonths');
    contentGraphicsWeeks.innerHTML = `  <div class='row' id='chartMonths' style='max-height: 500px; margin: 50px 0;'></div>
                                        <div class='row' id='tableMonths'>
                                            <div class='col-12 col-md-12' id='tBodyTableMonths'></div>
                                        </div>
                                        <div class='row' id='tableVentasGenerales'>
                                            <div class='col-12 col-md-8' id='tVentasGenerales'></div>
                                        </div>`;
    let content = document.getElementById('tBodyTableMonths'),
        contentVG = document.getElementById('tVentasGenerales'),
        arrReturn = [],
        strTH = '',
        tdRowReal = '',
        tdRowLibras = '',
        tdRowPresupuesto = '',
        elementMode = document.getElementById('mode').checked;
    for(let k in objResult) {
        const d = objResult[k];
        let intLB = (d.libras * 1),
            intTotal = (d.total * 1);
        intLB = intLB.toFixed(0);
        intLB = numberFormat.format(intLB);
        intTotal = intTotal.toFixed(0);


        let intReal = (elementMode) ? (d.libras * 1).toFixed(0) : (d.int_percentage * 1).toFixed(0),
            strValMode = (elementMode) ? objData.str_y  : '%',
            strUOM = (elementMode) ? objData.str_y : 'lb';
        if(elementMode) {
            intTotal = numberFormat.format( ((intReal / intTotal) * 100).toFixed(2) );
            strTH += `<th>Mes ${d.month}</th>`;
            tdRowReal += `<td class='tdDetailNoMargin'>${intTotal} %</td>`;
            tdRowLibras += `<td class='tdDetailNoMargin' >${intReal} ${strValMode}</td>`;
            intLB = numberFormat.format((d.str_total * 1).toFixed(0));
            tdRowPresupuesto += `<td class='tdDetailNoMargin' >${intLB} ${strUOM}</td>`;
        }
        else {
            intTotal = numberFormat.format(intTotal);
            strTH += `<th>Mes ${d.month}</th>`;
            tdRowReal += `<td class='tdDetailNoMargin'>${intReal} ${strValMode}</td>`;
            tdRowLibras += `<td class='tdDetailNoMargin' >${intTotal} ${strUOM}</td>`;
            tdRowPresupuesto += `<td class='tdDetailNoMargin' >${intLB} ${strUOM}</td>`;
        }

        
        arrReturn[k] = {
            'month': `Mes ${d.month}`,
            'real': (intReal * 1),
            'period': (intPeriod * 1),
            'period_pp': (d.pp * 1),
            'objective': (d.periodo * 1),
            'venta_ant': (d.venta_ant * 1),
            'str_y': objData.str_y,
        };
    }
    let strLastRow = '';
    if(!elementMode) {
        strLastRow = `  <tr>
                            <td class='tdDetailNoMargin'>
                                Presupuesto Libras
                            </td>
                            ${tdRowLibras}
                        </tr>
                        <tr>
                            <td class='tdDetailNoMargin'>
                                Total Libras
                            </td>
                            ${tdRowPresupuesto}
                        </tr>`;
    }
    else {
        strLastRow = `  <tr>
                            <td class='tdDetailNoMargin'>
                                Contenedores Presupuestados
                            </td>
                            ${tdRowPresupuesto}
                        </tr>
                        <tr>
                            <td class='tdDetailNoMargin'>
                                Contenedores Vendidos
                            </td>
                            ${tdRowLibras}
                        </tr>`;
    }
    content.innerHTML = `   <table class='table table-london'>
                                <thead>
                                    <tr>
                                        <th></th>
                                        ${strTH}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            % Cumplimiento Ventas
                                        </td>
                                        ${tdRowReal}
                                    </tr>
                                    ${strLastRow}
                                </tbody>
                            </table>`;
    drawTableVentasGenerales(contentVG, objData);
    return arrReturn;
}

function drawChartMonths(objData, objSerieToDay) {
    let objCategories = [],
        objReal = [],
        objObjective = [],
        objAlcance = [],
        strObjective = '',
        strAlcance = '',
        strY = '';

    for(const k in objData){
        const d = objData[k];
        objCategories.push(d.month);
        objReal.push(d.real);
        objObjective.push(d.period_pp);
        if(d?.venta_ant) {
            let venta_ant = d['venta_ant'].toFixed(0);
            objAlcance.push(venta_ant * 1);
        }
        else
            objAlcance.push(d.objective);
        
        strObjective = d.period_pp;
        strAlcance = d.objective;
        strY = d.str_y;
    }
    const objGraphic = {
        'str_id': 'chartMonths',
        'title': 'Indicador de Ventas de los Ultimos Cuatro Meses (según filtro)',
        'subTitle': '',
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'strObjective': (strObjective * 1).toFixed(0),
        'strAlcance': (strAlcance * 1).toFixed(0),
        'type': 'monthly',
        'uom': strY,
        'valueChart': strY,
        'objSerieToDay': objSerieToDay,
    };
    
    drawGlobalHighChartsLondon(objGraphic, true, modalDetalles);
}

async function drawInfoTableWeeks(objData, strValueMode) {
    let intPeriod = objData.percentage_period,
        objResult = objData.result;
    const contentGraphicsWeeks = document.getElementById('contentInfoWeeks');
    contentGraphicsWeeks.innerHTML = `  <div class='row' id='chartWeeks' style='max-height: 500px; margin: 50px 0;'></div>
                                        <div class='row' id='tableWeeks'>
                                            <div class='col-12 col-md-12' id='tBodyTableWeeks'></div>
                                        </div>`;
    let content = document.getElementById('tBodyTableWeeks'),
        arrReturn = [],
        strTH = '',
        tdRowReal = '',
        tdRowLibras = '',
        tdRowPresupuesto = '',
        elementMode = document.getElementById('mode').checked;

    for(let k in objResult){
        const d = objResult[k];
        let intPercentage = 100,
            intLB = (d.libras * 1),
            intTotal = (d.total * 1);
        intLB = intLB.toFixed(0);
        intLB = numberFormat.format(intLB);
        intTotal = intTotal.toFixed(0);
        intTotal = numberFormat.format(intTotal);

        let intReal = (elementMode) ? (d.libras * 1).toFixed(0) : (d.int_percentage * 1).toFixed(0),
            strValMode = (elementMode) ? objData.str_y  : '%',
            strUOM = (elementMode) ? objData.str_y : 'lb';
        if(elementMode){
            if(intReal > 0){
                intTotal = numberFormat.format( ((intReal / intTotal) * 100).toFixed(2) );
            }
            else{
                intTotal = 0;
            }

            strTH += `<th>Sem ${d.week}</th>`;
            tdRowReal += `<td class='tdDetailNoMargin'>${intTotal} %</td>`;
            tdRowLibras += `<td class='tdDetailNoMargin' >${intReal} ${strValMode}</td>`;
            intLB = numberFormat.format((d.str_total * 1).toFixed(0));
            tdRowPresupuesto += `<td class='tdDetailNoMargin' >${intLB} ${strValMode}</td>`;
        }
        else {
            strTH += `<th>Sem ${d.week}</th>`;
            tdRowReal += `<td>${intReal} %</td>`;
            tdRowLibras += `<td>${intTotal} lb</td>`;
            tdRowPresupuesto += `<td>${intLB} lb</td>`;
        }
        
        arrReturn[k] = {
            'week': `Semana ${d.week}`,
            'real': (intReal * 1),
            'period': (intPeriod * 1),
            'period_pp': (d.pp * 1),
            'objective': (d.periodo * 1),
            'str_y': objData.str_y,
            'str': (elementMode) ? (d.str).toUpperCase() : '',
        };
    }
    let strLastRow = '';
    if(!elementMode) {
        strLastRow = `  <tr>
                            <td>Presupuesto Libras</td>
                            ${tdRowLibras}
                        </tr>
                        <tr>
                            <td>Total Libras</td>
                            ${tdRowPresupuesto}
                        </tr>`;
    }
    else {
        strLastRow = `  <tr>
                            <td class='tdDetailNoMargin'>
                                Contenedores Presupuestados
                            </td>
                            ${tdRowPresupuesto}
                        </tr>
                        <tr>
                            <td class='tdDetailNoMargin'>
                                Contenedores Vendidos
                            </td>
                            ${tdRowLibras}
                        </tr>`;
    }
    content.innerHTML = `   <table class='table table-london'>
                                <thead>
                                    <tr>
                                        <th></th>
                                        ${strTH}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>% Cumplimiento Ventas</td>
                                        ${tdRowReal}
                                    </tr>
                                    ${strLastRow}
                                </tbody>
                            </table>`;
    return arrReturn;
}

function drawChartWeeks(objData){
    let objCategories = [],
        objReal = [],
        objObjective = [],
        objAlcance = [],
        strAlcance = '',
        strObjective = '',
        strY = '';
    for(const k in objData){
        const d = objData[k];
        objCategories.push(d.week);
        objReal.push(d.real);
        objObjective.push(d.period_pp);
        objAlcance.push(d.objective);
        strAlcance = (d.objective * 1).toFixed(0);
        strObjective = (d.period_pp * 1).toFixed(0);
        if(d.str === "MUSLOS") {
            strAlcance = (d.objective * 1).toFixed(2);
            strObjective = (d.period * 1).toFixed(2);
        }
        strY = d.str_y;
    }
    const objGraphic = {
        'str_id': 'chartWeeks',
        'title': 'Indicador de Ventas de las Ultimas Cuatro Semanas (según filtro)',
        'subTitle': '',
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'strObjective': strObjective,
        'strAlcance': strAlcance,
        'type': 'weekly',
        'uom': strY,
        'valueChart': strY,
    };
    drawGlobalHighChartsLondon(objGraphic);
}

function drawTableVentasGenerales(contentVG, objData) {
    let objVentasG = objData?.ventas_generales;
    objVentasG.VentaNeta = numberFormat.format(objVentasG.VentaNeta);
    objVentasG.Unidades = numberFormat.format(objVentasG.Unidades);
    objVentasG.PrecioPromedioLibras = numberFormat.format(objVentasG.PrecioPromedioLibras);
    contentVG.innerHTML = ` <table class='table table-london'>
                                <thead>
                                    <tr></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Venta Mes Actual</td>
                                        <td>Q ${objVentasG.VentaNeta}</td>
                                    </tr>
                                    <tr>
                                        <td>Unidades Mes Actual</td>
                                        <td>${objVentasG.Unidades} LB</td>
                                    </tr>
                                    <tr>
                                        <td>Precio Promedio Lb</td>
                                        <td>Q ${objVentasG.PrecioPromedioLibras}</td>
                                    </tr>
                                </tbody>
                            </table>`;
}

async function getClientByGroup(strType) {
    open_loading();
    document.getElementById('title').innerHTML = strType;
    const arrSplit = strType.split(" ");
    const strFecha = (arrSplit.length > 1)? arrSplit[1] : '';
    const arrSplitFecha = strFecha.split("-");
    const strTipo = (arrSplitFecha.length > 1)? arrSplit[0] : '';
    const strYear = (arrSplitFecha.length > 1)? arrSplitFecha[0] : '';
    const strMesSemana = (arrSplitFecha.length > 1)? arrSplitFecha[1] : '';
    const csrftoken = getCookie('csrftoken');
    const objForm = new FormData();
    const strFamily = document.getElementById('family').value;
    const objModal = document.getElementById('modal_body_detalles');
    objForm.append("tipo", strTipo);
    objForm.append("year", strYear);
    objForm.append("mes_semana", strMesSemana);
    objForm.append("family", strFamily);
    objForm.append("reporte", "familias");

    const response = await fetch(urlGetClient, { method: 'POST', headers: { 'X-CSRFToken': csrftoken }, body: objForm });
    const objData = await response.json();

    if (objData.status) {
        let objDrawTable = [];
        if(document.getElementById("family").value == 'cuadriles') {
            objDrawTable = await makeObjGroupByClient(objData.reporte);
        }
        else {
            objDrawTable = objData.reporte;
        }

        let strBody = '';

        if (strType.search("Mes") > -1) {

            strBody = `
                <div class="row">
                    <div class="col-12">
                        <div id="divReal" style="height: 100%; overflow-y: scroll;"></div>
                    </div>
                </div>
            `;
            $(() => {

                $('#divReal').dxDataGrid({
                    dataSource: objDrawTable,
                    height: 1000,
                    with:100,
                    showColumnLines: true,
                    showRowLines: true,
                    showBorders: true,
                    columnAutoWidth: true,
                    paging: { enabled: false },
                    pager: {
                        showPageSizeSelector: true,
                        allowedPageSizes: [15, 25, 50, 100],
                    },
                    remoteOperations: false,
                    searchPanel: {
                        visible: true,
                        highlightCaseSensitive: false,
                    },
                    groupPanel: { visible: false },
                    grouping: {
                        autoExpandAll: false,
                    },
                    export: { enabled: true },
                    allowColumnReordering: true,
                    rowAlternationEnabled: true,
                    columnAutoWidth: true,
                    showBorders: true,
                    wordWrapEnabled: true,
                    columnMinWidth: 140,
                    columnAutoWidth: 140,
                    columns: [
                        {
                            dataField: "nombre",
                            caption: "Cliente",
                            width: 160,
                            minWidth: 160,
                        },
                        {
                            dataField: "ClasificacionPRD",
                            caption: "Grupos",
                            visible: (document.getElementById("family").value == 'cuadriles') ? false : true,
                        },
                        {
                            dataField: "UnidadesMesAnterior",
                            caption: "Libras Mes Anterior",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            }
                        },
                        {
                            dataField: "Unidades",
                            caption: "Libras Mes Actual",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            }
                        },
                        {
                            dataField: "UnidadesTrimestral",
                            caption: "Libras Promedio Trimestral",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            }
                        },
                        {
                            dataField: "Presupuesto",
                            caption: "Libras Presupuesto",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            }
                        },
                        {
                            dataField: "DiferenciaUnidadesMensual",
                            caption: "Libras Mes Actual vs Libras Mes Anterior",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            },
                        },
                        {
                            dataField: "DiferenciaUnidadesTrimestral",
                            caption: "Libras Mes Actual vs Libras Promedio Trimestral",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            },
                            sortOrder: 'asc',
                        },
                        {
                            dataField: "DiferenciaUnidadesPresupuesto",
                            caption: "Libras Mes Actual vs Libras Presupuesto",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            },
                        },
                        {
                            dataField: "VentaMesAnterior",
                            caption: "Venta Mes Anterior",
                            headers:"Justify",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                        },
                        {
                            dataField: "VentaNeta",
                            caption: "Venta Mes Actual",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                        },
                        {
                            dataField: "VentaTrimestral",
                            caption: "Promedio Trimestral",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                        },
                        {
                            dataField: "DiferenciaMensualVenta",
                            caption: "Mes Actual vs Mes Anterior",
                            headers:"Justify",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                        },
                        {
                            dataField: "DiferenciaTrimestralVenta",
                            caption: "Mes Actual vs Promedio Trimestral (Q)",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                        },
                    ],
                    onRowClick(e) {
                        getProductos(strTipo, strYear, strMesSemana, e.data);
                    },
                    onRowPrepared(info) {
                        if(info.rowType == 'data') {
                            info.rowElement[0].style.cursor = "pointer";
                        }
                    },
                    onCellPrepared(info){

                        if(info.rowType == 'data') {

                            if (info.data.DiferenciaMensualVenta == info.value) {
                                const intDiferenciaVenta = (info.data.DiferenciaMensualVenta * 1);

                                if (intDiferenciaVenta < 0) {
                                    info.cellElement[0].style.color = "red";
                                }
                                else {
                                    info.cellElement[0].style.color = "green";
                                }

                            }

                            if (info.data.DiferenciaTrimestralVenta == info.value) {
                                const intDiferenciaVenta = (info.data.DiferenciaTrimestralVenta * 1);

                                if (intDiferenciaVenta < 0) {
                                    info.cellElement[0].style.color = "red";
                                }
                                else {
                                    info.cellElement[0].style.color = "green";
                                }

                            }

                            if (info.data.DiferenciaVentaPresupuesto == info.value) {
                                const intDiferenciaVenta = (info.data.DiferenciaVentaPresupuesto * 1);

                                if (intDiferenciaVenta < 0) {
                                    info.cellElement[0].style.color = "red";
                                }
                                else {
                                    info.cellElement[0].style.color = "green";
                                }

                            }

                            if (info.data.DiferenciaUnidadesMensual == info.value) {
                                const intDiferenciaUnidades = (info.data.DiferenciaUnidadesMensual * 1);

                                if (intDiferenciaUnidades < 0) {
                                    info.cellElement[0].style.color = "red";
                                }
                                else {
                                    info.cellElement[0].style.color = "green";
                                }

                            }

                            if (info.data.DiferenciaUnidadesTrimestral == info.value) {
                                const intDiferenciaUnidades = (info.data.DiferenciaUnidadesTrimestral * 1);

                                if (intDiferenciaUnidades < 0) {
                                    info.cellElement[0].style.color = "red";
                                }
                                else {
                                    info.cellElement[0].style.color = "green";
                                }

                            }

                        }
                    },
                });
            });

        }

        objModal.innerHTML = strBody;

        $('#modal_detalles').modal('show');
    }

    close_loading();
}

async function makeObjGroupByClient(objData) {
    let arrPrevReturn = [],
        arrReturn = [];

    for(const k in objData) {
        const d = objData[k];
        let strKey = d.CodCliente;
        if(typeof arrPrevReturn[strKey] === 'undefined') {
            arrPrevReturn[strKey] = d;
        }
        else {
            let tmp = arrPrevReturn[strKey];
            tmp.DiferenciaMensualVenta = (tmp.DiferenciaMensualVenta * 1) + (d.DiferenciaMensualVenta * 1);
            tmp.DiferenciaTrimestralVenta = (tmp.DiferenciaTrimestralVenta * 1) + (d.DiferenciaTrimestralVenta * 1);
            tmp.DiferenciaUnidadesMensual = (tmp.DiferenciaUnidadesMensual * 1) + (d.DiferenciaUnidadesMensual * 1);
            tmp.DiferenciaUnidadesPresupuesto = (tmp.DiferenciaUnidadesPresupuesto * 1) + (d.DiferenciaUnidadesPresupuesto * 1);
            tmp.DiferenciaUnidadesTrimestral = (tmp.DiferenciaUnidadesTrimestral * 1) + (d.DiferenciaUnidadesTrimestral * 1);
            tmp.Presupuesto = (tmp.Presupuesto * 1) + (d.Presupuesto * 1);
            tmp.Unidades = (tmp.Unidades * 1) + (d.Unidades * 1);
            tmp.UnidadesMesAnterior = (tmp.UnidadesMesAnterior * 1) + (d.UnidadesMesAnterior * 1);
            tmp.UnidadesTrimestral = (tmp.UnidadesTrimestral * 1) + (d.UnidadesTrimestral * 1);
            tmp.VentaMesAnterior = (tmp.VentaMesAnterior * 1) + (d.VentaMesAnterior * 1);
            tmp.VentaNeta = (tmp.VentaNeta * 1) + (d.VentaNeta * 1);
            tmp.VentaTrimestral = (tmp.VentaTrimestral * 1) + (d.VentaTrimestral * 1);
        }
    }

    for(const k in arrPrevReturn) {
        const d = arrPrevReturn[k];
        arrReturn.push(d);
    }

    return arrReturn;
}

async function modalDetalles(strType){
    open_loading();
    document.getElementById('title').innerHTML = strType;
    const arrSplit = strType.split(" ");
    const strFecha = (arrSplit.length > 1)? arrSplit[1] : '';
    const arrSplitFecha = strFecha.split("-");
    const strTipo = (arrSplitFecha.length > 1)? arrSplit[0] : '';
    const strYear = (arrSplitFecha.length > 1)? arrSplitFecha[0] : '';
    const strMesSemana = (arrSplitFecha.length > 1)? arrSplitFecha[1] : '';
    const csrftoken = getCookie('csrftoken');
    const objForm = new FormData();
    const strFamily = document.getElementById('family').value;
    const objModal = document.getElementById('modal_body_detalles');

    const elementEnd = document.getElementById('date_end');
    objForm.append("tipo", strTipo);
    objForm.append("year", strYear);
    objForm.append("mes_semana", strMesSemana);
    objForm.append("family", strFamily);
    objForm.append("reporte", "familias");
    objForm.append('fecha', elementEnd.value);

    const response = await fetch(urlGetDetails, { method: 'POST', headers: { 'X-CSRFToken': csrftoken }, body: objForm });
    const objData = await response.json();


    if (objData.status) {
        let objDrawTable = objData.reporte;

        let strBody = '';

        if (strType.search("Mes") > -1) {

            strBody = `
                <div class="row">
                    <div class="col-12">
                        <button type='button' class='btn btn-outline-primary' onclick='getClientByGroup("${strType}")'>
                            Cliente por Grupo
                        </button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <div id="divReal" style="height: 100%; overflow-y: scroll;"></div>
                    </div>
                </div>
            `;
            $(() => {

                $('#divReal').dxDataGrid({
                    dataSource: objDrawTable,
                    height: 1000,
                    with:100,
                    showColumnLines: true,
                    showRowLines: true,
                    showBorders: true,
                    columnAutoWidth: true,
                    paging: { enabled: false },
                    pager: {
                        showPageSizeSelector: true,
                        allowedPageSizes: [15, 25, 50, 100],
                    },
                    remoteOperations: false,
                    searchPanel: {
                        visible: true,
                        highlightCaseSensitive: false,
                    },
                    groupPanel: { visible: false },
                    grouping: {
                        autoExpandAll: false,
                    },
                    export: { enabled: true },
                    allowColumnReordering: true,
                    rowAlternationEnabled: true,
                    columnAutoWidth: true,
                    showBorders: true,
                    wordWrapEnabled: true,
                    columnMinWidth: 140,
                    columnAutoWidth: 140,
                    columns: [
                        {
                            dataField: "ClasificacionPRD",
                            caption: "Grupos",
                            width: 160,
                            minWidth: 160,
                        },
                        {
                            dataField: "UnidadesMesAnterior",
                            caption: "Libras Mes Anterior",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            }
                        },
                        {
                            dataField: "Unidades",
                            caption: "Libras Mes Actual",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            }
                        },
                        {
                            dataField: "UnidadesTrimestral",
                            caption: "Libras Promedio Trimestral",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            }
                        },
                        {
                            dataField: "Presupuesto",
                            caption: "Libras Presupuesto",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            }
                        },
                        {
                            dataField: "DiferenciaUnidadesMensual",
                            caption: "Libras Mes Actual vs Libras Mes Anterior",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            },
                        },
                        {
                            dataField: "DiferenciaUnidadesTrimestral",
                            caption: "Libras Mes Actual vs Libras Promedio Trimestral",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            },
                            sortOrder: 'asc',
                        },
                        {
                            dataField: "DiferenciaUnidadesPresupuesto",
                            caption: "Libras Mes Actual vs Libras Presupuesto",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "fixedPoint",
                                precision: 2
                            },
                        },
                        {
                            dataField: "VentaMesAnterior",
                            caption: "Venta Mes Anterior",
                            headers:"Justify",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                        },
                        {
                            dataField: "VentaNeta",
                            caption: "Venta Mes Actual",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                        },
                        {
                            dataField: "VentaTrimestral",
                            caption: "Promedio Trimestral",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                        },
                        {
                            dataField: "DiferenciaMensualVenta",
                            caption: "Mes Actual vs Mes Anterior",
                            headers:"Justify",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                        },
                        {
                            dataField: "DiferenciaTrimestralVenta",
                            caption: "Mes Actual vs Promedio Trimestral (Q)",
                            dataType: "number",
                            alignment: "right",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                        },
                    ],
                    onRowClick(e) {
                        getProductos(strTipo, strYear, strMesSemana, e.data);
                    },
                    onRowPrepared(info) {
                        if(info.rowType == 'data') {
                            info.rowElement[0].style.cursor = "pointer";
                        }
                    },
                    onCellPrepared(info){

                        if(info.rowType == 'data') {

                            if (typeof info.data.DiferenciaMensualVenta === "string" &&
                                info.data.DiferenciaMensualVenta == info.value) {
                                const intDiferenciaVenta = (info.data.DiferenciaMensualVenta * 1);

                                if (intDiferenciaVenta < 0) {
                                    info.cellElement[0].style.color = "red";
                                }
                                else {
                                    info.cellElement[0].style.color = "green";
                                }

                            }

                            if (typeof info.data.DiferenciaTrimestralVenta === "string" &&
                                info.data.DiferenciaTrimestralVenta == info.value) {
                                const intDiferenciaVenta = (info.data.DiferenciaTrimestralVenta * 1);

                                if (intDiferenciaVenta < 0) {
                                    info.cellElement[0].style.color = "red";
                                }
                                else {
                                    info.cellElement[0].style.color = "green";
                                }

                            }

                            if (typeof info.data.DiferenciaVentaPresupuesto === "string" &&
                                info.data.DiferenciaVentaPresupuesto == info.value) {
                                const intDiferenciaVenta = (info.data.DiferenciaVentaPresupuesto * 1);

                                if (intDiferenciaVenta < 0) {
                                    info.cellElement[0].style.color = "red";
                                }
                                else {
                                    info.cellElement[0].style.color = "green";
                                }

                            }

                            if (typeof info.data.DiferenciaUnidadesMensual === "string" &&
                                info.data.DiferenciaUnidadesMensual == info.value) {
                                const intDiferenciaUnidades = (info.data.DiferenciaUnidadesMensual * 1);

                                if (intDiferenciaUnidades < 0) {
                                    info.cellElement[0].style.color = "red";
                                }
                                else {
                                    info.cellElement[0].style.color = "green";
                                }

                            }

                            if (typeof info.data.DiferenciaUnidadesTrimestral === "string" &&
                                info.data.DiferenciaUnidadesTrimestral == info.value) {
                                const intDiferenciaUnidades = (info.data.DiferenciaUnidadesTrimestral * 1);

                                if (intDiferenciaUnidades < 0) {
                                    info.cellElement[0].style.color = "red";
                                }
                                else {
                                    info.cellElement[0].style.color = "green";
                                }

                            }

                        }
                    },
                });
            });

        }

        objModal.innerHTML = strBody;

        $('#modal_detalles').modal('show');
    }
    close_loading();
}

function getProductos(strTipo, strYear, strMesSemana, arrData) {
    open_loading();
    const csrftoken = getCookie('csrftoken');
    const objForm = new FormData();
    const objModal = document.getElementById('modal_body_detalles');
    const elementEnd = document.getElementById('date_end');
    objForm.append("tipo", strTipo);
    objForm.append("year", strYear);
    objForm.append("mes_semana", strMesSemana);
    objForm.append("family", arrData.ClasificacionPRD);
    objForm.append("reporte", "productos");
    objForm.append('fecha', elementEnd.value);

    fetch(urlGetDetails, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: objForm
    })
        .then(response => response.json())
        .then( (data) => {

            if (data.status) {

                let strBody = '';

                strBody = `
                    <div class="row">
                        <div class="col-12">
                            <div id="divProductos" style="height: 100%; overflow-y: scroll;"></div>
                        </div>
                    </div>
                `;
                $(() => {

                    $('#divProductos').dxDataGrid({
                        dataSource: data.reporte,
                        with:100,
                        showColumnLines: true,
                        showRowLines: true,
                        showBorders: true,
                        columnAutoWidth: true,
                        paging: { enabled: false },
                        pager: {
                            showPageSizeSelector: true,
                            allowedPageSizes: [15, 25, 50, 100],
                        },
                        remoteOperations: false,
                        searchPanel: {
                            visible: true,
                            highlightCaseSensitive: false,
                        },
                        groupPanel: { visible: false },
                        grouping: {
                            autoExpandAll: false,
                        },
                        export: { enabled: true },
                        allowColumnReordering: true,
                        rowAlternationEnabled: true,
                        showBorders: true,
                        wordWrapEnabled: true,
                        columnMinWidth: 140,
                        columnAutoWidth: 140,
                        columns: [
                            {
                                dataField: "CodProducto",
                                caption: "Código",
                            },
                            {
                                dataField: "Descripcion",
                                caption: "Producto",
                                width: 160,
                                minWidth: 160,
                            },
                            {
                                dataField: "UnidadesMesAnterior",
                                caption: "Libras Mes Anterior",
                                dataType: "number",
                                alignment: "right",
                                format: {
                                    type: "fixedPoint",
                                    precision: 2
                                }
                            },
                            {
                                dataField: "Unidades",
                                caption: "Libras Mes Actual",
                                dataType: "number",
                                alignment: "right",
                                format: {
                                    type: "fixedPoint",
                                    precision: 2
                                }
                            },
                            {
                                dataField: "UnidadesTrimestral",
                                caption: "Libras Trimiestarles",
                                dataType: "number",
                                alignment: "right",
                                format: {
                                    type: "fixedPoint",
                                    precision: 2
                                }
                            },
                            {
                                dataField: "DiferenciaUnidadesMensual",
                                caption: "Mes Anterior vs Mes Actual",
                                dataType: "number",
                                alignment: "right",
                                format: {
                                    type: "fixedPoint",
                                    precision: 2
                                }
                            },
                            {
                                dataField: "VentaMesAnterior",
                                caption: "Venta Mes Anterior (Q)",
                              
                                dataType: "number",
                                alignment: "right",
                                format: {
                                    type: "currency",
                                    precision: 2,
                                    currency: "GTQ"
                                },
                            },
                            {
                                dataField: "VentaNeta",
                                caption: "Venta Mes Actual (Q)",
                                dataType: "number",
                                alignment: "right",
                                format: {
                                    type: "currency",
                                    precision: 2,
                                    currency: "GTQ"
                                },
                            },
                            {
                                dataField: "VentaTrimestral",
                                caption: "Promedio Trimestral (Q)",
                                dataType: "number",
                                alignment: "right",
                                format: {
                                    type: "currency",
                                    precision: 2,
                                    currency: "GTQ"
                                },
                            },
                            {
                                dataField: "DiferenciaMensualVenta",
                                caption: "Mes actual vs Mes anterior(Q)",
                                dataType: "number",
                                alignment: "right",
                                format: {
                                    type: "currency",
                                    precision: 2,
                                    currency: "GTQ"
                                },
                            },
                            {
                                dataField: "DiferenciaTrimestralVenta",
                                caption: "Mes actual vs Promedio trimestral",
                                dataType: "number",
                                alignment: "right",
                                format: {
                                    type: "currency",
                                    precision: 2,
                                    currency: "GTQ"
                                },
                            },
                            {
                                dataField: "DiferenciaUnidadesTrimestral",
                                caption: "Libras mes Actual vs Libras Promedio Trimestral",
                                dataType: "number",
                                alignment: "right",
                                format: {
                                    type: "fixedPoint",
                                    precision: 2
                                },
                                sortOrder: 'asc',
                            },
                        ],
                        onRowClick(e) {
                            getClientes(strTipo, strYear, strMesSemana, e.data);
                        },
                        onRowPrepared(info) {
                            if(info.rowType == 'data') {
                                info.rowElement[0].style.cursor = "pointer";
                            }
                        },
                        onCellPrepared(info){

                            if(info.rowType == 'data') {

                                if (typeof info.data.DiferenciaMensualVenta === "string" &&
                                    info.data.DiferenciaMensualVenta == info.value) {
                                    const intDiferenciaVenta = (info.data.DiferenciaMensualVenta * 1);

                                    if (intDiferenciaVenta < 0) {
                                        info.cellElement[0].style.color = "red";
                                    }
                                    else {
                                        info.cellElement[0].style.color = "green";
                                    }

                                }

                                if (typeof info.data.DiferenciaTrimestralVenta === "string" &&
                                    info.data.DiferenciaTrimestralVenta == info.value) {
                                    const intDiferenciaVenta = (info.data.DiferenciaTrimestralVenta * 1);

                                    if (intDiferenciaVenta < 0) {
                                        info.cellElement[0].style.color = "red";
                                    }
                                    else {
                                        info.cellElement[0].style.color = "green";
                                    }

                                }

                                if (typeof info.data.DiferenciaVentaPresupuesto === "string" &&
                                    info.data.DiferenciaVentaPresupuesto == info.value) {
                                    const intDiferenciaVenta = (info.data.DiferenciaVentaPresupuesto * 1);

                                    if (intDiferenciaVenta < 0) {
                                        info.cellElement[0].style.color = "red";
                                    }
                                    else {
                                        info.cellElement[0].style.color = "green";
                                    }

                                }

                                if (typeof info.data.DiferenciaUnidadesMensual === "string" &&
                                    info.data.DiferenciaUnidadesMensual == info.value) {
                                    const intDiferenciaUnidades = (info.data.DiferenciaUnidadesMensual * 1);

                                    if (intDiferenciaUnidades < 0) {
                                        info.cellElement[0].style.color = "red";
                                    }
                                    else {
                                        info.cellElement[0].style.color = "green";
                                    }

                                }

                                if (typeof info.data.DiferenciaUnidadesTrimestral === "string" &&
                                    info.data.DiferenciaUnidadesTrimestral == info.value) {
                                    const intDiferenciaUnidades = (info.data.DiferenciaUnidadesTrimestral * 1);

                                    if (intDiferenciaUnidades < 0) {
                                        info.cellElement[0].style.color = "red";
                                    }
                                    else {
                                        info.cellElement[0].style.color = "green";
                                    }

                                }

                            }
                        },
                    });
                });

                objModal.innerHTML = strBody;

                $('#modal_detalles').modal('show');
            }

            close_loading();
        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification('Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.', "warning", "danger");
        });

}

function getClientes(strTipo, strYear, strMesSemana, arrData) {
    open_loading();
    const csrftoken = getCookie('csrftoken');
    const objForm = new FormData();
    const strFamily = document.getElementById('family').value;
    const objModal = document.getElementById('modal_body_detalles');
    const elementEnd = document.getElementById('date_end');
    objForm.append("tipo", strTipo);
    objForm.append("year", strYear);
    objForm.append("mes_semana", strMesSemana);
    objForm.append("family", strFamily);
    objForm.append("reporte", "clientes");
    objForm.append("noproducto", arrData.NoProducto);
    objForm.append('fecha', elementEnd.value);

    fetch(urlGetDetails, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: objForm
    })
        .then(response => response.json())
        .then( (data) => {

            if (data.status) {

                let strBody = `
                        <div class="row">
                            <div class="col-12">
                                <div id="divClientes" style="height: 100%; overflow-y: scroll;"></div>
                            </div>
                        </div>
                    `;

                $(() => {

                        $('#divClientes').dxDataGrid({
                            dataSource: data.reporte,
                            with:100,
                            showColumnLines: true,
                            showRowLines: true,
                            showBorders: true,
                            columnAutoWidth: true,
                            paging: { enabled: false },
                            pager: {
                                showPageSizeSelector: true,
                                allowedPageSizes: [15, 25, 50, 100],
                            },
                            remoteOperations: false,
                            searchPanel: {
                                visible: true,
                                highlightCaseSensitive: false,
                            },
                            groupPanel: { visible: false },
                            grouping: {
                                autoExpandAll: false,
                            },
                            export: { enabled: true },
                            allowColumnReordering: true,
                            rowAlternationEnabled: true,
                            showBorders: true,
                            wordWrapEnabled: true,
                            columnMinWidth: 140,
                            columnAutoWidth: 140,
                            columns: [
                                {
                                    dataField: "Producto",
                                },
                                {
                                    dataField: "CodCliente",
                                    caption: "Código",
                                },
                                {
                                    dataField: "Nombre",
                                    caption: "Cliente",
                                },
                                {
                                    dataField: "NombreVendedor",
                                    caption: "Vendedor",
                                },
                                 {
                                    dataField: "UnidadesMesAnterior",
                                    caption: "Libras Mes Anterior",
                                    dataType: "number",
                                    alignment: "right",
                                    format: {
                                        type: "fixedPoint",
                                        precision: 2
                                    }
                                },
                                {
                                    dataField: "Unidades",
                                    caption: "Libras Mes Actual",
                                    dataType: "number",
                                    alignment: "right",
                                    format: {
                                        type: "fixedPoint",
                                        precision: 2
                                    }
                                },
                                {
                                    dataField: "UnidadesTrimestral",
                                    caption: "Libras Promedio Trimestral",
                                    dataType: "number",
                                    alignment: "right",
                                    format: {
                                        type: "fixedPoint",
                                        precision: 2
                                    }
                                },
                                {
                                    dataField: "DiferenciaUnidadesMensual",
                                    caption: "Libras mes actual vs Libras mes anterior ",
                                    dataType: "number",
                                    alignment: "right",
                                    format: {
                                        type: "fixedPoint",
                                        precision: 2
                                    },
                                },
                                {
                                    dataField: "DiferenciaUnidadesTrimestral",
                                    caption: "Libras mes actual vs Libras Promedio Trimestral",
                                    dataType: "number",
                                    alignment: "right",
                                    format: {
                                        type: "fixedPoint",
                                        precision: 2
                                    },
                                    sortOrder: 'asc',
                                },
                                {
                                    dataField: "VentaMesAnterior",
                                    caption: "Venta Mes Anterior",
                                    dataType: "number",
                                    alignment: "right",
                                    format: {
                                        type: "currency",
                                        precision: 2,
                                        currency: "GTQ"
                                    }
                                },
                                {
                                    dataField: "VentaNeta",
                                    caption: "Venta Mes Actual",
                                    dataType: "number",
                                    alignment: "right",
                                    format: {
                                        type: "currency",
                                        precision: 2,
                                        currency: "GTQ"
                                    },
                                },
                                {
                                    dataField: "VentaTrimestral",
                                    caption: "Promedio Trimestral",
                                    dataType: "number",
                                    alignment: "right",
                                    format: {
                                        type: "currency",
                                        precision: 2,
                                        currency: "GTQ"
                                    },
                                },
                                {
                                    dataField: "DiferenciaMensualVenta",
                                    caption: "Mes Actual vs Mes Anterior",
                                    dataType: "number",
                                    alignment: "right",
                                    format: {
                                        type: "currency",
                                        precision: 2,
                                        currency: "GTQ"
                                    },
                                },
                                {
                                    dataField: "DiferenciaTrimestralVenta",
                                    caption: "Mes actual vs Promedio Trimestral",
                                    dataType: "number",
                                    alignment: "right",
                                    format: {
                                        type: "currency",
                                        precision: 2,
                                        currency: "GTQ"
                                    },
                                },
                              
                            ],
                            onCellPrepared(info){

                                if(info.rowType == 'data') {

                                    if (typeof info.data.DiferenciaMensualVenta === "string" &&
                                        info.data.DiferenciaMensualVenta == info.value) {
                                        const intDiferenciaVenta = (info.data.DiferenciaMensualVenta * 1);

                                        if (intDiferenciaVenta < 0) {
                                            info.cellElement[0].style.color = "red";
                                        }
                                        else {
                                            info.cellElement[0].style.color = "green";
                                        }

                                    }

                                    if (typeof info.data.DiferenciaTrimestralVenta === "string" &&
                                        info.data.DiferenciaTrimestralVenta == info.value) {
                                        const intDiferenciaVenta = (info.data.DiferenciaTrimestralVenta * 1);

                                        if (intDiferenciaVenta < 0) {
                                            info.cellElement[0].style.color = "red";
                                        }
                                        else {
                                            info.cellElement[0].style.color = "green";
                                        }

                                    }

                                    if (typeof info.data.DiferenciaUnidadesMensual === "string" &&
                                        info.data.DiferenciaUnidadesMensual == info.value) {
                                        const intDiferenciaUnidades = (info.data.DiferenciaUnidadesMensual * 1);

                                        if (intDiferenciaUnidades < 0) {
                                            info.cellElement[0].style.color = "red";
                                        }
                                        else {
                                            info.cellElement[0].style.color = "green";
                                        }

                                    }

                                    if (typeof info.data.DiferenciaUnidadesTrimestral === "string" &&
                                        info.data.DiferenciaUnidadesTrimestral == info.value) {
                                        const intDiferenciaUnidades = (info.data.DiferenciaUnidadesTrimestral * 1);

                                        if (intDiferenciaUnidades < 0) {
                                            info.cellElement[0].style.color = "red";
                                        }
                                        else {
                                            info.cellElement[0].style.color = "green";
                                        }

                                    }

                                }
                            },
                        });
                    });

                objModal.innerHTML = strBody;

            }

            close_loading();
        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification('Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.', "warning", "danger");
        });

}
