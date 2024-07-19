(function () {
    window.objContenido = document.getElementById("contenido");
    window.hdnNoCliente = document.getElementById("hdnNoCliente");
    window.inputTxtNombre = document.getElementById("txtNombreCliente");
    window.divIngreso = document.getElementById("divIngreso");
    window.divHistorial = document.getElementById("divHistorial");
    window.contenidoHistorial = document.getElementById("contenidoHistorial");
    window.btnHistorial = document.getElementById("btnHistorial");
    window.btnBuscar = document.getElementById("btnBuscar");
    window.dateFechaInicio = document.getElementById("fecha_inicio");
    window.dateFechaFin = document.getElementById("fecha_fin");

    $(document).ready(function () {
        $("#txtNombreCliente").autocomplete({
            minLength: 2,
            source: function (request, response) {
                open_loading();
                strUrl = strUrlCliente.replace("search", request.term);
                const data = new FormData();
                data.append("csrfmiddlewaretoken", valCSRF);

                fetch(strUrl, {
                    method: "POST",
                    body: data,
                })
                    .then(response => response.json())
                    .then((data) => {
                        close_loading();
                        response($.map(data, function (item) {
                            return {
                                label: item.name,
                                value: item.name,
                                id: item.id,
                                nit: item.nit
                            }
                        }))
                    })
                    .catch((error) => {
                        alert_nova.showNotification("Error de conexión, comuníquese con IT.", "warning", "danger");
                        console.error(error);
                        close_loading();
                    });
            },
            select: function (event, ui) {
                objContenido.innerHTML = "";
                event.preventDefault();
                hdnNoCliente.value = ui.item.id;
                inputTxtNombre.value = ui.item.name;
                $(this).blur();
                this.value = ui.item.label;
                getInfoCliente(ui.item.id, ui.item.nit);
            }
        }).focus(function () {
            objContenido.innerHTML = "";
            hdnNoCliente.value = "";
            inputTxtNombre.value = "";
        });
    });

    window.createCard = async (strTitle) => {
        let objOptions = {
            element: "div",
            classes: ["card"]
        };
        const objCard = await createElement(objOptions);

        objOptions = {
            element: "div",
            classes: ["card-header", "card-header-text"]
        };
        const objCardHeader = await createElement(objOptions);
        objCard.appendChild(objCardHeader);

        objOptions = {
            element: "div",
            classes: ["card-title"]
        };
        const objCardTitle = await createElement(objOptions);
        objCardTitle.innerText = strTitle;
        objCardHeader.appendChild(objCardTitle);

        objOptions = {
            element: "div",
            classes: ["card-body"],
        };
        const objCardBody = await createElement(objOptions);
        objCard.appendChild(objCardBody);

        return {
            objCard: objCard,
            objCardBody: objCardBody
        }
    };

    window.getInfoCliente = async (strNoCliente, strNit) => {
        const data = new FormData();
        data.append("csrfmiddlewaretoken", valCSRF);
        data.append("cliente", strNoCliente);
        data.append("nit", strNit);
        open_loading();
        await fetch(strUrlInfoCliente, {
            method: "POST",
            body: data,
        })
            .then(response => response.json())
            .then(async (data) => {
                close_loading();

                await createCardInformacion(data);
                await createCardDocumentos(data);
                await getSaldoCliente(strNoCliente);
                await getVencidosCliente(strNoCliente);

            })
            .catch((error) => {
                alert_nova.showNotification("Error de conexión, comuníquese con IT.", "warning", "danger");
                console.error(error);
                close_loading();
            });
    };

    window.createCardInformacion = async (data) => {
        let objOptions = {
            element: "div",
            classes: ["row"]
        };
        let objRow = await createElement(objOptions);
        objContenido.appendChild(objRow);

        objOptions = {
            element: "div",
            classes: ["col-md-8", "offset-md-2"]
        };
        let objCol = await createElement(objOptions);
        objRow.appendChild(objCol);

        let objCard = await createCard("Información");

        objCol.appendChild(objCard.objCard);

        objOptions = {
            element: "div",
            classes: ["row"]
        };
        objRow = await createElement(objOptions);
        objCard.objCardBody.appendChild(objRow);

        objOptions = {
            element: "div",
            classes: ["col-md-4"]
        };
        objCol = await createElement(objOptions);
        objCol.innerHTML = `<strong>Nombre:</strong> ${data.info_cliente[0].name}`;
        objRow.appendChild(objCol);

        objOptions = {
            element: "div",
            classes: ["col-md-4"]
        };
        objCol = await createElement(objOptions);
        objCol.innerHTML = `<strong>Dirección:</strong> ${data.info_cliente[0].direccion}`;
        objRow.appendChild(objCol);

        objOptions = {
            element: "div",
            classes: ["col-md-4"]
        };
        objCol = await createElement(objOptions);
        objCol.innerHTML = `<strong>Teléfono:</strong> ${data.info_cliente[0].telefono}`;
        objRow.appendChild(objCol);

        objOptions = {
            element: "div",
            classes: ["col-md-4"]
        };
        objCol = await createElement(objOptions);
        objCol.innerHTML = `<strong>Dias crédito:</strong> ${data.info_cliente[0].diasCredito}`;
        objRow.appendChild(objCol);

        objOptions = {
            element: "div",
            classes: ["col-md-4"]
        };
        objCol = await createElement(objOptions);
        objCol.innerHTML = `<strong>Limite de crédito:</strong> Q${formatoMonto((data.info_cliente[0].limite) * 1)}`;
        objRow.appendChild(objCol);

        objOptions = {
            element: "div",
            classes: ["col-md-4"]
        };
        objCol = await createElement(objOptions);
        objCol.innerHTML = `<strong>Disponible de crédito:</strong> Q${formatoMonto((data.info_cliente[0].disponible) * 1)}`;
        objRow.appendChild(objCol);

        objOptions = {
            element: "div",
            classes: ["col-md-12"]
        };
        objCol = await createElement(objOptions);
        objCol.innerHTML = `<strong>Sucursales:</strong>`;
        objRow.appendChild(objCol);

        for (let sucursales of data.sucursales) {
            objOptions = {
                element: "div",
                classes: ["col-md-4"]
            };
            objCol = await createElement(objOptions);
            objCol.innerText = sucursales.Direccion;
            objRow.appendChild(objCol);
        }

        if (data.info_sat) {
            objOptions = {
                element: "div",
                classes: ["col-md-12", "text-center"],
                styles: {
                    "margin-top": "15px"
                }
            };
            objCol = await createElement(objOptions);
            objCol.innerHTML = `<strong>DATOS PROVISTOS DE SAT PARA FACTURAR</strong>`;
            objRow.appendChild(objCol);

            objOptions = {
                element: "div",
                classes: ["col-md-6"]
            };
            objCol = await createElement(objOptions);
            objCol.innerHTML = `<strong>Nombre:</strong> ${data.info_sat.nombre}`;
            objRow.appendChild(objCol);

            objOptions = {
                element: "div",
                classes: ["col-md-6"]
            };
            objCol = await createElement(objOptions);
            objCol.innerHTML = (data.info_sat.direcciones) ? `<strong>Direcciones:</strong> ${data.info_sat.direcciones.direccion}` : "";
            objRow.appendChild(objCol);
        } else {
            objOptions = {
                element: "div",
                classes: ["col-md-12", "text-center"],
                styles: {
                    "margin-top": "15px"
                }
            };
            objCol = await createElement(objOptions);
            objCol.innerHTML = `<strong>SIN CONEXIÓN A SAT</strong>`;
            objRow.appendChild(objCol);
        }

    };

    window.createCardDocumentos = async () => {
        let objOptions = {
            element: "div",
            classes: ["row"]
        };
        let objRow = await createElement(objOptions);
        objContenido.appendChild(objRow);

        objOptions = {
            element: "div",
            classes: ["col-md-12"]
        };
        let objCol = await createElement(objOptions);
        objRow.appendChild(objCol);

        let objCard = await createCard("Documentos");

        objCol.appendChild(objCard.objCard);

        objOptions = {
            element: "div",
            classes: ["row"]
        };
        objRow = await createElement(objOptions);
        objCard.objCardBody.appendChild(objRow);

        objOptions = {
            element: "div",
            classes: ["col-md-12"]
        };
        objCol = await createElement(objOptions);
        objRow.appendChild(objCol);

        objOptions = {
            element: "ul",
            classes: ["nav", "nav-pills"],
            attributes: {
                role: "tablist",
            }
        };
        let objNavUl = await createElement(objOptions);
        objCol.appendChild(objNavUl);

        objOptions = {
            element: "li",
            classes: ["nav-item"],
        };
        let objNavLi = await createElement(objOptions);
        objNavUl.appendChild(objNavLi);

        objOptions = {
            element: "a",
            classes: ["nav-link"],
            id: "saldos-tab",
            href: "#tabSaldos",
            attributes: {
                "data-toggle": "tab",
                role: "tab",
            },
        };
        let objNavA = await createElement(objOptions);
        objNavA.innerText = "Saldos";
        objNavLi.appendChild(objNavA);

        objOptions = {
            element: "li",
            classes: ["nav-item"],
        };
        objNavLi = await createElement(objOptions);
        objNavUl.appendChild(objNavLi);

        objOptions = {
            element: "a",
            classes: ["nav-link"],
            id: "vencidos-tab",
            href: "#tabVencidos",
            attributes: {
                "data-toggle": "tab",
                role: "tab",
            },
        };
        objNavA = await createElement(objOptions);
        objNavA.innerText = "Vencidos";
        objNavLi.appendChild(objNavA);

        objOptions = {
            element: "div",
            classes: ["tab-content", "tab-space"]
        };
        let objTabContent = await createElement(objOptions);
        objCol.appendChild(objTabContent);

        objOptions = {
            element: "div",
            id: "tabSaldos",
            classes: ["tab-pane"],
            attributes: {
                "arial-labelledby": "home-tab",
                role: "tabpanel",
            },
        };

        let objTabPane = await createElement(objOptions);
        objTabContent.appendChild(objTabPane);

        objOptions = {
            element: "div",
            id: "tabVencidos",
            classes: ["tab-pane"],
            attributes: {
                "arial-labelledby": "home-tab",
                role: "tabpanel",
            }
        };
        objTabPane = await createElement(objOptions);
        objTabContent.appendChild(objTabPane);

    };

    window.getSaldoCliente = async (strNoCliente) => {
        const data = new FormData();
        data.append("csrfmiddlewaretoken", valCSRF);
        data.append("cliente", strNoCliente);
        open_loading();
        await fetch(strUrlSaldoCliente, {
            method: "POST",
            body: data,
        })
            .then(response => response.json())
            .then(async (data) => {
                close_loading();
                const tabSaldos = document.getElementById("tabSaldos");

                let objOptions = {
                    element: "div",
                    classes: ["row"],
                    styles: {
                        "margin-top": "30px",
                    }
                };
                let objRow = await createElement(objOptions);
                tabSaldos.appendChild(objRow);

                objOptions = {
                    element: "div",
                    id: "divSaldos",
                    classes: ["col-md-12", "text-center"]
                };
                let objCol = await createElement(objOptions);
                objRow.appendChild(objCol);

                const dataGrid = $(`#divSaldos`).dxDataGrid({
                    dataSource: data.saldo,
                    searchPanel: {
                        visible: true,
                        highlightCaseSensitive: false,
                    },
                    columnAutoWidth: true,
                    paging: {
                        enabled: false
                    },
                    pager: {
                        showPageSizeSelector: true,
                        allowedPageSizes: [5, 10, 15, 25, 50, 100],
                    },
                    showBorders: true,
                    export: {
                        enabled: true,
                        fileName: "Saldos"
                    },
                    filterRow: {
                        visible: true,
                    },
                    selection: {
                        mode: "multiple",
                    },
                    columns: [
                        {
                            dataField: "TipoDoc",
                        },
                        {
                            dataField: "serie",
                        },
                        {
                            dataField: "nodocumento",
                            caption: "No Documento",
                        },
                        {
                            dataField: "Fecha",
                            dataType: "date"
                        },
                        {
                            dataField: "Saldo",
                            dataType: "number",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                            alignment: "right",
                        },
                        {
                            dataField: "Saldo1",
                            dataType: "number",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                            alignment: "right",
                        },
                        {
                            dataField: "Saldo2",
                            dataType: "number",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                            alignment: "right",
                        },
                        {
                            dataField: "Saldo3",
                            dataType: "number",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                            alignment: "right",
                        },
                        {
                            dataField: "Saldo4",
                            dataType: "number",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                            alignment: "right",
                        },
                    ],
                }).dxDataGrid("instance");

                objOptions = {
                    element: "div",
                    classes: ["row"],
                    styles: {
                        "margin-top": "30px",
                    }
                };
                objRow = await createElement(objOptions);
                tabSaldos.appendChild(objRow);

                objOptions = {
                    element: "div",
                    classes: ["col-md-12", "text-center"]
                };
                objCol = await createElement(objOptions);
                objRow.appendChild(objCol);

                objOptions = {
                    element: "textarea",
                    id: "observaciones",
                    name: "observaciones",
                    classes: ["form-control"],
                    styles: {
                        height: "auto",
                    },
                    attributes: {
                        rows: 4,
                    }
                };
                let objTextArea = await createElement(objOptions);
                objTextArea.placeholder = "Observaciones";
                objCol.appendChild(objTextArea);

                objOptions = {
                    element: "div",
                    classes: ["row"],
                    styles: {
                        "margin-top": "30px",
                    }
                };
                objRow = await createElement(objOptions);
                tabSaldos.appendChild(objRow);

                objOptions = {
                    element: "div",
                    classes: ["col-md-12", "text-center"]
                };
                objCol = await createElement(objOptions);
                objRow.appendChild(objCol);

                objOptions = {
                    element: "button",
                    id: "btnSaldos",
                    classes: ["btn", "btn-outline-success"],
                    type: "button",
                };
                const objButton = await createElement(objOptions);
                objButton.innerHTML = "Confirmar";

                objButton.onclick = () => {
                    dialogConfirm(async () => {

                        const objTodos = data.saldo;
                        for (let i = 0; i < objTodos.length; i++) {
                            const itemTodos = objTodos[i];
                            itemTodos.confirmado = dataGrid.getSelectedRowsData().some(itemSelected => {
                                return itemSelected.serie === itemTodos.serie && itemSelected.nodocumento === itemTodos.nodocumento;
                            });
                        }

                        const dataToSend = {
                            observacion: objTextArea.value,
                            cliente: hdnNoCliente.value,
                            documentos: objTodos
                        };
                        open_loading();
                        await fetch(strUrlSave, {
                            method: "POST",
                            headers: {"X-CSRFToken": valCSRF},
                            body: JSON.stringify(dataToSend),
                        })
                            .then(response => response.json())
                            .then(async (data) => {
                                close_loading();
                                if (data.status) {
                                    alert_nova.showNotification("Registros grabados.", "add_alert", "success");
                                    objButton.style.setProperty("display", "none");
                                    objTextArea.setAttribute("readonly", "");
                                }
                            })
                            .catch((error) => {
                                alert_nova.showNotification("Error de conexión, comuníquese con IT.", "warning", "danger");
                                console.error(error);
                                close_loading();
                            });

                    })
                }
                objCol.appendChild(objButton);

            })
            .catch((error) => {
                alert_nova.showNotification("Error de conexión, comuníquese con IT.", "warning", "danger");
                console.error(error);
                close_loading();
            });
    };

    window.getVencidosCliente = async (strNoCliente) => {
        const data = new FormData();
        data.append("csrfmiddlewaretoken", valCSRF);
        data.append("cliente", strNoCliente);
        open_loading();
        await fetch(strUrlVencidosCliente, {
            method: "POST",
            body: data,
        })
            .then(response => response.json())
            .then((data) => {
                close_loading();
                $("#tabVencidos").dxDataGrid({
                    dataSource: data.vencidos,
                    searchPanel: {
                        visible: true,
                        highlightCaseSensitive: false,
                    },
                    columnAutoWidth: true,
                    paging: {
                        enabled: false
                    },
                    pager: {
                        showPageSizeSelector: true,
                        allowedPageSizes: [5, 10, 15, 25, 50, 100],
                    },
                    showBorders: true,
                    export: {
                        enabled: true,
                        fileName: "Vencidos",
                    },
                    filterRow: {
                        visible: true,
                    },
                    columns: [
                        {
                            dataField: "TipoDoc",
                        },
                        {
                            dataField: "Serie",
                        },
                        {
                            dataField: "NoDocumento",
                        },
                        {
                            dataField: "Fecha",
                            dataType: "date"
                        },
                        {
                            dataField: "Saldo",
                            dataType: "number",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                            alignment: "right",
                        },
                        {
                            dataField: "Total",
                            dataType: "number",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            },
                            alignment: "right",
                        },
                    ],
                });
            })
            .catch((error) => {
                console.error(error);
                alert_nova.showNotification("Error de conexión, comuníquese con IT.", "warning", "danger");
                close_loading();
            });
    };

    btnHistorial.onclick = () => {
        btnHistorial.classList.toggle("btn-outline-info");
        btnHistorial.classList.toggle("btn-outline-danger");
        if (btnHistorial.classList.contains("btn-outline-info")) {
            btnHistorial.innerHTML = `<i class="material-icons">checklist</i> Historial`;
        } else {
            btnHistorial.innerHTML = `<i class="material-icons">arrow_back</i> Regresar`;
        }
        $(divIngreso).toggle("slow");
        $(divHistorial).toggle("slow");
    }

    btnBuscar.onclick = async () => {
        if (dateFechaInicio.value !== "" && dateFechaFin.value !== "") {
            const formData = new FormData();
            formData.append("csrfmiddlewaretoken", valCSRF);
            formData.append("fecha_inicio", dateFechaInicio.value);
            formData.append("fecha_fin", dateFechaFin.value);
            open_loading();
            await fetch(strUrlGetHistorial, {
                method: "POST",
                body: formData,
            })
                .then(response => response.json())
                .then(async (data) => {
                    close_loading();
                    $(contenidoHistorial).dxDataGrid({
                        dataSource: data.verificacion,
                        searchPanel: {
                            visible: true,
                            highlightCaseSensitive: false,
                        },
                        columnAutoWidth: true,
                        paging: {
                            enabled: false
                        },
                        pager: {
                            showPageSizeSelector: true,
                            allowedPageSizes: [5, 10, 15, 25, 50, 100],
                        },
                        showBorders: true,
                        export: {
                            enabled: true,
                            fileName: "Saldos"
                        },
                        filterRow: {
                            visible: true,
                        },
                        onCellClick: function (element) {

                            document.getElementById("divDetalles").innerHTML = `
                                <strong>Cliente:</strong> ${element.data.nombre} <br>
                                <strong>Observación:</strong> ${element.data.observacion} <br>
                            `;
                            let objetosEncontrados = data.detalle.filter(item => item.verificacion === element.data.id);
                            if (objetosEncontrados.length > 0) {
                                $("#contenidoTable").dxDataGrid({
                                    dataSource: objetosEncontrados,
                                    searchPanel: {
                                        visible: true,
                                        highlightCaseSensitive: false,
                                    },
                                    columnAutoWidth: true,
                                    paging: {
                                        enabled: false
                                    },
                                    pager: {
                                        showPageSizeSelector: true,
                                        allowedPageSizes: [5, 10, 15, 25, 50, 100],
                                    },
                                    columns: [
                                        {
                                            dataField: "tipodoc",
                                        },
                                        {
                                            dataField: "nodocumento",
                                        },
                                        {
                                            dataField: "serie",
                                        },
                                        {
                                            dataField: "fecha",
                                            dataType: "date"
                                        },
                                        {
                                            dataField: "confirmado",
                                        },
                                    ],
                                    showBorders: true,
                                    export: {
                                        enabled: true,
                                        fileName: "Saldos"
                                    },
                                    filterRow: {
                                        visible: true,
                                    },
                                });
                            } else {
                                $("#contenidoTable").dxDataGrid({
                                    dataSource: [],
                                    searchPanel: {
                                        visible: true,
                                        highlightCaseSensitive: false,
                                    },
                                    columnAutoWidth: true,
                                    paging: {
                                        enabled: false
                                    },
                                    pager: {
                                        showPageSizeSelector: true,
                                        allowedPageSizes: [5, 10, 15, 25, 50, 100],
                                    },
                                    showBorders: true,
                                    export: {
                                        enabled: true,
                                        fileName: "Saldos"
                                    },
                                    filterRow: {
                                        visible: true,
                                    },
                                });
                            }
                            $(`#modal_detalle`).modal("show");

                        },
                        columns: [
                            {
                                dataField: "id",
                                visible: false,
                            },
                            {
                                dataField: "nombre",
                                caption: "Cliente"
                            },
                            {
                                dataField: "observacion",
                            },
                            {
                                dataField: "fecha",
                                dataType: "date"
                            },
                        ],
                    });
                })
                .catch((error) => {
                    alert_nova.showNotification("Error de conexión, comuníquese con IT.", "warning", "danger");
                    console.error(error);
                    close_loading();
                });
        } else {
            alert_nova.showNotification("Debe ingresar fecha inicio y fin para poder buscar historial.", "warning", "danger");
        }
    }

})();
