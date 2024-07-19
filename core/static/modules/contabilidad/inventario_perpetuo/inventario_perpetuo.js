const btnReporte = document.getElementById('btnReporte');
const btnCerrar = document.getElementById('btnCerrar');
let arrInventarioPerpetuo = [];

if (btnReporte) {
    btnReporte.addEventListener('click', () => {
        const strFecha = document.getElementById('fecha').value.trim();
        btnCerrar.style.display = 'none';

        if (strFecha === '') {
            alert_nova.showNotification("Debe ingresar la fecha para poder ver el reporte.", "warning", "danger");
            return false;
        } else {
            get_solicitudes();
        }
    });
}

function get_solicitudes() {
    const divReporte = document.getElementById('divReporte');

    const formElement = document.getElementById("frm_reporte");
    const form = new FormData(formElement);
    open_loading();
    btnCerrar.style.display = 'none';

    fetch(strUrlGetReporte, {
        method: 'POST',
        body: form
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            if (data) {
                btnCerrar.style.display = '';

                arrInventarioPerpetuo = data.inventario_perpetuo;
                new DevExpress.ui.dxDataGrid(divReporte, {
                    dataSource: data.inventario_perpetuo,
                    //wordWrapEnabled: true,
                    columnAutoWidth: true,
                    onCellClick: function (element) {

                        if (element.data) {
                            let boolQuitar = false;

                            const objAnteriores = document.querySelectorAll('tr[data-click="1"]');

                            objAnteriores.forEach(thisElement => {
                                if (thisElement === $(element.cellElement).parent()[0]) boolQuitar = true;
                                thisElement.style.background = 'white';
                                thisElement.style.color = 'black';
                                thisElement.removeAttribute('data-click');
                            });

                            if (!boolQuitar) {
                                $(element.cellElement).parent().css({
                                    "background": "red",
                                    "color": "white"
                                }).attr("data-click", "1");

                                get_segundo_reporte(element.data.CodigoProducto);
                                get_tercer_reporte(element.data.CodigoProducto);
                                get_cuarto_reporte(element.data.CodigoProducto);
                            } else {
                                get_segundo_reporte('');
                                get_tercer_reporte('');
                                get_cuarto_reporte('');
                            }
                        }

                    },
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
                });

                get_segundo_reporte('');
                get_tercer_reporte('');
                get_cuarto_reporte('');

            }

        })
        .catch((error) => {
            close_loading();
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            console.error(error);
        });

}

function get_segundo_reporte(CodigoProducto) {

    const divReporte = document.getElementById('divSegundoReporte');
    open_loading();

    const formElement = document.getElementById("frm_reporte");
    const form = new FormData(formElement);
    form.append('codigo', CodigoProducto);

    fetch(strUrlSegundo, {
        method: 'POST',
        body: form
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            new DevExpress.ui.dxDataGrid(divReporte, {
                dataSource: data.segundo_reporte,
                columnAutoWidth: true,
                columns: [
                    {
                        caption: "No Movimiento",
                        dataField: "NoMovimiento",
                        dataType: "string"
                    },
                    {
                        caption: "CodigoProducto",
                        dataField: "CodigoProducto",
                        dataType: "string"
                    },
                    {
                        caption: "Descripción",
                        dataField: "Descripcion",
                        dataType: "string"
                    },
                    {
                        dataField: "NoTDocumento",
                        dataType: "string"
                    },
                    {
                        dataField: "TDocumento",
                        dataType: "string"
                    },
                    {
                        dataField: "NoDocumento",
                        dataType: "string"
                    },
                    {
                        dataField: "Fecha",
                        dataType: "date"
                    },
                    {
                        dataField: "NoLote",
                        dataType: "string"
                    },
                    {
                        dataField: "NoContenedor",
                        dataType: "string"
                    },
                    {
                        dataField: "Cantidad",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "Total",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "Costo",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "Existencia",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "CostoTotal",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "Costo2",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
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
            });


        })
        .catch((error) => {
            close_loading();
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            console.error(error);
        });

}

function get_tercer_reporte(CodigoProducto) {
    const divReporte = document.getElementById('divTercerReporte');
    open_loading();

    const formElement = document.getElementById("frm_reporte");
    const form = new FormData(formElement);
    form.append('codigo', CodigoProducto);

    fetch(strUrlTercer, {
        method: 'POST',
        body: form
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            new DevExpress.ui.dxDataGrid(divReporte, {
                dataSource: data.tercer_reporte,
                columnAutoWidth: true,
                columns: [
                    {
                        dataField: "Empresa",
                        dataType: "string"
                    },
                    {
                        caption: "Tipo Documento",
                        dataField: "TipoDocumento",
                        dataType: "string"
                    },
                    {
                        dataField: "Serie",
                        dataType: "string"
                    },
                    {
                        caption: "No Documento",
                        dataField: "NoDocumento",
                        dataType: "string"
                    },
                    {
                        dataField: "Fecha",
                        dataType: "date"
                    },
                    {
                        caption: "Codigo Producto",
                        dataField: "CodigoProducto",
                        dataType: "string"
                    },
                    {
                        dataField: "Descripcion",
                        dataType: "string"
                    },
                    {
                        dataField: "Libras",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "Total",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "Precio",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "NoMovimiento",
                        dataType: "string"
                    },
                    {
                        dataField: "CentroCosto",
                        dataType: "string"
                    },
                    {
                        dataField: "CostoUnitario",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "CostoTotal",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
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
            });


        })
        .catch((error) => {
            close_loading();
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            console.error(error);
        });

}

function get_cuarto_reporte(CodigoProducto) {
    const divReporte = document.getElementById('divCuartoReporte');
    open_loading();

    const formElement = document.getElementById("frm_reporte");
    const form = new FormData(formElement);
    form.append('codigo', CodigoProducto);

    fetch(strUrlCuarto, {
        method: 'POST',
        body: form
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            new DevExpress.ui.dxDataGrid(divReporte, {
                dataSource: data.tercer_reporte,
                columnAutoWidth: true,
                columns: [
                    {
                        dataField: "NoLiquidacion",
                        dataType: "string"
                    },
                    {
                        dataField: "Fecha",
                        dataType: "date"
                    },
                    {
                        dataField: "Codigo",
                    },
                    {
                        dataField: "Descripcion",
                    },
                    {
                        dataField: "Factura",
                        dataType: "string"
                    },
                    {
                        dataField: "Proveedor",
                        dataType: "string"
                    },
                    {
                        dataField: "BL_No",
                        dataType: "string"
                    },
                    {
                        dataField: "Contenedor",
                        dataType: "string"
                    },
                    {
                        dataField: "Lote",
                        dataType: "string"
                    },
                    {
                        dataField: "Consignatario",
                        dataType: "string"
                    },
                    {
                        dataField: "FOB_$_Origen",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "Peso",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "FOB_$",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "FOB_Q",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "Total_Internacion_Q",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "Total_Importacion_Q",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
                    {
                        dataField: "Costo_SIVA",
                        dataType: "number",
                        format: "###,###,###.######",
                    },
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
            });


        })
        .catch((error) => {
            close_loading();
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            console.error(error);
        });

}


function saveHistorial() {
    const form = new FormData();
    form.append('fecha', document.getElementById('fecha').value);

    for (let key in arrInventarioPerpetuo) {
        const arrDetalle = arrInventarioPerpetuo[key];

        form.append('noproducto', arrDetalle.noproducto ?? arrDetalle.NoProducto);
        form.append('codigo_producto', arrDetalle.CodigoProducto);
        form.append('descripcion', arrDetalle.Descripcion);
        form.append('libras_inicial', arrDetalle.Libras_Inicial);
        form.append('total_inicial', arrDetalle.Total_Inicial);
        form.append('unitario_inicial', arrDetalle.Unitario_Inicial);
        form.append('libras_compras', arrDetalle.Libras_Compras);
        form.append('total_compras', arrDetalle.Total_Compras);
        form.append('unitario_compras', arrDetalle.Unitario_Compras);
        form.append('libras_otros_movs', arrDetalle.Libras_Otros_Movs);
        form.append('total_otros_movs', arrDetalle.Total_Otros_Movs);
        form.append('unitario_otros_movs', arrDetalle.Unitario_Otros_Movs);
        form.append('libras_ventas', arrDetalle.Libras_Ventas);
        form.append('total_ventas', arrDetalle.Total_Ventas);
        form.append('unitario_ventas', arrDetalle.Unitario_Ventas);
        form.append('libras_final', arrDetalle.Libras_Final);
        form.append('total_final', arrDetalle.Total_Final);
        form.append('unitario_final', arrDetalle.Unitario_Final);

    }

    open_loading();
    fetch(strUrlSaveHistorial, {
        method: 'POST',
        body: form,
        headers: {
            "X-CSRFToken": getCookie('csrftoken'),
        },
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            if (data.status) {
                alert_nova.showNotification(data.msg, "add_alert", "success");
                btnCerrar.style.display = 'none';
            } else {
                alert_nova.showNotification(`Error al grabar: <br> ${data.msg}`, "warning", "danger");
            }

        })
        .catch((error) => {
            close_loading();
            alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
            console.error(error);
        });

}
