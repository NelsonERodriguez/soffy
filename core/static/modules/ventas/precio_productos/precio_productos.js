const bigButtons = document.querySelectorAll('.wizard-container'),
    objButtons = document.querySelectorAll(`button[data-button]`);

if (Object.keys(bigButtons)) {
    bigButtons.forEach(element => {
        const strClasificacion = element.getAttribute('data-clasificacion');
        element.addEventListener('click', () => {
            toggle_big_buttons();
            toggle_contenido();
            select_button(strClasificacion);
        });
    });
}

if (Object.keys(objButtons)) {
    objButtons.forEach(element => {
        const strClasificacion = element.id;
        element.addEventListener('click', () => {
            select_button(strClasificacion);
        });
    });
}

function toggle_big_buttons() {
    $("#divBigButtons").toggle('slow');
}

function toggle_contenido() {
    $("#divContenedor").toggle('slow');
}

function select_button(strClasificacion) {
    const othersButtons = document.querySelectorAll('.btn-primary'),
        objButton = document.getElementById(strClasificacion);
    othersButtons.forEach(element => {
       element.classList.remove('btn-primary');
       element.classList.add('btn-white');
    });
    objButton.classList.remove('btn-white');
    objButton.classList.add('btn-primary');
    get_productos(strClasificacion);
}

function get_productos(strClasificacion) {

    const csrftoken = getCookie('csrftoken'),
        form = new FormData(),
        divProductos = document.getElementById('divProductos');

    divProductos.innerHTML = '';
    form.append('clasificacion', strClasificacion)

    open_loading();
    fetch(strUrlGetProductos, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: form
    })
    .then(response => response.json())
    .then( (data) => {

        close_loading();

        let divContenido = '<div class="row">';
        for (let key in data.productos) {

            const arrProducto = data.productos[key];
            const strPrecio = parseFloat(arrProducto.Precio);
            let strClasificacion = "";

            if (arrProducto.Clasificacion === "CUADRIL" || arrProducto.Clasificacion === "MIXTO POLLO" || arrProducto.Clasificacion === "FOOD SERVICE") {
                strClasificacion = 'POLLO';
            }
            else if (arrProducto.Clasificacion === "CARNE DE CERDO") {
                strClasificacion = 'CERDO';
            }
            else if (arrProducto.Clasificacion === "RES") {
                strClasificacion = 'RES';
            }
            else if (arrProducto.Clasificacion === "EMBUTIDOS" || arrProducto.Clasificacion === "PAPAS" || arrProducto.Clasificacion === "MILANESA") {
                strClasificacion = 'OTROS';
            }

            divContenido += `
                <div class="col-3 img-producto text-center">
                    <img src="/static/modules/media/ventas/${strClasificacion}/${arrProducto.NoProducto}.jpg" alt="${arrProducto.Descripcion}" style="width: 100%;">
                    <br><br>
                    <b>${arrProducto.Descripcion}</b><br>
                    <b>Q${strPrecio}</b>
                </div>
            `;

        }

        divContenido += '</div>';
        divProductos.innerHTML = divContenido;

    })
    .catch((error) => {
        close_loading();
        console.error(error);
        alert_nova.showNotification("Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.", "warning", "danger");
    });

}
