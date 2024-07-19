let table = null;

$(document).ready(function () {
    table = $('#datatablesTipos').DataTable({
        processing: true,
        serverSide: true,
        pagingType: "full_numbers",
        lengthMenu: [
            [10, 25, 50, 100, 1000],
            [10, 25, 50, 100, "All"]
        ],
        ajax: {
            url: strUrlGetTipos,
            type: "POST",
            headers: {
                "X-CSRFToken": getCookie('csrftoken'),
            },
        },
        responsive: true,
        language: objLenguajeDataTable,
        columns: [
            {"data": "id", "visible": false},
            {"data": "nombre"},
            {"data": "dias_permitidos"},
            {"data": "activo"},
            {"defaultContent": ""},
        ],
        columnDefs: [
            {
                targets: 4,
                render: function (data, type, row) {
                    return `
                        <button class="btn btn-outline-primary" type="button" onclick="getTipo(${row.id});">
                            <span class="material-icons">border_color</span>
                        </button>
                    `;
                }

            }
        ]
    });

});

const showModal = (boolShow) => {
    resetForm();
    if (boolShow) {
        $(`#modal_tipo`).modal('show');
    } else {
        $(`#modal_tipo`).modal('hide');
    }
};

const resetForm = () => {
    if (document.getElementById('id')) document.getElementById('id').remove();
    if (typeof dias_permitidos === 'object') dias_permitidos.value = '1';
    if (typeof nombre === 'object') nombre.value = '';
    if (typeof activo === 'object') activo.checked = true;
};

const getTipo = (intID) => {
    const form = new FormData();
    form.append('id', intID);
    const objInit = {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: form
    };
    open_loading();
    fetch(strUrlGetTipo, objInit)
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
                document.getElementById('formTipo').appendChild(input);

                document.getElementById('id').value = data.tipo.id;
                document.getElementById('nombre').value = data.tipo.nombre;
                document.getElementById('dias_permitidos').value = data.tipo.dias_permitidos;
                document.getElementById('activo').checked = data.tipo.activo;
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

const saveTipo = () => {
    const form = new FormData(document.getElementById('formTipo'));
    const objInit = {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: form
    };

    open_loading();
    fetch(strUrlSaveTipo, objInit)
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
