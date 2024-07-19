$(document).ready(function () {
    table = $('#tablePermisos').DataTable({
        pagingType: "full_numbers",
        lengthMenu: [
            [10, 25, 50, 100, 1000],
            [10, 25, 50, 100, "All"]
        ],
        language: objLenguajeDataTable,
    });
});
const openDialog = (intID) => {
    document.getElementById('observacion').value = '';
    document.getElementById('permiso_id').value = intID;
    $("#modalPermiso").modal('show');
};

const aprobarSolicitud = async (intID) => {

    const form = new FormData();
    form.append('permiso_id', intID);
    const objInit = {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: form
    };
    open_loading();

    const objOptions = {
        boolShowSuccessAlert: true,
        boolShowErrorAlert: true
    };
    await coreFetch(strAprobarPermiso, objInit, () => {
        close_loading();
        window.location.reload();
    }, objOptions);
};

const rechazarSolicitud = async () => {
    const form = new FormData();
    form.append('permiso_id', document.getElementById('permiso_id').value);
    form.append('motivo_rechazo', document.getElementById('observacion').value);
    const objInit = {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: form
    };
    open_loading();
    const drawSolicitud = () => {
        close_loading();
        window.location.reload();
    };
    const objOptions = {
        boolShowSuccessAlert: true,
        boolShowErrorAlert: true
    };
    await coreFetch(strRechazarPermiso, objInit, drawSolicitud, objOptions);
};
