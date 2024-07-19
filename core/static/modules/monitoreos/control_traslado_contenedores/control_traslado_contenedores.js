const drawAllCards = async (objData) => {
    const container = document.getElementById('cntTableTrasladoContenedores');
    container.innerHTML = '';
    let strRows = ` <div class="col-12 col-md-6 card-detail card-red" id='content_no_exist'>
                        <div class='row'>
                            <div class='col-12 col-md-6'>
                                No Existe Información a Motrar
                            </div>
                        </div>
                    </div>`,
        strElmCards = '';
    if(Object.keys(objData).length > 0) {
        objData.map(detail => {
            let strColorCard = (detail.bool_email && detail.bool_transfer && detail.bool_filled) ? 'card-green' : 'card-red';
            let strErrors = "";

            if(!detail.bool_email) {
                strErrors += `  <div class='cntErrorMessage'>
                                    No se ha enviado el correo
                                </div>`;
            }
            if(!detail.bool_transfer) {
                strErrors += `  <div class='cntErrorMessage'>
                                    Ocurrio un problema al trasladar el contenedor
                                </div>`;
            }
            if(!detail.bool_filled) {
                strErrors += `  <div class='cntErrorMessage'>
                                    No han completado la informacion los encargados de Transportes (costo, transportista, combustible).
                                </div>`;
            }

            strElmCards += `<div class="col-12 col-md-5 card-detail ${strColorCard}" id='content_${detail.id}'>
                                <div class='row'>
                                    <div class='col-12 col-md-6'>
                                        Bodega Origen: ${detail.bodega_actual}
                                    </div>
                                    <div class='col-12 col-md-6'>
                                        Bodega Destino: ${detail.bodega_destino}
                                    </div>
                                </div>
                                <div class='row'>
                                    <div class='col-12 col-md-6'>
                                        No. Contenedor: ${detail.NoContenedor}
                                    </div>
                                    <div class='col-12 col-md-6'>
                                        Descripcion: ${detail.Descripcion}
                                    </div>
                                </div>
                                <div class='row'>
                                    <div class='col-12 col-md-6'>
                                        Custodio: ${(detail.Custodio) ? 'Si' : 'No'}
                                    </div>
                                    <div class='col-12 col-md-6'>
                                        Costo: Q ${detail.costo}
                                    </div>
                                </div>
                                <div class='row'>
                                    ${strErrors}
                                </div>
                            </div>`;
        });
        
    }
    container.insertAdjacentHTML('beforeend', strElmCards);
};

const getData = async () => {
    open_loading();
    let formData = new FormData(),
        data;
    let date_init = document.getElementById('date-init').value;
    let date_end = document.getElementById('date-end').value;
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('date_init', date_init);
    formData.append('date_end', date_end);
    try {
        const response = await fetch(urlGetData, {method: 'POST', body: formData});
        data = await response.json();
    } catch (error) {
        console.error('Error al consultar la información de la tabla principal');
    }
    close_loading();
    
    if(data?.status) {
        if(Object.keys(data.data).length > 0) {
            drawAllCards(data.data);
        }
    }
    else
        alert_nova.showNotification((data?.message) ? data.message : 'Ocurrio un error inesperado, contacta con soporte', 'warning', 'danger');
};

if(btnSearch)
    btnSearch.addEventListener('click', () => {
        getData();
    });