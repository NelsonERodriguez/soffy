let objDataPending = [],
    objDataGlobal = [];
let objDataContainersOnside = [
    {
        'id': '1',
        'parqueo': 'atravesado2',
        'NoContenedor': 'SEGU'
    },
    {
        'id': '2',
        'parqueo': 'posicion5',
        'NoContenedor': 'CAIU'
    },
    {
        'id': '3',
        'parqueo': 'posicion1',
        'NoContenedor': 'BMOU'
    },
    {
        'id': '4',
        'parqueo': 'cruzado1',
        'NoContenedor': 'BMOU'
    },
    {
        'id': '5',
        'parqueo': 'posicion6',
        'NoContenedor': 'BMOU'
    }
];

const allowDrop = async (ev) => { ev.preventDefault(); }

const dragStart = async (ev) => { ev.dataTransfer.setData("text/plain", ev.target.id); }

const sendToSaveByDrag = async (elmDropped, elmFather) => {
    open_loading();
    let formData = new FormData(),
        data = [];
    formData.append('csrfmiddlewaretoken', valCSRF);
    let lot = elmDropped.getAttribute('lote'),
        pOrigen = elmDropped.getAttribute('p-origen'),
        idToDrop = elmDropped.getAttribute('idOcupado'),
        pDestiny = elmFather.getAttribute('position');

    if(pOrigen && pDestiny && lot && idToDrop) {
        formData.append('prev_site', pOrigen);
        formData.append('new_site', pDestiny);
        formData.append('lot', lot);
        formData.append('id_site', idToDrop);
        
        const response = await fetch(urlChangeSiteByDrag, { method: 'POST', body: formData });
        try {
            data = await response.json();
        } catch(error) {
            data = [];
        }

        close_loading();
        if(data?.status) {
            alert_nova.showNotification(data?.message ? data.message : '');
            setTimeout(() => {
                getData();
            }, 2500);
        }
        else
            alert_nova.showNotification(data?.message ? data.message : '', 'warning', 'danger');
    }
    else
        alert_nova.showNotification('Datos incompletos para guardar', 'warning', 'danger');
};

function dropIt(ev) {
    ev.preventDefault();
    let sourceId = ev.dataTransfer.getData("text/plain"),
        sourceIdEl = document.getElementById(sourceId),
        sourceIdParentEl = sourceIdEl.parentElement;

    let targetEl = document.getElementById(ev.target.id);

    if(!targetEl) {
        alert_nova.showNotification('No puedes poner un contenedor encima de otro.', 'warning', 'danger');
    }
    else {
        let targetParentEl = targetEl.parentElement,
            cartTruckExist = targetEl.querySelector('.cardTruckFill');
        if(cartTruckExist?.id) {
            alert_nova.showNotification('Éste parqueo está ocupado', 'warning', 'danger');
        }
        else {
            if (targetParentEl.id !== sourceIdParentEl.id) {
                if (targetEl.className === sourceIdEl.className) {
                    targetParentEl.appendChild(sourceIdEl);
                }
                else {
                    targetEl.appendChild(sourceIdEl);
                    sendToSaveByDrag(sourceIdEl, targetEl);
                }
            }
            else {
                let holder = targetEl,
                    holderText = holder.textContent;
                targetEl.textContent = sourceIdEl.textContent;
                sourceIdEl.textContent = holderText;
                holderText = "";
            }
        }
    }
}

const optionsDestiny = async () => {
    const sltOrigin = document.getElementById('sltOrigin');
    let strReturn = '';

    if(Object.keys(objDataContainersOnside).length > 0) {
        strReturn = `<option value='0'>Selecciona una opción</option>`;
        objDataContainersOnside.map(d => {
            if(d.parqueo != sltOrigin.value) {
                strReturn += `<option value='${d.parqueo}'>${d.NoContenedor} ~ ${d.nombre_parqueo}</option>`;
            }
        });
    }
    

    return strReturn;
};

const setDestinyContainers = async (boolByError = false) => {
    const sltOrigin = document.getElementById('sltOrigin'),
        sltDestiny = document.getElementById('sltDestiny');

    if(sltOrigin) {
        if((sltOrigin.value != '' && sltOrigin.value != '0')) {
            let strOptionsDestiny = await optionsDestiny();
            sltDestiny.disabled = false;
            sltDestiny.innerHTML = strOptionsDestiny;
        }
        else {
            sltDestiny.disabled = true;
            sltDestiny.innerHTML = `<option value='0'>Selecciona primero uno a mover</option>`;
        }
        if(boolByError)
            document.getElementById('btnTransferByError').disabled = true;
        else
            document.getElementById('btnTransferManual').disabled = true;
    }
};

const sendEmptySite = async () => {
    open_loading();
    let formData = new FormData(),
        data = [];
    formData.append('csrfmiddlewaretoken', valCSRF);
    let sltOrigin = document.getElementById('sltOrigin');

    if(sltOrigin.value != '' && sltOrigin.value != "0") {
        formData.append('origin', sltOrigin.value);
        const response = await fetch(urlEmptySite, { method: 'POST', body: formData });
        try {
            data = await response.json();
        } catch(error) {
            data = [];
        }

        close_loading();
        if(data?.status) {
            alert_nova.showNotification(data?.message ? data.message : '');
            setTimeout(() => {
                location.reload();
            }, 2500);
        }
        else
            alert_nova.showNotification(data?.message ? data.message : '', 'warning', 'danger');
    }
    else
        alert_nova.showNotification('Datos incompletos para guardar', 'warning', 'danger');
};

const setEmptySite = async () => {
    const sltOrigin = document.getElementById('sltOrigin');
    if(sltOrigin) {
        const btnEmptySite = document.getElementById('btnEmptySite');
        if((sltOrigin.value != '' && sltOrigin.value != '0'))
            btnEmptySite.disabled = false;
        else
            btnEmptySite.disabled = true;
    }
};

const validateChangeManual = async () => {
    const sltOrigin = document.getElementById('sltOrigin'),
        sltDestiny = document.getElementById('sltDestiny');
    if(sltOrigin && sltDestiny) {
        let btn = document.getElementById('btnTransferManual');
        if((sltOrigin.value != '' && sltOrigin.value != '0') && 
            (sltDestiny.value != '' && sltDestiny.value != '0')) {
                btn.disabled = false;       
        }
        else if(sltDestiny.value == '' || sltDestiny.value == '0') {
            btn.disabled = true;
        }
    }
};

const validateToSave = async (boolByError = false) => {
    open_loading();
    const sltOrigin = document.getElementById('sltOrigin'),
        sltDestiny = document.getElementById('sltDestiny');
    strOrigin = sltOrigin.value;
    strDestiny = sltDestiny.value;
    if(strOrigin != '' && strDestiny != '') {
        let first = objDataGlobal.find(d => d.parqueo == strOrigin),
            second = objDataGlobal.find(d => d.parqueo == strDestiny);

        if(first?.id && second?.id) {
            let formData = new FormData(),
                data = [];
            formData.append('csrfmiddlewaretoken', valCSRF);
            formData.append('first_p', first.lugar_id);
            formData.append('first_id', first.id);
            formData.append('second_p', second.lugar_id);
            formData.append('second_id', second.id);
            if(boolByError)
                formData.append('by_error', '1');
            let response = await fetch(urlChangeManual, { method: 'POST', body: formData });
            try {
                data = await response.json();
            } catch(error) {
                console.error(error);
            }
            close_loading();
            if(data?.status) {
                alert_nova.showNotification(data?.message ? data.message : 'Datos guardados');
                setTimeout( () => {
                    getData();
                }, 2500);
            }
            else {
                alert_nova.showNotification(data?.message ? data.message : "Ocurrio un error", 'warning', 'danger');
            }
        }
        else {
            close_loading();
            alert_nova.showNotification("No se encuentra el contenedor que buscas mover", 'warning', 'danger');
        }
    }
    else {
        close_loading();
        alert_nova.showNotification("Ocurrio un error inesperado, contacta con soporte", 'warning', 'danger');
    }
};

const drawFormChangeManual = async () => {
    const cnt = document.getElementById('cntChangeElmts');
    cnt.innerHTML = '';

    let strOptions = '';
    if(Object.keys(objDataContainersOnside).length > 0) {
        objDataContainersOnside.map(d => {
            strOptions += `<option value='${d.parqueo}'>${d.NoContenedor} ~ ${d.nombre_parqueo}</option>`;
        });
    }

    let elmt = `<div class='col-12 col-md-8 offset-md-2 cntDataTransfer'>
                    <div class='row'>
                        <div class='col-5 cntSelects'>
                            <p class='strTransfer'>Contenedor a Mover</p>
                            <select class='form-control' id='sltOrigin' onchange='setDestinyContainers()'>
                                <option value='0'>Selecciona uno</option>
                                ${strOptions}
                            </select>
                        </div>
                        <div class='col-2 text-center cntButtonsEvents'>
                            <button type='button' class='btn btn-outline-primary' id='btnTransferManual' onclick="validateToSave()" disabled>
                                <span class="material-icons">
                                    sync_alt
                                </span>
                            </button>
                        </div>
                        <div class='col-5 cntSelects'>
                            <p class='strTransfer'>Contenedor a Cambiar</p>
                            <select class='form-control' id='sltDestiny' onchange='validateChangeManual()' disabled>
                                <option value='0'>Selecciona primero uno a mover</option>
                            </select>
                        </div>
                    </div>
                </div>`;
    cnt.insertAdjacentHTML('beforeend', elmt);
};

const changeSiteManual = async () => {
    if(Object.keys(objDataContainersOnside).length > 1)
        drawFormChangeManual();
    else
        alert_nova.showNotification('No puedes intercambiar con un solo contenedor', 'warning', 'danger');
};

const drawButtonEvents = async () => {
    const cnt = document.getElementById('cntButtonsEvents');
    let buttons = ` <div class='col text-center'>
                        <button class='btn btn-outline-info' type='button' ondblclick='errorDblClick()' onclick='changeSiteManual()'>
                            <span class="material-icons">
                                sync_alt
                            </span>
                            Cambio de Lugar
                        </button>
                        <button class='btn btn-outline-danger' type='button' ondblclick='errorDblClick()' onclick='changeSiteByError()'>
                            <span class="material-icons">
                                report
                            </span>
                            Mover por Error
                        </button>
                        <button class='btn btn-outline-primary' type='button' ondblclick='errorDblClick()' onclick='emptySite()'>
                            <span class="material-icons">
                                dashboard_customize
                            </span>
                            Liberar lugar
                        </button>
                    </div>`;
    cnt.innerHTML = '';
    cnt.insertAdjacentHTML('beforeend', buttons);
    document.getElementById('cntChangeElmts').innerHTML = '';
};

const sendByError = async () => {
    let formData = new FormData(),
        data = [];
    let response = await fetch(urlChangeByError, {method: 'POST', body: formData});
    try {
        data = await response.json();
    } catch(error) {
        console.error(error);
    }

    if(data?.status) {
        setTimeout( () => {
            getData();
        }, 2500);
    }
    else {
        alert_nova.showNotification('', 'warning', 'danger');
    }
};

const validateChangeByError = async () => {
    const sltOrigin = document.getElementById('sltOrigin'),
        sltDestiny = document.getElementById('sltDestiny');
    if(sltOrigin && sltDestiny) {
        let btn = document.getElementById('btnTransferByError');
        if((sltOrigin.value != '' && sltOrigin.value != '0') && 
            (sltDestiny.value != '' && sltDestiny.value != '0')) {
                btn.disabled = false;
        }
        else if(sltDestiny.value == '' || sltDestiny.value == '0') {
            btn.disabled = true;
        }
    }
};

const drawFormChangeError = async () => {
    const cnt = document.getElementById('cntChangeElmts');
    cnt.innerHTML = '';

    let strOptions = '';
    if(Object.keys(objDataContainersOnside).length > 0) {
        objDataContainersOnside.map(d => {
            strOptions += `<option value='${d.parqueo}'>${d.NoContenedor} ~ ${d.nombre_parqueo}</option>`;
        });
    }

    let elmt = `<div class='col-12 col-md-8 offset-md-2 cntDataTransfer'>
                    <div class='row'>
                        <div class='col-5 cntSelects'>
                            <p class='strTransfer'>Contenedor a Mover por Error</p>
                            <select class='form-control' id='sltOrigin' onchange='setDestinyContainers(true)'>
                                <option value='0'>Selecciona uno</option>
                                ${strOptions}
                            </select>
                        </div>
                        <div class='col-2 text-center cntButtonsEvents'>
                            <button type='button' class='btn btn-outline-warning' id='btnTransferByError' onclick='validateToSave(true)' disabled>
                                <span class="material-icons">
                                    sync_alt
                                </span>
                            </button>
                        </div>
                        <div class='col-5 cntSelects'>
                            <p class='strTransfer'>Contenedor a Cambiar por Error</p>
                            <select class='form-control' id='sltDestiny' onchange='validateChangeByError()' disabled>
                                <option value='0'>Selecciona primero uno a mover</option>
                            </select>
                        </div>
                    </div>
                </div>`;
    cnt.insertAdjacentHTML('beforeend', elmt);
};

const changeSiteByError = async () => {
    if(Object.keys(objDataContainersOnside).length > 0)
        drawFormChangeError();
    else
        alert_nova.showNotification('No puedes mover contenedores que no existan', 'warning', 'danger');
};

const emptySite = async () => {
    const cnt = document.getElementById('cntChangeElmts');
    cnt.innerHTML = '';

    let strOptions = '';
    if(Object.keys(objDataContainersOnside).length > 0) {
        objDataContainersOnside.map(d => {
            strOptions += `<option value='${d.parqueo}'>${d.NoContenedor} ~ ${d.nombre_parqueo}</option>`;
        });

        let elmt = `<div class='col-12 col-md-8 offset-md-2 cntDataTransfer'>
                        <div class='row'>
                            <div class='col-5 cntSelects'>
                                <p class='strTransfer'>Espacio a Liberar</p>
                                <select class='form-control' id='sltOrigin' onchange='setEmptySite(true)'>
                                    <option value='0'>Selecciona uno</option>
                                    ${strOptions}
                                </select>
                            </div>
                            <div class='col-2 text-center cntButtonsEvents'>
                                <button type='button' class='btn btn-outline-success' id='btnEmptySite' onclick='sendEmptySite()' disabled>
                                    <span class="material-icons">
                                        done
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>`;
        cnt.insertAdjacentHTML('beforeend', elmt);
    }
    else
        alert_nova.showNotification('No hay lugares ocupado', 'warning', 'danger');
};

const makeTruck = async (objData) => {
    if(objData?.NoLote && (objData?.id && objData.id != 'None')) {
        let strElement = `  <div id='cnt_${objData.NoLote}'
                                    p-origen="${objData.parqueo}"
                                    idOcupado="${objData.id}"
                                    lote="${objData.NoLote}"
                                    class="cardTruckFill" draggable="true"
                                    ondragstart="dragStart(event)">
                                <div class='cntCabezal'>
                                    <div class='cntMotorTruck'>
                                        <div class='cntMotor'></div>
                                    </div>
                                    <div class='cntCabinTruck'></div>
                                    <div class='cntSleepTruck'>
                                        <div class='cntDetailSleep'></div>
                                    </div>
                                </div>
                                <div class='cntConectorCabezal'>
                                    <div class='cntConector'></div>
                                </div>
                                <div class='furgon'>
                                    <p>${objData.NoContenedor}</p>
                                </div>
                            </div>`;
        let cnt = document.getElementById(`cnt_${objData.parqueo}`);
        if(cnt) {
            let a = cnt.getElementsByClassName('cardTruckFill');
            if(a.length > 0)
                a[0].remove();
            cnt.insertAdjacentHTML('beforeend', strElement);
        }
    }
};

const drawTrucks = async (objData) => {
    if(Object.keys(objData).length > 0) {
        objData.map(d => {
            makeTruck(d);
        });
        drawButtonEvents();
    }
};

const sendAssignContainer = async () => {
    open_loading();
    let data = [],
        formData = new FormData();

    let sltNoAssign = document.getElementById('sltNoAssign'),
        sltSitesAssign = document.getElementById('sltSitesAssign');
    let optSelected = sltNoAssign.options[sltNoAssign.selectedIndex],
        armado = optSelected.getAttribute('armado'),
        container = objDataPending.find(d => d.NoLote == sltNoAssign.value);
    
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('container', container.NoContenedor);
    formData.append('lot', sltNoAssign.value);
    formData.append('site', sltSitesAssign.value);
    formData.append('armado', armado);
    
    const response = await fetch(urlAssignContainer, {method: 'POST', body: formData});
    try {
        data = await response.json();
    } catch (error) {
        console.error(error);
        data = [];
    }
    close_loading();
    if(data?.status) {
        alert_nova.showNotification(data?.message ? data.message : 'Guardado.');
        setTimeout(() => {
            getData();
        }, 2500);
    }
    else
        alert_nova.showNotification(data?.message ? data.message : 'Ocurrio un error inesperado.', 'warning', 'danger');
};

const validateAssignContainer = async () => {
    const sltNoAssign = document.getElementById('sltNoAssign'),
        sltSitesAssign = document.getElementById('sltSitesAssign');
    if (sltNoAssign && sltSitesAssign) {
        if(sltNoAssign.value != '0' && sltSitesAssign.value != '0')
            btnAssignSite.disabled = false;
        else
            btnAssignSite.disabled = true;
    }
    else
        btnAssignSite.disabled = true;
};

const drawPending = async (objData, objLugares) => {
    if(Object.keys(objData).length > 0) {
        const cnt = document.getElementById('cntSltNoAssign');
        let strOptionsContainers = strOptionsSites = '';
        objData.map(d => {
            strOptionsContainers += `   <option value='${d.NoLote}' armado='${d.armado}'>
                                            ${d.NoContenedor}
                                        </option>`;
        });

        objLugares.map(d => {
            strOptionsSites += `<option value='${d.id}'>
                                    ${d.nombre}
                                </option>`;
        });

        cnt.innerHTML = `   <div class='col-12 cntTitlePending'>
                                <h4>Contenedores pendientes de ingresar</h4>
                            </div>
                            <div class='col-12 col-md-4'>
                                <label for='sltNoAssign'>Selecciona Barco</label>
                                <select class='form-control' id='sltNoAssign' onchange='validateAssignContainer()'>
                                    <option value='0' armado='0'>Selecciona uno</option>
                                    ${strOptionsContainers}
                                </select>
                            </div>
                            <div class='col-12 col-md-4'>
                                <label for='sltSitesAssign'>Selecciona Lugar</label>
                                <select class='form-control' id='sltSitesAssign' onchange='validateAssignContainer()'>
                                    <option value='0'>Selecciona uno</option>
                                    ${strOptionsSites}
                                </select>
                            </div>
                            <div class='col-12 col-md-4 text-left'>
                                <button id='btnAssignSite' type='button' class='btn btn-outline-primary' onclick="sendAssignContainer()" disabled>
                                    Asignar
                                </button>
                            </div>`;
    }
};

const getData = async () => {
    open_loading();
    let formData = new FormData(),
        data = [];
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetData, { method: 'POST', body: formData });
    try {
        data = await response.json();
    } catch (error) {
        console.error(error);
        data = [];
    }
    close_loading();
    objDataContainersOnside = [];
    if(data?.status) {
        if(data?.data && Object.keys(data.data).length > 0) {
            objDataGlobal = data.data;
            objDataContainersOnside = data['data'].filter(d => d.lugar_id != 'None' && d.ocupado != 'None' && d.parqueo != 'None');
            objDataPending = data['data'].filter(d => d.lugar_id == 'None' && d.ocupado == 'None' && d.parqueo == 'None');
            drawTrucks(objDataContainersOnside);
            drawPending(objDataPending, data['lugares']);
        }
    }
    else
        console.error(data?.message ? data.message : 'Ocurrio un error inesperado');
};

getData();
