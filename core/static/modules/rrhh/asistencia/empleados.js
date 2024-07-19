const btnGenerar = document.getElementById('btnGenerar'),
    divAsistencia = document.getElementById('divAsistencia'),
    objEmpleado = document.getElementById('empleado'),
    objFechaInicio = document.getElementById('fecha_inicio');
objFechaFin = document.getElementById('fecha_fin');

const generarReporte = () => {

    divAsistencia.innerHTML = '';

    open_loading();
    const data = new FormData(),
        csrftoken = getCookie('csrftoken');
    data.append('csrfmiddlewaretoken', csrftoken);
    data.append('codigo', objEmpleado.value);
    data.append('fecha_inicio', objFechaInicio.value);
    data.append('fecha_fin', objFechaFin.value);

    fetch(strUrlEmpleados, {
        method: 'POST',
        body: data
    })
        .then(response => response.json())
        .then(async (data) => {
            close_loading();

            if (data.status) {

                let strBody = ``;
                for (let key in data.reporte) {

                    const arrFechas = data.reporte[key];
                    strBody += `
                        <tr>
                            <td class="text-left">${arrFechas.codigo}</td>
                            <td class="text-left">${arrFechas.nombre}</td>
                            <td class="text-left">${arrFechas.fecha}</td>
                            <td class="text-left">${arrFechas.dia}</td>
                            <td class="text-left">${arrFechas.entrada ?? ""}</td>
                            <td class="text-left">${arrFechas.salida ?? ""}</td>
                            <td class="text-left">${arrFechas.horas ?? ""}</td>
                            <td class="text-left">${arrFechas.simples ?? ""}</td>
                            <td class="text-left">${arrFechas.dobles ?? ""}</td>
                        </tr>
                    `;

                }
                divAsistencia.innerHTML = `
                            <table id="tableAsistencia" class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Empleado</th>
                                        <th>Fecha</th>
                                        <th>Día</th>
                                        <th>Entrada</th>
                                        <th>Salida</th>
                                        <th>Horas</th>
                                        <th>Simples</th>
                                        <th>Dobles</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyAsistencia">${strBody}</tbody>
                            </table>`;


                // if ( $.fn.dataTable.isDataTable( '#tableAsistencia' ) ) {
                //     table = $('#tableAsistencia').DataTable();
                // }
                // else {
                $('#tableAsistencia').DataTable({
                    "pagingType": "full_numbers",
                    "lengthMenu": [
                        [10, 25, 50, -1],
                        [10, 25, 50, "All"]
                    ],
                    iDisplayLength: -1,
                    responsive: false,
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
                    ],
                    language: objLenguajeDataTable,
                });
                // }

            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
        });

};

btnGenerar.onclick = () => {
    generarReporte();
};
