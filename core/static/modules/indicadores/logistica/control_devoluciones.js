if(btn) {
    btn.addEventListener('click', () => {
        getInfo();
    });
}

function getInfo() {
    open_loading();
    let formData = new FormData();
    formData.append('no_pedido', document.getElementById('txtNoPedido').value);
    formData.append('csrfmiddlewaretoken', valCSRF);

    if( document.getElementById('txtNoPedido').value.length == 0 ){
        document.getElementById('contentTable').innerHTML = "";
        return false;
    }

    fetch(`${urlGetInfo}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if(data.status){
            drawTable(data.result);
        }
        close_loading();
    })
    .catch(error => console.error(error))
}

async function drawTable(objData){
    const content = document.getElementById('contentTable');
    let tBody = await drawDetailTable(objData);

    let tdAprobada = "";
    if( boolPemisoAprobar ){
        tdAprobada = `
            <th>
                Cobrar
            </th>
        `
    }

    content.innerHTML = `   <table class='table' id='dtDefault'>
                                <thead>
                                    <tr>
                                        <th>No Pedido</th>
                                        <th>Cliente</th>
                                        <th>Piloto</th>
                                        <th>Vendedor</th>
                                        <th>Fecha Pedido</th>
                                        <th>Orden Transporte</th>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Libras Devueltas</th>
                                        <th>Causa</th>
                                        <th>Observaciones</th>
                                        <th>Mes</th>
                                        <th>Quincena</th>
                                        <th>Año</th>
                                        ${tdAprobada}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tBody}
                                </tbody>
                            </table>
                            <div class="row">
                                <div class="col-md-12 text-center">
                                    <button class="btn btn-primary" type="button" onclick="fntGuardar()">
                                        <i class="fas fa-save"></i> Guardar
                                    </button>
                                </div>
                            </div>
                            `;
    makeDataTableDefault(true, true);

    $(".select2").select2();
}

async function drawDetailTable(objData){
    
    var intCorrelativo = 1;
    let strElements = '';
    objData.map(data => {
        intCorrelativo++;
        let strSelect = `<select class="form-control select2" id="sltCausa_${intCorrelativo}" name="sltCausa_${intCorrelativo}"> style="width: 100%;"`;
        strSelect += `<option value="-1">Seleccione Causa...</option>`;
        objCausa.forEach(element => {
            strSelect += `<option value="${element.id}">${element.descripcion}</option>`;
        });
        strSelect += '</select>';

        let date = new Date(data.FechaPedido);
        let fechaGt = dateGTFormat.format(date);
        let fechaOrder = new Intl.DateTimeFormat('en-US').format(date);

        let fechaOrden = new Date(data.OrdenTransporte);
        let fechaOrdenGt = dateGTFormat.format(date);
        let fechaOrdenOrder = new Intl.DateTimeFormat('en-US').format(date);

        if( data.Causa == null && boolPemisoAprobar == false ){
            strElements += `<tr>
                                <td>${data.NoDocumento}</td>
                                <td>${data.nombre}</td>
                                <td>${data.piloto}</td>
                                <td>${data.Vendedor}</td>
                                <td data-order="${fechaOrder}">${fechaGt}</td>
                                <td data-order="${fechaOrdenOrder}">${fechaOrdenGt}</td>
                                <td>${data.NombreProducto}</td>
                                <td>${data.MaximoLibras}</td>
                                <td>
                                    <input type="number" class="form-control" data-maximo="${data.MaximoLibras}" id="txtLibras_${intCorrelativo}" name="txtLibras_${intCorrelativo}">
                                    <input type="hidden" id="hdnLinea_${intCorrelativo}" name="hdnLinea_${intCorrelativo}" value="${data.Linea}">
                                    <input type="hidden" id="hdnNoCotizacion_${intCorrelativo}" name="hdnNoCotizacion_${intCorrelativo}" value="${data.NoCotizacion}">
                                </td>
                                <td style="padding-top: 22px !important;">${strSelect}</td>
                                <td>
                                    <input type="text" class="form-control" maxlength="255" id="txtObservaciones_${intCorrelativo}" name="txtObservaciones_${intCorrelativo}">
                                </td>
                                <td>${data.Mes}</td>
                                <td>${data.Año}</td>
                                <td>${data.Quincena}</td>
                            </tr>`;
        }
        else{
            let librasDevueltas = data.libras_devueltas == null ? "No Ingresadas" : data.libras_devueltas;
            let causa = data.Causa == null ? "No Ingresada" : data.Causa;
            let observaciones = data.observaciones == null ? "No Ingresadas" : data.observaciones;
            let tdAprobada = "";
            if( boolPemisoAprobar ){
                if( data.revisado ){
                    let strAprobado = "<span class='text-success'>No Cobrado</span>"
                    if( data.aprobado ){
                        strAprobado = "<span class='text-danger'>Cobrado</span>"
                    }
                    tdAprobada = `
                        <td>
                            ${strAprobado}
                        </td>`
                }
                else{
                    if( data.IdPrincipalCausa == null ){
                        tdAprobada = `
                        <td>
                            No Disponible
                        </td>`
                    }
                    else{
                        tdAprobada = `
                        <td>
                            <button class="btn btn-outline-danger btn-sm" type="button" onclick="fntAprobarRechazar(${data.IdPrincipalCausa},1)">
                                Cobrar
                            </button>
                            <br>
                            <button class="btn btn-outline-success btn-sm" type="button" onclick="fntAprobarRechazar(${data.IdPrincipalCausa},0)">
                                No Cobrar
                            </button>
                        </td>`
                    }
                    
                }
                    
            }
            strElements += `<tr>
                                <td>${data.NoDocumento}</td>
                                <td>${data.nombre}</td>
                                <td>${data.piloto}</td>
                                <td>${data.Vendedor}</td>
                                <td data-order="${fechaOrder}">${fechaGt}</td>
                                <td data-order="${fechaOrdenOrder}">${fechaOrdenGt}</td>
                                <td>${data.NombreProducto}</td>
                                <td>${data.MaximoLibras}</td>
                                <td>${librasDevueltas}</td>
                                <td>${causa}</td>
                                <td>${observaciones}</td>
                                <td>${data.Mes}</td>
                                <td>${data.Año}</td>
                                <td>${data.Quincena}</td>
                                ${tdAprobada}
                            </tr>`;
        }
    });
    return strElements;
}

function fntAprobarRechazar(intId, intAprobado) {
    if( boolPemisoAprobar ){
        let formData = new FormData();
        formData.append('csrfmiddlewaretoken', valCSRF);
        formData.append('intId', intId);
        formData.append('intAprobado', intAprobado);

        open_loading();
        fetch(`${urlAprobar}`, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if(data.status){
                getInfo()
                alert_nova.showNotification(data.msj, "add_alert", "success");
            }
            close_loading();
        })
        .catch(error => console.error(error))
    }
}

function fntGuardar() {
    let objForm = document.getElementById("frmDevoluciones");
    let formData = new FormData(objForm);
    formData.append('csrfmiddlewaretoken', valCSRF);

    var boolError = false;

    $("input[id^='txtLibras_']").each(function(){
        var arrSplit = $(this).attr("id").split("_");

        if( parseFloat($(this).val()) > parseFloat($(this).data("maximo")) ){
            boolError = true;
            alert_nova.showNotification("Verifique los valores en libras ingresados ya que son mayor a los que están en el pedido", "warning", "danger");
        }

        if( ($.trim($(this).val()).length == 0 && parseInt($("#sltCausa_"+arrSplit[1]).val()) > 0) || ($.trim($(this).val()).length > 0 && parseInt($("#sltCausa_"+arrSplit[1]).val()) < 0) ){
            boolError = true;
            alert_nova.showNotification("Si desea registrar una devolucion, debe de llenar los dos campos. (Libras devueltas y Causa)", "warning", "danger");
        }
    });

    if( boolError ){
        return false;
    }

    if( document.getElementById('txtNoPedido').value.length == 0 ){
        document.getElementById('contentTable').innerHTML = "";
        return false;
    }

    open_loading();
    fetch(`${urlGuardar}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if(data.status){
            getInfo()
            alert_nova.showNotification(data.msj, "add_alert", "success");
        }
        close_loading();
    })
    .catch(error => console.error(error))
}