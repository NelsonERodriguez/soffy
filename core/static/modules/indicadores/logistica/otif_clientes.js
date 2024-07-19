loadData();

async function loadData() {
    open_loading();
    const objMonths = await searchInfo();
    const objWeeks = await searchInfo(true);
    close_loading();
}

async function searchInfo(boolMonths = false) {
    open_loading();
    let formData = new FormData(),
        urlSearch = '';

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
        tdRowLibras = '',
        tdRowPresupuesto = '',
        tdCosto = '';

    for(let k in objResult){
        const d = objResult[k];
        let intLB = (d.devoluciones * 1),
            intCosto = 100 - (d.porcentaje * 1),
            intPedidos = numberFormat.format(d.pedidos * 1);
        intLB = intLB.toFixed(4);
        intCosto = intCosto.toFixed(4);
        intLB = numberFormat.format(intLB);

        strTH += `<th>Mes ${d.mes}</th>`;
        tdRowLibras += `<td class='tdDetailNoMargin' >${intLB}</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin' >${intPedidos}</td>`;
        tdCosto += `<td class='tdDetailNoMargin' >${intCosto} %</td>`;
        let pb = 100 - ( d.periodo_base * 1);
        let objetivo = 100 - (d.objetivo * 1);
        arrReturn[k] = {
            'month': `Mes ${d.mes}`,
            'real': (intCosto * 1),
            'period': (objetivo * 1),
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
                                            % Otif Clientes
                                        </td>
                                        ${tdCosto}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Cantidad Devoluciones
                                        </td>
                                        ${tdRowLibras}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Cantidad Pedidos
                                        </td>
                                        ${tdRowPresupuesto}
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
        strObjective = d.period;
        strAlcance = d.objective;
    }

    const objGraphic = {
        'str_id': 'chartMonths',
        'title': 'Indicador Otif de Clientes de los Ultimos Cuatro Meses (según filtro)',
        'subTitle': '',
        'strObjective': strObjective,
        'strAlcance': strAlcance,
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'type': 'monthly',
        'valueChart': '.',
        'interval': 25,
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
        tdRowLibras = '',
        tdRowPresupuesto = '',
        tdCosto = '';

    for(let k in objResult){
        const d = objResult[k];
        let intLB = (d.devoluciones * 1),
            intPedidos = numberFormat.format(d.pedidos * 1),
            intCosto = 100 - (d.porcentaje * 1);
        intLB = intLB.toFixed(4);
        intCosto = intCosto.toFixed(4);
        intLB = numberFormat.format(intLB);
        strTH += `<th>Sem ${d.semana}</th>`;
        tdRowLibras += `<td class='tdDetailNoMargin' >${intLB}</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin' >${intPedidos}</td>`;
        tdCosto += `<td class='tdDetailNoMargin' >${intCosto} %</td>`;
        let pb = 100 - ( d.periodo_base * 1);
        let objetivo = 100 - (d.objetivo * 1);
        arrReturn[k] = {
            'week': `Semana ${d.semana}`,
            'real': (intCosto * 1),
            'period': (objetivo * 1),
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
                                            % Otif Clientes
                                        </td>
                                        ${tdCosto}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Cantidad Devoluciones
                                        </td>
                                        ${tdRowLibras}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Cantidad Pedidos
                                        </td>
                                        ${tdRowPresupuesto}
                                    </tr>
                                </tbody>
                            </table>`;
    return arrReturn;
}

function drawChartWeeks(objData) {
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

    const objGraphic = {
        'str_id': 'chartWeeks',
        'title': 'Indicador Otif de Clientes de las Ultimas Cuatro Semanas (según filtro)',
        'subTitle': '',
        'strObjective': strObjective,
        'strAlcance': strAlcance,
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'type': 'weekly',
        'valueChart': '.',
        'interval': 25,
        'uom': '%',
    };
    drawGlobalHighChartsLondon(objGraphic);
}