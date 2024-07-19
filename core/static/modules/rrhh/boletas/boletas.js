(function () {

    window.getPeriodos = (strSqlBase, strNoEmpresa, strBase, strNoEmpleado, intBase) => {
        const cardEmpleados = window.document.querySelectorAll(`.cardEmpleados`),
            csrftoken = getCookie('csrftoken'),
            formData = new FormData(),
            divContenido = window.document.getElementById('contenido'),
            divMdlFirma = window.document.getElementById('mdlFirma'),
            btnPrint = window.document.getElementById('btnPrint');

        cardEmpleados.forEach(element => {
            element.style.background = '';
        });
        window.document.getElementById(`${strSqlBase}_${strNoEmpleado}_${strNoEmpresa}`).style.background = 'aliceblue';
        formData.append('base', strSqlBase);
        formData.append('no_empresa', strNoEmpresa);
        formData.append('no_empleado', strNoEmpleado);

        open_loading();
        fetch(window.strUrlGetPeriodos, {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            body: formData,
        })
            .then(response => response.json())
            .then(async (data) => {
                close_loading();
                if (divContenido) {
                    divContenido.innerHTML = '';
                    let objOptions = {
                        element: 'div',
                        classes: ["row"],
                    };
                    let objDivRow = await createElement(objOptions);
                    objOptions = {
                        element: 'div',
                        classes: ["col-md-12", "text-center"],
                        styles: {
                            "font-weight": "bold",
                        }
                    };
                    let objDivCol = await createElement(objOptions);
                    objDivCol.innerText = `${strBase} \n${strNoEmpleado} \n\n`;
                    objDivRow.appendChild(objDivCol);

                    for (let key in data.periodos) {
                        const objPeriodo = data.periodos[key];
                        objOptions = {
                            element: 'div',
                            classes: ["col-md-3", "text-center"],
                            styles: {
                                "margin-bottom": "15px",
                            }
                        };
                        objDivCol = await createElement(objOptions);

                        const strClass = (typeof objPeriodo.recibo === 'undefined' || objPeriodo.recibo === null) ? "btn-outline-danger" : "btn-outline-success";
                        objOptions = {
                            element: 'button',
                            classes: ["btn", strClass],
                            type: "button",
                        };
                        let objDivButton = await createElement(objOptions);
                        let strTipoPeriodo = "";
                        switch (objPeriodo.Tipo_Periodo) {
                            case "Q":
                                strTipoPeriodo = "QUINCENA";
                                break;
                            case "M":
                                strTipoPeriodo = "FIN DE MES";
                                break;
                            case "A":
                                strTipoPeriodo = "AGUINALDO";
                                break;
                            case "E":
                                strTipoPeriodo = "ESPECIAL";
                                break;
                            case "B":
                                strTipoPeriodo = "BONO 14";
                                break;
                        }
                        objDivButton.innerText = `${strTipoPeriodo} \n${objPeriodo.Fecha}`;
                        objDivButton.onclick = () => {
                            divMdlFirma.innerHTML = '';
                            const csrftoken = getCookie('csrftoken'),
                                formData = new FormData();
                            formData.append('base', strSqlBase);
                            formData.append('no_empresa', strNoEmpresa);
                            formData.append('no_empleado', strNoEmpleado);
                            formData.append('periodo', objPeriodo.No_Periodo);

                            open_loading();
                            fetch(window.strUrlGetBoleta, {
                                method: 'POST',
                                headers: {'X-CSRFToken': csrftoken},
                                body: formData,
                            })
                                .then(response => response.text())
                                .then(async (strHtml) => {
                                    close_loading();
                                    divMdlFirma.innerHTML = strHtml.toString();

                                    let requestAnimFrame;
                                    if (!(typeof objPeriodo.recibo === 'undefined' || objPeriodo.recibo === null)) {
                                        btnPrint.style.display = '';
                                    } else {
                                        if (divMdlFirma.querySelector('#divImage')) {
                                            btnPrint.style.display = 'none';
                                            objOptions = {
                                                element: 'div',
                                                classes: ["row"],
                                            };
                                            objDivRow = await createElement(objOptions);
                                            objOptions = {
                                                element: 'div',
                                                classes: ["col-md-12", "text-center"],
                                                styles: {
                                                    "font-weight": "bold",
                                                }
                                            };
                                            objDivCol = await createElement(objOptions);

                                            const canvasWidth = isMobile ? window.innerWidth * 0.7 : 650,
                                                canvasHeight = isMobile ? window.innerHeight * 0.5 : 360;

                                            objOptions = {
                                                element: 'canvas',
                                                id: 'canvas',
                                                attributes: {
                                                    width: canvasWidth,
                                                    height: canvasHeight,
                                                },
                                                styles: {
                                                    border: "1px solid black",
                                                    cursor: "crosshair",
                                                },
                                            }
                                            const objCanvas = await createElement(objOptions);
                                            objDivCol.appendChild(objCanvas);
                                            objDivRow.appendChild(objDivCol);
                                            await divMdlFirma.appendChild(objDivRow);

                                            const ctx = objCanvas.getContext('2d'),
                                                weightPointer = 3,
                                                colorTint = '#000000';
                                            let boolDrawing = false,
                                                hasSignature = false,
                                                mousePosition = {x: 0, y: 0},
                                                lastPosition = mousePosition;

                                            objCanvas.addEventListener("mousedown", function (e) {
                                                boolDrawing = true;
                                                lastPosition = getmousePosition(objCanvas, e);
                                            }, false);

                                            objCanvas.addEventListener("mouseup", function () {
                                                boolDrawing = false;
                                            }, false);

                                            objCanvas.addEventListener("mousemove", function (e) {
                                                mousePosition = getmousePosition(objCanvas, e);
                                            }, false);

                                            objCanvas.addEventListener("touchstart", function (e) {
                                                mousePosition = getTouchPos(objCanvas, e);
                                                e.preventDefault();
                                                let touch = e.touches[0];
                                                let mouseEvent = new MouseEvent("mousedown", {
                                                    clientX: touch.clientX,
                                                    clientY: touch.clientY
                                                });
                                                objCanvas.dispatchEvent(mouseEvent);
                                            }, false);

                                            objCanvas.addEventListener("touchend", function (e) {
                                                e.preventDefault();
                                                let mouseEvent = new MouseEvent("mouseup", {});
                                                objCanvas.dispatchEvent(mouseEvent);
                                            }, false);

                                            objCanvas.addEventListener("touchleave", function (e) {
                                                e.preventDefault();
                                                let mouseEvent = new MouseEvent("mouseup", {});
                                                objCanvas.dispatchEvent(mouseEvent);
                                            }, false);

                                            objCanvas.addEventListener("touchmove", function (e) {
                                                e.preventDefault();
                                                let touch = e.touches[0];
                                                let mouseEvent = new MouseEvent("mousemove", {
                                                    clientX: touch.clientX,
                                                    clientY: touch.clientY
                                                });
                                                objCanvas.dispatchEvent(mouseEvent);
                                            }, false);

                                            function getmousePosition(canvasDom, mouseEvent) {
                                                let rect = canvasDom.getBoundingClientRect();
                                                return {
                                                    x: mouseEvent.clientX - rect.left,
                                                    y: mouseEvent.clientY - rect.top
                                                };
                                            }

                                            function getTouchPos(canvasDom, touchEvent) {
                                                let rect = canvasDom.getBoundingClientRect();
                                                return {
                                                    x: touchEvent.touches[0].clientX - rect.left,
                                                    y: touchEvent.touches[0].clientY - rect.top
                                                };
                                            }

                                            function renderCanvas() {
                                                if (boolDrawing) {
                                                    hasSignature = true;
                                                    ctx.strokeStyle = colorTint;
                                                    ctx.beginPath();
                                                    ctx.moveTo(lastPosition.x, lastPosition.y);
                                                    ctx.lineTo(mousePosition.x, mousePosition.y);

                                                    ctx.lineWidth = weightPointer;
                                                    ctx.stroke();
                                                    ctx.closePath();
                                                    lastPosition = mousePosition;
                                                }
                                            }

                                            function clearCanvas() {
                                                ctx.clearRect(0, 0, objCanvas.width, objCanvas.height);
                                                hasSignature = false;
                                            }

                                            function saveSignature() {

                                                if (mousePosition.x === 0 && mousePosition.y === 0 || !hasSignature) {
                                                    alert_nova.showNotification('No tienes ninguna firma dibujada.', "warning", "danger");
                                                } else {
                                                    const dataURL = objCanvas.toDataURL();
                                                    let formData = new FormData();
                                                    formData.append('image', dataURL);
                                                    formData.append('no_empleado', strNoEmpleado);
                                                    formData.append('no_periodo', objPeriodo.No_Periodo);
                                                    formData.append('base', strBase);
                                                    formData.append('id_base', intBase);
                                                    formData.append('no_empresa', strNoEmpresa);

                                                    open_loading();
                                                    fetch(window.strUrlSaveFirma, {
                                                        method: 'POST',
                                                        headers: {'X-CSRFToken': csrftoken},
                                                        body: formData,
                                                    })
                                                        .then(response => response.json())
                                                        .then(async (data) => {
                                                            close_loading();
                                                            if (data.status) {
                                                                objOptions = {
                                                                    element: 'img',
                                                                    src: data.image,
                                                                    classes: ["firma"]
                                                                }
                                                                const objImg = await createElement(objOptions);
                                                                window.document.getElementById('divImage').appendChild(objImg);
                                                                objCanvas.remove();
                                                                objButtonSave.remove();
                                                                objButtonClear.remove();
                                                                alert_nova.showNotification("Firma grabada.", "add_alert", "success");
                                                                btnPrint.style.display = '';
                                                                getPeriodos(strSqlBase, strNoEmpresa, strBase, strNoEmpleado, intBase);
                                                            } else {
                                                                alert_nova.showNotification(data.msg, "warning", "danger");
                                                                btnPrint.style.display = 'none';
                                                            }
                                                        })
                                                        .catch((error) => {
                                                            close_loading();
                                                            console.error(error);
                                                            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
                                                        });

                                                }
                                            }

                                            requestAnimFrame = (function () {
                                                return window.requestAnimationFrame ||
                                                    window.webkitRequestAnimationFrame ||
                                                    window.mozRequestAnimationFrame ||
                                                    window.oRequestAnimationFrame ||
                                                    window.msRequestAnimaitonFrame ||
                                                    function (callback) {
                                                        window.setTimeout(callback, 1000 / 60);
                                                    };
                                            })();

                                            objOptions = {
                                                element: 'button',
                                                id: 'clearCanva',
                                                classes: ["btn", "btn-outline-success"]
                                            }
                                            const objButtonSave = await createElement(objOptions);
                                            objButtonSave.innerHTML = `<span class="material-icons">save</span> Confirmar Firma`;
                                            objButtonSave.onclick = () => {
                                                saveSignature();
                                            }

                                            objOptions = {
                                                element: 'button',
                                                id: 'clearCanva',
                                                classes: ["btn", "btn-outline-danger"]
                                            }
                                            const objButtonClear = await createElement(objOptions);
                                            objButtonClear.innerHTML = `<span class="material-icons">clear</span> Volver Firma`;
                                            objButtonClear.onclick = () => {
                                                clearCanvas();
                                            }

                                            objOptions = {
                                                element: 'div',
                                                classes: ["col-md-12", "text-center"],
                                                styles: {
                                                    "font-weight": "bold",
                                                }
                                            };
                                            objDivCol = await createElement(objOptions);
                                            objDivCol.appendChild(objButtonSave);
                                            objDivCol.appendChild(objButtonClear);
                                            objDivRow.appendChild(objDivCol);

                                            (function drawLoop() {
                                                requestAnimFrame(drawLoop);
                                                renderCanvas();
                                            })();

                                        } else {
                                            btnPrint.style.display = 'none';
                                        }
                                    }

                                })
                                .catch((error) => {
                                    close_loading();
                                    console.error(error);
                                    alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
                                });

                            $('#modal_firma').modal({
                                show: true,
                                backdrop: 'static',
                            });
                        }

                        objDivCol.appendChild(objDivButton);
                        objDivRow.appendChild(objDivCol);
                    }
                    divContenido.appendChild(objDivRow);
                }
            })
            .catch((error) => {
                close_loading();
                console.error(error);
                if (divContenido) divContenido.innerHTML = '';
                alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            });
    };

    window.printDocument = () => {
        const newWin = window.open('', 'Print-Window');

        newWin.document.open();
        newWin.document.write(`<html lang="en"><body onload="window.print();">${window.document.getElementById('mdlFirma').innerHTML}</body></html>`);
        newWin.document.close();
    };

    const elementSearchUser = window.document.getElementById('autocomplete_user');
    console.log(elementSearchUser);
    if (elementSearchUser) {
        csrftoken = getCookie('csrftoken'),
            $('#autocomplete_user').autocomplete({
                minLength: 1,
                source: (request, response) => {
                    const data = new FormData();
                    data.append('user', request.term);

                    fetch(strUrlGetUsers, {
                        method: 'POST',
                        headers: {'X-CSRFToken': csrftoken},
                        body: data
                    })
                        .then(response => response.json())
                        .then(data => {
                            response($.map(data, function (item) {
                                return {
                                    label: item.name,
                                    value: item.id
                                }
                            }))
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                },
                select: function (event, ui) {
                    event.preventDefault();
                    simple_redireccion(`${strUrlBoletas}?user_id=${ui.item.value}`);
                }
            });
    }

})();
