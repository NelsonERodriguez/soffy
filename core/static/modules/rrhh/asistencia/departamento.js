const btnGenerar = document.getElementById('btnGenerar'),
    divAsistencia = document.getElementById('divAsistencia'),
    objTbodyAsistencia = document.getElementById('tbodyAsistencia'),
    objDepartamento = document.getElementById('departamento'),
    objFechaInicio = document.getElementById('fecha_inicio');
objFechaFin = document.getElementById('fecha_fin');

const generarReporte = () => {

    divAsistencia.innerHTML = '';

    open_loading();
    const data = new FormData(),
        csrftoken = getCookie('csrftoken');
    data.append('csrfmiddlewaretoken', csrftoken);
    data.append('departamento', objDepartamento.value);
    data.append('fecha_inicio', objFechaInicio.value);
    data.append('fecha_fin', objFechaFin.value);

    fetch(strUrlDepartamento, {
        method: 'POST',
        body: data
    })
        .then(response => response.json())
        .then(async (data) => {
            close_loading();

            if (data.status) {

                let strBody = ``;
                for (let key in data.reporte) {

                    const arrEmpleado = data.reporte[key];
                    //
                    // let objOption = {
                    //     element: 'tr',
                    // };
                    // let objTr = await createElement(objOption);
                    //
                    // objOption = {
                    //     element: 'td',
                    // };
                    // let objTh = await createElement(objOption);
                    // objTh.innerText = arrEmpleado.nombre;
                    // objTr.appendChild(objTh);

                    // await objTbodyAsistencia.appendChild(objTr);

                    for (let key2 in arrEmpleado.fechas) {

                        const arrFechas = arrEmpleado.fechas[key2];
                        strBody += `
                        <tr>
                            <td class="text-left">${arrEmpleado.nombre}</td>
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

                }
                divAsistencia.innerHTML = `
                            <table id="tableAsistencia" class="table table-striped">
                                <thead>
                                    <tr>
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
                table = $('#tableAsistencia').DataTable({
                    "pagingType": "full_numbers",
                    "lengthMenu": [
                        [10, 25, 50, -1],
                        [10, 25, 50, "All"]
                    ],
                    iDisplayLength: -1,
                    columnDefs: [{visible: false, targets: 0}],
                    rowGroup: {
                        dataSrc: 0,
                    },
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
