getAllData();

async function getAllData(e = this) {
    e.preventDefault;
    await searchWeeks();
}

async function searchWeeks() {
    open_loading();
    const elementWeek = document.getElementById('date_week');

    let objReturn = {},
        formData = new FormData();
    formData.append('date_week', elementWeek.value);
    formData.append('csrfmiddlewaretoken', valCSRF);
    fetch(`${urlGetWeeks}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(async(data) => {
        if(data.status){
            if(Object.keys(data.result).length > 0) {
                let objLabelsChart = await drawInfoTableWeeks(data);
                drawChartWeeks(objLabelsChart);
                drawChartSuppliers(data);
            }
            else {
                alert_nova.showNotification("No hay información a mostrar, intenta cambiar los filtros.", "warning", "danger");
            }
            close_loading();
        }
    })
    .catch(error => console.error(error))
}

async function drawInfoTableWeeks(objData, strValueMode) {
    let objResult = objData.result;
    const contentGraphicsWeeks = document.getElementById('contentInfoWeeks');
    contentGraphicsWeeks.innerHTML = `  <div class='row' id='chartWeeks' style='max-height: 500px; margin: 50px 0;'></div>
                                        <div class='row' id='tableWeeks'>
                                            <div class='col-12 col-md-12' id='tBodyTableWeeks'></div>
                                        </div>`;
    document.getElementById('contentInfoSuppliers').innerHTML = `<div class='row' id='chartSupplier' style='max-height: 500px; margin: 50px 0;'></div>`;
    let content = document.getElementById('tBodyTableWeeks'),
        arrReturn = [],
        strTH = '',
        tdRowTwo = '',
        tdRowOne = '',
        tdRowT = '';

    for(const k in objResult){
        const week = objResult[k];

        let intLength = Object.keys(week).length,
            intOtif = 0,
            strWeek = '';
        for(const k in week) {
            const detail = week[k];
            if(typeof detail.otif !== 'undefined') {
                if(typeof detail.proveedor !== 'undefined') {
                    if (detail.otif)
                        intOtif++;
                }
                else {
                    intLength--;
                }
            }
            strWeek = detail.semana;
        }

        let percentage = ((intOtif * 1) / (intLength * 1) * 100).toFixed(0);
        arrReturn[k] = {
            'week': `Semana ${strWeek}`,
            'real': percentage * 1,
            'str_y': '%',
        };
        strTH += `<th>Semana ${strWeek}</th>`;
        tdRowOne += `<td>${intLength}</td>`;
        tdRowTwo += `<td>${intOtif}</td>`;
        tdRowT += `<td>${(intLength - intOtif)}</td>`;
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
                                        <td>Cantidad total de P.O.</td>
                                        ${tdRowOne}
                                    </tr>
                                    <tr>
                                        <td>Cantidad de P.O. Cumplidas</td>
                                        ${tdRowTwo}
                                    </tr>
                                    <tr>
                                        <td>Cantidad de P.O. No Cumplidas</td>
                                        ${tdRowT}
                                    </tr>
                                </tbody>
                            </table>`;
    return arrReturn;
}

function drawChartWeeks(objData){
    let objCategories = [],
        objReal = [],
        strY = '';
    for(const k in objData){
        const d = objData[k];
        objCategories.push(d.week);
        objReal.push(d.real);
        strY = d.str_y;
    }
    const objGraphic = {
        'str_id': 'chartWeeks',
        'title': 'Indicador Otif Proveedores de las Ultimas Cuatro Semanas (según filtro)',
        'subTitle': '',
        'objCategories': objCategories,
        'objReal': objReal,
        'type': 'weekly',
        'uom': strY,
        'valueChart': strY,
    };
    drawGlobalHighChartsLondon(objGraphic);
}

async function getObjSuppliers(objData) {
    let arrReturn = [],
        arrCategories = [],
        intLengthData = Object.keys(objData).length;

    const objDataLoop = objData[intLengthData - 1];
    for(const w in objDataLoop) {
        const d = objDataLoop[w];
        if(d?.proveedor) {
            let strProvider = (d.proveedor).toLowerCase();
            strProvider = (strProvider).replaceAll(' ', '_');
            strProvider = (strProvider).replaceAll(',', '_');
            strProvider = (strProvider).replaceAll('.', '_');

            if(typeof arrReturn[strProvider] === 'undefined') {
                arrReturn[strProvider] = [];
                arrCategories.push(d.proveedor);
            }

            arrReturn[strProvider].push(d);
        }
    }
    return {
        'data': arrReturn,
        'categories': arrCategories,
    }
}

async function drawChartSuppliers(objData) {
    let objAllSuppliers = await getObjSuppliers(objData.result),
        arrReal = [],
        arrCategories = objAllSuppliers['categories'];

    for(let k in objAllSuppliers['data']) {
        const d = objAllSuppliers['data'][k];
        let intLength = Object.keys(d).length,
            intDone = 0;

        d.forEach(detail => {
            if(detail?.otif) {
                if(detail.otif) { intDone++; }
            }
        })
        let prevInt = ((intDone / intLength) * 100).toFixed(0);

        arrReal.push((prevInt * 1));
    }

    Highcharts.chart('chartSupplier', {
        chart: {
            zoomType: 'xy',
            backgroundColor: '#F8F8F8',
            type: 'bar',
        },
        title: { text: 'Ranking de Proveedores' },
        xAxis: [{
            categories: arrCategories,
            crosshair: true
        }],
        credits: { enabled: false },
        yAxis: [
            {
                labels: { format: '{value} %', },
                title: { text: '', },
                tickInterval: 25,
            },
        ],
        tooltip: { shared: true },
        legend: { enabled: false, },
        series: [
            {
                name: 'Real',
                type: 'column',
                data: arrReal,
                tooltip: { valueSuffix: '' },
                color: '#2E75B6',
                dataLabels: {
                    format: "{y} %",
                    enabled: true,
                    color: "white",
                    shadow: true,
                    style: { fontSize: "14px", textShadow: "0px" },
                    verticalAlign: "bottom",
                    y: 1000,
                }
            },
        ],
    });
}