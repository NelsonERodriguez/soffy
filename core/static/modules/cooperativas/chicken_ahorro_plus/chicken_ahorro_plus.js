const getDetalle = (strCodEmpleado, strNomina) => {
    const divDetalle = document.getElementById('divDetalle');
    divDetalle.innerHTML = ``;
    const form = new FormData();
    form.append('CodEmpleado', strCodEmpleado);
    form.append('nomina', strNomina);

    open_loading();
    let csrftoken = getCookie('csrftoken');

    fetch(strUrlGetDetalle, {
        method: 'POST',
        headers: {
            "X-CSRFToken": csrftoken
        },
        body: form
    })
    .then(response => response.json())
    .then( (data) => {
        close_loading();

        let strTable = `
            <table class="table table-hover" style="width: 100%;">
                <thead>
                    <tr>
                        <th style="text-align: center;">Código Empleado</th>
                        <th style="text-align: center;">Apellidos</th>
                        <th style="text-align: center;">Nombres</th>
                        <th style="text-align: center;">Empresa</th>
                        <th style="text-align: center;">Cuota de Ahorro</th>
                        <th style="text-align: center;">Fecha</th>
                    </tr>
                </thead>
                <tbody>`;

        let intTotal = 0;
        for (let key in data.detalle) {
            const arrDetalle = data.detalle[key];
            const strFecha = arrDetalle.Fecha.replace('T', ' ');
            const arrSplit = strFecha.split(' ');
            const arrSplit2 = arrSplit[0].split('-');
            const fecha = `${arrSplit2[2]}/${arrSplit2[1]}/${arrSplit2[0]} ${arrSplit[1]}`;

            strTable += `
                <tr>
                    <td>${arrDetalle.CodEmpleado}</td>
                    <td>${arrDetalle.Apellidos}</td>
                    <td>${arrDetalle.Nombres}</td>
                    <td>${arrDetalle.Empresa}</td>
                    <td style="text-align: right;">Q ${arrDetalle.Cuota_de_Ahorro}</td>
                    <td>${fecha}</td>
                </tr>
            `;

            intTotal += parseFloat(arrDetalle.Cuota_de_Ahorro);
        }

        strTable += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4"></td>
                        <td style="text-align: right;">Q ${intTotal}</td>
                    </tr>
                </tfoot>
            </table>
        `;

        divDetalle.innerHTML = strTable;

    })
    .catch((error) => {
        close_loading();
        alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
        console.error(error);
    });

};

$(document).ready(function() {
    $('.tblRpt').DataTable({
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "All"]
        ],
        language: objLenguajeDataTable,
        dom: 'lBfrtip',
        buttons: [
            {
                extend: 'excel',
                text: 'Excel',
                className: 'btn btn-default',
                exportOptions: {
                    modifier: {
                        page: 'current'
                    }
                }
            }
        ]
    });
});
