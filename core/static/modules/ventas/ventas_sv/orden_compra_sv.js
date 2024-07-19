const fntGetListado = async () => {
    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    fntCleanTable();

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetListado, objInit, (data) => {
        objDataTable.rows.add(data.data).draw();
        objDataTable.responsive.recalc();
        objDataTable.columns.adjust();

        $('[rel="tooltip"]').tooltip();

        close_loading();
    }, {boolShowSuccessAlert: false});
};

const fntCleanTable = () => {
    if (objDataTable) {
        $(".ui-tooltip").remove();
        objDataTable.clear().draw();
    }
}

const fntAgregar = async () => {
    window.id_cliente = 0;

    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetForm, objInit, (data) => {
        document.getElementById("div_content_2").innerHTML = data.data.html;

        objProductos = data.data.prods_json;

        $('#sltCliente').select2();
        $('#sltCliente').on("select2:select", function (e) {
            document.getElementById("txtCodigoCliente").innerText = $('#sltCliente').find(':selected').data('codigo');
            document.getElementById("txtNombreCliente").innerText = $('#sltCliente').find(':selected').data('nombre');
            document.getElementById("txtTelefonoCliente").innerText = $('#sltCliente').find(':selected').data('tel');
            document.getElementById("txtDireccionCliente").innerText = $('#sltCliente').find(':selected').data('direccion');
        });

        $("select[id^='sltProducto_']").select2();
        $(`#sltProducto_1`).select2().on("select2:select", function (e) {
            fntValidarProducto(e.target);
        });

        intCorrelativo = 1;

        let objCantidad = document.querySelectorAll("#tblDetalles > tbody > tr");
        if( objCantidad && objCantidad.length === 0 ){
            fntAgregarFila();
        }

        $("#div_content_1").hide(400);
        $("#div_content_2").show(400);

        close_loading();
    }, {boolShowSuccessAlert: false});
}

const fntRegresar = async () => {
    $("#div_content_2").hide(800);
    $("#div_content_1").show(800, function(e){
        if ( $('#sltCliente').hasClass('select2-hidden-accessible') ) {
            $('#sltCliente').select2('destroy');
        }

        $("#div_content_2").html("");
    });
};

const fntPreguntaRegresar = async () => {
    dialogConfirm(fntRegresar, false, '¿Estás seguro?', '¡No se guardarán los datos que has cambiado o has ingresado!')
}

const fntAgregarFila = async() => {
    let strOptions = ``;

    let objAttrs = {
        element: 'select',
        id: `sltProducto_${intCorrelativo}`,
        name: `sltProducto_${intCorrelativo}`,
        classes: ["form-control"]
    };
    let objSelect = await createElement(objAttrs);

    objAttrs = {
        element: 'option',
        value: '0',
    };
    let objOptionDefault = await createElement(objAttrs);
    objOptionDefault.innerText = "Seleccione un producto...";
    objSelect.appendChild(objOptionDefault);

    let objPromise;
    objProductos.forEach( objPromise = async (key)=> {
        objAttrs = {
            element: 'option',
            value: key.id,
        };
        let objOptionProd = await createElement(objAttrs);
        objOptionProd.innerText = `${key.codigo_producto} - ${key.producto}`;
        objSelect.appendChild(objOptionProd);
    });

    objAttrs = {
        element: 'tr',
    };
    let objTr = await createElement(objAttrs);

    objAttrs = {
        element: 'td',
    };
    let objTd1 = await createElement(objAttrs);
    objTd1.appendChild(objSelect);

    objAttrs = {
        element: 'td',
    };
    let objTd2 = await createElement(objAttrs);

    objAttrs = {
        element: 'input',
        type: 'text',
        id: `txtPrecio_${intCorrelativo}`,
        name: `txtPrecio_${intCorrelativo}`,
        classes: ["form-control"]
    };
    let objInput2 = await createElement(objAttrs);
    objInput2.addEventListener("change", (e) => {
        fntCalcularTotalProducto(e.target);
    });
    objTd2.appendChild(objInput2)

    objAttrs = {
        element: 'td',
    };
    let objTd3 = await createElement(objAttrs);
    objAttrs = {
        element: 'input',
        type: 'text',
        id: `txtCantidad_${intCorrelativo}`,
        name: `txtCantidad_${intCorrelativo}`,
        classes: ["form-control"]
    };
    let objInput3 = await createElement(objAttrs);
    objInput3.addEventListener("change", (e) => {
        fntCalcularTotalProducto(e.target);
    });
    objTd3.appendChild(objInput3);

    objAttrs = {
        element: 'td',
    };
    let objTd4 = await createElement(objAttrs);

    objAttrs = {
        element: 'input',
        type: 'text',
        id: `txtTotal_${intCorrelativo}`,
        name: `txtTotal_${intCorrelativo}`,
        classes: ["form-control-plaintext"]
    };
    let objInput4 = await createElement(objAttrs);
    objTd4.appendChild(objInput4);

    objAttrs = {
        element: 'td',
        classes: ["td-actions"]
    };
    let objTd5 = await createElement(objAttrs);

    objAttrs = {
        element: 'button',
        type: 'button',
        classes: ["btn", "btn-link", "btn-danger"]
    };
    let objButton = await createElement(objAttrs);
    objButton.setAttribute("rel", "tooltip");
    objButton.setAttribute("data-original-title", "Eliminar");
    objButton.addEventListener("click", (e) => {
        fntEliminarFila(e.target);
    });

    objAttrs = {
        element: 'i',
        classes: ["material-icons"]
    };
    let objIcon = await createElement(objAttrs);
    objIcon.innerHTML = "delete_outline";

    objButton.appendChild(objIcon);

    objTd5.appendChild(objButton);

    objTr.appendChild(objTd1);
    objTr.appendChild(objTd2);
    objTr.appendChild(objTd3);
    objTr.appendChild(objTd4);
    objTr.appendChild(objTd5);

    document.querySelector("#tblDetalles > tbody").appendChild(objTr);
    $(`#sltProducto_${intCorrelativo}`).select2().on("select2:select", function (e) {
        fntValidarProducto(e.target);
    });

    intCorrelativo++;
}

const fntCalcularTotalProducto = async (objElement) => {
    let arrId = objElement.id.split("_");

    let fltCantidad = document.getElementById(`txtCantidad_${arrId[1]}`).value;
    let fltPrecio = document.getElementById(`txtPrecio_${arrId[1]}`).value;

    let strTotal = "";

    if( fltCantidad.trim().length > 0 && fltCantidad.trim().length > 0 ){
        fltCantidad = parseFloat(fltCantidad);
        fltPrecio = parseFloat(fltPrecio);

        strTotal = fltCantidad * fltPrecio
        strTotal = numberGTFormat.format(strTotal)
    }

    document.getElementById(`txtTotal_${arrId[1]}`).value = strTotal;
    await fntCalcularTotal();
};

const fntCalcularTotal = async () => {
    let fltTotal = 0;
    document.querySelectorAll("input[id^='txtCantidad']").forEach((ele) => {
        let arrId = ele.id.split("_");

        let fltCantidad = ele.value;
        let fltPrecio = document.getElementById(`txtPrecio_${arrId[1]}`).value;

        if( fltCantidad.trim().length > 0 && fltCantidad.trim().length > 0 ){
            fltCantidad = parseFloat(fltCantidad);
            fltPrecio = parseFloat(fltPrecio);

            fltTotal += (fltCantidad * fltPrecio);
        }
    });

    document.getElementById("spnTotal").innerText = numberGTFormat.format(fltTotal);
};

const fntEliminarFila = async( objElement ) => {
    if( objElement.nodeName === "BUTTON" ){
        objElement.parentNode.parentNode.remove();
    }
    else if( objElement.nodeName === "I" ){
        objElement.parentNode.parentNode.parentNode.remove();
    }

    await fntCalcularTotal();
}

const fntValidarProducto = async( objElement ) => {
    let strIdSel = objElement.id;
    let intProductoSel = objElement.value;
    document.querySelectorAll("select[id^='sltProducto_']").forEach((ele) => {
        if( ele.value !== "0" && ele.id !== strIdSel && ele.value === intProductoSel ){
            objElement.value = "0";
            $(objElement).trigger('change');
            alert_nova.showNotification("No se puede seleccionar un producto previamente seleccionado.", "warning", "danger");
        }
    });

};

const fntVer = async ( intOrdenCompra ) => {
    window.id_orden_compra = intOrdenCompra;

    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    objFormData.append('intOrdenCompra', intOrdenCompra);

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetForm, objInit, (data) => {
        document.getElementById("div_content_2").innerHTML = data.data.html;

        $("#div_content_1").hide(400);
        $("#div_content_2").show(400);

        close_loading();
    }, {boolShowSuccessAlert: false});
};

const fntGuardar = async () => {
    let boolVaciaFecha = false,
        boolVacioCliente = false,
        boolVaciaFactura = false,
        boolVacioRecibo = false,
        boolVaciaTransferencia = false,
        boolErrorProductosRepetidos = false,
        boolErrorProductos = false,
        boolErrorPrecio = false,
        boolErrorCantidad = false,
        strFecha = document.getElementById("txtFechaOC").value,
        strCliente = document.getElementById("sltCliente").value,
        objFactura = document.getElementById("filFactura"),
        objRecibo = document.getElementById("filRecibo"),
        objTransferencia = document.getElementById("filTransferencia");

    if( strFecha.trim().length === 0 ){
        boolVaciaFecha = true;
    }
    if( strCliente.trim().length === 0 || strCliente === "0" ){
        boolVacioCliente = true;
    }
    if (objFactura.files.length === 0) {
        boolVaciaFactura = true;
    }
    if (objRecibo.files.length === 0) {
        boolVacioRecibo = true;
    }
    if (objTransferencia.files.length === 0) {
        boolVaciaTransferencia = true;
    }

    if( boolVaciaFecha ){
        alert_nova.showNotification(`La fecha es requerida`, "warning", "danger");
    }
    if( boolVacioCliente ){
        alert_nova.showNotification(`El cliente es requerido`, "warning", "danger");
    }
    if( boolVaciaFactura ){
        alert_nova.showNotification(`La factura es requerida`, "warning", "danger");
    }
    if( boolVacioRecibo ){
        alert_nova.showNotification(`El recibo es requerido`, "warning", "danger");
    }
    if( boolVaciaTransferencia ){
        alert_nova.showNotification(`La transferencia es requerida`, "warning", "danger");
    }

    let arrRepetidos = [];
    document.querySelectorAll("select[id^='sltProducto_']").forEach((ele) => {
        if( ele.value === "0" ){
            boolErrorProductos = true;
        }
        else{
            if( arrRepetidos[ele.value] ){
                boolErrorProductosRepetidos = true;
            }
            else{
                arrRepetidos[ele.value] = true;
            }
        }
    });

    document.querySelectorAll("select[id^='txtPrecio_']").forEach((ele) => {
        if( ele.value === "0" && ele.value.trim().length === 0 ){
            boolErrorPrecio = true;
        }
    });

    document.querySelectorAll("select[id^='txtCantidad_']").forEach((ele) => {
        if( ele.value === "0" && ele.value.trim().length === 0 ){
            boolErrorCantidad = true;
        }
    });

    if( boolErrorProductosRepetidos ){
        alert_nova.showNotification(`Hay productos que están repetidos.`, "warning", "danger");
    }
    if( boolErrorProductos ){
        alert_nova.showNotification(`Faltan productos por ingresar.`, "warning", "danger");
    }
    if( boolErrorPrecio ){
        alert_nova.showNotification(`Faltan precios por ingresar.`, "warning", "danger");
    }
    if( boolErrorCantidad ){
        alert_nova.showNotification(`Faltan cantidades por ingresar.`, "warning", "danger");
    }

    if( boolVaciaFecha || boolVacioCliente || boolVaciaFactura || boolVacioRecibo || boolVaciaTransferencia || boolErrorProductosRepetidos
        || boolErrorProductos || boolErrorPrecio || boolErrorCantidad ){
        return false;
    }

    let objContenedor = document.getElementById("div_content_2");

    const data = new FormData();
    data.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    objContenedor.querySelectorAll("input, select").forEach((ele) => {
        if( ele.name ){
            data.append(ele.name, ele.value);
        }
    });

    data.append('filFactura', objFactura.files[0]);
    data.append('filRecibo', objRecibo.files[0]);
    data.append('filTransferencia', objTransferencia.files[0]);

    let objInit = {
        method: 'POST',
        body: data
    };

    open_loading();
    await coreFetch(strUrlGuardar, objInit, (data) => {
        if( data.status ){
            fntRegresar();
            fntGetListado();
        }
        close_loading();
    });
};

const fntPreguntarAnular = async ( intOrdenCompra ) => {
    window.id_orden_compra = intOrdenCompra;
    dialogConfirm(fntAnular, false, '¿Estás seguro?', '¡Se anulará la orden de compra y no se podrá recuperar!', 'error')
};

const fntAnular = async () => {
    const data = new FormData();

    data.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    data.append('id_orden_compra', window.id_orden_compra);

    let objInit = {
        method: 'POST',
        body: data
    };

    open_loading();
    await coreFetch(strUrlAnular, objInit, (data) => {
        close_loading();
        fntGetListado();
    });
};

$(document).ready(function(){
    objDataTable = $('#tblOrdenes').DataTable({
        data: [],
        processing: true,
        responsive: false,
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "Todos"]
        ],
        columns: [

            {data: 'id'},
            {
                data: 'fecha',
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        let date = new Date(data);
                        return dateGTFormat.format(date);
                    }
                    return data;
                }
            },
            {data: 'cliente'},
            {
                data: 'total',
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        return currencyFormatUS.format(parseFloat(data));
                    }
                    return data;
                }
            },
            {
                data: 'anulada',
                "render": function ( data, type, row ) {
                    if (type === 'display') {
                        return row.activo ? "Si" : "No";
                    }
                    return data;
                }
            },
            {
                "defaultContent": '&nbsp;',
                orderable: false,
                "render": function ( data, type, row ) {
                    if ( type === 'display' ) {
                        if( boolTodo ){
                            return `
                                <button class="btn btn-sm btn-outline-primary" href="#" onclick="fntVer(${row.id});" rel="tooltip" title="Ver" position="right">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" href="#" onclick="fntPreguntarAnular(${row.id});" rel="tooltip" title="Anular" position="right">
                                    <i class="fas fa-times"></i>
                                </button>
                            `;
                        }
                        else{
                            return `
                                <button class="btn btn-sm btn-outline-primary" href="#" onclick="fntVer(${row.id});" rel="tooltip" title="Ver" position="right">
                                    <i class="fas fa-eye"></i>
                                </button>
                            `;
                        }
                    }
                    return data;
                }
            },
        ],
        order: [[0, 'desc']],
        dom: 'Blfrtip',
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fa fa-file-excel-o"></i> Excel',
                className: 'btn-flat btn-aquadeep'
            },
        ],
        language: objLenguajeDataTable,
    });

    fntGetListado();
});