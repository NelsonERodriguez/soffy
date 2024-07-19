const makeObj = (obj) => {
    let arrCategories = [],
        arrDetail = [],
        arrSeries = [];

    for(const k in obj) {
        const d = obj[k];
        if(typeof arrDetail[d.mes] === 'undefined') {
            arrDetail[d.mes] = [];
            arrCategories.push(`Mes ${d.mes}`);
        }

        if(typeof arrSeries[0] === 'undefined'){
            arrSeries[5] = {
                'name': 'Corriente',
                'data': [(d.Corriente *1)],
            };
            arrSeries[4] = {
                'name': 'De 1 a 30 días',
                'data': [(d.s121 * 1)],
            };
            arrSeries[3] = {
                'name': 'De 31 a 60 días',
                'data': [(d.saldo120 * 1)],
            };
            arrSeries[2] = {
                'name': 'De 61 a 90 días',
                'data': [(d.saldo90 * 1)],
            };
            arrSeries[1] = {
                'name': 'De 91 a 120 días',
                'data': [(d.saldo60 * 1)],
            };
            arrSeries[0] = {
                'name': 'A mas de 121 días',
                'data': [(d.saldo30 *1)],
            };
        }
        else {
            let tmp0 = arrSeries[0].data,
                tmp1 = arrSeries[1].data,
                tmp2 = arrSeries[2].data,
                tmp3 = arrSeries[3].data,
                tmp4 = arrSeries[4].data;
                tmp5 = arrSeries[5].data;
            tmp5.push((d.Corriente * 1));
            tmp0.push((d.s121 * 1));
            tmp1.push((d.saldo120 * 1));
            tmp2.push((d.saldo90 * 1));
            tmp3.push((d.saldo60 * 1));
            tmp4.push((d.saldo30 * 1));
        }

        arrDetail[d.mes][0] = {
            'saldo': d.saldo30,
            'str_detail': 'De 1 a 30 días',
            'saldototal': d.saldototal,
            'corriente': d.Corriente,
            'mes': d.mes,
            'objetivo': d.objetivo,
            'periodo_base': d.periodo_base,
        };
        arrDetail[d.mes][1] = {
            'saldo': d.saldo60,
            'str_detail': 'De 31 a 60 días',
            'saldototal': d.saldototal,
            'corriente': d.Corriente,
            'mes': d.mes,
            'objetivo': d.objetivo,
            'periodo_base': d.periodo_base,
        };
        arrDetail[d.mes][2] = {
            'saldo': d.saldo90,
            'str_detail': 'De 61 a 90 días',
            'saldototal': d.saldototal,
            'corriente': d.Corriente,
            'mes': d.mes,
            'objetivo': d.objetivo,
            'periodo_base': d.periodo_base,
        };
        arrDetail[d.mes][3] = {
            'saldo': d.saldo120,
            'str_detail': 'De 91 a 120 días',
            'saldototal': d.saldototal,
            'corriente': d.Corriente,
            'mes': d.mes,
            'objetivo': d.objetivo,
            'periodo_base': d.periodo_base,
        };
        arrDetail[d.mes][4] = {
            'saldo': d.s121,
            'str_detail': 'A más de 120 días',
            'saldototal': d.saldototal,
            'corriente': d.Corriente,
            'mes': d.mes,
            'objetivo': d.objetivo,
            'periodo_base': d.periodo_base,
        };
    }

    return {
        'detail': arrDetail,
        'arrCategories': arrCategories,
        'arrSeries': arrSeries,
    };
};

const drawInfoTableMonths = async (objResult) => {
    const content = document.getElementById('contentTableMonths');
    let objDraw = await makeObj(objResult),
        strTHs = '',
        tBody = '',
        trLast = '';

    for(const k in objDraw.arrCategories) { strTHs += `<th>${objDraw.arrCategories[k]}</th>`; }

    for (let i = 5; i >= 0; i--) {
        const objDetail = objDraw.arrSeries[i];
        tBody += `  <tr>
                        <td>${objDetail.name}</td>`;
        for(const d in objDetail.data){
            const detail = objDetail.data[d];
            tBody += `<td>Q ${numberFormat.format((detail * 1).toFixed(0))}</td>`;
        }
        tBody += `</tr>`;
    }

    for(const k in objDraw.detail) {
        const d = objDraw.detail[k];
        let intTotal = 0;
        if(typeof d[0] !== 'undefined') { intTotal = d[0].saldototal; }
        trLast += `<td>Q ${numberFormat.format((intTotal * 1).toFixed(0))}</td>`;
    }

    tBody += `  <tr>
                    <td>Total</td>
                    ${trLast}
                </tr>`;

    const table = ` <table class='table table-london'>
                        <thead>
                            <tr>
                                <th>Descripcion del Desglose</th>
                                ${strTHs}
                            </tr>
                        </thead>
                        <tbody>
                            ${tBody}
                        </tbody>
                    </table>`;
    content.innerHTML = table;
    return objDraw;
}

const drawChartMonths = (objChart) => {
    Highcharts.chart('contentInfoGlobal', {
        chart: { type: 'column', },
        title: { text: 'Indicador Deslizamiento de la Cartera Ultimos Cuatro Meses (segun filtro)', },
        xAxis: [{
            categories:objChart.arrCategories,
            crosshair: true,
        }],
        colors: arrColors,
        yAxis: {
            min: 0,
            title: { text: 'En Quetzales' },
            tickInterval: 1000000.00,
            stackLabels: {
                enabled: true,
                style: {
                    fontWeight: 'bold',
                    color: (
                        Highcharts.defaultOptions.title.style &&
                        Highcharts.defaultOptions.title.style.color
                    ) || 'gray'
                }
            },
        },
        legend: {
            align: 'right',
            x: -30,
            verticalAlign: 'top',
            y: 25,
            floating: true,
            backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || 'white',
            borderColor: '#CCC',
            borderWidth: 1,
            shadow: false,
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: { enabled: false },
            },
        },
        series: objChart.arrSeries,
        credits: {
            enabled: false
        },
    });
};

const drawChartsDetail = (objChart) => {
    const content = document.getElementById('rowContentDetail');
    content.innerHTML = '';
    let arrSeries = [];

    for(let i = 4; i >= 0; i--) {
        const detail = objChart.arrSeries[i];
        arrSeries.push({
            'name': detail.name,
            'data': detail.data
        });
    }

    Highcharts.chart(content, {
        chart: {
            type: 'line',
            backgroundColor: '#F8F8F8',
        },
        title: { text: `Indicador Desglose Cartera (segun filtro)`, },
        xAxis: [{
            categories: objChart.arrCategories,
            crosshair: true
        }],
        colors: arrColors,
        credits: { enabled: false },
        series: arrSeries.reverse(),
    });
};

const searchInfo = async () => {
    open_loading();
    let formData = new FormData(),
        urlSearch = urlGetMonths;

    const element = document.getElementById('date_month');
    formData.append('month', element.value);
    formData.append('csrfmiddlewaretoken', valCSRF);

    fetch(`${urlSearch}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(async(data) => {
        if(data.status) {
            if(Object.keys(data.result).length > 0) {
                let objLabelsChart = await drawInfoTableMonths(data.result);
                open_loading();
                drawChartMonths(objLabelsChart);
                drawChartsDetail(objLabelsChart);
                close_loading();
            }
            else {
                alert_nova.showNotification("No hay información a mostrar, intenta cambiar los filtros.", "warning", "danger");
            }
            close_loading();
        }
    })
    .catch(error => console.error(error))
}

const loadData = async () => {
    open_loading();
    const objMonths = await searchInfo();
    close_loading();
}

loadData();