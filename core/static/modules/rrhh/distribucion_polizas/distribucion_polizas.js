const drawHeaders = async () => {
    const cntTable = document.getElementById('cntTable');
    if(cntTable) {
        let tbl = ` <table class="table table-hover table-bordered table-condensed nowrap" id='tblPrincipal'>
                        <thead class='table-info'>
                            <tr>
                                <th>Codigo Empleado</th>
                                <th>Nombre Empleado</th>
                                <th>Departamento</th>
                                <th>No. Cuenta</th>
                                <th>Cuenta</th>
                                <th>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody id='tBodyPrincipal'></tbody>
                    </table>`;
        cntTable.innerHTML = tbl;
        return true;
    }
    return false;
}

const goDetail = async (intEmpleado) => {
    let strNewUrl = urlEditPolizaEmpleado.replace('0', intEmpleado);
    location.href = strNewUrl;
};

const drawTable = async (objData) => {
    let boolTable = await drawHeaders();
    if(Object.keys(objData).length > 0) {
        if (boolTable) {
            let tBodyPrincipal = document.getElementById('tBodyPrincipal');
            if(tBodyPrincipal) {
                let strTrs = '';
                objData.map(d => {
                    strTrs += ` <tr onclick='goDetail("${d.No_Empleado}")'>
                                    <td data-filter="${d.No_Empleado}">${d.No_Empleado}</td>
                                    <td data-filter="${d.Empleado}">${d.Empleado}</td>
                                    <td data-filter="${d.depto}">${d.depto}</td>
                                    <td data-filter="${d.No_Contable}">${d.No_Contable}</td>
                                    <td data-filter="${d.cuenta}">${d.cuenta}</td>
                                    <td data-filter="${(d.porcentaje * 1)}">${d.porcentaje} %</td>
                                </tr>`;
                });
                tBodyPrincipal.insertAdjacentHTML('beforeend', strTrs);

                $('#tblPrincipal').DataTable({
                    "pagingType": "full_numbers",
                    "lengthMenu": [
                        [100, -1],
                        [100, "All"]
                    ],
                    "order": [1, "asc"],
                    language: objLenguajeDataTable,
                    dom: 'lBfrtip',
                    buttons: []
                });
            }
            else
                alert_nova.showNotification("No se puede mostrar la información", 'warning', 'danger');
        }
        else
            alert_nova.showNotification("Ocurrio un error al crear la tabla", 'warning', 'danger');
    }
};

const getData = async () => {
    open_loading();
    let formData = new FormData(),
        data = [];
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(strUrlGetData, {method: 'POST', body: formData});
    try {
        data = await response.json();
    } catch (error) {
        data = [];
        console.error(error);
    }

    close_loading();
    if(data?.status) {
        drawTable(data?.data);
    }
    else
        alert_nova.showNotification(data?.message, 'warning', 'danger');
};

getData();