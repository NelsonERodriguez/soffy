const divComentarios = document.getElementById('contentComentarios');
const drawComentarios = async (arrComentarios) => {
    if (arrComentarios.status) {
        if (arrComentarios.comentarios.length) {
            await drawComentariosTicket(arrComentarios.comentarios);
        } else {
            divComentarios.innerHTML = 'No hay comentarios.';
        }
        $(`#modalComentarios`).modal('show');
    } else {
        alert_nova.showNotification(arrComentarios.msg, "warning", "danger");
    }
    close_loading();
};

const getComentarios = async (intTicket) => {
    const objFormData = new FormData();
    objFormData.append('ticket_id', intTicket);
    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    let objInit = {
        method: 'POST', body: objFormData
    };
    const objOptions = {
        boolShowSuccessAlert: false, boolShowErrorAlert: false
    };
    open_loading();
    await coreFetch(strUrlGetComentarios, objInit, drawComentarios, objOptions)
};

const cerrarTicket = async (intTicket) => {
    const objFormData = new FormData();
    objFormData.append('ticket_id', intTicket);
    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    let objInit = {
        method: 'POST', body: objFormData
    };
    const objOptions = {
        boolShowSuccessAlert: true, boolShowErrorAlert: false
    };
    open_loading();
    await coreFetch(strUrlCerrar, objInit, () => {
        window.location.reload();
    }, objOptions);
};

const drawComentariosTicket = async (arrData) => {
    divComentarios.innerHTML = '';

    for (let key in arrData) {
        const arrComentario = arrData[key];
        if (!arrComentario.comentario_padre_id) {
            await drawComentarioPadre(arrComentario);
        } else {
            await drawComentarioHijo(arrComentario);
        }
    }

};

/**
 ** Función dibujar las respuestas a otros comentarios
 @param arrComentario array con toda la información del comentario
 */
const drawComentarioHijo = async (arrComentario) => {
    const strFoto = (arrComentario.avatar === "" || arrComentario.avatar === "/static/assets/img/default-avatar.png") ? "default-avatar.png" : arrComentario.avatar;

    let objDivContenido = document.getElementById(`padre_id_${arrComentario.comentario_padre_id}`);
    let objOptions = {
        element: 'div',
        classes: ["row"],
        styles: {
            margin: '15px 0',
        },
    };
    let objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-1"],
    };
    let objDivCol1 = await createElement(objOptions);

    let arrImg = {
        "foto": strFoto,
        "nombre": arrComentario.name,
    }
    objDivCol1.innerHTML = await drawIconoPersona(arrImg, "#a1a1a1");
    objDivRow.appendChild(objDivCol1);

    objOptions = {
        element: 'div',
        classes: ["col-11"],
    };
    let objDivCol11 = await createElement(objOptions);
    objDivCol11.classList.add('col-11');
    let strFile = '';

    if (arrComentario.adjunto) {
        const strAdjunto = arrComentario.adjunto;
        const arrSplit = strAdjunto.split('/');
        const strName = arrSplit[arrSplit.length - 1];

        strFile = `<br><br><a href="/media/${arrComentario.adjunto}" download="${strName}">${strName}</a>`;

    }

    objOptions = {
        element: 'div',
        styles: {
            "background": '#f6f7fb',
            "border-radius": '10px',
            "padding": '10px',
            "display": 'inline-block',
        }
    };
    let objDivComentario = await createElement(objOptions);
    objDivComentario.innerHTML = `
        <span style="color: blue;">${arrComentario.name}</span> <br>
        ${arrComentario.comentario}
        ${strFile}
    `;

    objDivCol11.appendChild(objDivComentario);
    objDivRow.appendChild(objDivCol11);
    if (objDivContenido) objDivContenido.appendChild(objDivRow);

};

/**
 ** Función que dibuja los comentarios principales
 @param arrComentario array con la información del comentario
 */
const drawComentarioPadre = async (arrComentario) => {

    let objOptions = {
        element: 'div',
        styles: {
            "margin-top": '15px',
            "padding": '15px',
            border: '1px solid #d9d3d3',
            "border-radius": '10px',
        },
    };
    let objDiv = await createElement(objOptions);

    const strFoto = (arrComentario.avatar === "" || arrComentario.avatar === "/static/assets/img/default-avatar.png") ? "default-avatar.png" : arrComentario.avatar;

    objOptions = {
        element: 'div',
        classes: ["row"],
    };
    let objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-8"],
    };
    let objDivCol8 = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-4", "text-right"],
    };
    let objDivCol4 = await createElement(objOptions);
    objDivCol4.innerText = arrComentario.fecha_creacion;

    let arrImg = {
        "foto": strFoto,
        "nombre": arrComentario.name,
    }
    objDivCol8.innerHTML = await drawIconoPersona(arrImg, "#a1a1a1");
    objDivCol8.insertAdjacentHTML('beforeend', `<b>${arrComentario.name}</b>`);
    objDivRow.appendChild(objDivCol8);
    objDivRow.appendChild(objDivCol4);
    objDiv.appendChild(objDivRow);

    objOptions = {
        element: 'div',
        classes: ["row"],
        styles: {
            "padding": '25px 0 35px 0'
        },
    };
    objDivRow = await createElement(objOptions);
    if (!arrComentario.adjunto) objDivRow.style.setProperty('border-bottom', '1px solid #d9d3d3');

    objOptions = {
        element: 'div',
        classes: ["col-12"],
    };
    let objDivCol12 = await createElement(objOptions);
    objDivCol12.innerHTML = arrComentario.comentario;

    objDivRow.appendChild(objDivCol12);
    objDiv.appendChild(objDivRow);

    if (arrComentario.adjunto) {
        objOptions = {
            element: 'div',
            classes: ["row"],
            styles: {
                "padding-bottom": '10px',
                "border-bottom": '1px solid #d9d3d3',
            },
        };
        objDivRow = await createElement(objOptions);

        objOptions = {
            element: 'div',
            classes: ["col-12"],
        };
        objDivCol12 = await createElement(objOptions);

        const strAdjunto = arrComentario.adjunto;
        const arrSplit = strAdjunto.split('/');
        const strName = arrSplit[arrSplit.length - 1];

        objOptions = {
            element: 'a',
            href: `/media/${arrComentario.adjunto}`,
            "download": strName,
        };
        let objA = await createElement(objOptions);
        objA.innerText = strName;

        objDivCol12.appendChild(objA);
        objDivRow.appendChild(objDivCol12);
        objDiv.appendChild(objDivRow);
    }

    objOptions = {
        element: 'div',
        classes: ["row"],
    };
    objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        id: `padre_id_${arrComentario.id}`,
        classes: ["col-12"],
    };
    objDivCol12 = await createElement(objOptions);
    objDivRow.appendChild(objDivCol12);
    objDiv.appendChild(objDivRow);

    objDiv.appendChild(objDivRow);

    divComentarios.appendChild(objDiv);

};
const drawIconoPersona = async (objPersona, strColor, strExtraAttributes = "") => {
    let strHtmlReturn = '';

    let arrNombre = objPersona.nombre.split(" ");
    let strNombre = "";

    if (arrNombre.length > 2) {
        strNombre += arrNombre[0].substring(0, 1);
        strNombre += arrNombre[2].substring(0, 1);
    } else if (arrNombre.length === 2) {
        strNombre += arrNombre[0].substring(0, 1);
        strNombre += arrNombre[1].substring(0, 1);
    } else {
        strNombre += arrNombre[0].substring(0, 1);
    }

    if (objPersona.foto === 'default-avatar.png') {
        strHtmlReturn = `<span class="fa-stack" tooltip="${objPersona.nombre}" ${strExtraAttributes}>
                            <i class="fas fa-circle fa-stack-2x" style="color: ${strColor};opacity: 0.5;"></i>
                            <i class="fa-stack-1x fa-inverse" style="--fa-inverse:var(--fa-navy);">${strNombre}</i>
                        </span>`;
    } else {
        const strFoto = (objPersona.foto.includes('nova.ffinter.com')) ? objPersona.foto : `https://nova.ffinter.com/media/${objPersona.foto}`;
        strHtmlReturn += `<span class="img-persona" ${strExtraAttributes}>
                            <img src="${strFoto}" alt="${strNombre}">
                        </span>`;
    }

    return strHtmlReturn;
}

$(`#tableMinuta`).DataTable({
    "pagingType": "full_numbers",
    "lengthMenu": [
        [10, 25, 50, -1],
        [10, 25, 50, "All"]
    ],
    responsive: false,
    language: objLenguajeDataTable,
    dom: 'lBfrtip',
    buttons: [
        {
            extend: 'excel',
            text: 'Excel',
            className: 'btn btn-default',
            exportOptions: {
                modifier: {
                    page: 'current'
                }
            }
        }
    ]
});
