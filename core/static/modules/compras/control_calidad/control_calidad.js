(function () {
    window.objSolicitud = document.getElementById('solicitud_id');
    window.objCalidad = document.getElementById('calidad');
    window.objCantidad = document.getElementById('cantidad');
    window.objProductoCorrecto = document.getElementById('producto_correcto');
    window.objPrecioPactado = document.getElementById('precio_pactado');
    window.objFechaEntrega = document.getElementById('fecha_entrega');
    window.objObservacion = document.getElementById('observacion');

    window.getSolicitudes = () => {

        open_loading();
        let csrftoken = getCookie('csrftoken');
        const formElement = document.getElementById('frmFiltros')
        const form = new FormData(formElement);

        fetch(strUrlGetSolicitudes, {
            method: 'POST',
            headers: {
                "X-CSRFToken": csrftoken
            },
            body: form
        })
            .then(response => response.json())
            .then(data => {
                close_loading();

                let strTbody = '';

                for (let key in data.solicitudes) {
                    const solicitud = data.solicitudes[key];
                    strTbody += `<tr>
                                    <td>${solicitud.id}</td>
                                    <td>${solicitud.no_documento}</td>
                                    <td>${solicitud.proveedor}</td>
                                    <td>${solicitud.user_name}</td>
                                    <td>${solicitud.fecha_formateada}</td>
                                    <td>${solicitud.observacion.substring(0, 40)}</td>
                                    <td>
                                        <a class="fas fa-edit fa-lg text-primary" style="cursor: pointer;" onclick="getDialog(${solicitud.id});"></a>
                                        <button type="button" class="btn btn-primary btn-link btn-just-icon" rel="tooltip" data-original-title="Imprimir orden de compra" style="cursor:pointer;" onclick="imprimir_orden(${solicitud.id});">
                                            <span class="material-icons">print</span>
                                        </button>
                                    </td>
                                </tr>`;
                }

                document.getElementById('divSolicitudes').innerHTML = `
                        <table id="tblSolicitudes" class="table table-bordered">
                            <thead>
                            <tr>
                                <th>Solicitud ID</th>
                                <th>Orden No</th>
                                <th>Proveedor</th>
                                <th>Usuario</th>
                                <th>Fecha</th>
                                <th>Observación</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            ${strTbody}
                            </tbody>
                        </table>`;

                $("#tblSolicitudes").DataTable({
                    "pagingType": "full_numbers",
                    "lengthMenu": [
                        [10, 25, 50, -1],
                        [10, 25, 50, "Todos"]
                    ],
                    responsive: false,
                    language: objLenguajeDataTable
                });

            })
            .catch((error) => {
                close_loading();
                console.error(error);
                alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            });

    };

    window.getDialog = (intSolicitudID) => {

        open_loading();
        objSolicitud.value = intSolicitudID;
        let csrftoken = getCookie('csrftoken');
        const formElement = document.getElementById('frm_control_calidad')
        const form = new FormData(formElement);

        fetch(strUrlGetControlCalidad, {
            method: 'POST',
            headers: {
                "X-CSRFToken": csrftoken
            },
            body: form
        })
            .then(response => response.json())
            .then(data => {
                close_loading();

                objCalidad.checked = (data.calidad);
                objCantidad.checked = (data.cantidad);
                objProductoCorrecto.checked = (data.producto_correcto);
                objPrecioPactado.checked = (data.precio_pactado);
                objFechaEntrega.value = data.fecha_entrega;
                objObservacion.value = data.observacion;

            })
            .catch((error) => {
                close_loading();
                console.error(error);
                alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            });

        $('#modal_orden').modal("show");
    };

    window.saveControlCalidad = () => {

        if (document.getElementById("fecha_entrega").value.length == 0) {
            alert_nova.showNotification("La Fecha de Recepción de Producto Servicio es requerida.", "warning", "danger");
            return false;
        }

        open_loading();
        let csrftoken = getCookie('csrftoken');
        const formElement = document.getElementById('frm_control_calidad')
        const form = new FormData(formElement);

        fetch(strUrlSaveControlCalidad, {
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
                    objSolicitud.value = '';
                    objCalidad.checked = false;
                    objCantidad.checked = false;
                    objPrecioPactado.checked = false;
                    objProductoCorrecto.checked = false;
                    objFechaEntrega.value = '';
                    objObservacion.value = '';
                    $('#modal_orden').modal("hide");

                    setTimeout(function () {
                        getSolicitudes();
                    }, 1500);
                }

            })
            .catch((error) => {
                close_loading();
                console.error(error);
                alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            });

    };

    window.imprimir_orden = (solicitud_id) => {
        window.open(strUrlImprimir.replace('1', solicitud_id));
    };

    document.addEventListener("DOMContentLoaded", () => {
        getSolicitudes();
    });

})();
