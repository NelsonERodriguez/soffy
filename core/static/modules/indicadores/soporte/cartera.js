const drawInfoTableWeeks = async (objResult, intPeriod) => {
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
        let intTotal = ( (d.Vencido * 1) + (d.Corriente * 1) ),
            intPercentageVencido = ((d.Vencido * 1) / intTotal) * 100,
            intPercentageCorriente = ((d.Corriente * 1) / intTotal) * 100;

        let totalCartera = numberFormat.format(intTotal),
            vencido = numberFormat.format(d.Vencido),
            vigente = numberFormat.format(d.Corriente);
        intPercentageVencido = intPercentageVencido.toFixed(2);
        intPercentageCorriente = intPercentageCorriente.toFixed(2);

        strTH += `<th>Semana ${d.semana}</th>`;
        tdRowLibras += `<td class='tdDetailNoMargin' >Q ${vigente}</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin' >Q ${vencido}</td>`;
        tdCosto += `<td class='tdDetailNoMargin' >Q ${totalCartera}</td>`;

        arrReturn[k] = {
            'month': `Semana ${d.semana}`,
            'vencida': (intPercentageVencido * 1),
            'vigente': (intPercentageCorriente * 1),
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
                                            Cartera Total
                                        </td>
                                        ${tdCosto}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Cartera Vigente
                                        </td>
                                        ${tdRowLibras}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Cartera Vencida
                                        </td>
                                        ${tdRowPresupuesto}
                                    </tr>
                                </tbody>
                            </table>`;
    return arrReturn;
};

const drawInfoTableMonths = async (objResult, intPeriod) => {
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
        let intTotal = ( (d.Vencido * 1) + (d.Corriente * 1) ),
            intPercentageVencido = ((d.Vencido * 1) / intTotal) * 100,
            intPercentageCorriente = ((d.Corriente * 1) / intTotal) * 100;

        let totalCartera = numberFormat.format(intTotal),
            vencido = numberFormat.format(d.Vencido),
            vigente = numberFormat.format(d.Corriente);
        intPercentageVencido = intPercentageVencido.toFixed(2);
        intPercentageCorriente = intPercentageCorriente.toFixed(2);

        strTH += `<th>Mes ${d.mes}</th>`;
        tdRowLibras += `<td class='tdDetailNoMargin' >Q ${vigente}</td>`;
        tdRowPresupuesto += `<td class='tdDetailNoMargin' >Q ${vencido}</td>`;
        tdCosto += `<td class='tdDetailNoMargin' >Q ${totalCartera}</td>`;

        arrReturn[k] = {
            'month': `Mes ${d.mes}`,
            'vencida': (intPercentageVencido * 1),
            'vigente': (intPercentageCorriente * 1),
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
                                            Cartera Total
                                        </td>
                                        ${tdCosto}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Cartera Vigente
                                        </td>
                                        ${tdRowLibras}
                                    </tr>
                                    <tr>
                                        <td class='tdDetailNoMargin'>
                                            Cartera Vencida
                                        </td>
                                        ${tdRowPresupuesto}
                                    </tr>
                                </tbody>
                            </table>`;
    return arrReturn;
};

const drawChartWeeks = (objData) => {
    let objCategories = [],
        arrVencida = [],
        arrObjetivo = [],
        arrVigente = [];
    for(const k in objData){
        const d = objData[k];
        objCategories.push(d.month);
        arrVencida.push(d.vencida);
        arrVigente.push(d.vigente);
        arrObjetivo.push(80);
    }

    Highcharts.chart('chartWeeks', {
        chart: { type: 'column' },
        title: { text: 'Indicador de Cartera de las Ultimas Cuatro Semanas (según filtro)' },
        xAxis: { categories: objCategories },
        yAxis: {
            min: 0,
            max: 100,
            title: { text: '' },
            labels: {
                format: '{value} ' + '%',
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
            shadow: false
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: { enabled: true }
            }
        },
        series: [{
            name: 'Vencida',
            data: arrVencida,
            color: '#FF0000',
            dataLabels: { format: "{y} " + "%",}
        }, {
            name: 'Vigente',
            data: arrVigente,
            color: '#00CC66',
            dataLabels: { format: "{y} " + "%",}
        }, {
            name: 'Objetivo',
            type: 'spline',
            data: arrObjetivo,
            tooltip: { valueSuffix: '' },
            color: '#1A4F77',
        },],
        credits: { enabled: false },
    });
};

const drawChartMonths = (objData) => {
    let objCategories = [],
        arrVencida = [],
        arrVigente = [],
        arrObjetivo = [];
    for(const k in objData){
        const d = objData[k];
        objCategories.push(d.month);
        arrVencida.push(d.vencida);
        arrVigente.push(d.vigente);
        arrObjetivo.push(80);
    }

    Highcharts.chart('chartMonths', {
        chart: { type: 'column' },
        title: { text: 'Indicador de Cartera en los Ultimos Cuatro Meses (según filtro)' },
        xAxis: { categories: objCategories },
        yAxis: {
            min: 0,
            max: 100,
            title: { text: '' },
            labels: {
                format: '{value} ' + '%',
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
            shadow: false
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: { enabled: true }
            }
        },
        series: [{
            name: 'Vencida',
            data: arrVencida,
            color: '#FF0000',
            dataLabels: { format: "{y} " + "%",}
        }, {
            name: 'Vigente',
            data: arrVigente,
            color: '#00CC66',
            dataLabels: { format: "{y} " + "%",}
        }, {
            name: 'Objetivo',
            type: 'spline',
            data: arrObjetivo,
            tooltip: { valueSuffix: '' },
            color: '#1A4F77',
        },],
        credits: { enabled: false },
    });
};

const searchInfoMonths = async () => {
    open_loading();
    let formData = new FormData(),
        urlSearch = '';

    const element = document.getElementById('date_month');
    formData.append('month', element.value);
    urlSearch = urlGetMonths;
    formData.append('csrfmiddlewaretoken', valCSRF);
    fetch(`${urlSearch}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(async(data) => {
        if(data.status) {
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
};

const searchInfoWeeks = async () => {
    open_loading();
    let formData = new FormData(),
        urlSearch = '';

    const element = document.getElementById('date_week');
    formData.append('week', element.value);
    urlSearch = urlGetWeeks;
    formData.append('csrfmiddlewaretoken', valCSRF);
    fetch(`${urlSearch}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(async(data) => {
        if(data.status) {
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
};

const loadData = async () => {
    open_loading();
    await searchInfoMonths();
    await searchInfoWeeks();
    close_loading();
};

loadData();




