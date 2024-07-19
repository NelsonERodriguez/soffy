const btn = document.getElementById('btnSearchMovements'),
    monto = document.getElementById('monto');

drawTable();

if(btn) {
    btn.addEventListener('click', () => {
        getMovements();
    });
}

if(monto) {
    monto.addEventListener('change', () => {
        if( monto.value === '3' ){
            document.getElementById("valor-dos").disabled = false;
        }
        else{
            document.getElementById("valor-dos").disabled = true;
            document.getElementById("valor-dos").value = "";
        }
    });
}

async function drawTable() {
    const content = document.getElementById('contentAllTable');
    content.innerHTML = `   <table class="table" id="dtDefault">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo Movimiento</th>
                                        <th>No. Cheque</th>
                                        <th>Girado</th>
                                        <th>Valor</th>
                                        <th>Empresa</th>
                                        <th>Cuenta</th>
                                        <th>Banco</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody id="contentTable">
                                    <tr><td colspan='9' style='text-align: center;'>No hay registros a mostrar</td></tr>
                                </tbody>
                            </table>`;
    return true;
}

async function getMovements() {
    const formData = new FormData();
    await drawTable();
    let boolValidate = await validateForm();
    if (boolValidate) {
        open_loading();
        let empresa = document.getElementById('empresa'),
            movimiento = document.getElementById('movimiento'),
            inicio = document.getElementById('inicio'),
            fin = document.getElementById('fin'),
            cheque = document.getElementById('cheque'),
            banco = document.getElementById('banco'),
            valorUno = document.getElementById('valor-uno'),
            valorDos = document.getElementById('valor-dos');
        formData.append('empresa', empresa.value);
        formData.append('movimiento', movimiento.value);
        formData.append('inicio', inicio.value);
        formData.append('fin', fin.value);
        formData.append('cheque', cheque.value);
        formData.append('banco', banco.value);
        if( monto.value.trim().length > 0 ){
            formData.append('monto', monto.value);
            formData.append('valor-uno', valorUno.value);
            formData.append('valor-dos', valorDos.value);
        }
        formData.append('csrfmiddlewaretoken', document.getElementsByName('csrfmiddlewaretoken')[0].value);
        fetch(`${strUrlMovements}`, {
            method: 'POST',
            body: formData,
        })
        .then( response => response.json() )
        .then( data => {
            if(data.status) {
                if(Object.keys(data.data).length > 0) {
                    drawDetailsExist(data.data);
                }
                else {
                    document.getElementById('contentTable').innerHTML = `<tr><td colspan='9' style='text-align: center;'>No hay registros a mostrar</td></tr>`;
                }
            }
            close_loading();
        })
        .catch( error => console.error(error) )
    }
    else {
        alert_nova.showNotification('Falta un filtro por ingresar, verificar el formulario e intenta nuevamente.', "warning", "danger");
    }
}

async function validateForm() {
    let boolValidate = false,
        empresa = document.getElementById('empresa'),
        movimiento = document.getElementById('movimiento'),
        inicio = document.getElementById('inicio'),
        fin = document.getElementById('fin'),
        cheque = document.getElementById('cheque'),
        banco = document.getElementById('banco'),
        valorUno = document.getElementById('valor-uno'),
        valorDos = document.getElementById('valor-dos');

    if (empresa && empresa.value !== '0') { boolValidate = true; }
    if (movimiento && movimiento.value !== '0') { boolValidate = true; }
    if (inicio && inicio.value !== '') { boolValidate = true; }
    if (fin && fin.value !== '') { boolValidate = true; }
    if (cheque && cheque.value !== '') { boolValidate = true; }
    if (banco && banco.value !== '0') { boolValidate = true; }
    if (monto && monto.value !== '' && valorUno.value === '') { boolValidate = false; }
    if (monto && monto.value === '3' && (valorUno.value === '' || valorDos.value === '')) { boolValidate = false; }

    return boolValidate;
}

function drawDetailsExist(objDetail) {
    const content = document.getElementById('contentTable');
    content.innerHTML = '';

    let strHtml = '';

    objDetail.map(detail => {
        let strClass = (detail.Status == 'A') ? 'trowRed' : 'trowGreen';
        strHtml += `<tr class='${strClass}'>
                        <td>${detail.Fecha}</td>
                        <td>${detail.TipoMovimiento}</td>
                        <td>${detail.Cheque}</td>
                        <td>${detail.Girado}</td>
                        <td>${detail.Valor}</td>
                        <td>${detail.Empresa}</td>
                        <td>${detail.Cuenta}</td>
                        <td>${detail.Banco}</td>
                        <td>${detail.Status}</td>
                    </tr>`;
    });

    content.innerHTML = strHtml;

    $('#dtDefault').DataTable({
        "pagingType": "full_numbers",
        "lengthMenu": [
            [25, 50, 100, -1],
            [25, 50, 100, "All"]
        ],
        "columnDefs": [{
            targets: [2,4],
            className: "text-right"
        }],
        dom: 'lBfrtip',
        language: objLenguajeDataTable,
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fal fa-file-excel"></i>&#9;&#9;Excel',
                className: 'btn btn-outline-secondary',
                exportOptions: {
                    modifier: {
                        page: 'current'
                    }
                }
            }
        ]
    });
}