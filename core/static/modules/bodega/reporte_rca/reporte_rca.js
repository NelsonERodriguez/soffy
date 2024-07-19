const drawGraphicAccumulate = async (objTMPTotals) => {
    let objCategories = [],
        objBodega = [],
        objOtherBodega = [];

    objTMPTotals.map(detail => {
        objCategories.push(detail.accumulate);
        objBodega.push(detail.containers_bodega);
        objOtherBodega.push(detail.containers_no_bodega);
    });

    Highcharts.chart('contentGraphicAccumulate', {
        chart: {
            zoomType: 'xy',
            backgroundColor: '#F8F8F8',
        },
        title: { text: 'Comparativa Contenedores Recibidos' },
        xAxis: [{
            categories: objCategories,
            crosshair: true
        }],
        credits: { enabled: false },
        yAxis: [
            {
                labels: { format: '{value}', },
                title: { text: '', },
            },
        ],
        tooltip: { shared: true },
        legend: { enabled: true, },
        series: [
            {
                name: 'Bodega',
                type: 'column',
                data: objBodega,
                tooltip: { valueSuffix: '' },
                color: '#333F50',
                dataLabels: {
                    format: "{y} ",
                    enabled: true,
                    color: "white",
                    shadow: true,
                    style: { fontSize: "14px", textShadow: "0px" },
                    verticalAlign: "bottom",
                    y: 1000,
                },
            },
            {
                name: 'Otras Bodegas',
                type: 'column',
                data: objOtherBodega,
                tooltip: { valueSuffix: '' },
                color: '#2E75B6',
                dataLabels: {
                    format: "{y} ",
                    enabled: true,
                    color: "white",
                    shadow: true,
                    style: { fontSize: "14px", textShadow: "0px" },
                    verticalAlign: "bottom",
                    y: 1000,
                },
            },
        ],
    });
};

const drawTableTotalAccumulate = async (objData) => {
    const content = document.getElementById('contentTableAccumulate');
    let objTMPTotals = [],
        table = '',
        strElements = '',
        strTotals = '',
        intLBBodega = 0,
        intContBodega = 0,
        intLBNoBodega = 0,
        intContNoBodega = 0,
        intPrevPromedio = 0;

    objData.map(detail => {
        let objTMPPrev = objData.filter(d => d.fechaarribo == detail.fechaarribo),
            intTotalContainersBodega = 0,
            intTotalLibrasBodega = 0,
            intTotalContainersNoBodega = 0,
            intTotalLibrasNoBodega = 0,
            strName = detail.fechaarribo;

        objTMPPrev.map(d => {
            if(d.NoBodega == 1) {
                intTotalLibrasBodega += (d.Cantidad * 1);
                intTotalContainersBodega++;
            }
            else {
                intTotalLibrasNoBodega += (d.Cantidad * 1);
                intTotalContainersNoBodega++;
            }
            delete objData[d.key_row];
        });

        objTMPTotals.push({
            'containers_bodega': intTotalContainersBodega,
            'lb_bodega': intTotalLibrasBodega,
            'containers_no_bodega': intTotalContainersNoBodega,
            'lb_no_bodega': intTotalLibrasNoBodega,
            'accumulate': detail.fechaarribo
        });
    });

    await drawGraphicAccumulate(objTMPTotals);

    objTMPTotals.map(detail => {
        let intPercentage = ((detail.lb_no_bodega * 1) > 0) ? (detail.lb_bodega * 1) / (detail.lb_no_bodega * 1) * 100 : 0;
        intLBBodega = (intLBBodega * 1) + (detail.lb_bodega * 1);
        intContBodega = (intContBodega * 1) + (detail.containers_bodega * 1);
        intLBNoBodega = (intLBNoBodega * 1) + (detail.lb_no_bodega * 1);
        intContNoBodega = (intContNoBodega * 1) + (detail.containers_no_bodega * 1);
        intPrevPromedio = (intPrevPromedio * 1) + (intPercentage * 1);
        strElements += `<tr>
                            <td>${detail.accumulate}</td>
                            <td>${detail.containers_bodega}</td>
                            <td>${numberFormat.format((detail.lb_bodega * 1).toFixed(0))}</td>
                            <td>${detail.containers_no_bodega}</td>
                            <td>${numberFormat.format((detail.lb_no_bodega * 1).toFixed(0))}</td>
                            <td>${numberFormat.format((intPercentage * 1).toFixed(0))} %</td>
                        </tr>`;
    });

    let intPromedio = ((intPrevPromedio) / (Object.keys(objTMPTotals).length) * 1).toFixed(0);

    table = `   <table class="table table-striped" style='width: 100%' id='tbl-detail-accumulate'>
                    <thead>
                        <tr>
                            <th>Fecha Acumulativo</th>
                            <th>Contenedores en Bodega</th>
                            <th>Libras en Bodega</th>
                            <th>Contenedores en otras Bodegas</th>
                            <th>Libras en otras Bodegas</th>
                            <th>%</th>
                        </tr>
                    </thead>
                    <tbody>${strElements}</tbody>
                    <tfoot>
                        <tr>
                            <th>Totales</th>
                            <th>${intContBodega}</th>
                            <th>${numberFormat.format( (intLBBodega * 1).toFixed(0) )}</th>
                            <th>${intContNoBodega}</th>
                            <th>${numberFormat.format( (intLBNoBodega * 1).toFixed(0) )}</th>
                            <th>${intPromedio} % Promedio</th>
                        </tr>
                    </tfoot>
                </table>`;
    content.innerHTML = table;

    $('#tbl-detail-accumulate').DataTable({
        "order": [0, "asc"],
        'pageLength': 25,
        responsive: false,
        language: objLenguajeDataTable,
        dom: 'lBfrtip',
        buttons: [{
            extend: 'excel',
            text: 'Descargar en Excel',
            className: 'btn btn-outline-success',
            exportOptions: { modifier: { page: 'current' } }
        }],
    });
};

const makeobj = async (objData) => {
    let objReturn = [],
        intKey = 0;
    objData.map(d => {
        d.key_row = intKey;
        objReturn.push(d);
        intKey++;
    });
    return objReturn;
};

const drawReport = async (objData) => {
    let trS = '',
        intTotalBodega = 0,
        intTotalNoBodega = 0,
        intTotalGeneral = 0,
        intRow = 0,
        objTMPOneTime = [];

    console.log(objData.find(d => d.NoContenedor == 'SZLU 500857-9'));

    objData.map(detail => {
        detail.key_row = intRow;
        let strClass = 'row-orange',
            strNoBodega = (detail.NoBodega == 'None') ? '- - -' : detail.NoBodega,
            tmpSearchOneTime = objTMPOneTime.find(d => (d.NoContenedor === detail.NoContenedor && d.fechaarribo === detail.fechaarribo));
        if(!tmpSearchOneTime) {
            objTMPOneTime.push(detail);
        }
        else {
            tmpSearchOneTime.Cantidad = (tmpSearchOneTime.Cantidad * 1) + (detail.Cantidad * 1);
        }

        if(detail.NoBodega == 1) {
            strClass = 'row-green';
            intTotalBodega = (intTotalBodega * 1) + (detail.Cantidad * 1);
        }
        else {
            let objTMPBodega = objData.find(d => (d.NoContenedor === detail.NoContenedor && d.fechaarribo === detail.fechaarribo && d.NoBodega == 1));
            if(objTMPBodega) {
                strClass = 'row-green';
                intTotalBodega = (intTotalBodega * 1) + (detail.Cantidad * 1);
            }
            else {
                intTotalNoBodega = (intTotalNoBodega * 1) + (detail.Cantidad * 1);
            }
        }
        trS += `<tr class="${strClass}">
                    <td data-order="${detail.fechaarribo}">${detail.fechaarribo}</td>
                    <td>${detail.Descripcion}</td>
                    <td>${detail.Cantidad}</td>
                    <td>${detail.NoContenedor}</td>
                    <td>${detail.otradescripcion}</td>
                    <td>${strNoBodega}</td>
                </tr>`;
        intRow++;
    });
    intTotalGeneral = (intTotalNoBodega * 1) + (intTotalBodega * 1);
    let table = `   <div class='col-12 col-md-6 offset-md-3'>
                        <table class='table table-striped'>
                            <thead>
                                <tr>
                                    <th>Bodega</th>
                                    <th>Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Bodega GB:</td>
                                    <td>${numberFormat.format((intTotalBodega * 1).toFixed(0))}</td>
                                </tr>
                                <tr>
                                    <td>Otras Bodegas:</td>
                                    <td>${numberFormat.format((intTotalNoBodega * 1).toFixed(0))}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr style='font-weight:bold;'>
                                    <th>Total General:</th>
                                    <th>${numberFormat.format((intTotalGeneral * 1).toFixed(0))}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div class='col-12' id='contentGraphicAccumulate'></div>
                    <div class='col-12' id='contentTableAccumulate'></div>
                    <div class='col-12'>
                        <table class="" id='table-report' style='width: 100%'>
                            <thead>
                                <tr>
                                    <th>Fecha RCA</th>
                                    <th>Descripcion</th>
                                    <th>Libras</th>
                                    <th>No. Contenedor</th>
                                    <th>Producto</th>
                                    <th>No. Bodega</th>
                                </tr>
                            </thead>
                            <tbody>${trS}</tbody>
                        </table>
                    </div>`;
    const content = document.getElementById('contentReport');
    content.innerHTML = table;

    $('#table-report').DataTable({
        "order": [0, "asc"],
        'pageLength': 25,
        responsive: false,
        language: objLenguajeDataTable,
        dom: 'lBfrtip',
        buttons: [ {
            extend: 'excel',
            text: 'Descargar en Excel',
            className: 'btn btn-outline-success',
            exportOptions: { modifier: { page: 'current' } }
        } ],
    });

    let objAccumulate = await makeobj(objTMPOneTime);
    drawTableTotalAccumulate(objAccumulate);
};

const getData = async () => {
    open_loading();

    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('month', document.getElementById('month').value);
    const response = await fetch(urlGetData, {method: 'POST', body: formData});
    const data = await response.json();

    if(data.status) {
        drawReport(data.result);
    }
    close_loading();
};

const btnSearch = document.getElementById('btnSearch');
if (btnSearch) {
    btnSearch.addEventListener('click', () => {
        getData();
    });
}