const drawRubroSpecific = (objData, objLb, elementContent, strRubro) => {
    let thS = '',
        tdSLibras = '',
        tdSQuetzales = '',
        tdSPercentage = '';

    for(const k in objData) {
        const d = objData[k];
        let objLibras = objLb[k];
        let intPercentage = (d.cantidad * 1) / (objLibras.libras * 1);
        intPercentage = intPercentage.toFixed(4);

        thS += `<th>${d.mes}</th>`;
        tdSLibras += `<td>${numberFormat.format(objLibras.libras)} lb</td>`;
        tdSQuetzales += `<td>Q ${numberFormat.format(d.cantidad)}</td>`;
        tdSPercentage += `<td>Q ${intPercentage}</td>`;
    }
    let table = `   <div class='row'>
                        <div class='col-12'>
                            <h3>Detalle Rubro ${strRubro}</h3>
                        </div>
                        <div class='col-12'>
                            <table class='table table-london'>
                                <thead>
                                    <tr>
                                        <th></th>
                                        ${thS}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Cantidad de Libras</td>
                                        ${tdSLibras}
                                    </tr>
                                    <tr>
                                        <td>Cantidad en Quetzales</td>
                                        ${tdSQuetzales}
                                    </tr>
                                    <tr>
                                        <td>Costo</td>
                                        ${tdSPercentage}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>`;
    elementContent.innerHTML += table;
}

const drawRubros = async (objData) => {
    const content = document.getElementById('contentInfoRubros');
    content.innerHTML = '';
    if(Object.keys(objData['libras']).length > 0) {
        drawRubroSpecific(objData['combustible'], objData['libras'], content, 'Combustible');
        drawRubroSpecific(objData['flete'], objData['libras'], content, 'Flete');
        drawRubroSpecific(objData['mantenimiento'], objData['libras'], content, 'Mantenimiento');
        drawRubroSpecific(objData['nomina'], objData['libras'], content, 'Nomina');
    }
};

const makeObjToChart = (objData) => {
    let arrReturn = {
        'title': '',
        'arrCategories': [],
        'arrSeries': [],
        'strTitleY': '',
        'strValueY': '',
    };

    if(objData?.str_option) {

        let arrPrevYear = [],
            arrYear = [];

        for(const k in objData.result.prev_year) {
            const d = objData.result.prev_year[k];
            arrPrevYear.push((d.Costo * 1));
        }

        for(const k in objData.result.current_year) {
            const d = objData.result.current_year[k];
            arrYear.push((d.Costo * 1));
        }

        arrReturn['title'] = (objData.str_option === 'transporte') ? 'Indicador General Costo Transporte' : 'Indicador General Costo Libra Transportada';
        arrReturn['strTitleY'] = 'Costo en Quetzales';
        arrReturn['strValueY'] = 'Q';
        arrReturn['arrCategories'] = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        arrReturn['arrSeries'] = [
            {
                name: (objData?.str_prev_year) ? objData.str_prev_year : '',
                data: arrPrevYear,
            },
            {
                name: (objData?.str_year) ? objData.str_year : '',
                data: arrYear,
            },
        ];
    }

    return arrReturn;
};

const makeObjToChartFlete = (objData) => {
    let strObjective = '',
        strAlcance = '',
        objObjective = [],
        objAlcance = [],
        objReal = [],
        objCategories = [],
        strTH = '',
        tdRowLibras = '',
        tdRowQuetzales = '',
        tdRowCosto = '';

    for(const k in objData.result) {
        const d = objData.result[k];
        const intCosto = (d?.Costo) ? (d.Costo * 1) : 0;
        strObjective = d.objetivo;
        strAlcance = d.periodo_base;
        strTH += `<th>Mes ${d.mes}</th>`;
        tdRowCosto += `<td>Q ${intCosto.toFixed(4)}</td>`;
        tdRowLibras += `<td>${numberFormat.format(d.libras)} lb</td>`;
        tdRowQuetzales += `<td>Q ${numberFormat.format(d.quetzales)}</td>`;
        objCategories.push(d.mes);
        objObjective.push(d.objetivo);
        objAlcance.push(d.periodo_base);
        objReal.push( (intCosto.toFixed(4)) * 1 );
    }

    const content = document.getElementById('contentInfoMonths');
    content.innerHTML = `   <div class='row' id='chartMonths' style='max-height: 500px; margin: 50px 0;'></div>
                            <div class='row' id='tableMonth'>
                                <div class='col-12 col-md-12' id='tBodyTableMonths'>
                                    <table class='table table-london'>
                                        <thead>
                                            <tr>
                                                <th></th>
                                                ${strTH}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>% Costo Flete</td>
                                                ${tdRowCosto}
                                            </tr>
                                            <tr>
                                                <td>Quetzales</td>
                                                ${tdRowQuetzales}
                                            </tr>
                                            <tr>
                                                <td>Libras</td>
                                                ${tdRowLibras}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>`;
    strObjective = (strObjective * 1).toFixed(4);
    strAlcance = (strAlcance * 1).toFixed(4);
    const objGraphic = {
        'str_id': 'chartMonths',
        'title': 'Indicador Costo Flete de los Ultimas Cuatro Meses (según filtro)',
        'subTitle': '',
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'strObjective': strObjective,
        'strAlcance': strAlcance,
        'type': 'monthly',
        'uom': 'Q',
        'valueChart': 'Q',
    };
    drawGlobalHighChartsLondon(objGraphic);
    return true;
};

const drawChart = (objChart) => {
    let strTitle = (objChart?.title) ? objChart.title : 'Indicador de Costo',
        arrCategories = (objChart?.arrCategories) ? objChart.arrCategories : [],
        arrSeries = (objChart?.arrSeries) ? objChart.arrSeries : [],
        arrTitleY = (objChart?.strTitleY) ? objChart.strTitleY : 'Costo',
        arrValueY = (objChart?.strValueY) ? objChart.strValueY : 'Q',
        strTrs = '',
        strTH= '';

    for(const k in objChart.arrCategories) {
        strTH += `<th>${objChart.arrCategories[k]}</th>`;
    }

    for(const k in objChart.arrSeries) {
        const d = objChart.arrSeries[k];
        strTrs += `  <tr>
                        <td>${d.name}</td>`;
        let int = 0;
        for (let i = 0; i < 12; i++){
            let strShow = (typeof d.data[i] !== 'undefined') ? `Q ${d.data[i]}` : 'Q 0';
            strTrs += `<td>${strShow}</td>`;
        }
        strTrs += `</tr>`;
    }

    let element = ` <div class='row' id='chartGraphic' style='max-height: 500px; margin: 50px 0;'></div>
                    <div class='row' id='tableMonth'>
                        <div class='col-12 col-md-12' id='tBodyTableMonths'>
                            <table class='table table-london'>
                                <thead>
                                    <tr>
                                        <th></th>
                                        ${strTH}
                                    </tr>
                                </thead>
                                <tbody>${strTrs}</tbody>
                            <table>
                        </div>
                    </div>`;
    document.getElementById('contentInfoGraphics').innerHTML = element;

    Highcharts.chart('chartGraphic', {
        chart: { type: 'spline' },
        title: { text: strTitle },
        xAxis: { categories: arrCategories, },
        yAxis: {
            title: { text: arrTitleY },
            labels: {
                formatter: function () { return `${arrValueY} ${this.value}`; }
            },
        },
        tooltip: {
            crosshairs: true,
            shared: true,
        },
        series: arrSeries,
    });
};

const searchData = async () => {
    open_loading();
    const elementFamily = document.getElementById('option'),
          elementMonth = document.getElementById('date_month');

    let objReturn = {},
        formData = new FormData();
    formData.append('option', elementFamily.value);
    formData.append('csrfmiddlewaretoken', valCSRF);
    if(elementMonth) {
        formData.append('month', elementMonth.value);
    }
    fetch(`${urlGetMonths}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(async(data) => {
        if(data.status){
            if(Object.keys(data.result).length > 0) {
                if(data.str_option === 'flete') {
                    let objLabelsChart = await makeObjToChartFlete(data);
                }
                else {
                    let objLabelsChart = await makeObjToChart(data);
                    drawChart(objLabelsChart);
                    if(data?.arr_rubros){
                        drawRubros(data.arr_rubros);
                    }
                }
            }
            else {
                alert_nova.showNotification("No hay información a mostrar.", "warning", "danger");
            }
            close_loading();
        }
    })
    .catch(error => console.error(error))
};

const drawFilterMonthWeek = async (strElementID) => {
    return `<input type='hidden' id='option' value='${strElementID}' />
            <div class='row'>
                <div class='col-12 col-md-6'>
                    <div class="form-group">
                        <label for="date_month" class="bmd-label-floating">Buscar cuatro meses atrás desde:</label>
                        <input type="month" class="form-control" id="date_month" name="date_month" value="${monthNow}" max="${monthNow}" onchange='searchData()'>
                    </div>
                </div>
            </div>
            <div class='row'>
                <div class='col-12 col-md-10 offset-md-1' id='contentInfoMonths'></div>
            </div>`;
};

const drawFilterMonthOnly = async (strElementID) => {
    return `<input type='hidden' id='option' value='${strElementID}' />
            <div class='row'>
                <div class='col-12' id='contentInfoGraphics'></div>
                <div class='col-12' id='contentInfoRubros'></div>
            </div>`;
};

const drawElementsIntoTabs = async (strElementID, boolFirst = false) => {
    const content = document.getElementById(`${strElementID}`);
    let elem = document.getElementById('option');
    if(elem) {
        const elements = document.querySelectorAll('.tab-pane');
        elements.forEach(element => { element.innerHTML = ''; });
    }

    if (strElementID === 'flete') {
        content.innerHTML = await drawFilterMonthWeek(strElementID);
    }
    else {
        content.innerHTML = await drawFilterMonthOnly(strElementID);
    }

    if(boolFirst) {
        open_loading();
        const objMonths = await searchData();
        close_loading();
    }
};

drawElementsIntoTabs('transporte', true);
