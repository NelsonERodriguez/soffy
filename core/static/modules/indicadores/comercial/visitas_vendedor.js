loadData();

async function loadData() {
    open_loading();
    const objMonths = await searchInfo();
    const objWeeks = await searchInfo(true);
    close_loading();
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
        salesman = document.getElementById('sltVendedor');
    
    formData.append('salesman', salesman.value);
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
    contentGraphicsWeeks.innerHTML = `  <div class='row' id='chartMonths' style='max-height: 500px; margin: 50px 0;'></div>
                                        <div class='row' id='tableMonths'>
                                            <div class='col-12 col-md-12' id='tBodyTableMonths'></div>
                                        </div>`;
    let content = document.getElementById('tBodyTableMonths'),
        arrReturn = [],
        strTH = '',
        tdRowReal = '',
        tdRowLibras = '',
        tdRowPresupuesto = '';

    for(let k in objResult){
        const d = objResult[k];
        let intLB = (d.visitadas * 1),
            intTotal = (d.programadas * 1);
        intLB = intLB.toFixed(0);
        intLB = numberFormat.format(intLB);
        intTotal = intTotal.toFixed(0);
        intTotal = numberFormat.format(intTotal);

        let intReal = (d.porcentaje_mes * 100).toFixed(0);
        strTH += `<th>Mes ${d.mes}</th>`;
        tdRowReal += `<td class='tdDetailNoMargin'>${intReal} %</td>`;
        tdRowLibras += `<td class='tdDetailNoMargin' >${intTotal}</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin' >${intLB}</td>`;
        let pb = ( d.perido_base * 100 );
        pb = pb.toFixed(0);
        arrReturn[k] = {
            'month': `Mes ${d.mes}`,
            'real': (intReal * 1),
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
                                            % Cumplimiento Visitas
                                        </td>
                                        ${tdRowReal}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            No. Visitas Completadas
                                        </td>
                                        ${tdRowPresupuesto}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            No. Visitas Planeadas
                                        </td>
                                        ${tdRowLibras}
                                    </tr>
                                </tbody>
                            </table>`;
    return arrReturn;
}

function drawChartMonths(objData) {
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
        strAlcance = d.objective;
        strObjective = d.period;
    }

    const objGraphic = {
        'str_id': 'chartMonths',
        'title': 'Indicador de Visitas de los Ultimos Cuatro Meses (según filtro)',
        'subTitle': '',
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'type': 'monthly',
        'strAlcance': strAlcance,
        'strObjective': strObjective,
        'uom': '%',
    };
    drawGlobalHighChartsLondon(objGraphic);
}

async function drawInfoTableWeeks(objResult, intPeriod) {
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
        tdRowPresupuesto = '';

    for(let k in objResult){
        const d = objResult[k];
        let intLB = (d.visitadas * 1),
            intTotal = (d.programadas * 1);
        intLB = intLB.toFixed(0);
        intLB = numberFormat.format(intLB);
        intTotal = intTotal.toFixed(0);
        intTotal = numberFormat.format(intTotal);
        let intReal = (d.porcentaje_semana * 100).toFixed(0);
        strTH += `<th>Sem ${d.semana}</th>`;
        tdRowReal += `<td class='tdDetailNoMargin'>${intReal} %</td>`;
        tdRowLibras += `<td class='tdDetailNoMargin' >${intTotal}</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin' >${intLB}</td>`;
        let pb = ( d.perido_base * 100 );
        pb = pb.toFixed(0);
        arrReturn[k] = {
            'week': `Semana ${d.semana}`,
            'real': (intReal * 1),
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
                                            % Cumplimiento Visitas
                                        </td>
                                        ${tdRowReal}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            No. Visitas Completadas
                                        </td>
                                        ${tdRowPresupuesto}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            No. Visitas Planeadas
                                        </td>
                                        ${tdRowLibras}
                                    </tr>
                                </tbody>
                            </table>`;
    return arrReturn;
}

function drawChartWeeks(objData) {
    console.log('drawChartWeeks');
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
        strAlcance = d.objective;
        strObjective = d.period;
    }

    const objGraphic = {
        'str_id': 'chartWeeks',
        'title': 'Indicador de Visitas de las Ultimas Cuatro Semanas (según filtro)',
        'subTitle': '',
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'type': 'weekly',
        'strAlcance': strAlcance,
        'strObjective': strObjective,
        'uom': '%',
    };
    drawGlobalHighChartsLondon(objGraphic);
}