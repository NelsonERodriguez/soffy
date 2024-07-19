const objMovement = [ {print: 'Local', name: 'local'}, {print: 'Traslado', name: 'traslado'} ],
    objSizeTruck = [ {print: 'Contenedor', name: 'container'}, {print: 'Camion', name: 'truck'} ];
let objOptionSelected = {'actually': 0, 'destiny': 0, 'tipo_movimiento': '', 'size_truck': ''};

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