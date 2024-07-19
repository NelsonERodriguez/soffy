getAllData();

async function getAllData(e = this) {
    e.preventDefault;
    await searchWeeks();
}

async function searchWeeks() {
    open_loading();
    const elementWeek = document.getElementById('date_week');

    let objReturn = {},
        formData = new FormData();
    formData.append('date_week', elementWeek.value);
    formData.append('csrfmiddlewaretoken', valCSRF);
    fetch(`${urlGetWeeks}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(async(data) => {
        if(data.status){
            if(Object.keys(data.result).length > 0) {
                let objLabelsChart = await drawInfoTableWeeks(data);
                drawChartWeeks(objLabelsChart);
            }
            else {
                alert_nova.showNotification("No hay información a mostrar, intenta cambiar los filtros.", "warning", "danger");
            }
            close_loading();
        }
    })
    .catch(error => console.error(error))
}

async function drawInfoTableWeeks(objData, strValueMode) {
    let objResult = objData.result;
    const contentGraphicsWeeks = document.getElementById('contentInfoWeeks');
    contentGraphicsWeeks.innerHTML = `  <div class='row' id='chartWeeks' style='max-height: 500px; margin: 50px 0;'></div>
                                        <div class='row' id='tableWeeks'>
                                            <div class='col-12 col-md-12' id='tBodyTableWeeks'></div>
                                        </div>`;
    let content = document.getElementById('tBodyTableWeeks'),
        arrReturn = [],
        strTH = '',
        tdRowReal = '',
        tdRowPedidos = '',
        tdRowSin = '';

    for(let k in objResult){
        const d = objResult[k];
        let intPercentage = 100,
            intSin = (d.Pedido * 1) - (d.Entregados * 1);

        strTH += `<th>Sem ${d.semana}</th>`;
        tdRowPedidos += `<td class='tdDetailNoMargin'>${d.Pedido} CONT</td>`;
        tdRowReal += `<td class='tdDetailNoMargin'>${d.Entregados} CONT</td>`;
        tdRowSin += `<td class='tdDetailNoMargin'>${intSin} CONT</td>`;

        arrReturn[k] = {
            'week': `Semana ${d.semana}`,
            'real': (d.Pedido * 1),
            'period': 100,
            'objective': (objData.pb * 1),
            'str_y': '%',
        };
    }
    content.innerHTML = `   <table class='table table-london'>
                                <thead>
                                    <tr>
                                        <th></th>
                                        ${strTH}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Pedidos</td>
                                        ${tdRowPedidos}
                                    </tr>
                                    <tr>
                                        <td>Real</td>
                                        ${tdRowReal}
                                    </tr>
                                    <tr>
                                        <td>Sin Entregar</td>
                                        ${tdRowSin}
                                    </tr>
                                </tbody>
                            </table>`;
    return arrReturn;
}

function drawChartWeeks(objData){
    let objCategories = [],
        objReal = [],
        objObjective = [],
        objAlcance = [],
        strAlcance = '',
        strObjective = '',
        strY = '';
    for(const k in objData){
        const d = objData[k];
        objCategories.push(d.week);
        objReal.push(d.real);
        objObjective.push(d.period);
        objAlcance.push(d.objective);
        strAlcance = (d.objective * 1).toFixed(0);
        strObjective = (d.period * 1).toFixed(0);
        strY = d.str_y;
    }
    const objGraphic = {
        'str_id': 'chartWeeks',
        'title': 'Indicador Otif de las Ultimas Cuatro Semanas (según filtro)',
        'subTitle': '',
        'objCategories': objCategories,
        'objReal': objReal,
        'objObjective': objObjective,
        'objAlcance': objAlcance,
        'strObjective': strObjective,
        'strAlcance': strAlcance,
        'type': 'weekly',
        'uom': strY,
        'valueChart': strY,
    };
    drawGlobalHighChartsLondon(objGraphic);
}