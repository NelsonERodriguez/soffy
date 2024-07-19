let table = null;

$(document).ready(function () {
    table = $('#datatablesHorarios').DataTable({
        processing: true,
        serverSide: true,
        pagingType: "full_numbers",
        lengthMenu: [
            [10, 25, 50, 100, 1000],
            [10, 25, 50, 100, "All"]
        ],
        ajax: {
            url: strUrlGetHorarios,
            type: "POST",
            headers: {
                "X-CSRFToken": getCookie('csrftoken'),
            },
        },
        responsive: false,
        language: objLenguajeDataTable,
        columns: [
            {"data": "id", "visible": false},
            {"data": "dia"},
            {"data": "hora_entrada"},
            {"data": "hora_salida"},
            {"defaultContent": ""},
        ],
        columnDefs: [
            {
                targets: 4,
                render: function (data, type, row) {
                    return `<span class="material-icons" rel="tooltip" data-original-title="Ver solicitud" style="cursor:pointer;" onclick="getHorario(${row.id});">visibility</span>&nbsp;&nbsp;&nbsp;`;
                }

            }
        ]
    });

});

const showModal = (boolShow) => {
    resetForm();
    if (boolShow) {
        $(`#modal_horario`).modal('show');
    } else {
        $(`#modal_horario`).modal('hide');
    }
};

const resetForm = () => {
    if (document.getElementById('id')) document.getElementById('id').remove();
    document.getElementById('dia').value = 1;
    document.getElementById('hora_entrada').value = '';
    document.getElementById('hora_salida').value = '';
    document.getElementById('hora_almuerzo').value = '';
};

const getHorario = (intID) => {
    const form = new FormData();
    form.append('id', intID);
    const objInit = {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: form
    };
    open_loading();
    fetch(strUrlGetHorario, objInit)
        .then(response => response.json())
        .then(data => {
            close_loading();
            if (data.status) {
                showModal(true);
                const input = document.createElement('input');
                input.name = 'id';
                input.id = 'id';
                input.type = 'hidden';
                input.value = intID;
                document.getElementById('formHorario').appendChild(input);

                document.getElementById('id').value = data.horario.id;
                document.getElementById('dia').value = data.horario.dias_semana_id;
                document.getElementById('hora_entrada').value = data.horario.hora_entrada;
                document.getElementById('hora_salida').value = data.horario.hora_salida;
                document.getElementById('hora_almuerzo').value = data.horario.hora_almuerzo ?? "";
            } else {
                alert_nova.showNotification(data.msg, "warning", "danger");
            }
        })
        .catch(error => {
            close_loading();
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            console.error('Error fetching data:', error);
        });
};

const saveHorario = () => {
    const form = new FormData(document.getElementById('formHorario'));
    const objInit = {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: form
    };

    open_loading();
    fetch(strUrlSaveHorario, objInit)
        .then(response => response.json())
        .then(data => {
            close_loading();
            if (data.status) {
                alert_nova.showNotification(data.msg, "add_alert", "success");
                showModal(false);
                table.ajax.reload();
            } else {
                alert_nova.showNotification(data.msg, "warning", "danger");
            }
        })
        .catch(error => {
            close_loading();
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            console.error('Error fetching data:', error);
        });
};
