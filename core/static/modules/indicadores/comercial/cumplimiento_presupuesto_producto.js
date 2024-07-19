let objDataPresupuesto = [],
    arrResultNegatives = [],
    arrResultPositives = [];

const makeObjOrderByDifference = async (objToDifference, boolByDay = false) => {
    arrResultNegatives = [];
    arrResultPositives = [];
    const porcentaje1 = 90,
        porcentaje2 = 79;
    for (const key in objToDifference) {
        let arrData = objToDifference[key],
            intPresupuesto = (boolByDay) ? ( (arrData?.presupuesto * 1) ? (arrData.presupuesto *1) : 0 ) : ( (arrData?.presupuesto * 1) ? (arrData.presupuesto *1) : 0 ),
            intVenta = (arrData?.ventas) ? (arrData.ventas * 1) : 0,
            intDiferencia = (intVenta * 1) - (intPresupuesto);
        let strStyleLetter;
        let intPercentage = (intVenta * 1) / (intPresupuesto * 1);

        let strStyle = ``;
        if ((intPercentage * 100) > porcentaje1) {
            strStyleLetter = `color: #8ee98e !important;`;
        }
        else if ((intPercentage * 100) <= porcentaje1 && (intPercentage * 100) >= porcentaje2) {
            strStyleLetter = `color: #f1f165 !important;`;
        }
        else if ((intPercentage * 100) < porcentaje2){
            strStyleLetter = `color: #ff7676 !important;`;
        }

        if (intDiferencia > 0) {
            strStyle = `background: #8ee98e;`;
        }
        else if ( intDiferencia< 0){
            strStyle = `background: #ff7676;`;
        }

        intPresupuesto = (intPresupuesto * 1).toFixed(0);
        let intDifferenceKey = ((intDiferencia * 1).toFixed(0) * 1);
        if (intDifferenceKey < 0) {
            intDifferenceKey = (intDifferenceKey * -1);
            let objExist = arrResultNegatives[intDifferenceKey];
            if(objExist?.ClasificacionPRD) {
                if(objExist.ClasificacionPRD == arrData.descripcion) {
                    arrResultNegatives[intDifferenceKey] = {
                        'presupuesto': intPresupuesto,
                        'venta': intVenta,
                        'diferencia': intDiferencia,
                        'ClasificacionPRD': arrData.descripcion,
                        'porcentaje': intPercentage,
                        'strStyle': strStyle,
                        'strStyleLetter': strStyleLetter,
                    };
                }
                else {
                    for(let i = 1; i < 10; i++) {
                        let kk = intDifferenceKey + i;
                        let objExist = arrResultNegatives[kk];
                        if(objExist?.ClasificacionPRD) {
                            if (objExist.ClasificacionPRD == arrData.descripcion) {
                                arrResultNegatives[kk] = {
                                    'presupuesto': intPresupuesto,
                                    'venta': intVenta,
                                    'diferencia': intDiferencia,
                                    'ClasificacionPRD': arrData.descripcion,
                                    'porcentaje': intPercentage,
                                    'strStyle': strStyle,
                                    'strStyleLetter': strStyleLetter,
                                };
                                break;
                            }
                        }
                        else {
                            arrResultNegatives[kk] = {
                                'presupuesto': intPresupuesto,
                                'venta': intVenta,
                                'diferencia': intDiferencia,
                                'ClasificacionPRD': arrData.descripcion,
                                'porcentaje': intPercentage,
                                'strStyle': strStyle,
                                'strStyleLetter': strStyleLetter,
                            };
                            break;
                        }
                    }
                }
            }
            else {
                arrResultNegatives[intDifferenceKey] = {
                    'presupuesto': intPresupuesto,
                    'venta': intVenta,
                    'diferencia': intDiferencia,
                    'ClasificacionPRD': arrData.descripcion,
                    'porcentaje': intPercentage,
                    'strStyle': strStyle,
                    'strStyleLetter': strStyleLetter,
                };
            }
        }
        else {
            arrResultPositives[intDifferenceKey] = {
                'presupuesto': intPresupuesto,
                'venta': intVenta,
                'diferencia': intDiferencia,
                'ClasificacionPRD': arrData.descripcion,
                'porcentaje': intPercentage,
                'strStyle': strStyle,
                'strStyleLetter': strStyleLetter,
            };
        }
    }
    return true;
};

const makeObjUnify = async (objData) => {
    let objReturn = [];
    if(Object.keys(objData).length > 0) {
        objData.map(detail => {
            let objExist = objReturn.find(d => d.NoClasificacion == detail.NoClasificacion);
            if(objExist?.NoClasificacion) {
                objExist['ventas'] += (detail.ventas * 1);
                objExist['presupuesto'] += (detail.presupuesto * 1);
            }
            else {
                objReturn.push({
                    'ventas': (detail.ventas * 1),
                    'presupuesto': (detail.presupuesto * 1),
                    'NoClasificacion': detail.NoClasificacion,
                    'descripcion': detail.descripcion,
                });
            }
        });
    }
    return objReturn;
};

const drawTableTotals = async (intPresupuesto, intVenta) => {
    const container = document.getElementById('contentInfoResume');
    let intDifference = ((intPresupuesto * 1) - (intVenta * 1));
    intPresupuesto = numberFormat.format((intPresupuesto * 1).toFixed(0) * 1);
    intVenta = numberFormat.format((intVenta * 1).toFixed(0) * 1);
    intDifference = numberFormat.format((intDifference * 1).toFixed(0) * 1);
    const table = ` <table class="table table-bordered table-hover" id='tableTotals' style="width: 100%; font-size: 16px;">
                        <thead class='table-dark'>
                            <tr>
                                <th colspan='3'>Resumen</th>
                            </tr>
                            <tr>
                                <th>Total Presupuesto</th>
                                <th>Total Venta</th>
                                <th>Total Presupuesto VS Total Venta</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${intPresupuesto}</td>
                                <td>${intVenta}</td>
                                <td>${intDifference}</td>
                            </tr>
                        </tbody>
                    </table>`;
    container.innerHTML = table;
};

const drawReporte = async () => {
    let strRows = '';
    let objOrder = await makeObjUnify(objDataPresupuesto);
    let boolObjectDone = await makeObjOrderByDifference(objOrder);

    let tmp = arrResultNegatives.reverse(),
        intLengthRedColors = Object.keys(arrColorsGradient.red).length,
        intLengthGreenColors = Object.keys(arrColorsGradient.green).length,
        intLoop = 1;
    let intTMPLength = Object.keys(tmp).length,
        intPositivesLength = Object.keys(arrResultPositives).length;

    let intValPositionRed = intLengthRedColors / intTMPLength,
        intValPositionGreen = intLengthGreenColors / intPositivesLength;

    let intTextWhite = Object.keys(tmp).length / 2;
    let intTotalPresupuesto = intTotalVenta = 0
    for(const k in tmp) {
        const d = tmp[k];
        let strColor = arrColorsGradient.red[((intValPositionRed * intLoop).toFixed(0) * 1)-1],
            strColorParagraph = (intTextWhite <= intLoop) ? 'black' : 'white';
        intTotalPresupuesto += (d.presupuesto * 1);
        intTotalVenta += (d.venta * 1);
        strRows += `<tr>
                        <td style="color: black;">${d.ClasificacionPRD}</td>
                        <td class='trRightB' data-filter='${d.presupuesto * 1}'>
                            ${numberFormat.format( (d.presupuesto * 1).toFixed(0) )}
                        </td>
                        <td class='trRightB' data-filter='${d.venta * 1}'>
                            ${numberFormat.format( (d.venta * 1).toFixed(0) )}
                        </td>
                        <td style="font-weight: bold; color: ${strColorParagraph}; text-align: center; background: ${strColor}" data-filter='${d.diferencia * 1}'>
                            ${numberFormat.format( (d.diferencia * 1).toFixed(0) )}
                        </td>
                        <td style="font-weight: bold; color: black; text-align: center; ${d.strStyleLetter}" data-filter='${d.porcentaje * 1}'>
                            ${numberFormat.format( (d.porcentaje * 100).toFixed(0) )} %
                        </td>
                    </tr>`;
        intLoop++;
    }

    intLoop = 1;
    for(const k in arrResultPositives) {
        const d = arrResultPositives[k];
        let strColor = arrColorsGradient.green[((intValPositionGreen * intLoop).toFixed(0) * 1)-1];
        intTotalPresupuesto += (d.presupuesto * 1);
        intTotalVenta += (d.venta * 1);
        strRows += `<tr>
                        <td style="color: black;">${d.ClasificacionPRD}</td>
                        <td class='trRightB' data-filter='${d.presupuesto * 1}'>
                            ${numberFormat.format( (d.presupuesto * 1).toFixed(0) )}
                        </td>
                        <td class='trRightB' data-filter='${d.venta * 1}'>
                            ${numberFormat.format( (d.venta * 1).toFixed(0) )}
                        </td>
                        <td style="font-weight: bold; color: black; text-align: center; background: ${strColor}" data-filter='${d.diferencia * 1}'>
                            ${numberFormat.format( (d.diferencia * 1).toFixed(0) )}
                        </td>
                        <td style="font-weight: bold; color: black; text-align: center; ${d.strStyleLetter}" data-filter='${d.porcentaje * 1}'>
                            ${numberFormat.format( (d.porcentaje * 100).toFixed(0) )} %
                        </td>
                    </tr>`;
        intLoop++;
    }

    const table = ` <button class='btn btn-outline-primary' type='button' id='btnImage'>
                        <i class='fa fa-download'></i>
                        Descargar Imagen
                    </button>
                    <table class="table table-bordered table-hover" id='tableDetail' style="width: 100%; font-size: 16px;">
                        <thead>
                            <tr>
                                <th>Clasificación Producto</th>
                                <th>Libras Presupuesto</th>
                                <th>Libras Venta</th>
                                <th>Libras Mes Actual VS Libras Presupuesto</th>
                                <th>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>${strRows}</tbody>
                    </table>`;
    document.getElementById('contentInfoTable').innerHTML = table;
    $('#tableDetail').DataTable({
        "order": [3, "desc"],
        "lengthMenu": [
            [-1],
            ["All"]
        ],
        dom: 'lBfrtip',
        buttons: [{
            extend: 'excel',
            text: 'Excel',
            className: 'btn btn-outline-success',
            exportOptions: { modifier: { page: 'current' } }
        }]
    });
    document.getElementById('btnImage').addEventListener('click', async () => {
        await makeImageJPG('tableDetail', 'cumplimiento_presupuesto_producto');
    });

    drawTableTotals(intTotalPresupuesto, intTotalVenta);
};

const drawGraphicTotals = (totalPresupuesto, totalLibras) => {
    let intPercentage = numberFormat.format(((totalPresupuesto / totalLibras) * 100).toFixed(0)) * 1,
        strShow = `${intPercentage} %`;
    if((intPercentage * 1) > 100) {
        strShow = '+100%';
        intPercentage = 100;
    }
    else if ((intPercentage * 1) < 0)
        intPercentage = 0;

    let intRest = 100 - intPercentage;

    Highcharts.chart('contentTotalGraphic', {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: 0,
            plotShadow: false
        },
        title: {
            text: 'Cumplimiento<br>Presupuesto',
            align: 'center',
            verticalAlign: 'middle',
            y: 60
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
                dataLabels: {
                    enabled: true,
                    distance: -50,
                    style: {
                        fontWeight: 'bold',
                        color: 'white'
                    }
                },
                startAngle: -90,
                endAngle: 90,
                center: ['50%', '75%'],
                size: '110%'
            }
        },
        series: [{
            type: 'pie',
            name: 'Cumplimiento Presupuesto',
            innerSize: '75%',
            data: [
                ['Cumplido', intPercentage],
                ['Faltante', intRest],
            ]
        }]
    });
};

const drawTotals = async (objData) => {
    let strRows = '',
        totalPresupuesto = totalLibras = 0;
    if(Object.keys(objData).length > 0) {
        objData.map(d => {
            totalLibras += (d.Libras * 1);
            totalPresupuesto += (d.Presupuesto * 1);
            strRows += `<tr>
                            <td style="color: black;">${d.ClasificacionPRD}</td>
                            <td class='trRightB'>
                                ${numberFormat.format( (d.Presupuesto * 1).toFixed(0) )}
                            </td>
                            <td class='trRightB'>
                                ${numberFormat.format( (d.Libras * 1).toFixed(0) )}
                            </td>
                            <td style="font-weight: bold; color: black; text-align: center;">
                                ${numberFormat.format( (d.DiferenciaLibrasPresupuesto * 1).toFixed(0) )}
                            </td>
                        </tr>`;
        });
    }
    const table = ` <table class="table table-bordered table-hover" id='tableTotals' style="width: 100%; font-size: 16px;">
                        <thead>
                            <tr>
                                <th>Clasificación Producto</th>
                                <th>Libras Presupuesto</th>
                                <th>Libras Venta</th>
                                <th>Libras Mes Actual VS Libras Presupuesto</th>
                            </tr>
                        </thead>
                        <tbody>${strRows}</tbody>
                    </table>`;
    document.getElementById('contentTotalTable').innerHTML = table;
    drawGraphicTotals(totalPresupuesto, totalLibras);
}

const getPresupuesto = async () => {
    open_loading();
    const elementFamily = document.getElementById('family'),
        form = new FormData();
    let csrftoken = getCookie('csrftoken');

    form.append('fecha_inicio', document.getElementById('fecha_inicio').value);
    form.append('fecha_fin', document.getElementById('fecha_fin').value);
    form.append('family', elementFamily.value);

    const response = await fetch(strUrlGetPresupuesto, { method: 'POST', headers: { "X-CSRFToken": csrftoken }, body: form });
    const data = await response.json();
    close_loading();

    if(data?.status){
        objDataPresupuesto = data?.result;
        drawReporte(false);
        // drawTotals(data?.totals);
    }
    else {
        close_loading();
        alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
        console.error(data);
    }
};

const drawElementsIntoTabs = async (strElementID, boolFirst = false) => {
    let elem = document.getElementById('family');
    if(elem){
        const elements = document.querySelectorAll('.tab-pane');
        elements.forEach(element => { element.innerHTML = ''; });
    }
    const content = document.getElementById(`${strElementID}`);
    content.innerHTML = `  <input type='hidden' id='family' value='${strElementID}' />
                            <div class='row'>
                                <div class='col-12'>
                                    <div class='row'>
                                        <div class='col-12 col-md-6' id='contentTotalTable'></div>
                                        <div class='col-12 col-md-6' id='contentTotalGraphic'></div>
                                    </div>
                                </div>
                                <div class='col-12 col-md-8 offset-md-2' id='contentInfoResume'></div>
                                <div class='col-12' id='contentInfoTable'></div>
                            </div>`;
    if(boolFirst) { getPresupuesto(); }
};

drawElementsIntoTabs('mixtos', true);