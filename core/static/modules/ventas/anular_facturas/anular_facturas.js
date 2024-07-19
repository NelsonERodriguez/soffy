const sendFormToNull = async () => {
    open_loading();
    let formData = new FormData(document.getElementById('formSend'));
    formData.append('csrfmiddlewaretoken', valCSRF);
    let response = await fetch(strUrlNull, {method:'POST', body:formData});
    let data = await response.json();
    close_loading();
    if(data.status) {
        alert_nova.showNotification(data.message);
        setTimeout(() => {
            location.reload();
        }, 2500);
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
};

const makeFormToNull = async () => {
    if(Object.keys(objGlobalInvoices).length > 0) {
        const formContainer = document.getElementById('formSend');
        formContainer.innerHTML = '';
        let strElements = '',
            intInvoices = 0,
            intEnvios = 0;
        objGlobalInvoices.map(detail => {
            if(detail.type == 'Factura') {
                intInvoices++;
                strElements += `<input type='hidden' value=${detail.invoice} name='invoices[]' />`;
            }
            else if(detail.type == 'Envio') {
                intEnvios++;
                strElements += `<input type='hidden' value=${detail.invoice} name='envios[]' />`;
            }
        });
        formContainer.innerHTML = strElements;

        if(intInvoices > 0 || intEnvios > 0) {
            let strText = `Usted va a anular ${intInvoices} factura (s) y ${intEnvios} envio (s), ¿Está seguro?`;
            dialogConfirm(sendFormToNull, false, strText);
        }
    }
    else
        alert_nova.showNotification("Ocurrió un error inesperado, contacta con soporte.", 'warning', 'danger');
};

const enableButton = () => {
    let btnAnular = document.getElementById('btnAnular');
    btnAnular.removeAttribute('disabled');
    btnAnular.style.cursor = 'pointer';
    btnAnular.addEventListener('click', () => {
        makeFormToNull();
    });
};

const disabledButton = () => {
    let btnAnular = document.getElementById('btnAnular');
    btnAnular.setAttribute('disabled', true);
    btnAnular.style.cursor = 'not-allowed';
};

const validateInvoicesToNull = () => {
    if(Object.keys(objGlobalInvoices).length > 0)
        enableButton();
    else
        disabledButton();
};

const addToObject = async (intNoFactura, typeDocument) => {
    objGlobalInvoices[intNoFactura] = {
        'invoice': intNoFactura,
        'type': typeDocument,
    };
    validateInvoicesToNull();
};

const removeFromObject = async (intNoFactura) => {
    delete objGlobalInvoices[intNoFactura];
    validateInvoicesToNull();
};

const validateFactura = async (e) => {
    if(e.checked) {
        let typeDocument = e.getAttribute('typeDocument');
        addToObject(e.value, typeDocument);
    }
    else
        removeFromObject(e.value);
};

const drawData = (objData) => {
    open_loading();
    const container = document.getElementById('tBodyContainer');
    let strElements = '';
    if(Object.keys(objData).length > 0) {
        objData.map(detail => {
            let strTypeDocument = (detail.TipoDocumento == 'F') ? 'Factura' : 'Envio',
                prevStrDate = new Date(detail.Fecha);
                strDate = `${prevStrDate.getDate()} / ${prevStrDate.getMonth() + 1} / ${prevStrDate.getFullYear()}`;
            strElements = ` <tr>
                                <td>
                                    <input class='form-control' type='checkbox' typeDocument='${strTypeDocument}' value='${detail.NoFactura}' onchange='validateFactura(this)' />
                                </td>
                                <td>${detail.NoDocumento}</td>
                                <td>${detail.RazonSocial}</td>
                                <td>${strTypeDocument}</td>
                                <td>${strDate}</td>
                                <td>${detail.Nombre}</td>
                            </tr>`;
            container.insertAdjacentHTML('beforeend', strElements);
        });
        
        $('#tblDataInvoices').DataTable({
            "pagingType": "full_numbers",
            "lengthMenu": [ [-1], ["All"] ],
            "order": [1, "asc"],
            responsive: false,
            language: objLenguajeDataTable,
        });
    }
    else {
        strElements = ` <tr style='text-align:center;'>
                            <td colspan='6'>No hay información para mostrar.</td>
                        </tr>`;
        container.insertAdjacentHTML('beforeend', strElements);
    }
    close_loading();
}

const getData = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(strUrlShow, { method:'POST', body:formData });
    const data = await response.json();
    close_loading();
    if(data.status)
        drawData(data.data);
    else
        alert_nova.showNotification(data.message, 'warning', 'danger');
};

getData();