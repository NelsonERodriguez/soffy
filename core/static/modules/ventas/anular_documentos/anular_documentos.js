const {createApp} = Vue;

let columnsNotas = [
    {
        type: "buttons",
        width: 110,
        buttons: [
            {
                hint: "Anular",
                icon: "fas fa-trash fa-lg",
                visible: true,
                onClick: (e) => {
                    dialogConfirm(() => {
                        open_loading();
                        let formData = new FormData();
                        formData.append('NoFactura', e.row.data.NoFactura);
                        formData.append('nit', e.row.data.NoNit);

                        fetch(strUrlPostAnularNota, {
                            method: "POST",
                            body: formData,
                            headers: {
                                "X-CSRFToken": getCookie('csrftoken'),
                            },
                        })
                            .then(res => res.json())
                            .then(data => {
                                close_loading();
                                console.log(data);
                                if (data.status) {
                                    alert_nova.showNotification(data.msg, "add_alert", "success");
                                    // setTimeout(() => {
                                    //     location.reload();
                                    // }, 1000);
                                } else {
                                    alert_nova.showNotification(data.msg, "warning", "danger");
                                }
                            })
                            .catch(error => {
                                close_loading();
                                console.error(error);
                                alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                            });
                    });
                }
            }
        ]
    },
    {
        dataField: "id",
        caption: "Soli. #",
        width: 75,
    },
    {
        dataField: "Documento",
        alignment: "right",
        cellTemplate: function (element, info) {
            if (info.data.SerieNota) {
                let strElement = `<span class="kt-font-brand kt-font-boldest">
                                        ${info.data.SerieNota} ${info.data.NoDocumentoNota}
                                    </span>`;
                element.html(strElement)
            } else {
                element.html('')
            }
        },
        allowFiltering: false,
    },
    {
        dataField: "SerieNota",
        caption: "Serie",
        width: 75,
        visible: false
    },
    {
        dataField: "NoDocumentoNota",
        caption: "Número",
        dataType: "number",
        visible: false
    },
    {
        dataField: "RazonSocial",
        caption: "Empresa"
    },
    {
        dataField: "Descripcion",
        caption: "Tipo"
    },
    {
        dataField: "Nombre",
    },
    {
        dataField: "total",
        dataType: "number",
        alignment: "right",
        allowFiltering: false,
        format: {
            type: "currency",
            precision: 2,
            currency: "GTQ"
        }
    },
    {
        dataField: "Serie",
        caption: 'Serie',
        width: 75,
    },
    {
        dataField: "NoDocumento",
        caption: 'Factura',
        dataType: "number",
    },
    {
        dataField: "name",
        caption: "Solicitante",
        cellTemplate: function (element, info) {
            element.html('<span style="width: 110px;"><span class="kt-badge kt-badge--primary kt-badge--dot"></span>&nbsp;<span class="kt-font-bold kt-font-primary">' + info.value + '</span></span>');
        }
    },
    {
        dataField: "fecha",
        caption: "Fecha",
        dataType: "date",
        format: "dd/MM/yyyy",
        alignment: "right",
    }
];

let columnsEnvios = [
    {
        caption: "Acciones",
        type: "buttons",
        width: 110,
        buttons: [
            {
                hint: "ANULAR",
                icon: "fas fa-trash fa-lg",
                visible: function (e) {
                    if (e.row.data.Anulado === false) {
                        if (e.row.data.documento === 'Envio') {
                            if (boolAnularEnvio) {
                                // return e.row.data.permite_anular === 1;
                                return true;
                            }
                        } else {
                            // return e.row.data.permite_anular === 1;
                            return true;
                        }
                    }
                },
                onClick: async e => {
                    dialogConfirm(() => {
                        open_loading();
                        let formEnvio = new FormData();
                        formEnvio.append('NoFactura', e.row.data.factura_id);
                        formEnvio.append('FelId', e.row.data.fel_id);
                        formEnvio.append('EmpresaID', e.row.data.empresa_id);
                        formEnvio.append('NumeroDocumentoAAnular', e.row.data.numero_autorizacion);
                        formEnvio.append('NITEmisor', e.row.data.nit_empresa);
                        formEnvio.append('IDReceptor', e.row.data.nit_cliente);
                        formEnvio.append('FechaEmisionDocumentoAnular', e.row.data.fecha_emision);
                        fetch(strUrlPostAnularEnvio, {
                            method: 'POST',
                            headers: {
                                "X-CSRFToken": getCookie('csrftoken'),
                            },
                            body: formEnvio,
                        })
                            .then(response => response.json())
                            .then(data => {
                                close_loading();
                                console.log(data);
                                if (data.status) {
                                    alert_nova.showNotification(data.msg, "add_alert", "success");
                                    setTimeout(() => {
                                        location.reload();
                                    }, 1000);
                                } else {
                                    alert_nova.showNotification(data.msg, "warning", "danger");
                                }
                            })
                            .catch(error => {
                                close_loading();
                                console.error(error);
                                alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                            });
                    });

                }
            },
        ]
    },
    {
        dataField: "id",
        caption: "#",
        dataType: "number",
        visible: false,
        allowEditing: false
    },
    {
        dataField: "documento",
        allowEditing: false,
        visible: false,
    },
    {
        dataField: "empresa_id",
        dataType: "number",
        allowEditing: false,
        visible: false,
    },
    {
        dataField: "nit_empresa",
        visible: false,
    },
    {
        dataField: "empresa",
        allowEditing: false,
        width: 175,
        cellTemplate: function (element, info) {
            if (!info.data.Bodega || info.data.Bodega === '0') {
                element.html(
                    '<span style="width: 110px;"><span class="kt-badge kt-badge--primary kt-badge--dot"></span>&nbsp;<span class="kt-font-bold kt-font-primary">' +
                    info.value +
                    "</span></span>"
                );
            } else if (info.data.Bodega === '1') {
                element.html(
                    '<span style="width: 110px;"><span class="kt-badge kt-badge--success kt-badge--dot"></span>&nbsp;<span class="kt-font-bold kt-font-success">' +
                    info.value +
                    "</span></span>"
                );
            }
        }
    },
    {
        dataField: "factura_id",
        visible: false,
    },
    {
        dataField: "serie",
        alignment: "center",
        cellTemplate: function (element, info) {
            if (info.value != null) {
                element.html(
                    '<span class="kt-font-bold kt-font-danger">' +
                    info.value +
                    "</span>"
                );
            } else {
                element.html("");
            }
        },
        visible: false,
    },
    {
        dataField: "numero",
        caption: "Número Pedido",
        allowEditing: false,
        alignment: "right",
        width: 125,
        cellTemplate: function (element, info) {
            if (info.value != null) {
                element.html(
                    '<span class="kt-font-bold kt-font-dark">' +
                    info.value +
                    "</span>"
                );
            } else {
                element.html("");
            }
        },
    },
    {
        dataField: "anulado",
        dataType: "number",
        caption: "Estado",
        alignment: "center",
        cellTemplate: function (element, info) {
            switch (info.value) {
                case null:
                    element.html(
                        '<span class="btn btn-bold btn-sm btn-font-sm  btn-label-brand">Facturar</span>'
                    );
                    break;
                case 0:
                    element.html(
                        '<span class="btn btn-bold btn-sm btn-font-sm  btn-label-success">Activo</span>'
                    );
                    break;
                case 1:
                    element.html(
                        '<span class="btn btn-bold btn-sm btn-font-sm  btn-label-danger">Anulado</span>'
                    );
                    break;
            }
        },
        visible: false,
    },
    {
        dataField: "pedido",
        dataType: "number",
        alignment: "right",
        allowEditing: false
    },
    {
        dataField: "fecha_ingreso",
        dataType: "date",
        format: "dd/MM/yyyy",
        alignment: "right",
        allowEditing: false,
    },
    {
        dataField: "codigo",
        alignment: "right",
        allowEditing: false,
        visible: false,
    },
    {
        dataField: "nit_cliente",
        visible: false,
    },
    {
        dataField: "cliente",
        alignment: "left",
        allowEditing: false,
        width: 125
    },
    {
        dataField: "ruta",
        dataType: "number",
        alignment: "right",
        allowEditing: false
    },
    {
        dataField: "entrega",
        alignment: "left",
        allowEditing: false,
        cellTemplate: function (element, info) {
            switch (info.value) {
                case "Hoy":
                    element.html(
                        '<span style="width: 110px;"><span class="kt-badge kt-badge--success kt-badge--dot"></span>&nbsp;<span class="kt-font-bold kt-font-success">' +
                        info.value +
                        "</span></span>"
                    );
                    break;
                case "Mañana":
                    element.html(
                        '<span style="width: 110px;"><span class="kt-badge kt-badge--primary kt-badge--dot"></span>&nbsp;<span class="kt-font-bold kt-font-primary">' +
                        info.value +
                        "</span></span>"
                    );
                    break;
                case "No Facturado":
                    element.html(
                        '<span style="width: 110px;"><span class="kt-badge kt-badge--danger kt-badge--dot"></span>&nbsp;<span class="kt-font-bold kt-font-danger">' +
                        info.value +
                        "</span></span>"
                    );
                    break;
            }
        },
    },
    {
        dataField: "observaciones",
        alignment: "left",
        allowEditing: false,
        width: 155,
    },
    {
        dataField: "total",
        dataType: "number",
        alignment: "right",
        allowFiltering: false,
        format: {
            type: "currency",
            precision: 2,
            currency: "GTQ"
        },
        allowEditing: false,
        visible: false,
    },
    {
        dataField: "despacho",
        alignment: "left",
        allowEditing: false,
        visible: false,
    },
    {
        dataField: "usuario",
        alignment: "left",
        allowEditing: false
    },
    {
        dataField: "fel_pdf",
        visible: false
    },
    {
        dataField: "numero_autorizacion",
        visible: false
    },
    {
        dataField: "fecha_emision",
        visible: false
    }
];

let columnsFacturas = [
    {
        caption: "Acciones",
        type: "buttons",
        width: 110,
        buttons: [
            {
                hint: "ANULAR",
                icon: "fas fa-trash fa-lg",
                visible: function (e) {
                    if (e.row.data.Anulado === false) {
                        if (e.row.data.documento === 'Envio') {
                            if (boolAnularEnvio) {
                                // return e.row.data.permite_anular === 1;
                                return true;
                            }
                        } else {
                            // return e.row.data.permite_anular === 1;
                            return true;
                        }
                    }
                },
                onClick: async e => {
                    dialogConfirm(() => {
                        open_loading();
                        let formData = new FormData();
                        formData.append('NoFactura', e.row.data.factura_id);
                        formData.append('FelId', e.row.data.fel_id);
                        formData.append('EmpresaID', e.row.data.empresa_id);
                        formData.append('NumeroDocumentoAAnular', e.row.data.numero_autorizacion);
                        formData.append('NITEmisor', e.row.data.nit_empresa);
                        formData.append('IDReceptor', e.row.data.nit_cliente);
                        formData.append('FechaEmisionDocumentoAnular', e.row.data.fecha_emision);
                        fetch(strUrlPostAnularFactura, {
                            method: 'POST',
                            headers: {
                                "X-CSRFToken": getCookie('csrftoken'),
                            },
                            body: formData,
                        })
                            .then(response => response.json())
                            .then(data => {
                                close_loading();
                                if (data.status) {
                                    alert_nova.showNotification(data.message, "add_alert", "success");
                                    // setTimeout(() => {
                                    // location.reload();
                                    // }, 1000);
                                } else {
                                    alert_nova.showNotification(data.message, "warning", "danger");
                                }
                            })
                            .catch(error => {
                                close_loading();
                                console.error('Error:', error);
                            })
                    });


                }
            },
        ]
    },
    {
        dataField: "id",
        caption: "#",
        dataType: "number",
        visible: false,
        allowEditing: false
    },
    {
        dataField: "documento",
        allowEditing: false,
    },
    {
        dataField: "empresa_id",
        dataType: "number",
        allowEditing: false,
        visible: false,
    },
    {
        dataField: "nit_empresa",
        visible: false
    },
    {
        dataField: "empresa",
        allowEditing: false,
        width: 175,
        cellTemplate: function (element, info) {
            if (!info.data.Bodega || info.data.Bodega === '0') {
                element.html(
                    '<span style="width: 110px;"><span class="kt-badge kt-badge--primary kt-badge--dot"></span>&nbsp;<span class="kt-font-bold kt-font-primary">' +
                    info.value +
                    "</span></span>"
                );
            } else if (info.data.Bodega === '1') {
                element.html(
                    '<span style="width: 110px;"><span class="kt-badge kt-badge--success kt-badge--dot"></span>&nbsp;<span class="kt-font-bold kt-font-success">' +
                    info.value +
                    "</span></span>"
                );
            }
        }
    },
    {
        dataField: "factura_id",
        visible: false
    },
    {
        dataField: "serie",
        alignment: "center",
        cellTemplate: function (element, info) {
            if (info.value != null) {
                element.html(
                    '<span class="kt-font-bold kt-font-danger">' +
                    info.value +
                    "</span>"
                );
            } else {
                element.html("");
            }
        },
        visible: false,
    },
    {
        dataField: "numero",
        caption: "Número",
        allowEditing: false,
        alignment: "right",
        width: 125,
        cellTemplate: function (element, info) {
            if (info.value != null) {
                element.html(
                    '<span class="kt-font-bold kt-font-dark">' +
                    info.value +
                    "</span>"
                );
            } else {
                element.html("");
            }
        },
    },
    {
        dataField: "anulado",
        dataType: "number",
        caption: "Estado",
        alignment: "center",
        cellTemplate: function (element, info) {
            switch (info.value) {
                case null:
                    element.html(
                        '<span class="btn btn-bold btn-sm btn-font-sm  btn-label-brand">Facturar</span>'
                    );
                    break;
                case 0:
                    element.html(
                        '<span class="btn btn-bold btn-sm btn-font-sm  btn-label-success">Activo</span>'
                    );
                    break;
                case 1:
                    element.html(
                        '<span class="btn btn-bold btn-sm btn-font-sm  btn-label-danger">Anulado</span>'
                    );
                    break;
            }
        },
        visible: false,
    },
    {
        dataField: "pedido",
        dataType: "number",
        caption: "Factura / Pedido",
        alignment: "right",
        allowEditing: false
    },
    {
        dataField: "fecha_ingreso",
        dataType: "date",
        format: "dd/MM/yyyy",
        alignment: "right",
        allowEditing: false,
    },
    {
        dataField: "codigo",
        alignment: "right",
        allowEditing: false,
        visible: false,
    },
    {
        dataField: "nit_cliente",
        visible: false,
    },
    {
        dataField: "cliente",
        alignment: "left",
        allowEditing: false,
        width: 125
    },
    {
        dataField: "ruta",
        dataType: "number",
        alignment: "right",
        allowEditing: false
    },
    {
        dataField: "entrega",
        alignment: "left",
        allowEditing: false,
        cellTemplate: function (element, info) {
            switch (info.value) {
                case "Hoy":
                    element.html(
                        '<span style="width: 110px;"><span class="kt-badge kt-badge--success kt-badge--dot"></span>&nbsp;<span class="kt-font-bold kt-font-success">' +
                        info.value +
                        "</span></span>"
                    );
                    break;
                case "Mañana":
                    element.html(
                        '<span style="width: 110px;"><span class="kt-badge kt-badge--primary kt-badge--dot"></span>&nbsp;<span class="kt-font-bold kt-font-primary">' +
                        info.value +
                        "</span></span>"
                    );
                    break;
                case "No Facturado":
                    element.html(
                        '<span style="width: 110px;"><span class="kt-badge kt-badge--danger kt-badge--dot"></span>&nbsp;<span class="kt-font-bold kt-font-danger">' +
                        info.value +
                        "</span></span>"
                    );
                    break;
            }
        },
        visible: false,
    },
    {
        dataField: "observaciones",
        alignment: "left",
        allowEditing: false,
        width: 155,
    },
    {
        dataField: "total",
        dataType: "number",
        alignment: "right",
        allowFiltering: false,
        format: {
            type: "currency",
            precision: 2,
            currency: "GTQ"
        },
        allowEditing: false,
        visible: false,
    },
    {
        dataField: "despacho",
        alignment: "left",
        allowEditing: false,
        visible: false,
    },
    {
        dataField: "usuario",
        alignment: "left",
        allowEditing: false
    },
    {
        dataField: "fel_pdf",
        visible: false
    },
    {
        dataField: "numero_autorizacion",
        visible: false
    },
    {
        dataField: "fecha_emision",
        visible: false
    }
];

let customOptions = {
    allowColumnReordering: true,
    rowAlternationEnabled: true,
    showBorders: true,
    // height: 550,
    columnMinWidth: 50,
    loadPanel: {enabled: true,},
    wordWrapEnabled: true,
    // scrolling: {mode: "virtual"},
    headerFilter: {
        visible: true,
        allowSearch: true
    },
    groupPanel: {
        visible: false
    },
    grouping: {
        allowCollapsing: true,
        autoExpandAll: false,
        contextMenuEnabled: true,
        expandMode: "rowClick"
    },
    columns: [],
    paging: {
        pageSize: 10
    },
    pager: {
        showNavigationButtons: true,
        showPageSizeSelector: true,
        allowedPageSizes: [10, 50, 200],
        showInfo: true
    },
};

const myComponent = {
    data() {
        return {
            documentos: [],
            dataGridInstance: null,
            tipoDocumentos: '',
        };
    },
    mounted() {
    },
    computed: {
        customOptions() {
            return {
                height: 550,
                showBorders: true,
                columns: this.tipoDocumentos === 'factura' ? columnsFacturas : ((this.tipoDocumentos === "nota") ? columnsNotas : (this.tipoDocumentos === 'envio' ? columnsEnvios : [])),
                dataSource: this.documentos,
            };
        }
    },
    methods: {
        fetchData(strTipo) {
            open_loading();
            const formData = new FormData();
            if (strTipo !== "nota") formData.append('tipo', (strTipo === "factura") ? "F" : "E");
            fetch((strTipo === "nota") ? strUrlGetNotas : strUrlGetFacturas, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCookie('csrftoken'),
                },
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    close_loading();
                    this.documentos = data.documentos;
                    if (!this.dataGridInstance) {
                        this.initDataGrid();
                    } else {
                        this.updateDataGrid(data.documentos);
                    }
                })
                .catch(error => {
                    close_loading();
                    console.error('Error:', error);
                    alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                });
        },
        initDataGrid() {
            this.dataGridInstance = $("#dataGridContainer").dxDataGrid({
                ...customOptions,
                dataSource: this.documentos,
            }).dxDataGrid("instance");
        },
        updateDataGrid(data) {
            if (this.dataGridInstance) {
                this.dataGridInstance.option({
                    dataSource: data,
                    columns: this.tipoDocumentos === 'factura' ? columnsFacturas : (this.tipoDocumentos === "nota" ? columnsNotas : (this.tipoDocumentos === "envio" ? columnsEnvios : []))
                });
            }
        },
    },
    watch: {
        documentos(newDocumentos) {
            this.updateDataGrid(newDocumentos);
        },
        tipoDocumentos(newValue) {
            if (!newValue) return;
            this.documentos = [];
            if (this.dataGridInstance) {
                this.dataGridInstance.option({
                    columns: newValue === 'factura' ? columnsFacturas : (newValue === "nota" ? columnsNotas : (newValue === "envio" ? columnsEnvios : [])),
                    dataSource: this.documentos,
                });
            }
        },
    }
};

const appAnularDocumentos = createApp(myComponent);
appAnularDocumentos.config.compilerOptions.delimiters = ['[[', ']]'];
appAnularDocumentos.mount('#app');
appAnularDocumentos.config.errorHandler = (err, instance, info) => {
    console.error("ERROR", err);
    console.log("INSTANCE", instance);
    console.log("INFO", info);
};

