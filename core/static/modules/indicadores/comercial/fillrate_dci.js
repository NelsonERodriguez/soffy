drawElementsIntoTabs('cuadriles', true);

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
        open_loading();
        const objMonths = await searchInfo();
        const objWeeks = await searchInfo(true);
        close_loading();
    }
}

async function searchBySalesman() {
    open_loading();
    const objMonths = await searchInfo();
    const objWeeks = await searchInfo(true);
    close_loading();
}

async function searchInfo(boolMonths = false) {
    let formData = new FormData(),
        urlSearch = '',
        family = document.getElementById('family');

    formData.append('family', family.value);
    if(boolMonths) {
        const element = document.getElementById('date_month');
        formData.append('month', element.value);
        urlSearch = urlGetMonths;
    }
    else {
        const element = document.getElementById('date_week');
        formData.append('week', element.value);
        urlSearch = urlGetWeeks;
    }
    formData.append('csrfmiddlewaretoken', valCSRF);
    fetch(`${urlSearch}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(async(data) => {
        if(data.status) {
            if(Object.keys(data.result).length > 0) {
                if(boolMonths) {
                    let objLabelsChart = await drawInfoTableMonths(data.result, data.percentage_period);
                    drawChartMonths(objLabelsChart);
                }
                else {
                    let objLabelsChart = await drawInfoTableWeeks(data.result, data.percentage_period);
                    drawChartWeeks(objLabelsChart);
                }
            }
            else {
                alert_nova.showNotification("No hay información a mostrar, intenta cambiar los filtros.", "warning", "danger");
            }
            close_loading();
        }
    })
    .catch(error => console.error(error))
}

async function drawInfoTableMonths(objResult, intPeriod) {
    const contentGraphicsWeeks = document.getElementById('contentInfoMonths');
    //max-height: 500px; height: 500px; margin: 50px 0;
    contentGraphicsWeeks.innerHTML = `  <div class='col-12' id='chartMonths' style='display: table-row; min-height: 340px;'></div>
                                        <div class='col-12' id='tableMonths'>
                                            <div class='row' id='tBodyTableMonths'></div>
                                        </div>`;
    let content = document.getElementById('tBodyTableMonths'),
        arrReturn = [],
        strTH = '',
        tdRowReal = '',
        tdRowLibras = '',
        tdRowPresupuesto = '';

    for(let k in objResult){
        const d = objResult[k];
        if((d.tipo).toUpperCase() !== 'CUADRILES'){
            d.periodo_base = 0.55;
        }
        let intLB = (d.presupuesto * 1),
            intTotal = (d.venta * 1);
        intLB = intLB.toFixed(0);
        intLB = numberFormat.format(intLB);
        intTotal = intTotal.toFixed(0);
        intTotal = numberFormat.format(intTotal);
        let intReal = (d.porcentaje_mes * 100).toFixed(0);
        strTH += `<th>Mes ${d.mes}</th>`;
        intReal = ( (intReal * 1) > 100 ) ? 100 : (intReal * 1);
        tdRowReal += `<td class='tdDetailNoMargin'>${intReal} %</td>`;
        tdRowLibras += `<td class='tdDetailNoMargin' >${intTotal}</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin' >${intLB}</td>`;
        let pb = (d.periodo_base * 100);
        pb = pb.toFixed(0);
        arrReturn[k] = {
            'month': `Mes ${d.mes}`,
            'real': intReal,
            'period': (intPeriod * 1),
            'objective': (pb * 1),
        };
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
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Presupuesto
                                        </td>
                                        ${tdRowPresupuesto}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Total Ventas
                                        </td>
                                        ${tdRowLibras}
                                    </tr>
                                </tbody>
                            </table>`;
    return arrReturn;
}

async function drawChartMonths(objData) {
    let objCategories = [],
        objReal = [],
        objObjective = [],
        objAlcance = [],
        strObjective = '',
        strAlcance = '';
    for(const k in objData){
        const d = objData[k];
        objCategories.push(d.month);
        objReal.push(d.real);
        objObjective.push(d.period);
        objAlcance.push(d.objective);
        strObjective = d.period;
        strAlcance = d.objective;
    }

    strAlcance = ( (strAlcance * 1) > 100 ) ? await objSetValuesMax(objAlcance) : strAlcance;
    strObjective = ( (strObjective * 1) > 100 ) ? await objSetValuesMax(objObjective) : strObjective;
    const objGraphic = {
        'str_id': 'chartMonths',
        'title': 'Indicador FillRate DCI de los Ultimos Cuatro Meses (según filtro)',
        'subTitle': '',
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'type': 'monthly',
        'strObjective': strObjective.toFixed(0),
        'strAlcance': strAlcance.toFixed(0),
        'uom': '%',
    };
    drawGlobalHighChartsLondon(objGraphic);
}

async function drawInfoTableWeeks(objResult, intPeriod) {
    const contentGraphicsWeeks = document.getElementById('contentInfoWeeks');
    contentGraphicsWeeks.innerHTML = `  <div class='col-12' id='chartWeeks' style='display: table-row; min-height: 340px;'></div>
                                        <div class='col-12' id='tableWeeks'>
                                            <div class='row' id='tBodyTableWeeks'></div>
                                        </div>`;
    let content = document.getElementById('tBodyTableWeeks'),
        arrReturn = [],
        strTH = '',
        tdRowReal = '',
        tdRowLibras = '',
        tdRowPresupuesto = '';

    for(let k in objResult){
        const d = objResult[k];
        if((d.tipo).toUpperCase() !== 'CUADRILES'){
            d.periodo_base = 0.55;
        }

        let intLB = (d.presupuesto * 1),
            intTotal = (d.venta * 1);
        intLB = intLB.toFixed(0);
        intLB = numberFormat.format(intLB);
        intTotal = intTotal.toFixed(0);
        intTotal = numberFormat.format(intTotal);
        let intReal = (d.porcentaje_semana * 100).toFixed(0);
        strTH += `<th>Sem ${d.semana}</th>`;
        intReal = ( (intReal * 1) > 100 ) ? 100 : (intReal * 1);
        tdRowReal += `<td class='tdDetailNoMargin'>${intReal} %</td>`;
        tdRowLibras += `<td class='tdDetailNoMargin' >${intTotal}</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin' >${intLB}</td>`;
        let pb = (d.periodo_base * 100);
        pb = pb.toFixed(0)
        arrReturn[k] = {
            'week': `Semana ${d.semana}`,
            'real': intReal,
            'period': (intPeriod * 1),
            'objective': (pb * 1),
        };
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
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Presupuesto
                                        </td>
                                        ${tdRowPresupuesto}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Total Ventas
                                        </td>
                                        ${tdRowLibras}
                                    </tr>
                                </tbody>
                            </table>`;
    return arrReturn;
}

async function drawChartWeeks(objData) {
    let objCategories = [],
        objReal = [],
        objObjective = [],
        objAlcance = [],
        strObjective = '',
        strAlcance = '';
    for(const k in objData) {
        const d = objData[k];
        objCategories.push(d.week);
        objReal.push(d.real);
        objObjective.push(d.period);
        objAlcance.push(d.objective);
        strObjective = d.period;
        strAlcance = d.objective;
    }

    strAlcance = ( (strAlcance * 1) > 100 ) ? await objSetValuesMax(objAlcance) : strAlcance;
    strObjective = ( (strObjective * 1) > 100 ) ? await objSetValuesMax(objObjective) : strObjective;
    const objGraphic = {
        'str_id': 'chartWeeks',
        'title': 'Indicador FillRate DCI de los Ultimas Cuatro Semanas (según filtro)',
        'subTitle': '',
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'type': 'weekly',
        'strObjective': strObjective.toFixed(0),
        'strAlcance': strAlcance.toFixed(0),
        'uom': '%',
    };
    drawGlobalHighChartsLondon(objGraphic);
}

async function objSetValuesMax(objData) {
    console.log(objData);
    for(const k in objData) {
        objData[k] = 100;
    }
    return 100;
}