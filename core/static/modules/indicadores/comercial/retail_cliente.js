const makeObj = (obj) => {
    let arrCategories = [],
        arrPrevCategories = [],
        arrDetail = [],
        arrPrevSeries = [],
        arrSeries = [],
        arrTable = [];

    for(const k in obj) {
        const d = obj[k];
        if(typeof arrPrevCategories[d.key_client] === 'undefined') {
            arrPrevCategories[d.key_client] = {
                'client': d.client,
            };
        }

        if(typeof arrPrevSeries[d.key_descripcion] === 'undefined') {
            arrPrevSeries[d.key_descripcion] = {
                'name': d.descripcion,
                'data': [],
            };
        }
    }

//    tengo que recorrer arrPrevCategories para armar bien las categorias, para mantener el mismo orden
//    arrCategories.push(d.client);


    console.log(arrPrevCategories,'arrPrevCategories');
    console.log(arrPrevSeries,'arrPrevSeries, arrPrevSeries');

    return {
        'detail': arrDetail,
        'arrCategories': arrCategories,
        'arrSeries': arrSeries,
        'arrTable': arrTable,
    };
};

const drawInfoTableMonths = async (objResult) => {
    const content = document.getElementById('contentTableMonths');
    let objDraw = await makeObj(objResult),
        strTHs = '',
        tBody = '',
        trLast = '',
        intTotalLast = 0;

    for(const k in objDraw.arrCategories) { strTHs += `<th>${objDraw.arrCategories[k]}</th>`; }

    for(const k in objDraw.arrTable) {
        const d = objDraw.arrTable[k];
        let total = 0,
            strTD = '';

        for(const key in objDraw.arrCategories) {
            const category = objDraw.arrCategories[key];
            let strKey = category.replace('Mes', '');
            strKey = strKey.replace(' ', '');

            if(typeof d.data[`${strKey}`] !== 'undefined') {
                const detail = d.data[strKey];
                strTD += `<td>Q ${numberFormat.format(detail)}</td>`;
                total += (detail * 1);
            }
            else {
                strTD += `<td>Q ${0.00}</td>`;
            }
        }

        total = numberFormat.format(total.toFixed(2));
        tBody += `  <tr>
                        <td>${d.name}</td>
                        ${strTD}
                        <td>Q ${total}</td>
                    </tr>`;
    }

    for(const k in objDraw.detail) {
        const d = objDraw.detail[k];
        let total = 0;

        for(const key in d){
            const detail = d[key];
            total += (detail.total * 1)
        }
        intTotalLast += (total * 1);
        trLast += `<td>Q ${numberFormat.format(total)}</td>`;
    }

    tBody += `  <tr>
                    <td>Total</td>
                    ${trLast}
                    <td>Q ${numberFormat.format(intTotalLast)}</td>
                </tr>`;

    const table = ` <table class='table table-london'>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                ${strTHs}
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tBody}
                        </tbody>
                    </table>`;
//    content.innerHTML = table;
    return objDraw;
}

const drawChartMonths = (objChart) => {
    console.log(objChart, 'objChart');
    Highcharts.chart('contentInfoMonths', {
        chart: { type: 'column', },
        title: { text: 'Indicador Retail Ultimos Cuatro Meses (segun filtro)', },
        xAxis: [{
            categories:objChart.arrCategories,
            crosshair: true,
        }],
        yAxis: {
            min: 0,
            title: { text: 'En Quetzales' },
            tickInterval: 50000.00,
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
                dataLabels: { enabled: true },
            },
        },
        series: objChart.arrSeries,
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

const loadData = async () => {
    open_loading();
    const objMonths = await searchInfo();
    close_loading();
}

loadData();