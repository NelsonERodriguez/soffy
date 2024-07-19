let table = null;

$(document).ready(function () {

    table = $('#datatablesSolicitudes').DataTable({
        processing: true,
        serverSide: true,
        pagingType: "full_numbers",
        lengthMenu: [
            [10, 25, 50, 100, 1000],
            [10, 25, 50, 100, "All"]
        ],
        ajax: {
            url: strUrlGetSolicitudes,
            type: "POST",
            headers: {
                "X-CSRFToken": getCookie('csrftoken'),
            },
        },
        responsive: false,
        language: objLenguajeDataTable,
        columns: [
            {"data": "id", "visible": false},
            {"data": "fecha_solicitud"},
            {"data": "tipo"},
            {"data": "estatus"},
            {"defaultContent": ""},
        ],
        columnDefs: [
            {
                targets: 4,
                render: function (data, type, row) {
                    return `
                        <!--button class="btn btn-outline-primary" type="button" onclick="getSolicitud(${row.id});">
                            <span class="material-icons">border_color</span>
                        </button-->
                    `;
                }

            }
        ]
    });

    $("#tipo").select2({
        placeholder: 'Seleccione un período...',
        language: 'es',
    }).on('select2:select', function (e) {
        const intDiasPermitidos = e.params.data.element.getAttribute('data-dias_permitidos');
        if (typeof fecha_inicio === 'undefined') fecha_inicio = document.getElementById('fecha_inicio');
        if (typeof fecha_fin === 'undefined') fecha_fin = document.getElementById('fecha_fin');
        fecha_inicio.value = '';
        fecha_inicio.removeAttribute('readonly');
        fecha_inicio.setAttribute('data-dias_permitidos', intDiasPermitidos);
        fecha_fin.value = '';
        fecha_fin.removeAttribute('min');
        fecha_fin.removeAttribute('max');
    });

});

const showModal = (boolShow) => {
    resetForm();
    if (boolShow) {
        $(`#modal_tipo`).modal({
            show: true,
            backdrop: 'static',
            keyboard: false,
        });
    } else {
        $(`#modal_tipo`).modal('hide');
    }
};

const resetForm = () => {
    if (document.getElementById('id')) document.getElementById('id').remove();
    if (typeof tipo === 'undefined') tipo = document.getElementById('tipo');
    tipo.value = '';
    if (typeof fecha_inicio === 'undefined') fecha_inicio = document.getElementById('fecha_inicio');
    fecha_inicio.value = '';
    if (typeof fecha_fin === 'undefined') fecha_fin = document.getElementById('fecha_fin');
    fecha_fin.value = '';
    fecha_fin.removeAttribute('min');
    fecha_fin.removeAttribute('max');
    if (typeof fecha_solicitud === 'undefined') fecha_solicitud = document.getElementById('fecha_solicitud');
    fecha_solicitud.value = '';
    if (typeof observacion === 'undefined') observacion = document.getElementById('observacion');
    observacion.value = '';

};

const getSolicitud = async (intID) => {
    const form = new FormData();
    form.append('id', intID);
    const objInit = {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: form
    };
    open_loading();
    const drawSolicitud = (data) => {
        close_loading();
        if (data.status) {
            showModal(true);
            const input = document.createElement('input');
            input.name = 'id';
            input.id = 'id';
            input.type = 'hidden';
            input.value = intID;
            document.getElementById('formSolicitud').appendChild(input);

            document.getElementById('id').value = data.permiso.id;
            document.getElementById('tipo').value = data.permiso.tipo_id;
            document.getElementById('observacion').value = data.permiso.observacion ?? "";
            document.getElementById('fecha_solicitud').value = data.permiso.fecha_solicitud;
            document.getElementById('fecha_inicio').value = data.permiso.fecha_inicio;
            document.getElementById('fecha_fin').value = data.permiso.fecha_fin;
        } else {
            alert_nova.showNotification(data.msg, "warning", "danger");
        }
    };
    const objOptions = {
        boolShowSuccessAlert: false,
        boolShowErrorAlert: true
    };
    await coreFetch(strUrlGetSolicitud, objInit, drawSolicitud, objOptions);
};

const saveSolicitud = () => {
    const form = new FormData(document.getElementById('formSolicitud'));
    const objInit = {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: form
    };

    open_loading();
    fetch(strUrlSaveSolicitud, objInit)
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


document.addEventListener('DOMContentLoaded', () => {
    if (typeof fecha_inicio === 'undefined') fecha_inicio = document.getElementById('fecha_inicio');
    if (typeof fecha_fin === 'undefined') fecha_fin = document.getElementById('fecha_fin');

    fecha_inicio.addEventListener('change', (e) => {
        const day = new Date(e.target.value).getUTCDay();
        if ([6, 0].includes(day)) {
            e.target.value = '';
            alert_nova.showNotification('No puede seleccionar fines de semana.', "warning", "danger");
            return false;
        }
        const intDiasPermitidos = e.target.getAttribute('data-dias_permitidos');
        const strFechaInicio = e.target.value;
        if (strFechaInicio !== '') {
            const fechaInicio = new Date(strFechaInicio);
            let fechaMaxima = new Date(fechaInicio);
            let diasAgregados = 1;

            while (diasAgregados < intDiasPermitidos) {
                fechaMaxima.setDate(fechaMaxima.getDate() + 1);
                if (fechaMaxima.getDay() === 0 || fechaMaxima.getDay() === 6) {
                    fechaMaxima.setDate(fechaMaxima.getDate() + 1);
                } else {
                    diasAgregados++;
                }
            }

            fecha_fin.removeAttribute('readonly');
            fecha_fin.setAttribute('min', fechaInicio.toISOString().slice(0, 16));
            fecha_fin.setAttribute('max', fechaMaxima.toISOString().slice(0, 16));
            fecha_fin.value = '';
        } else {
            fecha_inicio.setAttribute('readonly', 'readonly');
        }
    });

    fecha_fin.addEventListener('change', (e) => {
        const day = new Date(e.target.value).getUTCDay();
        if ([6, 0].includes(day)) {
            e.target.value = '';
            alert_nova.showNotification('No puede seleccionar fines de semana.', "warning", "danger");
            return false;
        }
    });

});
