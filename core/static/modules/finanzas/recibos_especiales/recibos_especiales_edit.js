const sendFormUpdate = async () => {
    open_loading();
    let formData = new FormData(document.getElementById('frm-general'));
    let response = await fetch(strUrlUpdate, {method: 'POST', body: formData});
    let data = [];
    try {
        data = await response.json();
    } catch(error) {
        data = [];
        console.error(error);
    }
    close_loading();
    if(data?.status) {
        alert_nova.showNotification(data.message);
        setTimeout(() => {
            location.reload();
        }, 2500);
    }
};

const sendToUpdate = async () => {
    let boolForm = await validateForm();
    if(boolForm)
        sendFormUpdate();
    else
        alert_nova.showNotification('No puedes guardar por que no tienes información completa.', 'warning', 'danger');
};

if (btnUpdate) {
    btnUpdate.addEventListener('click', () => {
        sendToUpdate();
    });
    btnUpdate.addEventListener('dblclick', () => {
        errorDblClick();
    });
}
