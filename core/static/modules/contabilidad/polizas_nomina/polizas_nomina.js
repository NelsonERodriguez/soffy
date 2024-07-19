$(document).ready(function(){
    $("#sltEmpresa").select2();
});

const fntCalcularTotales = () => {
    sinDebe = 0;
    sinHaber = 0;
    tblPolizas.$(".input-numerico").each(function(){
        let arrId = this.id.split("_");
        let sinValor = parseFloat(this.value.replace(",",""));
        if( arrId[0] == "txtDebe" ){
            sinDebe += sinValor;
        }
        else if( arrId[0] == "txtHaber" ){
            sinHaber += sinValor;
        }
    });
    document.getElementById("tdTotalDebe").innerHTML = currencyFormat.format(sinDebe);
    document.getElementById("tdTotalHaber").innerHTML = currencyFormat.format(sinHaber);
    
}

const fntCambioDebeHaber = ( obj ) => {
    let strId = obj.id;
    let arrId = strId.split("_");

    if( parseFloat(obj.value) > 0 ){
        if( arrId[0] == "txtDebe" ){
            document.getElementById(`txtHaber_${arrId[1]}`).value = "0.00"
        }
        else if( arrId[0] == "txtHaber" ){
            document.getElementById(`txtDebe_${arrId[1]}`).value = "0.00"
        }
    }

    fntCalcularTotales();
}

const fntGetResumen = (boolTimeout) => {

    if( document.getElementById("sltEmpresa").value < 0 || document.getElementById("txtFechaInicial").value.length == 0
        || document.getElementById("txtFechaFinal").value.length == 0 || document.getElementById("txtPoliza").value.length == 0
        || document.getElementById("sltBase").value < 0 ){
        alert_nova.showNotification("Llene todos los campos obligatorios para obtener el resumen", "warning", "danger");
        return false;
    }
    open_loading();
    const data = new FormData();
    data.append('csrfmiddlewaretoken', valCSRF);
    data.append('empresa', document.getElementById("sltEmpresa").value);
    data.append('fecha_inicial', document.getElementById("txtFechaInicial").value);
    data.append('fecha_final', document.getElementById("txtFechaFinal").value);
    data.append('no_poliza', document.getElementById("txtPoliza").value);
    data.append('nonomina', document.getElementById("sltBase").value);

    fetch(strUrlGetResumen, {
        method: 'POST',
        body: data,
    })
    .then(response => response.json())
    .then( (data) => {
        if( data.status ){

            let arrDataResumen = data.resumen;

            $("#divResumen").dxPivotGrid({
                showColumnGrandTotals:true,
                showColumnTotals:true,
                showRowGrandTotals:true,
                showRowTotals:true,
                showBorders: true,
                allowSorting: true,
                allowFiltering: true,
                export: {
                    enabled: true,
                    fileName: "Resumen de la Póliza",
                },
                fieldChooser: {
                    allowSearch: false,
                    applyChangesMode: "instantly",
                    enabled: true,
                    height: 600,
                    layout: 0,
                    searchTimeout: NaN,
                    title: "Tabla dinamica",
                    width: 400,
                    texts: {
                        allFields: "Campos",
                        columnFields: "Columnas",
                        dataFields: "Valores",
                        rowFields: "Filas",
                        filterFields: "Filtros"
                    }
                },
                dataSource: {
                    fields: [
                        {
                            dataField: "area",
                            caption: "Área",
                            dataType: "string",
                            area: "row",
                            sortBySummaryField: "Venta",
                            sortOrder: "desc",
                            width: 300
                        },
                        {
                            dataField: "nombrecuenta",
                            caption: "Cuenta",
                            dataType: "string",
                            area: "row",
                            width: 200
                        },
                        {
                            dataField: "empleado",
                            caption: "Empleado",
                            dataType: "string",
                            area: "row",
                            width: 200
                        },
                        {
                            dataField: "SUMADEBE",
                            caption: "Debe",
                            area: "data",
                            dataType: "number",
                            summaryType: "sum",
                            alignment: "right",
                            sortOrder: "asc",
                            allowFiltering: false,
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            }
                        },
                        {
                            dataField: "SUMAHABER",
                            caption: "Haber",
                            area: "data",
                            dataType: "number",
                            summaryType: "sum",
                            alignment: "right",
                            allowFiltering: false,
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            }
                        }
                    ],
                    store: arrDataResumen
                }
            }).dxPivotGrid("instance");
        }
        else{
            alert_nova.showNotification(`${data.msj}`, "warning", "danger");
        }
        close_loading();
    })
    .catch((error) => {
        close_loading();
    });

    if( boolTimeout ){
        setTimeout(function(){
            fntGetResumen(true);
        }, 300000);
    }
}

const fntGetNomina = () => {

    if( document.getElementById("sltEmpresa").value < 0 || document.getElementById("txtFechaInicial").value.length == 0
        || document.getElementById("txtFechaFinal").value.length == 0 || document.getElementById("txtPoliza").value.length == 0
        || document.getElementById("sltBase").value < 0 ){
        alert_nova.showNotification("Llene todos los campos obligatorios para revisar la nómina", "warning", "danger");
        return false;
    }
    open_loading();
    const data = new FormData();
    data.append('csrfmiddlewaretoken', valCSRF);
    data.append('empresa', document.getElementById("sltEmpresa").value);
    data.append('fecha_inicial', document.getElementById("txtFechaInicial").value);
    data.append('fecha_final', document.getElementById("txtFechaFinal").value);
    data.append('no_poliza', document.getElementById("txtPoliza").value);
    data.append('nonomina', document.getElementById("sltBase").value);

    fetch(strUrlNominas, {
        method: 'POST',
        body: data,
    })
    .then(response => response.json())
    .then( (data) => {
        if( data.status ){
            $("#divContenido").html(data.html);

            $("input[id^='txtNoCuentaContable_']").autocomplete({
                minLength: 1,
                source: function( request, response ) {
                    open_loading();
                    let strUrl = strUrlBuscarCuenta;
                    strUrl = strUrl.replace('search', request.term);
                    const data = new FormData();
                    data.append('csrfmiddlewaretoken', valCSRF);

                    fetch(strUrl, {
                    method: 'POST',
                    body: data,
                    })
                    .then(response => response.json())
                    .then( (data) => {
                        close_loading();
                        response($.map(data, function (item) {
                            return {
                                label: item.name,
                                value: item.id,
                                cuenta: item.cuenta
                            }
                        }))
                    })
                    .catch((error) => {
                        close_loading();
                        console.error(error);
                    });
                },
                select: function( event, ui ) {
                    event.preventDefault();
                    let arrSplit = this.id.split("_");
                    document.getElementById(`lblCuentaContable_${arrSplit[1]}`).innerHTML = ui.item.cuenta;
                    this.value = ui.item.value;
                }
            });

            $("input[id^='txtNoArea_']").autocomplete({
                minLength: 1,
                source: function( request, response ) {
                    open_loading();
                    let strUrl = strUrlBuscarArea;
                    strUrl = strUrl.replace('search', request.term);
                    const data = new FormData();
                    data.append('csrfmiddlewaretoken', valCSRF);

                    fetch(strUrl, {
                    method: 'POST',
                    body: data,
                    })
                    .then(response => response.json())
                    .then( (data) => {
                        close_loading();
                        response($.map(data, function (item) {
                            return {
                                label: item.name,
                                value: item.id,
                                area: item.area
                            }
                        }))
                    })
                    .catch((error) => {
                        close_loading();
                        console.error(error);
                    });
                },
                select: function( event, ui ) {
                    event.preventDefault();
                    let arrSplit = this.id.split("_");
                    // let strTexto = document.getElementById(`hdnDescripcion_${arrSplit[1]}`).value
                    // strTexto = strTexto.replace("texto_area", ui.item.area)
                    document.getElementById(`lblDescripcion_${arrSplit[1]}`).innerHTML = ui.item.area;
                    this.value = ui.item.value;
                },
                position: { my : "right top", at: "right bottom" }
            });

            tblPolizas = $("#tblPolizas").DataTable({
                "pagingType": "full_numbers",
                "lengthMenu": [
                    [10, 25, 50, -1],
                    [10, 25, 50, "Todos"]
                ],
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false}
                ],
                responsive: false,
                language: objLenguajeDataTable,
                autoPrint: false,
                dom: 'lBfrtip',
                buttons: [
                    {
                        extend: 'excel',
                        text: 'Excel',
                        className: 'btn btn-default',
                        exportOptions: {
                            format: {
                                body: function ( data, row, column, node ) {
                                    return $(data).is("input") ?
                                    $(data).val():
                                    ($(data).is("label") ?
                                    $(data).text():
                                    data);
                                }
                            }
                        }
                    }
                ]
            });

            $(document).on("change", ".input-numerico", function(e){
                fntCambioDebeHaber(this);
            });

            let arrDataResumen = data.resumen;

            $("#divResumen").dxPivotGrid({
                showColumnGrandTotals:true,
                showColumnTotals:true,
                showRowGrandTotals:true,
                showRowTotals:true,
                showBorders: true,
                allowSorting: true,
                allowFiltering: true,
                export: {
                    enabled: true,
                    fileName: "Resumen de la Póliza",
                },
                fieldChooser: {
                    allowSearch: false,
                    applyChangesMode: "instantly",
                    enabled: true,
                    height: 600,
                    layout: 0,
                    searchTimeout: NaN,
                    title: "Tabla dinamica",
                    width: 400,
                    texts: {
                        allFields: "Campos",
                        columnFields: "Columnas",
                        dataFields: "Valores",
                        rowFields: "Filas",
                        filterFields: "Filtros"
                    }
                },
                dataSource: {
                    fields: [
                        {
                            dataField: "area",
                            caption: "Área",
                            dataType: "string",
                            area: "row",
                            sortBySummaryField: "Venta",
                            sortOrder: "desc",
                            width: 300
                        },
                        {
                            dataField: "nombrecuenta",
                            caption: "Cuenta",
                            dataType: "string",
                            area: "row",
                            width: 200
                        },
                        {
                            dataField: "empleado",
                            caption: "Empleado",
                            dataType: "string",
                            area: "row",
                            width: 200
                        },
                        {
                            dataField: "SUMADEBE",
                            caption: "Debe",
                            area: "data",
                            dataType: "number",
                            summaryType: "sum",
                            alignment: "right",
                            sortOrder: "asc",
                            allowFiltering: false,
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            }
                        },
                        {
                            dataField: "SUMAHABER",
                            caption: "Haber",
                            area: "data",
                            dataType: "number",
                            summaryType: "sum",
                            alignment: "right",
                            allowFiltering: false,
                            format: {
                                type: "currency",
                                precision: 2,
                                currency: "GTQ"
                            }
                        }
                    ],
                    store: arrDataResumen
                }
            }).dxPivotGrid("instance");

            setTimeout(function(){
                fntGetResumen(true);
            }, 300000);
        }
        else{
            document.getElementById("divContenido").innerHTML = "";
            alert_nova.showNotification(`${data.msj}`, "warning", "danger");
        }
        close_loading();
    })
    .catch((error) => {
        close_loading();
    });
}

const fntGuardarCampo = (objInput) => {
    const data = new FormData();
    data.append('csrfmiddlewaretoken', valCSRF);
    data.append('campo', objInput.id);
    data.append('valor', objInput.value);

    let arrSplit = objInput.id.split("_")
    if( arrSplit[0] == "txtDebe" ){
        if( parseFloat(objInput.value) > 0 ){
            data.append('extra', "0.00");
        }
        else{
            data.append('extra', document.getElementById(`txtHaber_${arrSplit[1]}`).value);
        }
    }
    else if( arrSplit[0] == "txtHaber" ){
        if( parseFloat(objInput.value) > 0 ){
            data.append('extra', "0.00");
        }
        else{
            data.append('extra', document.getElementById(`txtDebe_${arrSplit[1]}`).value);
        }
    }
    else if( arrSplit[0] == "txtNoCuentaContable" ){
        data.append('extra', document.getElementById(`lblCuentaContable_${arrSplit[1]}`).innerHTML);
    }
    
    // open_loading();
    fetch(strUrlGuardarCampo, {
        method: 'POST',
        body: data,
    })
    .then(response => response.json())
    .then(data => {
        if(data.status){
            alert_nova.showNotification(`${data.msj}`, "add_alert", "success");
        }
        else{
            alert_nova.showNotification(`${data.msj}`, "warning", "danger");
        }
        // close_loading();
    })
    .catch(error => {
        console.error(error)
        // close_loading();
    });
}

const fntGuardar = () => {
    let sinDebe = 0;
    let sinHaber = 0;
    tblPolizas.$(".input-numerico").each(function(){
        let arrId = this.id.split("_");
        let sinValor = parseFloat(this.value.replace(",",""));
        if( arrId[0] == "txtDebe" ){
            sinDebe += sinValor;
        }
        else if( arrId[0] == "txtHaber" ){
            sinHaber += sinValor;
        }
    });

    let sinDebe2 = parseFloat(sinDebe).toFixed(2);
    let sinHaber2 = parseFloat(sinHaber).toFixed(2);

    if( sinDebe2 != sinHaber2 ){
        alert_nova.showNotification("No cuadra el debe y el haber. Verifique los montos ingresados.", "warning", "danger");
        return false;
    }

    if( document.getElementById("sltEmpresa").value < 0 || document.getElementById("txtFechaInicial").value.length == 0
        || document.getElementById("txtFechaFinal").value.length == 0 || document.getElementById("txtPoliza").value.length == 0 ){
        alert_nova.showNotification("Llene todos los campos obligatorios para guardar la nómina", "warning", "danger");
        return false;
    }

    const data = new FormData();
    data.append('csrfmiddlewaretoken', valCSRF);
    data.append('empresa', document.getElementById("sltEmpresa").value);
    data.append('fecha_inicial', document.getElementById("txtFechaInicial").value);
    data.append('fecha_final', document.getElementById("txtFechaFinal").value);
    data.append('no_poliza', document.getElementById("txtPoliza").value);
    data.append('nonomina', document.getElementById("sltBase").value);
    
    open_loading();
    fetch(strUrlGuardar, {
        method: 'POST',
        body: data,
    })
    .then(response => response.json())
    .then(data => {
        if(data.status){
            document.getElementById("divContenido").innerHTML = "";
            alert_nova.showNotification(`${data.msj}`, "add_alert", "success");

        }
        else{
            alert_nova.showNotification(`${data.msj}`, "warning", "danger");
        }
        close_loading();
    })
    .catch(error => {
        console.error(error)
        close_loading();
    });
}
