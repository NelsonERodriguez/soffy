$(document).ready(function(){
    $('#datatable').DataTable({
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "Todos"]
        ],
        "order": [[ 0, "desc" ]],
        processing: true,
        responsive: true,
        language: objLenguajeDataTable,
        "ajax": {
            "url": urlGetData,
            "type": "POST",
            "dataSrc": "data",
            "data": function(d){
                d.csrfmiddlewaretoken = $("input[name='csrfmiddlewaretoken']").val()
            }
        },
        columns: [
            {data: 'Codigo', "className":"text-right"},
            {data: 'Producto', "className":"text-left"},
            {data: 'Libras', "className":"text-right",
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        return numberGTFormat.format(data);
                    }
                    return data;
                }
            },
            {data: 'VentasDiciembre', "className":"text-right",
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        return numberGTFormat.format(data);
                    }
                    return data;
                }
            },
            {data: 'VentasEnero', "className":"text-right",
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        return numberGTFormat.format(data);
                    }
                    return data;
                }
            },
            {data: 'Promedio', "className":"text-right",
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        return numberGTFormat.format(data);
                    }
                    return data;
                }
            },
            {data: 'Dias_Piso', "className":"text-right"},
            {data: 'Lead_Time', "className":"text-right"},
            {data: 'Punto_Reorden', "className":"text-right",
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        return numberGTFormat.format(data);
                    }
                    return data;
                }
            },
            {data: 'Sugerencia', "className":"text-left",
                "render": function (data, type, row) {
                    if(row.Sugerencia === "Ordenar"){
                        let strTextShow = row.Sugerencia;
                        return `<button class='btn btn-outline-danger btnDeletePadding' type='button'>${strTextShow}</button>`;
                    }
                    return data;
                }
            },
            {data: 'Bodega', "className":"text-right",
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        return numberGTFormat.format(data);
                    }
                    return data;
                }
            },
            {data: 'Predios', "className":"text-right",
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        return numberGTFormat.format(data);
                    }
                    return data;
                }
            },
            {data: 'Puerto', "className":"text-right",
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        return numberGTFormat.format(data);
                    }
                    return data;
                }
            },
        ]
    });
});