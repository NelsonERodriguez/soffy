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
        const objMonths = await searchMonths();
        const objWeeks = await searchWeeks();
        close_loading();
    }
}

async function elementsFilterToSearch(){
    return `<div class='row'>
                <div class='col-12 col-md-6'>
                    <div class='row'>
                        <div class='col-12 col-md-11'>
                            <div class="form-group">
                                <label for="date_month" class="bmd-label-floating">Buscar cuatro meses atrás desde:</label>
                                <input type="month" class="form-control" id="date_month" name="date_month" value="${monthNow}" max="${monthNow}" onchange='searchMonths()'>
                            </div>
                        </div>
                    </div>
                    <div class='row'>
                        <div class='col-12' id='contentInfoMonths'></div>
                    </div>
                </div>
                <div class='col-12 col-md-6'>
                    <div class='row'>
                        <div class='col-12 col-md-11'>
                            <div class="form-group">
                                <label for="date_week" class="bmd-label-floating">Buscar cuatro semanas atrás desde:</label>
                                <input type="week" max="${dateNow}" class="form-control" id="date_week" name="date_week" value="${dateNow}" onchange='searchWeeks()'>
                            </div>
                        </div>
                    </div>
                    <div class='row'>
                        <div class='col-12' id='contentInfoWeeks'></div>
                    </div>
                </div>
            </div>`;
}

async function searchMonths() {
    open_loading();
    const elementFamily = document.getElementById('family'),
          elementMonth = document.getElementById('date_month');

    let objReturn = {},
        formData = new FormData();
    formData.append('family', elementFamily.value);
    formData.append('month', elementMonth.value);
    formData.append('csrfmiddlewaretoken', valCSRF);
    fetch(`${urlGetMonths}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(async(data) => {
        if(data.status){
            if(Object.keys(data.result).length > 0) {
                let objLabelsChart = await drawInfoTableMonths(data.result, data.percentage_period);
                drawChartMonths(objLabelsChart);
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
    const elementFamily = document.getElementById('family'),
          elementWeek = document.getElementById('date_week');

    let objReturn = {},
        formData = new FormData();
    formData.append('family', elementFamily.value);
    formData.append('week', elementWeek.value);
    formData.append('csrfmiddlewaretoken', valCSRF);
    fetch(`${urlGetWeeks}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(async(data) => {
        if(data.status){
            if(Object.keys(data.result).length > 0) {
                let objLabelsChart = await drawInfoTableWeeks(data.result, data.percentage_period);
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
        let intLB = (d.libras * 1),
            intTotal = (d.total * 1);
        intLB = intLB.toFixed(0);
        intLB = numberFormat.format(intLB);
        intTotal = intTotal.toFixed(0);
        intTotal = numberFormat.format(intTotal);
        let intReal = (d.int_percentage * 1).toFixed(0);
        strTH += `<th>Mes ${d.month}</th>`;
        tdRowReal += `<td class='tdDetailNoMargin'>${intReal} %</td>`;
        tdRowLibras += `<td class='tdDetailNoMargin' >${intTotal} lb</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin' >${intLB} lb</td>`;
        
        arrReturn[k] = {
            'month': `Mes ${d.month}`,
            'real': (intReal * 1),
            'period': (intPeriod * 1),
            'objective': (d.periodo * 1),
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
                                            Presupuesto Libras
                                        </td>
                                        ${tdRowLibras}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Total Libras
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
        'title': 'Indicador Presupuesto Walmart de los Ultimos Cuatro Meses (según filtro)',
        'subTitle': '',
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'strObjective': strObjective.toFixed(0),
        'strAlcance': strAlcance.toFixed(0),
        'type': 'monthly',
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
        let intPercentage = 100,
            intLB = (d.libras * 1),
            intTotal = (d.total * 1),
            intReal = (d.int_percentage * 1).toFixed(0);
        intLB = intLB.toFixed(0);
        intLB = numberFormat.format(intLB);
        intTotal = intTotal.toFixed(0);
        intTotal = numberFormat.format(intTotal);

        strTH += `<th>Sem ${d.week}</th>`;
        tdRowReal += `<td>${intReal} %</td>`;
        tdRowLibras += `<td>${intTotal} lb</td>`;
        tdRowPresupuesto += `<td>${intLB} lb</td>`;
        
        arrReturn[k] = {
            'week': `Semana ${d.week}`,
            'real': (intReal * 1),
            'period': (intPeriod * 1),
            'objective': (d.periodo * 1),
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
                                        <td>% Cumplimiento Ventas</td>
                                        ${tdRowReal}
                                    </tr>
                                    <tr>
                                        <td>Presupuesto Libras</td>
                                        ${tdRowLibras}
                                    </tr>
                                    <tr>
                                        <td>Total Libras</td>
                                        ${tdRowPresupuesto}
                                    </tr>
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
        strObjective = '';
    for(const k in objData){
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
        'title': 'Indicador Presupuesto Walmart de las Ultimas Cuatro Semanas (según filtro)',
        'subTitle': '',
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'strObjective': strObjective.toFixed(0),
        'strAlcance': strAlcance.toFixed(0),
        'type': 'weekly',
        'uom': '%',
    };
    drawGlobalHighChartsLondon(objGraphic);
}