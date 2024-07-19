const des = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
Object.defineProperty(HTMLInputElement.prototype, 'value', {
    get: function() {
        const value = des.get.call(this);
        if (this.type === 'text' && this.list) {
            const opt = [].find.call(this.list.options, o => o.value === value);
            return opt ? opt.dataset.value : value;
        }
        return value;
    }
});

const sendToSave = async () => {
    open_loading();
    let formData = new FormData(document.getElementById('formSave'));
    const response = await fetch(urlCompleteTransfer, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status) {
        alert_nova.showNotification(data.message, 'add_alert', 'success');
        setTimeout(() => {
            location.reload();
        }, 2500)
    }
    else {
        console.error(data.message);
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
    close_loading();
};

const validateDataToSave = async () => {
    const elements = document.querySelectorAll('.element-done'),
        content = document.getElementById('contentElements');
    let intToSave = 0,
        boolError = false;
    content.innerHTML = '';
    elements.forEach(element => {
        if(element.checked) {
            let intKey = element.getAttribute('int-key'),
                custodian = document.getElementById(`custodian_${intKey}`).value,
                carrier = document.getElementById(`carrier_${intKey}`).value,
                cost = document.getElementById(`cost_${intKey}`).value,
                diesel = document.getElementById(`diesel_${intKey}`).value;

                if(custodian !== '' && carrier !== '' && cost !== '' && diesel !== '') {
                    let strElements = ` <input type='hidden' value='${custodian}' name='custodian[]'>
                                        <input type='hidden' value='${carrier}' name='carrier[]'>
                                        <input type='hidden' value='${cost}' name='cost[]'>
                                        <input type='hidden' value='${diesel}' name='diesel[]'>
                                        <input type='hidden' value='${intKey}' name='id[]'>`;
                    content.innerHTML += strElements;
                }
                else
                    boolError = true;
            intToSave++;
        }
    });

    if(intToSave > 0 && !boolError)
        sendToSave();
    else
        alert_nova.showNotification('Debe de seleccionar información para guardar', 'warning', 'danger');
};

const getCost = async (intKey) => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('actually', document.getElementById(`actually_${intKey}`).value);
    formData.append('destiny', document.getElementById(`destiny_${intKey}`).value);
    formData.append('carrier', document.getElementById(`carrier_${intKey}`).value);
    const response = await fetch(urlCostByFilters, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status) {
        let intPrice =  (typeof data.data.precio !== 'undefined') ? (data.data.precio * 1) : 0;
        document.getElementById(`cost_${intKey}`).value = intPrice;
    }
    else {
        console.error(data.message);
    }
    close_loading();
};

const showButtonCleanCarrier = async (intKeyElement) => {
    const btn = document.getElementById(`btn-clean-${intKeyElement}`);
    btn.style.display = 'inline-block';
    btn.disabled = false;
    btn.style.cursor = 'pointer';
};

const cleanCarrierToDetail = async (intKey) => {
    document.getElementById(`input_list_carrier_${intKey}`).value = '';
    document.getElementById(`carrier_${intKey}`).value = '';
    const btn = document.getElementById(`btn-clean-${intKey}`);
    btn.style.display = 'none';
    btn.disabled = true;
    btn.style.cursor = 'not-allowed';
};

const setOptionExistTransfer = async (strValue, strOption, intKey) => {
    if(strValue !== '' && !isNaN(strValue)) {
        document.getElementById(`${strOption}_${intKey}`).value = strValue;
        if(strOption == 'carrier'){
            getCost(intKey);
            await showButtonCleanCarrier(intKey);
        }
    }
    else
        document.getElementById(`${strOption}_${intKey}`).value = '';
};

makeDataTableDefault(false, true);