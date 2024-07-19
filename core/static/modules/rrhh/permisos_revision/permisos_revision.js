let objTblListado = null;

const fntGetEvents = async () => {
    const objFormData = new FormData();
    let strDepartamento = document.getElementById("sltDepartamento").value,
        strEmpleado = document.getElementById("sltEmpleado").value,
        boolChecked = document.getElementById("chkFinalizadas").checked;

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    objFormData.append('strDepartamento', strDepartamento);
    objFormData.append('strEmpleado', strEmpleado);
    objFormData.append('boolFinalizadas', (boolChecked) ? "1" : "0");

    fntCleanTable();

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetListado, objInit, (data) => {
        objTblListado.rows.add(data.permisos).draw();
        objTblListado.responsive.recalc();
        objTblListado.columns.adjust();

        $('[rel="tooltip"]').tooltip();

        close_loading();
    }, {boolShowSuccessAlert: false});
};

const fntCleanTable = () => {
    if (objTblListado) {
        $(".ui-tooltip").remove();
        objTblListado.clear().draw();
    }
}

const fntGetEmpleados = async () => {
    const objFormData = new FormData();
    let strDepartamento = document.getElementById("sltDepartamento").value,
        objEmpleado = document.getElementById("sltEmpleado");

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    objEmpleado.innerHTML = "";

    let objAttrs = {
        element: 'option',
        value: '0',
    };
    let objOptionDefault = await createElement(objAttrs);
    objOptionDefault.innerText = "Seleccione un empleado...";

    objEmpleado.appendChild(objOptionDefault);

    objFormData.append('strDepartamento', strDepartamento);

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetEmpleados, objInit, (data) => {
        let objOptionEmp;
        if (data.data.empleados.length > 0) {
            data.data.empleados.forEach(async function (element) {
                objAttrs = {
                    element: 'option',
                    value: element.empleado_id,
                };
                objOptionEmp = await createElement(objAttrs);
                objOptionEmp.innerText = element.no_empleado + " - " + element.nombre_completo;
                objEmpleado.appendChild(objOptionEmp);
            });
        }
        close_loading();
    }, {boolShowSuccessAlert: false});
};

const fntChangeDepto = async () => {
    await fntGetEmpleados();
    await fntGetEvents();
};

const fntImprimir = async (objButton) => {
    let strUrl = strUrlImprimir;
    strUrl = strUrl.replace("/0/", "/" + String(objButton.dataset.id) + "/")

    window.open(strUrl);
    setTimeout(() => {
        fntGetEvents();
    }, 2000)
}

const fntFinalizar = async (objButton) => {
    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    objFormData.append('intId', objButton.dataset.id);

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlFinalizar, objInit, async (data) => {
        await fntGetEvents();
        close_loading();
    });
}

const fntVer = async (objButton) => {
    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    objFormData.append('intId', objButton.dataset.id);

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    document.getElementById('divContentVer').innerHTML = "";

    open_loading();
    await coreFetch(strUrlVer, objInit, (data) => {
        document.getElementById('divContentVer').innerHTML = data.data;

        $("#mdlVer").modal("show");

        let arrHistoricoVacaciones = data.historico_vacaciones;

        let calendarEl = document.getElementById('divCalendar');
        let objCalendar = new FullCalendar.Calendar(calendarEl, {
            locale: 'es',
            height: 800,
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
        setTimeout(() => {
            objCalendar.render();
        }, 200)

        close_loading();
    }, {boolShowSuccessAlert: false});
}

const fntConfirmarRechazar = async (objButton) => {
    window.permiso_id = objButton.dataset.id;
    $("#mdlRechazar").modal("show");
    document.getElementById("txtMotivoRechazo").focus();
}

const fntRechazar = async () => {
    const objFormData = new FormData();
    let strId = window.permiso_id,
        strMotivoRechazo = document.getElementById("txtMotivoRechazo").value;

    if (strMotivoRechazo.trim() === "") {
        alert_nova.showNotification("El motivo del rechazo es obligatorio.", "warning", "danger");
        return false;
    }

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    objFormData.append('permiso_id', strId);
    objFormData.append('motivo_rechazo', strMotivoRechazo);

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlRechazar, objInit, async (data) => {
        $("#mdlRechazar").modal("hide");
        document.getElementById("txtMotivoRechazo").value = "";
        await fntGetEvents();
        close_loading();
    });
}

document.addEventListener('DOMContentLoaded', function () {
    $("#sltDepartamento").select2();
    $("#sltEmpleado").select2();

    objTblListado = $('#tblRevision').DataTable({
        data: [],
        processing: true,
        responsive: false,
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "Todos"]
        ],
        columns: [

            {data: 'no_empleado'},
            {data: 'nombre_completo'},
            {data: 'departamento'},
            {data: 'estatus'},

            {
                data: 'fecha_inicio',
                "render": function (data, type, row) {
                    if (type === 'display' || type === 'filter') {
                        let date = new Date(data);
                        return dateTimeGTFormat.format(date);
                    }
                    return data;
                }
            },
            {
                data: 'fecha_fin',
                "render": function (data, type, row) {
                    if (type === 'display' || type === 'filter') {
                        let date = new Date(data);
                        return dateTimeGTFormat.format(date);
                    }
                    return data;
                }
            },
            {data: 'dias_permitidos'},
            {
                "defaultContent": '&nbsp;',
                orderable: false,
                "render": function (data, type, row) {
                    if (type === 'display') {
                        let strContenido = '';
                        if (row.estatus_id === 5) {
                            strContenido += `
                                <button type="button" class="btn btn-sm btn-outline-primary" href="#" onclick="fntFinalizar(this);"
                                    data-id="${row.id}" rel="tooltip" title="Finalizar Solicitud" >
                                    <i class="fas fa-clipboard-list-check"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-primary" href="#" onclick="fntConfirmarRechazar(this);"
                                    data-id="${row.id}" rel="tooltip" title="Rechazar Solicitud" >
                                    <i class="fas fa-times"></i>
                                </button>
                            `;
                        }
                        return strContenido;
                    }
                    return data;
                }

            },
        ],
        order: [[1, 'asc']],
        dom: 'Blfrtip',
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fa fa-file-excel-o"></i> Excel',
                className: 'btn-flat btn-aquadeep'
            },
        ],
        language: objLenguajeDataTable,
    });

    fntGetEvents();

});
