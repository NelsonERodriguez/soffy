const drawTableMovements = async (objMovements) => {
    const content = document.getElementById('contentTableMovements');
    let strNomina = document.getElementById('slt_nomina').value;

    let strRows = '<tr colspan="7">No hay información a mostrar</tr>';
    if(Object.keys(objMovements).length && content) {
        strRows = '';
        objMovements.map(movement => {
            strRows += `<tr>
                            <td>${movement.Nombres} ${movement.Apellidos}</td>
                            <td>${movement.Fecha_Inicio}</td>
                            <td>${movement.Fecha_Final}</td>
                            <td>${movement.Total}</td>
                            <td>${movement.Cuota}</td>
                            <td>${movement.Saldo}</td>
                            <td>${movement.Observaciones}</td>
                        </tr>`;
        });
    }

    let strTable = `<table class="table" id='dtDefault'>
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Fecha Inicio</th>
                                <th>Fecha Fin</th>
                                <th>Total</th>
                                <th>Cuota</th>
                                <th>Saldo</th>
                                <th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${strRows}
                        </tbody>
                    </table>`;
    content.innerHTML = strTable;
    makeDataTableDefault(false, true, {"order": [[ 0, "asc" ]], pageLength: '50', });
};

const searchMovements = async () => {
    const sltSearch = document.getElementById('slt_nomina');
    if(sltSearch) {
        open_loading();
        let formData = new FormData();
        formData.append('nomina', sltSearch.value);
        formData.append('csrfmiddlewaretoken', valCSRF);
        const response = await fetch(urlGetInfo, {method: 'POST', body: formData});
        const data = await response.json();

        if(data?.status) {
            drawTableMovements(data.response);
        }
        else {
            alert_nova.showNotification('Ocurrió un error en obtener los movimientos.', 'warning', 'danger');
        }
        close_loading();
    }
};

searchMovements();