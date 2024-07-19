const cleanFilters = () => {
    document.getElementById('init_date').value = strDateNow;
    document.getElementById('end_date').value = strDateNow;
    document.getElementById('input_classifications').value = '';
    document.getElementById('input_products').value = '';
    document.getElementById('list_classifications').innerHTML = '';
    document.getElementById('list_products').innerHTML = '';
    document.getElementById('list_products_selected').innerHTML = '';
    document.getElementById('list_classifications_selected').innerHTML = '';
    document.getElementById('contentGraphics').innerHTML = '';
};

const makeCategories = async (arrPrevCategories) => {
    let tmp = arrPrevCategories.sort();
    let arrCategories = [];

    let key = 0;
    for(const k in tmp){
        arrCategories.push(tmp[k]);
    }
    return arrCategories;
};

const makeObjChart = async (objSales, objExistences) => {
    let arrPrevCategories = [],
        arrSeries = [];
    arrSeries[0] = {
        'name': 'Ventas',
        'data': [],
    };
    arrSeries[1] = {
        'name': 'Existencia',
        'data': [],
    };

    let arrPrevSeriesSales = [],
        arrPrevSeriesExistence = [];
    const a = await objSales.map(detail => {
        let strDateTMP = detail.fecha.replaceAll('-', '');
        if(typeof arrPrevCategories[strDateTMP] === 'undefined') {
            arrPrevCategories[strDateTMP] = detail.fecha
        }
        if(typeof arrPrevSeriesSales[detail.fecha] === 'undefined') {
            arrPrevSeriesSales[detail.fecha] = (detail.venta * 1)
        }
        else {
            arrPrevSeriesSales[detail.fecha] += (detail.venta * 1)
        }
    });
    const b = await objExistences.map(detail => {
        let strDateTMP = detail.fecha.replaceAll('-', '');
        if(typeof arrPrevCategories[strDateTMP] === 'undefined') {
            arrPrevCategories[strDateTMP] = detail.fecha
        }
        if(typeof arrPrevSeriesExistence[detail.fecha] === 'undefined') {
            arrPrevSeriesExistence[detail.fecha] = (detail.existencia * 1)
        }
        else {
            arrPrevSeriesExistence[detail.fecha] += (detail.existencia * 1)
        }
    });

    const arrCategories = await makeCategories(arrPrevCategories);

    for(const d in arrCategories) {
        const k = arrCategories[d];
        let existSales = arrPrevSeriesSales[k],
            existExistence = arrPrevSeriesExistence[k];
        arrSeries[0]['data'].push((existSales) ? parseFloat(parseFloat(existSales).toFixed(2)) : 0);
        arrSeries[1]['data'].push((existExistence) ? parseFloat(parseFloat(existExistence).toFixed(2)) : 0);
    }

    return {
        'arrSeries': arrSeries,
        'arrCategories': arrCategories,
    }
};

const drawChart = async (objChart) => {
    Highcharts.chart('contentGraphics', {
        chart: {
            type: 'line',
            backgroundColor: '#F8F8F8',
        },
        title: { text: `Indicador Desglose Cartera (segun filtro)`, },
        xAxis: [{
            categories: objChart.arrCategories,
            crosshair: true
        }],
//        colors: arrColors,
        credits: { enabled: false },
        series: objChart.arrSeries,

    }, function(chart){
        let thisDate = new Date();
        let index = chart.axes[0].categories.indexOf(`${thisDate.getFullYear()}-${thisDate.getMonth()+1}-${thisDate.getDate()}`);

        // xstart, ystart  xstart,ystart,xend,yend
        if (chart.axes[0].categories.length && chart.axes[0].series.length && typeof chart.axes[0].series[0].data[index] !== "undefined") {
            chart.renderer.path(['M', chart.axes[0].series[0].data[index].plotX + chart.plotLeft, chart.plotTop, 'L', chart.axes[0].series[0].data[index].plotX + chart.plotLeft, chart.plotTop, chart.axes[0].series[0].data[index].plotX + chart.plotLeft, chart.plotHeight + chart.plotTop])
                .attr({
                    'stroke-width': 2,
                    stroke: 'green'
                })
                .add();
        }
    });
};

const drawResults = async (objSales, objExistences) => {
    const objChart = await makeObjChart(objSales, objExistences);
    await drawChart(objChart);

};

const getInfoByFilters = async () => {
    open_loading();
    let formData = new FormData(),
        strClassification = document.getElementById('input_classifications').value;
    formData.append('init_date', document.getElementById('init_date').value);
    formData.append('end_date', document.getElementById('end_date').value);

    if (strClassification !== '' || strClassification !== 'Ninguna') {
        formData.append('classification', strClassification);
    }

    formData.append('product', document.getElementById('input_products').value);
    formData.append('csrfmiddlewaretoken', valCSRF);

    const response = await fetch(`${urlGetData}`, { method: 'POST', body: formData });
    const data = await response.json();

    if(data?.status) {
        let a = await drawResults(data.sale, data.existence);
    }
    close_loading();
};

const validateRangeDates = async () => {
    let boolDone = false;

    let elementInit = document.getElementById('init_date'),
        elementEnd = document.getElementById('end_date');

    if(elementInit && elementEnd) {
        if(elementInit.value !== '' && elementEnd.value !== '')
            boolDone = true;
    }

    return boolDone;
};

const setTextDataList = async (strElementID, strElementInput) => {
    let objElements = document.querySelectorAll(`#${strElementID} option`),
        elementSelected = document.getElementById(strElementInput);
    objElements.forEach(option => {
        if(option.value === elementSelected.value) {
            document.getElementById(`${strElementID}_selected`).innerHTML = option.text;
        }
    });

    const boolValidation = await validateRangeDates();

    if (boolValidation) {
        getInfoByFilters();
    }
    else {
        alert_nova.showNotification("No tienes un rango de fecha válido", "warning", "danger");
    }
};

const searchByClassifications = async (elementList, strSearch) => {
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('str_search', strSearch);

    const response = await fetch(`${urlGetClassification}`, { method: 'POST', body: formData });
    const data = await response.json();

    if(data?.status) {
        let strElements = '<option value="Ninguna">Ninguna en especifico</option>';
        data.result.map(d => {
            strElements += `<option value='${d.NoClasificacion}'>${d.Descripcion}</option>`;
        });
        elementList.innerHTML = strElements;
    }
};

const searchByProducts = async (elementList, strSearch) => {
    let formData = new FormData(),
        elementClassification = document.getElementById('input_classifications');
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('str_search', strSearch);
    if(elementClassification){
        if(elementClassification.value !== '' && elementClassification.value !== 'Ninguna') {
            formData.append('str_classification', elementClassification.value);
        }
    }

    const response = await fetch(`${urlGetProducts}`, { method: 'POST', body: formData });
    const data = await response.json();
    if(data?.status) {
        let strElements = '';
        data.result.map(d => {
            strElements += `<option value='${d.CodigoProducto}'>${d.Descripcion}</option>`;
        });
        elementList.innerHTML = strElements;
    }
};

const getProducts = (event, objElement) => {
    if (typeof event.key === "undefined" || event.key === "ArrowLeft" || event.key === "ArrowRight" ||
        event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown" ||
        event.key === " " || event.key === "Meta" || event.key === "Tab" || event.key === "Shift" ||
        event.key === "CapsLock" || event.key === "Alt") return false;

    if((objElement.value).length >= 3 ) {
        let strIDList = objElement.getAttribute('list'),
            elementList =  document.getElementById(strIDList);

        elementList.innerHTML = '';
        if (strIDList === 'list_classifications') {
            searchByClassifications(elementList, objElement.value);
        }
        else if (strIDList === 'list_products') {
            searchByProducts(elementList, objElement.value);
        }
    }
};