const drawTableData = async (objData, boolHistory = false) => {
    boolHistory = boolHistory ? true : false;
    let strElements = '';
    if(Object.keys(objData).length > 0) {
        urlEditDetail = urlEditDetail.replace('0', '');
        objData.map(d => {
            let fechaOrden = new Date(d.Fecha);
            let fechaOrdenGt = dateGTFormat.format(fechaOrden);
            let strUrlPivote = urlShowDetail;
            strUrlPivote = strUrlPivote.replace("search", d.NoOrden);

            strElements += `<tr>
                                <td>${d.NoOrden}</td>
                                <td>${d.NombrePiloto}</td>
                                <td>${d.NoRuta}</td>
                                <td data-order="${d.Fecha}">${fechaOrdenGt}</td>
                                <td>${d.Estado}</td>
                                <td>
                                    <a type="button" rel="tooltip" class="btn btn-info btn-just-icon btn-link" data-original-title="Ver Liquidación" href="${strUrlPivote}">
                                        <i class="fas fa-eye"></i>
                                    </a>
                                </td>
                            </tr>`;
        });
    }
    if( boolHistory ) {
        if( objDataTableL !== null ) {
            objDataTableL.clear().destroy();
            objDataTableL = null;
        }
        document.getElementById('tBodyHistorial').innerHTML = strElements;
    }
    else{
        if( objDataTableP !== null ) {
            objDataTableP.clear().destroy();
            objDataTableP = null;
        }
        document.getElementById('tBodyDefault').innerHTML = strElements;
    }
};

const getDataList = async ( boolHistory = false ) => {
    boolHistory = boolHistory ? true : false;
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);

    let strUrlFetch = boolHistory ? urlGetDataHistory : urlGetData;

    open_loading();
    const response = await fetch(strUrlFetch, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status){
        await drawTableData(data.result, boolHistory);
        if( boolHistory ){
            // makeDataTableDefault(true, true, {}, "dtHistorial");
            objDataTableL = $('#dtHistorial').DataTable({
                "pagingType": "full_numbers",
                "lengthMenu": [
                    [10, 25, 50, -1],
                    [10, 25, 50, "Todos"]
                ],
                "order": [[0, 'desc']],
                language: objLenguajeDataTable,
            });
        }
        else{
            objDataTableP = $('#dtDefault').DataTable({
                "pagingType": "full_numbers",
                "lengthMenu": [
                    [10, 25, 50, -1],
                    [10, 25, 50, "Todos"]
                ],
                "order": [[0, 'desc']],
                language: objLenguajeDataTable,
            });
            // makeDataTableDefault();
        }
    }
    else {
        if( boolHistory ) {
            document.getElementById('tBodyHistorial').innerHTML = `
                <tr>
                    <td colspan="6" style='text-align:center;'>No hay información a mostrar</td>
                </tr>`;
        }
        else{
            document.getElementById('tBodyDefault').innerHTML = `
                <tr>
                    <td colspan="6" style='text-align:center;'>No hay información a mostrar</td>
                </tr>`;
        }
    }
    close_loading();
};

const drawTableDataRecepcion = async (objData) => {
    let strElements = '';
    if(Object.keys(objData).length > 0) {
        urlEditDetail = urlEditDetail.replace('0', '');
        objData.map(d => {
            let fechaOrden = new Date(d.Fecha);
            let fechaOrdenGt = dateGTFormat.format(fechaOrden);
            let strUrlPivote = urlShowDetail;
            strUrlPivote = strUrlPivote.replace("search", d.NoOrden);

            strElements += `<tr>
                                <td>${d.NoOrden}</td>
                                <td>${d.NombrePiloto}</td>
                                <td>${d.NoRuta}</td>
                                <td data-order="${d.Fecha}">${fechaOrdenGt}</td>
                                <td>${d.Estado}</td>
                                <td>
                                    <a type="button" rel="tooltip" class="btn btn-info btn-just-icon btn-link" data-original-title="Recibir Orden" href="#" onclick="fntPreguntarUpdate(${d.NoOrden})">
                                        <i class="dx-link dx-icon fad fa-user-check fa-2x kt-font-success"></i>
                                    </a>
                                </td>
                            </tr>`;
        });
    }

    if( objDataTableR !== null ) {
        objDataTableR.clear().destroy();
        objDataTableR = null;
    }

    document.getElementById('tBodyRecepcion').innerHTML = strElements;
};

const getDataRecepcion = async () => {
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);

    open_loading();
    const response = await fetch(urlGetDataRecepcion, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status){
        await drawTableDataRecepcion(data.result);
        // makeDataTableDefault(true, true, {}, "dtRecepcion");
        objDataTableR = $('#dtRecepcion').DataTable({
            "pagingType": "full_numbers",
            "lengthMenu": [
                [10, 25, 50, -1],
                [10, 25, 50, "Todos"]
            ],
            "order": [[0, 'desc']],
            language: objLenguajeDataTable,
        });
        $('[rel="tooltip"]').tooltip();
    }
    else {
        document.getElementById('tBodyRecepcion').innerHTML = `
            <tr>
                <td colspan="6" style='text-align:center;'>No hay información a mostrar</td>
            </tr>`;
    }
    close_loading();
};

const fntUpdateOrdenRecepcion = async () => {
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('no_orden', intOrdenIdGlobal);

    open_loading();
    const response = await fetch(urlUpdatePendiente, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status){
        alert_nova.showNotification(data.message, "add_alert", "success");
    }
    else {
        alert_nova.showNotification(data.message, "warning", "danger");
    }
    close_loading();

    await getDataRecepcion();
};

const fntPreguntarUpdate = async (intOrdenId) => {
    intOrdenIdGlobal = intOrdenId;
    dialogConfirm(fntUpdateOrdenRecepcion, false, `¿Esta seguro de recibir la Orden de Transporte ${intOrdenId}?`, '¡Se removerá del listado y se actualizará!', 'error');
};

getDataRecepcion();