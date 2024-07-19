drawElementsIntoTabs('listos', true);

async function drawElementsIntoTabs(strElementID, boolFirst = false) {
    let elem = document.getElementById('option');
    if(elem){
        const elements = document.querySelectorAll('.tab-pane');
        elements.forEach(element => {
            element.innerHTML = '';
        })
    }
    const content = document.getElementById(`${strElementID}`);
    content.innerHTML = '';
    content.innerHTML += `<input type='hidden' id='option' value='${strElementID}' />`;
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
    const elementFamily = document.getElementById('option'),
          elementMonth = document.getElementById('date_month');

    let objReturn = {},
        formData = new FormData();
    formData.append('option', elementFamily.value);
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
                let objLabelsChart = await drawInfoTableMonths(data.result, data.percentage_period, data.str_option);
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
    const elementFamily = document.getElementById('option'),
          elementWeek = document.getElementById('date_week');

    let objReturn = {},
        formData = new FormData();
    formData.append('option', elementFamily.value);
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
                let objLabelsChart = await drawInfoTableWeeks(data.result, data.percentage_period, data.str_option);
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

async function drawInfoTableMonths(objResult, intPeriod, strOption) {
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
    if(strOption == 'listos') {
        tdRowReal += `<td class='tdDetailNoMargin'>% Camiones disponibles</td>`;
        tdRowLibras += `<td class='tdDetailNoMargin'>Disponibles</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin'>No Disponibles</td>`;
    }
    else if(strOption == 'programados') {
        tdRowReal += `<td class='tdDetailNoMargin'>% Camiones Programados</td>`;
        tdRowLibras += `<td class='tdDetailNoMargin'>Programados</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin'>No Programados</td>`;
    }
    else if(strOption == 'ocupacion') {
        tdRowReal += `<td class='tdDetailNoMargin'>% Ocupados</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin'>% No Ocupados</td>`;
    }
    else if(strOption == 'eficiencia') {
        tdRowLibras += `<td class='tdDetailNoMargin'>% Eficientes</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin'>% No eficientes</td>`;
    }

    for(let k in objResult){
        const d = objResult[k];
        let intOne = 0,
            intReal = 0,
            intTwo = 0;
        strTH += `<th>Mes ${d.mes}</th>`;
        if(strOption == 'listos') {
            intReal = (d.disponible * 1).toFixed(0);
            intOne = (d.disponible * 1);
            intTwo = (d.nodisponible * 1).toFixed(0);
            tdRowReal += `<td>${intReal} %</td>`;
            tdRowLibras += `<td>${intOne} %</td>`;
            tdRowPresupuesto += `<td>${intTwo} %</td>`;
        }
        else if(strOption == 'programados') {
            intReal = (d.disponible * 1).toFixed(0);
            intOne = (d.disponible * 1);
            intTwo = (d.nodisponible * 1) ? (d.nodisponible * 1).toFixed(0) : (100 - (d.disponible * 1)).toFixed(0);
            tdRowReal += `<td>${intReal} %</td>`;
            tdRowLibras += `<td>${intOne} %</td>`;
            tdRowPresupuesto += `<td>${intTwo} %</td>`;
        }
        else if(strOption == 'ocupacion') {
            intReal = (d.transportado * 1).toFixed(0);
            intTwo = (d.notransportado * 1).toFixed(0);
            tdRowReal += `<td>${intReal} %</td>`;
            tdRowPresupuesto += `<td>${intTwo} %</td>`;
        }
        else if(strOption == 'eficiencia') {
//            if(k == 2){
//                d.eficiencia = 25;
//            }
//            if(k == 3){
//                d.eficiencia = 33;
//            }
            intOne = (d.eficiencia * 1);
            intReal = (d.eficiencia * 1).toFixed(0);
            intTwo = (d.noeficiencia * 1).toFixed(0);
            intReal = Math.abs(intReal);
            intTwo = Math.abs(intTwo);
            tdRowLibras += `<td>${intOne} %</td>`;
            tdRowPresupuesto += `<td>${intTwo} %</td>`;
        }

        arrReturn[k] = {
            'month': `Mes ${d.mes}`,
            'real': (intReal * 1),
            'period': (d.objetivo * 100),
            'objective': (d.periodo_base * 100),
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
                                        ${tdRowReal}
                                    </tr>
                                    <tr>
                                        ${tdRowPresupuesto}
                                    </tr>
                                    <tr>
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
        strObjective = d.period;
        strAlcance = d.objective;
    }

    const objGraphic = {
        'str_id': 'chartMonths',
        'title': 'Indicador Camiones de los Ultimos Cuatro Meses (según filtro)',
        'subTitle': '',
        'strObjective': strObjective,
        'strAlcance': strAlcance,
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'type': 'monthly',
        'uom': '%',
    };
    drawGlobalHighChartsLondon(objGraphic);
}

async function drawInfoTableWeeks(objResult, intPeriod, strOption) {
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

    if(strOption == 'listos') {
        tdRowReal += `<td class='tdDetailNoMargin'>% Camiones disponibles</td>`;
        tdRowLibras += `<td class='tdDetailNoMargin'>Disponibles</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin'>No Disponibles</td>`;
    }
    else if(strOption == 'programados') {
        tdRowReal += `<td class='tdDetailNoMargin'>% Camiones Programados</td>`;
        tdRowLibras += `<td class='tdDetailNoMargin'>Programados</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin'>No Programados</td>`;
    }
    else if(strOption == 'ocupacion') {
        tdRowReal += `<td class='tdDetailNoMargin'>% Ocupados</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin'>% No Ocupados</td>`;
    }
    else if(strOption == 'eficiencia') {
        tdRowLibras += `<td class='tdDetailNoMargin'>% Eficientes</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin'>% No eficientes</td>`;
    }

    for(let k in objResult){
        const d = objResult[k];
        let intOne = 0,
            intReal = 0,
            intTwo = 0;
        strTH += `<th>Sem ${d.semana}</th>`;
        if(strOption == 'listos') {
            intReal = (d.disponible * 1).toFixed(0);
            intOne = (d.disponible * 1);
            intTwo = (d.nodisponible * 1).toFixed(0);
            tdRowReal += `<td>${intReal} %</td>`;
            tdRowLibras += `<td>${intOne} %</td>`;
            tdRowPresupuesto += `<td>${intTwo} %</td>`;
        }
        else if(strOption == 'programados') {
            intReal = (d.disponible * 1).toFixed(0);
            intOne = (d.disponible * 1);
            intTwo = (d.nodisponible) ? (d.nodisponible * 1).toFixed(0) : (100 - (d.disponible * 1)).toFixed(0);
            tdRowReal += `<td>${intReal} %</td>`;
            tdRowLibras += `<td>${intOne} %</td>`;
            tdRowPresupuesto += `<td>${intTwo} %</td>`;
        }
        else if(strOption == 'ocupacion') {
            intReal = (d.transportado * 1).toFixed(0);
            intTwo = (d.notransportado * 1).toFixed(0);
            tdRowReal += `<td>${intReal} %</td>`;
            tdRowPresupuesto += `<td>${intTwo} %</td>`;
        }
        else if(strOption == 'eficiencia') {
            intOne = (d.eficiencia * 1);
            intReal = (d.eficiencia * 1).toFixed(0);
            intTwo = (d.noeficiencia * 1).toFixed(0);
            tdRowLibras += `<td>${intOne} %</td>`;
            tdRowPresupuesto += `<td>${intTwo} %</td>`;
        }

        arrReturn[k] = {
            'week': `Semana ${d.semana}`,
            'real': (intReal * 1),
            'period': (d.objetivo * 100),
            'objective': (d.periodo_base * 100),
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
                                        ${tdRowReal}
                                    </tr>
                                    <tr>
                                        ${tdRowPresupuesto}
                                    </tr>
                                    <tr>
                                        ${tdRowLibras}
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
        strObjective = '',
        strAlcance = '';
    for(const k in objData){
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
        'title': 'Indicador Camiones de las Ultimas Cuatro Semanas (según filtro)',
        'subTitle': '',
        'strObjective': strObjective,
        'strAlcance': strAlcance,
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'type': 'weekly',
        'uom': '%',
    };
    drawGlobalHighChartsLondon(objGraphic);
}