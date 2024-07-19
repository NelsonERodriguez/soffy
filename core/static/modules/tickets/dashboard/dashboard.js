const modalInfo = document.getElementById('modal_preview_comentarios'),
    modalFiles = document.getElementById('modal_preview_files'),
    spanComentario = document.getElementById('close-comentario'),
    spanFiles = document.getElementById('close-files'),
    divGeneral = document.getElementById('div_general'),
    divAdjuntos = document.getElementById('div_adjuntos'),
    divComentarios = document.getElementById('div_comentarios_contenido'),
    divActividad = document.getElementById('div_actividad'),
    objTipo = document.getElementById('tipo'),
    boolIsMejoraContinua = (intDepartamento === 11),
    objAdjuntoPadre = document.getElementById('adjunto_comentario_padre'),
    objEsPersonal = document.getElementById('es_personal');

let objPersonas = {},
    arrTicketsPersonas = [],
    objPDF = null,
    objEtiquetas = {},
    arrTicketsEtiquetas = [],
    arrPrioridades = [],
    arrEstados = [],
    arrUsersFilter = [],
    arrMiembrosWorkspace = [],
    boolIsAdmin = false,
    arrAgrupaciones = [],
    arrWorkspaces = [],
    arrGruposTickets = [],
    intCountGroup = 0;

window.addEventListener(`keydown`, (e) => {
    if (e.key === 'Escape') {
        if (modalInfo.classList.contains('modal-comentario-visibility') && !modalFiles.classList.contains('modal-files-visibility')) {
            closeModalInfoTicket();
        }
        if (modalFiles.classList.contains('modal-files-visibility')) {
            closeModalFilesTicket();
        }
    }
});

spanComentario.addEventListener('click', () => {
    closeModalInfoTicket();
});

spanFiles.addEventListener('click', () => {
    closeModalFilesTicket();
});

window.onclick = (event) => {
    if (event.target === modalInfo) {
        closeModalInfoTicket();
    } else if (event.target === modalFiles) {
        closeModalFilesTicket();
    }

    if (!(event.target === document.getElementById('listPersonas') || event.target === document.getElementById('btnFilterPersona'))
        && document.getElementById('listPersonas') && !document.getElementById('listPersonas').classList.contains('filter_options_personas_hidden')) {
        document.getElementById('listPersonas').classList.toggle('filter_options_personas_hidden');
    }
};

document.getElementById('btnGrabarComentario').addEventListener('click', async () => {
    await saveComentario();
});

/**
 *** Función para enviar emails de notificación
 */
const sendNotificacion = () => {
    const csrftoken = getCookie('csrftoken');
    return fetch(strUrlSendNotificacion, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken}
    });
};


/**
 *** Función para dibujar el tab con los adjuntos del ticket
 @param intTicket id del ticket
 @param arrAdjuntos son los adjuntos que tiene grabados ya el ticket
 */
const drawAdjuntosTicket = async (intTicket, arrAdjuntos) => {
    divAdjuntos.innerHTML = '';

    let objOptions = {
        element: 'div',
        classes: ["row"],
        styles: {
            "margin-top": '35px',
        },
    };
    let objDivRowAdjuntos = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["row"],
        styles: {
            "margin-top": '35px',
        },
    };
    let objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-12", "text-right"],
    };
    let objDivCol12 = await createElement(objOptions);

    objOptions = {
        element: 'input',
        type: 'file',
        name: `adjunto[]`,
        id: `adjunto_ticket_${intTicket}`,
        styles: {
            "display": 'none',
        },
        attributes: {
            "accept": 'image/*, .pdf, .doc, .docx, .csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/plain, video/*',
        },
    };
    let objFile = await createElement(objOptions);
    objFile.onchange = async (e) => {
        const objFile = (e.target.files.length) ? e.target.files[0] : null;
        const strFile = (e.target.files.length) ? e.target.files[0].name : '';
        const strNombreArchivo = (strFile.length > 16) ? `${strFile.substring(0, 14)}...` : strFile;

        const objDivCol4 = await drawMiniatureFiles(objFile.type, strNombreArchivo, true, `/media/tickets/${intTicket}/adjuntos/${strFile}`, strFile);
        objDivRowAdjuntos.appendChild(objDivCol4);
        await saveFileTicket(intTicket, objFile);
        e.target.value = '';
    };

    objOptions = {
        element: 'a',
        styles: {
            "cursor": 'pointer',
        },
    };
    let objA = await createElement(objOptions);
    objA.innerHTML = `<span class="material-icons">attachment</span><span id="spanAdjunto_ticket_${intTicket}"> Agregar adjunto</span>`;
    objA.onclick = () => {
        document.getElementById(`adjunto_ticket_${intTicket}`).click();
    };
    objDivCol12.appendChild(objFile);
    objDivCol12.appendChild(objA);
    objDivRow.appendChild(objDivCol12);

    divAdjuntos.appendChild(objDivRow);

    for (let key in arrAdjuntos) {
        const arrAdjunto = arrAdjuntos[key];
        const strNombreArchivo = (arrAdjunto.descripcion.length > 16) ? `${arrAdjunto.descripcion.substring(0, 14)}...` : arrAdjunto.descripcion;
        const arrSplit = arrAdjunto.adjunto.split('.');
        const strTypePath = arrSplit[arrSplit.length - 1];
        const arrSplitNombre = arrAdjunto.adjunto.split('/');
        const strNombreDescarga = arrSplitNombre[arrSplitNombre.length - 1];
        let strType = '';
        switch (strTypePath) {
            case 'pdf':
                strType = 'application/pdf';
                break;
            case 'xlsx':
                strType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
            case 'xls':
                strType = 'application/vnd.ms-excel';
                break;
            case 'doc':
                strType = 'application/msword';
                break;
            case 'docx':
                strType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            case 'png':
                strType = 'image/png';
                break;
            case 'jpge':
                strType = 'image/jpge';
                break;
        }
        const strPath = `/media/${arrAdjunto.adjunto}`;
        const objDivCol4 = await drawMiniatureFiles(strType, strNombreArchivo, false, strPath, strNombreDescarga, arrAdjunto.adjunto_id);
        objDivRowAdjuntos.appendChild(objDivCol4);
    }

    divAdjuntos.appendChild(objDivRowAdjuntos);

};

/**
 ***Función para grabar un adjunto al ticket y da el porcentaje que lleva el archivo en subida
 @param intTicket id del ticket
 @param objFile el archivo que enviaremos a grabar
 */
const saveFileTicket = async (intTicket, objFile) => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();

    objForm.append('ticket_id', intTicket);
    objForm.append('adjunto', objFile);

    let request = new XMLHttpRequest();
    request.open("POST", strUrlSaveFileTicket);
    request.setRequestHeader("X-CSRFToken", csrftoken);
    request.responseType = 'json';

    request.upload.addEventListener('progress', function (e) {
        let percent_completed = (e.loaded / e.total) * 100;
        document.querySelector('.progress-bar-success').style.width = `${percent_completed}%`;
    });

    request.addEventListener('load', async () => {
        if (request.status === 200) {
            if (request.response && typeof request.response.status !== 'undefined' && request.response.status) {
                alert_nova.showNotification("Adjunto agregado con exito.", "add_alert", "success");

                let objOptions = {
                    element: 'i',
                    classes: ["fas", "fa-trash"],
                    styles: {
                        color: 'red',
                        border: 'red 1px solid',
                        "border-radius": '3px',
                        "padding": '5px',
                        "width": '30px',
                        "cursor": 'pointer',
                    },
                };

                let objDelete = await createElement(objOptions);
                objDelete.onclick = async (e) => {

                    const csrftoken = getCookie('csrftoken'),
                        objForm = new FormData();
                    objForm.append('adjunto_id', request.response.adjunto_id);

                    open_loading();
                    await fetch(strUrlDeleteAdjunto, {
                        method: 'POST',
                        headers: {'X-CSRFToken': csrftoken},
                        body: objForm
                    })
                        .then(response => response.json())
                        .then(async (data) => {

                            if (data.status) {
                                e.target.parentElement.parentElement.remove();
                                alert_nova.showNotification("Adjunto eliminado.", "add_alert", "success");
                            } else {
                                alert_nova.showNotification("Ocurrió un error al eliminar el adjunto.", "warning", "danger");
                            }

                            close_loading();
                        })
                        .catch((error) => {
                            console.error(error);
                            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
                            close_loading();
                        });

                };

                document.querySelector('.progress-bar-success').parentElement.parentElement.appendChild(objDelete);

                document.querySelector('.progress-bar-success').parentElement.remove();
            } else {
                alert_nova.showNotification('Error al grabar el adjunto.', "warning", "danger");
                document.querySelector('.progress-bar-success').parentElement.parentElement.parentElement.remove();
            }
        } else {
            alert_nova.showNotification('Error al grabar el adjunto.', "warning", "danger");
            document.querySelector('.progress-bar-success').parentElement.parentElement.parentElement.remove();
        }
    });

    request.send(objForm);
};

/**
 ***Función dibujar el archivo que acabamos de seleccionar
 @param strType el tipo de archivo
 @param strNombreArchivo el nombre del archivo
 @param boolPorcentaje indica si se pone un div para la carga del archivo si se grabara uno nuevo
 @param strPath path del adjunto a dibujar
 @param strNombreDescarga nombre del archivo a descargar
 @param intAdjunto id del adjunto
 */
const drawMiniatureFiles = async (strType, strNombreArchivo, boolPorcentaje, strPath, strNombreDescarga, intAdjunto = 0) => {

    // let boolShow = false;
    let objOptions = {
        element: 'div',
        classes: ["col-4", "text-center"],
    };
    let objDivCol4 = await createElement(objOptions);

    let strIcon = '';
    if (strType === "application/pdf") {
        strIcon = `<i class="fas fa-5x fa-file-pdf"></i>`;
        // boolShow = true;
    } else if (strType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || strType === "application/vnd.ms-excel") {
        strIcon = `<i class="fas fa-5x fa-file-excel"></i>`;
    } else if (strType === "text/csv") {
        strIcon = `<i class="fas fa-5x fa-file-csv"></i>`;
    } else if (strType === "application/msword" || strType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        strIcon = `<i class="fas fa-5x fa-file-word"></i>`;
    } else if (strType.search('image') >= 0) {
        strIcon = `<i class="fas fa-5x fa-image"></i> `;
        // boolShow = true;
    }

    objOptions = {
        element: 'div',
        classes: ["img-thumbnail"],
        styles: {
            "margin-top": '10px',
            "padding": '15px',
        },
    };
    let objDivPreview = await createElement(objOptions);

    let strDivPorcentaje = '';
    if (boolPorcentaje) {
        strDivPorcentaje = `
            <div class="progress progress-line-success">
                <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0;">
                    <span class="sr-only">0% Complete</span>
                </div>
            </div>
        `;
    }

    objDivPreview.innerHTML = `${strIcon} <br> ${strNombreArchivo} <br> ${strDivPorcentaje}`;

    // Hasta resolver la licencia lo comento, cuando este público el servidor y ase utilizara
    // if (boolShow) {
    // if (false) {
    //     objOptions = {
    //         element: 'i',
    //         classes: ["fas", "fa-eye"],
    //         styles: {
    //             border: '#00bcd4 1px solid',
    //             color: '#00bcd4',
    //             "border-radius": '3px',
    //             "padding": '5px',
    //             "cursor": 'pointer',
    //             "margin-right": '5px',
    //             },
    //     };
    //     let objShow = await createElement(objOptions);
    //     objShow.onclick = async () => {
    //         if (strType === "application/pdf") {
    //             await showPdfTicket(strPath);
    //         }
    //         else if (strType.search('image') >= 0) {
    //             await showModalFilesTicket();
    //             document.getElementById('divContenidoImg').style.display = 'block';
    //             document.getElementById('divContenidoFiles').style.display = 'none';
    //             document.getElementById('imgAdjunto').src = strPath;
    //         }
    //     };
    //     objDivPreview.appendChild(objShow);
    // }

    objOptions = {
        element: 'a',
        classes: ["fas", "fa-arrow-to-bottom"],
        styles: {
            color: '#4caf50',
            border: '#4caf50 1px solid',
            "border-radius": '3px',
            "padding": '5px',
            "width": '30px',
            "cursor": 'pointer',
            "margin-right": '5px',
        },
        href: strPath,
        "download": strNombreDescarga
    };

    let objDownload = await createElement(objOptions);

    objDivPreview.appendChild(objDownload);

    if (!boolPorcentaje) {
        objOptions = {
            element: 'i',
            classes: ["fas", "fa-trash"],
            styles: {
                color: 'red',
                border: 'red 1px solid',
                "border-radius": '3px',
                "padding": '5px',
                "width": '30px',
                "cursor": 'pointer',
            },
        };

        let objDelete = await createElement(objOptions);
        objDelete.onclick = async () => {

            const csrftoken = getCookie('csrftoken'),
                objForm = new FormData();
            objForm.append('adjunto_id', intAdjunto);

            open_loading();
            await fetch(strUrlDeleteAdjunto, {
                method: 'POST',
                headers: {'X-CSRFToken': csrftoken},
                body: objForm
            })
                .then(response => response.json())
                .then(async (data) => {

                    if (data.status) {
                        objDivCol4.remove();
                        alert_nova.showNotification("Adjunto eliminado.", "add_alert", "success");
                    } else {
                        alert_nova.showNotification("Ocurrió un error al eliminar el adjunto.", "warning", "danger");
                    }

                    close_loading();
                })
                .catch((error) => {
                    console.error(error);
                    alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
                    close_loading();
                });

        };

        objDivPreview.appendChild(objDelete);
    }

    objDivCol4.appendChild(objDivPreview);

    return objDivCol4;
};

/**
 ** Función que muestra un preview de PDF
 */
const showPdfTicket = async (strPath) => {
    const objDivFiles = document.getElementById('divContenidoFiles');
    document.getElementById('divContenidoImg').style.display = 'none';
    objDivFiles.style.display = 'block';
    open_loading();
    await showModalFilesTicket();

    if (!objPDF) {
        WebViewer({
            path: '/static/assets/pdfjs/',
            licenseKey: 'pXS2t6o8eq5hCPJUjD7Z',
            initialDoc: strPath,
        }, objDivFiles)
            .then(instance => {
                const {Core} = instance;
                objPDF = instance;
                Core.documentViewer.addEventListener('documentLoaded', () => {
                    close_loading();
                });

            })
            .catch(() => {
                close_loading();
            });
    } else {
        objPDF.UI.loadDocument(strPath);
        close_loading();
    }
    close_loading();

};

/**
 ** Función para mostrar el nombre del adjunto al comentario padre
 */
const changeAdjuntoPadre = () => {
    document.getElementById('spanAdjunto').innerHTML = (objAdjuntoPadre.files.length) ? objAdjuntoPadre.files[0].name : " Agregar adjunto";
};

/**
 ** Función para mostrar el nombre del adjunto al comentario hijo
 */
const changeAdjuntoHijo = (intPadre) => {
    const objAdjuntoHijo = document.getElementById(`adjunto_comentario_hijo_${intPadre}`);
    document.getElementById(`spanAdjunto_${intPadre}`).innerHTML = (objAdjuntoHijo.files.length) ? objAdjuntoHijo.files[0].name : " Agregar adjunto";
};

/**
 ** Función para mostrar el explorador de archivo de la pc
 */
const selectFileComentarioPadre = () => {
    objAdjuntoPadre.click();
};

/**
 ** Función para mostrar el explorador de archivo de la pc
 */
const selectFileComentarioHijo = (intPadre) => {
    document.getElementById(`adjunto_comentario_hijo_${intPadre}`).click();
};

/**
 ** Función para crear un comentario nuevo
 @param intComentarioPadreId id del comentario si esta fuera una respuesta a un comentario
 @param strIdElemento id del elemento donde se obtendrá el valor si es un comentario de respuesta a otro
 */
const saveComentario = async (intComentarioPadreId = null, strIdElemento = '') => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();

    let objComentario = null;
    if (intComentarioPadreId) {
        objForm.append('comentario_padre_id', intComentarioPadreId);
        if (document.getElementById(`adjunto_comentario_hijo_${intComentarioPadreId}`).files.length) {
            objForm.append('adjunto', document.getElementById(`adjunto_comentario_hijo_${intComentarioPadreId}`).files[0]);
        }
    }

    if (intComentarioPadreId && strIdElemento) {
        objComentario = document.getElementById(strIdElemento);
        if (objComentario.value.trim() === "") {
            alert_nova.showNotification('Ingrese comentario para poder grabar.', "warning", "danger");
            return false;
        }
    } else {
        objComentario = document.querySelector('.dx-htmleditor-submit-element');
        if (objAdjuntoPadre.files.length) objForm.append('adjunto', objAdjuntoPadre.files[0])
    }

    objForm.append('ticket_id', document.getElementById('ticket_id').value);
    objForm.append('comentario', objComentario.value);

    open_loading();
    await fetch(strUrlSaveComentario, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {

            if (data.status) {
                const objDate = new Date();
                const strDate = `${objDate.getDate()}/${objDate.getMonth() + 1}/${objDate.getFullYear()} ${objDate.getHours()}:${objDate.getMinutes()}:${objDate.getSeconds()}`;

                let strPath = null;
                if (intComentarioPadreId && document.getElementById(`adjunto_comentario_hijo_${intComentarioPadreId}`).files.length) {
                    const strFile = document.getElementById(`adjunto_comentario_hijo_${intComentarioPadreId}`).files[0].name;
                    strPath = `tickets/${document.getElementById('ticket_id').value}/comentarios/${data.comentario_id}/${strFile}`;
                } else if (objAdjuntoPadre.files.length) {
                    const strFile = objAdjuntoPadre.files[0].name;
                    strPath = `tickets/${document.getElementById('ticket_id').value}/comentarios/${data.comentario_id}/${strFile}`;
                }

                const arrComentario = {
                    id: data.comentario_id,
                    "comentario": objComentario.value,
                    "comentario_padre_id": intComentarioPadreId,
                    "adjunto": strPath,
                    name: strUserName,
                    "avatar": strFotoUserLogin,
                    "fecha_creacion": strDate,
                }

                if (intComentarioPadreId) {
                    await drawComentarioHijo(arrComentario);
                    objComentario.value = '';
                    document.getElementById(`adjunto_comentario_hijo_${intComentarioPadreId}`).value = '';
                    document.getElementById(`spanAdjunto_${intComentarioPadreId}`).innerHTML = ' Agregar adjunto';
                } else {
                    objAdjuntoPadre.value = '';
                    document.getElementById('spanAdjunto').innerHTML = ' Agregar adjunto';

                    $('.html-editor').dxHtmlEditor({
                        value: ''
                    });
                    showEditor(false);
                    await drawComentarioPadre(arrComentario);
                }

                alert_nova.showNotification("Agrego un nuevo comentario al ticket.", "add_alert", "success");
            } else {
                alert_nova.showNotification('Error al grabar el comentario.', "warning", "danger");
            }

            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });

};

/**
 ** Función para mostrar el editor de texto para los comentarios
 @param boolShow variable que indica si mostrar o no el editor y los botones
 */
const showEditor = (boolShow) => {
    document.querySelector('.html-editor').style.display = (boolShow) ? '' : 'none';
    document.getElementById('btnRespuesta').style.display = (boolShow) ? 'none' : '';
    document.getElementById('btnGrabarComentario').style.display = (boolShow) ? 'inline-block' : 'none'
    setTimeout(showHtmlEditor, 500);
};

/**
 ** Función para levantar un modal y obtener los datos del ticket
 @param intTicket id del ticket del cual se solicitara toda la información para levantar el modal
 */
const getInfoTicket = async (intTicket) => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();
    objForm.append('ticket', intTicket);

    open_loading();
    await fetch(strUrlGetInfoTicket, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {

            if (data.status) {
                $('.html-editor').dxHtmlEditor({
                    value: ''
                });
                showEditor(false);
                objAdjuntoPadre.value = '';
                await drawInfoGeneralTicket(data.general);
                await drawComentariosTicket(data.comentarios);
                await drawAdjuntosTicket(intTicket, data.adjuntos);
                await drawLogsTicket(data.logs);
                showModalInfoTicket();
                setTimeout(showHtmlEditor, 3000);
                setTimeout(() => {
                    $('[rel="tooltip"]').tooltip();
                }, 1000);

            }

            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });
};

/**
 ** Función para crear el editor de texto para los comentarios
 */
const showHtmlEditor = () => {
    $('.html-editor').dxHtmlEditor({
        height: 'auto',
        elementAttr: {
            id: "nuevo_comentario"
        },
        toolbar: {
            items: [
                'undo',
                'redo',
                'separator',
                'bold',
                'italic',
                'strike',
                'underline',
                'separator',
                'alignLeft',
                'alignCenter',
                'alignRight',
                'alignJustify',
                'separator',
                'orderedList',
                'bulletList',
                'color',
                'background',
                'separator',
                'link',
                'image',
                'separator',
                'clear',
                'codeBlock',
                'blockquote',
                'separator',
                'insertTable',
                'deleteTable',
                'insertRowAbove',
                'insertRowBelow',
                'deleteRow',
                'insertColumnLeft',
                'insertColumnRight',
                'deleteColumn',
            ],
        },
        multiline: true,
        onFocusOut: function (e) {
            if (e.event.currentTarget.innerText.trim() === "") {
                showEditor(false);
            }
        },
        onValueChanged: function (e) {
            document.querySelector('.adjunto_comentario_padre').style.display = (e.value === "") ? 'none' : 'inline-block';
            let divMenciones = document.getElementById('divMenciones');
            if (divMenciones) divMenciones.remove();

            if (e.value === '<p>@</p>' || e.value.includes('@')) {

                let pattern = /\B@[a-z0-9_-]+/gi;
                let arrMatches = e.value.match(pattern);
                let int_match = 0;

                if (arrMatches) {
                    let strOptions = `<div id="divMenciones">`;
                    let objOptions = {
                        element: 'div',
                        id: 'divMenciones',
                    };
                    const objDivContent = createElement(objOptions);
                    for (let key in arrMatches) {
                        const arrMatch = arrMatches[key];
                        const strBusqueda = arrMatch.replace('@', '');
                        objPersonas.find((user) => {

                            if (user.nombre.toLowerCase().includes(strBusqueda) ||
                                user.email.toLowerCase().includes(strBusqueda)) {
                                int_match++;
                                let strFoto = "https://nova.ffinter.com";
                                strFoto += (user.avatar === "") ? " /static/assets/img/default-avatar.png" : `/media/${user.avatar}`;
                                let objOptions = {
                                    element: 'div',
                                    classes: ["row"],
                                    id: 'divPersonMention',
                                };
                                const objDiv = createElement(objOptions);

                                objDiv.then(element => {
                                    strOptions = `<div class="col-2">
                                                    <span class="img-persona">
                                                        <img src="${strFoto}" alt="${user.nombre}">
                                                    </span>
                                                </div>
                                                <div class="col-10">
                                                    ${user.nombre}
                                                </div>`;
                                    element.innerHTML = strOptions;

                                    element.onclick = () => {
                                        const strUser = `<span style="color: blue;" data-mention="_${user.user_id}_">@${user.nombre}</span> `;
                                        e.event.target.innerHTML = e.value.replace(arrMatch, strUser);
                                        document.getElementById('divMenciones').remove();
                                    };

                                    objDivContent.then(elementContent => {
                                        elementContent.appendChild(element);
                                    });
                                });
                            }
                        });
                    }

                    if (typeof e.event !== 'undefined' && int_match > 0) {
                        objDivContent.then(element => {
                            e.element[0].insertAdjacentElement('afterend', element);
                        });
                    }
                }

            }

        },
    }).dxHtmlEditor('instance').option('toolbar.multiline', false);

    $(".dx-htmleditor-content").focus();
};

/**
 ** Función para actualizar los registros generales del ticket
 @param intId id del ticket
 @param strKey nombre del campo que se actualizara
 @param strValue valor del campo a actualizar
 @param intWorkspace id del workspace
 */
const updateTicket = async (intId, strKey, strValue, intWorkspace = 0) => {

    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();

    objForm.append('id', intId);
    objForm.append(strKey, strValue);

    open_loading();
    fetch(strUrlUpdateTicket, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then((data) => {

            if (data.status) {
                if (strKey === 'titulo') {
                    const objTicket = document.querySelector(`div[data-ticket_id="${intId}"]`);
                    if (objTicket) {
                        objTicket.dataset.titulo = strValue;
                        objTicket.querySelector(`.texto-ticket`).textContent = strValue;
                    }
                }
                alert_nova.showNotification("Registro actualizado.", "add_alert", "success");
                if (intWorkspace) {
                    getDataWorkspace(intWorkspace);
                }
            } else {
                alert_nova.showNotification('Error al actualizar el registro.', "warning", "danger");
            }
            close_loading();

        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });

};

/**
 ** Función para actualizar los registros generales del ticket
 @param intTicket id del ticket
 @param intAgrupacion id de la agrupacion a la cual se moverá el ticket
 */
const updateAgrupacionTicket = async (intTicket, intAgrupacion) => {

    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();

    objForm.append('ticket_id', intTicket);
    objForm.append('agrupacion_id', intAgrupacion);

    open_loading();
    fetch(strUrlUpdateAgrupacionTicket, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {

            if (data.status) {
                await getDataWorkspace(document.getElementById("workspace_id").value);
                closeModalInfoTicket();
                alert_nova.showNotification("Ticket movido correctamente.", "add_alert", "success");
            } else {
                alert_nova.showNotification('Error al mover el ticket.', "warning", "danger");
            }
            close_loading();

        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });

};

/**
 ** Función para eliminar ticket
 @param intTicket id del ticket
 */
const eliminarTicket = async (intTicket) => {

    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();

    objForm.append('ticket_id', intTicket);

    open_loading();
    fetch(strUrlDeleteTicket, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {

            if (data.status) {
                alert_nova.showNotification("Registro eliminado.", "add_alert", "success");
                closeModalInfoTicket();
                await getDataWorkspace(document.getElementById("workspace_id").value);
            } else {
                alert_nova.showNotification('Error al eliminar el registro.', "warning", "danger");
            }
            close_loading();

        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });

};

/**
 ** Función dibujar la información general del ticket en el modal
 @param arrData array con todos los datos del ticket
 */
const drawInfoGeneralTicket = async (arrData) => {
    divGeneral.innerHTML = '';

    let objOptions = {
        element: 'div',
        classes: ["row"],
        styles: {
            margin: "35px 0 0 0"
        },
    };
    let objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-6"],
    };
    let objDivCol6 = await createElement(objOptions);

    if (boolIsAdmin) {
        let strSelectAgrupacion = `
        <b>Agrupación:</b><br>
        <select name="agrupacion_ticket_id" id="agrupacion_ticket_id" class="form-control" onchange="updateAgrupacionTicket(${arrData.id}, this.value);">`;

        for (let key in arrAgrupaciones) {
            const arrAgrupacion = arrAgrupaciones[key];
            const strSelected = (arrAgrupacion.id === arrData.agrupacion_id) ? 'selected' : '';
            strSelectAgrupacion += `<option value="${arrAgrupacion.id}" ${strSelected}>${arrAgrupacion.nombre}</option>>`;
        }
        strSelectAgrupacion += `</select>`;
        objDivCol6.innerHTML = strSelectAgrupacion;

        objDivRow.appendChild(objDivCol6);

        objOptions = {
            element: 'div',
            classes: ["col-6", "text-center"],
        };
        objDivCol6 = await createElement(objOptions);

        objOptions = {
            element: 'button',
            classes: ["btn", "btn-outline-danger"],
        };
        let objButton = await createElement(objOptions);
        objButton.innerHTML = `<span class="material-icons">delete_outline</span> Eliminar`;

        objButton.onclick = () => {
            dialogConfirm(eliminarTicket, arrData.id);
        };

        objDivCol6.appendChild(objButton);

        objDivRow.appendChild(objDivCol6);

        await divGeneral.appendChild(objDivRow);

    }

    objOptions = {
        element: 'div',
        classes: ["row"],
        styles: {
            margin: "35px 0 0 0"
        },
    };
    objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-6"],
    };
    objDivCol6 = await createElement(objOptions);
    objDivCol6.innerHTML = `
        <b>Usuario:</b> ${arrData.usuario_creador}
        <input type="hidden" id="ticket_id" name="ticket_id" value="${arrData.id}">
    `;
    objDivRow.appendChild(objDivCol6);

    objOptions = {
        element: 'div',
        classes: ["col-4"],
    };
    let objDivCol4 = await createElement(objOptions);
    objDivCol4.innerHTML = `
        <b>Fecha creación:</b> ${arrData.fecha_creacion}
    `;
    objDivRow.appendChild(objDivCol4);

    await divGeneral.appendChild(objDivRow);

    objOptions = {
        element: 'div',
        classes: ["row"],
        styles: {
            margin: "35px 0 0 0"
        },
    };
    objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-6"],
    };
    objDivCol6 = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["form-group"],
    };
    let objDivFormGroup = await createElement(objOptions);
    objDivFormGroup.innerHTML = `
        <b>Titulo:</b><br>
    `;

    objOptions = {
        element: 'input',
        id: `titulo_${arrData.id}`,
        name: `titulo_${arrData.id}`,
        classes: ["form-control"],
        "value": arrData.titulo,
    };
    let objInput = await createElement(objOptions);
    objInput.onchange = (e) => {
        if (!boolDirector) {
            updateTicket(arrData.id, 'titulo', e.target.value);
        }
    };

    objDivFormGroup.appendChild(objInput);
    objDivCol6.appendChild(objDivFormGroup);
    objDivRow.appendChild(objDivCol6);

    objOptions = {
        element: 'div',
        classes: ["col-3"],
    };
    let objDivCol3 = await createElement(objOptions);
    objDivCol3.innerHTML = `<b>Estado:</b> <br>`;

    objOptions = {
        element: 'span',
        styles: {
            "background": arrData.estado_color,
            color: 'white',
            "font-weight": 'bold',
            "padding": '5px 20px',
            "border-radius": '3px',
        },
    };
    let objSpan = await createElement(objOptions);
    objSpan.innerText = arrData.estado;

    objDivCol3.appendChild(objSpan);
    objDivRow.appendChild(objDivCol3);

    objOptions = {
        element: 'div',
        classes: ["col-3"],
    };
    objDivCol3 = await createElement(objOptions);
    objDivCol3.innerHTML = `<b>Prioridad:</b> <br>`;

    objOptions = {
        element: 'span',
        styles: {
            "background": arrData.prioridad_color,
            color: 'white',
            "font-weight": 'bold',
            "padding": '5px 20px',
            "border-radius": '3px',
        },
    };
    objSpan = await createElement(objOptions);
    objSpan.innerText = arrData.prioridad;

    objDivCol3.appendChild(objSpan);
    objDivRow.appendChild(objDivCol3);

    await divGeneral.appendChild(objDivRow);

    objOptions = {
        element: 'div',
        classes: ["row"],
        styles: {
            margin: '35px 0 0 0',
        },
    };
    objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-6"],
    };
    objDivCol6 = await createElement(objOptions);
    objDivRow.appendChild(objDivCol6);

    objOptions = {
        element: 'div',
        classes: ["form-group"],
    };
    objDivFormGroup = await createElement(objOptions);
    objDivFormGroup.innerHTML = `
        <b>Descripción:</b><br>
    `;
    objDivCol6.append(objDivFormGroup);

    objOptions = {
        element: 'textarea',
        id: `descripcion_${arrData.id}`,
        name: `descripcion_${arrData.id}`,
        "value": arrData.descripcion,
        classes: ["form-control"],
        styles: {
            "height": 'auto'
        },
        attributes: {
            "rows": '3',
        },
    };
    let objTextArea = await createElement(objOptions);
    objTextArea.onchange = (e) => {
        if (!boolDirector) {
            updateTicket(arrData.id, 'descripcion', e.target.value);
        }
    };
    objDivFormGroup.appendChild(objTextArea);
    objDivRow.appendChild(objDivCol6);

    await divGeneral.appendChild(objDivRow);

    objOptions = {
        element: 'div',
        classes: ["row"],
        styles: {
            margin: '35px 0 0 0',
        },
    };
    objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-6"],
    };
    objDivCol6 = await createElement(objOptions);
    objDivRow.appendChild(objDivCol6);

    objOptions = {
        element: 'div',
        classes: ["form-group"],
    };
    objDivFormGroup = await createElement(objOptions);
    objDivFormGroup.innerHTML = `
        <b>Causa:</b><br>
    `;
    objDivCol6.append(objDivFormGroup);

    objOptions = {
        element: 'textarea',
        id: `causa_${arrData.id}`,
        name: `causa_${arrData.id}`,
        "value": arrData.causa,
        classes: ["form-control"],
        styles: {
            "height": 'auto'
        },
        attributes: {
            "rows": '3',
        },
    };
    objTextArea = await createElement(objOptions);
    objTextArea.onchange = (e) => {
        if (!boolDirector) {
            updateTicket(arrData.id, 'causa', e.target.value);
        }
    };
    objDivFormGroup.appendChild(objTextArea);
    objDivRow.appendChild(objDivCol6);

    objOptions = {
        element: 'div',
        classes: ["col-6"],
    };
    objDivCol6 = await createElement(objOptions);
    objDivRow.appendChild(objDivCol6);

    objOptions = {
        element: 'div',
        classes: ["form-group"],
    };
    objDivFormGroup = await createElement(objOptions);
    objDivFormGroup.innerHTML = `
        <b>Posible solucion:</b><br>
    `;
    objDivCol6.append(objDivFormGroup);

    objOptions = {
        element: 'textarea',
        id: `posible_solucion_${arrData.id}`,
        name: `posible_solucion_${arrData.id}`,
        "value": arrData.posible_solucion,
        classes: ["form-control"],
        styles: {
            "height": 'auto',
        },
        attributes: {
            "rows": '3',
        },
    };
    objTextArea = await createElement(objOptions);
    objTextArea.onchange = (e) => {
        if (!boolDirector) {
            updateTicket(arrData.id, 'posible_solucion', e.target.value);
        }
    };
    objDivFormGroup.appendChild(objTextArea);
    objDivRow.appendChild(objDivCol6);

    await divGeneral.appendChild(objDivRow);

    objOptions = {
        element: 'div',
        classes: ["row"],
        styles: {
            margin: "35px 0 0 0",
        },
    };
    objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-6"],
    };
    objDivCol6 = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["form-group"],
    };
    objDivFormGroup = await createElement(objOptions);
    objDivFormGroup.innerHTML = `
        <b>Fecha inicio:</b><br>
    `;
    const objAttributes = (arrData.user_create === intUser)? {} : {disabled: "disabled"}

    objOptions = {
        element: 'input',
        id: `fecha_inicio_${arrData.id}`,
        name: `fecha_inicio_${arrData.id}`,
        type: 'datetime-local',
        "value": arrData.fecha_inicio,
        classes: ["form-control"],
        attributes: objAttributes
    };
    objInput = await createElement(objOptions);
    objInput.onchange = (e) => {
        if (!boolDirector) {
            updateTicket(arrData.id, 'fecha_inicio', e.target.value);
        }
    };

    objDivFormGroup.appendChild(objInput);
    objDivCol6.appendChild(objDivFormGroup);
    objDivRow.appendChild(objDivCol6);

    objOptions = {
        element: 'div',
        classes: ["col-6"],
    };
    objDivCol6 = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["form-group"],
    };
    objDivFormGroup = await createElement(objOptions);
    objDivFormGroup.innerHTML = `
        <b>Fecha fin:</b><br>
    `;

    objOptions = {
        element: 'input',
        id: `fecha_fin_${arrData.id}`,
        name: `fecha_fin_${arrData.id}`,
        type: 'datetime-local',
        value: arrData.fecha_fin,
        classes: ["form-control"],
        attributes: objAttributes
    };
    objInput = await createElement(objOptions);
    objInput.onchange = (e) => {
        if (!boolDirector) {
            updateTicket(arrData.id, 'fecha_fin', e.target.value);
        }
    };

    objDivFormGroup.appendChild(objInput);
    objDivCol6.appendChild(objDivFormGroup);
    objDivRow.appendChild(objDivCol6);

    await divGeneral.appendChild(objDivRow);

};

/**
 ** Función que dibuja todos los logs del ticket
 */
const drawLogsTicket = async (arrData) => {
    divActividad.innerHTML = '';

    for (let key in arrData) {
        const log = arrData[key];
        let strFoto = "https://nova.ffinter.com/";
        strFoto += (log.avatar === "") ? "/static/assets/img/default-avatar.png" : `media/${log.avatar}`;
        Object.assign(log, {"foto": strFoto});

        let objOptions = {
            element: 'div',
            classes: ["row"],
            styles: {
                margin: '15px 0',
                "padding": '0 0 15px 0',
                "border-bottom": '#d9d3d3 solid 1px',
            },
        };
        let objDivRow = await createElement(objOptions);

        objOptions = {
            element: 'div',
            classes: ["col-1"],
        }

        let objDivCol1 = await createElement(objOptions);
        let strTooltip = `rel="tooltip" data-original-title="${log.nombre}"`;
        objDivCol1.innerHTML = await drawIconoPersona(log, "#a1a1a1", strTooltip);

        objDivRow.appendChild(objDivCol1);

        objOptions = {
            element: 'div',
            classes: ["col-3"],
            styles: {
                margin: 'auto',
                "white-space": 'nowrap',
                "text-overflow": 'ellipsis',
                "overflow": 'hidden',
            },
            attributes: {
                "rel": 'tooltip',
                "data-original-title": log.titulo,
            }
        };
        let objDivCol3 = await createElement(objOptions);
        objDivCol3.innerText = log.titulo;
        objDivRow.appendChild(objDivCol3);

        if (log.identificador === "update_ticket") {
            objOptions = {
                element: 'div',
                classes: ["col-3"],
                styles: {
                    margin: 'auto',
                    "white-space": 'nowrap',
                    "text-overflow": 'ellipsis',
                    "overflow": 'hidden',
                }
            };
            objDivCol3 = await createElement(objOptions);
            if (log.valor_anterior) {
                objDivCol3.innerHTML = log.valor_anterior;
                objDivCol3.setAttribute('rel', 'tooltip');
                objDivCol3.setAttribute('data-original-title', log.valor_anterior);
            } else {
                objDivCol3.innerText = '-';
                objDivCol3.style.setProperty('text-align', 'center');
            }
            objDivRow.appendChild(objDivCol3);

            objOptions = {
                element: 'div',
                classes: ["col-3"],
                styles: {
                    margin: 'auto',
                    "white-space": 'nowrap',
                    "text-overflow": 'ellipsis',
                    "overflow": 'hidden',
                }
            };
            objDivCol3 = await createElement(objOptions);
            if (log.valor_nuevo) {
                objDivCol3.innerHTML = log.valor_nuevo;
                objDivCol3.setAttribute('rel', 'tooltip');
                objDivCol3.setAttribute('data-original-title', log.valor_nuevo);
            } else {
                objDivCol3.innerText = '-';
                objDivCol3.style.setProperty('text-align', 'center');
            }
            objDivRow.appendChild(objDivCol3);
        } else if (log.identificador === "insert_ticket_comentario") {

            objOptions = {
                element: 'div',
                classes: ["col-6"],
                styles: {
                    margin: 'auto',
                    "white-space": 'nowrap',
                    "text-overflow": 'ellipsis',
                    "overflow": 'hidden',
                },
                attributes: {
                    "rel": 'tooltip',
                    "data-original-title": log.valor_nuevo,
                }
            };
            let objDivCol6 = await createElement(objOptions);
            objDivCol6.innerHTML = log.valor_nuevo;

            objDivRow.appendChild(objDivCol6);
        } else if (log.identificador === "update_ticket_estado") {

            let strColorAnterior = '';
            let strEstadoAnterior = '';
            let strColorNuevo = '';
            let strEstadoNuevo = '';

            for (let key in arrEstados) {
                const arrEstado = arrEstados[key];
                if (arrEstado.id == log.valor_anterior) {
                    strEstadoAnterior = arrEstado.text;
                    strColorAnterior = arrEstado.color;
                }

                if (arrEstado.id == log.valor_nuevo) {
                    strEstadoNuevo = arrEstado.text;
                    strColorNuevo = arrEstado.color;
                }
            }

            objOptions = {
                element: 'div',
                classes: ["col-2"],
            };

            if (log.valor_anterior) {
                Object.assign(objOptions, {
                    styles: {
                        "background": strColorAnterior,
                        "text-align": 'center',
                        color: 'white',
                        margin: 'auto',
                        "padding": '8px',
                        "font-weight": 'bold',
                        "border-radius": '3px'
                    }
                });
            } else {
                Object.assign(objOptions, {styles: {"text-align": 'center'}});
            }

            let objDivColAnterior = await createElement(objOptions);
            objDivColAnterior.innerText = (log.valor_anterior) ? strEstadoAnterior : '-';
            objDivRow.appendChild(objDivColAnterior);

            objOptions = {
                element: 'div',
                classes: ["col-2"],
                styles: {
                    "text-align": 'center',
                    color: '#d9d3d3',
                    margin: 'auto',
                }
            };
            let objDivColSeparador = await createElement(objOptions);
            objDivColSeparador.innerHTML = `<i class="fas fa-angle-right"></i>`;
            objDivRow.appendChild(objDivColSeparador);

            objOptions = {
                element: 'div',
                classes: ["col-2"],
                styles: {
                    margin: 'auto',
                }
            };

            if (log.valor_nuevo) {
                Object.assign(objOptions, {
                    styles: {
                        "background": strColorNuevo,
                        "text-align": 'center',
                        color: 'white',
                        margin: 'auto',
                        "padding": '8px',
                        "font-weight": 'bold',
                        "border-radius": '3px'
                    }
                });
            } else {
                Object.assign(objOptions, {styles: {"text-align": 'center'}});
            }

            let objDivColNuevo = await createElement(objOptions);
            objDivColNuevo.innerText = (log.valor_nuevo) ? strEstadoNuevo : '-';
            objDivRow.appendChild(objDivColNuevo);

        } else if (log.identificador === "update_ticket_prioridad") {

            let strColorAnterior = '';
            let strPrioridadAnterior = '';
            let strColorNuevo = '';
            let strPrioridadNuevo = '';

            for (let key in arrPrioridades) {
                const arrPrioridad = arrPrioridades[key];
                if (arrPrioridad.id == log.valor_anterior) {
                    strPrioridadAnterior = arrPrioridad.text;
                    strColorAnterior = arrPrioridad.color;
                }

                if (arrPrioridad.id == log.valor_nuevo) {
                    strPrioridadNuevo = arrPrioridad.text;
                    strColorNuevo = arrPrioridad.color;
                }
            }

            objOptions = {
                element: 'div',
                classes: ["col-2"],
            };

            if (log.valor_anterior) {
                Object.assign(objOptions, {
                    styles: {
                        "background": strColorAnterior,
                        "text-align": 'center',
                        color: 'white',
                        margin: 'auto',
                        "padding": '8px',
                        "font-weight": 'bold',
                        "border-radius": '3px'
                    }
                });
            } else {
                Object.assign(objOptions, {styles: {"text-align": 'center'}});
            }

            let objDivColAnterior = await createElement(objOptions);
            objDivColAnterior.innerText = (log.valor_anterior) ? strPrioridadAnterior : '-';
            objDivRow.appendChild(objDivColAnterior);

            objOptions = {
                element: 'div',
                classes: ["col-2"],
                styles: {
                    "text-align": 'center',
                    color: '#d9d3d3',
                    margin: 'auto',
                }
            };
            let objDivColSeparador = await createElement(objOptions);
            objDivColSeparador.innerHTML = `<i class="fas fa-angle-right"></i>`;
            objDivRow.appendChild(objDivColSeparador);

            objOptions = {
                element: 'div',
                classes: ["col-2"],
                styles: {
                    margin: 'auto',
                }
            };

            if (log.valor_nuevo) {
                Object.assign(objOptions, {
                    styles: {
                        "background": strColorNuevo,
                        "text-align": 'center',
                        color: 'white',
                        margin: 'auto',
                        "padding": '8px',
                        "font-weight": 'bold',
                        "border-radius": '3px'
                    }
                });
            } else {
                Object.assign(objOptions, {styles: {"text-align": 'center'}});
            }

            let objDivColNuevo = await createElement(objOptions);
            objDivColNuevo.innerText = (log.valor_nuevo) ? strPrioridadNuevo : '-';
            objDivRow.appendChild(objDivColNuevo);

        } else if (log.identificador === "insert_ticket_usuario") {

            objOptions = {
                element: 'div',
                classes: ["col-2"],
                styles: {
                    margin: 'auto',
                    "text-align": 'center',
                }
            };

            let objDivCol2 = await createElement(objOptions);
            objDivRow.appendChild(objDivCol2);

            if (log.valor_anterior) {
                objDivCol2.innerText = 'Desasignado';
            } else if (log.valor_nuevo) {
                objDivCol2.innerText = 'Asignado';
            }

            objOptions = {
                element: 'div',
                classes: ["col-2"],
                styles: {
                    "text-align": 'center',
                    color: '#d9d3d3',
                    margin: 'auto',
                }
            };
            let objDivColSeparador = await createElement(objOptions);
            objDivColSeparador.innerHTML = `<i class="fas fa-angle-right"></i>`;
            objDivRow.appendChild(objDivColSeparador);

            objOptions = {
                element: 'div',
                classes: ["col-2"],
                styles: {
                    margin: 'auto',
                    "text-align": 'center',
                }
            };

            objDivCol2 = await createElement(objOptions);

            let objFoto = {
                "foto": "default-avatar.png",
                "nombre": "admin",
            };
            strTooltip = `rel="tooltip" data-original-title="admin"`;
            for (let key in objPersonas) {
                const objUsuario = objPersonas[key];

                if (log.valor_anterior && objUsuario.user_id == log.valor_anterior) {
                    strTooltip = `rel="tooltip" data-original-title="${objUsuario.nombre}"`;
                    objFoto = {
                        "foto": (objUsuario.avatar === "") ? "default-avatar.png" : objUsuario.avatar,
                        "nombre": objUsuario.nombre,
                    };
                } else if (log.valor_nuevo && objUsuario.user_id == log.valor_nuevo) {
                    strTooltip = `rel="tooltip" data-original-title="${objUsuario.nombre}"`;
                    objFoto = {
                        "foto": (objUsuario.avatar === "") ? "default-avatar.png" : objUsuario.avatar,
                        "nombre": objUsuario.nombre,
                    };
                }

            }
            objDivCol2.innerHTML = await drawIconoPersona(objFoto, "#a1a1a1", strTooltip);
            objDivRow.appendChild(objDivCol2);

        } else if (log.identificador === "insert_ticket_adjunto") {

            objOptions = {
                element: 'div',
                classes: ["col-6"],
                styles: {
                    margin: 'auto',
                    "white-space": 'nowrap',
                    "text-overflow": 'ellipsis',
                    "overflow": 'hidden',
                },
                attributes: {
                    "rel": 'tooltip',
                    "data-original-title": log.valor_nuevo,
                }
            };
            let objDivCol6 = await createElement(objOptions);
            objDivCol6.innerHTML = log.valor_nuevo;

            objDivRow.appendChild(objDivCol6);

        } else if (log.identificador === "update_ticket_etiqueta") {

            let strEtiqueta = '';

            for (let key in objEtiquetas) {
                const arrEtiqueta = objEtiquetas[key];
                if (arrEtiqueta.id == log.valor_anterior) {
                    strEtiqueta = arrEtiqueta.nombre;
                }

                if (arrEtiqueta.id == log.valor_nuevo) {
                    strEtiqueta = arrEtiqueta.nombre;
                }
            }

            objOptions = {
                element: 'div',
                classes: ["col-2"],
                styles: {
                    margin: 'auto',
                    "text-align": 'center',
                }
            };

            let objDivCol2 = await createElement(objOptions);
            objDivRow.appendChild(objDivCol2);

            if (log.valor_anterior) {
                objDivCol2.innerText = 'Quito';
            } else if (log.valor_nuevo) {
                objDivCol2.innerText = 'Agrego';
            }

            objOptions = {
                element: 'div',
                classes: ["col-2"],
                styles: {
                    "text-align": 'center',
                    color: '#d9d3d3',
                    margin: 'auto',
                }
            };
            let objDivColSeparador = await createElement(objOptions);
            objDivColSeparador.innerHTML = `<i class="fas fa-angle-right"></i>`;
            objDivRow.appendChild(objDivColSeparador);

            objOptions = {
                element: 'div',
                classes: ["col-2"],
                styles: {
                    margin: 'auto',
                    "text-align": 'center',
                }
            };

            objDivCol2 = await createElement(objOptions);

            objDivCol2.innerText = strEtiqueta;
            objDivRow.appendChild(objDivCol2);

        } else if (log.identificador === "update_ticket_agrupacion") {

            let strAgrupacionAnterior = '';
            let strAgrupacionNueva = '';

            objOptions = {
                element: 'div',
                classes: ["col-2"],
            };

            Object.assign(objOptions, {styles: {"text-align": 'center'}});

            let objDivColAnterior = await createElement(objOptions);
            objDivColAnterior.innerText = (log.agrupacion_anterior) ? log.agrupacion_anterior : '-';
            objDivRow.appendChild(objDivColAnterior);

            objOptions = {
                element: 'div',
                classes: ["col-2"],
                styles: {
                    "text-align": 'center',
                    color: '#d9d3d3',
                    margin: 'auto',
                }
            };
            let objDivColSeparador = await createElement(objOptions);
            objDivColSeparador.innerHTML = `<i class="fas fa-angle-right"></i>`;
            objDivRow.appendChild(objDivColSeparador);

            objOptions = {
                element: 'div',
                classes: ["col-2"],
                styles: {
                    margin: 'auto',
                }
            };

            Object.assign(objOptions, {styles: {"text-align": 'center'}});

            let objDivColNuevo = await createElement(objOptions);
            objDivColNuevo.innerText = (log.agrupacion_nueva) ? log.agrupacion_nueva : '-';
            objDivRow.appendChild(objDivColNuevo);

        }

        objOptions = {
            element: 'div',
            classes: ["col-2"],
            styles: {
                "white-space": 'nowrap',
                "text-overflow": 'ellipsis',
                "overflow": 'hidden',
            },
            attributes: {
                "rel": 'tooltip',
                "data-original-title": log.fecha,
            },
        };
        let objDivCol2 = await createElement(objOptions);
        objDivCol2.innerText = log.fecha;
        objDivRow.appendChild(objDivCol2);

        divActividad.appendChild(objDivRow);
    }

};

/**
 ** Función de toma de decisión de que método ejecutar
 @param arrData aquí se revisa si se dibuja un comentario padre o una respuesta
 */
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

    objOptions = {
        element: 'div',
        classes: ["row"],
        styles: {
            margin: '20px 0 0 0',
        },
    };
    objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-1"],
    };
    let objDivCol1 = await createElement(objOptions);
    let strTooltip = `rel="tooltip" data-original-title="${strNameUserLogin}"`;

    arrImg = {
        "foto": strFotoUserLogin,
        "nombre": strNameUserLogin,
    }
    objDivCol1.innerHTML = await drawIconoPersona(arrImg, "#a1a1a1", strTooltip);
    objDivRow.appendChild(objDivCol1);

    objOptions = {
        element: 'div',
        classes: ["col-11"],
    };
    let objDivCol11 = await createElement(objOptions);

    objOptions = {
        element: 'textarea',
        id: `comentario_${arrComentario.id}`,
        placeholder: `Escribe una respuesta..`,
        classes: ["form-control"],
    };
    let objTextArea = await createElement(objOptions);

    objDivCol11.appendChild(objTextArea);
    objDivRow.appendChild(objDivCol11);
    objDiv.appendChild(objDivRow);

    objOptions = {
        element: 'div',
        classes: ["row"],
        styles: {
            margin: '20px 0 0 0',
        },
    };
    objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-8"],
    };
    objDivCol8 = await createElement(objOptions);

    objOptions = {
        element: 'a',
        classes: [`adjunto_comentario_hijo_${arrComentario.id}`],
        styles: {
            "cursor": 'pointer',
        },
    };
    let objA = await createElement(objOptions);
    objA.onclick = () => {
        selectFileComentarioHijo(arrComentario.id);
    };
    objA.innerHTML = `<span class="material-icons">attachment</span><span id="spanAdjunto_${arrComentario.id}"> Agregar adjunto</span>`;
    objDivCol8.appendChild(objA);

    objOptions = {
        element: 'input',
        type: 'file',
        name: `adjunto_comentario_hijo[]`,
        id: `adjunto_comentario_hijo_${arrComentario.id}`,
        styles: {
            "display": 'none',
        },
        attributes: {
            "accept": 'image/*, .pdf, .doc, .docx, .csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/plain',
        }
    };
    let objFile = await createElement(objOptions);
    objFile.onchange = () => {
        changeAdjuntoHijo(arrComentario.id);
    };
    objDivCol8.append(objFile);
    objDivRow.appendChild(objDivCol8);

    objOptions = {
        element: 'div',
        classes: ["col-4", "text-right"],
    };
    let objDivCol2 = await createElement(objOptions);

    objOptions = {
        element: 'button',
        classes: ["btnGrabarComentario"],
        type: 'button',
    };
    let objButton = await createElement(objOptions);
    objButton.onclick = async () => {
        await saveComentario(arrComentario.id, `comentario_${arrComentario.id}`);
    };
    objButton.innerText = 'Responder';
    objDivCol2.appendChild(objButton);

    objDivRow.appendChild(objDivCol2);

    objDiv.appendChild(objDivRow);

    divComentarios.appendChild(objDiv);

};

/**
 ** Función para cerrar el modal del ticket
 */
const closeModalInfoTicket = () => {
    modalInfo.classList.remove('modal-comentario-visibility');
    modalInfo.classList.add('modal-comentario-hidden');
};

/**
 ** Función mostrar el modal
 */
const showModalInfoTicket = () => {
    modalInfo.classList.remove('modal-comentario-hidden');
    modalInfo.classList.add('modal-comentario-visibility');
};

/**
 ** Función para cerrar el modal del ticket
 */
const closeModalFilesTicket = () => {
    modalFiles.classList.remove('modal-files-visibility');
    modalFiles.classList.add('modal-files-hidden');
};

/**
 ** Función mostrar el modal
 */
const showModalFilesTicket = async () => {
    modalFiles.classList.remove('modal-files-hidden');
    modalFiles.classList.add('modal-files-visibility');
};

const hexToRgb = (hex) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

const drawGroupTickets = async (objContent, boolExpandido = true) => {
    let intCorrelativo = objContent.id;
    intCountGroup++;

    let objColapsable = document.createElement("div");
    objColapsable.classList.add("accordion");
    objColapsable.id = "accordion_" + intCorrelativo;
    objColapsable.setAttribute("data-grupo", intCorrelativo);
    objColapsable.setAttribute("data-count_tickets", objContent.count_tickets);

    let objCard = document.createElement("div");
    objCard.classList.add("card");

    /*if (!document.querySelector('.accordion')) {
        objCard.style.setProperty('margin-top', '70px');
    }*/

    let objCardHeader = document.createElement("div");
    objCardHeader.classList.add("card-header");
    objCardHeader.id = "heading" + intCorrelativo;

    let objTitulo = document.createElement("h2");
    let objButton = document.createElement("button");
    objButton.classList.add("btn");
    objButton.classList.add("btn-link");
    objButton.classList.add("btn-block");
    objButton.classList.add("text-left");
    objButton.classList.add("text-primary");
    objButton.classList.add("btnGrupo");
    if (!boolExpandido) {
        objButton.classList.add("collapsed");
    }

    objButton.type = "button";
    objButton.setAttribute("data-toggle", "collapse");
    objButton.setAttribute("data-target", "#collapse" + intCorrelativo);
    objButton.setAttribute("data-color", objContent.color);
    objButton.style.setProperty('color', objContent.color, 'important');
    if (!boolExpandido) objButton.style.setProperty('border', '1px solid ' + objContent.color);
    objButton.style.setProperty('padding-right', 'unset', 'important');
    objButton.style.setProperty('padding-left', '5px', 'important');
    objButton.style.setProperty('font-size', '15px');
    const strPonderacion = (objContent.ponderacion && boolIsMejoraContinua) ? `<div style="float: right; padding-right: 5px;">Prioridad ${objContent.ponderacion}</div>` : "";
    objButton.innerHTML = `${intCountGroup}. ${objContent.nombre} ${strPonderacion}`;

    objTitulo.appendChild(objButton);
    objCardHeader.appendChild(objTitulo);
    objCard.appendChild(objCardHeader);

    let objBodyCollapse = document.createElement("div");
    objBodyCollapse.classList.add("collapse");
    if (boolExpandido) {
        objBodyCollapse.classList.add("show");
    }
    objBodyCollapse.id = "collapse" + intCorrelativo;
    objBodyCollapse.setAttribute("aria-labelledby", "heading" + intCorrelativo);
    objBodyCollapse.setAttribute("data-parent", "#accordion_" + intCorrelativo);

    let objCardBody = document.createElement("div");
    objCardBody.classList.add("card-body");
    objCardBody.id = "collapseBody_" + intCorrelativo;

    objCardBody = await drawHeaders("titulo", objCardBody, objContent.color, false, true);

    objCardBody = await drawTickets(objContent.tickets, objCardBody, 0, objContent.color, intCorrelativo);

    objCardBody = await drawRowNewTicket(0, objCardBody, objContent.color, objContent.id);

    objBodyCollapse.appendChild(objCardBody);
    objCard.appendChild(objBodyCollapse);

    objColapsable.appendChild(objCard)

    return objColapsable;
}

const drawHeaders = async (strTitulo, objParent, strColor, boolHijo = false, boolMostrar = true) => {
    let objRow = document.createElement("div");
    objRow.classList.add("row");
    objRow.style.setProperty("color", strColor);
    objRow.style.setProperty("border-top", "1px solid #ddd");
    objRow.style.setProperty("border-right", "1px solid #ddd");
    objRow.style.setProperty("border-left", "1px solid #ddd");

    let objCell1 = document.createElement("div");
    if (boolIsMejoraContinua) {
        objCell1.classList.add("col-sm-6");
    } else {
        objCell1.classList.add("col-sm-7");
    }
    objCell1.classList.add("titulo");
    if (boolHijo) objCell1.classList.add("titulo-hijo");
    objCell1.innerHTML = strTitulo;

    let objCell2 = document.createElement("div");
    objCell2.classList.add("col-sm-1");
    objCell2.classList.add("titulo");
    if (!boolMostrar) objCell2.style.setProperty("display", "none");
    if (boolHijo) objCell2.classList.add("text-center");
    if (boolHijo) objCell2.classList.add("titulo-hijo");
    objCell2.innerHTML = "Personas";

    let objCell2punto5 = document.createElement("div");
    objCell2punto5.classList.add("col-sm-1");
    objCell2punto5.classList.add("titulo");
    if (!boolMostrar) objCell2punto5.style.setProperty("display", "none");
    if (boolHijo) objCell2punto5.classList.add("text-center");
    if (boolHijo) objCell2punto5.classList.add("titulo-hijo");
    objCell2punto5.innerHTML = "Etiquetas";

    let objCell3 = document.createElement("div");
    objCell3.classList.add("col-sm-1");
    objCell3.classList.add("titulo");
    if (!boolMostrar) objCell3.style.setProperty("display", "none");
    if (boolHijo) objCell3.classList.add("text-center");
    if (boolHijo) objCell3.classList.add("titulo-hijo");
    objCell3.innerHTML = "Estado";

    let objCell4 = document.createElement("div");
    objCell4.classList.add("col-sm-1");
    objCell4.classList.add("titulo");
    if (!boolMostrar) objCell4.style.setProperty("display", "none");
    if (boolHijo) objCell4.classList.add("text-center");
    if (boolHijo) objCell4.classList.add("titulo-hijo");
    objCell4.innerHTML = "Prioridad";

    let objCell5 = document.createElement("div");
    objCell5.classList.add("col-sm-1");
    objCell5.classList.add("titulo");
    if (!boolMostrar) objCell5.style.setProperty("display", "none");
    if (boolHijo) objCell5.classList.add("text-center");
    if (boolHijo) objCell5.classList.add("titulo-hijo");
    objCell5.innerHTML = "Fechas";

    objRow.appendChild(objCell1);
    if (boolIsMejoraContinua) {
        let objOptions = {
            element: 'div',
            classes: ["col-sm-1", "titulo"],
        };
        let objCell1punto5 = await createElement(objOptions);
        objCell1punto5.innerText = 'Ponderación';
        objRow.appendChild(objCell1punto5);
    }
    objRow.appendChild(objCell2);
    objRow.appendChild(objCell2punto5);
    objRow.appendChild(objCell3);
    objRow.appendChild(objCell4);
    objRow.appendChild(objCell5);

    objParent.appendChild(objRow);

    return objParent;
}

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

const drawCeldaPersonasAsignadas = async (intTicketId, objAsignadas, strColor, boolAdd = false) => {
    let strHtmlCell2 = '';

    let intCantidadPersonas = Object.keys(objAsignadas).length;

    arrTicketsPersonas[intTicketId] = [];
    arrTicketsPersonas[intTicketId]["personas"] = [];

    let strCursor = (!boolAdd) ? 'cursor: not-allowed;' : '';
    let strStyleCursor = (!boolAdd) ? 'style="cursor: not-allowed;"' : '';
    if (intCantidadPersonas > 0) {

        let intContador = 0;

        for (const keyp in objAsignadas) {
            intContador++;
            let persona = objAsignadas[keyp];
            arrTicketsPersonas[intTicketId]["personas"][persona.id] = [];
            arrTicketsPersonas[intTicketId]["personas"][persona.id]["nombre"] = persona.nombre;
            arrTicketsPersonas[intTicketId]["personas"][persona.id]["foto"] = persona.foto;

            if ((intCantidadPersonas <= 2) || (intCantidadPersonas > 2 && intContador < 2)) {
                strHtmlCell2 += await drawIconoPersona(persona, strColor, strStyleCursor);
            }
        }

        if (intCantidadPersonas > 2) {
            let intCantidad = intCantidadPersonas - 1;
            strHtmlCell2 += `<span class="fa-stack">
                                <i class="fas fa-circle fa-stack-2x" style="color: ${strColor};opacity: 0.5; ${strCursor}"></i>
                                <i class="fal fa-plus fa-stack-1x fa-inverse" style="--fa-inverse:var(--fa-navy);text-align: left;left: 8px;font-size: 12px; ${strCursor}"></i>
                                <i class="fa-inverse fa-stack-1x" style="--fa-inverse:var(--fa-navy);text-align: right;left: -10px;top: 8px; ${strCursor}">${intCantidad}</i>
                            </span>`;
        } else if (intCantidadPersonas !== 2) {
            let strPlus = (boolAdd) ? `<i class="fas fa-circle fa-stack-2x" style="color: ${strColor};opacity: 0.5; ${strCursor}"></i>
                                    <i class="fal fa-plus fa-stack-1x fa-inverse" style="--fa-inverse:var(--fa-navy);text-align: center;font-size: 12px; ${strCursor}"></i>` : '';
            strHtmlCell2 += `<span class="fa-stack">
                                ${strPlus}
                            </span>`;
        }
    } else {
        let strPlus = (boolAdd) ? `<i class="fas fa-circle fa-stack-2x" style="color: ${strColor};opacity: 0.5; ${strCursor}"></i>
         <i class="fal fa-plus fa-stack-1x fa-inverse" style="--fa-inverse:var(--fa-navy);text-align: center;font-size: 12px; ${strCursor}"></i>` : '';

        strHtmlCell2 += `<span class="fa-stack">
                            ${strPlus}
                        </span>`;
    }

    return strHtmlCell2;
}

const drawCeldaEtiquetasAsignadas = async (intTicketId, objAsignadas, strColor, boolAdd = false) => {
    let strHtmlCell = '';

    let intCantidadEtiqueta = Object.keys(objAsignadas).length;

    arrTicketsEtiquetas[intTicketId] = [];
    arrTicketsEtiquetas[intTicketId]["etiquetas"] = [];
    let strCursor = (!boolAdd) ? 'cursor: not-allowed;' : '';
    let strStyleCursor = (!boolAdd) ? 'style="cursor: not-allowed;"' : '';

    if (intCantidadEtiqueta > 0) {

        let intContador = 0;
        let intDibujados = 0;
        let strWidth = intCantidadEtiqueta === 3 ? `style="width: 100%;"` : `class="padre-etiquetas"`;
        strHtmlCell += `<div ${strWidth}>`;

        for (const keyp in objAsignadas) {
            intContador++;
            let etiqueta = objAsignadas[keyp];
            arrTicketsEtiquetas[intTicketId]["etiquetas"][etiqueta.id] = [];
            arrTicketsEtiquetas[intTicketId]["etiquetas"][etiqueta.id]["nombre"] = etiqueta.nombre;

            if ((intCantidadEtiqueta <= 3) || (intCantidadEtiqueta > 3 && intContador < 3)) {
                intDibujados++;
                let strColorEtiqueta = arrColorsRandom[Math.floor(Math.random() * arrColorsRandom.length)];
                strHtmlCell += `<div class="mini-etiqueta" style="color: ${strColorEtiqueta};width: reemplazar%;" tooltip="${etiqueta.nombre}">#${etiqueta.nombre}</div>`;
            }
        }

        let sinWidth = 100 / intDibujados;
        strHtmlCell = strHtmlCell.replace(/reemplazar/g, sinWidth.toString())
        strHtmlCell += `</div>`;

        let intPendientes = intCantidadEtiqueta - intDibujados;

        if (intCantidadEtiqueta !== 3) {

            if (intPendientes === 0) {
                let strPlus = (boolAdd) ? `<i class="fas fa-circle fa-stack-2x" style="color: ${strColor};opacity: 0.5;  ${strCursor}"></i>
                                <i class="fal fa-plus fa-stack-1x fa-inverse" style="--fa-inverse:var(--fa-navy);text-align: center;font-size: 12px; ${strCursor}"></i>` : '';
                strHtmlCell += `<span class="fa-stack" style="float: left;position: relative; ${strCursor}">
                                ${strPlus}
                            </span>`;
            } else {
                let strPlus = (boolAdd) ? `<i class="fas fa-circle fa-stack-2x" style="color: ${strColor};opacity: 0.5; ${strCursor}"></i>
                                    <i class="fal fa-plus fa-stack-1x fa-inverse" style="--fa-inverse:var(--fa-navy);text-align: left;left: 8px;font-size: 12px; ${strCursor}"></i>
                                    <i class="fa-inverse fa-stack-1x" style="--fa-inverse:var(--fa-navy);text-align: right;left: -10px;top: 8px; ${strCursor}">${intPendientes}</i>` : '';
                strHtmlCell += `<span class="fa-stack" style="float: left; ${strCursor}">
                                    ${strPlus}
                                </span>`;
            }
        }
    } else {
        let strPlus = (boolAdd) ? `<i class="fas fa-circle fa-stack-2x" style="color: ${strColor};opacity: 0.5; ${strCursor}"></i>
                            <i class="fal fa-plus fa-stack-1x fa-inverse" style="--fa-inverse:var(--fa-navy);text-align: center;font-size: 12px; ${strCursor}"></i>` : '';
        strHtmlCell += `<span class="fa-stack" ${strStyleCursor}>
                            ${strPlus}
                        </span>`;
    }

    return strHtmlCell;
}


const drawTickets = async (objValue, objParent, intPadreId = 0, strColor = "#fff", intAgrupacionId) => {
    let intOrden = 1;
    for (const key in objValue) {
        let ticket = objValue[key];

        if (intPadreId === 0) {
            if (typeof arrGruposTickets[intAgrupacionId] === 'undefined') {
                arrGruposTickets[intAgrupacionId] = [];
                arrGruposTickets[intAgrupacionId]["count"] = 0;
                arrGruposTickets[intAgrupacionId]["estados"] = [];
            }

            arrGruposTickets[intAgrupacionId]["count"]++;
            if (typeof arrGruposTickets[intAgrupacionId]["estados"][ticket.estado_id] === 'undefined') {
                arrGruposTickets[intAgrupacionId]["estados"][ticket.estado_id] = 1;
            } else {
                arrGruposTickets[intAgrupacionId]["estados"][ticket.estado_id]++;
            }
        }

        let strAsignados = '';
        let boolPermisos = (boolIsAdmin || !boolDirector && objTipo.value === 'departamento');
        for (let key in ticket.personas) {
            const arrPersona = ticket.personas[key];
            if (!boolPermisos) {
                boolPermisos = (intUser == arrPersona.id);
            }
            strAsignados += (strAsignados === '') ? arrPersona.id : `_${arrPersona.id}`;
        }
        let strCursor = (!boolPermisos) ? 'cursor: not-allowed;' : '';

        let strEtiquetas = '';
        for (let key in ticket.etiquetas) {
            const arrEtiqueta = ticket.etiquetas[key];
            strEtiquetas += (strEtiquetas === '') ? arrEtiqueta.id : `_${arrEtiqueta.id}`;
        }

        let objOptions = {
            element: 'div',
            classes: ["row", "div-hover"],
            attributes: {
                "data-ticket_id": ticket.id,
                "data-agrupacion": intAgrupacionId,
                "data-asignados": strAsignados,
                "data-etiquetas": strEtiquetas,
                "data-prioridad_id": ticket.prioridad_id,
                "data-estado_id": ticket.estado_id,
                "data-titulo": ticket.nombre,
                "data-padre_id": ticket.padre_id,
                "data-fecha_inicio": ticket.fecha_inicio,
                "data-fecha_fin": ticket.fecha_fin,
                "data-isdown": '0',
            },
        };
        let objRow = await createElement(objOptions);

        let objCell1 = document.createElement("div");
        if (boolIsMejoraContinua) {
            objCell1.classList.add("col-sm-6");
        } else {
            objCell1.classList.add("col-sm-7");
        }
        if (!boolDirector && !boolPermisos) objCell1.style.cursor = 'not-allowed';

        let objRow2 = document.createElement("div");
        objRow2.classList.add("row");

        let objSeparador = document.createElement("div");
        objSeparador.classList.add("separador");
        objSeparador.style.setProperty('background-color', strColor);
        objSeparador.innerHTML = "&nbsp;";

        let objBotonHijos = document.createElement("div");
        objBotonHijos.classList.add("boton-hijos");

        if (Object.keys(ticket.hijos).length === 0) objBotonHijos.classList.add("boton-hijos-hidden");

        let intHijos = ticket.count_hijos;
        intHijos = intHijos > 0 ? intHijos : "";

        objOptions = {
            element: 'span',
            classes: ["efecto-boton"],
            id: 'boton_hijos_' + ticket.id,
            attributes: {
                "data-id": ticket.id,
                "data-hijos": intHijos,
                "data-agrupacion_id": intAgrupacionId,
                "data-color": strColor,
            },
        };
        let objBotonContainer = await createElement(objOptions);
        objBotonContainer.innerHTML = `<i class="fas fa-chevron-right"></i>`;

        objBotonContainer.onclick = (e) => {
            let intIdPadre;
            let objTarget;
            if (typeof (e.target.dataset.id) === "undefined") {
                objTarget = e.target.parentElement;
                intIdPadre = objTarget.dataset.id;
            } else {
                objTarget = e.target;
                intIdPadre = e.target.dataset.id;
            }

            if (objTarget.classList.contains("active")) {
                objTarget.classList.remove("active");
                objTarget.firstChild.classList.remove("fa-chevron-down");
                objTarget.firstChild.classList.add("fa-chevron-right");
                objTarget.style.setProperty("padding", "1px 6px");
                $(`#divHijos_${intIdPadre}`).hide("fast");
            } else {
                objTarget.classList.add("active");
                objTarget.firstChild.classList.remove("fa-chevron-right");
                objTarget.firstChild.classList.add("fa-chevron-down");
                objTarget.style.setProperty("padding", "1px 4.25px 1px 4.25px");
                let intCantidadHijos = objTarget.dataset.hijos;
                if (intCantidadHijos > 0) {
                    $(`#divHijos_${intIdPadre}`).show("fast");
                } else {
                    $(`#divHijos_${intIdPadre}`).show("fast");
                }
            }
        };

        objBotonHijos.appendChild(objBotonContainer);

        let objNombre = document.createElement("div");
        objNombre.classList.add("texto-ticket");
        objNombre.dataset.orden = (ticket.orden && ticket.orden > intOrden) ? ticket.orden : intOrden;
        objNombre.dataset.id_padre = intPadreId;
        objNombre.dataset.id_agrupacion = intAgrupacionId;
        const strHijos = (ticket.count_hijos) ? `<span class="spanCount" id="countHijos_${ticket.id}" data-hijos="${intHijos}">${intHijos}</span>` : `<span class="spanCount spanCountHidden" id="countHijos_${ticket.id}" data-hijos="0"></span>`;
        objNombre.innerHTML = `&nbsp;&nbsp; ${ticket.nombre} ${strHijos}`;
        objNombre.onclick = () => {
            if (boolPermisos || boolDirector) getInfoTicket(ticket.id);
        };

        let objComentarios = document.createElement("div");
        objComentarios.classList.add("boton-comentarios");
        objComentarios.classList.add("text-center");
        const strColorComentarios = (ticket.comentarios === 0) ? '#c7c7c7' : '#0073ea';
        objComentarios.innerHTML = `<span class="fa-stack" style="${strCursor}">
                                        <i class="fas fa-comment fa-stack-2x" style="color: ${strColorComentarios};opacity: 1; ${strCursor}"></i>
                                        <i class="fa-stack-1x fa-inverse" style="--fa-inverse:var(--fa-navy);left: -1px; top: 5px; font-weight: bold; ${strCursor}">${ticket.comentarios}</i>
                                    </span>`;
        if (boolPermisos) {
            objComentarios.onclick = () => {
                getInfoTicket(ticket.id);
            };
        }
        objOptions = {
            element: 'div',
            classes: ["input-orden"],
        };
        const objDivInput = await createElement(objOptions);

        objOptions = {
            element: 'input',
            type: 'number',
            classes: ["form-control"],
            name: "orden_" + ticket.id,
            id: "orden_" + ticket.id,
            value: ticket.orden,
            styles: {
                "text-align": 'center',
            },
        };
        const objInput = await createElement(objOptions);
        objInput.onchange = async (e) => {
            if (!boolDirector) {
                await updateTicket(ticket.id, 'orden', e.target.value, document.getElementById("workspace_id").value);
            }
        };
        objDivInput.appendChild(objInput);

        objRow2.appendChild(objSeparador);
        objRow2.appendChild(objBotonHijos);
        objRow2.appendChild(objDivInput);
        objRow2.appendChild(objNombre);
        objRow2.appendChild(objComentarios);
        objCell1.appendChild(objRow2);

        let objCell2 = document.createElement("div");
        objCell2.classList.add("col-sm-1");
        objCell2.classList.add("text-center");
        objCell2.classList.add("select-personas");
        objCell2.classList.add("ticket-columna-data");
        objCell2.dataset.id = ticket.id;
        objCell2.innerHTML = await drawCeldaPersonasAsignadas(ticket.id, ticket.personas, strColor, (boolIsAdmin || !boolDirector && objTipo.value === 'departamento'));
        if (boolIsAdmin || !boolDirector && objTipo.value === 'departamento') {
            objCell2.onclick = () => {
                showAsignarPersonas(ticket.id);
            };
        }

        let objCell2punto5 = document.createElement("div");
        objCell2punto5.classList.add("col-sm-1");
        objCell2punto5.classList.add("text-center");
        objCell2punto5.classList.add("select-etiquetas");
        objCell2punto5.classList.add("ticket-columna-data");
        objCell2punto5.dataset.id = ticket.id;
        if (!boolPermisos) objCell2punto5.style.cursor = 'not-allowed';
        objCell2punto5.innerHTML = await drawCeldaEtiquetasAsignadas(ticket.id, ticket.etiquetas, strColor, boolPermisos);
        if (boolPermisos) {
            objCell2punto5.onclick = () => {
                showAsignarEtiquetas(ticket.id);
            };
        }

        let objCell3 = document.createElement("div");
        objCell3.classList.add("col-sm-1");
        objCell3.classList.add("text-center");
        objCell3.classList.add("ticket-columna-data");
        objCell3.classList.add("select-estado");
        objCell3.dataset.id = ticket.id;
        objCell3.dataset.estado = ticket.estado_id;
        objCell3.style.setProperty("background-color", ticket.estado_color);
        if (!boolPermisos) objCell3.style.cursor = 'not-allowed';
        objCell3.innerHTML = ticket.estado;
        if (boolPermisos) {
            objCell3.onclick = () => {
                showCambiarEstado(ticket.id, objRow.dataset.estado_id);
            };
        }

        let objCell4 = document.createElement("div");
        objCell4.classList.add("col-sm-1");
        objCell4.classList.add("text-center");
        objCell4.classList.add("ticket-columna-data");
        objCell4.classList.add("select-prioridad");
        objCell4.dataset.id = ticket.id;
        objCell4.dataset.prioridad = ticket.prioridad_id;
        objCell4.style.setProperty("background-color", ticket.prioridad_color);
        if (!boolPermisos) objCell4.style.cursor = 'not-allowed';
        objCell4.innerHTML = ticket.prioridad;
        if (boolPermisos) {
            objCell4.onclick = () => {
                showCambiarPrioridad(ticket.id, ticket.prioridad_id);
            };
        }

        let objCell5 = document.createElement("div");
        objCell5.classList.add("col-sm-1");
        objCell5.classList.add("text-center");
        objCell5.classList.add("ticket-columna-data");
        objCell5.classList.add("fechas");
        if (!boolPermisos) objCell5.style.cursor = 'not-allowed';
        objCell5.dataset.id = ticket.id;

        let strFechaInicio = "";
        if (ticket.fecha_inicio.length > 0) {
            let dateFechaInicio = new Date(ticket.fecha_inicio);
            strFechaInicio = dateTimeGTFormat.format(dateFechaInicio);
            strFechaInicio = strFechaInicio.replace(",", "")
        }

        let strFechaFin = "";
        let strBackgroundEstancado = '#579bfc';
        if (ticket.fecha_fin.length > 0) {
            let dateFechaFin = new Date(ticket.fecha_fin);
            strFechaFin = dateTimeGTFormat.format(dateFechaFin);
            strFechaFin = strFechaFin.replace(",", "");

            if (ticket.estado_id !== 5) {

                if (dateFechaFin < new Date()) {
                    strBackgroundEstancado = '#e2445c';
                }
            }
        }

        let strFecha = "";
        if (strFechaInicio.length > 0 && strFechaFin.length > 0) {
            strFecha = strFechaInicio + " - " + strFechaFin;
        } else {
            strFecha = strFechaInicio.length > 0 ? strFechaInicio : strFechaFin;
        }

        // const strDisabled = (!boolPermisos) ? 'disabled' : '';
        const strDisabled = (ticket.user_create === intUser) ? '' : 'disabled';
        let strCursorDate = (ticket.user_create === intUser) ? '' : 'cursor: not-allowed;';
        objCell5.innerHTML = `<input type="text" class="daterange" value="${strFecha}" ${strDisabled} style="${strCursorDate} background: ${strBackgroundEstancado};" />`;

        objRow.appendChild(objCell1);
        if (boolIsMejoraContinua) {

            objOptions = {
                element: 'div',
                classes: ["col-sm-1"],
                styles: {
                    "text-align": 'center',
                },
            }
            let objCell1punto5 = await createElement(objOptions);
            objCell1punto5.innerText = (ticket.ponderacion) ? ticket.ponderacion : '';
            objRow.appendChild(objCell1punto5);
        }
        objRow.appendChild(objCell2);
        objRow.appendChild(objCell2punto5);
        objRow.appendChild(objCell3);
        objRow.appendChild(objCell4);
        objRow.appendChild(objCell5);

        let objCell6 = document.createElement("div");
        objCell6.classList.add("col-sm-12");
        objCell6.classList.add("details-hijo");
        objCell6.style.setProperty("display", "none");
        objCell6.id = "divHijos_" + ticket.id;

        objCell6 = await drawHeaders('Título', objCell6, strColor, true);
        if (Object.keys(ticket.hijos).length > 0) {
            objCell6 = await drawTickets(ticket.hijos, objCell6, ticket.id, strColor, intAgrupacionId);
        }
        objCell6 = await drawRowNewTicket(ticket.id, objCell6, strColor, intAgrupacionId);

        objRow.appendChild(objCell6);

        objParent.appendChild(objRow);

        intOrden++;
    }

    return objParent;
}

const drawWorkspacesDetail = async (objValue, objParent) => {
    let objHeredero = document.createElement("p");
    if (objValue.padre != null) {
        objHeredero.classList.add("workspace-hijos");
    }

    if (Object.keys(objValue.hijos).length > 0) {
        let objDetails = document.createElement("details");
        objDetails.id = "workspace_contenedor_" + objValue.id;
        objDetails.setAttribute('data-details', 'true');
        let objSummary = document.createElement("summary");
        objSummary.classList.add("workspace");
        objSummary.dataset.id = objValue.id;
        objSummary.dataset.orden = objValue.orden;
        objSummary.dataset.padre = objValue.padre;
        objSummary.style.setProperty("color", objValue.color);
        objSummary.id = "workspace_" + objValue.id;

        let objPSummary = document.createElement("p");
        objPSummary.classList.add("workspace-summary");
        objPSummary.classList.add("workspace-opts");

        let objOptions = {
            "element": 'div',
            "classes": ["workspace-texto"],
        };
        let objSpanTexto = await createElement(objOptions);

        objSpanTexto.innerText = objValue.nombre;

        if (document.getElementById('workspace_id').value == objValue.id) {
            objHeredero.classList.add("active");
        }

        objSpanTexto.dataset.id = objValue.id;
        objSpanTexto.dataset.orden = objValue.orden;
        objSpanTexto.dataset.padre = objValue.padre;

        objPSummary.append(objSpanTexto);

        objOptions = {
            "element": 'span',
            "classes": [
                "workspace-opciones",
            ],
            "attributes": {
                "aria-expanded": false
            },
            styles: {
                visibility: (!boolDirector && objTipo.value === 'departamento') ? 'visible' : 'hidden'
            }
        };
        let objSpan = await createElement(objOptions);

        objSpan.dataset.id = objValue.id;
        objSpan.dataset.orden = objValue.orden;
        objSpan.dataset.padre = objValue.padre;
        objSpan.dataset.toggle = "dropdown";
        objSpan.id = "workspace_" + objValue.id;
        objSpan.style.setProperty("color", objValue.color);
        objSpan.onclick = async (element) => {
            if (element.target.tagName.toLowerCase() === "span") {
                document.getElementById("modificar_workspace_id").value = element.target.dataset.id;
                document.getElementById("workspace_padre_id").value = element.target.dataset.padre;

                $(".opciones-hover").removeClass("opciones-hover");
                $(".workspace-hover").removeClass("workspace-hover");
                element.target.classList.add("opciones-hover");

                element.target.parentNode.classList.add("workspace-hover");
            }
        };

        objOptions = {
            "element": 'div',
            "classes": [
                "dropdown-menu",
            ],
            "attributes": {
                "aria-labelledby": "workspace_" + objValue.id
            },
        };
        let objDropdown = await createElement(objOptions);

        objOptions = {
            "element": 'a',
            "href": '#',
            "classes": [
                "dropdown-item",
            ]
        };

        let objOpcion1 = await createElement(objOptions);
        objOpcion1.innerHTML = `<i class="fas fa-pencil"></i>&nbsp;Editar`;
        objOpcion1.dataset.nombre = objValue.nombre;
        objOpcion1.dataset.color = objValue.color;
        objOpcion1.onclick = async (element) => {
            document.getElementById('nombre_workspace').parentNode.classList.add("is-filled");
            document.getElementById('nombre_workspace').value = element.target.dataset.nombre;
            document.getElementById('color_workspace').value = element.target.dataset.color;
            document.getElementById('rowVistaPrivada').style.display = "none";
            $('#mdlWorkspace').modal('show');
        };

        let objOpcion2 = await createElement(objOptions);
        objOpcion2.innerHTML = `<i class="far fa-plus"></i>&nbsp;Agregar Tablero`;
        objOpcion2.id = "optAgregarTablero_" + objValue.id
        objOpcion2.dataset.id = objValue.id;
        objOpcion2.onclick = async () => {
            document.getElementById("workspace_padre_id").value = document.getElementById("modificar_workspace_id").value;
            document.getElementById("modificar_workspace_id").value = 0;
            document.getElementById('nombre_workspace').parentNode.classList.remove("is-filled");
            document.getElementById('nombre_workspace').value = "";
            document.getElementById('color_workspace').value = "";
            $('#mdlWorkspace').modal('show');
        };

        let objOpcion3 = await createElement(objOptions);
        objOpcion3.innerHTML = `<i class="fad fa-archive"></i>&nbsp;Deshabilitar`;
        objOpcion3.dataset.id = objValue.id;
        objOpcion3.onclick = async (event) => {
            dialogConfirm(deleteWorkspace, [event.target.dataset.id], '¿Estás seguro de deshabilitar este elemento?', '¡Si lo desea recuperar, favor de comunicarse a IT!')
        }

        objDropdown.append(objOpcion1);
        objDropdown.append(objOpcion2);
        objDropdown.append(objOpcion3);

        objSpan.append(objDropdown);
        objPSummary.append(objSpan);
        objSummary.append(objPSummary);

        objDetails.append(objSummary);

        for (const key in objValue.hijos) {
            let workspace = objValue.hijos[key];
            let objHijo = await drawWorkspacesDetail(workspace, objDetails)
            objDetails.append(objHijo);
        }

        objHeredero.append(objDetails)
        objParent.append(objHeredero)
    } else {

        /*if (document.getElementById('workspace_id').value === '') {
            document.getElementById('workspace_id').value = objValue.id;

            if (objParent.getAttribute('data-details')) objParent.setAttribute('open', 'true');
        }*/

        objHeredero.classList.add("workspace");
        objHeredero.classList.add("workspace-opts");
        objHeredero.id = "workspace_contenedor_" + objValue.id;
        objHeredero.onclick = async (element) => {
            if (element.target.tagName.toLowerCase() === "p") {
                await selectWorkspace(element.target.firstChild);
            } else if (element.target.tagName.toLowerCase() === "div") {
                await selectWorkspace(element.target);
            }
        };

        let objOptions = {
            "element": 'div',
            "classes": ["workspace-texto"],
        };
        let objSpanTexto = await createElement(objOptions);

        let strIcono = `<i class="fas fa-columns"></i>`;
        if (objValue.agrupaciones == 0) {
            strIcono = `<i class="far fa-question-circle"></i>`;
        }
        objSpanTexto.innerHTML = `${strIcono} ${objValue.nombre}`;

        if (document.getElementById('workspace_id').value == objValue.id) {
            objHeredero.classList.add("active");
        }

        objSpanTexto.dataset.id = objValue.id;
        objSpanTexto.dataset.orden = objValue.orden;
        objSpanTexto.dataset.padre = objValue.padre;
        objSpanTexto.style.setProperty("color", objValue.color);
        /*objSpanTexto.onclick = async (element) => {
            await selectWorkspace(element.target);
        };*/

        objHeredero.append(objSpanTexto);

        objOptions = {
            "element": 'span',
            "classes": [
                "workspace-opciones",
            ],
            "attributes": {
                "aria-expanded": false
            },
            styles: {
                visibility: (!boolDirector && objTipo.value === 'departamento') ? 'visible' : 'hidden'
            }
        };
        let objSpan = await createElement(objOptions);

        objSpan.dataset.id = objValue.id;
        objSpan.dataset.orden = objValue.orden;
        objSpan.dataset.padre = objValue.padre;
        objSpan.dataset.toggle = "dropdown";
        objSpan.id = "workspace_" + objValue.id;
        objSpan.style.setProperty("color", objValue.color);
        objSpan.onclick = async (element) => {
            if (element.target.tagName.toLowerCase() === "span") {
                document.getElementById("modificar_workspace_id").value = element.target.dataset.id;
                document.getElementById("workspace_padre_id").value = element.target.dataset.padre;

                $(".opciones-hover").removeClass("opciones-hover");
                $(".workspace-hover").removeClass("workspace-hover");
                element.target.classList.add("opciones-hover");
                element.target.parentNode.classList.add("workspace-hover");
            }
        };

        objOptions = {
            "element": 'div',
            "classes": [
                "dropdown-menu",
            ],
            "attributes": {
                "aria-labelledby": "workspace_" + objValue.id
            },
        };
        let objDropdown = await createElement(objOptions);

        objOptions = {
            "element": 'a',
            "href": '#',
            "classes": [
                "dropdown-item",
            ]
        };

        let objOpcion1 = await createElement(objOptions);
        objOpcion1.innerHTML = `<i class="fas fa-pencil"></i>&nbsp;Editar`;
        objOpcion1.dataset.nombre = objValue.nombre;
        objOpcion1.dataset.color = objValue.color;
        objOpcion1.dataset.vista_privada = objValue.vista_privada;
        objOpcion1.id = "optEditar_" + objValue.id;
        objOpcion1.onclick = async (element) => {
            document.getElementById('nombre_workspace').parentNode.classList.add("is-filled");
            document.getElementById('nombre_workspace').value = element.target.dataset.nombre;
            document.getElementById('color_workspace').value = element.target.dataset.color;

            document.getElementById('rowVistaPrivada').style.display = "block";
            document.getElementById('vista_privada_workspace').checked = element.target.dataset.vista_privada === "true";
            $('#mdlWorkspace').modal('show');
        };

        let objOpcion3 = await createElement(objOptions);
        objOpcion3.innerHTML = `<i class="fad fa-archive"></i>&nbsp;Deshabilitar`;
        objOpcion3.dataset.id = objValue.id;
        objOpcion3.onclick = async (event) => {
            dialogConfirm(deleteWorkspace, [event.target.dataset.id], '¿Estás seguro de deshabilitar este elemento?', '¡Si lo desea recuperar, favor de comunicarse a IT!')
        }

        objDropdown.append(objOpcion1);
        if (objValue.agrupaciones == 0) {
            let objOpcion2 = await createElement(objOptions);
            objOpcion2.id = "optAgregarTablero_" + objValue.id
            objOpcion2.dataset.id = objValue.id
            objOpcion2.innerHTML = `<i class="far fa-plus"></i>&nbsp;Agregar Tablero`;

            objOpcion2.onclick = async () => {
                document.getElementById("workspace_padre_id").value = document.getElementById("modificar_workspace_id").value;
                document.getElementById("modificar_workspace_id").value = 0;
                document.getElementById('nombre_workspace').parentNode.classList.remove("is-filled");
                document.getElementById('nombre_workspace').value = "";
                document.getElementById('color_workspace').value = "";
                $('#mdlWorkspace').modal('show');
            };
            objDropdown.append(objOpcion2);
        }
        objDropdown.append(objOpcion3);

        objSpan.append(objDropdown)
        objHeredero.append(objSpan)

        objParent.append(objHeredero);
    }

    return objHeredero;
}

const drawWorkspaces = async (objWorkspaces) => {
    if (typeof (objWorkspaces) == "undefined") {
        objWorkspaces = [
            {'hijos': [], 'nombre': 'Nuevo Dashboard', 'id': 1, 'carpeta': false},
            {'hijos': [], 'nombre': 'Dashboard IT', 'id': 8, 'carpeta': false},
            {
                'hijos': [
                    {'hijos': [], 'nombre': 'Dashboard 2', 'id': 3, 'carpeta': false},
                    {'hijos': [], 'nombre': 'Dashboard 3', 'id': 4, 'carpeta': false},
                    {
                        'hijos': [
                            {'hijos': [], 'nombre': 'Dashboard 4', 'id': 6, 'carpeta': false},
                            {'hijos': [], 'nombre': 'Dashboard 5', 'id': 7, 'carpeta': false},
                        ], 'nombre': 'Sub Carpeta', 'id': 5, 'carpeta': true
                    },
                ], 'nombre': 'Carpeta 1', 'id': 2, 'carpeta': true
            },
            {
                'hijos': [
                    {'hijos': [], 'nombre': 'Dashboard 2', 'id': 3, 'carpeta': false},
                    {'hijos': [], 'nombre': 'Dashboard 3', 'id': 4, 'carpeta': false},
                    {
                        'hijos': [
                            {'hijos': [], 'nombre': 'Dashboard 4', 'id': 6, 'carpeta': false},
                            {'hijos': [], 'nombre': 'Dashboard 5', 'id': 7, 'carpeta': false},
                        ], 'nombre': 'Sub Carpeta', 'id': 5, 'carpeta': true
                    },
                ], 'nombre': 'Carpeta 1', 'id': 2, 'carpeta': true
            },
            {
                'hijos': [
                    {'hijos': [], 'nombre': 'Dashboard 2', 'id': 3, 'carpeta': false},
                    {'hijos': [], 'nombre': 'Dashboard 3', 'id': 4, 'carpeta': false},
                    {
                        'hijos': [
                            {'hijos': [], 'nombre': 'Dashboard 4', 'id': 6, 'carpeta': false},
                            {'hijos': [], 'nombre': 'Dashboard 5', 'id': 7, 'carpeta': false},
                        ], 'nombre': 'Sub Carpeta', 'id': 5, 'carpeta': true
                    },
                ], 'nombre': 'Carpeta 1', 'id': 2, 'carpeta': true
            },
            {
                'hijos': [
                    {'hijos': [], 'nombre': 'Dashboard 2', 'id': 3, 'carpeta': false},
                    {'hijos': [], 'nombre': 'Dashboard 3', 'id': 4, 'carpeta': false},
                    {
                        'hijos': [
                            {'hijos': [], 'nombre': 'Dashboard 4', 'id': 6, 'carpeta': false},
                            {'hijos': [], 'nombre': 'Dashboard 5', 'id': 7, 'carpeta': false},
                        ], 'nombre': 'Sub Carpeta', 'id': 5, 'carpeta': true
                    },
                ], 'nombre': 'Carpeta 1', 'id': 2, 'carpeta': true
            }
        ];
    }

    const strTipo = document.getElementById('tipo').value;
    const strSelectedDepartamento = (strTipo === 'departamento') ? 'selected' : '';
    const strSelectedAsignacion = (strTipo === 'asignado') ? 'selected' : '';
    const strSelectedPersonal = (strTipo === 'personal') ? 'selected' : '';
    let objFather = document.getElementById("divWorkspaces");
    if (!boolDirector) {
        objFather.innerHTML = `
        <select id="slt_tipo" name="slt_tipo" class="sltTipo" onchange="setTipoWorkspaces();">
            <option value="departamento" ${strSelectedDepartamento}>Mi departamento</option>
            <option value="asignado" ${strSelectedAsignacion}>Mi asignación</option>
            <option value="personal" ${strSelectedPersonal}>Personal</option>
        </select>
    `;
    } else {
        const objSlt = document.getElementById('departamento');
        objFather.innerHTML = '';
        objFather.appendChild(objSlt);
    }

    if (!boolDirector && (objTipo.value === 'departamento' || objTipo.value === 'personal')) {
        let objAgregar = document.createElement("p");
        objAgregar.innerHTML = `<i class="fas fa-plus"></i> Agregar`;
        objAgregar.classList.add("workspace");
        objAgregar.onclick = async () => {
            document.getElementById('nombre_workspace').parentNode.classList.remove("is-filled");
            document.getElementById('nombre_workspace').value = "";
            document.getElementById('color_workspace').value = "";
            document.getElementById("modificar_workspace_id").value = 0;
            document.getElementById("workspace_padre_id").value = 'null';
            document.getElementById('vista_privada_workspace').checked = false;
            $('#mdlWorkspace').modal('show');
        };
        objFather.append(objAgregar);
    }

    if (objTipo.value === 'personal') {
        objEsPersonal.value = 1;
    } else {
        objEsPersonal.value = 0;
    }

    let objSeparador = document.createElement("hr");
    objFather.append(objSeparador);

    for (const key in objWorkspaces) {
        let workspace = objWorkspaces[key];
        let objHijo = await drawWorkspacesDetail(workspace, objFather);
        objFather.append(objHijo);
    }

    return true;
}

const setTipoWorkspaces = async () => {
    window.history.replaceState({}, '', '?');
    intWorkspacesGet = 0;
    intTicketGet = 0;
    objTipo.value = document.getElementById('slt_tipo').value;
    document.getElementById("workspace_id").value = '';
    await getDataInitial();
};

const drawGroups = async (objContent) => {
    if (typeof (objContent) == "undefined") {
        objContent = [
            {
                id: "1", "nombre": "Sistema de Tickets", color: "#f56a65", "tickets":
                    [
                        {
                            id: "1", "nombre": "Modelo Entidad Relacion", color: "#f56a65", "personas": [
                                {id: 1, "nombre": "DA"},
                                {id: 2, "nombre": "JM"},
                            ], "estado": "En Proceso", "comentarios": "3", "etiquetas": [], "hijos": [
                                {
                                    id: "4",
                                    "nombre": "Hijo 1",
                                    color: "#f56a65",
                                    "personas": [
                                        {id: 1, "nombre": "DA"},
                                        {id: 2, "nombre": "JM"},
                                    ],
                                    "estado": "En Proceso",
                                    "comentarios": "3",
                                    "etiquetas": [],
                                    "hijos": [],
                                    "prioridad": "Alta",
                                    "fechas": '2022-06-01 2022-06-05',
                                    "fechas_mostrar": '01/06 - 05/06'
                                },
                                {
                                    id: "5",
                                    "nombre": "Hijo 2",
                                    color: "#f56a65",
                                    "personas": [],
                                    "estado": "Asignado",
                                    "comentarios": "0",
                                    "etiquetas": [],
                                    "hijos": [],
                                    "prioridad": "Baja",
                                    "fechas": '2022-06-01 2022-06-05',
                                    "fechas_mostrar": '01/06 - 05/06'
                                },
                                {
                                    id: "6",
                                    "nombre": "Hijo 3",
                                    color: "#f56a65",
                                    "personas": [],
                                    "estado": "Asignado",
                                    "comentarios": "0",
                                    "etiquetas": [],
                                    "hijos": [],
                                    "prioridad": "",
                                    "fechas": '2022-06-01 2022-06-05',
                                    "fechas_mostrar": '01/06 - 05/06'
                                },
                            ], "prioridad": "Alta", "fechas": '2022-06-01 2022-06-05', "fechas_mostrar": '01/06 - 05/06'
                        },
                        {
                            id: "2",
                            "nombre": "Categoria de Plantillas",
                            color: "#f56a65",
                            "personas": [],
                            "estado": "Asignado",
                            "comentarios": "0",
                            "etiquetas": [],
                            "hijos": [],
                            "prioridad": "Baja",
                            "fechas": '2022-06-01 2022-06-05',
                            "fechas_mostrar": '01/06 - 05/06'
                        },
                        {
                            id: "3",
                            "nombre": "Administracion de Estados",
                            color: "#f56a65",
                            "personas": [],
                            "estado": "Asignado",
                            "comentarios": "0",
                            "etiquetas": [],
                            "hijos": [],
                            "prioridad": "",
                            "fechas": '2022-06-01 2022-06-05',
                            "fechas_mostrar": '01/06 - 05/06'
                        },
                    ]
            },
            {
                id: "2", "nombre": "Grupo 2", color: "#35d5a6", "tickets":
                    []
            },
            {
                id: "3", "nombre": "Grupo 3", color: "#1335a2", "tickets":
                    []
            }
        ]
    }

    intCountGroup = 0;
    let objFather = document.getElementById("divGrupos");
    objFather.innerHTML = "";
    const objFiltros = await drawFiltros();
    await objFather.appendChild(objFiltros);
    await drawMiembrosWorkspace();

    let objOptions = {
        element: 'div',
        classes: ["altura-contenidos"],
        styles: {
            height: "calc(100vh - 256px)",
            padding: "5px",
        },
    };
    let objDivRow = await createElement(objOptions);

    let boolExpandido = false;
    for (const key in objContent) {
        let group = objContent[key];
        let objHijo = await drawGroupTickets(group, boolExpandido);
        objDivRow.append(objHijo);
    }
    objFather.appendChild(objDivRow);

    if (Object.keys(objContent).length === 0) {
        if (document.getElementById("workspace_id").value === '') {
            objFather.innerHTML = `
            <div class="row" style="height: calc(100vh - 140px);">
                <div class="col-12 text-center">
                    <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
                    <h1>Bienvenido al módulo My Day</h1>
                </div>
            </div>
            `;
        }
    }

    await drawButtonAgregarGrupo();
    $('[rel="tooltip"]').tooltip();

    setTimeout(async () => {
        if (intTicketGet !== '' && intTicketGet !== '0') {
            const div = document.querySelector(`div[data-ticket_id="${intTicketGet}"]`);
            if (div) {
                const intPadreSeleccionado = div.getAttribute('data-padre_id');
                if (intPadreSeleccionado !== "" && intPadreSeleccionado !== "0") {
                    await showPadre(intPadreSeleccionado);

                } else {
                    div.parentElement.parentElement.classList.add("show");
                    div.parentElement.parentElement.parentElement.querySelector(`.btnGrupo`).classList.remove('collapsed');
                    div.parentElement.parentElement.parentElement.querySelector(`.btnGrupo`).style.setProperty('border', 'none');
                }
                div.scrollIntoView(true);
                div.classList.add('resaltar');

                setTimeout(() => {
                    div.classList.remove('resaltar');
                }, 2000);

            }
            intWorkspacesGet = 0;
            intTicketGet = 0;
        }
    }, 2000);

};

const showPadre = async (intPadre) => {
    $(`#divHijos_${intPadre}`).show("fast");
    const divPadre = document.querySelector(`div[data-ticket_id="${intPadre}"]`);
    const intPadreSeleccionado = divPadre.getAttribute('data-padre_id');
    if (intPadreSeleccionado !== "" && intPadreSeleccionado !== "0") {
        await showPadre(intPadreSeleccionado);

    } else {
        divPadre.parentElement.parentElement.classList.add("show");
        divPadre.parentElement.parentElement.parentElement.querySelector(`.btnGrupo`).classList.remove('collapsed');
        divPadre.parentElement.parentElement.parentElement.querySelector(`.btnGrupo`).style.setProperty('border', 'none');
    }
};

/**
 ** Función mostrar un diálogo con los usuarios asignados y poder seleccionar nuevo usuario
 */
const showAsignacionWorkspace = async () => {
    $('#mdlMiembrosWorkspace').modal('show');
};

/**
 ** Función mostrar un diálogo con los grupos del tablero
 */
const showModalGrupos = async () => {
    $('#mdlGrupos').modal('show');
    document.getElementById('btnDuplicarGrupos').style.display = 'none';
};

/**
 ** Función que dibuja todos los grupos
 */
const drawAdminGrupos = async () => {
    const objDivCont = document.getElementById('frmAdminGrupos');
    objDivCont.innerHTML = `
        <div class="row" style="border-bottom: solid #ddd 1px; padding: 10px 0;">
            <div class="col-1 text-center">Duplicar</div>
            <div class="col-1 text-center">Orden</div>
            <div class="col-4 text-center">Nombre</div>
            <div class="col-3 text-center">Tablero</div>
            <div class="col-1 text-center">Color</div>
            <div class="col-2 text-center">Deshabilitar</div>
        </div>
    `;

    let strBackground = 'white';
    for (let key in arrAgrupaciones) {
        const arrGrupo = arrAgrupaciones[key];
        strBackground = (strBackground === 'white') ? '#f9f9f9' : 'white';
        let objOptions = {
            element: 'div',
            classes: ["row"],
            id: `divGrupoTablero_${arrGrupo.id}`,
            styles: {
                "border-bottom": 'solid #ddd 1px',
                background: strBackground,
                padding: '10px 0',
            }
        };
        let objRow = await createElement(objOptions);

        objOptions = {
            element: 'div',
            classes: ["col-1", "text-center"],
        };
        let objCol1 = await createElement(objOptions);
        objCol1.innerHTML = `<input type="hidden" name="grupo_id[]" value="${arrGrupo.id}"><input type="hidden" name="deshabilitar_grupo[]" id="deshabilitar_grupo_${arrGrupo.id}" value="0">`;
        objRow.appendChild(objCol1);

        objOptions = {
            element: 'input',
            value: arrGrupo.id,
            type: 'checkbox',
            name: 'duplicar_agrupacion[]',
            id: `duplicar_agrupacion_${arrGrupo.id}`,
            styles: {
                "margin-top": '15px',
            },
            classes: ["form-control"],
        };
        let objInput = await createElement(objOptions);
        objInput.onchange = () => {
            const objButton = document.getElementById('btnDuplicarGrupos');

            if (document.querySelector(`input[name="duplicar_agrupacion[]"]:checked`)) {
                objButton.style.display = '';
            } else {
                objButton.style.display = 'none';
            }

        };

        objCol1.appendChild(objInput);

        objOptions = {
            element: 'div',
            classes: ["col-1"],
        };
        objCol1 = await createElement(objOptions);
        objRow.appendChild(objCol1);

        objOptions = {
            element: 'input',
            value: arrGrupo.orden,
            name: "orden_grupo[]",
            id: `orden_grupo_${arrGrupo.id}`,
            classes: ["form-control"],
        };
        objInput = await createElement(objOptions);

        objCol1.appendChild(objInput);

        objOptions = {
            element: 'div',
            classes: ["col-4"],
        };
        let objCol5 = await createElement(objOptions);
        objRow.appendChild(objCol5);

        objOptions = {
            element: 'input',
            value: arrGrupo.nombre,
            name: "nombre_grupo[]",
            id: `nombre_grupo_${arrGrupo.id}`,
            classes: ["form-control"],
        };
        objInput = await createElement(objOptions);
        objInput.maxLength = 50;

        objCol5.appendChild(objInput);

        objOptions = {
            element: 'div',
            classes: ["col-3"],
        };
        let objCol3 = await createElement(objOptions);
        objRow.appendChild(objCol3);

        objOptions = {
            element: 'select',
            name: "workspace_grupo[]",
            id: `workspace_grupo_${arrGrupo.id}`,
            classes: ["form-control"],
        };
        let objSelect = await createElement(objOptions);
        const intWorkspace = document.getElementById("workspace_id").value;

        for (let key in arrWorkspaces) {
            const arrWorkspace = arrWorkspaces[key];

            if (Object.keys(arrWorkspace.hijos).length === 0) {
                let option = document.createElement('option');
                option.textContent = arrWorkspace.nombre;
                option.value = arrWorkspace.id;
                if (arrWorkspace.id == intWorkspace) {
                    option.selected = true;
                }
                objSelect.append(option);

            } else {

                for (let key2 in arrWorkspace.hijos) {
                    const arrHijos = arrWorkspace.hijos[key2];

                    if (Object.keys(arrHijos.hijos).length === 0) {
                        let option = document.createElement('option');
                        option.textContent = arrHijos.nombre;
                        option.value = arrHijos.id;
                        if (arrHijos.id == intWorkspace) {
                            option.selected = true;
                        }
                        objSelect.append(option);
                    } else {

                        for (let key3 in arrHijos) {
                            const arrNietos = arrHijos.hijos[key3];

                            if (Object.keys(arrNietos.hijos).length === 0) {
                                let option = document.createElement('option');
                                option.textContent = arrNietos.nombre;
                                option.value = arrNietos.id;
                                if (arrNietos.id == intWorkspace) {
                                    option.selected = true;
                                }
                                objSelect.append(option);
                            }
                        }
                    }
                }
            }
        }

        objCol3.appendChild(objSelect);

        objOptions = {
            element: 'div',
            classes: ["col-1"],
        };
        objCol1 = await createElement(objOptions);
        objRow.appendChild(objCol1);

        objOptions = {
            element: 'input',
            type: 'color',
            value: arrGrupo.color,
            name: "color_grupo[]",
            id: `color_grupo_${arrGrupo.id}`,
            classes: ["form-control"],
        };
        objInput = await createElement(objOptions);

        objCol1.appendChild(objInput);

        objOptions = {
            element: 'div',
            classes: ["col-2", "text-center"],
        };
        let objCol2 = await createElement(objOptions);
        objRow.appendChild(objCol2);

        objOptions = {
            element: 'i',
            classes: ["fad", "fa-archive"],
            styles: {
                cursor: 'pointer',
            },
        };
        let objDelete = await createElement(objOptions);
        objDelete.onclick = () => {
            dialogConfirm(() => {
                document.getElementById(`divGrupoTablero_${arrGrupo.id}`).style.display = 'none';
                document.getElementById(`deshabilitar_grupo_${arrGrupo.id}`).value = '1';
            });
        };

        objCol2.appendChild(objDelete);

        objDivCont.appendChild(objRow);
    }
    await showModalGrupos();
};

/**
 ** Función que envía a grabar los grupos
 */
const saveAdminGrupos = async () => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData(document.getElementById('frmAdminGrupos'));

    open_loading();
    await fetch(strUrlUpdateGrupos, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {
            const intWorkspace = document.getElementById("workspace_id").value;

            await getDataInitial();
            if (data.status) {
                alert_nova.showNotification("Grupos actualizados correctamente.", "add_alert", "success");
                await getDataWorkspace(intWorkspace);
            } else {
                alert_nova.showNotification('No se pudieron actualizar los grupos.', "warning", "danger");
                await getDataWorkspace(intWorkspace);
            }
            $('#mdlGrupos').modal('hide');

            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });


};

/**
 ** Función que duplica los grupos
 */
const saveDuplicateGrupos = async () => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData(document.getElementById('frmAdminGrupos'));

    open_loading();
    await fetch(strUrlDuplicateGrupos, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {
            const intWorkspace = document.getElementById("workspace_id").value;

            await getDataInitial();
            if (data.status) {
                alert_nova.showNotification("Grupos duplicados correctamente.", "add_alert", "success");
                await getDataWorkspace(intWorkspace);
                const btnDuplicar = document.getElementById('btnDuplicarGrupos');
                if (btnDuplicar) btnDuplicar.style.display = 'none';
            } else {
                alert_nova.showNotification('No se pudieron duplicar los grupos.', "warning", "danger");
                await getDataWorkspace(intWorkspace);
            }
            $('#mdlGrupos').modal('hide');

            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });


};

/**
 ** Función para dibujar los filtros
 */
const drawFiltros = async () => {
    let objOptions = {
        element: 'div',
        classes: ["row"]
    };
    let objDivRow = await createElement(objOptions);

    let strWorkspace = '';
    let intWorkspace = document.getElementById('workspace_id').value;
    for (let key in arrWorkspaces) {
        const arrWorkspace = arrWorkspaces[key];

        if (arrWorkspace.id == intWorkspace) {
            strWorkspace = arrWorkspace.nombre;
            break;
        } else if (Object.keys(arrWorkspace.hijos).length) {

            for (let key2 in arrWorkspace.hijos) {
                const arrHijo = arrWorkspace.hijos[key2];
                if (arrHijo.id == intWorkspace) {
                    strWorkspace = arrHijo.nombre;
                    break;
                } else if (Object.keys(arrHijo.hijos).length) {

                    for (let key3 in arrHijo.hijos) {
                        const arrNieto = arrHijo.hijos[key3];
                        if (arrNieto.id == intWorkspace) {
                            strWorkspace = arrNieto.nombre;
                            break;
                        }

                    }
                }
            }
        }
    }

    objOptions = {
        element: 'div',
        classes: ["col-8"],
        styles: {
            "padding-left": '20px',
        },
    };
    let objDivCol8 = await createElement(objOptions);

    objDivCol8.innerHTML = `
        <h3 style="font-weight: bold;">${strWorkspace}</h3>
`;
    objDivRow.appendChild(objDivCol8);

    objOptions = {
        element: 'div',
        classes: ["col-4", "text-right"]
    };
    let objDivCol4 = await createElement(objOptions);

    objOptions = {
        element: 'button',
        type: 'button',
        classes: ["btn", "btn-secondary"],
        styles: {
            "margin-left": '20px',
        },
    };

    if (boolIsAdmin && objTipo.value !== "personal") {
        let objButton = await createElement(objOptions);
        objButton.innerHTML = `<span class="material-icons">group_work</span> Grupos`;
        objButton.onclick = async () => {
            await drawAdminGrupos();
        };
        objDivCol4.appendChild(objButton);

        objButton = await createElement(objOptions);
        objButton.innerHTML = `<span class="material-icons">share</span> Invitar`;
        objButton.onclick = () => {
            showAsignacionWorkspace();
        };
        objDivCol4.appendChild(objButton);
    }
    objDivRow.appendChild(objDivCol4);

    let strOptionsPersonas = `<li onclick="filterTickets('asignado', 'all');" class="listado_usuarios">
                        <span class="fa-stack" rel="tooltip" data-original-title="Todos">
                            <i class="fas fa-circle fa-stack-2x" style="color: #a1a1a1;opacity: 0.5;"></i>
                            <i class="fa-stack-1x fa-inverse" style="--fa-inverse:var(--fa-navy);">T</i>
                        </span>
                    </li><li onclick="filterTickets('asignado', 'sin');" class="listado_usuarios">
                        <span class="fa-stack" rel="tooltip" data-original-title="Sin asignación">
                            <i class="fas fa-circle fa-stack-2x" style="color: #a1a1a1;opacity: 0.5;"></i>
                            <i class="fa-stack-1x fa-inverse" style="--fa-inverse:var(--fa-navy);">SA</i>
                        </span>
                    </li>`;

    for (let key in arrUsersFilter) {
        const objPersona = arrUsersFilter[key];

        const strFoto = (objPersona.foto === "") ? "default-avatar.png" : objPersona.foto;
        let arrImg = {
            "foto": strFoto,
            "nombre": objPersona.nombre,
        };
        let strTooltip = `rel="tooltip" data-original-title="${objPersona.nombre}"`;
        const strImg = await drawIconoPersona(arrImg, "#a1a1a1", strTooltip);

        strOptionsPersonas += `<li onclick="filterTickets('asignado', ${objPersona.user_id});" class="listado_usuarios">
                            ${strImg}
                        </li>`;

    }

    let strOptionEstados = `<span class="dropdown-item" onclick="filterTickets('estados', 'all');" style="background: #9c27b0; color: white; cursor: pointer;">Todos</span>`;

    for (let key in arrEstados) {
        const arrEstado = arrEstados[key];
        strOptionEstados += `<span class="dropdown-item" onclick="filterTickets('estados', ${arrEstado.id});" style="background: ${arrEstado.color}; color: white; cursor: pointer;">${arrEstado.text}</span>`;
    }

    let strOptionPrioridades = `<span class="dropdown-item" onclick="filterTickets('estados', 'all');" style="background: #9c27b0; color: white; cursor: pointer;">Todos</span>`;

    for (let key in arrPrioridades) {
        const arrPrioridad = arrPrioridades[key];
        strOptionPrioridades += `<span class="dropdown-item" onclick="filterTickets('prioridades', ${arrPrioridad.id});" style="background: ${arrPrioridad.color}; color: white; cursor: pointer;">${arrPrioridad.text}</span>`;
    }

    let strOptionEtiquetas = `<span class="dropdown-item" onclick="filterTickets('etiquetas', 'all');" style="cursor: pointer;">Todos</span>`;

    for (let key in objEtiquetas) {
        const arrEtiqueta = objEtiquetas[key];
        strOptionEtiquetas += `<span class="dropdown-item" onclick="filterTickets('etiquetas', ${arrEtiqueta.id});" style="cursor: pointer;">${arrEtiqueta.nombre}</span>`;
    }

    objOptions = {
        element: 'div',
        classes: ["col-12"],
        styles: {
            "padding-left": '20px',
            "display": 'flex',
        },
    };
    let objDivCol12 = await createElement(objOptions);

    objDivCol12.innerHTML = `<div id="divFiltroPersonas" style="margin-right: 10px;">
                                <input type="text" class="form-control" placeholder="Buscar" onkeyup="filterTickets('texto', this.value);">
                            </div>
                            <div id="divFiltroPersonas" style="margin-right: 10px;">
                                <div id="btnFilterPersona" class="button btn btn-secondary" onclick="document.getElementById('listPersonas').classList.toggle('filter_options_personas_hidden');">
                                    <i class="material-icons">account_circle</i> Personas
                                </div>
                                <ul id="listPersonas" class="filter_options_personas filter_options_personas_hidden">
                                    ${strOptionsPersonas}
                                </ul>
                            </div>
                            <div>
                                <div class="dropup">
                                    <button type="button" class="dropdown-toggle btn btn-secondary" data-toggle="dropdown" style="background: white;" onclick="document.getElementById('listPersonas').classList.add('filter_options_personas_hidden');">
                                        <i class="material-icons">filter_alt</i> Estados
                                    </button>
                                    <div class="dropdown-menu">
                                        ${strOptionEstados}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div class="dropup">
                                    <button type="button" class="dropdown-toggle btn btn-secondary" data-toggle="dropdown" style="background: white;" onclick="document.getElementById('listPersonas').classList.add('filter_options_personas_hidden');">
                                        <i class="material-icons">filter_alt</i> Prioridades
                                    </button>
                                    <div class="dropdown-menu">
                                        ${strOptionPrioridades}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div class="dropup">
                                    <button type="button" class="dropdown-toggle btn btn-secondary" data-toggle="dropdown" style="background: white;" onclick="document.getElementById('listPersonas').classList.add('filter_options_personas_hidden');">
                                        <i class="material-icons">filter_alt</i> Etiquetas
                                    </button>
                                    <div class="dropdown-menu">
                                        ${strOptionEtiquetas}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <input type="text" class="filterdaterange form-control" value="" placeholder="Fechas" style="margin-left: 10px;"/>
                            </div>
`;
    objDivRow.appendChild(objDivCol12);

    return objDivRow;
};

function dateCheck(from, to, check) {

    let fDate, lDate, cDate;
    fDate = Date.parse(from);
    lDate = Date.parse(to);
    cDate = Date.parse(check);

    return (cDate <= lDate && cDate >= fDate);

}

/**
 ** Función que filtra los tickets
 */
const filterTickets = async (strType, strValue) => {
    const objAgrupaciones = document.querySelectorAll(`div[data-grupo]`);
    const objTicketsHijos = document.querySelectorAll(`.details-hijo`);
    const objI = document.querySelectorAll('.fa-chevron-down, .fa-chevron-right');
    objAgrupaciones.forEach(element => {
        element.style.display = '';
    });
    objTicketsHijos.forEach(element => {
        element.style.display = 'none';
    });

    let arrAgrupacion = [];
    if (strType === 'texto') {
        const objTickets = document.querySelectorAll(`div[data-titulo]`);

        objTickets.forEach(element => {
            const intAgrupacion = element.getAttribute('data-agrupacion');

            if (!arrAgrupacion[intAgrupacion]) {
                arrAgrupacion[intAgrupacion] = 0;
            }

            if (strValue === '') {
                element.style.display = '';
                objI.forEach(element => {
                    element.classList.remove('fa-chevron-down');
                    element.classList.add('fa-chevron-right');
                    if (element.parentElement.classList.contains("active")) element.parentElement.classList.remove("active");
                });
            } else {

                if (element.getAttribute('data-titulo').toLowerCase().includes(strValue.toLowerCase())) {
                    element.style.display = '';
                    showDivPadre(element);
                } else {
                    element.style.display = 'none';
                    arrAgrupacion[intAgrupacion]++;
                }
            }
        });
    } else if (strType === 'asignado') {
        const objTickets = document.querySelectorAll(`div[data-asignados]`);

        objTickets.forEach(element => {
            const intAgrupacion = element.getAttribute('data-agrupacion');

            if (!arrAgrupacion[intAgrupacion]) {
                arrAgrupacion[intAgrupacion] = 0;
            }

            const arrSplit = element.dataset.asignados.split('_');
            if (strValue === 'all') {
                element.style.display = '';
                objI.forEach(element => {
                    element.classList.remove('fa-chevron-down');
                    element.classList.add('fa-chevron-right');
                    if (element.parentElement.classList.contains("active")) element.parentElement.classList.remove("active");
                });
            } else if (strValue === 'sin') {
                if (arrSplit[0] === '') {
                    element.style.display = '';
                    showDivPadre(element);
                } else {
                    element.style.display = 'none';
                    arrAgrupacion[intAgrupacion]++;
                }
            } else {

                if (arrSplit.includes(`${strValue}`)) {
                    element.style.display = '';
                    showDivPadre(element);
                } else {
                    element.style.display = 'none';
                    arrAgrupacion[intAgrupacion]++;
                }
            }
        });
    } else if (strType === 'estados') {
        const objTickets = document.querySelectorAll(`div[data-estado_id]`);

        objTickets.forEach(element => {
            const intAgrupacion = element.getAttribute('data-agrupacion');

            if (!arrAgrupacion[intAgrupacion]) {
                arrAgrupacion[intAgrupacion] = 0;
            }

            if (strValue === 'all') {
                element.style.display = '';
                objI.forEach(element => {
                    element.classList.remove('fa-chevron-down');
                    element.classList.add('fa-chevron-right');
                    if (element.parentElement.classList.contains("active")) element.parentElement.classList.remove("active");
                });
            } else {

                if (element.getAttribute('data-estado_id') == strValue) {
                    element.style.display = '';
                    showDivPadre(element);
                } else {
                    element.style.display = 'none';
                    arrAgrupacion[intAgrupacion]++;
                }
            }
        });

    } else if (strType === 'prioridades') {
        const objTickets = document.querySelectorAll(`div[data-prioridad_id]`);

        objTickets.forEach(element => {
            const intAgrupacion = element.getAttribute('data-agrupacion');

            if (!arrAgrupacion[intAgrupacion]) {
                arrAgrupacion[intAgrupacion] = 0;
            }

            if (strValue === 'all') {
                element.style.display = '';
                objI.forEach(element => {
                    element.classList.remove('fa-chevron-down');
                    element.classList.add('fa-chevron-right');
                    if (element.parentElement.classList.contains("active")) element.parentElement.classList.remove("active");
                });
            } else {

                if (element.getAttribute('data-prioridad_id') == strValue) {
                    element.style.display = '';
                    showDivPadre(element);
                } else {
                    element.style.display = 'none';
                    arrAgrupacion[intAgrupacion]++;
                }
            }
        });

    } else if (strType === 'etiquetas') {
        const objTickets = document.querySelectorAll(`div[data-etiquetas]`);

        objTickets.forEach(element => {
            const intAgrupacion = element.getAttribute('data-agrupacion');

            if (!arrAgrupacion[intAgrupacion]) {
                arrAgrupacion[intAgrupacion] = 0;
            }

            const arrSplit = element.dataset.etiquetas.split('_');
            if (strValue === 'all') {
                element.style.display = '';
                objI.forEach(element => {
                    element.classList.remove('fa-chevron-down');
                    element.classList.add('fa-chevron-right');
                    if (element.parentElement.classList.contains("active")) element.parentElement.classList.remove("active");
                });
            } else {

                if (arrSplit.includes(`${strValue}`)) {
                    element.style.display = '';
                    showDivPadre(element);
                } else {
                    element.style.display = 'none';
                    arrAgrupacion[intAgrupacion]++;
                }
            }
        });
    } else if (strType === 'date') {
        const objTickets = document.querySelectorAll(`div[data-fecha_inicio]`);
        const arrSplit = strValue.split(';');

        objTickets.forEach(element => {
            const strFechaInicio = element.getAttribute('data-fecha_inicio');
            const strFechaFin = element.getAttribute('data-fecha_fin');
            const intAgrupacion = element.getAttribute('data-agrupacion');

            if (!arrAgrupacion[intAgrupacion]) {
                arrAgrupacion[intAgrupacion] = 0;
            }

            if (strValue === 'all') {
                element.style.display = '';
                objI.forEach(element => {
                    element.classList.remove('fa-chevron-down');
                    element.classList.add('fa-chevron-right');
                    if (element.parentElement.classList.contains("active")) element.parentElement.classList.remove("active");
                });
            } else {

                if (strFechaInicio !== "" && dateCheck(arrSplit[0], arrSplit[1], strFechaInicio) ||
                    strFechaFin !== "" && dateCheck(arrSplit[0], arrSplit[1], strFechaFin)) {
                    element.style.display = '';
                    showDivPadre(element);
                } else {
                    element.style.display = 'none';
                    arrAgrupacion[intAgrupacion]++;
                }

            }
        });
    }

    objAgrupaciones.forEach(element => {
        const intAgrupacion = element.getAttribute('data-grupo');
        const intCountTickets = element.getAttribute('data-count_tickets');
        if (arrAgrupacion[intAgrupacion] == intCountTickets ||
            (intCountTickets === '0' && strValue !== '' && strValue !== 'all')) {
            element.style.display = 'none';
        } else {
            element.style.display = '';
        }
    });
};

/**
 ** Función que muestra los padres si el ticket filtrado es un hijo
 */
const showDivPadre = (objDiv) => {
    if (objDiv.parentElement.classList.contains('details-hijo') || objDiv.parentElement.classList.contains('div-hover')) {
        objDiv.parentElement.parentElement.querySelector('.fa-chevron-down, .fa-chevron-right').classList.add('fa-chevron-down');
        objDiv.parentElement.parentElement.querySelector('.fa-chevron-down, .fa-chevron-right').classList.remove('fa-chevron-right');
        if (!objDiv.parentElement.parentElement.querySelector('.fa-chevron-down, .fa-chevron-right').parentElement.classList.contains("active")) objDiv.parentElement.parentElement.querySelector('.fa-chevron-down, .fa-chevron-right').parentElement.classList.add("active");

        objDiv.parentElement.style.display = '';
        showDivPadre(objDiv.parentElement);
    } else if (objDiv.getAttribute('data-padre_id') === "" || objDiv.getAttribute('data-padre_id') === "0") {
        objDiv.parentElement.parentElement.classList.add("show");
        objDiv.parentElement.parentElement.parentElement.querySelector(`.btnGrupo`).classList.remove('collapsed');
        objDiv.parentElement.parentElement.parentElement.querySelector(`.btnGrupo`).style.setProperty('border', 'none');
    }
};

/**
 ** Función que dibuja el botón que agrega nuevos grupos
 */
const drawButtonAgregarGrupo = async () => {

    let objOptions = {
        element: 'div',
        classes: ["row"],
        id: 'divButtonAgregarGrupo',
    };
    let objDivRow = await createElement(objOptions);

    objOptions = {
        element: 'div',
        classes: ["col-12"],
    };
    let objDivCol12 = await createElement(objOptions);
    objDivRow.appendChild(objDivCol12);

    objOptions = {
        element: 'div',
        id: 'btnAgregarGrupo',
        classes: ["btn", "btnAgregarGrupo"],
        styles: {
            visibility: (document.getElementById('workspace_id').value !== '' &&
                (boolIsAdmin || !boolDirector && objTipo.value === 'departamento')) ? 'visible' : 'hidden'
        }
    };
    let objButton = await createElement(objOptions);
    objButton.innerHTML = `<i class="material-icons">add</i> Agregar grupo`;

    objButton.onclick = async () => {
        $('#mdlAgrupacion').modal('show');
    };

    objDivCol12.appendChild(objButton);

    document.getElementById("divGrupos").appendChild(objDivRow);

};

/**
 ** Función que envía la API para grabar el nuevo grupo
 */
const saveAgrupacion = async () => {

    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData(),
        objNombre = document.getElementById('nombre_agrupacion'),
        objColor = document.getElementById('color_agrupacion'),
        strNombre = objNombre.value,
        strColor = objColor.value;

    objForm.append('workspace', document.getElementById('workspace_id').value);
    objForm.append('es_personal', objEsPersonal.value);
    objForm.append('nombre', strNombre);
    objForm.append('color', strColor);

    open_loading();
    await fetch(strUrlCreateAgrupacion, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {

            if (data.status) {

                if (document.querySelectorAll("[id^='accordion_']").length == 0) {
                    let intWorkspaceSelected = document.getElementById("workspace_id").value;
                    document.getElementById('optAgregarTablero_' + intWorkspaceSelected).remove();
                    document.getElementById('workspace_contenedor_' + intWorkspaceSelected).firstChild.firstChild.classList.remove('fa-question-circle');
                    document.getElementById('workspace_contenedor_' + intWorkspaceSelected).firstChild.firstChild.classList.add('fa-columns');
                }

                alert_nova.showNotification("Agrupación creada.", "add_alert", "success");
                const arrGroup = {
                    id: data.agrupacion_id,
                    "nombre": strNombre,
                    color: strColor,
                    "tickets": [],
                };
                let objHijo = await drawGroupTickets(arrGroup, false);
                document.querySelector("#divGrupos .altura-contenidos").insertAdjacentElement('afterbegin', objHijo);
                objNombre.value = '';
                objColor.value = '';
            } else {
                alert_nova.showNotification('No se pudo crear la agrupación.', "warning", "danger");
            }
            $('#mdlAgrupacion').modal('hide');

            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });

};

const drawRowNewTicket = async (intPadre, objParent, strColor, intAgrupacionId) => {
    let objRow = document.createElement("div");
    objRow.classList.add("row");
    objRow.classList.add("div-hover");

    let objCell1 = document.createElement("div");
    objCell1.classList.add("col-sm-12");

    let objRow2 = document.createElement("div");
    objRow2.classList.add("row");
    objRow2.classList.add("row-nuevo");

    let objSeparador = document.createElement("div");
    objSeparador.classList.add("separador");
    objSeparador.style.setProperty('background-color', strColor);
    objSeparador.innerHTML = "&nbsp;";

    let objNombre = document.createElement("div");
    objNombre.classList.add("texto-ticket");

    let objInputGroup = document.createElement("div")
    objInputGroup.classList.add("input-group");

    let objInput = document.createElement("input");
    objInput.classList.add("form-control");
    objInput.classList.add("ticket-nuevo-enter");
    objInput.style.setProperty('padding-left', '20px');
    objInput.dataset.orden = '0';
    objInput.dataset.padre_id = intPadre;
    objInput.dataset.agrupacion_id = intAgrupacionId;
    objInput.dataset.color = strColor;
    objInput.placeholder = "Nuevo Ticket";
    objInput.maxLength = 70;
    if (!(boolIsAdmin || !boolDirector && objTipo.value === 'departamento')) objInput.disabled = true;
    let objRgb = hexToRgb(strColor);
    objInput.style.setProperty("height", "37px");
    objInput.style.setProperty("background-image", `linear-gradient(to top, rgb(${objRgb.r} ${objRgb.g} ${objRgb.b} / 50%) 2px, rgba(${objRgb.r}, ${objRgb.g}, ${objRgb.b}, 0) 2px), linear-gradient(to top, rgb(243 240 240) 1px, rgba(210, 210, 210, 0) 1px)`, "important");

    objInput.id = "txtTicketNuevo_" + intAgrupacionId + "_" + intPadre + "_0"

    let objDivAppend = document.createElement("div");
    objDivAppend.classList.add("input-group-append");

    let objButtonAppend = document.createElement("button");
    objButtonAppend.classList.add("btn");
    objButtonAppend.classList.add("btn-sm");
    objButtonAppend.classList.add("btn-link");
    objButtonAppend.classList.add("btn-block");
    objButtonAppend.classList.add("text-left");
    objButtonAppend.classList.add("text-primary");
    objButtonAppend.classList.add("ticket-nuevo-boton");

    objButtonAppend.dataset.orden = '0';
    objButtonAppend.dataset.padre_id = intPadre;
    objButtonAppend.dataset.agrupacion_id = intAgrupacionId;
    objButtonAppend.dataset.color = strColor;

    objButtonAppend.type = "button";
    objButtonAppend.style.setProperty('color', strColor, 'important');
    objButtonAppend.style.setProperty('border', '1px solid ' + strColor);
    objButtonAppend.style.setProperty('padding-right', 'unset', 'important');
    objButtonAppend.style.setProperty('padding-left', '5px', 'important');

    objButtonAppend.innerHTML = "Agregar";
    objButtonAppend.onclick = (e) => {
        let intAgrupacion = e.target.dataset.agrupacion_id;
        let intPadre = e.target.dataset.padre_id;
        let strColor = e.target.dataset.color;
        createTicket(intAgrupacion, intPadre, strColor);
    };

    objDivAppend.appendChild(objButtonAppend);
    objInputGroup.appendChild(objInput);
    objInputGroup.appendChild(objDivAppend);
    objNombre.appendChild(objInputGroup);

    objRow2.appendChild(objSeparador);
    objRow2.appendChild(objNombre);

    objCell1.appendChild(objRow2);

    objRow.appendChild(objCell1);

    objParent.appendChild(objRow);

    if (intPadre === 0) {

        if (typeof arrGruposTickets[intAgrupacionId] !== 'undefined') {

            let objOptions = {
                element: 'div',
                classes: ["row"],
            };
            objRow = await createElement(objOptions);

            objOptions = {
                element: 'div',
                id: `divPorcentajes_${intAgrupacionId}`,
                classes: ["offset-9", "col-1"],
                styles: {
                    border: '1px solid #ddd',
                    "margin-bottom": '5px',
                    padding: '8px 0',
                },
            };
            let objDivProgreso = await createElement(objOptions);

            const intTotal = arrGruposTickets[intAgrupacionId]['count'];

            for (let key in arrGruposTickets[intAgrupacionId]['estados']) {

                let strColorEstado = '';
                let strNombreEstado = '';
                for (let keyEstado in arrEstados) {
                    const objEstado = arrEstados[keyEstado];
                    if (key == objEstado.id) {
                        strColorEstado = objEstado.color;
                        strNombreEstado = objEstado.text;
                    }
                }
                const intCountEstado = arrGruposTickets[intAgrupacionId]['estados'][key];

                const intPorcentaje = Math.round((intCountEstado / intTotal) * 100);
                let objOptions = {
                    element: 'div',
                    classes: ["porcentajeTickets"],
                    styles: {
                        width: `${(intCountEstado / intTotal) * 100}%`,
                        background: strColorEstado,
                        float: 'left',
                        cursor: 'pointer',
                    },
                    attributes: {
                        rel: 'tooltip',
                        "data-original-title": `${strNombreEstado} ${intCountEstado}/${intTotal} ${intPorcentaje}%`,
                    }
                };
                const objDiv = await createElement(objOptions);
                objDiv.innerHTML = `&nbsp;`;

                objDivProgreso.appendChild(objDiv);
            }

            objRow.appendChild(objDivProgreso);
            objParent.appendChild(objRow);
        }

    }

    return objParent;
}

/**
 ** Función para obtener el usuario seleccionado para invitar al tablero
 */
const setAsignarWorkspace = async () => {
    const objText = document.getElementById('nombre_usuario');
    const strNombre = objText.value;

    const objDataList = document.getElementById('list_autocomplete_usuario');
    const options = objDataList.options;
    for (let i = 0; i < options.length; i++) {
        const option = options[i];

        if (strNombre === option.value) {
            await saveUsuarioWorkspace(option.getAttribute('data-user_id'));
        }
    }

};

/**
 ** Función que graba asignacion al workspace
 */
const drawMiembrosWorkspace = async () => {

    const objDivMiembros = document.getElementById('divMiembros');
    objDivMiembros.innerHTML = `<div class="row detalleMiembrosWorkspace">
                                        <div class="col-12">Solo administradores <i class="material-icons" style="font-size: 15px;">check_box</i> pueden editar todo el tablero.</div>
                                    </div>`;
    for (let key in arrMiembrosWorkspace) {
        const arrUser = arrMiembrosWorkspace[key];
        const strFoto = (arrUser.avatar === "") ? "default-avatar.png" : arrUser.avatar;
        const strChecked = (arrUser.is_admin) ? "checked" : '';
        let arrImg = {
            "foto": strFoto,
            "nombre": arrUser.nombre,
        };
        const strImg = await drawIconoPersona(arrImg, "#a1a1a1");

        objDivMiembros.innerHTML += `<div class="row detalleMiembrosWorkspace">
                                        <div class="col-2">${strImg}</div>
                                        <div class="col-8" style="padding: 5px;">${arrUser.nombre}</div>
                                        <div class="col-1" style="padding: 5px;"><input type="checkbox" name="is_admin[${arrUser.user_id}]" data-user="${arrUser.user_id}" onchange="saveAdminWorkspace(this);" class="checkbox" ${strChecked}></div>
                                        <div class="col-1" style="padding: 5px;"><i class="material-icons" style="cursor:pointer;" onclick="saveUsuarioWorkspace(${arrUser.user_id}, true);">delete</i></div>
                                    </div>`;
    }
};

/**
 ** Función que graba asignacion al workspace
 @param intUser el usuario que se esta grabando
 @param boolEliminar es para decir si se esta quitan asignacion
 */
const saveUsuarioWorkspace = async (intUser, boolEliminar = false) => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();
    objForm.append('workspace_id', document.getElementById("workspace_id").value);
    objForm.append('user_id', intUser);
    if (boolEliminar) objForm.append('bool_eliminar', '1');

    open_loading();
    await fetch(strUrlGrabarMiembrosWorkspace, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {

            if (data.status) {
                arrMiembrosWorkspace = data.miembros;
                await drawMiembrosWorkspace();
                document.getElementById('nombre_usuario').value = '';
                alert_nova.showNotification("Miembros actualizados correctamente.", "add_alert", "success");
            } else {
                alert_nova.showNotification('No se pudo actualizar los miembros del tablero.', "warning", "danger");
            }
            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });

};

/**
 ** Función que graba si es admin en el workspace
 @param objCheck el checkbox con los datos a grabar
 */
const saveAdminWorkspace = async (objCheck) => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();
    objForm.append('workspace_id', document.getElementById("workspace_id").value);
    objForm.append('user_id', objCheck.getAttribute('data-user'));
    if (objCheck.checked) objForm.append('bool_admin', objCheck.checked);

    open_loading();
    await fetch(strUrlGrabarAdminWorkspace, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {

            if (data.status) {
                arrMiembrosWorkspace = data.miembros;
                await drawMiembrosWorkspace();
                alert_nova.showNotification("Miembro actualizado correctamente.", "add_alert", "success");
            } else {
                alert_nova.showNotification('No se pudo actualizar el miembro del tablero.', "warning", "danger");
            }
            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });

};

/**
 ** Función que trae la data inicial para dibujar los workspaces, groups y tickets
 */
const getDataInitial = async () => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();
    objForm.append('tipo', objTipo.value);
    if (boolDirector) {
        objForm.append('departamento', document.getElementById('departamento').value);
    }

    open_loading();
    await fetch(strUrlGetDataInitial, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {

            arrWorkspaces = data.workspaces;
            arrAgrupaciones = data.agrupaciones;
            arrGruposTickets = [];
            arrUsersFilter = data.usuarios_asignados;
            arrMiembrosWorkspace = data.usuarios_workspaces;
            objPersonas = data.users_departamento;

            const objDataList = document.getElementById('list_autocomplete_usuario');
            objDataList.innerHTML = '';
            for (let key in objPersonas) {
                const objUser = objPersonas[key];
                let objOptions = {
                    element: 'option',
                    attributes: {
                        "data-user_id": objUser.user_id,
                        "data-avatar": objUser.avatar,
                    }
                };
                let objOption = await createElement(objOptions);
                objOption.textContent = objUser.nombre;
                objOption.value = objUser.nombre;
                objDataList.append(objOption);
            }

            boolIsAdmin = false;
            objEtiquetas = data.etiquetas;

            arrEstados = [];
            for (const key in data.estados) {
                let estado = data.estados[key];
                arrEstados[key] = [];
                arrEstados[key]["text"] = estado.nombre;
                arrEstados[key]["id"] = estado.id;
                arrEstados[key]["color"] = estado.color;
            }

            arrPrioridades = [];
            for (const key in data.prioridades) {
                let prioridad = data.prioridades[key];
                arrPrioridades[key] = [];
                arrPrioridades[key]["text"] = prioridad.nombre;
                arrPrioridades[key]["id"] = prioridad.id;
                arrPrioridades[key]["color"] = prioridad.color;
            }

            await drawWorkspaces(data.workspaces);
            await searchAdminWorkspace(data.workspaces);
            await drawGroups(data.agrupaciones);
            await drawMiembrosWorkspace();

            if (intWorkspacesGet != '' && intWorkspacesGet != '0') {

                let objSelected = document.getElementById("workspace_contenedor_" + intWorkspacesGet);

                if (objSelected.parentElement) {
                    await openFatherWorkspace(objSelected);
                }

                if (objSelected.tagName.toLowerCase() === "p") {
                    await selectWorkspace(objSelected.firstChild);
                } else if (objSelected.tagName.toLowerCase() === "div") {
                    await selectWorkspace(objSelected);
                }
                window.history.replaceState({}, '', '?');
            }
            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });
};

const getTicketsHijos = (intAgrupacion, intPadre, strColor) => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();
    objForm.append('agrupacion', intAgrupacion);
    objForm.append('padre_id', intPadre);
    objForm.append('tipo', objTipo.value);

    open_loading();
    fetch(strUrlGetTickets, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {
            if (intPadre == 0) {
                let objBody = document.getElementById(`collapseBody_${intAgrupacion}`);
                objBody.innerHTML = "";
                objBody = await drawHeaders('Título', objBody, strColor, true);
                objBody = drawTickets(data, objBody, intPadre, strColor, intAgrupacion);

                objBody.then((element) => {
                    objBody = drawRowNewTicket(intPadre, element, strColor, intAgrupacion);
                });
            } else {
                const objCount = document.getElementById(`countHijos_${intPadre}`);
                if (objCount) {
                    objCount.classList.remove('spanCountHidden');
                    const intHijos = parseInt(objCount.dataset.hijos) + 1;
                    objCount.dataset.hijos = `${intHijos}`;
                    objCount.innerText = `${intHijos}`;
                }
                $(`#boton_hijos_${intPadre}`).find(".fa-inverse").html(`${Object.keys(data).length}`);
                document.getElementById(`divHijos_${intPadre}`).innerHTML = "";
                let objCell6 = document.getElementById(`divHijos_${intPadre}`);
                objCell6.innerHTML = "";

                objCell6 = drawHeaders('Título', objCell6, strColor, true);

                objCell6.then((element) => {
                    objCell6 = drawTickets(data, element, intPadre, strColor, intAgrupacion);

                    objCell6.then((element) => {
                        objCell6 = drawRowNewTicket(intPadre, element, strColor, intAgrupacion);
                    });
                });

                $(`#divHijos_${intPadre}`).show("fast");
            }

            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });
};

/**
 ** Función para crear ticket
 @param intAgrupacion id de la agrupacion donde ira el ticket
 @param intPadre id del ticket si fuera un hijo de ticket
 @param strColor color del ticket
 */
const createTicket = (intAgrupacion, intPadre, strColor) => {
    let intMaxOrden = 0;
    $("[data-id_padre='" + intPadre + "'][data-id_agrupacion='" + intAgrupacion + "']").each(function () {
        let intOrden = $(this).data("orden");
        if (intOrden > intMaxOrden) {
            intMaxOrden = intOrden;
        }
    });
    intMaxOrden++;

    let strTexto = document.getElementById(`txtTicketNuevo_${intAgrupacion}_${intPadre}_0`).value;

    if (strTexto.trim() === "") {
        alert_nova.showNotification('El título debe de contener un texto.', "warning", "danger");
    } else {
        const csrftoken = getCookie('csrftoken'),
            objForm = new FormData();
        objForm.append('titulo', strTexto);
        objForm.append('agrupacion', intAgrupacion);
        if (intPadre > 0) {
            objForm.append('ticket_padre', intPadre);
        }
        objForm.append('orden', intMaxOrden);
        objForm.append('es_personal', objEsPersonal.value);

        open_loading();
        fetch(strUrlCreateTicket, {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            body: objForm
        })
            .then(response => response.json())
            .then(() => {
                close_loading();
                getTicketsHijos(intAgrupacion, intPadre, strColor);
            })
            .catch((error) => {
                console.error(error);
                alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
                close_loading();
            });
    }
};

const showAsignarPersonas = async (intId) => {
    let strContent = `<div class="row"><div class="col-sm-12"><select class="select2" multiple style="width: 100%;" id="sltAsignadas" name="sltAsignadas">`;
    strContent += `<option disabled> Asigne a las personas</option>`;

    if (objEsPersonal.value == "1") {
        for (const key in objPersonas) {
            let persona = objPersonas[key];
            if (intUser == persona.user_id) {
                strContent += `<option value="${persona.user_id}">${persona.nombre}</option>`;
            }
        }
    } else {
        for (const key in objPersonas) {
            let persona = objPersonas[key];
            strContent += `<option value="${persona.user_id}">${persona.nombre}</option>`;
        }
    }

    strContent += `</select><input type="hidden" name="hdnTicketAsignacion" id="hdnTicketAsignacion" value="${intId}"></div></div>`;

    $("#mdlPersonas").find(".modal-body").html(strContent);

    let objSelector = $(".select2");

    if (objSelector.data('select2')) {
        objSelector.select2('destroy');
    }

    objSelector.select2().on("select2:unselecting", function () {
        $(this).on("select2:opening.cancelOpen", function (evt) {
            evt.preventDefault();

            $(this).off("select2:opening.cancelOpen");
        });
    });

    let arrSelected = [];
    if (typeof (arrTicketsPersonas[intId]) != 'undefined') {
        for (const key in arrTicketsPersonas[intId]["personas"]) {
            arrSelected.push(key)
        }
        objSelector.val(arrSelected).trigger("change");
    }

    $('#mdlPersonas').modal('show');
};

const saveAsignacionPersonas = async () => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();

    let intTicketId = document.getElementById("hdnTicketAsignacion").value;
    objForm.append('ticket_id', intTicketId);
    objForm.append('personas', $("#sltAsignadas").val());

    open_loading();
    fetch(strUrlSaveAsignacion, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            if (data.status) {

                let strAsignados = '';
                for (let key in data.asignaciones) {
                    const arrPersona = data.asignaciones[key];
                    strAsignados += (strAsignados === '') ? arrPersona.id : `_${arrPersona.id}`;
                }

                const divTicket = document.querySelector(`div[data-ticket_id="${intTicketId}"]`);
                if (divTicket) divTicket.dataset.asignados = strAsignados;

                let objHtml = drawCeldaPersonasAsignadas(intTicketId, data.asignaciones, data.color, true);

                objHtml.then((element) => {
                    $(`.select-personas[data-id='${intTicketId}']`).html(element)
                });

                $('#mdlPersonas').modal('hide');

                alert_nova.showNotification("Asignación actualizada correctamente.", "add_alert", "success");
            } else {
                alert_nova.showNotification('Asignación no actualizada.', "warning", "danger");
            }
        })
        .catch((error) => {
            console.error(error);
            $('#mdlPersonas').modal('hide');
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        })
};

const showAsignarEtiquetas = async (intId) => {
    let strContent = `<div class="row"><div class="col-sm-12"><select class="select2eti" multiple style="width: 100%;" id="sltEtiquetas" name="sltEtiquetas">`;
    strContent += `<option disabled> Seleccione las etiquetas</option>`;

    for (const key in objEtiquetas) {
        let etiqueta = objEtiquetas[key];
        strContent += `<option value="${etiqueta.id}">${etiqueta.nombre}</option>`;
    }

    strContent += `</select><input type="hidden" name="hdnTicketEtiqueta" id="hdnTicketEtiqueta" value="${intId}"></div></div>`;

    $("#mdlEtiquetas").find(".modal-body").html(strContent);

    let objSelector = $(".select2eti");

    if (objSelector.data('select2')) {
        objSelector.select2('destroy');
    }

    objSelector.select2().on("select2:unselecting", function () {
        $(this).on("select2:opening.cancelOpen", function (evt) {
            evt.preventDefault();

            $(this).off("select2:opening.cancelOpen");
        });
    });

    let arrSelected = [];
    if (typeof (arrTicketsEtiquetas[intId]) != 'undefined') {
        for (const key in arrTicketsEtiquetas[intId]["etiquetas"]) {
            arrSelected.push(key)
        }
        objSelector.val(arrSelected).trigger("change");
    }

    $('#mdlEtiquetas').modal('show');
};

const saveEtiquetas = async () => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();

    let intTicketId = document.getElementById("hdnTicketEtiqueta").value;
    objForm.append('ticket_id', intTicketId);
    objForm.append('etiquetas', $("#sltEtiquetas").val());

    open_loading();
    fetch(strUrlSaveEtiquetas, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            if (data.status) {
                let strEtiquetas = '';
                for (let key in data.etiquetas) {
                    const arrEtiqueta = data.etiquetas[key];
                    strEtiquetas += (strEtiquetas === '') ? arrEtiqueta.id : `_${arrEtiqueta.id}`;
                }

                const divTicket = document.querySelector(`div[data-ticket_id="${intTicketId}"]`);
                if (divTicket) divTicket.dataset.etiquetas = strEtiquetas;

                let objHtml = drawCeldaEtiquetasAsignadas(intTicketId, data.etiquetas, data.color, true);

                objHtml.then((element) => {
                    $(`.select-etiquetas[data-id='${intTicketId}']`).html(element)
                });

                $('#mdlEtiquetas').modal('hide');

                alert_nova.showNotification("Etiquetas actualizadas correctamente.", "add_alert", "success");
            } else {
                alert_nova.showNotification('Etiqueta no actualizada.', "warning", "danger");
            }
        })
        .catch((error) => {
            console.error(error);
            $('#mdlEtiquetas').modal('hide');
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        })
};

const showCambiarEstado = async (intId, intSelected) => {
    let strContent = `<div class="row"><div class="col-sm-12"><select class="select2est" style="width: 100%;" id="sltEstado" name="sltEstado">`;
    strContent += `<option disabled> Seleccione las etiquetas</option>`;
    strContent += `</select><input type="hidden" name="hdnTicketEstado" id="hdnTicketEstado" value="${intId}"></div></div>`;

    const mdlEstados = $("#mdlEstados");
    mdlEstados.find(".modal-body").html(strContent);

    let objSelector = $(".select2est");

    if (objSelector.data('select2')) {
        objSelector.select2('destroy');
    }

    objSelector.select2({
        data: arrEstados,
        templateResult: drawOptionS2,
        templateSelection: drawOptionSelectedS2,
        dropdownParent: mdlEstados
    });

    if (typeof (intSelected) != 'undefined') {
        objSelector.val(intSelected).trigger("change");
    }

    mdlEstados.modal('show');
};

const saveEstado = async () => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();

    let intTicketId = document.getElementById("hdnTicketEstado").value;
    let intEstado = document.getElementById("sltEstado").value;
    objForm.append('ticket_id', intTicketId);
    objForm.append('estado_id', intEstado);

    intEstado = parseInt(intEstado);

    open_loading();
    fetch(strUrlSaveEstado, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            if (data.status) {
                const divTicket = document.querySelector(`div[data-ticket_id="${intTicketId}"]`);
                if (divTicket) {
                    const intEstadoAnterior = parseInt(divTicket.dataset.estado_id);
                    const intAgrupacionId = parseInt(divTicket.dataset.agrupacion);
                    if (typeof arrGruposTickets[intAgrupacionId] !== 'undefined') {

                        if (typeof arrGruposTickets[intAgrupacionId]["estados"][intEstadoAnterior] !== 'undefined') {
                            arrGruposTickets[intAgrupacionId]["estados"][intEstadoAnterior]--;
                        }

                        if (typeof arrGruposTickets[intAgrupacionId]["estados"][intEstado] === 'undefined') {
                            arrGruposTickets[intAgrupacionId]["estados"][intEstado] = 1;
                        } else {
                            arrGruposTickets[intAgrupacionId]["estados"][intEstado]++;
                        }

                        const objDivProgreso = document.getElementById(`divPorcentajes_${intAgrupacionId}`);
                        objDivProgreso.innerHTML = '';
                        const intTotal = arrGruposTickets[intAgrupacionId]['count'];

                        for (let key in arrGruposTickets[intAgrupacionId]['estados']) {
                            const intCountEstado = arrGruposTickets[intAgrupacionId]['estados'][key];
                            if (intCountEstado < 1) continue;

                            let strColorEstado = '';
                            let strNombreEstado = '';
                            for (let keyEstado in arrEstados) {
                                const objEstado = arrEstados[keyEstado];
                                if (key == objEstado.id) {
                                    strColorEstado = objEstado.color;
                                    strNombreEstado = objEstado.text;
                                }
                            }

                            const intPorcentaje = Math.round((intCountEstado / intTotal) * 100);
                            let objOptions = {
                                element: 'div',
                                classes: ["porcentajeTickets"],
                                styles: {
                                    width: `${(intCountEstado / intTotal) * 100}%`,
                                    background: strColorEstado,
                                    float: 'left',
                                    cursor: 'pointer',
                                },
                                attributes: {
                                    rel: 'tooltip',
                                    "data-original-title": `${strNombreEstado} ${intCountEstado}/${intTotal} ${intPorcentaje}%`,
                                }
                            };
                            const objDiv = createElement(objOptions);
                            objDiv.then(element => {
                                element.innerHTML = `&nbsp;`;
                                objDivProgreso.appendChild(element);
                            });

                        }
                    }

                    divTicket.dataset.estado_id = intEstado;
                }

                for (const key in arrEstados) {
                    let estado = arrEstados[key];
                    if (estado.id === intEstado) {
                        let objCell = $(`.select-estado[data-id='${intTicketId}']`);
                        objCell.data("estado", estado.id);
                        objCell.css("background-color", estado.color);
                        objCell.html(estado.text);
                    }
                }

                $('#mdlEstados').modal('hide');
                $('[rel="tooltip"]').tooltip();

                alert_nova.showNotification("Estado actualizado correctamente.", "add_alert", "success");
            } else {
                alert_nova.showNotification('Estado no actualizado.', "warning", "danger");
            }
        })
        .catch((error) => {
            console.error(error);
            $('#mdlEstados').modal('hide');
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        })
};

const showCambiarPrioridad = async (intId, intSelected) => {
    let strContent = `<div class="row"><div class="col-sm-12"><select class="select2pr" style="width: 100%;" id="sltPrioridad" name="sltPrioridad">`;
    strContent += `<option disabled> Seleccione las etiquetas</option>`;
    strContent += `</select><input type="hidden" name="hdnTicketPrioridad" id="hdnTicketPrioridad" value="${intId}"></div></div>`;

    const mdlPrioridades = $("#mdlPrioridades");
    mdlPrioridades.find(".modal-body").html(strContent);

    let objSelector = $(".select2pr");

    if (objSelector.data('select2')) {
        objSelector.select2('destroy');
    }

    objSelector.select2({
        data: arrPrioridades,
        templateResult: drawOptionS2,
        templateSelection: drawOptionSelectedS2,
        dropdownParent: mdlPrioridades
    });

    if (typeof (intSelected) != 'undefined') {
        objSelector.val(intSelected).trigger("change");
    }

    mdlPrioridades.modal('show');
};

const savePrioridad = async () => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();

    let intTicketId = document.getElementById("hdnTicketPrioridad").value;
    let intPrioridad = document.getElementById("sltPrioridad").value;
    objForm.append('ticket_id', intTicketId);
    objForm.append('prioridad_id', intPrioridad);

    intPrioridad = parseInt(intPrioridad);

    open_loading();
    fetch(strUrlSavePrioridad, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            if (data.status) {
                for (const key in arrPrioridades) {
                    let prioridad = arrPrioridades[key];
                    if (prioridad.id === intPrioridad) {
                        const divTicket = document.querySelector(`div[data-ticket_id="${intTicketId}"]`);
                        if (divTicket) divTicket.dataset.prioridad_id = intPrioridad;

                        let objCell = $(`.select-prioridad[data-id='${intTicketId}']`);
                        objCell.data("prioridad", prioridad.id);
                        objCell.css("background-color", prioridad.color);
                        objCell.html(prioridad.text);
                    }
                }

                $('#mdlPrioridades').modal('hide');

                alert_nova.showNotification("Prioridad actualizada correctamente.", "add_alert", "success");
            } else {
                alert_nova.showNotification('Prioridad no grabada.', "warning", "danger");
            }
        })
        .catch((error) => {
            console.error(error);
            $('#mdlPrioridades').modal('hide');
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        })
};

const drawOptionS2 = (state) => {
    if (!state.color) {
        return state.text;
    }

    return $(
        '<div style="background-color:' + state.color + ';" class="opcion-color">' + state.text + '</div>'
    );
};

const drawOptionSelectedS2 = (state) => {
    if (!state.color) {
        return state.text;
    }

    return $(
        '<div style="background-color:' + state.color + ';" class="opcion-seleccion">' + state.text + '</div>'
    );
};

const saveFechas = async (intId, strFechaInicio, strFechaFin) => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();

    objForm.append('ticket_id', intId);
    objForm.append('fecha_inicio', strFechaInicio);
    objForm.append('fecha_fin', strFechaFin);

    open_loading();
    fetch(strUrlSaveFechas, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();
            if (data.status) {
                alert_nova.showNotification("Fechas actualizadas correctamente.", "add_alert", "success");
            } else {
                alert_nova.showNotification('Fecha no grabada.', "warning", "danger");
            }
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        })
};

const selectWorkspace = async (objSelected) => {
    $(".workspace.active").removeClass("active");
    $(objSelected).parent().addClass("active");

    let intWorkspace = objSelected.dataset.id;

    boolIsAdmin = false;
    document.getElementById("workspace_id").value = intWorkspace;
    await searchAdminWorkspace(arrWorkspaces);
    await getDataWorkspace(intWorkspace);
};

const searchAdminWorkspace = async (arrWorks) => {
    const intWorkspace = document.getElementById("workspace_id").value;
    for (let key in arrWorks) {
        const arrWorkspace = arrWorks[key];
        if (!boolDirector && intWorkspace == arrWorkspace.id && (arrWorkspace?.is_admin ||
            typeof arrWorkspace.is_admin === 'undefined')) {
            boolIsAdmin = true;
            break;
        }

        if (Object.keys(arrWorkspace.hijos).length) {
            await searchAdminWorkspace(arrWorkspace.hijos);
        }
    }
};

const getDataWorkspace = async (intWorkspace) => {
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();
    objForm.append('workspace', intWorkspace);
    objForm.append('tipo', document.getElementById('tipo').value);

    open_loading();
    await fetch(strUrlGetDataWorkspace, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then((data) => {

            drawGroups(data.agrupaciones);
            arrAgrupaciones = data.agrupaciones;
            arrGruposTickets = [];
            arrUsersFilter = data.usuarios_asignados;
            arrMiembrosWorkspace = data.miembros;

            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });
};

const openFatherWorkspace = async (objChildren) => {

    if (objChildren.parentElement.tagName.toLowerCase() === "details") {
        objChildren.parentElement.open = true;
    }

    if (objChildren.parentElement.tagName.toLowerCase() !== "div") {
        await openFatherWorkspace(objChildren.parentElement);
    }

    return true;
};

const saveWorkspace = async () => {

    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();

    let objNombre = document.getElementById('nombre_workspace'),
        objColor = document.getElementById('color_workspace'),
        objWorkspaceId = document.getElementById("modificar_workspace_id"),
        objVistaPrivada = document.getElementById("vista_privada_workspace"),
        objPadre = document.getElementById("workspace_padre_id");

    let strNombre = objNombre.value,
        strColor = objColor.value,
        boolEsPersonal = objEsPersonal.value,
        intPadre = objPadre.value,
        intWorkspaceId = objWorkspaceId.value,
        boolVistaPrivada = objVistaPrivada.checked,
        intOrden = 0;


    $(`[data-padre="${intPadre}"]`).each(function () {
        if (intOrden < parseInt($(this).data("orden"))) {
            intOrden = parseInt($(this).data("orden"));
        }
    });

    intOrden++;

    objForm.append('workspace', intWorkspaceId);
    objForm.append('nombre', strNombre);
    objForm.append('color', strColor);
    objForm.append('es_personal', boolEsPersonal);
    objForm.append('orden', intOrden);
    objForm.append('padre', intPadre);
    objForm.append('vista_privada', boolVistaPrivada);
    objForm.append('tipo', document.getElementById('tipo').value);

    open_loading();
    await fetch(strUrlCreateWorkspace, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {

            if (data.status) {
                let intWorkspaceSelected = document.getElementById("workspace_id").value;
                arrWorkspaces = data.workspaces;
                arrAgrupaciones = [];
                arrGruposTickets = [];
                alert_nova.showNotification("Workspace creado exitosamente.", "add_alert", "success");
                await drawWorkspaces(data.workspaces, false);

                document.getElementById("workspace_id").value = intWorkspaceSelected;

                let objSelected = document.getElementById("workspace_contenedor_" + data.int_workspace);
                await openFatherWorkspace(objSelected);

                if (intWorkspaceId == 0) {
                    await selectWorkspace(objSelected.firstChild);
                }

                objNombre.value = '';
                objColor.value = '';
            } else {
                alert_nova.showNotification('No se pudo crear el workspace.', "warning", "danger");
            }
            $('#mdlWorkspace').modal('hide');

            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });

};

const deleteWorkspace = async (intWorkspaceId) => {

    let objEsPersonal = document.getElementById('es_personal');

    let boolEsPersonal = objEsPersonal.value;

    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();
    objForm.append('workspace', intWorkspaceId);
    objForm.append('es_personal', boolEsPersonal);

    open_loading();
    await fetch(strUrlDeshabilitarWorkspace, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm
    })
        .then(response => response.json())
        .then(async (data) => {

            if (data.status) {

                alert_nova.showNotification("Elemento deshabilitado exitosamente.", "add_alert", "success");
                arrWorkspaces = data.workspaces;
                arrAgrupaciones = [];
                arrGruposTickets = [];
                await drawWorkspaces(data.workspaces);
                let intWorkspaceSelect = document.getElementById('workspace_id').value;

                if (intWorkspaceId == intWorkspaceSelect || intWorkspaceSelect == '') {
                    document.getElementById("workspace_id").value = '';
                    await setTipoWorkspaces();
                } else {
                    let objSelected = document.getElementById("workspace_contenedor_" + intWorkspaceSelect);

                    if (intWorkspaceId !== 0) {
                        if (objSelected.tagName.toLowerCase() === "p") {
                            await selectWorkspace(objSelected.firstChild);
                        } else if (objSelected.tagName.toLowerCase() === "div") {
                            await selectWorkspace(objSelected);
                        }
                    }
                }
            } else {
                alert_nova.showNotification('No se pudo deshabilitar el elemento.', "warning", "danger");
            }

            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            close_loading();
        });

};

$(document).on("hidden.bs.collapse", ".collapse", function () {
    let strColor = this.parentElement.querySelector('.btnGrupo').dataset.color;
    this.parentElement.querySelector('.btnGrupo').style.setProperty('border', `${strColor} solid 1px`);
});

$(document).on("shown.bs.collapse", ".collapse", function () {
    this.parentElement.querySelector('.btnGrupo').style.setProperty('border', 'none');
});

$(document).on("keypress", ".ticket-nuevo-enter", function (e) {
    if (e.keyCode === 13) {
        e.preventDefault();
        let intAgrupacion = $(this).data("agrupacion_id");
        let intPadre = $(this).data("padre_id");
        let strColor = $(this).data("color");
        createTicket(intAgrupacion, intPadre, strColor);
    }
});

document.getElementById('btnGuardarAsignacion').addEventListener('click', saveAsignacionPersonas);
document.getElementById('btnGuardarEtiquetas').addEventListener('click', saveEtiquetas);
document.getElementById('btnGuardarEstado').addEventListener('click', saveEstado);
document.getElementById('btnGuardarPrioridad').addEventListener('click', savePrioridad);

$(document).on("focus", ".daterange", function () {
    $(this).daterangepicker({
        "locale": {
            "format": "DD/MM/YYYY H:mm",
            "separator": " - ",
            "applyLabel": "Guardar",
            "cancelLabel": "Cancelar",
            "fromLabel": "Desde",
            "toLabel": "A",
            "customRangeLabel": "Personalizada",
            "weekLabel": "S",
            "daysOfWeek": [
                "Do",
                "Lu",
                "Ma",
                "Mi",
                "Ju",
                "Vi",
                "Sa"
            ],
            "monthNames": monthNamesSpanish,
            "firstDay": 1
        },
        opens: 'left',
        timePicker: true,
        timePicker24Hour: true,
    }, function (start, end) {
        let intId = $(this.element).parent().data("id");
        let strFechaInicio = start.format('YYYY-MM-DD HH:mm');
        let strFechaFin = end.format('YYYY-MM-DD HH:mm');
        saveFechas(intId, strFechaInicio, strFechaFin)
    }).on("hide.daterangepicker", function () {
        $(this).data('daterangepicker').remove();
        $(this).unbind('.daterangepicker');
    });
});

$(document).on("focus", ".filterdaterange", function () {
    $(this).daterangepicker({
        "locale": {
            "format": "DD/MM/YYYY H:mm",
            "separator": " - ",
            "applyLabel": "Guardar",
            "cancelLabel": "Cancelar",
            "fromLabel": "Desde",
            "toLabel": "A",
            "customRangeLabel": "Personalizada",
            "weekLabel": "S",
            "daysOfWeek": [
                "Do",
                "Lu",
                "Ma",
                "Mi",
                "Ju",
                "Vi",
                "Sa"
            ],
            "monthNames": monthNamesSpanish,
            "firstDay": 1
        },
        opens: 'left',
        timePicker: true,
        timePicker24Hour: true,
    }, function (start, end) {
        let strFechaInicio = start.format('YYYY-MM-DD HH:mm');
        let strFechaFin = end.format('YYYY-MM-DD HH:mm');

        filterTickets('date', `${strFechaInicio};${strFechaFin}`);

    }).on("hide.daterangepicker", function () {
        $(this).data('daterangepicker').remove();
        $(this).unbind('.daterangepicker');
    });
});

$(document).ready(function () {
    $.fn.modal.Constructor.prototype.enforceFocus = function () {
    };
});

$(window).click(function () {
    $(".opciones-hover").removeClass("opciones-hover");
    $(".workspace-hover").removeClass("workspace-hover");
});

if (!boolDirector) {
    getDataInitial();
}

// setInterval(sendNotificacion, 60000);
