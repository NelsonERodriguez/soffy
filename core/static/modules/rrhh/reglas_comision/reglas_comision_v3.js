(function () {
    window.objTblReglas = null;

    window.fntShowSearcher = async (strClass) => {
        let strUrlSearch = "";

        if( strClass === "cliente" ){
            strUrlSearch = strUrlBuscarCliente;
            strNameInput = "txtClienteBuscar";
            strTitulo = "Búsqueda por cliente";
        }
        else if( strClass === "producto" ){
            strUrlSearch = strUrlBuscarProducto;
            strNameInput = "txtProductoBuscar";
            strTitulo = "Búsqueda por producto";
        }
        else if( strClass === "vendedor" ){
            strUrlSearch = strUrlBuscarVendedor;
            strNameInput = "txtVendedorBuscar";
            strTitulo = "Búsqueda por vendedor";
        }
        else if( strClass === "general" ){
            strUrlSearch = strUrlBuscarVendedor;
            strNameInput = "txtGeneralBuscar";
            strTitulo = "Búsqueda Tipo Producto";
        }
        strNameHidden = strNameInput.substring(3);
        strNameHidden = "hdn"+strNameHidden;
        window.class = strClass;

        let objDivFilter = document.getElementById("div_filter");
        objDivFilter.innerHTML = "";

        let objOptions;

        if( strClass !== "general" ) {

            objOptions = {
                element: 'div',
                classes: ["col-md-4"],
            }
            let objColumna1 = await createElement(objOptions);

            objOptions = {
                element: 'div',
                classes: ["form-group"],
            }
            let objFormGroup = await createElement(objOptions);

            objOptions = {
                element: 'label',
                htmlFor: strNameInput,
                classes: ["bmd-label-floating", "required"],
            };
            let objLabel = await createElement(objOptions);
            objLabel.innerText = strTitulo;
            objFormGroup.appendChild(objLabel);

            objOptions = {
                element: 'input',
                id: strNameInput,
                name: strNameInput,
                type: 'text',
                classes: ["form-control"],
            };
            let objInputText = await createElement(objOptions);
            objFormGroup.appendChild(objInputText);

            objOptions = {
                element: 'input',
                id: strNameHidden,
                name: strNameHidden,
                type: 'hidden',
            };
            let objInputHidden = await createElement(objOptions);
            objFormGroup.appendChild(objInputHidden);


            objColumna1.appendChild(objFormGroup);
            objDivFilter.appendChild(objColumna1);

            $("#" + strNameInput).autocomplete({
                minLength: 2,
                source: function (request, response) {
                    open_loading();
                    let strUrl = strUrlSearch;
                    let strClass = window.class;
                    strUrl = strUrl.replace('search', request.term);

                    window.data = new FormData();
                    data.append('csrfmiddlewaretoken', valCSRF);

                    fetch(strUrl, {
                        method: 'POST',
                        body: data,
                    })
                        .then(response => response.json())
                        .then((data) => {
                            close_loading();
                            response($.map(data, function (item) {
                                return {
                                    label: item.name,
                                    value: item.id,
                                    tipo_prod: (typeof (item.tipo_prod) !== "undefined" ? item.tipo_prod : ""),
                                }
                            }))
                        })
                        .catch((error) => {
                            close_loading();
                            console.error(error);
                        });
                },
                select: function (event, ui) {
                    event.preventDefault();
                    document.getElementById(`${strNameHidden}`).value = (ui.item.value == "" ? "" : ui.item.value);
                    this.value = ui.item.label;
                    if (ui.item.tipo_prod !== "") {
                        document.getElementById(`${strNameHidden}`).dataset.tipo = ui.item.tipo_prod;
                    }
                    fntShowClass();
                },
                focus: function (event, ui) {
                    //this.value = ui.item.label;
                    return false;
                },
                change: function (event, ui) {
                    if (ui.item == null) {
                        this.value = '';
                        fntShowClass();
                        return false;
                    }
                }
            });

            fntDataTable("");
        }

        objOptions = {
            element: 'div',
            classes: ["col-md-4"],
        }
        let objColumna2 = await createElement(objOptions);

        objOptions = {
            element: 'div',
            classes: ["form-group", "bmd-form-group", "is-filled"],
        }
        let objFormGroup = await createElement(objOptions);

        objOptions = {
            element: 'label',
            htmlFor: 'sltHabilitado',
            classes: ["bmd-label-floating"],
        };
        let objLabel = await createElement(objOptions);
        objLabel.innerText = "Habilitados";
        objFormGroup.appendChild(objLabel);

        objOptions = {
            element: 'select',
            id: 'sltHabilitado',
            name: 'sltHabilitado',
            classes: ["form-control"],
        };
        let objSelect = await createElement(objOptions);
        objSelect.style.height = "36px";
        objSelect.addEventListener("change", () => {
            fntShowClass();
        });

        objOptions = {
            element: 'option',
            value: '1',
        };
        let objOption1 = await createElement(objOptions);
        objOption1.innerText = "Si"
        objSelect.appendChild(objOption1);

        objOptions = {
            element: 'option',
            value: '0',
        };
        let objOption2 = await createElement(objOptions);
        objOption2.innerText = "No"
        objSelect.appendChild(objOption2);

        objOptions = {
            element: 'option',
            value: '',
            selected: true,
        };
        let objOption3 = await createElement(objOptions);
        objOption3.innerText = "Ambos"
        objSelect.appendChild(objOption3);

        objFormGroup.appendChild(objSelect);

        objColumna2.appendChild(objFormGroup);
        objDivFilter.appendChild(objColumna2);

        if( strClass === "general" ) {
            fntShowClass();
        }

        $("#div_content_1").hide(400);
        $("#div_content_2").show(400);
    }

    window.fntShowClass = async () => {
        let strClass = window.class;
        let boolRedirect = false;
        let intKeyBuscar;
        if( strClass !== "general" ){
            intKeyBuscar = document.getElementById(`${strNameHidden}`).value;
        }
        else{
            intKeyBuscar = "";
        }

        intKeyBuscar = intKeyBuscar.length === 0 ? "0" : intKeyBuscar;

         let strHabilitado = document.getElementById("sltHabilitado").value;

        open_loading();
        let formData = new FormData();
        formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
        formData.append('strClass', strClass);
        formData.append('intKeyBuscar', intKeyBuscar);
        formData.append('strHabilitado', strHabilitado);

        fetch(strUrlGetList, {
            method: 'POST',
            body: formData,
        })
            .then((response) => {
                boolRedirect = response.redirected;
                return response.json();
            })
            .then(async data => {
                if (boolRedirect) {
                    validateLogin();
                } else {
                    let strHtml = "";

                    data.data.forEach((value) => {
                        strHtml += `
                    <tr style="cursor:pointer;" onclick="fntDibujarRegla('${value.id}');">
                        <td>${value.cliente}</td>
                        <td>${value.vendedor}</td>
                        <td>${value.TipoProducto}</td>
                        <td>${value.producto}</td>
                        <td>${value.comisionbase}</td>
                        <td>${value.habilitado}</td>
                    </tr>
                `;
                    });

                    fntDataTable(strHtml);
                }

                close_loading();
            })
            .catch(error => {
                console.error(error)
                close_loading();
            });
    };

    window.fntDataTable = async (strContent) => {
        if (objTblReglas) objTblReglas.destroy();
        $("#tblReglas > tbody").html(strContent);
        objTblReglas = $("#tblReglas").DataTable({
            "pagingType": "full_numbers",
            "lengthMenu": [
                [-1],
                ["Todos"]
            ],
            responsive: false,
            language: objLenguajeDataTable,
            autoPrint: false,
            dom: 'lBfrtip',
            buttons: [
                {
                    extend: 'excel',
                    text: 'Excel',
                    className: 'btn btn-default'
                }
            ]
        });
        $('[rel="tooltip"]').tooltip();
    };

    window.fntDibujarRegla = async (intIdRegla) => {
        let strClass = window.class;
        window.idRegla = intIdRegla;
        let boolRedirect = false;
        let strValorInputText, strValorInputHidden;

        if( strClass !== "general" ){
            strValorInputText = document.getElementById(strNameInput).value;
            strValorInputHidden = document.getElementById(strNameHidden).value;

            if( strValorInputHidden === "" ){
                alert_nova.showNotification('No ha aplicado ningún filtro de búsqueda.', "warning", "danger");
                return false;
            }
        }
        else{
            strValorInputHidden = null;
        }

        open_loading();
        let formData = new FormData();
        formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
        formData.append('strClass', strClass);
        formData.append('intIdRegla', intIdRegla);
        formData.append('strValorInputHidden', strValorInputHidden);

        fetch(strUrlEdit, {
            method: 'POST',
            body: formData,
        })
            .then((response) => {
                boolRedirect = response.redirected;
                return response.text();
            })
            .then(data => {
                if( boolRedirect ){
                    validateLogin();
                }
                else {
                    $("#mdlContent").html(data);

                    fntMakeAutocompletes();

                    let strTituloMostrar = "";
                    if( strClass !== "general" ) {

                        if (strClass === "cliente") {
                            strTituloMostrar = "Cliente";

                            document.getElementById("cliente").value = strValorInputText;
                            document.getElementById("nocliente").value = strValorInputHidden;
                        } else if (strClass === "producto") {
                            strTituloMostrar = "Producto";
                            let strOpcion = document.getElementById(strNameHidden).dataset.tipo === "C" ? "C" : "M";
                            let strTextoMostrar2 = strOpcion === "C" ? "Cuadril" : "Mixto";

                            if (strOpcion === "C") {
                                $("[name='es_porcentaje'][value='0']").prop("checked", true);
                            } else {
                                $("[name='es_porcentaje'][value='1']").prop("checked", true);
                            }

                            $("#tipoProducto").val(strOpcion);
                            document.getElementById("spnMostrar2").innerText = strTextoMostrar2;

                            document.getElementById("producto").value = strValorInputText;
                            document.getElementById("noproducto").value = strValorInputHidden;
                        } else if (strClass === "vendedor") {
                            strTituloMostrar = "Vendedor";

                            document.getElementById("vendedor").value = strValorInputText;
                            document.getElementById("novendedor").value = strValorInputHidden;
                        }


                        document.getElementById("spnMostrar").innerText = document.getElementById(strNameInput).value;
                    }
                    else{
                        strTituloMostrar = "General";
                    }
                    document.getElementById("lblTituloMostrar").innerText = strTituloMostrar;

                    $("[for='tipoProducto']").parent().addClass("bmd-form-group is-filled");

                    let tbody = document.getElementById("tbodyDetalle");
                    let filas = tbody.getElementsByTagName("tr");
                    intCorrelativo = filas.length + 1;

                    objFrmInterfaz = $("#frm_interfaz").validate({
                        highlight: function(element) {
                            $(element).closest('.form-group').removeClass('has-success').addClass('has-danger');
                            $(element).closest('.form-check').removeClass('has-success').addClass('has-danger');
                        },
                        success: function(element) {
                            $(element).closest('.form-group').removeClass('has-danger').addClass('has-success');
                            $(element).closest('.form-check').removeClass('has-danger').addClass('has-success');
                        },
                        errorPlacement: function(error, element) {
                            $(element).closest('.form-group').append(error);
                        },
                    });

                    $("#mdlRegla").modal("show");
                }

                close_loading();
            })
            .catch(error => {
                console.error(error)
                close_loading();
            });
    };

    window.fntRegresarDatatable = async () => {
        // await fntDibujarRegla(0, false);
        $("#div_content_2").hide(400);
        $("#div_content_1").show(400);
    };

    window.fntMakeAutocompletes = async () => {
        $("#cliente").autocomplete({
            minLength: 2,
            source: function (request, response) {
                open_loading();
                let strUrl = strUrlBuscarCliente;
                let strClass = window.class;
                strUrl = strUrl.replace('search', request.term);

                if( strClass === "parametro" ){
                    strUrl = strUrl.replace('union', "todos");
                }

                window.data = new FormData();
                data.append('csrfmiddlewaretoken', valCSRF);

                fetch(strUrl, {
                    method: 'POST',
                    body: data,
                })
                    .then(response => response.json())
                    .then((data) => {
                        close_loading();
                        response($.map(data, function (item) {
                            return {
                                label: item.name,
                                value: item.id,
                                id_ven: item.id_ven,
                                name_ven: item.name_ven,
                            }
                        }))
                    })
                    .catch((error) => {
                        close_loading();
                        console.error(error);
                    });
            },
            select: function (event, ui) {
                event.preventDefault();
                let strClass = window.class;
                document.getElementById(`nocliente`).value = (ui.item.value == "Todos" ? "" : ui.item.value);
                if( ui.item.id_ven && strClass === "producto" ){
                    document.getElementById(`novendedor`).value = ui.item.id_ven;
                    document.getElementById(`vendedor`).value = ui.item.name_ven;
                    $("#vendedor").parent().addClass("is-filled");
                }
                this.value = ui.item.label;
            },
            focus: function (event, ui) {
                this.value = ui.item.label;
                return false;
            },
            change: function (event, ui) {
                if (ui.item == null) {
                    this.value = '';
                    document.getElementById(`nocliente`).value = '';
                    return false;
                }
            }
        });

        $("#vendedor").autocomplete({
            minLength: 2,
            source: function (request, response) {
                open_loading();
                let strUrl = strUrlBuscarVendedor;
                let strClass = window.class;
                strUrl = strUrl.replace('search', request.term);

                if( strClass === "parametro" ){
                    strUrl = strUrl.replace('union', "todos");
                }

                window.data = new FormData();
                data.append('csrfmiddlewaretoken', valCSRF);

                fetch(strUrl, {
                    method: 'POST',
                    body: data,
                })
                    .then(response => response.json())
                    .then((data) => {
                        close_loading();
                        response($.map(data, function (item) {
                            return {
                                label: item.name,
                                value: item.id
                            }
                        }))
                    })
                    .catch((error) => {
                        close_loading();
                        console.error(error);
                    });
            },
            select: function (event, ui) {
                event.preventDefault();
                document.getElementById(`novendedor`).value = (ui.item.value == "Todos" ? "" : ui.item.value);
                this.value = ui.item.label;
            },
            focus: function (event, ui) {
                this.value = ui.item.label;
                return false;
            },
            change: function (event, ui) {
                if (ui.item == null) {
                    this.value = '';
                    document.getElementById(`novendedor`).value = '';
                    return false;
                }
            }
        });

        $("#producto").autocomplete({
            minLength: 2,
            source: function (request, response) {
                open_loading();
                let strUrl = strUrlBuscarProducto;
                let strClass = window.class;
                strUrl = strUrl.replace('search', request.term);

                if( strClass === "parametro" ){
                    strUrl = strUrl.replace('union', "todos");
                }

                window.data = new FormData();
                data.append('csrfmiddlewaretoken', valCSRF);

                fetch(strUrl, {
                    method: 'POST',
                    body: data,
                })
                    .then(response => response.json())
                    .then((data) => {
                        close_loading();
                        response($.map(data, function (item) {
                            return {
                                label: item.name,
                                value: item.id,
                                tipo_prod: item.tipo_prod,
                            }
                        }))
                    })
                    .catch((error) => {
                        close_loading();
                        console.error(error);
                    });
            },
            select: function (event, ui) {
                event.preventDefault();
                document.getElementById(`noproducto`).value = (ui.item.value == "Todos" ? "" : ui.item.value);
                this.value = ui.item.label;
                if (ui.item.tipo_prod === "M") {
                    $("#tipoProducto").val("M");
                    $("[name='es_porcentaje'][value='1']").prop("checked", true);
                } else if (ui.item.tipo_prod === "C") {
                    $("#tipoProducto").val("C");
                    $("[name='es_porcentaje'][value='0']").prop("checked", true);
                }
            },
            focus: function (event, ui) {
                this.value = ui.item.label;
                return false;
            },
            change: function (event, ui) {
                if (ui.item == null) {
                    this.value = '';
                    document.getElementById(`noproducto`).value = '';
                    return false;
                }
            }
        });
    };

    window.fntSave = async () => {
        let boolMensajeInicio = false;
        $("input[id^='inicio_rango_dias_']").each(function () {
            if ($.trim($(this).val()).length == 0) {
                boolMensajeInicio = true;
            }
        });
        if (boolMensajeInicio) {
            alert_nova.showNotification('El campo Día Inicio es requerido en cada una de las reglas', "warning", "danger");
        }

        let boolMensajeFin = false;
        $("input[id^='fin_rango_dias_']").each(function () {
            if ($.trim($(this).val()).length == 0) {
                boolMensajeFin = true;
            }
        });
        if (boolMensajeFin) {
            alert_nova.showNotification('El campo Día Fin es requerido en cada una de las reglas', "warning", "danger");
        }

        let boolMensajeComision = false;
        $("input[id^='comision_rango_']").each(function () {
            if ($.trim($(this).val()).length == 0) {
                boolMensajeComision = true;
            }
        });
        if (boolMensajeComision) {
            // alert_nova.showNotification("Email enviado.", "add_alert", "success");
            alert_nova.showNotification('El campo Comisión es requerido en cada una de las reglas', "warning", "danger");
        }

        let boolMensajeArchivoAdjunto = false;
        let filInputFile = document.getElementById('filInputFile');
        if (boolAdjuntosRequeridos) {
            if (filInputFile.files.length === 0) {
                alert_nova.showNotification(`El archivo de respaldo de la modificación es requerido`, "warning", "danger");
                return false;
            }
        }

        let boolMensajeRangos = false;
        $("input[id^='inicio_rango_dias_']").each(function () {
            let strId = $(this).attr("id");
            let arrSplit = strId.split("_");
            let valueInicial = parseFloat($(this).val());
            let valueFinal = parseFloat($("#fin_rango_dias_" + arrSplit[3]).val());
            $("input[id^='inicio_rango_dias_']").each(function () {
                let arrSplit2 = $(this).attr("id").split("_");
                let valueInicial2 = parseFloat($(this).val());
                let valueFinal2 = parseFloat($("#fin_rango_dias_" + arrSplit2[3]).val());
                if (strId != $(this).attr("id")) {
                    if (((valueInicial >= valueInicial2) && (valueInicial <= valueFinal2))) {
                        boolMensajeRangos = true;
                    }
                    if (((valueFinal >= valueInicial2) && (valueFinal <= valueFinal2))) {
                        boolMensajeRangos = true;
                    }
                }
            });

            if (valueInicial >= valueFinal) {
                boolMensajeRangos = true;
            }
        });

        if (boolMensajeRangos) {
            alert_nova.showNotification('Los rangos no están correctamente configurados', "warning", "danger");
            alert_nova.showNotification('Ejemplo de rangos: 0-5, 6-10. 11-15.', "info", "info");
        }

        if ($.trim($("#comision_base").val()).length == 0) {
            alert_nova.showNotification('El campo Comisón Base es requerido', "warning", "danger");
            boolMensajeComision = true;
        }

        if ($.trim($("#comision_fuera_rango").val()).length == 0) {
            alert_nova.showNotification('El campo Comisón Fuera de Rango es requerido', "warning", "danger");
            boolMensajeComision = true;
        }

        if ($.trim($("#tipoProducto").val()).length == 0) {
            alert_nova.showNotification('El campo Tipo de Producto es requerido', "warning", "danger");
            boolMensajeComision = true;
        }

        if (!boolMensajeInicio && !boolMensajeFin && !boolMensajeComision && !boolMensajeRangos && !boolMensajeArchivoAdjunto) {

            if( !objFrmInterfaz.form() ){
                alert_nova.showNotification(`No se han llenado todos los campos requeridos.`, "warning", "danger");
                return false;
            }
            saveInterfaz();
        }
    };

    window.saveInterfaz = () => {
        dialogConfirm(submitForm);
    };

    window.submitForm = () => {
        //document.frm_interfaz.submit();

        let intIdRegla = window.idRegla;

        open_loading();
        let formObject = document.getElementById("frm_interfaz");
        let formData = new FormData(formObject);
        formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
        formData.append('intIdRegla', intIdRegla);
        //formData.append('strClass', strClass);

        fetch(strUrlSave, {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                if (data.status) {
                    alert_nova.showNotification(data.msj, "add_alert", "success");
                    $("#mdlRegla").modal("hide");
                    fntShowClass();
                } else {
                    alert_nova.showNotification(data.msj, "warning", "danger");
                }

                close_loading();
            })
            .catch(error => {
                alert_nova.showNotification('Ocurrió un error verifique su conexión e intente nuevamente, o, contacte a IT.', "warning", "danger");
                console.error(error);
                close_loading();
            });
    };

    window.addRow = () => {
        let strRow = `
        <tr>
            <td>
                <input type="number" class="form-control" id="inicio_rango_dias_${intCorrelativo}" name="inicio_rango_dias_${intCorrelativo}" value="" onkeypress="return validar_caracteres(event, 2);">
                <input type="hidden" name="id_rango_detalle_${intCorrelativo}" id="id_rango_detalle_${intCorrelativo}" value="0">
            </td>
            <td>
                <input type="number" class="form-control" id="fin_rango_dias_${intCorrelativo}" name="fin_rango_dias_${intCorrelativo}" value="" onkeypress="return validar_caracteres(event, 2);">
            </td>
            <td>
                <input type="number" class="form-control" id="comision_rango_${intCorrelativo}" name="comision_rango_${intCorrelativo}" value="" onkeypress="return validar_caracteres(event, 7);">
            </td>
            <td>
                <a href="#" onclick="$(this).parent().parent().remove();"><i class="far fa-trash-alt"></i></a>
            </td>
        </tr>`;

        $("#tbodyDetalle").append(strRow);

        intCorrelativo++;
    };

    window.fntChangeTipoProducto = () => {
        if ($("#tipoProducto").val() === "M") {
            $("[name='es_porcentaje'][value='1']").prop("checked", true);
        } else if ($("#tipoProducto").val() === "C") {
            $("[name='es_porcentaje'][value='0']").prop("checked", true);
        }
    };

    window.fntCalcularComisiones = () => {
        if (window.idRegla === 0) {
            let sinComisionBase = parseFloat(document.getElementById("comision_base").value);

            if (sinComisionBase == 2) {
                document.getElementById("comision_rango_1").value = "2.00";
                document.getElementById("comision_rango_2").value = "1.50";
                document.getElementById("comision_rango_3").value = "1.00";
            } else if (sinComisionBase == 1.75) {
                document.getElementById("comision_rango_1").value = "1.75";
                document.getElementById("comision_rango_2").value = "1.50";
                document.getElementById("comision_rango_3").value = "1.25";
            } else if (sinComisionBase == 1.5) {
                document.getElementById("comision_rango_1").value = "1.50";
                document.getElementById("comision_rango_2").value = "1.00";
                document.getElementById("comision_rango_3").value = "0.50";
            } else if (sinComisionBase == 1.25) {
                document.getElementById("comision_rango_1").value = "1.25";
                document.getElementById("comision_rango_2").value = "1.00";
                document.getElementById("comision_rango_3").value = "0.75";
            } else if (sinComisionBase == 1) {
                document.getElementById("comision_rango_1").value = "1.00";
                document.getElementById("comision_rango_2").value = "0.75";
                document.getElementById("comision_rango_3").value = "0.50";
            }
        }
        else{
            let sinComisionBase = parseFloat(document.getElementById("comision_base").value);
            if (sinComisionBase == 0){
                document.querySelectorAll("[id^='btnRemoveRow_']").forEach((element) => {
                    removeRow(element);
                });
            }
        }
    };

    window.removeRow = (obj) => {
        $(obj).parent().parent().find("[id^='hdn_eliminar']").val("1");

        let objClon = $(obj).parent().parent().clone();
        $("#tfootDetalle").append(objClon);

        $(obj).parent().parent().remove();
    }

    $(document).ready(function () {
        $('[rel="tooltip"]').tooltip();
    });
})();