const changeStatus = async (intRCA) => {
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('rca', intRCA);
    const response = await fetch(urlChangeStatus, {method: 'POST', body: formData});
    const data = await response.json();

    if(data.status) {
        alert_nova.showNotification(data.message);
        getInfo();
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
};

const drawInforExist = async (objData) => {
    if(Object.keys(objData).length > 0) {
        const container = document.getElementById('table-details');
        let strElements = '';
        objData.map((detail, key) => {
            let strButton = `   <button type='button' class='btn btn-outline-success' id='btn-detail-${key}' onclick='changeStatus("${detail.NoRCA}")'>
                                    <i class="fad fa-exchange-alt"></i>
                                    Cambiar
                                </button>`;
            if(detail.NoEstado == '2') {
                strButton = `   <button type='button' class='btn btn-outline-success' disabled>
                                    <i class="fad fa-exchange-alt"></i>
                                    Cambiar
                                </button>`;
            }
            strElements += `<tr>
                                <td>${detail.fecha}</td>
                                <td>${detail.FechaArribo}</td>
                                <td>${detail.Barco}</td>
                                <td>${detail.NoEstado}</td>
                                <td>
                                    ${strButton}
                                </td>
                            </tr>`;
        });
        container.innerHTML = strElements;
    }
};

const getInfo = async () => {
    let formData = new FormData(),
        intWeek = document.getElementById('date_week').value;
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('week', intWeek);
    const response = await fetch(urlGetInfo, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status){
        drawInforExist(data.data);
    }
    else {
        console.error(data.message);
    }
};