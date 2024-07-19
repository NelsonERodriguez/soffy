const fntGetEmpresa = async (boolForm = false) => {
    const objFormData = new FormData();

    let strIdNomina = document.getElementById("sltNomina").value,
        objSelectEmpresas = document.getElementById("sltEmpresa");

    if( boolForm ){
        strIdNomina = document.getElementById("nomina").value;
        objSelectEmpresas = document.getElementById("empresa");
    }

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    objSelectEmpresas.innerHTML = "";

    let objAttrs = {
        element: 'option',
        value: '',
    };
    let objOptionDefault = await createElement(objAttrs);
    objOptionDefault.innerText = "Seleccione una empresa...";

    objSelectEmpresas.appendChild(objOptionDefault);

    if (strIdNomina !== "") {
        objFormData.append('strIdNomina', strIdNomina);

        let objInit = {
            method: 'POST',
            body: objFormData
        };

        open_loading();
        await coreFetch(strUrlGetEmpresas, objInit, (data) => {
            let objOptionEmp;
            if (data.data.empresas.length > 0) {
                data.data.empresas.forEach( async function(element) {
                    objAttrs = {
                        element: 'option',
                        value: element.no_empresa,
                    };
                    objOptionEmp = await createElement(objAttrs);
                    objOptionEmp.innerText = element.no_empresa + " - " + element.razon_social;
                    objSelectEmpresas.appendChild(objOptionEmp);
                });
            }
            close_loading();
        });
    }
    else{
        alert_nova.showNotification('No ha seleccionado ninguna nómina.', 'warning', 'danger');
    }
};

const fntGetListado = async () => {
    const objFormData = new FormData();

    let strFechaInicial = document.getElementById("txtFechaInicial").value,
        strFechaFinal = document.getElementById("txtFechaFinal").value,
        strNomina = document.getElementById("sltNomina").value,
        strEmpresa = document.getElementById("sltEmpresa").value;

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    if (strFechaInicial === "") {
        alert_nova.showNotification('La Fecha Inicial es requerida.', 'warning', 'danger');
        return false;
    }

    if (strFechaFinal === "") {
        alert_nova.showNotification('La Fecha Final es requerida.', 'warning', 'danger');
        return false;
    }

    if (strNomina === "") {
        alert_nova.showNotification('La Nomina es requerida.', 'warning', 'danger');
        return false;
    }

    objFormData.append('strFechaInicial', strFechaInicial);
    objFormData.append('strFechaFinal', strFechaFinal);
    objFormData.append('strNomina', strNomina);
    objFormData.append('strEmpresa', strEmpresa);

    fntCleanTable();

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetListado, objInit, (data) => {
        objTblConceptos.rows.add(data.data).draw();
        objTblConceptos.responsive.recalc();
        objTblConceptos.columns.adjust();

        close_loading();
    });
};

const fntCleanTable = () => {
    if (objTblConceptos) {
        objTblConceptos.clear().draw();
    }
}

$(function () {
    $("#sltEmpresa").select2();

    objTblConceptos = $('#tblConceptos').DataTable({
        data: [],
        processing: true,
        responsive: true,
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "Todos"]
        ],
        columns: [
            {data: 'noempleadosconceptos'},
            {data: 'noempleado'},
            {data: 'nombre_completo'},
            {data: 'noconcepto__descripcion'},
            {data: 'cantidad'},
            {
                data: 'fechainicio',
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        let date = new Date(data);
                        return dateGTFormat.format(date);
                    }
                    return data;
                }
            },
            {
                data: 'fechafin',
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        let date = new Date(data);
                        return dateGTFormat.format(date);
                    }
                    return data;
                }
            },
            {data: 'numerocheque'},
            {
                data: 'monto',
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        return numberGTFormat.format(data);
                    }
                    return data;
                }
            },
            {
                data: 'fechapago'
                ,
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        let date = new Date(data);
                        return dateGTFormat.format(date);
                    }
                    return data;
                }
            },
            {data: 'observaciones'},
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
});