(function () {
    window.table = null;
    window.objFechaInicio = document.getElementById('fecha_inicio');
    window.objFechaFin = document.getElementById('fecha_fin');
    window.arrSolicitud = [];

    window.setValueForm = (solicitudId) => {
        const solicitud = arrSolicitud.find((revision) => revision.solicitudId === solicitudId);
        document.getElementById('solicitud_id').value = solicitud.solicitudId;
        document.getElementById('observacion').value = solicitud.observacionRevisada;
        document.getElementById('revisada').checked = solicitud.revisada;
        document.getElementById('fecha_revision').innerText = solicitud.fechaRevisada;
        showModal(true);
    };

    window.showModal = (boolShow) => {
        $(`#modal_directa_revisada`).modal(boolShow ? 'show' : 'hide');
    };

    window.saveRevisada = () => {
        const form = new FormData(document.getElementById("form_sol_directa"))

        open_loading();
        fetch(strUrlSaveRevision, {
            method: 'POST',
            body: form
        })
            .then(response => response.json())
            .then((data) => {
                if (data.status) {
                    table.ajax.reload();
                    showModal(false);
                    alert_nova.showNotification(data.msg, "add_alert", "success");
                } else {
                    alert_nova.showNotification(data.msg, "warning", "danger");
                }
                close_loading();
            })
            .catch((error) => {
                close_loading();
                console.error(error);
                alert_nova.showNotification('Error al generar la orden, comuníquese con IT.', "warning", "danger");
            });
    };

    $(document).ready(function () {
        table = $('#datatablesSolicitudes').DataTable({
            processing: true,
            ordering: false,
            serverSide: true,
            pagingType: "full_numbers",
            lengthMenu: [
                [10, 25, 50, 100, 1000],
                [10, 25, 50, 100, "All"]
            ],
            ajax: {
                url: strUrlSolicitudes,
                type: "POST",
                headers: {
                    "X-CSRFToken": getCookie('csrftoken'),
                },
                data: function (d) {
                    d.fecha_inicio = document.getElementById('fecha_inicio').value;
                    d.fecha_fin = document.getElementById('fecha_fin').value;
                },
            },
            language: objLenguajeDataTable,
            columns: [
                {"data": "id",},
                {"data": "empresaNombre"},
                {"data": "usuarioNombre"},
                {"data": "departamentoNombre"},
                {"data": "observacion"},
                {"data": "fecha"},
                {"data": "totalOrden"},
                {"defaultContent": ""},
            ],
            columnDefs: [
                {
                    targets: 7,
                    render: function (data, type, row, index) {
                        if (index.row === 0) {
                            arrSolicitud = [];
                        }
                        const solicitudId = row.id ?? "";
                        const observacionRevisada = row.observacionRevisada ?? "";
                        const revisada = row.revisada ?? false;
                        arrSolicitud.push({
                            solicitudId: solicitudId,
                            observacionRevisada: observacionRevisada,
                            revisada: revisada,
                            fechaRevisada: row.fechaRevisada,
                        });
                        if (row.fechaRevisada) {
                            return `<span class="material-icons" style="cursor:pointer;" onclick="setValueForm(${solicitudId});">visibility</span>&nbsp;&nbsp;&nbsp;
                                <span class="material-icons" rel="tooltip" style="cursor:pointer;" onclick="window.open(strUrlImpresion.replace('0', ${solicitudId}));">print</span>`;
                        } else {
                            return `<span class="material-icons" style="cursor:pointer;" onclick="setValueForm(${solicitudId});">edit</span>&nbsp;&nbsp;&nbsp;
                                <span class="material-icons" rel="tooltip" style="cursor:pointer;" onclick="window.open(strUrlImpresion.replace('0', ${solicitudId}));">print</span>`;
                        }
                    }
                }
            ]
        });

        objFechaInicio.addEventListener("change", () => {
            if (objFechaInicio.value !== "" && objFechaFin.value !== "") table.ajax.reload();
        });

        objFechaFin.addEventListener("change", () => {
            if (objFechaInicio.value !== "" && objFechaFin.value !== "") table.ajax.reload();
        });
    });

})();
