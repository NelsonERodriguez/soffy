let objTblListado = null;

document.addEventListener('DOMContentLoaded', function () {
    $("#sltDepartamento").select2();
    $("#sltEmpleado").select2();

    objTblListado = $('#tblPermisos').DataTable({
        data: [],
        processing: true,
        responsive: false,
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "Todos"]
        ],
        columns: [

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
            {
                "defaultContent": '&nbsp;',
                orderable: false,
                "render": function (data, type, row) {
                    return `<button type="button" class="btn btn-sm btn-outline-primary" href="#" onclick="fntImprimir(this);"
                                        data-id="${row.id}" rel="tooltip" title="Imprimir Hoja" position="right">
                                        <i class="fas fa-print"></i>
                                    </button>`;
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

const fntGetEvents = async () => {
    const objFormData = new FormData();
    let objDepartamento = document.getElementById("sltDepartamento");

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    if (objDepartamento) objFormData.append('strDepartamento', objDepartamento.value);

    fntCleanTable();

    const objInit = {
        method: 'POST',
        body: objFormData
    };
    const objOptions = {
        boolShowSuccessAlert: false,
        boolShowErrorAlert: false
    };

    const drawTable = async (data) => {
        objTblListado.rows.add(data.data).draw();
        objTblListado.responsive.recalc();
        objTblListado.columns.adjust();

        $('[rel="tooltip"]').tooltip();

        close_loading();
    };

    open_loading();
    await coreFetch(strUrlGetListado, objInit, drawTable, objOptions);
};

const fntCleanTable = () => {
    if (objTblListado) {
        $(".ui-tooltip").remove();
        objTblListado.clear().draw();
    }
}

const fntChangeDepto = async () => {
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
