const elementSearchEmpresa = document.getElementById('empresa'),
    hiddenEmpresaId = document.getElementById('empresa_id'),
    elementSearchEmpleado = document.getElementById('empleado'),
    hiddenEmpleadoId = document.getElementById('empleado_id'),
    calendarEl = document.getElementById('calendar');

const calendar = $(calendarEl);
calendar.fullCalendar({
    locale: 'es',
    header: {
        left: 'title',
        center: '',
        right: 'prev,next,today'
    },
    selectable: true,
    firstDay: 0,
    selectHelper: true,
    contentHeight: 600,
    select: function (start, end) {

        if (hiddenEmpresaId.value !== "") {

            if(start.isBefore(moment())) {
                calendar.fullCalendar('unselect');
                alert_nova.showNotification('No puede planificar fechas pasadas.', "warning", "warning");
                return false;
            }

            const objFechas = {
                "start": start.format(),
                "end": end.subtract(1, "days").format()
            }

            dialogConfirm(saveVacaciones, objFechas);

        }
        else {
            alert_nova.showNotification('Primero debe seleccionar un empleado.', "warning", "warning");
        }
    },
    editable: false,
    eventLimit: true, // allow "more" link when too many events
    eventSources: [

        // your event source
        {
            url: strUrlGetVacaciones,
            method: 'POST',
            data: {
                base: document.getElementById('base').value,
                csrfmiddlewaretoken: getCookie('csrftoken')
            },
            failure: function () {
                alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            },
            className: 'cursorPointer',
            color: '#8e24aa',   // a non-ajax option
            //textColor: 'black' // a non-ajax option
        }

        // any other sources...

    ],
    eventClick: function(calEvent, jsEvent, view) {

        const objData = {
            "fecha": calEvent.start.format(),
            "empleado_id": calEvent.no_empleado
        }
        dialogConfirm(deleteVacaciones, objData, '¿Desea eliminar?', '¡No podrás revertir esto!', 'error');
    }
});

const deleteVacaciones = (objData) => {

    let csrftoken = getCookie('csrftoken');
    const form = new FormData();
    form.append('empleado_id', objData.empleado_id);
    form.append('fechas', objData.fecha);

    open_loading();

    fetch(strUrlDeletePlanificaion, {
        method: 'POST',
        headers: {
            "X-CSRFToken": csrftoken
        },
        body: form
    })
        .then(response => response.json())
        .then( data => {

            close_loading();
            if (hiddenEmpleadoId.value !== '') {
                getDiasDisponibles();
            }
            $(calendarEl).fullCalendar( 'refetchEvents' );

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
        });
};

const saveVacaciones = (objFechas) => {

    const objDateStart = new Date(objFechas.start);
    const objDateEnd = new Date(objFechas.end);
    const strDifference = objDateEnd.getTime() - objDateStart.getTime();
    const intDiasSolicitados = (strDifference / (1000 * 3600 * 24) + 1);
    const intDias = (intTotalDiasDisponibles - intTotalDiasOcupados);
    if (intTotalDiasDisponibles && intDias) {

        if (intDiasSolicitados <= intDias) {

            let strDatesProcess = '';
            for (let i = 1; i <= intDiasSolicitados; i++) {
                const objMoment = moment(objFechas.start);
                const strDate = objMoment.subtract(((i - 1) * -1), "days").format("YYYY-MM-DD");

                strDatesProcess += (strDatesProcess === '')? strDate : `,${strDate}`;

            }

            let csrftoken = getCookie('csrftoken');
            const form = new FormData();
            form.append('empleado_id', hiddenEmpleadoId.value);
            form.append('fechas', strDatesProcess);

            open_loading();

            fetch(strUrlSavePlanificaion, {
                method: 'POST',
                headers: {
                    "X-CSRFToken": csrftoken
                },
                body: form
            })
                .then(response => response.json())
                .then( data => {

                    if (data.status) {
                        close_loading();
                        getDiasDisponibles();
                        $(calendarEl).fullCalendar('refetchEvents');
                        alert_nova.showNotification('Registro grabado.', "add_alert", "success");
                    }
                    else {
                        close_loading();
                        getDiasDisponibles();
                        $(calendarEl).fullCalendar('refetchEvents');
                        alert_nova.showNotification('Error al grabar el registro, si persiste comuníquese con IT.', "warning", "danger");
                    }

                })
                .catch((error) => {
                    close_loading();
                    console.error(error);
                    alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
                });

        }
        else {
            alert_nova.showNotification('Excede de la cantidad de dias disponible.', "warning", "danger");
        }

    }
    else {
        alert_nova.showNotification('No posee dias disponibles.', "warning", "danger");
    }

};

const getDiasDisponibles = () => {
    let csrftoken = getCookie('csrftoken');
    const form = new FormData();
    form.append('base', document.getElementById('base').value);
    form.append('empresa', document.getElementById('empresa_id').value);
    form.append('empleado_id', document.getElementById('empleado_id').value);
    open_loading();

    fetch(strUrlGetDiasDisponibles, {
        method: 'POST',
        headers: {
            "X-CSRFToken": csrftoken
        },
        body: form
    })
        .then(response => response.json())
        .then(data => {

            close_loading();
            const divPuesto = document.getElementById('divDiasDisponibles');
            divPuesto.innerHTML = '';
            intTotalDiasDisponibles = 0;
            intTotalDiasOcupados = 0;

            if (data.dias) {

                let strTable = `
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Periodo</th>
                                <th>Dias</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                for (let key in data.dias) {

                    const arrData = data.dias[key];
                    strTable += `
                        <tr>
                            <td>${arrData.Periodo}</td>
                            <td>${arrData.DiasPendientes}</td>
                        </tr>
                    `;
                    intTotalDiasDisponibles += parseFloat(arrData.DiasPendientes);

                }

                strTable += `
                        </tbody>
                    </table>
                `;

                divPuesto.innerHTML = strTable;

            }

            if (data.dias_planificados.length) {
                intTotalDiasOcupados = parseInt(data.dias_planificados[0].dias_planificados);
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
        });
};

if(elementSearchEmpresa) {
    $(elementSearchEmpresa).autocomplete({
        minLength: 1,
        source: (request, response) => {
            const strNomina = document.getElementById('base').value;
            let csrftoken = getCookie('csrftoken');
            const form = new FormData();
            form.append('base', strNomina);
            form.append('empresa', request.term);
            open_loading();

            fetch(strUrlGetEmpresas, {
                method: 'POST',
                headers: {
                    "X-CSRFToken": csrftoken
                },
                body: form
            })
                .then(response => response.json())
                .then(data => {
                    close_loading();
                    response($.map(data.empresas, function (item) {
                        return {
                            label: item.name,
                            value: item.id
                        }
                    }));

                })
                .catch((error) => {
                    close_loading();
                    console.error(error);
                    alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
                });
        },
        select: function (event, ui) {
            event.preventDefault();
            elementSearchEmpresa.value = ui.item.label;
            hiddenEmpresaId.value = ui.item.value;
        }
    })
        .focus(function () {
            elementSearchEmpresa.value = '';
            hiddenEmpresaId.value = '';
            elementSearchEmpleado.value = '';
            hiddenEmpleadoId.value = '';
            intTotalDiasDisponibles  = 0;
            intTotalDiasOcupados  = 0;
            document.getElementById('divPuesto').innerHTML = '';
            document.getElementById('divDiasDisponibles').innerHTML = ``;
        });
}

if(elementSearchEmpleado) {
    $(elementSearchEmpleado).autocomplete({
        minLength: 1,
        source: (request, response) => {

            if (hiddenEmpresaId.value === '') {
                alert_nova.showNotification('Debe seleccionar empresa.', "warning", "danger");
                return false;
            }
            open_loading();
            const strNomina = document.getElementById('base').value;
            let csrftoken = getCookie('csrftoken');
            const form = new FormData();
            form.append('base', strNomina);
            form.append('empresa', hiddenEmpresaId.value);
            form.append('empleado', request.term);

            fetch(strUrlGetEmpleados, {
                method: 'POST',
                headers: {
                    "X-CSRFToken": csrftoken
                },
                body: form
            })
                .then(response => response.json())
                .then(data => {
                    close_loading();
                    response($.map(data.empleados, function (item) {
                        return {
                            label: item.name,
                            value: item.id,
                            Puesto: item.Puesto
                        }
                    }));

                })
                .catch((error) => {
                    close_loading();
                    console.error(error);
                });
        },
        select: function (event, ui) {
            event.preventDefault();
            elementSearchEmpleado.value = ui.item.label;
            hiddenEmpleadoId.value = ui.item.value;
            document.getElementById('divPuesto').innerHTML = `Puesto: ${ui.item.Puesto}`;
            getDiasDisponibles();
        }
    })
        .focus(function () {
            elementSearchEmpleado.value = '';
            hiddenEmpleadoId.value = '';
            intTotalDiasDisponibles  = 0;
            intTotalDiasOcupados  = 0;
            document.getElementById('divPuesto').innerHTML = '';
            document.getElementById('divDiasDisponibles').innerHTML = ``;
        });
}
