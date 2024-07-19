const drawHeaders = async () => {
    const cntTable = document.getElementById('cntTable');
    if(cntTable) {
        let tbl = ` <table class="table table-hover table-bordered table-condensed table-striped nowrap" id='tblPrincipal'>
                        <thead class='table-success'>
                            <tr>
                                <th>Codigo Empleado</th>
                                <th>Nombre Empleado</th>
                                <th>Nómina</th>
                                <th>Empresa</th>
                                <th>Fecha Alta</th>
                                <th>Puesto</th>
                                <th>Sueldo</th>
                            </tr>
                        </thead>
                        <tbody id='tBodyPrincipal'></tbody>
                    </table>`;
        cntTable.innerHTML = tbl;
        return true;
    }
    return false;
}

const getDataEmployee = async (intEmpleado) => {
    let strNewUrl = urlGetDataEmployee.replace('0', intEmpleado);
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
                    let strNomina = "",
                        intTotal = 0;
                    if(d.General * 1 > 0) {
                        strNomina = "General";
                        intTotal = (d.General * 1).toFixed(2)
                    }
                    else if(d.Facturacion * 1 > 0) {
                        strNomina = "Facturación";
                        intTotal = (d.Facturacion * 1).toFixed(2)
                    }
                    else if(d.Depreciacion * 1 > 0) {
                        strNomina = "Depreciación";
                        intTotal = (d.Depreciacion * 1).toFixed(2)
                    }
                    strTrs += ` <tr onclick='getDataEmployee("${d.No_Empleado}")'>
                                    <td data-filter="${d.No_Empleado}">${d.No_Empleado}</td>
                                    <td data-filter="${d.Empleado}">${d.Empleado}</td>
                                    <td data-filter="${strNomina}">${strNomina}</td>
                                    <td data-filter="${d.Empresa}">${d.Empresa}</td>
                                    <td data-filter="${d.fecha_alta}">${d.fecha_alta}</td>
                                    <td data-filter="${d.puesto}">${d.puesto}</td>
                                    <td data-type="numeric" data-number="${(parseInt(intTotal))}">Q ${numberFormat.format(intTotal, 2)}</td>
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

    if(data?.status)
        drawTable(data?.data);
    else
        alert_nova.showNotification(data?.message, 'warning', 'danger');
};

getData();