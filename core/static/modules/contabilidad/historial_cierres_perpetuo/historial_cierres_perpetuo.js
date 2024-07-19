
$(document).ready(function () {
    table = $('#tblHistorial').DataTable({
        processing: true,
        serverSide: true,
        pagingType: "full_numbers",
        lengthMenu: [
            [10, 25, 50, -1],
            [10, 25, 50, "All"]
        ],
        ajax: {
            url: strUrlGetReporte,
            type: "POST",
            headers: {
                "X-CSRFToken": getCookie('csrftoken'),
            },
        },
        language: objLenguajeDataTable,
        columns: [
            {
                "data": "id",
                "visible": false
            },
            { "data": "fecha" },
            { "data": "usuario" },
            { "defaultContent": "" },
        ],
        columnDefs: [
            {
                targets: 3,
                render: function (data, type, row, meta) {
                    return `<button type="button" class="btn btn-outline-primary" onclick="showCierre(${row.id}, '${row.fecha}')"><span class="material-icons">visibility</span></button>`;
                }
            }
        ]
    });
});

window.toggleRptCierre = async (boolShow) => {
    document.getElementById('contenedorCierre').style.display = (boolShow) ? '' : 'none';
    document.getElementById('contenedorRpt').style.display = (boolShow) ? 'none' : '';
    if (gridCierre) {
        gridCierre.option('dataSource', []);
    }
    document.getElementById('divContainer').classList.toggle('col-sm-12');
    document.getElementById('divContainer').classList.toggle('offset-sm-2');
    document.getElementById('divContainer').classList.toggle('col-sm-8');
};

window.showCierre = async (id, strFecha) => {
    open_loading();
    const form = new FormData();
    form.append('id', id);
    fetch(strUrlGetCierre, {
        method: 'POST',
        body: form,
        headers: {
            "X-CSRFToken": getCookie('csrftoken'),
        },
    })
        .then(response => response.json())
        .then(async (data) => {
            close_loading();
            if (data.status) {
                document.getElementById('titleCierre').innerText = strFecha;
                await toggleRptCierre(true);
                gridCierre = $('#gridCierre').dxDataGrid({
                    dataSource: data.detalles,
                    //wordWrapEnabled: true,
                    columnAutoWidth: true,
                    columns: [
                        {
                            caption: "Codigo Producto",
                            dataField: "CodigoProducto",
                            dataType: "string",
                            fixed: true,
                            fixedPosition: "left"
                        },
                        {
                            caption: "Descripción",
                            dataField: "Descripcion",
                            dataType: "string",
                            fixed: true,
                            fixedPosition: "left"
                        },
                        {
                            caption: "Libras Inicial",
                            dataField: "Libras_Inicial",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Total Inicial",
                            dataField: "Total_Inicial",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Unitario Inicial",
                            dataField: "Unitario_Inicial",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Libras Compras",
                            dataField: "Libras_Compras",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Total Compras",
                            dataField: "Total_Compras",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Unitario Compras",
                            dataField: "Unitario_Compras",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Libras Otros Movs",
                            dataField: "Libras_Otros_Movs",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Total Otros Movs",
                            dataField: "Total_Otros_Movs",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Unitario Otros Movs",
                            dataField: "Unitario_Otros_Movs",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Libras Ventas",
                            dataField: "Libras_Ventas",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Total Ventas",
                            dataField: "Total_Ventas",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Unitario Ventas",
                            dataField: "Unitario_Ventas",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Libras Final",
                            dataField: "Libras_Final",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Total Final",
                            dataField: "Total_Final",
                            dataType: "number",
                            format: "###,###,###.######",
                        },
                        {
                            caption: "Unitario Final",
                            dataField: "Unitario_Final",
                            dataType: "number",
                            format: "###,###,###.######",
                        }
                    ],
                    columnsAutoWidth: true,
                    showBorders: true,
                    filterRow: {
                        visible: true,
                        applyFilter: "auto"
                    },
                    searchPanel: {
                        visible: true,
                        //width: 240,
                        placeholder: "Buscar..."
                    },
                    headerFilter: {
                        visible: true
                    },
                    allowSorting: true,
                    export: {
                        enabled: true,
                        fileName: "Reporte"
                    }
                }).dxDataGrid("instance");
            } else {
                toggleRptCierre(false);
                alert_nova.showNotification(data.msg ?? "", "warning", "danger");
            }
        })
        .catch((error) => {
            close_loading();
            alert_nova.showNotification('Error al obtener el cierre, comuníquese con IT.', "warning", "danger");
        });
};
