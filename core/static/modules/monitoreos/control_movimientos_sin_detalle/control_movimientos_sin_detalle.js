const drawAll = async (objData) => {
    const container = document.getElementById('contentDetails');
    container.innerHTML = '';
    let strRows = ` <tr class='tr-red'>
                        <td colspan='3'>No hay información a mostrar</td>
                    </tr>`;
        strElmCards = '';
    if(Object.keys(objData).length > 0) {
        let intKey = 1;
        strRows = '';
        objData.map(detail => {
            strElmCards += `<tr>
                                <td data-filter="${detail.fecha}">${detail.fecha}</td>
                                <td data-filter="${detail.NoDocumento * 1}">${detail.NoDocumento}</td>
                                <td data-filter="${detail.NoMovimiento * 1}">${detail.NoMovimiento}</td>
                            </tr>`;
            intKey++;
        });   
    }
    
    container.insertAdjacentHTML('beforeend', strElmCards);

    $('#dtDefault').DataTable({
        'pageLength': 1000,
        "ordering": false,
        dom: 'lBfrtip',
        buttons: [{
            extend: 'excel',
            text: 'Excel',
            className: 'btn btn-default',
            exportOptions: {
                modifier: {
                    page: 'current'
                }
            }
        }]
    });
};

const drawHeaders = async () => {
    const container = document.getElementById('contentTbl');
    container.innerHTML = ` <table class="table table-bordered" id="dtDefault" style="width: 100% !important;">
                                <thead class='table-dark'>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Documento</th>
                                        <th>Movimiento</th>
                                    </tr>
                                </thead>
                                <tbody id="contentDetails"></tbody>
                            </table>`;
};

const getData = async () => {
    open_loading();
    let formData = new FormData(),
        data;
    let date_init = document.getElementById('date-init').value;
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('date_init', date_init);

    try {
        const response = await fetch(urlGetData, {method: 'POST', body: formData});
        data = await response.json();
    } catch (error) {
        console.error('Error al consultar la información de la tabla principal');
    }
    close_loading();
    
    if(data?.status) {
        await drawHeaders();
        drawAll(data.data);
    }
    else
        alert_nova.showNotification((data?.message) ? data.message : 'Ocurrio un error inesperado, contacta con soporte', 'warning', 'danger');
};

if(btnSearch)
    btnSearch.addEventListener('click', () => {
        getData();
    });