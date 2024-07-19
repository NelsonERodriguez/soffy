let objVacaciones = [];
let totalDias = 0;
let calendar = null;
document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('divCalendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'es',
        initialView: mobileCheck() ? 'dayGridMonth' : 'multiMonthYear',
        selectable: true,
        events: arrHistoricoVacaciones,
        headerToolbar: {
            start: '',
            center: 'title',
            end: 'today prev next dayGridMonth multiMonthYear',
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            year: 'Año',
        },
        weekends: false,
    });
    calendar.render();
    document.getElementById('btnAprobar').addEventListener('click', () => {
        dialogConfirm(sendAprobar);
    });
    document.getElementById('btnRechazar').addEventListener('click', () => {
        openDialog();
    });
    document.getElementById('btnRechazado').addEventListener('click', () => {
        dialogConfirm(sendRechazar);
    });
});

const sendAprobar = () => {
    const formData = new FormData();
    formData.append('vacacion_id', document.getElementById('vacacion_id').value);

    const objInit = {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: formData
    };

    open_loading();
    fetch(strUrlAprobado, objInit)
        .then(response => response.json())
        .then(data => {
            close_loading();
            if (data.status) {
                alert_nova.showNotification(data.msg, "add_alert", "success");
                window.location.href = strUrlVacaciones;
            } else {
                alert_nova.showNotification(data.msg, "warning", "danger");
            }
        })
        .catch(error => {
            close_loading();
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            console.error(error);
        });
};

const openDialog = () => {
    document.getElementById('observacion').value = '';
    $("#modalVacacion").modal('show');
};

const sendRechazar = () => {
    const formData = new FormData();
    formData.append('vacacion_id', document.getElementById('vacacion_id').value);
    formData.append('motivo_rechazo', document.getElementById('observacion').value);

    const objInit = {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: formData
    };

    open_loading();
    fetch(strUrlRechazo, objInit)
        .then(response => response.json())
        .then(data => {
            close_loading();
            if (data.status) {
                alert_nova.showNotification(data.msg, "add_alert", "success");
                window.location.href = strUrlVacaciones;
            } else {
                alert_nova.showNotification(data.msg, "warning", "danger");
            }
        })
        .catch(error => {
            close_loading();
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            console.error(error);
        });
};
