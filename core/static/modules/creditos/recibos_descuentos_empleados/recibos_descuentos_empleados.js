const fntGetData = () => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();
    let strPeriodo = document.getElementById("sltPeriodo").value;

    if( strPeriodo.trim().length === 0 ){
        alert_nova.showNotification("Tiene que seleccionar el período.", "warning", "danger");
        return false;
    }

    objForm.append('strPeriodo', strPeriodo);

    open_loading();
    fetch(urlGetData, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
    .then(response => response.json())
    .then( async (data) => {
        close_loading();
        objTable.clear().draw();
        objGenerados.clear().draw();

        if (data.status) {
            $("#divGenerados").hide();
            $("#divPrevisualizacion").show();

            objTable.rows.add(data.data.data).draw();

            if( data.data.data.length > 0 ){
                $("#btnGenerar").attr("disabled",false);
            }
            else{
                $("#btnGenerar").attr("disabled",true);
            }

            alert_nova.showNotification(data.msj, "add_alert", "success");
        }
        else{
            $("#divGenerados").hide();
            $("#divPrevisualizacion").hide();

            alert_nova.showNotification(data.msj, "warning", "danger");
        }
    })
    .catch((error) => {
        console.error(error);
        alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
        close_loading();
    });
};

const fntGenerar = () => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();
    let strPeriodo = document.getElementById("sltPeriodo").value,
        strFecha = document.getElementById("txtFechaRecibos").value;

    if( strPeriodo.trim().length === 0 ){
        alert_nova.showNotification("Tiene que seleccionar el período.", "warning", "danger");
        return false;
    }

    objForm.append('strPeriodo', strPeriodo);
    objForm.append('strFechaRec', strFecha);

    open_loading();
    fetch(urlGenerar, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
    .then(response => response.json())
    .then( async (data) => {
        close_loading();
        objTable.clear().draw();
        objGenerados.clear().draw();

        $("#divPrevisualizacion").hide();
        $("#divGenerados").show();
        if (data.status) {
            objGenerados.rows.add(data.data.data).draw();

            $("#btnGenerar").attr("disabled", true);

            alert_nova.showNotification(data.msj, "add_alert", "success");
        }
        else{
            alert_nova.showNotification(data.msj, "warning", "danger");
        }
    })
    .catch((error) => {
        console.error(error);
        alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
        close_loading();
    });
};

document.addEventListener("DOMContentLoaded", () => {
    $("#sltPeriodo").select2({
        placeholder: 'Seleccione un período...',
        language: 'es',
    }).on('select2:select', function() {
        fntGetData();
    });

    objTable = $('#tblRecibos').DataTable({
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "Todos"]
        ],
        data:[],
        info: false,
        ordering: false,
        //paging: true,
        processing: true,
        retrieve: true,
        scrollX: false,
        scrollY: false,
        columns: [
            { data: 'NoEmpresa' },
            { data: 'Empresa' },
            { data: 'NoRecibo' },
            {
                data: 'Fecha_Recibo',
                render: function(data, type, row){
                    let date = new Date(data + ' 00:00:00');
                    let fechaGt = dateGTFormat.format(date);
                    return fechaGt;
                },
            },
            { data: 'CodigoEmpleado' },
            { data: 'CodigoCliente' },
            { data: 'Cliente' },
            { data: 'Valor_Rec' },
            { data: 'NoFactura' },
            {
                data: 'Fecha_Factura',
                render: function(data, type, row){
                    let date = new Date(data + ' 00:00:00');
                    let fechaGt = dateGTFormat.format(date);
                    return fechaGt;
                },
            },
            { data: 'Total_Fac' },
            { data: 'Abono' },
            { data: 'Saldo' },
        ],
        columnDefs: [
            { targets: [0, 1, 4, 5, 6], visible: false },
            { targets: [7, 10, 11, 12], class: 'text-right' },
            { targets: [2, 3, 8, 9], class: 'text-left' }
        ],
        dom: 'lBfrtip',
        /*dom:"<'row'<'col-sm-12'B><'col-sm-12'f>>" +
            "<'row'<'col-sm-12'tr>>",*/
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fa fa-file-excel-o"></i> Excel',
                className: 'btn-flat btn-aquadeep',
            }
        ],
        language: objLenguajeDataTable,
        drawCallback: function ( settings ) {
            var api  = this.api();
            var rows = api.rows( { page: 'current' } ).nodes();
            var last = null;

            api.column(1, {page:'current'} ).data().each( function ( group, i ) {
                if ( last !== group ) {
                    let rowData = api.row(i).data();
                    let strGroup = (group === null) ? "no asignada" : group;

                    $(rows).eq( i ).before(
                        '<tr class="group"><td colspan="8" style="background-color:#26A197" >'
                        + '<CENTER>'+'Empresa ' + strGroup +'<CENTER\>'
                        +'</td></tr>'
                    );

                    last = group;
                }
            });

            api.column(6, {page:'current'} ).data().each( function ( group, i ) {
                if ( last !== group ) {
                    let rowData = api.row(i).data();
                    let strGroup = (group === null) ? "no asignada" : group;

                    $(rows).eq( i ).before(
                        '<tr class="group"><td colspan="8" style="background-color:#2CB8AD" >'
                        + '<CENTER>'+'Cliente ' + rowData["CodigoCliente"] + " - " + strGroup + ' (' + rowData["CodigoEmpleado"] +')<CENTER\>'
                        +'</td></tr>'
                    );

                    last = group;
                }
            });

        }
    });

    objGenerados = $('#tblGenerados').DataTable({
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "Todos"]
        ],
        data:[],
        info: false,
        ordering: false,
        //paging: true,
        processing: true,
        retrieve: true,
        scrollX: false,
        scrollY: false,
        columns: [
            { data: 'Empresa' },
            { data: 'NoRecibo' },
            {
                data: 'Fecha',
                render: function(data, type, row){
                    let date = new Date(data + ' 00:00:00');
                    let fechaGt = dateGTFormat.format(date);
                    return fechaGt;
                },
            },
            { data: 'CodigoCliente' },
            { data: 'Cliente' },
            { data: 'Valor' },
        ],
        columnDefs: [
            { targets: [1, 5], class: 'text-right' },
            { targets: [0, 2, 3, 4], class: 'text-left' }
        ],
        dom: 'lBfrtip',
        /*dom:"<'row'<'col-sm-12'B><'col-sm-12'f>>" +
            "<'row'<'col-sm-12'tr>>",*/
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fa fa-file-excel-o"></i> Excel',
                className: 'btn-flat btn-aquadeep',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                }
            }
        ],
        language: objLenguajeDataTable
    });
});