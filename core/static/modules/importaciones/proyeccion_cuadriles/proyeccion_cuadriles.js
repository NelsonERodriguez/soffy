let arrGlobalPositions = [
    { name: 'Faltante', position: 'faltante', color: '#FF3737', type_chart: 'column'},
    { name: 'Liberados Sin Embarcar', position: 'transitoBodega', color: '#AFEEEE', type_chart: 'column'},
    { name: 'En Tránsito Barco', position: 'transitoBarco', color: '#004369', type_chart: 'column'},
    { name: 'Ext Zona 10', position: 'extzona10', color: '#ED8929', type_chart: 'column'},
    { name: 'Ext Contenedores', position: 'extcontenedores', color: '#CC00CC', type_chart: 'column'},
    { name: 'Venta', position: 'venta', color: '#228B22', type_chart: 'column'},
    { name: 'Ideal', position: 'ideal', color: '#90EE90', type_chart: 'spline'},
];

const drawGraphics = async (strContainer, strTitleGraphic, objCategories, arrSeries) => {
    Highcharts.chart(strContainer, {
        chart: { type: 'column' },
        title: {
            text: strTitleGraphic,
            align: 'center'
        },
        xAxis: objCategories,
        yAxis: {
            min: 0,
            title: { text: 'Contenedores' },
            stackLabels: {
                enabled: true,
                style: {
                    fontWeight: 'bold',
                    color: 'gray',
                    textOutline: 'none'
                }
            },
            tickInterval: 10,
        },
        legend: {
            align: 'center',
            x: 70,
            verticalAlign: 'top',
            y: 70,
            floating: true,
            backgroundColor: 'white',
            borderColor: '#CCC',
            borderWidth: 1,
            shadow: false
        },
        tooltip: {
            headerFormat: '<b>{point.x}</b><br/>',
            pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: { enabled: true }
            }
        },
        series: arrSeries,
    });
};

const makeObjCategories = async (objData) => {
    let objReturn = {'categories': []};
    objData.map(detail => {
        objReturn['categories'].push(detail.Descripcion);
    });
    return objReturn;
};

const makeArrSeries = async (objData) => {
    let arrReturn = [];

    arrGlobalPositions.map(position => {
        arrReturn.push({
            name: position.name,
            color: (position?.color) ? position.color : '#D9D9D9',
            key_obj: position.position,
            type: position.type_chart,
            data: [],
        });

        let objPrevExist = arrReturn.find(d => d.key_obj == position.position);
        if(objPrevExist) {
            objData.map(data => {
                let intAdd = 0;
                if(typeof data[position.position] !== 'undefined') {
                    intAdd = isNaN(data[position.position]) ? 0 : (data[position.position] * 1);
                }
                objPrevExist['data'].push((intAdd.toFixed(1)) * 1);
            });
        }
    });

    return arrReturn;
};

const drawData = async (objData) => {
    if(Object.keys(objData).length > 0) {
        let objCategories = await makeObjCategories(objData),
            arrSeries = await makeArrSeries(objData),
            strContainer = 'contentGraphic',
            strTitle = 'Proyección Cuadril por Código';
        drawGraphics(strContainer, strTitle, objCategories, arrSeries);
    }
};

const makeObjectOrderAndDifference = async (objData, boolFaltante = true) => {
    objData.sort((after, before)=>{
        let a = (isNaN(after.ideal) ? 0 : after.ideal) * 1;
        let b = (isNaN(before.ideal) ? 0 : before.ideal) * 1;
        if(a < b)
            return 1;
        if(a > b )
            return -1;
        return 0;
    });

    objData.map(d => {
        let intVenta = (isNaN(d.venta) ? 0 : d.venta) * 1,
            intTransitoBodega = (isNaN(d.transitoBodega) ? 0 : d.transitoBodega) * 1,
            intTransitoBarco = (isNaN(d.transitoBarco) ? 0 : d.transitoBarco) * 1,
            intExistencia = (isNaN(d.extzona10) && isNaN(d.extcontenedores) ? 0 : (d.extzona10) * 1) + (d.extcontenedores * 1),
            intIdeal = (isNaN(d.ideal) ? 0 : d.ideal) * 1;
        let total = intVenta + intTransitoBodega + intExistencia + intTransitoBarco,
            prevFaltante = intIdeal - total;

        if(boolFaltante)
            if(prevFaltante >= 0)
                d.faltante = prevFaltante;
            else
                d.sobrante = (prevFaltante * -1);
    });

    return objData;
};

const getInfo = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);

    let response = await fetch(urlGetData, {method: 'POST', body: formData});
    let data = await response.json();
    close_loading();
    if(data.status) {
        if(Object.keys(data.data).length > 0) {
            let objA = await makeObjectOrderAndDifference(data.data);
            drawData(objA);
        }
        else {
            alert_nova.showNotification(data.message);
        }
    }
    else {
        console.error(data.message);
        alert_nova.showNotification('No se pudo obtener la información, contacta con soporte.', 'warning', 'danger');
    }
};

const drawTableResume = async (objData) => {
    let container = document.getElementById('contentTableResume'),
        intCols = Object.keys(objData).length,
        strTitles = '<th class="table-dark">Descripcion</th>',
        strRows = ` <tr>
                        <td colspan='${(intCols * 1) + 1}'>No hay información a mostrar</td>
                    </tr>`,
        strTotals = '<th>Total disponible para la venta</th>';
    container.innerHTML = '';
    if(intCols > 0) {
        strRows = '';
        let strNoEmbarqued = strEmbarquedOtherM = strTransit = strExistZ = strExistC = strSales = strRowTotal = '';
        objData.map(d => {
            let intNoEmbarqued = isNaN(d.transitoBodega) ? 0 : (d.transitoBodega * 1),
                intEmbarquedOM = isNaN(d.embarcadossigmes) ? 0 : (d.embarcadossigmes * 1),
                intTransit = isNaN(d.transitoBarco) ? 0 : (d.transitoBarco * 1),
                intExistZ = isNaN(d.extzona10) ? 0 : (d.extzona10 * 1),
                intExistC = isNaN(d.extcontenedores) ? 0 : (d.extcontenedores * 1),
                intSales = isNaN(d.venta) ? 0 : (d.venta * 1);
            strTitles += `<th class='table-dark'>${d.Descripcion}</th>`;
            strNoEmbarqued += `<td>${intNoEmbarqued.toFixed(1)}</td>`;
            strEmbarquedOtherM += `<th>${intEmbarquedOM.toFixed(1)}</th>`;
            strTransit += `<td>${intTransit.toFixed(1)}</td>`;
            strExistZ += `<td>${intExistZ.toFixed(1)}</td>`;
            strExistC += `<td>${intExistC.toFixed(1)}</td>`;
            strSales += `<td>${intSales.toFixed(1)}</td>`;
            let intTotal = ((intNoEmbarqued.toFixed(1) * 1) + (intTransit.toFixed(1) * 1) + 
                (intExistZ.toFixed(1) * 1) + (intExistC.toFixed(1) * 1) + (intSales.toFixed(1) * 1)).toFixed(1);
            strRowTotal += `<th>${intTotal}</th>`;
        });
        strRows += `<tr>
                        <td>Liberados Sin Embarcar</td>
                        ${strNoEmbarqued}
                    </tr>
                    <tr>
                        <td>En Transito Barco</td>
                        ${strTransit}
                    </tr>
                    <tr>
                        <td>Existencia Zona 10</td>
                        ${strExistZ}
                    </tr>
                    <tr>
                        <td>Existencia Contenedores</td>
                        ${strExistC}
                    </tr>
                    <tr>
                        <td>Venta</td>
                        ${strSales}
                    </tr>`;
    }
    let strTable = `<table id='tbResume' class='table table-bordered' style='width: 100%;'>
                        <thead>
                            <tr>${strTitles}</tr>
                        </thead>
                        <tbody>${strRows}</tbody>
                        <tfoot>
                            <tr class='tr-otro-total'>
                                ${strTotals}${strRowTotal}
                            </tr>
                            <tr class='tr-otro-mes'>
                                <th>Por arribar el próximo mes</th>
                                ${strEmbarquedOtherM}
                            </tr>
                        </tfoot>
                    </table>`;
    
    container.insertAdjacentHTML('beforeend', strTable);
    $('#tbResume').DataTable({
        'pageLength': 100,
        dom: 'lBfrtip',
        buttons: [{
            extend: 'excel',
            text: 'Excel',
            className: 'btn btn-default',
            exportOptions: {
                modifier: {
                    page: 'current'
                }
            }
        }]
    });
};

const drawDataResume = async (objData) => {
    if(Object.keys(objData).length > 0) {
        let objCategories = await makeObjCategories(objData),
            arrSeries = await makeArrSeries(objData),
            strContainer = 'contentGraphicsResume',
            strTitle = 'Resumen Cuadriles';
        drawGraphics(strContainer, strTitle, objCategories, arrSeries);
        drawTableResume(objData);
    }
    else
        alert_nova.showNotification('No hay informacion para mostrar en la grafica de resumen', 'warning', 'danger');
};

const getInfoResume = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetDataResume, { method:'POST', body:formData });
    const data = await response.json();
    close_loading();
    if(data.status) {
        if(Object.keys(data.data).length > 0) {
            let objA = await makeObjectOrderAndDifference(data.data, false);
            drawDataResume(objA);
            getInfo();
        }
        else
            alert_nova.showNotification('No se encuentra informacion para los resumenes', 'warning', 'danger');
    }
    else
        alert_nova.showNotification('Ocurrio un problema al obtener los datos', 'warnig', 'danger');
};

getInfoResume();