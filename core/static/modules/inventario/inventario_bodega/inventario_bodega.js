const objmdlInventarioDisponible = document.getElementById('mdlInventarioDisponible'),
    objDivInventarioDisponible = document.getElementById('divInventarioDisponible');

const drawTableHead = async (strIdContainer, boolNormal = true) => {
    let cnt = document.getElementById(strIdContainer);
    if(typeof cnt == 'object') {
        let strColumns = '',
            strStriped = "table-striped";
        if(boolNormal) {
            strColumns = `  <th>Codigo Producto</th>
                            <th>Producto</th>
                            <th>Inventario Disponible</th>`;
        }
        else {
            strStriped = "";
            strTitle = `<tr>
                            <th class="thRowTitle" colspan="8">Inventario Equivalente en Contenedores de 58,000</th>
                        </tr>`;
            strColumns = `  <th class='thRowTitle'></th>
                            <th class='thRowTitle'>Zona 13</th>
                            <th class='thRowTitle'>Zona 10</th>
                            <th class='thRowTitle'>Rentathermo</th>
                            <th class='thRowTitle'>EmergentCold</th>
                            <th class='thRowTitle'>Total Guatemala</th>
                            <th class='thRowTitle'>Puerto</th>
                            <th class='thRowTitle'>Total Inventario</th>`;
        }
        cnt.innerHTML = `   <table class='table table-bordered ${strStriped}' id='tbl_${strIdContainer}'>
                                <thead class='table-dark'>
                                    ${strTitle}
                                    <tr>
                                        ${strColumns}
                                    </tr>
                                </thead>
                                <tbody id='tBody_${strIdContainer}'></tbody>
                            </table>`;
        return true;
    }
    else
        alert_nova.showNotification("No se encontró un tab válido", "warning", "danger");
    return false;
}

const getInventarioDisponible = async (strNoProducto, strIdContainer) => {
    open_loading();
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('noproducto', strNoProducto);
    let data = [];

    const response = await fetch(strUrlInventarioDisponible, {method: 'POST', body: formData});
    try {
        data = await response.json();
    } catch(error) {
        data = [];
        console.error(error);
    }

    close_loading();

    if (data?.status) {

        objDivInventarioDisponible.innerHTML = ``;
        let objOption = {
            element: 'table',
            classes: ["table", "table-striped"],
        };
        let objTable = await createElement(objOption);

        objOption = {
            element: 'thead'
        };
        let objTHead = await createElement(objOption);

        objOption = {
            element: 'tr'
        };
        let objTr = await createElement(objOption);

        objOption = {
            element: 'td',
            classes: ["text-center"],
        };
        let objTd = await createElement(objOption);
        objTd.innerText = `NoProducto`;
        objTr.appendChild(objTd);

        objOption = {
            element: 'td',
            classes: ["text-center"],
        };
        objTd = await createElement(objOption);
        objTd.innerText = `Código`;
        objTr.appendChild(objTd);

        objOption = {
            element: 'td',
            classes: ["text-center"],
        };
        objTd = await createElement(objOption);
        objTd.innerText = `Producto`;
        objTr.appendChild(objTd);

        objOption = {
            element: 'td',
            classes: ["text-center"],
        };
        objTd = await createElement(objOption);
        objTd.innerText = `Bodega`;
        objTr.appendChild(objTd);

        objOption = {
            element: 'td',
            classes: ["text-center"],
        };
        objTd = await createElement(objOption);
        objTd.innerText = `Existencia`;
        objTr.appendChild(objTd);

        objTHead.appendChild(objTr);

        objTable.appendChild(objTHead);

        objOption = {
            element: 'tbody'
        };
        let objTbody = await createElement(objOption);

        for (let key in data.arr_inventario) {
            const arrDetalle = data.arr_inventario[key];
            objOption = {
                element: 'tr'
            };
            objTr = await createElement(objOption);

            objOption = {
                element: 'td',
            };
            objTd = await createElement(objOption);
            objTd.innerText = arrDetalle.NoProducto;
            objTr.appendChild(objTd);

            objOption = {
                element: 'td',
            };
            objTd = await createElement(objOption);
            objTd.innerText = arrDetalle.CodigoProducto;
            objTr.appendChild(objTd);

            objOption = {
                element: 'td',
            };
            objTd = await createElement(objOption);
            objTd.innerText = arrDetalle.Producto;
            objTr.appendChild(objTd);

            objOption = {
                element: 'td',
            };
            objTd = await createElement(objOption);
            objTd.innerText = arrDetalle.bodega;
            objTr.appendChild(objTd);

            objOption = {
                element: 'td',
                styles: {
                    "text-align": "right"
                }
            };
            objTd = await createElement(objOption);
            if(strIdContainer == 'cuadriles') {
                arrDetalle.Existencia = (arrDetalle.Existencia * 1 / 58000).toFixed(2);
            }
            objTd.innerText = numberGTFormat.format(arrDetalle.Existencia);
            objTr.appendChild(objTd);

            objTbody.appendChild(objTr);
        }

        objTable.appendChild(objTbody);
        await objDivInventarioDisponible.appendChild(objTable);

        $(objmdlInventarioDisponible).modal('show');
    }
};

const drawTable = async (objData, strIdContainer) => {
    if(Object.keys(objData).length > 0) {
        let boolTable = await drawTableHead(strIdContainer);
        if(boolTable) {
            let strContainer = document.getElementById(`tBody_${strIdContainer}`);
            if(typeof strContainer == 'object') {
                let strTrs = '';
                for(let k in objData){
                    let d = objData[k];
                    let existencia = isNaN(parseFloat(d.Existencia)) ? 0 : parseFloat(d.Existencia);
                    let strEvent = (existencia > 0) ? `onclick="getInventarioDisponible('${d.NoProducto}', '${strIdContainer}');"` : '';
                    let strClassEvent = (existencia > 0) ? `tdExistencia` : 'tdNoExistencia';
                    strTrs += ` <tr>
                                    <td data-filter="${d.CodigoProducto}">${d.CodigoProducto}</td>
                                    <td data-filter="${d.Descripcion}">${d.Descripcion}</td>
                                    <td data-filter="${existencia}" class='${strClassEvent}' ${strEvent}>
                                        ${numberFormat.format((existencia).toFixed(2))}
                                    </td>
                                </tr>`;
                }
                strContainer.insertAdjacentHTML('beforeend', strTrs);

                $(`#tbl_${strIdContainer}`).DataTable({
                    "pagingType": "full_numbers",
                    "lengthMenu": [ [-1], ["All"] ],
                    responsive: false,
                    language: objLenguajeDataTable,
                    order: [[1, 'asc']]
                });
            }
            else
                alert_nova.showNotification("No existe elemento para mostrarte la información", "warning", "danger");
        }
    }
};

const makeObjectResumen = async (objData) => {
    let arrReturn = [];
    if(Object.keys(objData).length > 0) {
        // '2743.85'
        objData.map(d => {
            d.Ferrosur = (d?.Ferrosur && !isNaN(d.Ferrosur)) ? (d.Ferrosur * 1).toFixed(2) : 0;
            d.zona10 = (d?.zona10 && !isNaN(d.zona10)) ? (d.zona10 * 1).toFixed(2) : 0;
            d.Rentatermo = (d?.Rentatermo && !isNaN(d.Rentatermo)) ? (d.Rentatermo * 1).toFixed(2) : 0;
            d.emergentcold = (d?.emergentcold && !isNaN(d.emergentcold)) ? (d.emergentcold * 1).toFixed(2) : 0;
            d.TotalGuatemala = (d?.TotalGuatemala && !isNaN(d.TotalGuatemala)) ? (d.TotalGuatemala * 1).toFixed(2) : 0;
            d.puerto = (d?.puerto && !isNaN(d.puerto)) ? (d.puerto * 1).toFixed(2) : 0;
            d.TotalInventario = (d?.TotalInventario && !isNaN(d.TotalInventario)) ? (d.TotalInventario * 1).toFixed(2) : 0;
            if(typeof arrReturn[d.orden] === 'undefined') {
                if (d.orden == 1) {
                    arrReturn[d.orden] = {
                        'name': 'Cuadriles',
                        'total_z13': parseFloat(parseFloat(d.Ferrosur).toFixed(2)),
                        'total_z10': parseFloat(parseFloat(d.zona10).toFixed(2)),
                        'total_renta': parseFloat(parseFloat(d.Rentatermo).toFixed(2)),
                        'total_emergent': parseFloat(parseFloat(d.emergentcold).toFixed(2)),
                        'total_guate': parseFloat(parseFloat(d.TotalGuatemala).toFixed(2)),
                        'total_puerto': parseFloat(parseFloat(d.puerto).toFixed(2)),
                        'total': parseFloat(parseFloat(d.TotalInventario).toFixed(2)),
                        'descripciones': []
                    };
                    let tmpDescriptions = arrReturn[d.orden]['descripciones'],
                        tmpDescription = d['Descripcion'].trim();
                    tmpDescription = tmpDescription.replaceAll(' ', '');

                    tmpDescriptions[tmpDescription] = {
                        'name': d.Descripcion,
                        'total_z13': parseFloat(parseFloat(d.Ferrosur).toFixed(2)),
                        'total_z10': parseFloat(parseFloat(d.zona10).toFixed(2)),
                        'total_renta': parseFloat(parseFloat(d.Rentatermo).toFixed(2)),
                        'total_emergent': parseFloat(parseFloat(d.emergentcold).toFixed(2)),
                        'total_guate': parseFloat(parseFloat(d.TotalGuatemala).toFixed(2)),
                        'total_puerto': parseFloat(parseFloat(d.puerto).toFixed(2)),
                        'total': parseFloat(parseFloat(d.TotalInventario).toFixed(2)),
                        'details': [d]
                    };
                }
                else {
                    arrReturn[d.orden] = {
                        'name': 'Mixtos',
                        'total_z13': parseFloat(parseFloat(d.Ferrosur).toFixed(2)),
                        'total_z10': parseFloat(parseFloat(d.zona10).toFixed(2)),
                        'total_renta': parseFloat(parseFloat(d.Rentatermo).toFixed(2)),
                        'total_emergent': parseFloat(parseFloat(d.emergentcold).toFixed(2)),
                        'total_guate': parseFloat(parseFloat(d.TotalGuatemala).toFixed(2)),
                        'total_puerto': parseFloat(parseFloat(d.puerto).toFixed(2)),
                        'total': parseFloat(parseFloat(d.TotalInventario).toFixed(2)),
                        'descripciones': []
                    };
                }
            }
            else {
                arrReturn[d.orden]['total_z13'] = parseFloat(parseFloat(d.Ferrosur).toFixed(2)) + arrReturn[d.orden]['total_z13'];
                arrReturn[d.orden]['total_z10'] = parseFloat(parseFloat(d.zona10).toFixed(2)) + arrReturn[d.orden]['total_z10'];
                arrReturn[d.orden]['total_renta'] = parseFloat(parseFloat(d.Rentatermo).toFixed(2)) + arrReturn[d.orden]['total_renta'];
                arrReturn[d.orden]['total_emergent'] = parseFloat(parseFloat(d.emergentcold).toFixed(2)) + arrReturn[d.orden]['total_emergent'];
                arrReturn[d.orden]['total_guate'] = parseFloat(parseFloat(d.TotalGuatemala).toFixed(2)) + arrReturn[d.orden]['total_guate'];
                arrReturn[d.orden]['total_puerto'] = parseFloat(parseFloat(d.puerto).toFixed(2)) + arrReturn[d.orden]['total_puerto'];
                arrReturn[d.orden]['total'] = parseFloat(parseFloat(d.TotalInventario).toFixed(2)) + arrReturn[d.orden]['total'];
                let objTMP = arrReturn[d.orden]['descripciones'];
                let tmpDescription = d['Descripcion'].trim();
                tmpDescription = tmpDescription.replaceAll(' ', '');
                let objExist = objTMP[tmpDescription];
                if(objExist?.name) {
                    if (d.orden == 1)
                        objExist['details'].push(d);
                    
                    objExist['total_z13'] = parseFloat(parseFloat(d.Ferrosur).toFixed(2)) + objExist['total_z13'];
                    objExist['total_z10'] = parseFloat(parseFloat(d.zona10).toFixed(2)) + objExist['total_z10'];
                    objExist['total_renta'] = parseFloat(parseFloat(d.Rentatermo).toFixed(2)) + objExist['total_renta'];
                    objExist['total_emergent'] = parseFloat(parseFloat(d.emergentcold).toFixed(2)) + objExist['total_emergent'];
                    objExist['total_guate'] = parseFloat(parseFloat(d.TotalGuatemala).toFixed(2)) + objExist['total_guate'];
                    objExist['total_puerto'] = parseFloat(parseFloat(d.puerto).toFixed(2)) + objExist['total_puerto'];
                    objExist['total'] = parseFloat(parseFloat(d.TotalInventario).toFixed(2)) + objExist['total'];
                }
                else {
                    let objTmpAdd = [];
                    if (d.orden == 1)
                        objTmpAdd = [d]
                    
                    objTMP[tmpDescription] = {
                        'name': d.Descripcion,
                        'total_z13': parseFloat(parseFloat(d.Ferrosur).toFixed(2)),
                        'total_z10': parseFloat(parseFloat(d.zona10).toFixed(2)),
                        'total_renta': parseFloat(parseFloat(d.Rentatermo).toFixed(2)),
                        'total_emergent': parseFloat(parseFloat(d.emergentcold).toFixed(2)),
                        'total_guate': parseFloat(parseFloat(d.TotalGuatemala).toFixed(2)),
                        'total_puerto': parseFloat(parseFloat(d.puerto).toFixed(2)),
                        'total': parseFloat(parseFloat(d.TotalInventario).toFixed(2)),
                        'details': objTmpAdd
                    };
                }
            }
        });
    }
    return arrReturn;
};

const drawTableResumen = async (objData, strIdContainer) => {
    if(Object.keys(objData).length > 0) {
        let boolTable = await drawTableHead(strIdContainer, false);
        if(boolTable) {
            let strContainer = document.getElementById(`tBody_${strIdContainer}`);
            if(typeof strContainer == 'object') {
                let strTrs = '',
                    objToDraw = await makeObjectResumen(objData);
                if(Object.keys(objToDraw).length > 0) {
                    objToDraw.map(d => {
                        let strTrsDescriptions = ``;

                        if(Object.keys(d['descripciones']).length > 0) {
                            for(const k in d['descripciones']) {
                                const dd = d['descripciones'][k];
                                let strTrsDetails = '';

                                if(Object.keys(dd['details']).length > 0) {
                                    for(const kk in dd['details']) {
                                        const dt = dd['details'][kk];
                                        strTrsDetails += `  <tr class='tr-details'>
                                                                <td> ${dt['Producto']} </td>
                                                                <td> ${parseFloat(dt['Ferrosur']).toFixed(0)} </td>
                                                                <td> ${parseFloat(dt['zona10']).toFixed(0)} </td>
                                                                <td> ${parseFloat(dt['Rentatermo']).toFixed(0)} </td>
                                                                <td> ${parseFloat(dt['emergentcold']).toFixed(0)} </td>
                                                                <td> ${parseFloat(dt['TotalGuatemala']).toFixed(0)} </td>
                                                                <td> ${parseFloat(dt['puerto']).toFixed(0)} </td>
                                                                <td> ${parseFloat(dt['TotalInventario']).toFixed(0)} </td>
                                                            </tr>`;
                                    }
                                }
                                strTrsDescriptions += ` <tr class='title-descriptions'>
                                                            <td> ${dd.name} </td>
                                                            <td> ${dd['total_z13'].toFixed(0)} </td>
                                                            <td> ${dd['total_z10'].toFixed(0)} </td>
                                                            <td> ${dd['total_renta'].toFixed(0)} </td>
                                                            <td> ${dd['total_emergent'].toFixed(0)} </td>
                                                            <td> ${dd['total_guate'].toFixed(0)} </td>
                                                            <td> ${dd['total_puerto'].toFixed(0)} </td>
                                                            <td> ${dd['total'].toFixed(0)} </td>
                                                        </tr>
                                                        ${strTrsDetails}`;
                            }
                        }
                        strTrs += ` <tr class='title-families'>
                                        <td> ${d.name} </td>
                                        <td> ${d['total_z13'].toFixed(0)} </td>
                                        <td> ${d['total_z10'].toFixed(0)} </td>
                                        <td> ${d['total_renta'].toFixed(0)} </td>
                                        <td> ${d['total_emergent'].toFixed(0)} </td>
                                        <td> ${d['total_guate'].toFixed(0)} </td>
                                        <td> ${d['total_puerto'].toFixed(0)} </td>
                                        <td> ${d['total'].toFixed(0)} </td>
                                    </tr>
                                    ${strTrsDescriptions}`
                    });
                    strContainer.insertAdjacentHTML('beforeend', strTrs);
                }
                else {
                    strTrs = `  <tr>
                                    <td colspan='7' style='text-align:center;'>No hay información a mostrar</td> 
                                </tr>`;
                    strContainer.insertAdjacentHTML('beforeend', strTrs);
                }
            }
        }
    }
};

const searchData = async () => {
    open_loading();
    let elementFamily = document.getElementById('family'),
        formData = new FormData(),
        data = [];
    formData.append('family', elementFamily.value);
    formData.append('bool_json', true);
    formData.append('csrfmiddlewaretoken', valCSRF);

    let urlGetData = (elementFamily.value == 'resumen') ? urlGetResumen : (elementFamily.value == 'mixtos') ? urlGetMixtos : urlGetCuadriles;
    let response = await fetch(urlGetData, {method: 'POST', body: formData});
    
    try {
        data = await response.json();
    } catch(error) {
        data = [];
    }

    close_loading();
    if(data?.status) {
        if(elementFamily.value == 'resumen') {
            await drawTableResumen(data?.data, elementFamily.value);
        }
        else
            if(data?.planeacion_sku && Object.keys(data.planeacion_sku).length > 0)
                await drawTable(data.planeacion_sku, elementFamily.value);
            else
                alert_nova.showNotification("No hay información a mostrar", "warning", "danger");
    }
    else
        alert_nova.showNotification("Ocurrio un error al obtener la información", "warning", "danger");
};

const getAllData = async (e = this) => {
    e.preventDefault;
    await searchData();
};



const drawElementsIntoTabs = async (strElementID, boolFirst = false) => {
    let elem = document.getElementById('family');
    if(elem){
        const elements = document.querySelectorAll('.tab-pane');
        elements.forEach(element => {
            element.innerHTML = '';
        })
    }
    const content = document.getElementById(`${strElementID}`);
    content.innerHTML = '';
    content.innerHTML += `<input type='hidden' id='family' value='${strElementID}' />`;
    if(boolFirst)
        getAllData();
};

drawElementsIntoTabs('resumen', true);
