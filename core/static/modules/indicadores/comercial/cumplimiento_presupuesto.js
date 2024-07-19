let objDataPresupuesto = [],
    arrResultNegatives = [],
    arrResultPositives = [];

const makeObjOrderByDifference = async (boolByDay) => {
    arrResultNegatives = [];
    arrResultPositives = [];
    const porcentaje1 = 90,
        porcentaje2 = 79;
    for (const key in objDataPresupuesto) {
        let arrData = objDataPresupuesto[key],
            intPresupuesto = (boolByDay) ? ( (arrData?.Presupuesto_dia * 1) ? (arrData.Presupuesto_dia *1) : 0 ) : ( (arrData?.Presupuesto * 1) ? (arrData.Presupuesto *1) : 0 ),
            intPercentage = (boolByDay) ? ( (arrData?.PorcentajeAlDia * 1) ? (arrData.PorcentajeAlDia *1) : 0 ) : ( (arrData?.Porcentaje * 1) ? (arrData.Porcentaje *1) : 0 ),
            intVenta = (arrData?.Venta) ? (arrData.Venta * 1) : 0,
            intDiferencia = (intVenta * 1) - (intPresupuesto);
            let strStyleLetter;

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
            arrResultNegatives[intDifferenceKey] = {
                'presupuesto': intPresupuesto,
                'venta': intVenta,
                'diferencia': intDiferencia,
                'vendedor': arrData.Vendedor,
                'porcentaje': intPercentage,
                'strStyle': strStyle,
                'strStyleLetter': strStyleLetter,
            };
        }
        else {
            arrResultPositives[intDifferenceKey] = {
                'presupuesto': intPresupuesto,
                'venta': intVenta,
                'diferencia': intDiferencia,
                'vendedor': arrData.Vendedor,
                'porcentaje': intPercentage,
                'strStyle': strStyle,
                'strStyleLetter': strStyleLetter,
            };
        }
    }
    return true;
};

const drawReporte = async (boolByDay = false) => {
    let strRows = '',
        strHeadByDays = '';
    if(boolByDay){ strHeadByDays = 'Al Dia'; }

    let boolObjectDone = await makeObjOrderByDifference(boolByDay);

    let tmp = arrResultNegatives.reverse(),
        intLengthRedColors = Object.keys(arrColorsGradient.red).length,
        intLengthGreenColors = Object.keys(arrColorsGradient.green).length,
        intLoop = 1;
    let intTMPLength = Object.keys(tmp).length,
        intPositivesLength = Object.keys(arrResultPositives).length;

    let intValPositionRed = intLengthRedColors / intTMPLength,
        intValPositionGreen = intLengthGreenColors / intPositivesLength;

    let intTextWhite = Object.keys(tmp).length / 2;
    for(const k in tmp) {
        const d = tmp[k];
        let strColor = arrColorsGradient.red[((intValPositionRed * intLoop).toFixed(0) * 1)-1],
            strColorParagraph = (intTextWhite <= intLoop) ? 'black' : 'white';

        strRows += `<tr>
                        <td style="color: black;">${d.vendedor}</td>
                        <td class='trRightB'>
                            ${numberFormat.format( (d.presupuesto * 1).toFixed(0) )}
                        </td>
                        <td class='trRightB'>
                            ${numberFormat.format( (d.venta * 1).toFixed(0) )}
                        </td>
                        <td style="font-weight: bold; color: ${strColorParagraph}; text-align: center; background: ${strColor}">
                            ${numberFormat.format( (d.diferencia * 1).toFixed(0) )}
                        </td>
                        <td style="font-weight: bold; color: black; text-align: center; ${d.strStyleLetter}">
                            ${numberFormat.format( (d.porcentaje * 100).toFixed(0) )} %
                        </td>
                    </tr>`;
        intLoop++;
    }

    intLoop = 1;
    for(const k in arrResultPositives) {
        const d = arrResultPositives[k];
        let strColor = arrColorsGradient.green[((intValPositionGreen * intLoop).toFixed(0) * 1)-1];
        strRows += `<tr>
                        <td style="color: black;">${d.vendedor}</td>
                        <td class='trRightB'>
                            ${numberFormat.format( (d.presupuesto * 1).toFixed(0) )}
                        </td>
                        <td class='trRightB'>
                            ${numberFormat.format( (d.venta * 1).toFixed(0) )}
                        </td>
                        <td style="font-weight: bold; color: black; text-align: center; background: ${strColor}">
                            ${numberFormat.format( (d.diferencia * 1).toFixed(0) )}
                        </td>
                        <td style="font-weight: bold; color: black; text-align: center; ${d.strStyleLetter}">
                            ${numberFormat.format( (d.porcentaje * 100).toFixed(0) )} %
                        </td>
                    </tr>`;
        intLoop++;
    }

    const table = ` <table class="table table-bordered table-hover" id='tableDetail' style="width: 100%; font-size: 16px;">
                        <thead>
                            <tr>
                                <th>Vendedor</th>
                                <th>Libras Presupuesto ${strHeadByDays}</th>
                                <th>Libras Venta</th>
                                <th>Desviación Contra Presupuesto ${strHeadByDays}</th>
                                <th>Porcentaje ${strHeadByDays}</th>
                            </tr>
                        </thead>
                        <tbody>${strRows}</tbody>
                    </table>`;
    document.getElementById('contentInfoTable').innerHTML = table;
};

const getPresupuesto = async () => {
    open_loading();
    const elementFamily = document.getElementById('family'),
        form = new FormData();
    let csrftoken = getCookie('csrftoken');

    form.append('fecha', document.getElementById('fecha').value);
    form.append('family', elementFamily.value);

    const response = await fetch(strUrlGetPresupuesto, { method: 'POST', headers: { "X-CSRFToken": csrftoken }, body: form });
    const data = await response.json();
    close_loading();

    if(data?.status){
        objDataPresupuesto = data?.result;
        drawReporte(false);
    }
    else {
        close_loading();
        alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
        console.error(data);
    }
};

const showForDay = () => {
    let boolSelected = document.getElementById('mode').checked;
    if(Object.keys(objDataPresupuesto).length > 0) {
        drawReporte(boolSelected);
    }
    else {
        alert_nova.showNotification("No existe informacion a mostrar.", "warning", "danger");
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
                                <div class='col-12 col-md-12' id='contentInfoTable'></div>
                            </div>`;
    if(boolFirst) { getPresupuesto(); }
};

drawElementsIntoTabs('cuadriles', true);