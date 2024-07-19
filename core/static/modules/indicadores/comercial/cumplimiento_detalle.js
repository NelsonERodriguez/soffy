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
        let strStyleLetter = strStyle = '';
        if ((intPercentage * 100) > porcentaje1)
            strStyleLetter = `color: #8ee98e !important;`;
        else if ((intPercentage * 100) <= porcentaje1 && (intPercentage * 100) >= porcentaje2)
            strStyleLetter = `color: #f1f165 !important;`;
        else if ((intPercentage * 100) < porcentaje2)
            strStyleLetter = `color: #ff7676 !important;`;

        if (intDiferencia > 0)
            strStyle = `background: #8ee98e;`;
        else if ( intDiferencia< 0)
            strStyle = `background: #ff7676;`;

        intPresupuesto = (intPresupuesto * 1).toFixed(0);
        let intDifferenceKey = ((intDiferencia * 1).toFixed(0) * 1);

        if (intDifferenceKey < 0) {
            intDifferenceKey = (intDifferenceKey * -1);
            arrResultNegatives[intDifferenceKey] = {
                'presupuesto': intPresupuesto,
                'venta': intVenta,
                'diferencia': intDiferencia,
                'vendedor': arrData.Vendedor,
                'no_vendedor': arrData.NoVendedor,
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
                'no_vendedor': arrData.NoVendedor,
                'porcentaje': intPercentage,
                'strStyle': strStyle,
                'strStyleLetter': strStyleLetter,
            };
        }
    }
    return true;
};

const drawModalBySalesman = (objData) => {
    if(Object.keys(objData).length > 0) {
        const container = document.getElementById('modal_body_detalle');
        container.innerHTML = '';
        document.getElementById('modal_title_detalle').innerHTML = `Detalle Vendedor: ${objData[0].nombre}`;
        let strTrs = '';
        objData.map(d => {
            let intDifference = (d.libras * 1) - (d.presupuesto * 1);
            strTrs += ` <tr>
                            <td>${d.Descripcion}</td>
                            <td>${numberFormat.format((d.libras * 1).toFixed(2))}</td>
                            <td>${numberFormat.format((d.presupuesto * 1).toFixed(2))}</td>
                            <td>${numberFormat.format((intDifference).toFixed(2))}</td>
                        </tr>`;
        });
        let strTable = `<table class='table' id='tblSalesman'>
                            <thead>
                                <tr>
                                    <th>Clasificación Producto</th>
                                    <th>Libras Venta</th>
                                    <th>Libras Presupuesto</th>
                                    <th>Diferencia Venta VS Presupuesto</th>
                                </tr>
                            </thead>
                            <tbody>${strTrs}</tbody>
                        </table>`;
        container.insertAdjacentHTML('beforeend', strTable);
        $('#tblSalesman').DataTable({
            "order": [3, "desc"],
            'pageLength': 100,
            dom: 'lBfrtip',
            buttons: [{
                extend: 'excel',
                text: 'Excel',
                className: 'btn btn-outline-success',
                exportOptions: {
                    modifier: { page: 'current' }
                }
            }]
        });
        $("#modal_detalle").modal('show');
    }
    else {
        alert_nova.showNotification("No hay informacion a mostrar.", "warning", "danger");
    }
};

const makeObjectBySalesman = async (objData) => {
    let objReturn = [];
    if(Object.keys(objData).length > 0) {
        objData.map(detail => {
            let objExist = objReturn.find(d => d.NoNivel3 == detail.NoNivel3);
            if(objExist?.novendedor) {
                objExist['presupuesto'] += (detail.presupuesto * 1);
                objExist['libras'] += (detail.libras * 1);
            }
            else {
                objReturn.push({
                    'novendedor': detail.novendedor,
                    'presupuesto': isNaN(detail.presupuesto * 1) ? 0 : (detail.presupuesto * 1),
                    'libras': isNaN(detail.libras * 1) ? 0 : (detail.libras * 1),
                    'Descripcion': detail.Descripcion,
                    'nombre': detail.nombre,
                    'NoNivel3': detail.NoNivel3,
                });
            }
        });
    }
    return objReturn;
};

const getPresupuestoBySalesman = async (intSalesman = 0) => {
    open_loading();

    if(intSalesman) {
        const elementFamily = document.getElementById('family'),
            form = new FormData();
        let csrftoken = getCookie('csrftoken');

        form.append('fecha_inicio', document.getElementById('fecha_inicio').value);
        form.append('fecha_fin', document.getElementById('fecha_fin').value);
        form.append('family', elementFamily.value);
        form.append('vendedor', intSalesman);

        const response = await fetch(strUrlGetPresupuestoBySalesman, { method: 'POST', headers: { "X-CSRFToken": csrftoken }, body: form });
        const data = await response.json();
        close_loading();

        if(data?.status){
            const objSalesman = await makeObjectBySalesman(data.data);
            console.log(objSalesman, 'objSalesman');
            drawModalBySalesman(objSalesman);
        }
        else {
            close_loading();
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            console.error(data);
        }
    }
};

const drawReporte = async (boolByDay = false) => {
    let strRows = '',
        strHeadByDays = (boolByDay) ? 'Al Dia' : '';

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

        strRows += `<tr onclick='getPresupuestoBySalesman("${d.no_vendedor}")'>
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
        strRows += `<tr onclick='getPresupuestoBySalesman("${d.no_vendedor}")'>
                        <td style="color: black;">${d.vendedor}</td>
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
    $('#tableDetail').DataTable({
        "order": [3, "desc"],
        'pageLength': 100,
        dom: 'lBfrtip',
        buttons: [{
            extend: 'excel',
            text: 'Excel',
            className: 'btn btn-outline-success',
            exportOptions: {
                modifier: { page: 'current' }
            }
        }]
    });

    document.getElementById('btnImage').addEventListener('click', async () => {
        await makeImageJPG('tableDetail', 'cumplimiento_detalle');
    });
};

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
                            </div>
                            <div class='row'>
                                <div class='col-12 col-md-12' id='contentIframe'></div>
                            </div>`;
    if(boolFirst) { getPresupuesto(); }
};

drawElementsIntoTabs('mixtos', true);