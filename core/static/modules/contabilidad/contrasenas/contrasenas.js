(function () {
    window.inputOrden = document.getElementById('orden');
    window.selectEmpresa = document.getElementById('empresa');
    window.btnXML = document.getElementById('btnXML');
    window.fileXML = document.getElementById('fileXML');
    window.btnSave = document.getElementById('btnSave');
    window.divDescripcion = document.getElementById('divDescripcion');
    window.textDescripcion = document.getElementById('descripcion');
    window.valCSRF = document.getElementsByName('csrfmiddlewaretoken')[0].value;
    window.gridXML = null;
    window.boolLoadingXML = false;
    window.gridOrden = null;
    window.boolLoadingOrden = false;

    window.objFacturaXML = {
        fechaEmision: '',
        dateEmision: '',
        serie: '',
        numero: '',
        firma: '',
        nitEmisor: '',
        nombreEmisor: '',
        nitReceptor: '',
        nombreReceptor: '',
        detalles: [],
        total: 0,
    };

    window.objFacturaOrden = {
        nitEmisor: '',
        nombreEmisor: '',
        nitReceptor: '',
        nombreReceptor: '',
        detalles: [],
        total: 0,
    };

    window.resetFacturaXML = () => {
        objFacturaXML.fechaEmision = '';
        objFacturaXML.dateEmision = '';
        objFacturaXML.serie = '';
        objFacturaXML.numero = '';
        objFacturaXML.firma = '';
        objFacturaXML.nitEmisor = '';
        objFacturaXML.nombreEmisor = '';
        objFacturaXML.nitReceptor = '';
        objFacturaXML.nombreReceptor = '';
        objFacturaXML.total = 0;
        objFacturaXML.detalles = [];
    };

    window.resetFacturaOrden = () => {
        objFacturaOrden.nitEmisor = '';
        objFacturaOrden.nombreEmisor = '';
        objFacturaOrden.nitReceptor = '';
        objFacturaOrden.nombreReceptor = '';
        objFacturaOrden.total = 0;
        objFacturaOrden.detalles = [];
    };

    btnXML.onclick = () => {
        fileXML.click();
    };

    fileXML.onchange = (e) => {
        const archivo = e.target.files[0];
        open_loading();

        if (!archivo) {
            close_loading();
            return;
        }
        resetFacturaXML();
        showBtnSave(false);
        boolLoadingXML = false;
        document.getElementById('cardXML').style.display = '';

        const lector = new FileReader();

        lector.onload = function (event) {
            const xmlText = event.target.result;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const datosGenerales = xmlDoc.querySelector(`DatosGenerales`)
            const documento = xmlDoc.querySelector(`NumeroAutorizacion`)
            const emisor = xmlDoc.querySelector(`Emisor`)
            const receptor = xmlDoc.querySelector(`Receptor`)
            const detalles = xmlDoc.querySelectorAll(`Items`)
            const total = xmlDoc.querySelector(`GranTotal`)

            try {
                let strFechaEmision = datosGenerales.getAttribute('FechaHoraEmision');
                let strNumero = documento.getAttribute('Numero');
                let strSerie = documento.getAttribute('Serie');
                let strFirma = documento.innerHTML;
                let arrSplitFecha = strFechaEmision ? strFechaEmision.split('T') : [];
                let strFecha = strFechaEmision && arrSplitFecha.length > 1 ? arrSplitFecha[0] : "";
                let strHora = strFechaEmision && arrSplitFecha.length > 1 ? arrSplitFecha[1].split('-')[0] : "";
                let dateFecha = new Date(`${strFecha} ${strHora}`);
                let dateFechaEmision = dateTimeGTFormat.format(dateFecha);
                let strCodigoMoneda = datosGenerales.getAttribute('CodigoMoneda');
                let strNitEmisor = emisor.getAttribute('NITEmisor');
                let strNombreEmisor = emisor.getAttribute('NombreEmisor');
                let strNitReceptor = receptor.getAttribute('IDReceptor');
                let strNombreReceptor = receptor.getAttribute('NombreReceptor');
                let intTotal = parseFloat(total.innerHTML);
                const simboloMoneda = obtenerSimboloMoneda(strCodigoMoneda);

                objFacturaXML.fechaEmision = strFechaEmision ?? "";
                objFacturaXML.dateEmision = dateFechaEmision ?? "";
                objFacturaXML.serie = strSerie ?? "";
                objFacturaXML.numero = strNumero ?? "";
                objFacturaXML.firma = strFirma ?? "";
                objFacturaXML.nitEmisor = strNitEmisor ?? "";
                objFacturaXML.nombreEmisor = strNombreEmisor ?? "";
                objFacturaXML.nitReceptor = strNitReceptor ?? "";
                objFacturaXML.nombreReceptor = strNombreReceptor ?? "";
                objFacturaXML.total = intTotal;

                detalles.forEach(detalle => {
                    const arrDetail = [];
                    detalle.childNodes.forEach(value => {
                        if (value && typeof value.querySelector === "function") {
                            arrDetail.push({
                                cantidad: parseFloat(value.querySelector('Cantidad').innerHTML),
                                descripcion: value.querySelector('Descripcion').innerHTML,
                                precioUnitario: parseFloat(value.querySelector('PrecioUnitario').innerHTML),
                                total: parseFloat(value.querySelector('Total').innerHTML),
                            });
                        }
                    });
                    objFacturaXML.detalles = arrDetail;
                });

                for (let i = 0; i < selectEmpresa.options.length; i++) {
                    const strNit = selectEmpresa.options[i].getAttribute('data-nit');
                    if (strNit === strNitReceptor ?? "") {
                        selectEmpresa.selectedIndex = i;
                        break;
                    }
                }

                document.getElementById('divEmisorXML').innerHTML = `
                    <h2>Emisor</h2>
                    <strong>${objFacturaXML.nombreEmisor}</strong><br>
                    <strong>${objFacturaXML.nitEmisor}</strong><br>
                `;

                document.getElementById('divReceptorXML').innerHTML = `
                    <h2>Receptor</h2>
                    <strong>${objFacturaXML.nombreReceptor}</strong><br>
                    <strong>${objFacturaXML.nitReceptor}</strong><br>
                `;

                document.getElementById('divTotalXML').innerHTML = `
                    <hr>
                    <strong>Total: ${simboloMoneda}${formatoMonto(objFacturaXML.total)}</strong><br>
                `;

                gridXML = $('#divDetalleXML').dxDataGrid({
                    dataSource: objFacturaXML.detalles,
                    searchPanel: false,
                    columnAutoWidth: true,
                    paging: {
                        enabled: false
                    },
                    pager: {
                        showPageSizeSelector: true,
                        allowedPageSizes: [5, 10, 15, 25, 50, 100],
                    },
                    showBorders: true,
                    export: false,
                    filterRow: false,
                    onRowPrepared(e) {
                        if (e.rowType === "data") {
                            if (objFacturaOrden.detalles) {

                                let encontrado = false;
                                for (let i = 0; i < objFacturaOrden.detalles.length; i++) {
                                    const detalle = objFacturaOrden.detalles[i];
                                    if (
                                        // detalle.descripcion === e.data.descripcion &&
                                        // parseFloat(detalle.precioUnitario) === parseFloat(e.data.precioUnitario) &&
                                        // parseFloat(detalle.cantidad) === parseFloat(e.data.cantidad) &&
                                        parseFloat(detalle.total) === parseFloat(e.data.total)
                                    ) {
                                        encontrado = true;
                                        break;
                                    }
                                }

                                e.rowElement[0].style.setProperty('color', 'white');
                                e.rowElement[0].style.setProperty('font-weight', 'bold');
                                e.rowElement[0].style.setProperty('background', (encontrado) ? 'green' : 'red');

                            }
                        }
                    },
                    onContentReady() {
                        if (boolLoadingOrden && !boolLoadingXML) {
                            gridOrden.refresh();
                            verifyOrdenVsXML();
                        }
                        boolLoadingXML = true;
                    },
                    columns: [
                        {
                            dataField: "cantidad",
                            dataType: "number",
                        },
                        {
                            dataField: "descripcion",
                        },
                        {
                            dataField: "precioUnitario",
                            dataType: "number",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: strCodigoMoneda
                            }
                        },
                        {
                            dataField: "total",
                            dataType: "number",
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: strCodigoMoneda
                            }
                        },
                    ],
                }).dxDataGrid("instance");

            } catch (error) {
                console.error(error);
                alert_nova.showNotification(`Error al cargar el XML: <br> ${error}`, "warning", "danger");
            }
            close_loading();
        };

        lector.readAsText(archivo);
    };

    window.getOrden = () => {
        if (inputOrden.value.trim() !== "" && selectEmpresa.value.trim() !== "") {
            document.getElementById('cardOrden').style.display = '';
            showBtnSave(false);
            resetFacturaOrden();
            boolLoadingOrden = false;
            open_loading();
            const data = new FormData();
            data.append("csrfmiddlewaretoken", valCSRF);
            data.append("orden", inputOrden.value);
            data.append("empresa", selectEmpresa.value);
            data.append("nit_proveedor", objFacturaXML.nitEmisor);

            fetch(urlGetOrden, {
                method: "POST",
                body: data,
            })
                .then(response => response.json())
                .then((data) => {
                    close_loading();

                    objFacturaOrden.nombreEmisor = data.orden?.nombreEmisor ?? "";
                    objFacturaOrden.nitEmisor = data.orden?.nitEmisor ?? "";
                    objFacturaOrden.nombreReceptor = data.orden?.nombreReceptor ?? "";
                    objFacturaOrden.nitReceptor = data.orden?.nitReceptor ?? "";
                    objFacturaOrden.total = parseFloat(data.orden?.total ?? 0);
                    objFacturaOrden.detalles = data.detalle ?? [];

                    document.getElementById('divEmisorOrden').innerHTML = `
                        <h2>Emisor</h2>
                        <strong>${objFacturaOrden.nombreEmisor}</strong><br>
                        <strong>${objFacturaOrden.nitEmisor}</strong><br>
                    `;

                    document.getElementById('divReceptorOrden').innerHTML = `
                        <h2>Receptor</h2>
                        <strong>${objFacturaOrden.nombreReceptor}</strong><br>
                        <strong>${objFacturaOrden.nitReceptor}</strong><br>
                    `;

                    document.getElementById('divTotalOrden').innerHTML = `
                        <hr>
                        <strong>Total: ${formatoMonto(objFacturaOrden.total)}</strong><br>
                    `;

                    gridOrden = $('#divDetalleOrden').dxDataGrid({
                        dataSource: objFacturaOrden.detalles,
                        searchPanel: false,
                        columnAutoWidth: true,
                        paging: {
                            enabled: false
                        },
                        pager: {
                            showPageSizeSelector: true,
                            allowedPageSizes: [5, 10, 15, 25, 50, 100],
                        },
                        showBorders: true,
                        export: false,
                        filterRow: false,
                        onRowPrepared(e) {
                            if (e.rowType === "data") {
                                if (objFacturaXML.detalles) {

                                    let encontrado = false;
                                    for (let i = 0; i < objFacturaXML.detalles.length; i++) {
                                        const detalle = objFacturaXML.detalles[i];
                                        if (
                                            // detalle.descripcion === e.data.descripcion &&
                                            // parseFloat(detalle.precioUnitario) === parseFloat(e.data.precioUnitario) &&
                                            // parseFloat(detalle.cantidad) === parseFloat(e.data.cantidad) &&
                                            parseFloat(detalle.total) === parseFloat(e.data.total)
                                        ) {
                                            encontrado = true;
                                            break;
                                        }
                                    }

                                    e.rowElement[0].style.setProperty('color', 'white');
                                    e.rowElement[0].style.setProperty('font-weight', 'bold');
                                    e.rowElement[0].style.setProperty('background', (encontrado) ? 'green' : 'red');
                                }
                            }
                        },
                        onContentReady() {
                            if (boolLoadingXML && !boolLoadingOrden) {
                                gridXML.refresh();
                                verifyOrdenVsXML();
                            }
                            boolLoadingOrden = true;
                        },
                        columns: [
                            {
                                dataField: "cantidad",
                                dataType: "number",
                            },
                            {
                                dataField: "descripcion",
                            },
                            {
                                dataField: "precioUnitario",
                                dataType: "number",
                                format: {
                                    type: "currency",
                                    precision: 2,
                                    currency: "GTQ"
                                }
                            },
                            {
                                dataField: "total",
                                dataType: "number",
                                format: {
                                    type: "currency",
                                    precision: 2,
                                    currency: "GTQ"
                                }
                            },
                        ],
                    }).dxDataGrid("instance");

                    if (data.error) {
                        alert_nova.showNotification(data.error, "warning", "danger");
                    }
                    else if (!data.orden) {
                        alert_nova.showNotification("Orden no encontrada.", "warning", "danger");
                    }

                })
                .catch((error) => {
                    alert_nova.showNotification("Error de conexión, comuníquese con IT.", "warning", "danger");
                    console.error(error);
                    close_loading();
                });
        }
    };

    window.verifyOrdenVsXML = () => {
        if (objFacturaOrden.detalles.length && objFacturaXML.detalles.length) {
            textDescripcion.value = "";

            let strMsjError = "";
            if (objFacturaXML.total > 0 && objFacturaOrden.total > 0 && !validarDiferencia(objFacturaXML.total, objFacturaOrden.total)) {
                strMsjError += `El monto total de la factura y la orden no son el mismo. <br>`;
            }
            if (objFacturaXML.nitReceptor.replace('-', '').trim() !== objFacturaOrden.nitReceptor.replace('-', '').trim()) {
                strMsjError += `El NIT Receptor de la factura y la orden no son el mismo. <br>`;
            }
            if (objFacturaXML.nitEmisor.replace('-', '').trim() !== objFacturaOrden.nitEmisor.replace('-', '').trim()) {
                strMsjError += `El NIT Emisor de la factura y la orden no son el mismo. <br>`;
            }

            if (strMsjError !== "") {
                alert_nova.showNotification(`Tiene los siguientes errores:<br><br> ${strMsjError}`, "warning", "danger");
                showBtnSave(false);
            } else {
                showBtnSave(true);
            }

        }
    };

    window.validarDiferencia = (num1, num2) => {
        const diferencia = Math.abs(num1 - num2);
        return diferencia <= 0.05;
    };

    window.showBtnSave = (boolShow) => {
        if (boolShow) {
            btnSave.style.removeProperty('display');
            divDescripcion.style.removeProperty('display');
        } else {
            btnSave.style.setProperty('display', 'none');
            divDescripcion.style.setProperty('display', 'none');
        }
    };

    window.processContrasena = () => {
        open_loading();
        const data = new FormData();
        data.append("csrfmiddlewaretoken", valCSRF);
        data.append("nitEmisor", objFacturaXML.nitEmisor.replace('-', ''));
        data.append("nitReceptor", objFacturaOrden.nitReceptor.replace('-', ''));
        data.append("codigoEmpresa", selectEmpresa.value);
        data.append("serieFact", objFacturaXML.serie);
        data.append("noFact", objFacturaXML.numero);
        data.append("fechaFac", objFacturaXML.fechaEmision);
        data.append("descripcion", textDescripcion.value);
        data.append("total", objFacturaXML.total);
        data.append("orden", inputOrden.value);

        fetch(urlSaveContrasena, {
            method: "POST",
            body: data,
        })
            .then(response => response.json())
            .then((data) => {
                close_loading();
                if (data.status) {
                    alert_nova.showNotification(`Contraseña ingresada.`, "add_alert", "success");
                    window.open(urlPdfContrasena.replace('/0/', `/${data.contrasena}/`).replace('/1/', `/${data.empresa}/`));
                    showBtnSave(false);
                    setTimeout( () => {
                        window.location.reload();
                    }, 1000);
                } else {
                    alert_nova.showNotification(`Ocurrio un error al grabar la contraseña: <br><br>${data.error}`, "warning", "danger");
                }
            })
            .catch((error) => {
                alert_nova.showNotification("Error de conexión, comuníquese con IT.", "warning", "danger");
                console.error(error);
                close_loading();
            });

    };

    inputOrden.addEventListener('change', getOrden);
    selectEmpresa.addEventListener('change', getOrden);
    btnSave.addEventListener('click', () => {
        dialogConfirm(processContrasena);
    });

})();