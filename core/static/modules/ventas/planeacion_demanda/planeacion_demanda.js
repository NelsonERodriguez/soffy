const objProductos = document.querySelectorAll(`i.rotating`),
    objNivel3 = document.getElementById('nivel3'),
    objCantidadIngreso = document.getElementById('cantidad_ingreso'),
    objDescripcion = document.getElementById('descripcion_ingreso'),
    objNoProducto = document.getElementById('noproducto_ingreso'),
    objBtnGuardarPlaneacion = document.getElementById('btnGuardarPlaneacion'),
    objProductoIngreso = document.getElementById('producto_ingreso'),
    objDivcontenedorPlaneacion = document.getElementById('contenedorPlaneacion'),
    objBtnCerrar = document.getElementById('btnCerrar'),
    objBtnAgregar = document.getElementById('btnAgregar'),
    objDivInventarioDisponible = document.getElementById('divInventarioDisponible'),
    objmdlInventarioDisponible = document.getElementById('mdlInventarioDisponible'),
    btnExcel = document.getElementById('btnExcel');

let numberFormatPlaneacion = new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20
});

objProductos.forEach(element => {

    element.addEventListener("dblclick", () => {
        const intNumber = element.dataset.number;
        const strTipo = element.dataset.type;
        const objSelected = document.getElementById(`nivel3_${strTipo}_${intNumber}`);
        objNivel3.value = objSelected.value;
        objCantidadIngreso.value = '';
        objDescripcion.value = '';
        objNoProducto.value = '';
        objProductoIngreso.value = '';

        if (strTipo === 'sku') {
            objNoProducto.value = objSelected.getAttribute('data-noproducto');
            objProductoIngreso.value = objSelected.getAttribute('data-producto');
        }

        showModalProducto();
    });

    element.addEventListener("mousedown", (e) => {
        e.preventDefault();
        document.addEventListener("mousemove", moving_mouse);
        let page = e.pageY;
        let pagex = e.pageX;

        function moving_mouse(e) {
            element.scrollIntoView(false);
            element.style.position = "absolute";
            element.style.zIndex = "100";
            element.style.left = e.pageX - pagex + 'px';
            element.style.top = e.pageY - page + 'px';
        }

        let isDown = true;
        document.addEventListener("mouseup", (e) => {
            const objEncontrados = document.elementsFromPoint(e.pageX, e.pageY);
            if (objEncontrados && isDown) {
                objEncontrados.forEach(elementEncontrado => {

                    if (elementEncontrado.classList.contains('boat')) {
                        const intNumber = element.dataset.number;
                        const strTipo = element.dataset.type;
                        const objSelected = document.getElementById(`nivel3_${strTipo}_${intNumber}`);
                        objNivel3.value = objSelected.value;
                        objCantidadIngreso.value = '';
                        objDescripcion.value = '';
                        objNoProducto.value = '';
                        objProductoIngreso.value = '';

                        if (strTipo === 'sku') {
                            objNoProducto.value = objSelected.getAttribute('data-noproducto');
                            objProductoIngreso.value = objSelected.getAttribute('data-producto');
                        }

                        showModalProducto();
                    }

                });
                isDown = false;
            }

            document.removeEventListener("mousemove", moving_mouse);
            element.style.removeProperty('position');
            element.style.removeProperty('z-index');
            element.style.removeProperty('top');
            element.style.removeProperty('left');
        });
    });

});

const showModalProducto = () => {
    $(`#mdlProducto`).modal('show');
};

const makeTableDownload = async (cnt) => {
    if(cnt) {
        cnt.innerHTML = '';
        let strHeaders = '',
            strBody = '';
        objHeadersDownload.map(d => {
            strHeaders += `<th>${d}</th>`;
        });

        objDataSku.map(d => {
            strBody += `<tr>
                            <td>${d.CodigoProducto}</td>
                            <td>${d.Descripcion}</td>
                            <td>${d.Libras_Mes_2}</td>
                            <td>${d.Libras_Mes_1}</td>
                            <td>${d.Libras_Mes_A}</td>
                            <td>${d.Existencia}</td>
                            <td>${d.Inventario_Transito}</td>
                            <td>${d.Fecha_Arribo}</td>
                        </tr>`;
        });

        const tbl = `   <table id='tableDownload'>
                            <thead>
                                <tr>${strHeaders}</tr>
                            </thead>
                            <tbody>${strBody}</tbody>
                        </table>`;
        cnt.innerHTML = tbl;
    }
};

const drawTableToDownload = async () => {
    open_loading();
    const cnt = document.getElementById('cntTableDownload');
    await makeTableDownload(cnt);
    close_loading();
    exportTableToExcel('tableDownload', 'planeacion_demanda');
    setTimeout(() => {
        cnt.innerHTML = '';
    }, 2000);
};

if(btnExcel)
    btnExcel.addEventListener('click', () => {
        drawTableToDownload();
    });

const getReporteAgua = async (strTipo, strFecha, strNivel3) => {
    open_loading();
    const data = new FormData(),
        csrftoken = getCookie('csrftoken');
        data.append('csrfmiddlewaretoken', csrftoken);
        data.append('tipo', strTipo);
        data.append('fecha', strFecha);
        data.append('nivel3',strNivel3);

    fetch(strUrlGetReporte, {
        method: 'POST',
        body: data
    })
        .then(response => response.json())
        .then(async (data) => {
            close_loading();

            if (data.status) {
                const objDiv = document.getElementById(`div${strTipo}`);

                objDiv.innerHTML = ``;
                let objOption = {
                    element: 'table',
                    classes: ["table", "table-striped"],
                };
                let objTable = await createElement(objOption);

                objOption = {
                    element: 'thead'
                };
                let objTHead = await createElement(objOption);

                objOption = {
                    element: 'tr'
                };
                let objTr = await createElement(objOption);

                objOption = {
                    element: 'td',
                    classes: ["text-center"],
                };
                let objTd = await createElement(objOption);
                objTd.innerText = `Producto`;
                objTr.appendChild(objTd);

                objTd = await createElement(objOption);
                objTd.innerText = `Descripcion`;
                objTr.appendChild(objTd);

                objTd = await createElement(objOption);
                objTd.innerText = `Contenedores`;
                objTr.appendChild(objTd);

                objTd = await createElement(objOption);
                objTd.innerText = `Barco`;
                objTr.appendChild(objTd);

                objTd = await createElement(objOption);
                objTd.innerText = `Fecha Pedido`;
                objTr.appendChild(objTd);

                objTd = await createElement(objOption);
                objTd.innerText = `Fecha Liberación`;
                objTr.appendChild(objTd);

                objTHead.appendChild(objTr);
                objTable.appendChild(objTHead);

                objOption = {
                    element: 'tbody'
                };
                let objTbody = await createElement(objOption);
                for (let key in data.arr_reporte) {
                    const arrDetalle = data.arr_reporte[key];

                    let objOption = {
                        element: 'tr'
                    };
                    let objTr = await createElement(objOption);

                    objOption = {
                        element: 'td',
                    };
                    let objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.CodigoProducto;
                    objTr.appendChild(objTd);

                    objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.producto;
                    objTr.appendChild(objTd);

                    objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.confirmados;
                    objTr.appendChild(objTd);

                    objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.barco;
                    objTr.appendChild(objTd);

                    objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.date_ordered;
                    objTr.appendChild(objTd);

                    objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.fecha_liberacion;
                    objTr.appendChild(objTd);


                    objTbody.appendChild(objTr);
                }

                objTable.appendChild(objTbody);
                await objDiv.appendChild(objTable);

                $(`#mdlInventario${strTipo}`).modal('show');
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
        });
};

const getReporte = (strTipo, strFecha, strNivel3) => {

    open_loading();
    const data = new FormData(),
        csrftoken = getCookie('csrftoken');
    data.append('csrfmiddlewaretoken', csrftoken);
    data.append('tipo', strTipo);
    data.append('fecha', strFecha);
    data.append('nivel3',strNivel3);

    fetch(strUrlGetReporte, {
        method: 'POST',
        body: data
    })
        .then(response => response.json())
        .then(async (data) => {
            close_loading();

            if (data.status) {
                const objDiv = document.getElementById(`div${strTipo}`);

                objDiv.innerHTML = ``;
                let objOption = {
                    element: 'table',
                    classes: ["table", "table-striped"],
                };
                let objTable = await createElement(objOption);

                objOption = {
                    element: 'thead'
                };
                let objTHead = await createElement(objOption);

                objOption = {
                    element: 'tr'
                };
                let objTr = await createElement(objOption);

                objOption = {
                    element: 'td',
                    classes: ["text-center"],
                };
                let objTd = await createElement(objOption);
                objTd.innerText = `Nivel3`;
                objTr.appendChild(objTd);

                objOption = {
                    element: 'td',
                    classes: ["text-center"],
                };
                objTd = await createElement(objOption);
                objTd.innerText = `Código`;
                objTr.appendChild(objTd);

                objOption = {
                    element: 'td',
                    classes: ["text-center"],
                };
                objTd = await createElement(objOption);
                objTd.innerText = `Descripción`;
                objTr.appendChild(objTd);

                if (strTipo !== 'Existencia') {
                    objOption = {
                        element: 'td',
                        classes: ["text-center"],
                    };
                    objTd = await createElement(objOption);
                    objTd.innerText = `No_PO`;
                    objTr.appendChild(objTd);

                    objOption = {
                        element: 'td',
                        classes: ["text-center"],
                    };
                    objTd = await createElement(objOption);
                    objTd.innerText = `Fecha Arribo`;
                    objTr.appendChild(objTd);

                    objOption = {
                        element: 'td',
                        classes: ["text-center"],
                    };
                    objTd = await createElement(objOption);
                    objTd.innerText = `Libras`;
                    objTr.appendChild(objTd);
                }

                if (strTipo === 'Existencia') {
                    objOption = {
                        element: 'td',
                        classes: ["text-center"],
                    };
                    objTd = await createElement(objOption);
                    objTd.innerText = `Existencia`;
                    objTr.appendChild(objTd);
                }

                objTHead.appendChild(objTr);

                objTable.appendChild(objTHead);

                objOption = {
                    element: 'tbody'
                };
                let objTbody = await createElement(objOption);
                for (let key in data.arr_reporte) {
                    const arrDetalle = data.arr_reporte[key];

                    let objOption = {
                        element: 'tr'
                    };
                    let objTr = await createElement(objOption);

                    objOption = {
                        element: 'td',
                    };
                    let objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.Nivel3;
                    objTr.appendChild(objTd);

                    objOption = {
                        element: 'td',
                    };
                    objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.Codigo;
                    objTr.appendChild(objTd);

                    objOption = {
                        element: 'td',
                    };
                    objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.Descripcion;
                    objTr.appendChild(objTd);

                    if (strTipo !== 'Existencia') {
                        objOption = {
                            element: 'td',
                        };
                        objTd = await createElement(objOption);
                        objTd.innerText = arrDetalle.No_PO;
                        objTr.appendChild(objTd);

                        objOption = {
                            element: 'td',
                            classes: ["text-center"],
                        };
                        objTd = await createElement(objOption);

                        if (arrDetalle.Fecha_Arribo !== "1900-01-01") {
                            let dateFechaInicio = new Date(arrDetalle.Fecha_Arribo+" 00:00:00");
                            objTd.innerText = dateGTFormat.format(dateFechaInicio);
                        }
                        else {
                            objTd.innerText = '';
                        }
                        objTr.appendChild(objTd);

                        objOption = {
                            element: 'td',
                            classes: ["text-right"],
                        };
                        objTd = await createElement(objOption);
                        objTd.innerText = numberFormatPlaneacion.format(arrDetalle.Libras);
                        objTr.appendChild(objTd);
                    }

                    if (strTipo === 'Existencia') {
                        objOption = {
                            element: 'td',
                            classes: ["text-right"],
                        };
                        objTd = await createElement(objOption);
                        objTd.innerText = numberFormatPlaneacion.format(arrDetalle.Existencia);
                        objTr.appendChild(objTd);
                    }

                    objTbody.appendChild(objTr);
                }

                objTable.appendChild(objTbody);
                await objDiv.appendChild(objTable);

                $(`#mdlInventario${strTipo}`).modal('show');
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
        });
};

const agregarProducto = () => {

    const intNoProducto = objNoProducto.value;
    const strProducto = objProductoIngreso.value;
    const intCantidad = objCantidadIngreso.value;
    const strDescripcion = objDescripcion.value;

    open_loading();
    const data = new FormData(),
        csrftoken = getCookie('csrftoken');
    data.append('csrfmiddlewaretoken', csrftoken);
    data.append('noproducto', intNoProducto);
    data.append('cantidad', intCantidad);
    data.append('descripcion', strDescripcion);

    fetch(strUrlSaveDetalle, {
        method: 'POST',
        body: data
    })
        .then(response => response.json())
        .then(async (data) => {
            close_loading();

            if (data.status) {
                objBtnCerrar.style.display = '';

                let objOptions = {
                    element: 'div',
                    classes: ["col-2", "text-center"],
                    id: `divProducto_${intNoProducto}`,
                };
                let objDivCont = await createElement(objOptions);

                objOptions = {
                    element: 'div',
                    classes: ["row"],
                    styles: {
                        height: '75px',
                        border: '#D2D2D2 solid 1px',
                        position: 'relative',
                        margin: '15px',
                        padding: '0 5px',
                        "border-radius": '3px',
                        background: 'white',
                    },
                };
                let objDivRow = await createElement(objOptions);
                objDivCont.appendChild(objDivRow);

                objOptions = {
                    element: 'i',
                    classes: ["material-icons"],
                    styles: {
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        cursor: 'pointer',
                        color: 'red',
                        'font-size': '17px',
                    },
                };
                let objDelete = await createElement(objOptions);
                objDelete.innerText = 'delete';
                objDelete.onclick = () => {
                    dialogConfirm(() => {
                        borrarDetalle(intNoProducto, `divProducto_${intNoProducto}`);
                    });
                };

                objOptions = {
                    element: 'div',
                    classes: ["col-12"],
                    styles: {
                        'font-size': '10px',
                    },
                };
                let objDivCol12 = await createElement(objOptions);
                objDivCol12.innerHTML = `
                    ${strProducto} <br> ${numberFormatPlaneacion.format(intCantidad)} <br>
                    <input type="hidden" name="producto[]" value="${strProducto}">
                    <input type="hidden" name="no_producto[]" value="${intNoProducto}">
                    <input type="hidden" name="cantidad[]" value="${intCantidad}">
                    <input type="hidden" name="descripcion[]" value="${intCantidad}">
                `;
                objDivCol12.appendChild(objDelete);
                objDivRow.appendChild(objDivCol12);

                await objDivcontenedorPlaneacion.appendChild(objDivCont);

                $(`#mdlProducto`).modal('hide');

                alert_nova.showNotification('Producto agregado.', "add_alert", "success");
            }
            else {
                alert_nova.showNotification('No se pudo agregar el producto, intente de nuevo.', "warning", "danger");
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
        });
};

const borrarDetalle = (intNoProducto, strDivCont) => {

    open_loading();
    const data = new FormData(),
        csrftoken = getCookie('csrftoken');
    data.append('csrfmiddlewaretoken', csrftoken);
    data.append('noproducto', intNoProducto);

    fetch(strUrlDeleteDetalle, {
        method: 'POST',
        body: data
    })
        .then(response => response.json())
        .then(async (data) => {
            close_loading();

            if (data.status) {

                document.getElementById(strDivCont).remove();
                alert_nova.showNotification('Registros eliminado.', "add_alert", "success");

                if (!document.querySelector(`div[id^="divProducto_"]`)) {
                    objBtnCerrar.style.display = 'none';
                }
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
        });

};

const cerrarPlaneacion = () => {

    open_loading();
    const data = new FormData(),
        csrftoken = getCookie('csrftoken');
    data.append('csrfmiddlewaretoken', csrftoken);

    fetch(strUrlCerrarPlaneacion, {
        method: 'POST',
        body: data
    })
        .then(response => response.json())
        .then(async (data) => {
            close_loading();

            if (data.status) {

                document.querySelector(`.boat`).classList.add('boat_cerrar');
                alert_nova.showNotification('Planeación cerrada.', "add_alert", "success");
                objBtnCerrar.style.display = 'none';
                objDivcontenedorPlaneacion.innerHTML = '';
                setTimeout(() => {
                    window.location.reload();
                }, 3000);

            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
        });

};

const getInventarioDisponible = (strNoProducto) => {

    open_loading();
    const data = new FormData(),
        csrftoken = getCookie('csrftoken');
    data.append('csrfmiddlewaretoken', csrftoken);
    data.append('noproducto', strNoProducto);

    fetch(strUrlInventarioDisponible, {
        method: 'POST',
        body: data
    })
        .then(response => response.json())
        .then(async (data) => {
            close_loading();

            if (data.status) {

                objDivInventarioDisponible.innerHTML = ``;
                let objOption = {
                    element: 'table',
                    classes: ["table", "table-striped"],
                };
                let objTable = await createElement(objOption);

                objOption = {
                    element: 'thead'
                };
                let objTHead = await createElement(objOption);

                objOption = {
                    element: 'tr'
                };
                let objTr = await createElement(objOption);

                objOption = {
                    element: 'td',
                    classes: ["text-center"],
                };
                let objTd = await createElement(objOption);
                objTd.innerText = `NoProducto`;
                objTr.appendChild(objTd);

                objOption = {
                    element: 'td',
                    classes: ["text-center"],
                };
                objTd = await createElement(objOption);
                objTd.innerText = `Código`;
                objTr.appendChild(objTd);

                objOption = {
                    element: 'td',
                    classes: ["text-center"],
                };
                objTd = await createElement(objOption);
                objTd.innerText = `Producto`;
                objTr.appendChild(objTd);

                objOption = {
                    element: 'td',
                    classes: ["text-center"],
                };
                objTd = await createElement(objOption);
                objTd.innerText = `Bodega`;
                objTr.appendChild(objTd);

                objOption = {
                    element: 'td',
                    classes: ["text-center"],
                };
                objTd = await createElement(objOption);
                objTd.innerText = `Existencia`;
                objTr.appendChild(objTd);

                objTHead.appendChild(objTr);

                objTable.appendChild(objTHead);

                objOption = {
                    element: 'tbody'
                };
                let objTbody = await createElement(objOption);

                for (let key in data.arr_inventario) {
                    const arrDetalle = data.arr_inventario[key];
                    objOption = {
                        element: 'tr'
                    };
                    objTr = await createElement(objOption);

                    objOption = {
                        element: 'td',
                    };
                    objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.NoProducto;
                    objTr.appendChild(objTd);

                    objOption = {
                        element: 'td',
                    };
                    objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.CodigoProducto;
                    objTr.appendChild(objTd);

                    objOption = {
                        element: 'td',
                    };
                    objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.Producto;
                    objTr.appendChild(objTd);

                    objOption = {
                        element: 'td',
                    };
                    objTd = await createElement(objOption);
                    objTd.innerText = arrDetalle.bodega;
                    objTr.appendChild(objTd);

                    objOption = {
                        element: 'td',
                        styles: {
                            "text-align": "right"
                        }
                    };
                    objTd = await createElement(objOption);
                    objTd.innerText = numberGTFormat.format(arrDetalle.Existencia);
                    objTr.appendChild(objTd);

                    objTbody.appendChild(objTr);
                }

                objTable.appendChild(objTbody);
                await objDivInventarioDisponible.appendChild(objTable);

                $(objmdlInventarioDisponible).modal('show');
            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
        });
};

$("#producto_ingreso").autocomplete({
    minLength: 1,
    source: function (request, response) {
        open_loading();
        const data = new FormData(),
            csrftoken = getCookie('csrftoken');
        data.append('csrfmiddlewaretoken', csrftoken);
        data.append('busqueda', request.term);
        data.append('nivel3', objNivel3.value);

        fetch(strUrlGetProductos, {
            method: 'POST',
            body: data
        })
            .then(response => response.json())
            .then((data) => {
                close_loading();
                response($.map(data.arr_productos, function (item) {
                    return {
                        label: item.Descripcion,
                        value: item.NoProducto,
                        CodigoProducto: item.CodigoProducto,
                        Descripcion: item.Descripcion,
                        NoProducto: item.NoProducto,
                    }
                }));
            })
            .catch((error) => {
                close_loading();
                console.error(error);
            });
    },
    select: function (event, ui) {
        event.preventDefault();
        objNoProducto.value = ui.item.value;
        this.value = ui.item.label;
    },
    change: function (event, ui) {
        if (ui.item == null) {
            this.value = '';
            objNoProducto.value = '';
            objCantidadIngreso.value = '';
            objDescripcion.value = '';
            return false;
        }
    }
})
    .focus(function () {
        objNoProducto.value = '';
        this.value = '';
    });

objBtnGuardarPlaneacion.onclick = () => {

    let boolError = false;
    if (objNoProducto.value === '') {
        boolError = true;
    }

    if (objCantidadIngreso.value === '') {
        boolError = true;
    }

    if (boolError) {
        alert_nova.showNotification('Debe ingresar todos los datos.', "warning", "danger");
    }
    else {
        agregarProducto();
    }

};

objBtnCerrar.onclick = () => {
  dialogConfirm(cerrarPlaneacion);
};

objBtnAgregar.onclick = () => {
    objNivel3.value = '';
    objNoProducto.value = '';
    objProductoIngreso.value = '';
    objCantidadIngreso.value = '';
    objDescripcion.value = '';
    showModalProducto();
};