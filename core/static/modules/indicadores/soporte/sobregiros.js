const drawInfoTableWeeks = async (objResult, intPeriod) => {
    const contentGraphicsWeeks = document.getElementById('contentChartWeeks');
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
        let intTotal = d?.sobregiro ? d.sobregiro : 0;

        let totalCartera = numberFormat.format((intTotal * 1).toFixed(0));

        strTH += `<th>Semana ${d.semana}</th>`;
        tdCosto += `<td class='tdDetailNoMargin' >Q ${totalCartera}</td>`;

        arrReturn[k] = {
            'week': `Semana ${d.semana}`,
            'real': (intTotal * 1).toFixed(0) * 1,
            'objetivo': (d.objetivo * 1).toFixed(0) * 1,
            'periodo_base': (d.periodo_base * 1).toFixed(0) * 1,
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
                                            Sobregiro
                                        </td>
                                        ${tdCosto}
                                    </tr>
                                </tbody>
                            </table>`;
    return arrReturn;
};

const drawInfoTableMonths = async (objResult, intPeriod) => {
    const contentGraphicsWeeks = document.getElementById('contentChartMonths');
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
        let intTotal = d?.sobregiro ? d.sobregiro : 0,
            intObjetivo = 0,
            intAlcance = 0;

        let totalCartera = numberFormat.format((intTotal*1).toFixed(0));

        strTH += `<th>Mes ${d.mes}</th>`;
        tdCosto += `<td class='tdDetailNoMargin' >Q ${totalCartera}</td>`;

        const objMonth = objGlobalDeslizamiento.find(detail => detail.mes == d.mes);
        console.log(objMonth, 'objMonth');
        console.log(intTotal, 'a');
        if(objMonth?.saldototal){
            intObjetivo = ((intTotal * 1) / (objMonth.saldototal * 1)) * 100;
            intAlcance = ((intTotal * 1) / (objMonth.saldototal * 1)) * 100;
        }

        arrReturn[k] = {
            'month': `Mes ${d.mes}`,
            'real': (intTotal * 1).toFixed(0) * 1,
            'objetivo': (intObjetivo * 1).toFixed(0) * 1,
            'periodo_base': (intAlcance * 1).toFixed(0) * 1,
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
                                            Sobregiro
                                        </td>
                                        ${tdCosto}
                                    </tr>
                                </tbody>
                            </table>`;
    return arrReturn;
};

const drawChart = (arrCategories, arrReal, arrObjective, arrAlcance, strType = 'monthly') => {
    let strTitle = 'Indicador Sobregiro de las Ultimas Cuatro Semanas (según filtro)',
        strContent = 'chartWeeks';
    if (strType === 'monthly') {
        strTitle = 'Indicador Sobregiro de los Ultimos Cuatro Meses (según filtro)';
        strContent = 'chartMonths';
    }
    Highcharts.chart(strContent, {
        chart: {
            type: 'cylinder',
            options3d: {
                enabled: true,
                alpha: 0,
                beta: 0,
                depth: 50,
                viewDistance: 15
            },
            backgroundColor: '#F8F8F8',
        },
        title: { text: strTitle },
        plotOptions: { series: { depth: 65, } },
        credits: { enabled: false },
        xAxis: [{
            categories: arrCategories,
            crosshair: true
        }],
        yAxis: [
            {
                labels: { format: '{value} Q', },
                title: { text: '', },
                // tickInterval: 30,
            },
        ],
        tooltip: { shared: true },
        legend: { enabled: false, },
        series: [{
            data: arrReal,
            name: 'Cylinders',
            showInLegend: false,
            color: strType === 'monthly' ? '#333F50' : '#2E75B6',
            dataLabels: {
                format: "{y} Q",
                enabled: true,
                color: "white",
                shadow: true,
                style: { fontSize: "14px", textShadow: "0px" },
                verticalAlign: "bottom",
                y: 1000,
            },
        },{
            name: 'Objetivo',
            type: 'spline',
            color: '#00FF00',
            data: arrObjective,
            tooltip: { valueSuffix: '' },
        },{
            name: 'Alcance',
            type: 'spline',
            color: '#FF0000',
            data: arrAlcance,
            tooltip: { valueSuffix: '' }
        }]
    });
};

const drawChartWeeks = (objData) => {
    let objCategories = [],
        arrReal = [],
        arrObjective = [],
        arrPeriodo = [];
    for(const k in objData){
        const d = objData[k];
        arrReal.push(d.real);
        objCategories.push(d.week);
        arrObjective.push(d.objetivo * 100);
        arrPeriodo.push(d.periodo_base * 100);
    }

    drawChart(objCategories, arrReal, arrObjective, arrPeriodo, 'weekly');
};

const drawChartMonths = (objData) => {
    let objCategories = [],
        arrReal = [],
        arrObjective = [],
        arrAlcance = [];
    for(const k in objData){
        const d = objData[k];
        arrReal.push(d.real);
        objCategories.push(d.month);
        arrObjective.push(d.objetivo);
        arrAlcance.push(d.periodo_base);
    }

    drawChart(objCategories, arrReal, arrObjective, arrAlcance, 'monthly');
};

const getInfoDeslizamiento = async () => {
    let formData = new FormData();
    formData.append('month', document.getElementById('date_month').value);
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetMonthsDeslizamiento, { method: 'POST', body: formData, });
    const data = await response.json();

    if(data.status) {
        objGlobalDeslizamiento = data.result;
    }
    else {
        objGlobalDeslizamiento = [];
    }
};

const getInfoSobregiro = async () => {
    let formData = new FormData();
    formData.append('month', document.getElementById('date_month').value);
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(`${urlGetMonths}`, { method: 'POST', body: formData, });
    const data = await response.json();
    if(data.status) {
        if(Object.keys(data.result).length > 0) {
            let objLabelsChart = await drawInfoTableMonths(data.result, data.percentage_period);
            drawChartMonths(objLabelsChart);
            getTopClients();
        }
        else {
            alert_nova.showNotification("No hay información a mostrar, intenta cambiar los filtros.", "warning", "danger");
        }
    }
};

const searchInfoMonths = async () => {
    await getInfoDeslizamiento();
    await getInfoSobregiro();
    return true
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

const drawTableTopClients = async (objData) => {
    const content = document.getElementById('rowContentTopClients');
    open_loading();
    let strTBody = '',
        intTotalSaldo = 0,
        intTotalSobregiro = 0,
        intTotalClients = Object.keys(objData).length;
    objData.map(detail => {
        intTotalSaldo = (intTotalSaldo * 1) + (detail.SaldoTotal * 1);
        intTotalSobregiro = (intTotalSobregiro * 1) + (detail.sobregiro * 1);
        strTBody += `   <tr>
                            <td>${detail.codigocliente}</td>
                            <td>${detail.NombreCliente}</td>
                            <td>Q ${numberFormat.format((detail.LimiteCredito * 1).toFixed(0))}</td>
                            <td>Q ${numberFormat.format((detail.SaldoTotal * 1).toFixed(0))}</td>
                            <td>Q ${numberFormat.format((detail.sobregiro * 1).toFixed(0))}</td>
                        </tr>`;
    });

    const table = ` <table class='table table-london'>
                        <thead>
                            <tr>
                                <th>Codigo</th>
                                <th>Nombre</th>
                                <th>Limite de Credito</th>
                                <th>Saldo</th>
                                <th>Total Sobregiro</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${strTBody}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th class='strTotals' colspan='3'>Total de los ${intTotalClients} clientes con mayor sobregiro</th>
                                <th class='strTotals'>Q ${numberFormat.format((intTotalSaldo).toFixed(0))}</th>
                                <th class='strTotals'>Q ${numberFormat.format((intTotalSobregiro).toFixed(0))}</th>
                            </td>
                        </tfoot>
                    </table>`;
    content.innerHTML = table;

    close_loading();
};

const getTopClients = async () => {
    let formData = new FormData(),
        urlSearch = '';

    const element = document.getElementById('date_month');
    formData.append('month', element.value);
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(`${urlGetTopClients}`, { method: 'POST', body: formData });
    const objResult = await response.json();

    if(Object.keys(objResult.result).length > 0) {
        drawTableTopClients(objResult.result);
    }

};

loadData();
