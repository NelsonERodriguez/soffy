const fntCleanTable = () => {
    if (objTblListado) {
        $(".ui-tooltip").remove();
        objTblListado.clear().draw();
    }
}

const getVacaciones = () => {
    const objFormData = new FormData();
    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    objFormData.append('strDepartamento', '0');
    objFormData.append('strEmpleado', '0');

    fntCleanTable();

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    coreFetch(strUrlGetListado, objInit, (data) => {
        objTblListado.rows.add(data.data).draw();
        objTblListado.responsive.recalc();
        objTblListado.columns.adjust();

        $('[rel="tooltip"]').tooltip();

    }, {
        boolShowSuccessAlert: false,
        boolShowErrorAlert: false
    });
};

const goInterfaces = (intId) => {
    window.location.href = `${strUrlVacacionesRrhh}?vacacion_id=${intId}`;
};

document.addEventListener('DOMContentLoaded', function () {
    objTblListado = $('#tblVacaciones').DataTable({
        data: [],
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "Todos"]
        ],
        columns: [

            {data: 'no_empleado'},
            {data: 'nombre_completo'},
            {data: 'nombre_depto'},
            {data: 'estatus'},
            {
                data: 'fecha_inicio',
                "render": function (data, type, row) {
                    if (type === 'display' || type === 'filter') {
                        let date = new Date(data);
                        return dateGTFormat.format(date);
                    }
                    return data;
                }
            },
            {
                data: 'fecha_fin',
                "render": function (data, type, row) {
                    if (type === 'display' || type === 'filter') {
                        let date = new Date(data);
                        return dateGTFormat.format(date);
                    }
                    return data;
                }
            },
            {data: 'dias_solicitados'},
            {
                "defaultContent": '&nbsp;',
                orderable: false,
                "render": function (data, type, row) {
                    return `<button type="button" class="btn btn-sm btn-outline-info" href="#" onclick="goInterfaces(${row.id});"
                                data-id="${row.id}" rel="tooltip" title="Ver" position="right">
                                <span class="material-icons">visibility</span>
                            </button>`;
                }

            }
        ],
        order: [[1, 'asc']],
        language: objLenguajeDataTable,
    });

    getVacaciones();
});