const btnRegresar = document.getElementById('btnRegresar'),
    valCSRF = getCookie('csrftoken'),
    objRules = {
        nombre: "required",
        departamento: "required",
        orden: "required",
        color: "required",
    },
    objMessages = {
        nombre: "Este campo es requerido.",
        departamento: "Este campo es requerido.",
        orden: "Este campo es requerido.",
        color: "Este campo es requerido.",
    };

btnRegresar.addEventListener('click', () => {
    dialogConfirm(redirectIndex, false, '¿Estás seguro?', '¡No se guardaran los datos que has cambiado o has ingresado!')
});

const submitForm = () => {
    simple_submit('frm_interfaz');
}

const redirectIndex = () => {
    simple_redireccion(strUrlIndex);
}

setFormValidation('#frm_interfaz', objRules, objMessages, submitForm);
