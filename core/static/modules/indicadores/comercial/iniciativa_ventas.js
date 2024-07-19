$("#divReport_1").dxPivotGrid({
    showColumnGrandTotals:true,
    showColumnTotals:true,
    showRowGrandTotals:true,
    showRowTotals:true,
    showTotalsPrior:"none",
    showBorders: true,
    allowSorting: true,
    allowFiltering: true,
    export: {
        enabled: true,
        fileName: "Iniciativa de ventas",
    },
    fieldChooser: {
        allowSearch: false,
        applyChangesMode: "instantly",
        enabled: true,
        height: 600,
        layout: 0,
        searchTimeout: NaN,
        title: "Tabla dinamica",
        width: 400,
        texts: {
            allFields: "Campos",
            columnFields: "Columnas",
            dataFields: "Valores",
            rowFields: "Filas",
            filterFields: "Filtros"
        }
    },
    dataSource: {
        fields: [
            {
                dataField: "Iniciativa",
                dataType: "string",
                area: "row"
            },
            {
                dataField: "Semana",
                dataType: "number",
                area: "column"
            },
            {
                dataField: "TotalAc",
                area: "data",
                dataType: "number",
                summaryType: "sum",
                alignment: "right",
                allowFiltering: false,
                format: {
                    type: "currency",
                    precision: 2,
                    currency: "GTQ"
                }
            }
        ],
        store: data
    }
})
.dxPivotGrid("instance");

// $("#divReport_2").dxPivotGrid({
//     showColumnGrandTotals:true,
//     showColumnTotals:true,
//     showRowGrandTotals:true,
//     showRowTotals:true,
//     showBorders: true,
//     allowSorting: true,
//     allowFiltering: true,
//     export: {
//         enabled: true,
//         fileName: "Iniciativa de ventas ultima semana",
//     },
//     fieldChooser: {
//         allowSearch: false,
//         applyChangesMode: "instantly",
//         enabled: true,
//         height: 600,
//         layout: 0,
//         searchTimeout: NaN,
//         title: "Tabla dinamica",
//         width: 400,
//         texts: {
//             allFields: "Campos",
//             columnFields: "Columnas",
//             dataFields: "Valores",
//             rowFields: "Filas",
//             filterFields: "Filtros"
//         }
//     },
//     dataSource: {
//         fields: [
//             {
//                 dataField: "Iniciativa",
//                 dataType: "string",
//                 area: "row"
//             },
//             {
//                 dataField: "Cliente",
//                 dataType: "string",
//                 area: "row"
//             },
//             {
//                 dataField: "Semana",
//                 dataType: "number",
//                 area: "column"
//             },
//             {
//                 dataField: "TotalAc",
//                 area: "data",
//                 dataType: "number",
//                 summaryType: "sum",
//                 alignment: "right",
//                 allowFiltering: false,
//                 format: {
//                     type: "currency",
//                     precision: 2,
//                     currency: "GTQ"
//                 }
//             }
//         ],
//         store: arrUltimaSemana
//     }
// }).dxPivotGrid("instance");

$("#divReport_3").dxPivotGrid({
    showColumnGrandTotals:true,
    showColumnTotals:true,
    showRowGrandTotals:true,
    showRowTotals:true,
    showBorders: true,
    allowSorting: true,
    allowFiltering: true,
    export: {
        enabled: true,
        fileName: "Ranking de Vendedores por Incremento de Venta",
    },
    fieldChooser: {
        allowSearch: false,
        applyChangesMode: "instantly",
        enabled: true,
        height: 600,
        layout: 0,
        searchTimeout: NaN,
        title: "Tabla dinamica",
        width: 400,
        texts: {
            allFields: "Campos",
            columnFields: "Columnas",
            dataFields: "Valores",
            rowFields: "Filas",
            filterFields: "Filtros"
        }
    },
    dataSource: {
        fields: [
            {
                dataField: "Vendedor",
                dataType: "string",
                area: "row",
                sortBySummaryField: "Venta",
                sortOrder: "desc",
                width: 300
            },
            {
                dataField: "Cliente",
                dataType: "string",
                area: "row",
                width: 200
            },
            {
                dataField: "Iniciativa",
                dataType: "string",
                area: "column"
            },
            {
                dataField: "Venta",
                area: "data",
                dataType: "number",
                summaryType: "sum",
                alignment: "right",
                allowFiltering: false,
                sortOrder: "desc",
                format: {
                    type: "currency",
                    precision: 2,
                    currency: "GTQ"
                }
            }
        ],
        store: arrDataIni
    }
}).dxPivotGrid("instance");

let intRow = 0,
    objLastGraphic = [],
    intLength = Object.keys(objResult).length,
    intTotal = 0;
for(let key in objResult){
    let arrCategorias = [],
        objReal = [],
        dataResult = objResult[key],
        strTitleGraphic = dataResult.name.replace('_', ' ');
    if (typeof objLastGraphic[key]?.y == 'undefined') {
        objLastGraphic[key] = {
            'y': 0,
            'name': strTitleGraphic,
        };
    }
    for(let k in dataResult.data) {
        intTotal += dataResult.data[k];
        objLastGraphic[key].y += dataResult.data[k];
    }

    const element = document.getElementById('contentGraphics');
    if (intRow === 0){ element.innerHTML = ''; }
    let text = `<div class="col-6">
                    <div class="card">
                        <div class="card-header card-header-primary card-header-icon">
                            <div class="card-icon">
                                <i class="material-icons">equalizer</i>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row" style="margin: 50px;">
                                <div class="col-12">
                                    <figure class="highcharts-figure">
                                        <div id="container${intRow}"></div>
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
    element.insertAdjacentHTML('beforeend', text);

    Highcharts.chart(`container${intRow}`, {
        chart: { zoomType: 'xy' },
        title: { text: strTitleGraphic },
        xAxis: [{
            categories: Object.keys(dataResult.data),
            crosshair: true
        }],
        credits: { enabled: false },
        tooltip: { shared: true },
        legend: { enabled: false, },
        series: [
            {
                name: 'Real',
                type: 'column',
                data: Object.entries(dataResult.data),
                tooltip: { valueSuffix: '' },
                color: '#333F50',
            },
        ],
    });
    intRow++;
    if(intLength == intRow) { drawPieChart(); }
}
function drawPieChart() {
    let text = `<div class="col-6">
                    <div class="card">
                        <div class="card-header card-header-primary card-header-icon">
                            <div class="card-icon">
                                <i class="material-icons">equalizer</i>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row" style="margin: 50px;">
                                <div class="col-12">
                                    <figure class="highcharts-figure">
                                        <div id="containerPie"></div>
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
    const element = document.getElementById('contentGraphics');
    element.insertAdjacentHTML('beforeend', text);

    const objData = [];
    for(const k in objLastGraphic) {
        const d = objLastGraphic[k];
        let a = (d.y) / intTotal;
        objData.push({name: d.name, y: (a * 1) * 100});
    }

    const content = document.getElementById('containerPie');
    Highcharts.chart('containerPie', {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        legend: { enabled: false, },
        title: {
            text: 'Totales Iniciativa de Ventas'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        accessibility: {
            point: {
                valueSuffix: '%'
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    connectorColor: 'silver'
                }
            }
        },
        series: [{
            name: 'Share',
            data: objData,
        }]
    });
}

