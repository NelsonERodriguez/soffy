const objContenido = document.getElementById('contenido');

const showPeriodos = async (arrPeriodos) => {
    objContenido.innerHTML = ``;
    if (arrPeriodos.status) objContenido.appendChild(await buildPeriodosHTML(arrPeriodos.periodos));
    if (arrPeriodos.status) objContenido.appendChild(await buildHistorialHTML(arrPeriodos.vacaciones));
    initializeDataTable();

    close_loading();
};

const getPeriodos = async (intUser) => {
    const objFormData = new FormData();
    objFormData.append('user', intUser);
    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    let objInit = {
        method: 'POST', body: objFormData
    };
    const objOptions = {
        boolShowSuccessAlert: false, boolShowErrorAlert: false
    };

    open_loading();
    await coreFetch(strUrlGetPeriodos, objInit, showPeriodos, objOptions)
    document.getElementById('user').blur();
};

const buildPeriodosHTML = async (periodos) => {
    const divRow = await createElement({element: 'div', classes: ['row']});

    const divCol = await createElement({element: 'div', classes: ['col-12']});

    const h3 = await createElement({element: 'h3'});
    h3.textContent = 'Disponibilidad';

    const table = await createElement({element: 'table', classes: ['table']});

    const thead = await createElement({element: 'thead'});
    const trHead = await createElement({element: 'tr'});
    const thPeriodo = await createElement({element: 'th'});
    thPeriodo.textContent = 'Periodo';
    const thDisponible = await createElement({element: 'th'});
    thDisponible.textContent = 'Disponible';
    const thDiasGozados = await createElement({element: 'th'});
    thDiasGozados.textContent = 'Dias Gozados';
    trHead.appendChild(thPeriodo);
    trHead.appendChild(thDisponible);
    trHead.appendChild(thDiasGozados);
    thead.appendChild(trHead);

    const tbody = await createElement({element: 'tbody'});
    for (let periodo of periodos) {
        const tr = await createElement({element: 'tr'});
        const tdPeriodo = await createElement({element: 'td'});
        tdPeriodo.textContent = periodo.Periodo;
        const tdDiasPendientes = await createElement({element: 'td'});
        tdDiasPendientes.textContent = periodo.DiasPendientes;
        const tdDiasGozados = await createElement({element: 'td'});
        tdDiasGozados.textContent = periodo.DiasGozados;
        tr.appendChild(tdPeriodo);
        tr.appendChild(tdDiasPendientes);
        tr.appendChild(tdDiasGozados);
        tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);

    divCol.appendChild(h3);
    divCol.appendChild(table);

    divRow.appendChild(divCol);

    return divRow;
};

const buildHistorialHTML = async (vacaciones) => {
    const divRow = await createElement({element: 'div', classes: ['row']});

    const divCol = await createElement({element: 'div', classes: ['col-12']});

    const h3 = await createElement({element: 'h3'});
    h3.textContent = 'Historial';

    const table = await createElement({element: 'table', classes: ['table'], id: 'tableHistorial'});

    const thead = await createElement({element: 'thead'});
    const trHead = await createElement({element: 'tr'});
    const thEmpleado = await createElement({element: 'th'});
    thEmpleado.textContent = 'Empleado';
    const thFechaInicio = await createElement({element: 'th'});
    thFechaInicio.textContent = 'Fecha Inicio';
    const thFechaFin = await createElement({element: 'th'});
    thFechaFin.textContent = 'Fecha Fin';
    const thDias = await createElement({element: 'th'});
    thDias.textContent = 'Dias';
    const thMonto = await createElement({element: 'th'});
    thMonto.textContent = 'Monto';
    const thPeriodo = await createElement({element: 'th'});
    thPeriodo.textContent = 'Periodo';
    trHead.appendChild(thEmpleado);
    trHead.appendChild(thFechaInicio);
    trHead.appendChild(thFechaFin);
    trHead.appendChild(thDias);
    trHead.appendChild(thMonto);
    trHead.appendChild(thPeriodo);
    thead.appendChild(trHead);

    const tbody = await createElement({element: 'tbody'});
    for (let historial of vacaciones) {
        const tr = await createElement({element: 'tr'});
        const tdNombre = await createElement({element: 'td'});
        tdNombre.textContent = historial.nombre;
        const tdFechaInicio = await createElement({element: 'td'});
        tdFechaInicio.textContent = historial.fecha_inicio;
        const tdFechaFin = await createElement({element: 'td'});
        tdFechaFin.textContent = historial.fecha_fin;
        const tdCantidad = await createElement({element: 'td'});
        tdCantidad.textContent = historial.cantidad;
        const tdMonto = await createElement({element: 'td'});
        tdMonto.textContent = historial.monto ?? '';
        const tdPeriodo = await createElement({element: 'td'});
        tdPeriodo.textContent = historial.periodo;
        tr.appendChild(tdNombre);
        tr.appendChild(tdFechaInicio);
        tr.appendChild(tdFechaFin);
        tr.appendChild(tdCantidad);
        tr.appendChild(tdMonto);
        tr.appendChild(tdPeriodo);
        tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);

    divCol.appendChild(h3);
    divCol.appendChild(table);

    divRow.appendChild(divCol);

    return divRow;
};

const initializeDataTable = () => {
    $(`#tableHistorial`).DataTable({
        "pagingType": "full_numbers",
        "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
        responsive: false,
        language: objLenguajeDataTable,
    });
};

document.addEventListener('DOMContentLoaded', () => {
    $('#user').autocomplete({
        minLength: 1, source: (request, response) => {
            const data = new FormData();
            data.append('csrfmiddlewaretoken', getCookie('csrftoken'));
            data.append('search', request.term);

            let objInit = {
                method: 'POST', body: data
            };
            const objOptions = {
                boolShowSuccessAlert: false, boolShowErrorAlert: false
            };

            const drawAuto = (data) => {
                if (data.status) {
                    response($.map(data.users, function (item) {
                        return {
                            label: item.name, value: item.id
                        }
                    }));
                }
            }
            coreFetch(strUrlGetUsers, objInit, drawAuto, objOptions);
        }, select: function (event, ui) {
            event.preventDefault();
            document.getElementById('user').value = ui.item.label;
            document.getElementById('user_id').value = ui.item.value;
            getPeriodos(ui.item.value);
        }
    }).focus(function () {
        objContenido.innerHTML = '';
        this.value = '';
        document.getElementById('user_id').value = '';
    });
});
