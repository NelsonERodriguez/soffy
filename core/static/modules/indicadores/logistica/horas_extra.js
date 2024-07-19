loadData();

async function loadData() {
    open_loading();
    const objWeeks = await searchInfo();
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
                let objLabelsChart = await drawInfoTableWeeks(data.result);
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

async function drawInfoTableWeeks(objResult) {
    const contentGraphicsWeeks = document.getElementById('contentInfoWeeks');
    contentGraphicsWeeks.innerHTML = `  <div class='row' id='chartWeeks' style='max-height: 500px; margin: 50px 0;'></div>
                                        <div class='row' id='tableWeeks'>
                                            <div class='col-12 col-md-12' id='tBodyTableWeeks'></div>
                                        </div>`;
    let content = document.getElementById('tBodyTableWeeks'),
        arrReturn = [],
        strTH = '',
        tdRowLibras = '',
        tdHorasSimples = '',
        tdHorasDobles = '',
        intTotalLb = 0,
        intTotalHrS = 0,
        intTotalHrD = 0;

    for(let k in objResult){
        const d = objResult[k];
        let intLibras = numberFormat.format(d.libras * 1);

        strTH += `<th>${d.str_dia}</th>`;
        tdRowLibras += `<td class='tdDetailNoMargin' >${intLibras} lb</td>`;
        tdHorasSimples += `<td class='tdDetailNoMargin' >${d.simples} hrs</td>`;
        tdHorasDobles += `<td class='tdDetailNoMargin' >${d.dobles} hrs</td>`;

        intTotalLb += (d.libras * 1);
        intTotalHrS += (d.simples * 1);
        intTotalHrD += (d.dobles * 1);
        arrReturn[k] = {
            'week': `${d.str_dia}`,
            'simples': (d.simples * 1),
            'dobles': (d.dobles * 1),
            'libras': (d.libras * 1),
        };
    }
    intTotalLb = numberFormat.format(intTotalLb)
    content.innerHTML = `   <table class='table table-london'>
                                <thead>
                                    <tr>
                                        <th></th>
                                        ${strTH}
                                        <th>Totales</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Horas Extras Simples
                                        </td>
                                        ${tdHorasSimples}
                                        <td class='tdDetailNoMargin'>
                                            ${intTotalHrS} hrs
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Horas Extras Dobles
                                        </td>
                                        ${tdHorasDobles}
                                        <td class='tdDetailNoMargin'>
                                            ${intTotalHrD} hrs
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Libras Transportadas
                                        </td>
                                        ${tdRowLibras}
                                        <td class='tdDetailNoMargin'>
                                            ${intTotalLb} lbs
                                        </td>
                                    </tr>
                                </tbody>
                            </table>`;
    return arrReturn;
}

function drawChartWeeks(objData) {
    let objCategories = [],
        objLibras = [],
        objHorasSimples = [],
        objHorasDobles = [];
    for(const k in objData) {
        const d = objData[k];
        objCategories.push(d.week);
        objLibras.push(d.libras);
        objHorasSimples.push(d.simples);
        objHorasDobles.push(d.dobles);
    }
    console.log(objCategories);
    console.log(objData);

    Highcharts.chart('chartWeeks', {
        chart: { zoomType: 'xy' },
        title: { text: 'Indicador Relación Horas Extras / Libras Transportadas (según filtro)' },
        xAxis: [{
            categories: objCategories,
            crosshair: true
        }],
        yAxis: [
            {
                labels: {
                    format: '{value} lb',
                    style: { color: Highcharts.getOptions().colors[1] }
                },
                title: {
                    text: 'Libras',
                    style: { color: Highcharts.getOptions().colors[1] }
                }
            },
            {
                title: {
                    text: 'Horas',
                    style: { color: Highcharts.getOptions().colors[0] }
                },
                labels: {
                    format: '{value}',
                    style: { color: Highcharts.getOptions().colors[0] }
                },
                opposite: true
            }
        ],
        tooltip: { shared: true },
        legend: {
            layout: 'vertical',
            align: 'left',
            x: 120,
            verticalAlign: 'top',
            y: 100,
            floating: true,
            backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || 'rgba(255,255,255,0.25)'
        },
        series: [{
            name: 'Horas simples',
            type: 'column',
            yAxis: 1,
            data: objHorasSimples,
            tooltip: { valueSuffix: ' Horas' },
            dataLabels: {
                format: "{y} hr",
                enabled: true,
                color: "white",
                shadow: true,
                style: { fontSize: "14px", textShadow: "0px" },
                verticalAlign: "bottom",
                y: 1000,
            }
        },{
            name: 'Horas Dobles',
            type: 'column',
            yAxis: 1,
            data: objHorasDobles,
            tooltip: { valueSuffix: ' Horas' },
            dataLabels: {
                format: "{y} hr",
                enabled: true,
                color: "white",
                shadow: true,
                style: { fontSize: "14px", textShadow: "0px" },
                verticalAlign: "bottom",
                y: 1000,
            }
        },{
            name: 'Libras Transportadas',
            type: 'spline',
            data: objLibras,
            tooltip: { valueSuffix: ' lb' },
            color: '#DA2C2C',
        }]
    });
}