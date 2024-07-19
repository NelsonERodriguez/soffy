$(document).ready(function() {
    $('#datatables').DataTable({
        "order": [],
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "All"]
        ],
    });
});

const reOpenWeek = async (intWeekID) => {
    let formData = new FormData(),
        csrfToken = getCookie('csrftoken');
    formData.append('csrfmiddlewaretoken', csrfToken);
    formData.append('week', intWeekID);
    const response = await fetch(urlReOpen, {body: formData, method: 'POST'});
    const data = await response.json();

    if(data.status) {
        alert_nova.showNotification("Semana abierta correctamente, espera por favor.", "add_alert", "success");
        setTimeout(() => {
            location.reload();
        }, 3000);
    }
    else {
        console.error(data.message);
        alert_nova.showNotification("No se pudo abrir esta semana, contacta con IT.", "warning", "danger");
    }
};