const calendarEl = document.getElementById('divCalendario');
const calendar = $(calendarEl);
//document.addEventListener('DOMContentLoaded', function() {
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

        select: function (start, end) {

            const objFechas = {
                "start": start.format(),
                //"end": end.subtract(1, "days").format()
                "end": end.format()
            }
            dialogCamion(objFechas);

        },
        editable: false,
        eventLimit: true, // allow "more" link when too many events
        eventSources: [

            // your event source
            {
                url: strUrlGetPlanificacion,
                method: 'POST',
                data: {
                    csrfmiddlewaretoken: getCookie('csrftoken'),

                },
                failure: function () {
                    alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
                },
                color: '#8e24aa',   // a non-ajax option
                className: 'cursorPointer'
                //textColor: 'black' // a non-ajax option
            }

            // any other sources...

        ],
        eventClick: function(calEvent, jsEvent, view) {
            dialogConfirm(deletePlanificacion, calEvent.id, '¿Desea eliminar?', '¡No podrás revertir esto!', 'error');
        }
    });
//});

const deletePlanificacion = (id) => {
    open_loading();
    let csrftoken = getCookie('csrftoken');
    strUrl = strUrlDeletePlanificacion.replace(0, id);

    fetch(strUrl, {
        method: 'POST',
        headers: {
            "X-CSRFToken": csrftoken
        }
    })
        .then(response => response.json())
        .then(data => {
            close_loading();

            if (data.status) {
                calendar.fullCalendar( 'refetchEvents' );
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
        });
};

const dialogCamion = (objFechas) => {
    $('#modal_camion').modal("show");
    document.getElementById('fecha_inicio').value = objFechas.start;
    document.getElementById('fecha_fin').value = objFechas.end;
};

const savePlanificacion = () => {
    const intNoCamion = document.getElementById('camion_id').value;
    const strFechaInicio = document.getElementById('fecha_inicio').value;
    const strFechaFin = document.getElementById('fecha_fin').value;

    open_loading();
    let csrftoken = getCookie('csrftoken');
    const form = new FormData();
    form.append('camion', intNoCamion);
    form.append('fecha_inicio', strFechaInicio);
    form.append('fecha_fin', strFechaFin);

    fetch(strUrlSavePlanificacion, {
        method: 'POST',
        headers: {
            "X-CSRFToken": csrftoken
        },
        body: form
    })
        .then(response => response.json())
        .then(data => {
            close_loading();

            if (data.status) {
                alert_nova.showNotification('Registros grabados.', "add_alert", "success");
                $('#modal_camion').modal("hide");
                document.getElementById('fecha_inicio').value = '';
                document.getElementById('fecha_fin').value = '';
                document.getElementById('camion_id').value = '';
                document.getElementById('camion').value = '';
                calendar.fullCalendar( 'refetchEvents' );
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
        });

};

const elementSearchCamion = document.getElementById('camion');
const elementHiddenCamion = document.getElementById('camion_id');
if(elementSearchCamion) {
    $(elementSearchCamion).autocomplete({
        minLength: 1,
        source: (request, response) => {

            open_loading();
            let csrftoken = getCookie('csrftoken');
            const form = new FormData();
            form.append('camion', request.term);

            fetch(strUrlGetCamiones, {
                method: 'POST',
                headers: {
                    "X-CSRFToken": csrftoken
                },
                body: form
            })
                .then(response => response.json())
                .then(data => {
                    close_loading();
                    response($.map(data.camiones, function (item) {
                        return {
                            label: item.Descripcion,
                            value: item.NoCamion
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
            elementSearchCamion.value = ui.item.label;
            elementHiddenCamion.value = ui.item.value;
        }
    })
        .focus(function () {
            elementSearchCamion.value = '';
            elementHiddenCamion.value = '';
        });
}
