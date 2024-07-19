const objMovement = [ {print: 'Local', name: 'local'}, {print: 'Traslado', name: 'traslado'} ],
    objSizeTruck = [ {print: 'Contenedor', name: 'container'}, {print: 'Camion', name: 'truck'} ],
    des = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
let boolChangePrice = false;
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

const getStrActually = async (intSelected) => {
    return await objActually.find(d => d.id == intSelected);
};

const getStrDestiny = async (intSelected) => {
    return await objDestination.find(d => d.id == intSelected);
};

const setNameAutomatically = async () => {
    let elementName = document.getElementById('name');
    if(objOptionSelected.actually !== 0 && objOptionSelected.destiny !== 0) {
        let objActually = await getStrActually(objOptionSelected.actually),
            objDestiny = await getStrDestiny(objOptionSelected.destiny),
            strAddress = (objDestiny.direccion !== 'None') ? `- ${objDestiny.direccion}` : '',
            strCountry = (objDestiny.departamento !== 'None') ? `- ${objDestiny.departamento}` : '',
            strDefault = `Costo de ${objActually.name} hasta ${objDestiny.nombre} ${strAddress} ${strCountry}`;

        elementName.value = strDefault;
        document.getElementById('content-html-name').classList.add('is-filled');
    }
    else {
        elementName.value = '';
        document.getElementById('content-html-name').classList.remove('is-filled');
    }
};

const setOptionCost = async (strValue, strOption) => {
    if(strValue !== '') {
        if(strOption !== 'tipo_movimiento' && strOption !== 'size_truck') {
            if(!isNaN(strValue)) {
                objOptionSelected[strOption] = strValue;
                document.getElementById(strOption).value = strValue;
            }
        }
        else {
            objOptionSelected[strOption] = strValue;
            document.getElementById(strOption).value = strValue;
        }
    }
    if(strValue === '') {
        objOptionSelected[strOption] = 0;
        document.getElementById(strOption).value = 0;
    }
    await setNameAutomatically();
};

const setElementsDefault = async () => {
    let contentDestiny = document.getElementById('show-destiny'),
        contentTypeMovement = document.getElementById('show-tipo_movimiento'),
        contentSizeTruck = document.getElementById('show-size_truck'),
        contentActually = document.getElementById('show-actually'),
        contentProduct = document.getElementById('show-product'),
        objTMPDestiny = objDestination.find(d => d.id == objOptionSelected.destiny),
        objTMPActually = objActually.find(d => d.id == objOptionSelected.actually),
        objTMPMovement = objMovement.find(d => d.name == objOptionSelected.tipo_movimiento),
        objTMPSizeTruck = objSizeTruck.find(d => d.name == objOptionSelected.size_truck);
        objTMPProduct = objProducts.find(d => d.id == objOptionSelected.producto_id);
    contentDestiny.value = objTMPDestiny.nombre;
    contentActually.value = objTMPActually.name;
    if (objTMPMovement && objTMPMovement?.print)
        contentTypeMovement.value = objTMPMovement.print;
    if (objTMPSizeTruck && objTMPSizeTruck?.print)
        contentSizeTruck.value = objTMPSizeTruck.print;
    if (objTMPProduct && objTMPProduct?.nombre)
        contentProduct.value = objTMPProduct.nombre;
};

const validateChanges = async () => {
    let boolChanges = false,
        elmActual = document.getElementById('actually'),
        elmDestino = document.getElementById('destiny'),
        elmPrecio = document.getElementById('price'),
        elmActivo = document.getElementById('active'),
        elmNombre = document.getElementById('name'),
        elmTipoMovimiento = document.getElementById('tipo_movimiento'),
        elmSize = document.getElementById('size_truck'),
        elmProduct = document.getElementById('product');
    if(elmActual)
        if(elmActual.value != objOptionDefaults.actually)
            boolChanges = true;
    else if(elmDestino)
        if(elmDestino.value != objOptionDefaults.destiny)
            boolChanges = true;
    else if(elmPrecio)
        if(elmPrecio.value != objOptionDefaults.precio) {
            boolChanges = true;
            boolChangePrice = true;
        }
    else if(elmActivo)
        if(objOptionDefaults.estado == 'True' && !elmActivo.checked)
            boolChanges = true;
        else if(objOptionDefaults.estado == 'False' && elmActivo.checked)
            boolChanges = true;
    else if(elmNombre)
        if(elmNombre.value != objOptionDefaults.nombre)
            boolChanges = true;
    else if(elmTipoMovimiento)
        if(elmTipoMovimiento.value != objOptionDefaults.tipo_movimiento)
            boolChanges = true;
    else if(elmSize)
        if(elmSize.value != objOptionDefaults.size_truck)
            boolChanges = true;
    else if(elmProduct)
        if(elmProduct.value != objOptionDefaults.product)
            boolChanges = true;

    return boolChanges;
};

const sendFormSave = async () => {
    let formData = new FormData(document.getElementById('formEdit'));
    formData.append('change_price', boolChangePrice);
    formData.append('last_price', objOptionDefaults.precio);
    const response = await fetch(urlSaveFletes, {method: 'POST', body: formData});
    try {
        data = await response.json();
    } catch (error) {
        data = [];
    }
    close_loading();
    if(data?.status) {
        alert_nova.showNotification(data.message);
        setTimeout(() => {
            location.href = urlPrincipal;
        }, 2500);
    }
    else {
        alert_nova.showNotification(data?.message ? data.message : 'Ocurrio un problema inesperado.', 'warning', 'danger');
    }
};

const btnSave = document.getElementById('btnSave');
if(btnSave) {
    btnSave.addEventListener('click', async () => {
        open_loading();
        let boolChanges = await validateChanges();
        if(boolChanges)
            sendFormSave();
        else {
            close_loading();
            alert_nova.showNotification('No has realizado ningun cambio, espera por favor', 'warning', 'info');
            setTimeout(() => {
                location.href = urlPrincipal;
            }, 2500);
        }
    });
    btnSave.addEventListener('dblclick', async () => {
        errorDblClick();
    });
}

setElementsDefault();