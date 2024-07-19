const des = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
let objGlobalAreas = objGlobalNomenclaturas = [];

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

if (btnSave && typeof btnSave === 'object')
    btnSave.addEventListener('click', () => {
        saveInfo();
    });

const saveInfo = async () => {
    open_loading();
    let formData = new FormData(),
        data = [];
    formData.append('csrfmiddlewaretoken', valCSRF);

    if(list_area && typeof list_area === 'object' && percentage && typeof percentage === 'object'
         && list_nomenclatura && typeof list_nomenclatura === 'object') {
        formData.append('area', list_area.value);
        formData.append('porcentage', percentage.value);
        formData.append('nomenclatura', list_nomenclatura.value);
        formData.append('empleado', intEmpleado);
        let response = await fetch(urlSaveData, {method: 'POST', body: formData});

        try {
            data = await response.json();
        } catch(error) {
            data = [];
            console.error(error);
        }
        close_loading();
        if(data?.status)
            location.reload();
    }
    else {
        close_loading();
        alert_nova.showNotification('No se pudo guardar la información.', 'warning', 'danger');
    }
};

const setOptionsRow = async (strValue, strElement = '') => {
    let strID = `list_${strElement}`,
        elm = document.getElementById(strID),
        strNewValue = 0;
    if(elm) {
        if(strValue !== '' && !isNaN(strValue))
            strNewValue = strValue;
        else
            strNewValue = '0';
        elm.value = strNewValue;
    }
    return true;
};

const drawAreas = async (objData) => {
    if (list_area && typeof list_area === 'object') {
        list_area.innerHTML = '';
        if(Object.keys(objData).length > 0) {
            let strElmts = '';
            objData.map(d => {
                strElmts += `<option data-value="${d.CodigoArea}">${d.DescripcionArea}</option>`;
            });
            list_area.insertAdjacentHTML('beforeend', strElmts);
        }
    }
};

const drawNomenclaturas = async (objData) => {
    if (list_nomenclatura && typeof list_nomenclatura === 'object') {
        list_nomenclatura.innerHTML = '';
        if(Object.keys(objData).length > 0) {
            let strElmts = '';
            objData.map(d => {
                strElmts += `<option data-value="${d.Cuenta}">${d.Nombre}</option>`;
            });
            list_nomenclatura.insertAdjacentHTML('beforeend', strElmts);
        }
    }
};

const setValuesAreaNomenclatura = async () => {
    area.value = strDescripcionArea;
    list_area.value = intCodigoArea;
    nomenclatura.value = strNomenclatura;
    list_nomenclatura.value = intNomenclatura;
};

const getAreas = async () => {
    if (list_area && typeof list_area === 'object') {
        open_loading();
        list_area.innerHTML = '';

        let formData = new FormData(),
            data = [];
        formData.append('csrfmiddlewaretoken', valCSRF);

        let response = await fetch(urlGetAreas, {method: 'POST', body: formData});

        try {
            data = await response.json();
        } catch(error) {
            data = [];
            console.error(error);
        }
        close_loading();

        if (data?.status) {
            objGlobalAreas = data?.data ? data.data : [];
            await drawAreas(data?.data);
            await getNomenclaturas();
            await setValuesAreaNomenclatura();
        }
    }
};

const getNomenclaturas = async () => {
    if (list_nomenclatura && typeof list_nomenclatura === 'object') {
        open_loading();
        list_nomenclatura.innerHTML = '';

        let formData = new FormData(),
            data = [];
        formData.append('csrfmiddlewaretoken', valCSRF);

        let response = await fetch(urlGetNomenclaturas, {method: 'POST', body: formData});
        try {
            data = await response.json();
        } catch(error) {
            data = [];
            console.error(error);
        }
        close_loading();

        if (data?.status) {
            objGlobalNomenclaturas = data?.data ? data.data : [];
            drawNomenclaturas(data?.data);
        }
    }
};

getAreas();