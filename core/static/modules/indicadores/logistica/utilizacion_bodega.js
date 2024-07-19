function saveUtilizacion() {
    form = new FormData(document.getElementById('formBodega'))
    document.getElementById('btnSendForm').setAttribute('disabled', 'disabled');
    document.getElementById('btnSendForm').style.cursor = 'no-drop';
    open_loading();
    fetch(`${strUrlSave}`, {
        method: 'POST',
        body: form,
    })
    .then(response => response.json())
    .then(data => {
        close_loading();
        if(!data.bool_error){
            alert_nova.showNotification(data.msj, "add_alert", "success");
            setTimeout(() => {
                location.reload();
            }, 3000);
        }
        else {
            alert_nova.showNotification(data.msj, "warning", "danger");
        }
    })
}

function setNewValue(strNoUbicacion) {
    let intTotal = 0;
    objBodegas.map(detail => {
        const element = document.getElementById(`bodega_${detail.no_ubicacion}`);
        if(element) {
            intTotal += (element.value * 1);
            if(strNoUbicacion == detail.no_ubicacion) {
                let newValue = element.value;

                let newPercentage = (( (detail.existencia * 1) / (newValue * 1) ) * 100).toFixed(2);
                document.getElementById(`percentage_${strNoUbicacion}`).innerHTML = `${newPercentage} %`;

                let strNewClass = (newPercentage < 50) ? 'table-danger-custom' : (newPercentage < 70 ? 'table-warning-custom' : 'table-success-custom');
                document.getElementById(`tr_${strNoUbicacion}`).removeAttribute('class');
                document.getElementById(`tr_${strNoUbicacion}`).setAttribute('class', strNewClass);
            }
        }
    });
    let strTotal = numberFormat.format(intTotal);
    // intGlobalCapacidad = strTotal;
    document.getElementById('contentTotals').innerHTML = `  ${strTotal}
                                                            <input type="hidden" name="librascapacidad" id="librascapacidad" value="${strTotal}">`;

    let intNewPercentage = (intGlobalUtilizacion * 1) / (intTotal * 1),
        porcentajeglobalShow = (intNewPercentage * 100).toFixed(2);
    document.getElementById('contentPorcentaje').innerHTML = `  ${porcentajeglobalShow} %
                                                                <input type="hidden" name="porcentajeglobal" id="porcentajeglobal" value="${intNewPercentage}">`;
}

async function makeTableToPrint(tableID){
    open_loading();
    let boolDonePrint = await makeTableBeforeToPrint();
    if(boolDonePrint){
        exportTableToExcel('tblUtilizacion', 'utilizacion_bodega');
        setTimeout(() => {
            makeTableBeforeToPrint(true);
            close_loading();
        }, 1500);
    }
}

async function makeTableBeforeToPrint(boolShowInputs = false) {
    let elements = document.querySelectorAll('input[name="capacidad[]"]');
    elements.forEach(element => {
        element.style.display = (boolShowInputs) ? 'block' : 'none';
        let elm = element.getAttribute('id'),
            strValue = element.value;
        let content = document.getElementById(`content_${elm}`);
        if(!boolShowInputs) {
            content.innerHTML += `<p class='strPToPrint'>${strValue}</p>`;
        }
    });
    if(boolShowInputs) {
        let pElements = document.querySelectorAll('.strPToPrint');
        pElements.forEach(element => {
            element.remove();
        });
    }

    return true;
}

async function makeImgToPrint(strElement) {
    var tab = document.getElementById(strElement);
    tab.innerHTML += `<style>
        tfoot > tr {
            background-color: #b8ecf3;
        }
        th, td {
            padding: 12px 8px;
            vertical-align: middle;
        }
        #tBodyTableMonths, #tBodyTableWeeks { overflow-x: auto; }
        .imgLogoFloatRight {
            width: 200px;
            height: auto;
            float: right;
        }
        .inputFormBodega {
            border-radius: 8px;
            border: none;
            padding: 2px 15px;
        }
        .table-danger-custom, .table-danger-custom > td {
            background: #FF3333;
            color: white;
            font-weight: bold;
        }
        .table-warning-custom, .table-warning-custom > td {
            background: #DACA2C;
            color: white;
            font-weight: bold;
        }
        .table-success-custom, .table-success-custom > td {
            background: #2CDA44;
            color: white;
            font-weight: bold;
        }
    </style>`;
    var win = window.open('', '', 'height=700,width=700');
    win.document.write(tab.outerHTML);
    win.document.close();
    win.print();
}