const makeObj = (obj, objCategories = {}) => {
    let arrCategories = [],
        arrDetail = [],
        arrPrevSeries = [],
        arrSeries = [],
        arrTable = [];

    if (Object.keys(objCategories).length >= 0) {
        for(const keyM in objCategories) {
            arrCategories.push(`Mes ${objCategories[keyM]}`);
        }
    }

    for(const k in obj) {
        const d = obj[k];
        if(typeof arrDetail[d.month] === 'undefined') {
            arrDetail[d.month] = [];
            if (Object.keys(arrCategories).length <= 0) {
                arrCategories.push(`Mes ${d.month}`);
            }
        }

        if(typeof arrPrevSeries[d.key_client] === 'undefined') {
            arrPrevSeries[d.key_client] = {
                'name': d.client,
                'data': [],
            };
            arrTable[d.key_client] = {
                'name': d.client,
                'data': [],
            };
        }

        let tmp = arrPrevSeries[d.key_client].data,
            tmpTable = arrTable[d.key_client].data;
        if(typeof tmp[d.month] === 'undefined') {
            tmp[d.month] = {
                'units': 0,
            };
            tmpTable[d.month] = {
                'total': 0,
                'units': 0,
            };
        }
        tmp[d.month].units = (tmp[d.month].units * 1) + (d.units * 1);
        tmpTable[d.month].total = (tmpTable[d.month].total * 1) + (d.total * 1);
        tmpTable[d.month].units = (tmpTable[d.month].units * 1) + (d.units * 1);
    }

    for(const k in arrPrevSeries) {
        const d = arrPrevSeries[k];
        let prevData = [];
        for(const key in objCategories) {
            const category = objCategories[key];

            if(typeof d.data[category] !== 'undefined') {
                const detail = d.data[category];
                prevData.push( (detail.units.toFixed(0)) * 1 );
            }
            else {
                prevData.push( 0.00 );
            }
        }
        arrSeries.push({
            'data': prevData,
            'name': d.name,
        });
    }

    return {
        'detail': arrDetail,
        'arrCategories': arrCategories,
        'arrSeries': arrSeries,
        'arrTable': arrTable,
    };
};

const getTotalLastThreeMonths = async (objData) => {
    let intReturn = 0;
    for(const key in objData) {
        const data = objData[key];
        intReturn += (data.units * 1);
    }
    return intReturn;
};

const getTotalLastMonth = async (objTable, strDate) => {
    let intReturn = 0;
    for(const k in objTable) {
        const d = objTable[k];
        if (typeof d.data[strDate] !== 'undefined') {
            intReturn += d.data[strDate].units;
        }
    }
    return intReturn;
};

const drawInfoTableMonths = async (objResult, objCategories = {}, objVentas = {}) => {
    const content = document.getElementById('contentTableMonths'),
        elementMonth = document.getElementById('date_month');
    let objDraw = await makeObj(objResult, objCategories),
        strTHs = '',
        tBody = '',
        trLast = '',
        intTotalLast = 0,
        intTotalCurrentMonth = await getTotalLastMonth(objDraw.arrTable, elementMonth.value),
        intTotalLastMonthVGeneral = 0,
        intTotalVentas = 0,
        intTotalVentasCurrentMonth = 0,
        intTotalVentasUltimosMeses = 0;

    for(const k in objDraw.arrCategories) { strTHs = `<th>${objDraw.arrCategories[k]}</th>`; }

    for(const k in objDraw.arrTable) {
        const d = objDraw.arrTable[k];
        let strValMonth = (typeof d.data[elementMonth.value] !== 'undefined') ? d.data[elementMonth.value].units : 0,
            strUnitsMonth = (typeof d.data[elementMonth.value] !== 'undefined') ? d.data[elementMonth.value].units : 0;

        let intLastThreeMonths = await getTotalLastThreeMonths(d.data),
            intPromedio = intLastThreeMonths / 3,
            intDiferencia = (strValMonth * 1) - (intPromedio * 1);
            intPercentage = (strValMonth / intTotalCurrentMonth) * 100;
        intTotalVentasUltimosMeses += (intLastThreeMonths * 1);

        let strClassDifference = ((intDiferencia * 1) >= 0) ? 'good-difference' : 'bad-difference';
        intTotalLastMonthVGeneral = objVentas.find(d => d.month == elementMonth.value);
        intTotalLastMonthVGeneral = intTotalLastMonthVGeneral.units;

        tBody += `  <tr>
                        <td>${d.name}</td>
                        <td>${numberFormat.format((strValMonth * 1).toFixed(0))} libras</td>
                        <td>${numberFormat.format((intPercentage * 1).toFixed(0))} %</td>
                        <td>${numberFormat.format((intLastThreeMonths *1).toFixed(0))} libras</td>
                        <td>${numberFormat.format((intPromedio * 1).toFixed(0))} libras</td>
                        <td class='${strClassDifference}'>${numberFormat.format((intDiferencia * 1).toFixed(0))} libras</td>
                    </tr>`;
    }

    let objDrawLast = objVentas.find(detail => detail.month == elementMonth.value);
    if (objDrawLast) {
        trLast = `  <td>${numberFormat.format((objDrawLast.units * 1).toFixed(0))}</td>`;
        intTotalVentasCurrentMonth = objDrawLast.units * 1;
    }
    else {
        trLast = `  <td>0</td>`;
    }

    for(const k in objVentas) {
        const d = objVentas[k];
        intTotalVentas = ((intTotalVentas * 1) + (d.units * 1)).toFixed(0);
    }
    let intPromedio = ((intTotalVentas * 1) / 3).toFixed(0),
        intPercentageRetail = ((intTotalCurrentMonth * 1) / (intTotalVentasCurrentMonth * 1)) * 100,
        intPercentageThreeMonths = (intTotalVentasUltimosMeses / intTotalVentas) * 100;

    intPercentageRetail = isNaN(intPercentageRetail) ? 0 : intPercentageRetail;
    intPromedio = isNaN(intPromedio) ? 0 : intPromedio;
    let intPromedioVentasUltimosMeses = (intTotalVentasUltimosMeses * 1) / 3

    tBody += `  <tr>
                    <td>Total Ventas Retail</td>
                    <td>${numberFormat.format((intTotalCurrentMonth * 1).toFixed(0))} libras</td>
                    <td>-- -- -- --</td>
                    <td>${numberFormat.format((intTotalVentasUltimosMeses * 1).toFixed(0))} libras</td>
                    <td>${numberFormat.format((intPromedioVentasUltimosMeses * 1).toFixed(0))} libras</td>
                    <td>-- -- -- --</td>
                </tr>
                <tr>
                    <td>Total Ventas Generales</td>
                    ${trLast}
                    <td>-- -- -- --</td>
                    <td>${numberFormat.format((intTotalVentas * 1).toFixed(0))} libras</td>
                    <td>${numberFormat.format((intPromedio * 1).toFixed(0))} libras</td>
                    <td>-- -- -- --</td>
                </tr>
                <tr>
                    <td>Porcentaje Peso de Retail</td>
                    <td>${(intPercentageRetail).toFixed(0)}%</td>
                    <td>-- -- -- --</td>
                    <td>${numberFormat.format((intPercentageThreeMonths).toFixed(0))}%</td>
                    <td>-- -- -- --</td>
                    <td>-- -- -- --</td>
                </tr>`;

    const table = ` <table class='table table-london'>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                ${strTHs}
                                <th>Porcentaje Participacion</th>
                                <th>Total Venta Ultimos 3 Meses</th>
                                <th>Promedio Retail Ultimos 3 Meses</th>
                                <th>Diferencia al Dia</th>
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
    Highcharts.chart('contentInfoMonths', {
        chart: { type: 'column', },
        title: { text: 'Indicador Retail Ultimos Cuatro Meses (segun filtro)', },
        xAxis: [{
            categories:objChart.arrCategories,
            crosshair: true,
        }],
        yAxis: {
            min: 0,
            title: { text: 'En Libras' },
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
                dataLabels: { enabled: false },
            },
        },
        series: objChart.arrSeries,
        credits: { enabled: false },
        tooltip: { enabled: false },
    });
};

const searchInfo = async () => {
    open_loading();
    let formData = new FormData(),
        urlSearch = urlGetMonths;

    const element = document.getElementById('date_month'),
          elementFamily = document.getElementById('family');
    formData.append('month', element.value);
    formData.append('family', elementFamily.value);
    formData.append('csrfmiddlewaretoken', valCSRF);

    fetch(`${urlSearch}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(async(data) => {
        if(data.status) {
            if(Object.keys(data.result).length > 0) {
                let objLabelsChart = await drawInfoTableMonths(data.result, data?.categories.reverse(), data?.arr_ventas);
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

const elementsFilterToSearch = () => {
    return `<div class='row'>
                <div class='col-12 col-md-6'>
                    <div class='row'>
                        <div class='col-12 col-md-11'>
                            <div class="form-group">
                                <label for="date_month" class="bmd-label-floating">Buscar mes:</label>
                                <input type="month" max="${monthNow}" class="form-control" id="date_month" name="date_month" value="${monthNow}" onchange='searchInfo()'>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class='row'>
                <div class='col-12' id='contentInfoMonths' style="min-height: 700px;"></div>
                <div class='col-12' id='contentTableMonths'></div>
            </div>`;
};

const drawElementsIntoTabs = async (strElementID, boolFirst = false) => {
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
        loadData();
    }
};

drawElementsIntoTabs('mixtos', true);