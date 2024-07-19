const getInfo = async (urlToGetData) => {
    let arrReturn = [],
        formData = new FormData(),
        element = document.getElementById('date_month');

    formData.append('month', element.value);
    formData.append('csrfmiddlewaretoken', valCSRF);

    const response = await fetch(`${urlToGetData}`, { method: 'POST', body: formData, });
    const data = await response.json();

    if(data){
        if(data.status) {
            if(Object.keys(data.result).length > 0) {
                arrReturn = data.result;
            }
            else {
                alert_nova.showNotification("No hay información a mostrar, intenta cambiar los filtros.", "warning", "danger");
            }
        }
    }
    else {
        console.error(data);
    }

    return arrReturn;
};

const getHeaders = async (objCartera) => {
    let strReturn = '',
        objTitles = objCartera.corriente['data'];
    for(let k in objTitles){
        const detail = objTitles[k];
        strReturn += `<th> Mes ${detail.mes} </th>`;
    }
    return strReturn;
};

const drawRowsCartera = async (objCartera, boolPercentages) => {
    let strReturn = '',
        strTrs = '';

    for(const k in objCartera) {
        let d = objCartera[k],
            strColumns = '',
            intMonth = 1,
            strPrevKey = '';

        for(const key in d.data) {
            const detail = d.data[key];
            if(boolPercentages && k != 'totals') {
                let intPercentage  = ((detail.saldo * 1) / (objCartera['totals'].data[key].saldo * 1) * 100).toFixed(0),
                    strClassTd = 'td-bad-percentage';

                if(k == 'corriente') {
                    if(intPercentage > intPercentageCarteraCorriente) {
                        strClassTd = 'td-good-percentage';
                    }
                }
                else if(k == 'vencida') {
                    if(intPercentage < intPercentageCarteraVencida) {
                        strClassTd = 'td-good-percentage';
                    }
                }
                strColumns += `<td class='${strClassTd}'>${intPercentage} %</td>`;
            }
            else {
                strColumns += `<td>Q ${numberFormat.format( (detail.saldo * 1).toFixed(0) )}</td>`;
            }


            if(intMonth === 4) {
                if(k != 'totals') {
                    let intSaldo = (detail.saldo * 1) - (d.data[strPrevKey].saldo * 1);
                    if(intSaldo > 0) {
                        let strColor = (d.name === 'Corriente') ? 'green' : 'red';
                        strColumns += ` <td style="background: ${strColor}; color: white;">
                                            <i class="fas fa-arrow-alt-up"></i>
                                        </td>`;
                    }
                    else {
                        let strColor = (d.name === 'Corriente') ? 'red' : 'green';
                        strColumns += ` <td style="background: ${strColor}; color: white;">
                                            <i class="fas fa-arrow-alt-down"></i>
                                        </td>`;
                    }
                }
                else {
                    strColumns += `<td></td>`;
                }
            }


            intMonth++;
            strPrevKey = key;
        }

        let intPB = '- - -',
            intObj = '- - -';
        if(k === 'corriente') {
            intPB = '74.38 %';
            intObj = '78.9 %';
        }
        else if(k === 'vencida') {
            intPB = '25.62 %';
            intObj = '21.1 %';
        }

        strTrs += ` <tr>
                        <td>${d.name}</td>
                        <td>${intPB}</td>
                        <td>${intObj}</td>
                        ${strColumns}
                    </tr>`;
    }

    strReturn += strTrs;

    return strReturn;
};

const drawRowsDeslizamiento = async (objDeslizamiento, boolPercentages) => {
    let strReturn = '';
    for(const k in objKeysDeslizamiento) {
        const d = objKeysDeslizamiento[k];
        let strTds = '',
            intLoop = 1,
            strPrevKey = '';

        for(const key in objGlobalMonths) {
            const month = objGlobalMonths[key];
            let objDetail = objGlobalDeslizamiento.find(d => d.mes == month.key_month),
                strShow = '';
            if(boolPercentages) {
                let intTMP = (objDetail[d.key_period] * 1) / (objGlobalCartera['totals'].data[month.key_month].saldo * 1);
                strShow = `${(intTMP * 100).toFixed(2)} %`;
            }
            else {
                strShow = `Q ${numberFormat.format((objDetail[d.key_period] * 1).toFixed(0))}`;
            }
            strTds += ` <td>
                            ${strShow}
                        </td>`;
            if(intLoop === 4) {
                let objDetailPrevMonth = objGlobalDeslizamiento.find(d => d.mes == strPrevKey);
                if(((objDetail[d.key_period] * 1) - (objDetailPrevMonth[d.key_period] * 1)) > 0) {
                    strTds += ` <td style='background: red; color: white;'>
                                    <i class="fas fa-arrow-alt-up"></i>
                                </td>`;
                }
                else {
                    strTds += ` <td style='background: green; color: white;'>
                                    <i class="fas fa-arrow-alt-down"></i>
                                </td>`;
                }
            }
            strPrevKey = month.key_month;
            intLoop++;
        }

        strReturn += `  <tr>
                            <td>${d.str_show}</td>
                            <td>${d.pb} %</td>
                            <td>${d.obj} %</td>
                            ${strTds}
                        </tr>`;
    }
    return strReturn;
};

const drawRowsSobregiro = async (objSobregiros, boolPercentages) => {
    let strReturn = '',
        columnsSobregiro = '',
        intPB = '',
        intObj = '',
        intLengthSb = Object.keys(objSobregiros).length;

    for(const k in objSobregiros){
        const d = objSobregiros[k];
        columnsSobregiro += `<td>Q ${numberFormat.format(d.sobregiro)}</td>`;
        intPB = numberFormat.format(d.periodo_base);
        intObj = numberFormat.format(d.objetivo);
    }
    let intStatus = objSobregiros[intLengthSb - 1].sobregiro - objSobregiros[intLengthSb - 2].sobregiro;
    if(intStatus > 0) {
        columnsSobregiro += `<td style="background: red; color: white;">
                                <i class="fas fa-arrow-alt-up"></i>
                            </td>`;
    }
    else {
        columnsSobregiro += `   <td style="background: green; color: white;">
                                    <i class="fas fa-arrow-alt-down"></i>
                                </td>`;
    }

    strReturn += `  <tr class='trTitle'>
                        <td>Monto de Sobregiro</td>
                        <td>${intPB}</td>
                        <td>${intObj}</td>
                        ${columnsSobregiro}
                    </tr>`;

    return strReturn;
};

const drawTable = async (boolPercentages = false) => {
    let content = document.getElementById('contentTable'),
        strMonthsHeaders = await getHeaders(objGlobalCartera),
        strTBody = '';

    strTBody += await drawRowsCartera(objGlobalCartera, boolPercentages);
    strTBody += await drawRowsDeslizamiento(objGlobalDeslizamiento, boolPercentages);
    strTBody += await drawRowsSobregiro(objGlobalSobregiros, boolPercentages);

    content.innerHTML = `   <table class="table table-london">
                                <thead>
                                    <tr>
                                        <th>Indicador</th>
                                        <th>PB</th>
                                        <th>OBJ</th>
                                        ${strMonthsHeaders}
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${strTBody}
                                </tbody>
                            </table>`;
    return true;
};

const makeObjCartera = async (objPrevCartera) => {
    let arrReturn = {
        'totals': {
            'name': 'Cartera Total',
            'data': [],
        },
        'corriente': {
            'name': 'Corriente',
            'data': [],
        },
        'vencida': {
            'name': 'Vencida',
            'data': [],
        },
    },
        tmpKeysDeslizamiento = [];

    objPrevCartera.map(detail => {
        let strKeyMonth = detail.mes;
        if(typeof tmpKeysDeslizamiento[strKeyMonth] === 'undefined') {
            tmpKeysDeslizamiento[strKeyMonth] = { 'key_month': strKeyMonth };
        }

        if(typeof arrReturn['corriente']['data'][strKeyMonth] == 'undefined') {
            arrReturn['corriente']['data'][strKeyMonth] = {
                'mes': detail.mes,
                'saldo': detail.Corriente,
            };
        }
        if(typeof arrReturn['vencida']['data'][strKeyMonth] == 'undefined') {
            arrReturn['vencida']['data'][strKeyMonth] = {
                'mes': detail.mes,
                'saldo': detail.Vencido,
            };
        }
        if(typeof arrReturn['totals']['data'][strKeyMonth] == 'undefined') {
            arrReturn['totals']['data'][strKeyMonth] = {
                'mes': detail.mes,
                'saldo': (detail.Vencido * 1) + (detail.Corriente * 1),
            };
        }
    });

    for(const k in tmpKeysDeslizamiento) {
        const d = tmpKeysDeslizamiento[k];
        objGlobalMonths.push(d);
    }

    return arrReturn;
};

const loadData = async () => {
    open_loading();
    const objPrevCartera = await getInfo(urlGetMonthsCartera);
    objGlobalCartera = await makeObjCartera(objPrevCartera);
    objGlobalDeslizamiento = await getInfo(urlGetMonthsDeslizamiento);
    objGlobalSobregiros = await getInfo(urlGetMonthsSobregiros);
    drawTable();
    close_loading();
};

const setInPercentages = () => {
    const element = document.getElementById('chk_percentages');
    drawTable(element.checked);
};

loadData();