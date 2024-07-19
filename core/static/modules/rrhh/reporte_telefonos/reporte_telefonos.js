const load = () => {

    objPoliza.clear().draw();
    objReport.clear().draw();
    let filtros = {};

    if ( objFecha.value.trim().length === 0 ) {
        alert_nova.showNotification("Favor ingresar una fecha", "warning", "danger");
        return;
    }

    if ( objFiltro.value.trim().length === 0 ) {
        alert_nova.showNotification("Debe seleccionar un filtro", "warning", "danger");
        return;
    }

    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    formData.append('fecha', objFecha.value);
    formData.append('filtro', objFiltro.value);

    open_loading();
    fetch(`${strUrlGetData}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if( objFiltro.value === "4" ){
            objPoliza.clear().draw();
            objPoliza.rows.add(data.data).draw();
        } else {
            objReport.clear().draw();
            objReport.rows.add(data.data).draw();
        }
        close_loading();
        //window.location.reload();
    })
    .catch(error => {
        close_loading();
        alert_nova.showNotification('Ocurrió un error, contacte con IT', 'warning', 'danger');
        console.error(error)
    });
};

const fntEsValido = () => {
    if( objFecha.value.trim() === "" || objFiltro.value.trim() === "" ){
        return false;
    }
    return true;
}

$(document).ready(function() {

    objReport = $('#reporte').DataTable({
        data:[],
        info: false,
        ordering: false,
        paging: false,
        processing: true,
        retrieve: true,
        scrollX: true,
        columns: [
            { data: 'codigo' },
            {
                data: 'nombre',
                render: function(data, type, row){
                    let strReturn = data === null ? "Libre" : data;
                    return strReturn;
                },
            },
            { data: 'empresa' },
            { data: 'Departamento' },
            {
                data: 'numero',
                class: 'text-center'
            },{
                data: 'facturado' ,
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },{
                data: "cuenta subsidio" ,
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },{
                data: 'subsidio' ,
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },{
                data: 'cuenta descuento' ,
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },{
                data: 'descuento' ,
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },

        ],
        columnDefs: [
            { targets: [2, 3, 6, 8], visible: false },
            { targets: [5, 7, 9], class: 'text-right' },
            { targets: [0, 1], class: 'text-left' }
        ],
        dom:"<'row'<'col-sm-12'B><'col-sm-12'f>>" +
            "<'row'<'col-sm-12'tr>>",
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fa fa-file-excel-o"></i> Excel',
                className: 'btn-flat btn-aquadeep',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 7, 9, 6, 8]
                }
            }
        ],
        language: objLenguajeDataTable,
        drawCallback: function ( settings ) {
            var api  = this.api();
            var rows = api.rows( { page: 'current' } ).nodes();
            var last = null;

            api.column(8, {page:'current'} ).data().each( function ( group, i ) {
                if ( last !== group ) {
                    let rowData = api.row(i).data();
                    let strGroup = (group === null) ? "no asignada" : group;

                    $(rows).eq( i ).before(
                        '<tr class="group"><td colspan="8" style="background-color:#26A197" >'
                        + '<CENTER>'+'Cuenta Descuento ' + strGroup +'<CENTER\>'
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
                        + '<CENTER>'+'Cuenta Subsidio ' + strGroup +'<CENTER\>'
                        +'</td></tr>'
                    );

                    last = group;
                }
            });

            api.column(2, {page:'current'} ).data().each( function ( group, i ) {
                if ( last !== group ) {
                    var rowData = api.row(i).data();
                    let strGroup = (group === null) ? "no asignada" : group;

                    $(rows).eq( i ).before(
                        '<tr class="group"><td colspan="8" style="background-color:#32CEC1" >'
                        + '<CENTER>'+'Empresa ' + strGroup +'<CENTER\>'
                        +'</td></tr>'
                    );

                    last = group;
                }
            });

            api.column(3, {page:'current'} ).data().each( function ( group, i ) {
                if ( last !== group ) {
                    var rowData = api.row(i).data();
                    let strGroup = (group === null) ? "no asignado" : group;

                    $(rows).eq( i ).before(
                        '<tr class="group"><td colspan="8" style="background-color:#49D3C8">'
                        + '<center>' + 'Departamento ' + strGroup + '<center\>'
                        +'</td></tr>'
                    );
                    last = group;
                }
            });
        }
    });

    objPoliza = $('#resumen').DataTable({
        data:[],
        info: false,
        ordering: false,
        paging: false,
        processing: true,
        retrieve: true,
        scrollX: true,
        columns: [
            { data: 'tipo' },
            { data: 'cuentas' },
            {
                data: 'SAT' ,
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },{
                data: "Colaboradores" ,
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },{
                data: 'Sin Subsidio' ,
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },{
                data: 'Subsidio' ,
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },{
                data: 'Total' ,
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },

        ],
        columnDefs: [
            { targets: [0], visible: false },
            { targets: [2, 3, 4, 5, 6], class: 'text-right' },
            { targets: [1], class: 'text-left' }
        ],
        dom:"<'row'<'col-sm-12'B><'col-sm-12'f>>" +
            "<'row'<'col-sm-12'tr>>",
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fa fa-file-excel-o"></i> Excel',
                className: 'btn-flat btn-aquadeep',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6]
                }
            }
        ],
        language: objLenguajeDataTable,

        rowGroup: {

            startRender: function (rows, group) {
                return $('<tr/>').append( '<td colspan="6" class="text-center">Cuenta ' + (group.length > 0 ? group : 'Libre') + '</td></tr>' );
            },
            endRender: function ( rows, group ) {

                var SAT = rows.data().pluck('SAT').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                var Colaboradores = rows.data().pluck('Colaboradores').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                var Sin = rows.data().pluck('Sin Subsidio').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                var Subsidio = rows.data().pluck('Subsidio').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                var suma = rows.data().pluck('Total').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                return $('<tr/>')
                .append( '<td colspan="1" class="text-left" headers="name">Total General</td>' )
                .append( '<td class="text-right">' + $.fn.dataTable.render.number(',', '.', 2).display( SAT ) + '</td></tr>')
                .append( '<td class="text-right">' + $.fn.dataTable.render.number(',', '.', 2).display( Colaboradores ) + '</td></tr>')
                .append( '<td class="text-right">' + $.fn.dataTable.render.number(',', '.', 2).display( Sin ) + '</td></tr>')
                .append( '<td class="text-right">' + $.fn.dataTable.render.number(',', '.', 2).display( Subsidio ) + '</td></tr>')
                .append( '<td class="text-right">' + $.fn.dataTable.render.number(',', '.', 2).display( suma ) + '</td></tr>')
            },
            dataSrc: "tipo"
        },

        footerCallback: function ( row, data, start, end, display ) {
            var api = this.api(), data;

            var intVal = function ( i ) {
                return typeof i === 'string' ?
                i.replace(/[\$,]/g, '')*1 :
                typeof i === 'number' ?
                i : 0.00;
            };

            total = api.column(6).data().reduce( function (a, b) {
                return intVal(a) + intVal(b);
            }, 0 );

            $( api.column( 6 ).footer() ).html(
            $.fn.dataTable.render.number(',', '.', 2).display( total ));
        }
    });

    objFecha.addEventListener("change", function(){
        if( fntEsValido() ){
            load();
        }
        else{
            alert_nova.showNotification('La fecha y el filtro son campos obligatorios', 'warning', 'danger');
        }
    });

    objFiltro.addEventListener("change", function(){
        if( fntEsValido() ){
            load();
        }
        else{
            alert_nova.showNotification('La fecha y el filtro son campos obligatorios', 'warning', 'danger');
        }
    });
});
