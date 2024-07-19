(function () {
    window.spanNombre = document.getElementById('spanNombre');
    window.spanSerie = document.getElementById('spanSerie');
    window.spanNumero = document.getElementById('spanNumero');
    window.spanTotal = document.getElementById('spanTotal');
    window.inputNombre = document.getElementById('nombre');
    window.inputSerie = document.getElementById('serie');
    window.inputNumero = document.getElementById('numero');
    window.inputTotal = document.getElementById('total');
    window.inputNoFactura = document.getElementById('NoFactura');
    window.inputNoCliente = document.getElementById('NoCliente');
    window.inputCodigoCliente = document.getElementById('CodigoCliente');
    window.numberFormatCurrency = new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ',
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    });

    window.clickAdjunto = () => {
        document.getElementById('adjunto').click();
    };

    window.searchPedido = () => {
        const intDocumento = document.getElementById('documento').value;
        const intEmpresa = document.getElementById('empresa').value;
        if (intDocumento !== "" && intEmpresa !== "") {
            open_loading();
            const data = new FormData();
            data.append('documento', intDocumento);
            data.append('empresa', intEmpresa);

            fetch(strUrlSearchReclamos, {
                method: 'POST',
                body: data,
                headers: {"X-CSRFToken": getCookie('csrftoken')},
            })
                .then(response => response.json())
                .then(async (data) => {
                    if (!data.datos_pedido) {
                        data.datos_pedido = {
                            pedido: {
                                Nombre: "",
                                Numero: "",
                                Serie: "",
                                Total: "",
                                NoFactura: "",
                                NoCliente: "",
                                CodigoCliente: "",
                            }
                        };
                    }
                    close_loading();
                    if (data.status) {
                        document.querySelectorAll(`.no-existe-reclamo`).forEach((e) => e.classList.remove('no-existe-reclamo'));
                        alert_nova.showNotification(data.msg, "add_alert", "success");

                        spanNombre.innerText = `${data.datos_pedido.pedido.CodigoCliente} ${data.datos_pedido.pedido.Nombre}`;
                        spanNumero.innerText = data.datos_pedido.pedido.Numero;
                        spanSerie.innerText = data.datos_pedido.pedido.Serie;
                        spanTotal.innerText = numberFormatCurrency.format(data.datos_pedido.pedido.Total);

                        inputNoFactura.value = data.datos_pedido.pedido.NoFactura;
                        inputNoCliente.value = data.datos_pedido.pedido.NoCliente;
                        inputCodigoCliente.value = data.datos_pedido.pedido.CodigoCliente;
                        inputNombre.value = data.datos_pedido.pedido.Nombre;
                        inputNumero.value = data.datos_pedido.pedido.Numero;
                        inputSerie.value = data.datos_pedido.pedido.Serie;
                        inputTotal.value = data.datos_pedido.pedido.Total;

                        const tBodyDetalles = document.getElementById('tBodyDetalles');
                        tBodyDetalles.innerHTML = '';
                        let intRow = 1;
                        for (let key in data.datos_pedido.detalles) {

                            const arrDetalle = data.datos_pedido.detalles[key];
                            if (!arrDetalle.NoContenedor) arrDetalle.NoContenedor = "";
                            if (!arrDetalle.observaciones) arrDetalle.observaciones = "";
                            if (!arrDetalle.reclamado) arrDetalle.reclamado = false;
                            const row = tBodyDetalles.insertRow(tBodyDetalles.children.length);

                            const cell0 = row.insertCell(0);
                            const cell1 = row.insertCell(1);
                            const cell2 = row.insertCell(2);
                            const cell3 = row.insertCell(3);
                            const cell4 = row.insertCell(4);
                            const cell5 = row.insertCell(5);
                            const cell6 = row.insertCell(6);
                            const cell7 = row.insertCell(7);
                            const cell8 = row.insertCell(8);
                            const cell9 = row.insertCell(9);

                            let attributes = {};
                            if (arrDetalle.reclamado) {
                                attributes.checked = "checked";
                            }
                            let objOptions = {
                                element: 'input',
                                id: `reclamado_${intRow}`,
                                name: `reclamado[]`,
                                classes: ["form-control"],
                                type: 'checkbox',
                                attributes: attributes,
                            };

                            let objCheckbox = await createElement(objOptions);
                            objCheckbox.onchange = (e) => {
                                saveReclamoDetalle('reclamado', e.target.checked, arrDetalle.id ?? 0, arrDetalle.Linea, arrDetalle.Descripcion);
                            };
                            cell0.appendChild(objCheckbox);

                            objOptions = {
                                element: 'input',
                                id: `detalle_id_${intRow}`,
                                name: `detalle_id[]`,
                                type: 'hidden',
                                attributes: {
                                    'data-int-row': intRow,
                                }
                            };

                            let objInputHidden = await createElement(objOptions);
                            cell0.appendChild(objInputHidden);

                            objOptions = {
                                element: 'input',
                                id: `linea_${intRow}`,
                                name: `linea[]`,
                                type: 'hidden',
                                attributes: {
                                    'data-int-row': intRow,
                                },
                                value: arrDetalle.Linea,
                            };

                            objInputHidden = await createElement(objOptions);
                            cell0.appendChild(objInputHidden);

                            objOptions = {
                                element: 'input',
                                id: `noproducto_${intRow}`,
                                name: `noproducto[]`,
                                classes: ["form-control"],
                                type: 'hidden',
                                value: arrDetalle.NoProducto,
                            };

                            objInputHidden = await createElement(objOptions);
                            cell0.appendChild(objInputHidden);
                            cell1.innerText = arrDetalle.NoProducto;
                            cell2.innerText = arrDetalle.CodigoProducto;
                            cell3.innerText = arrDetalle.Descripcion;
                            cell4.innerText = arrDetalle.NoContenedor;
                            cell5.innerText = arrDetalle.Disponibilidad;
                            cell5.classList.add('text-right');

                            objOptions = {
                                element: 'input',
                                id: `cantidad_${intRow}`,
                                name: `cantidad[]`,
                                classes: ["form-control"],
                                type: 'number',
                                value: arrDetalle.cantidad ?? 0,
                            };

                            const objInputNumber = await createElement(objOptions);
                            objInputNumber.onchange = (e) => {
                                saveReclamoDetalle('cantidad', e.target.value, arrDetalle.id ?? 0, arrDetalle.Linea);
                            };
                            cell6.appendChild(objInputNumber);
                            cell7.innerText = numberFormatCurrency.format(arrDetalle.VUnitario);
                            cell7.classList.add('text-right');
                            cell8.innerText = numberFormatCurrency.format(arrDetalle.Total);
                            cell8.classList.add('text-right');

                            objOptions = {
                                element: 'textarea',
                                id: `detalle_observaciones_${intRow}`,
                                name: `detalle_observaciones[]`,
                                value: arrDetalle.observaciones,
                                classes: ["form-control"],
                                styles: {
                                    "height": 'auto'
                                },
                                attributes: {
                                    "rows": '2',
                                },
                            };
                            let objTextarea = await createElement(objOptions);
                            objTextarea.onchange = (e) => {
                                saveReclamoDetalle('observaciones', e.target.value, arrDetalle.id ?? 0, arrDetalle.Linea);
                            };
                            cell9.appendChild(objTextarea);
                            intRow++;
                        }

                    } else {
                        alert_nova.showNotification(data.msg, "warning", "danger");
                    }

                })
                .catch((error) => {
                    alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                    console.error(error);
                    close_loading();
                });
        }
    };

    $("#empresa").select2();

    $('#estatus').select2({
        tags: true,
        placeholder: "Seleccione o escriba una opción"
    }).on('select2:select', function (e) {
        if (e.params.data.element === undefined) {
            let selectedValue = $(this).val();
            open_loading();
            const data = new FormData();
            data.append('nombre', selectedValue);

            fetch(strUrlSaveReclamosEstatus, {
                method: 'POST',
                body: data,
                headers: {"X-CSRFToken": getCookie('csrftoken')},
            })
                .then(response => response.json())
                .then((data) => {
                    close_loading();
                    if (data.status) {
                        alert_nova.showNotification(data.msg, "add_alert", "success");
                        let newOption = new Option(selectedValue, data.id, true, true);
                        $('#estatus').append(newOption).trigger('change');
                        if (boolCanChange) saveReclamo("estatus_id", data.id);
                    } else {
                        alert_nova.showNotification(data.msg, "warning", "danger");
                    }

                })
                .catch((error) => {
                    alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                    console.error(error);
                    close_loading();
                });
        } else {
            if (boolCanChange) saveReclamo("estatus_id", $(this).val());
        }
    });

    $('#resolucion').select2({
        tags: true,
        placeholder: "Seleccione o escriba una opción"
    }).on('select2:select', function (e) {
        if (e.params.data.element === undefined) {
            let selectedValue = $(this).val();
            open_loading();
            const data = new FormData();
            data.append('nombre', selectedValue);

            fetch(strUrlSaveReclamosResolucion, {
                method: 'POST',
                body: data,
                headers: {"X-CSRFToken": getCookie('csrftoken')},
            })
                .then(response => response.json())
                .then((data) => {
                    close_loading();
                    if (data.status) {
                        alert_nova.showNotification(data.msg, "add_alert", "success");
                        let newOption = new Option(selectedValue, data.id, true, true);
                        $('#resolucion').append(newOption).trigger('change');
                        if (boolCanChange) saveReclamo("resolucion_id", data.id);
                    } else {
                        alert_nova.showNotification(data.msg, "warning", "danger");
                    }

                })
                .catch((error) => {
                    alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                    console.error(error);
                    close_loading();
                });
        } else {
            if (boolCanChange) saveReclamo("resolucion_id", $(this).val());
        }
    });

    $('#riesgo').select2({
        tags: true,
        placeholder: "Seleccione o escriba una opción"
    }).on('select2:select', function (e) {
        if (e.params.data.element === undefined) {
            let selectedValue = $(this).val();
            open_loading();
            const data = new FormData();
            data.append('nombre', selectedValue);

            fetch(strUrlSaveReclamosRiesgos, {
                method: 'POST',
                body: data,
                headers: {"X-CSRFToken": getCookie('csrftoken')},
            })
                .then(response => response.json())
                .then((data) => {
                    close_loading();
                    if (data.status) {
                        alert_nova.showNotification(data.msg, "add_alert", "success");
                        let newOption = new Option(selectedValue, data.id, true, true);
                        $('#riesgo').append(newOption).trigger('change');
                        if (boolCanChange) saveReclamo("riesgo_id", data.id);
                    } else {
                        alert_nova.showNotification(data.msg, "warning", "danger");
                    }

                })
                .catch((error) => {
                    alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                    console.error(error);
                    close_loading();
                });
        } else {
            if (boolCanChange) saveReclamo("riesgo_id", $(this).val());
        }
    });

    window.saveAdjunto = () => {
        const fileAdjunto = document.getElementById('adjunto');
        open_loading();
        const formData = new FormData();
        formData.append('adjunto', fileAdjunto.files[0])
        formData.append('reclamo_id', intReclamoId)
        formData.append('NoFactura', inputNoFactura.value)
        formData.append('NoCliente', inputNoCliente.value)
        formData.append('CodigoCliente', inputCodigoCliente.value)
        formData.append('Serie', inputSerie.value);
        formData.append('Numero', inputNumero.value);

        fetch(strUrlSaveReclamosAdjuntos, {
            method: 'POST',
            body: formData,
            headers: {"X-CSRFToken": getCookie('csrftoken')},
        })
            .then(response => response.json())
            .then(async (data) => {
                if (!data.nombre) data.nombre = "";
                if (!data.tipo_adjunto) data.tipo_adjunto = "";
                if (!data.created_at) data.created_at = "";
                if (!data.reclamo_id) data.reclamo_id = 0;
                close_loading();
                if (data.status) {
                    alert_nova.showNotification(data.msg, "add_alert", "success");
                    if (intReclamoId === 0) {
                        intReclamoId = data.reclamo_id;
                    }

                    const tBodyAdjuntos = document.getElementById(`tBodyAdjuntos`);

                    const row = tBodyAdjuntos.insertRow(tBodyAdjuntos.children.length);
                    const intRow = (tBodyAdjuntos.children.length + 1);

                    const cell0 = row.insertCell(0);
                    const cell1 = row.insertCell(1);
                    const cell2 = row.insertCell(2);
                    const cell3 = row.insertCell(3);
                    const cell4 = row.insertCell(4);

                    let objOptions = {
                        element: 'input',
                        id: `adjunto_id_${intRow}`,
                        name: `adjunto_id[]`,
                        type: 'hidden',
                    };

                    let objInputHidden = await createElement(objOptions);
                    cell0.appendChild(objInputHidden);

                    objOptions = {
                        element: 'input',
                        id: `revisado_${intRow}`,
                        name: `revisado[]`,
                        classes: ["form-control"],
                        type: 'checkbox',
                    };

                    let objCheckbox = await createElement(objOptions);
                    objCheckbox.onchange = (e) => {
                        saveAdjuntoRevisado(e.target.checked, data.id ?? 0);
                    };
                    cell0.appendChild(objCheckbox);

                    cell1.innerText = data.nombre;

                    objOptions = {
                        element: 'a',
                        href: `http://localhost:8000/media/${data.adjunto}`,
                        download: data.nombre,
                        attributes: {
                            target: `_blank`
                        }
                    };

                    let objDownload = await createElement(objOptions);
                    objDownload.innerHTML = `${data.nombre}<span class="material-icons">file_save</span>`;
                    cell2.appendChild(objDownload);
                    cell3.innerText = data.tipo_adjunto;
                    cell4.innerText = data.created_at;

                } else {
                    alert_nova.showNotification(data.msg, "warning", "danger");
                }

            })
            .catch((error) => {
                alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                console.error(error);
                close_loading();
            });
    };

    window.saveReclamo = (strField, strValue) => {
        try {
            open_loading();
            const formData = new FormData();
            formData.append('identificador', strField);
            formData.append(strField, strValue);
            formData.append('reclamo_id', intReclamoId);
            formData.append('NoFactura', inputNoFactura.value);
            formData.append('NoCliente', inputNoCliente.value);
            formData.append('CodigoCliente', inputNoCliente.value);
            formData.append('Serie', inputSerie.value);
            formData.append('Numero', inputNumero.value);

            if (intReclamoId === 0) {
                document.querySelectorAll(`input[name="detalle_id[]"]`).forEach((e) => {
                    const intRow = e.getAttribute('data-int-row');
                    formData.append('detalle_id[]', '0');
                    formData.append('linea[]', document.getElementById(`linea_${intRow}`).value);
                    formData.append('noproducto[]', document.getElementById(`noproducto_${intRow}`).value);
                    formData.append('reclamado[]', document.getElementById(`reclamado_${intRow}`).checked);
                    formData.append('observaciones[]', document.getElementById(`detalle_observaciones_${intRow}`).value);
                });
            }

            fetch(strUrlSaveReclamos, {
                method: 'POST',
                body: formData,
                headers: {"X-CSRFToken": getCookie('csrftoken')},
            })
                .then(response => response.json())
                .then((data) => {
                    close_loading();
                    if (data.status) {
                        alert_nova.showNotification(data.msg, "add_alert", "success");
                        if (intReclamoId === 0) {
                            simple_redireccion(strUrlReclamos.replace('0', data.id));
                        }
                    } else {
                        alert_nova.showNotification(data.msg, "warning", "danger");
                    }

                })
                .catch((error) => {
                    alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                    console.error(error);
                    close_loading();
                });
        } catch (error) {
            console.error(error);
            alert_nova.showNotification(`Ocurrió un error inesperado. Intente de nuevo si el error continua, contacte a TI.`, "warning", "danger");
            close_loading();
        }
    };

    window.saveReclamoDetalle = (strField, strValue, intID, intLinea, strExtraValue = null) => {
        open_loading();
        const formData = new FormData();
        formData.append('id', intID)
        formData.append('linea', intLinea)
        formData.append('identificador', strField)
        formData.append(strField, strValue)
        if (strExtraValue) formData.append("extra", strExtraValue)
        formData.append('reclamo_id', intReclamoId)
        formData.append('NoFactura', inputNoFactura.value)
        formData.append('NoCliente', inputNoCliente.value)
        formData.append('CodigoCliente', inputCodigoCliente.value)
        formData.append('Serie', inputSerie.value);
        formData.append('Numero', inputNumero.value);

        if (intReclamoId === 0) {
            document.querySelectorAll(`input[name="detalle_id[]"]`).forEach((e) => {
                const intRow = e.getAttribute('data-int-row');
                formData.append('detalle_id[]', '0');
                formData.append('linea[]', document.getElementById(`linea_${intRow}`).value);
                formData.append('noproducto[]', document.getElementById(`noproducto_${intRow}`).value);
                formData.append('reclamado[]', document.getElementById(`reclamado_${intRow}`).checked);
                formData.append('observaciones[]', document.getElementById(`detalle_observaciones_${intRow}`).value);
            });
        }

        fetch(strUrlSaveReclamosDetalle, {
            method: 'POST',
            body: formData,
            headers: {"X-CSRFToken": getCookie('csrftoken')},
        })
            .then(response => response.json())
            .then((data) => {
                close_loading();
                if (data.status) {
                    alert_nova.showNotification(data.msg, "add_alert", "success");
                    if (intReclamoId === 0) {
                        simple_redireccion(strUrlReclamos.replace('0', data.id));
                    }
                } else {
                    alert_nova.showNotification(data.msg, "warning", "danger");
                }

            })
            .catch((error) => {
                alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                console.error(error);
                close_loading();
            });
    };

    window.saveAdjuntoRevisado = (boolChecked, intID) => {
        open_loading();
        const formData = new FormData();
        formData.append('id', intID)
        formData.append('revisado', boolChecked)
        formData.append('reclamo_id', intReclamoId)

        fetch(strUrlSaveReclamosAdjuntoRevisado, {
            method: 'POST',
            body: formData,
            headers: {"X-CSRFToken": getCookie('csrftoken')},
        })
            .then(response => response.json())
            .then((data) => {
                close_loading();
                if (data.status) {
                    alert_nova.showNotification(data.msg, "add_alert", "success");
                } else {
                    alert_nova.showNotification(data.msg, "warning", "danger");
                }

            })
            .catch((error) => {
                alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                console.error(error);
                close_loading();
            });
    };

    window.getHistorial = () => {
        open_loading();
        const formData = new FormData();
        formData.append('reclamo_id', intReclamoId);

        fetch(strUrlGetHistorial, {
            method: 'POST',
            body: formData,
            headers: {"X-CSRFToken": getCookie('csrftoken')},
        })
            .then(response => response.json())
            .then(async (data) => {
                if (!data.historial) data.historial = [];
                close_loading();

                if (data.status) {

                    const bodyModal = document.getElementById(`mdlHistorial`);
                    bodyModal.innerHTML = '';

                    for (let key in data.historial) {
                        const arrHistorial = data.historial[key];
                        if (!arrHistorial) {
                            arrHistorial.usuario = "";
                            arrHistorial.fecha = "";
                            arrHistorial.identificador = null;
                            arrHistorial.valor_anterior = null;
                            arrHistorial.valor_nuevo = null;
                        }

                        let objOptions = {
                            element: 'div',
                            classes: ['row'],
                            styles: {
                                "margin-bottom": '10px',
                                "border-bottom": '1px solid #e6e6e6',
                                "padding": '10px 0',
                            }
                        };
                        let objDivRow = await createElement(objOptions);

                        objOptions = {
                            element: 'div',
                            classes: ['col-4', 'text-center'],
                            styles: {
                                'font-weight': 'bold'
                            }
                        };
                        let objDivCol12 = await createElement(objOptions);
                        if (arrHistorial.identificador === "reclamos_detalles_reclamado") {
                            if (!arrHistorial.valor_nuevo) {
                                objDivCol12.innerText = "Se quito el reclamo del producto";
                            } else {
                                objDivCol12.innerText = arrHistorial.log;
                            }
                        } else {
                            objDivCol12.innerText = arrHistorial.log;
                        }
                        objDivRow.appendChild(objDivCol12);

                        objOptions = {
                            element: 'div',
                            classes: ['col-4', 'text-center'],
                            styles: {
                                "white-space": 'nowrap',
                                "text-overflow": 'ellipsis',
                                "overflow": 'hidden',
                            },
                        };
                        objDivCol12 = await createElement(objOptions);
                        if (arrHistorial.identificador !== "insert_reclamo") {
                            if (arrHistorial.identificador === "reclamos_detalles_reclamado") {
                                if (arrHistorial.valor_anterior && !arrHistorial.valor_nuevo) {
                                    objDivCol12.innerText = arrHistorial.valor_anterior;
                                } else {
                                    objDivCol12.innerText = arrHistorial.valor_nuevo;
                                }
                            } else {
                                if (arrHistorial.valor_anterior) {
                                    objDivCol12.innerHTML = `${arrHistorial.valor_anterior} <hr> ${arrHistorial.valor_nuevo ?? ""}`;
                                } else {
                                    objDivCol12.innerText = arrHistorial.valor_nuevo;
                                }
                            }
                        } else {
                            objDivCol12.innerText = '';
                        }
                        objDivRow.appendChild(objDivCol12);

                        objOptions = {
                            element: 'div',
                            classes: ['col-4', 'text-center']
                        };
                        objDivCol12 = await createElement(objOptions);
                        objDivCol12.innerHTML = `${arrHistorial.usuario}<br>${arrHistorial.fecha}`;
                        objDivRow.appendChild(objDivCol12);

                        bodyModal.appendChild(objDivRow);
                    }

                    $(`#modal_historial`).modal('show');

                } else {
                    alert_nova.showNotification(data.msg, "warning", "danger");
                }

            })
            .catch((error) => {
                alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                console.error(error);
                close_loading();
            });
    };

    window.cerrarReclamo = () => {
        try {
            open_loading();
            const data = new FormData();
            data.append('reclamo_id', intReclamoId)

            fetch(strUrlCerrarReclamos, {
                method: 'POST',
                body: data,
                headers: {"X-CSRFToken": getCookie('csrftoken')},
            })
                .then(response => response.json())
                .then((data) => {
                    close_loading();
                    if (data.status) {
                        alert_nova.showNotification(data.msg, "add_alert", "success");
                        simple_redireccion(strUrlReclamos.replace('0', intReclamoId));
                    } else {
                        alert_nova.showNotification(data.msg, "warning", "danger");
                    }

                })
                .catch((error) => {
                    alert_nova.showNotification(`Ocurrió un error inesperado. Revise su conexión a internet o contacte a TI.`, "warning", "danger");
                    console.error(error);
                    close_loading();
                });
        } catch (error) {
            console.error(error);
            alert_nova.showNotification(`Ocurrió un error inesperado. Intente de nuevo si el error continua, contacte a TI.`, "warning", "danger");
            close_loading();
        }
    };

    window.showNotificacion = (boolShow) => {
        const fecha = document.getElementById('fecha_notificacion');
        const como = document.getElementById('como_notifico');
        const persona = document.getElementById('persona_notificada');
        const notificado = document.getElementById('notificado_por');

        if (boolShow) {
            fecha.removeAttribute('readonly');
            como.removeAttribute('readonly');
            persona.removeAttribute('readonly');
            notificado.removeAttribute('readonly');
        } else {
            fecha.setAttribute('readonly', 'readonly');
            como.setAttribute('readonly', 'readonly');
            persona.setAttribute('readonly', 'readonly');
            notificado.setAttribute('readonly', 'readonly');
        }

    };

})();