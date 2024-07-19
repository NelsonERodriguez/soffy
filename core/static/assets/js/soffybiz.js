let intGlobalPercentageLoading = 0,
    objGlobalCustomStyles = {
        'background-menu': 1,
        'color-option-menu': 1,
        'collapse': true,
        'show-image': true,
        'image': 1,
    },
    csrfTokenFP = '';
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

document.addEventListener("DOMContentLoaded", () => {
    const csrftoken = getCookie('csrftoken');
    let strUrlPrev = window.location.href,
        strUrl = strUrlPrev.replace(window.location.pathname, '/core/notification/');
    // strUrlGetHoras = strUrlPrev.replace(window.location.pathname, '/core/get_horas_foxcore/');
    fetch(strUrl, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken}
    })
        .then(response => response.json())
        .then((data) => {
            if (data.notificacion) {
                alert_nova.showNotification(data.message, data.icon, data.color);
            }
        })
        .catch((error) => {
            console.error(error);
        });

    // if (window.location.hostname.includes('coglosa.com') ||
    //     window.location.hostname.includes('nova')) {
    //
    //     fetch(strUrlGetHoras, {
    //         method: 'POST',
    //         headers: {'X-CSRFToken': csrftoken}
    //     })
    //         .catch((error) => {
    //             console.error(error);
    //         });
    // }

    const textBoxBuscar = document.getElementById('buscador_principal');

    if (textBoxBuscar) {
        let controller,
            signal,
            strUrl = window.location.href;
        const csrftoken = getCookie('csrftoken'),
            strUrlBuscador = strUrl.replace(window.location.pathname, '/core/buscador');

        textBoxBuscar.addEventListener('blur', removeAutoComplete);

        textBoxBuscar.addEventListener('keyup', (event) => {

            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') return false;

            if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
                const objListado = document.querySelectorAll('#listado_buscador ul');
                const objUlActivo = document.querySelector('#listado_buscador ul[data-activo="1"]');

                if (event.key === 'Enter' && objUlActivo) {
                    objUlActivo.click();
                }

                if (event.key === 'Enter' && objListado.length === 1) {
                    objListado[0].click();
                }

                let intRow = 0;
                let boolEncontrado = false;
                objListado.forEach(element => {
                    if (!objUlActivo && !boolEncontrado) {
                        if (event.key === 'ArrowDown') {
                            element.setAttribute('data-activo', '1');
                            element.classList.add('activeBuscador');
                        } else if (event.key === 'ArrowUp') {
                            // objListado[objListado.length - 1].scrollIntoView(true);
                            objListado[objListado.length - 1].classList.add('activeBuscador');
                            objListado[objListado.length - 1].setAttribute('data-activo', '1');
                        }
                        boolEncontrado = true;
                    }

                    if (!boolEncontrado) {
                        if (objUlActivo === element) {
                            objUlActivo.removeAttribute('data-activo');
                            objUlActivo.classList.remove('activeBuscador');

                            if (event.key === 'ArrowDown') {
                                if (typeof objListado[intRow + 1] !== "undefined") {
                                    // objListado[intRow + 1].scrollIntoView(true);
                                    objListado[intRow + 1].classList.add('activeBuscador');
                                    objListado[intRow + 1].setAttribute('data-activo', '1');
                                } else {
                                    // objListado[0].scrollIntoView(true);
                                    objListado[0].classList.add('activeBuscador');
                                    objListado[0].setAttribute('data-activo', '1');
                                }
                            } else if (event.key === 'ArrowUp') {
                                if (typeof objListado[intRow - 1] !== "undefined") {
                                    // objListado[intRow - 1].scrollIntoView(true);
                                    objListado[intRow - 1].classList.add('activeBuscador');
                                    objListado[intRow - 1].setAttribute('data-activo', '1');
                                } else {
                                    // objListado[objListado.length - 1].scrollIntoView(true);
                                    objListado[objListado.length - 1].classList.add('activeBuscador');
                                    objListado[objListado.length - 1].setAttribute('data-activo', '1');
                                }
                            }
                            boolEncontrado = true;
                        }
                    }
                    intRow++;
                });

                return false;
            }

            $('#listado_buscador').remove();
            if (event.key === 'Escape') {
                event.currentTarget.value = '';
                return false;
            }
            if (controller !== undefined) {
                controller.abort();
            }

            if ("AbortController" in window) {
                controller = new AbortController;
                signal = controller.signal;
            }

            const strBusqueda = event.currentTarget.value.trim();

            if (strBusqueda !== '') {

                const form = new FormData();
                form.append('busqueda', strBusqueda);

                open_loading();
                fetch(strUrlBuscador, {
                    method: 'POST',
                    headers: {'X-CSRFToken': csrftoken},
                    body: form
                })
                    .then(response => response.json())
                    .then((data) => {

                        const divBuscador = $('#div-buscador');
                        $('#listado_buscador').remove();
                        let divUrls = `<li id="listado_buscador">`;
                        let boolDatos = false;

                        for (let key in data.menu) {

                            boolDatos = true;
                            const arrMenu = data.menu[key];
                            let strUrl_link = window.location.href;
                            strUrl_link = strUrl_link.replace(window.location.pathname, '/' + arrMenu.link)
                            divUrls += `<ul onclick="simple_redireccion('${strUrl_link}');" onmouseover="removeActiveUl();">${arrMenu.ventana}</ul>`;

                        }

                        divUrls += `</li>`;
                        if (boolDatos) divBuscador.append(divUrls);

                        close_loading();
                    })
                    .catch((error) => {
                        close_loading();
                        $('#listado_buscador').remove();
                        console.error(error);
                        alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
                    });
            }

        });

    }

});

const removeAutoComplete = (event) => {
    setTimeout(() => {
        $('#listado_buscador').remove();
        event.srcElement.value = '';
    }, 500);
};

const removeActiveUl = () => {
    const objActive = document.querySelector('#listado_buscador ul[data-activo="1"]');
    if (objActive) {
        objActive.removeAttribute('data-activo');
        objActive.classList.remove('activeBuscador');
    }
};

const numberFormat = new Intl.NumberFormat('en-US'),
    objIcons = {
        time: "fa fa-clock-o",
        date: "fa fa-calendar",
        up: "fa fa-chevron-up",
        down: "fa fa-chevron-down",
        previous: 'fa fa-chevron-left',
        next: 'fa fa-chevron-right',
        today: 'fa fa-screenshot',
        clear: 'fa fa-trash',
        close: 'fa fa-remove'
    },
    objLenguajeDataTable = {
        search: "_INPUT_",
        searchPlaceholder: "Buscar registro",
        "sLengthMenu": "Mostrar _MENU_ registros",
        "sInfo": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
        "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
        "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
        "sLoadingRecords": "Cargando...",
        "oPaginate": {
            "sFirst": "Primero",
            "sLast": "Último",
            "sNext": "Siguiente",
            "sPrevious": "Anterior"
        },
        "oAria": {
            "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
            "sSortDescending": ": Activar para ordenar la columna de manera descendente"
        },
        "sEmptyTable": "No hay datos disponibles",
        "sProcessing": "Cargando..."
    },
    currencyFormat = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'GTQ',
        currencyDisplay: 'narrowSymbol'
    }),
    dateGTFormat = new Intl.DateTimeFormat('es-GT', {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }),
    currencyFormatUS = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        currencyDisplay: 'narrowSymbol'
    }),
    dateTimeGTFormat = new Intl.DateTimeFormat('es-GT', {
        month: "2-digit",
        year: "numeric",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }),
    numberGTFormat = new Intl.NumberFormat('es-GT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }),
    objCountriesGT = ['PE', 'HU', 'QC', 'AV', 'IZ', 'SM', 'QZ', 'TO', 'BV', 'PR', 'ZA', 'RE', 'SU', 'SO', 'CM', 'SA', 'GU', 'JA', 'CQ', 'ES', 'SR', 'JU',],
    monthNamesEnglish = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    monthNamesSpanish = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    arrColorsGradient = {
        'red': [
            '#720000',
            '#7A0000',
            '#820000',
            '#8A0000',
            '#920000',
            '#9B0000',
            '#A30000',
            '#AB0000',
            '#B30000',
            '#B00',
            '#C30000',
            '#C00',
            '#D40000',
            '#DC0000',
            '#E40000',
            '#EC0000',
            '#F40000',
            '#FC0000',
            '#FF0606',
            '#FF0E0E',
            '#FF1616',
            '#FF1E1E',
            '#FF2626',
            '#FF2E2E',
            '#FF3737',
            '#FF3F3F',
            '#FF4747',
            '#FF4F4F',
            '#FF5757',
            '#FF5F5F',
            '#FF6868',
            '#FF7070',
            '#FF7878',
            '#FF8080',
            '#F88',
            '#FF9090',
            '#F99',
            '#FFA1A1',
            '#FFA9A9',
            '#FEB1B1',
            '#FEB9B9',
            '#FEC1C1',
        ],
        'green': [
            '#C1FEC1',
            '#B9FEB9',
            '#B1FEB1',
            '#A9FFA9',
            '#A1FFA1',
            '#9F9',
            '#90FF90',
            '#8F8',
            '#80FF80',
            '#78FF78',
            '#70FF70',
            '#68FF68',
            '#5FFF5F',
            '#57FF57',
            '#4FFF4F',
            '#47FF47',
            '#3FFF3F',
            '#37FF37',
            '#2EFF2E',
            '#26FF26',
            '#1EFF1E',
            '#16FF16',
            '#0EFF0E',
            '#06FF06',
            '#00FC00',
            '#00F400',
            '#00EC00',
            '#00E400',
            '#00DC00',
            '#00D400',
            '#0C0',
            '#00C300',
            '#0B0',
            '#00B300',
            '#00AB00',
            '#00A300',
            '#009B00',
            '#009200',
            '#008A00',
            '#008200',
            '#007A00',
            '#007200',
        ],
    },
    arrColorsRandom = [
        '#FF6633',
        '#FFB399',
        '#FF33FF',
        '#FFFF99',
        '#00B3E6',
        '#E6B333',
        '#3366E6',
        '#999966',
        '#99FF99',
        '#B34D4D',
        '#80B300',
        '#809900',
        '#E6B3B3',
        '#6680B3',
        '#66991A',
        '#FF99E6',
        '#CCFF1A',
        '#FF1A66',
        '#E6331A',
        '#33FFCC',
        '#66994D',
        '#B366CC',
        '#4D8000',
        '#B33300',
        '#CC80CC',
        '#66664D',
        '#991AFF',
        '#E666FF',
        '#4DB3FF',
        '#1AB399',
        '#E666B3',
        '#33991A',
        '#CC9999',
        '#B3B31A',
        '#00E680',
        '#4D8066',
        '#809980',
        '#E6FF80',
        '#1AFF33',
        '#999933',
        '#FF3380',
        '#CCCC00',
        '#66E64D',
        '#4D80CC',
        '#9900B3',
        '#E64D66',
        '#4DB380',
        '#FF4D4D',
        '#99E6E6',
        '#6666FF'],
    monedas = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'GTQ': 'Q',
    },
    regexPhoneNumbers = /^(2|3|4|5|6|7)[0-9]{7}$/;
;

/**
 * alert_nova.showNotification()
 * Esta función es la que genera las notificaciones en las distintas ventanas
 */
alert_nova = {
    /**
     * @param {*} strMessage
     * @param {*} strIcon
     * info = información importante o advertencia
     * add_alert = notificación nueva o completada
     * error_outline = error
     * campaign = anuncio
     * mark_chat_unread = chat
     * @param {*} strColor
     * info
     * danger
     * success (default)
     * warning
     * rose
     * primary
     * @param {*} strPosition
     * top, bottom
     * @param {*} strAlign
     * right, left, center
     */
    showNotification: (strMessage, strIcon = 'add_alert', strColor = 'success', strPosition = 'bottom', strAlign = 'right') => {
        $.notify({
            icon: `${strIcon}`,
            message: `${strMessage}`
        }, {
            type: strColor,
            timer: 3000,
            placement: {
                from: strPosition,
                align: strAlign
            },
            z_index: 99999,
        });
    },

    /**
     *
     * @param {*} boolShow
     * Se le envía solamente como false para cerrar el modal
     */
    loading: (boolShow = true) => {
        if (boolShow) {
            const elementModal = `  <div class="modal fade" id="modalLoadingGlobal" tabindex="-1" role="dialog" aria-labelledby="modalLoadingGlobal" aria-hidden="true">
                                        <div class="modal-dialog modal-xl" role="document">
                                            <div class="modal-content contentLoadingGlobal" style='box-shadow: none; border: none;'>
                                                <div class="modal-body contentLoadingGlobal">
                                                    <div class='row contentLoadingGlobal'>
                                                        <div class="wrapper">
                                                            <div class="circle"></div>
                                                            <div class="circle"></div>
                                                            <div class="circle"></div>
                                                            <div class="shadow"></div>
                                                            <div class="shadow"></div>
                                                            <div class="shadow"></div>
                                                            <span>Cargando</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`;
            document.body.innerHTML += elementModal;

            $('#modalLoadingGlobal').modal({
                keyboard: false
            });
        } else {
            $('#modalLoadingGlobal').modal('hide');
            const element = document.querySelector('#modalLoadingGlobal');
            element.parentNode.removeChild(element);
        }
    },

    pushNotification: (strTitle = 'NOVA', strMessage = '', image = '') => {
        if (Notification.permission === 'granted') {
            new Notification(strTitle, {body: strMessage, icon: image});
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    new Notification(strTitle, {body: strMessage, icon: image});
                }
            });
        }
    },
}


/**
 *
 * @param {*} callback
 * función a retornar
 * @param {*} arrParams
 * @param {*} strTitle
 * @param {*} strText
 * @param {*} strType
 * success
 * error
 * warning
 * info
 * question
 * @param {*} strConfirmButton
 * @param {*} strCancelButton
 * @param {*} extraParams
 */
function dialogConfirm(callback, arrParams = false, strTitle = '¿Estás seguro?', strText = '¡No podrás revertir esto!', strType = 'warning', strConfirmButton = 'Aceptar', strCancelButton = 'Cancelar', extraParams = false) {
    swal({
        title: `${strTitle}`,
        html: `${strText}`,
        type: `${strType}`,
        showCancelButton: true,
        confirmButtonClass: 'btn btn-outline-success',
        cancelButtonClass: 'btn btn-outline-danger',
        confirmButtonText: `${strConfirmButton}`,
        cancelButtonText: `${strCancelButton}`,
        buttonsStyling: false
    }).then(function (e) {
        if (e.value) {
            if (arrParams) {
                callback(arrParams, extraParams);
            } else {
                callback();
            }
        }
    }).catch(swal.noop);
}


/**
 *
 * @param strName
 */
function simple_submit(strName) {
    if (document.getElementsByName(strName)) document.getElementsByName(strName)[0].submit();
}

function getCookie(name) {
    let cookieValue = null;
    let elmts = document.getElementsByName('csrfmiddlewaretoken');
    if(elmts.length > 0)
        csrfTokenFP = elmts[0].value;
    
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }

    return csrfTokenFP;
    // return cookieValue;
}

/**
 *
 * @param strUrl
 */
function simple_redireccion(strUrl) {
    window.location.href = strUrl;
}

function open_loading() {
    const divLoading = `<div style="z-index: 99999999; width: 100%; height: 100%; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);background-color: rgba(100,100,100,0.2);" id="div_loading">
                            <div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                        </div>`;
    $("body").append(divLoading);
}

function close_loading() {
    const divLoading = document.getElementById('div_loading');
    if (divLoading) divLoading.remove();
}

/**
 *
 * @param boolResponsive: define to build datatable responsive
 * @param boolSearching: define if draw or not searching bar
 * @param objCustomOptions
 */
function makeDataTableDefault(boolResponsive = true, boolSearching = true, objCustomOptions = {}, strIdObject = "") {
    let strIdObjectDt = strIdObject.length === 0 ? 'dtDefault' : strIdObject;
    if (document.getElementById(strIdObjectDt)) {
        let objOptDefaults = {
            "pagingType": "full_numbers",
            "lengthMenu": [
                [10, 25, 50, -1],
                [10, 25, 50, "All"]
            ],
            responsive: boolResponsive,
            language: objLenguajeDataTable,
            searching: boolSearching
        };
        if (Object.keys(objCustomOptions).length > 0) {
            $.extend(objOptDefaults, objCustomOptions);
        }
        $(`#${strIdObjectDt}`).DataTable(objOptDefaults);
    }
}

drawCanvas = (strElementContent, strElementCanvasID, intWidth, intHeight) => {
    document.getElementById(`${strElementContent}`).innerHTML =
        `   <div class='col-12 col-md-5 offset-md-3'>
                <canvas id="${strElementCanvasID}" width="${intWidth}" height="${intHeight}" style="border: 2px dotted #CCCCCC; border-radius: 5px; cursor: crosshair;">
                </canvas>
            </div>
            <div class='col-12 col-md-3'>
                <button type='button' class='btn btn-link btn-outline-warning' id='clearFirm'>
                    <i class="material-icons">auto_fix_normal</i>
                    Volver a firmar
                </button>
            </div>`;
    let canvas = document.getElementById(`${strElementCanvasID}`),
        ctx = canvas.getContext("2d"),
        boolDrawing = false,
        mousePosition = {x: 0, y: 0},
        lastPosition = mousePosition;


    const weightPointer = 3;
    const colorTint = '#000000';
    const clearFirm = document.getElementById("clearFirm");

    window.requestAnimFrame = (function (callback) {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimaitonFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    clearFirm.addEventListener("click", function (e) {
        self.clearCanvas();
    }, false);

    canvas.addEventListener("mousedown", function (e) {
        boolDrawing = true;
        lastPosition = self.getmousePosition(canvas, e);
    }, false);

    canvas.addEventListener("mouseup", function (e) {
        boolDrawing = false;
    }, false);

    canvas.addEventListener("mousemove", function (e) {
        mousePosition = self.getmousePosition(canvas, e);
    }, false);

    canvas.addEventListener("touchstart", function (e) {
        mousePosition = getTouchPos(canvas, e);
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }, false);

    canvas.addEventListener("touchend", function (e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent("mouseup", {});
        canvas.dispatchEvent(mouseEvent);
    }, false);

    canvas.addEventListener("touchleave", function (e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent("mouseup", {});
        canvas.dispatchEvent(mouseEvent);
    }, false);

    canvas.addEventListener("touchmove", function (e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }, false);

    let getmousePosition = (canvasDom, mouseEvent) => {
        const rect = canvasDom.getBoundingClientRect();
        return {
            x: mouseEvent.clientX - rect.left,
            y: mouseEvent.clientY - rect.top
        };
    }

    let getTouchPos = (canvasDom, touchEvent) => {
        const rect = canvasDom.getBoundingClientRect();
        return {
            x: touchEvent.touches[0].clientX - rect.left,
            y: touchEvent.touches[0].clientY - rect.top
        };
    }

    let renderCanvas = () => {
        if (boolDrawing) {
            ctx.strokeStyle = colorTint;
            ctx.beginPath();
            ctx.moveTo(lastPosition.x, lastPosition.y);
            ctx.lineTo(mousePosition.x, mousePosition.y);

            ctx.lineWidth = weightPointer;
            ctx.stroke();
            ctx.closePath();
            lastPosition = mousePosition;
        }
    }

    let clearCanvas = () => {
        canvas.width = canvas.width;
    }

    (function drawLoop() {
        requestAnimFrame(drawLoop);
        self.renderCanvas();
    })();
};

function solo_enteros(evt) {
    const theEvent = evt || window.event;
    let key = '';

    if (theEvent.type === 'paste') {
        key = event.clipboardData.getData('text/plain');
    } else {
        // Handle key press
        key = theEvent.keyCode || theEvent.which;
        key = String.fromCharCode(key);
    }

    const regex = /[0-9]|\./;
    if (!regex.test(key) && (theEvent.keyCode !== 8 && theEvent.keyCode !== 190)) {
        theEvent.returnValue = false;
        if (theEvent.preventDefault) theEvent.preventDefault();
    }
}

function validar_caracteres(e, opt) {
    let tecla = (document.all) ? e.keyCode : e.which;
    if (tecla === 8)
        return true; // válida tecla de retroceso
    if (tecla === 0)
        return true; // válida tecla de tabulación

    if (e.code.indexOf('Numpad') === 0) {
        if (tecla >= 96 && tecla <= 105) {
            tecla -= 48;
        }
    }

    let patron;
    switch (opt) {
        case 1: {
            patron = /[A-Za-zñÑáéíóúÁÉÍÓÚ\d\t]/; //Permite letras y números
        }
            break;
        case 2: {
            patron = /[\d\t]/; //Permite solo números
        }
            break;
        case 3: {
            patron = /[A-Za-zñÑáéíóúÁÉÍÓÚ\t]/; //Permite solo letras
        }
            break;
        case 4: {
            patron = /[A-Za-zñÑáéíóúÁÉÍÓÚ\s\t]/; //Permite letras y el espacio en blanco
        }

            break;
        case 5: {
            patron = /[A-Za-zñÑáéíóúÁÉÍÓÚ\s\d\t\-]/; //Permite letras, números y el espacio en blanco
        }
            break;
        case 6: {
            patron = /[A-Za-zñÑáéíóúÁÉÍÓÚ\d\t\-]/; //Permite letras, números y guion
        }
            break;
        case 7: {
            patron = /[\d\t\.]/; //Permite solo números y punto
        }
            break;
        case 8: {
            patron = /[A-Za-zñÑáéíóúÁÉÍÓÚ\t\.\_]/; //Permite letras, guion bajo y punto
        }
            break;
        case 9: {
            patron = /[A-Za-zñÑáéíóúÁÉÍÓÚ\t\.\_\/]/; //Permite letras, guion bajo, diagonal y punto
        }
            break;
        case 10: {
            patron = /[A-Za-z\d\t]/; //Permite letras sin tildes y números
        }
            break;
        case 11: {
            patron = /[\d\t\s]/; //Permite solo números y espacio en blanco
        }
            break;
        case 13: {
            patron = /[A-Za-zñÑ\d\t\s\.\,]/; //Permite letras sin tildes, números y espacios y ñ
        }
            break;
        case 14: {
            patron = /[\d\t\.\,]/; //Permite solo números, punto y coma
        }
            break;
        case 15: {
            patron = /[-\d\t]/; //Permite solo números y guion
        }
            break;
        default: {
            patron = /[\'\?\¡\¿\*\"\~\[\]\{\}\+\$\&\%\#\=\^\<\>\(\)\!]/; //No permite los caracteres extraños
            let te = String.fromCharCode(tecla);
            return !patron.test(te);
        }
    }

    let te = String.fromCharCode(tecla);
    return patron.test(te);
}

function exportTableToExcel(tableID, filename = '') {
    let downloadLink;
    let dataType = 'application/vnd.ms-excel';
    let tableSelect = document.getElementById(tableID);
    let tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');

    filename = filename ? filename + '.xls' : 'excel_data.xls';

    downloadLink = document.createElement("a");

    document.body.appendChild(downloadLink);

    if (navigator.msSaveOrOpenBlob) {
        let blob = new Blob(['\ufeff', tableHTML], {
            type: dataType
        });
        navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        downloadLink.href = 'data:' + dataType + ', ' + tableHTML;

        downloadLink.download = filename;

        downloadLink.click();
    }
}

const getSizeInBytes = async (obj) => {
    let str;
    if (typeof obj === 'string') {
        str = obj;
    } else {
        str = JSON.stringify(obj);
    }
    return new TextEncoder().encode(str).length;
};

const makeInputsFromPositions = async (strIDContent, detail) => {
    let content = document.getElementById(strIDContent);
    for (const k in detail) {
        const v = detail[k];
        let input = document.createElement("input");
        input.type = 'hidden';
        input.name = `${k}[]`;
        input.value = v;
        content.appendChild(input);
    }
    return true;
};

const launchModalSavingByParts = async (intPercentage = 100) => {
    const elementExist = document.getElementById('div-saving-by-parts');
    intPercentage = ((intPercentage * 1).toFixed(0) * 1);
    if (!isNaN(intPercentage)) {
        let strColor = 'var(--primary-bs)';
        if (intPercentage <= 30)
            strColor = 'var(--red-bs)';
        else if (intPercentage > 30 && intPercentage <= 55)
            strColor = 'var(--yellow-bs)';
        else if (intPercentage > 55 && intPercentage <= 85)
            strColor = 'var(--orange-bs)';
        else if (intPercentage > 85)
            strColor = 'var(--green-success)';

        if (!elementExist) {
            const divLoading = `<div id="div-saving-by-parts">
                                    <div class="element-percentage-loading-global">
                                        <svg class='svg-percentage-loading-global' id='circle-percentage-loading-global'>
                                            <circle cx="70" cy="70" r="70"></circle>
                                            <circle cx="70" cy="70" r="70" style='stroke-dashoffset:calc(440 - (440 * ${intPercentage}) / 100); stroke: ${strColor};'></circle>
                                        <svg>
                                        <div class="element-num-percentage-loading" id='title-percentage-loading-global'>
                                            <h2 style='color: ${strColor}'>
                                                ${intPercentage}
                                                <span style='color: ${strColor}'>%</span>
                                            </h2>
                                        </div>
                                        <h2 class="element-text-percentage-loading">Cargando, espere por favor</h2>
                                    </div>
                                </div>`;
            document.body.innerHTML += divLoading;
        } else {
            let elementCircle = document.getElementById('circle-percentage-loading-global'),
                elementTitlePercentage = document.getElementById('title-percentage-loading-global');
            elementCircle.innerHTML = ` <circle cx="70" cy="70" r="70"></circle>
                                        <circle cx="70" cy="70" r="70" style='stroke-dashoffset:calc(440 - (440 * ${intPercentage}) / 100); stroke: ${strColor};'></circle>`;
            elementTitlePercentage.innerHTML = `<h2 style='color: ${strColor}'>
                                                    ${intPercentage}
                                                    <span style='color: ${strColor}'>%</span>
                                                </h2>`;
        }
    }
    return true;
};

/**
 * Método que espera una respuesta correcta del servicio solicitado, solo queriendo que responda un json con una posición 'status'
 * strIDForm = ID del formulario a enviar
 * strURL = dirección del servicio a guardar
 * strMethod = tipo de petición a ejecutar
 */
const sendPartForm = async (strIDForm, strURL, strPositionRecursive = 'none', strMethod = 'POST') => {
    let elementForm = document.getElementById(strIDForm),
        boolReturn = false,
        strPosition = 0;
    if (elementForm && strURL) {
        let form = new FormData(elementForm),
            csrfToken = getCookie('csrftoken');
        const response = await fetch(strURL, {method: strMethod, body: form, headers: {"X-CSRFToken": csrfToken}});
        const data = await response.json();
        if (data?.status) {
            boolReturn = true;
            if (strPositionRecursive !== 'none')
                strPosition = data[strPositionRecursive];
        }
    }

    return {
        'status': boolReturn,
        'str_position': strPosition,
    };
};

const splitObjectBySize = async (obj, intSizeSplit = 25000) => {
    let intSizeTotal = await getSizeInBytes(obj);
    let intLengthObject = intSizeTotal / intSizeSplit;
    let objResult = [];
    let intLengthOriginal = Object.keys(obj).length;
    if (intLengthObject > 1 && intLengthObject < 2) {
        let intLength = intLengthOriginal / 2;
        intLength = Math.round(intLength);
        for (let i = 0; i < obj.length; i += intLength) {
            let part = obj.slice(i, i + intLength);
            objResult.push(part);
        }
    } else if (intLengthObject > 2) {
        intLengthObject++;
        let intLength = intLengthOriginal / intLengthObject;
        intLength = Math.round(intLength);
        for (let i = 0; i < obj.length; i += intLength) {
            let part = obj.slice(i, i + intLength);
            objResult.push(part);
        }
    } else {
        objResult.push(obj);
    }
    return objResult;
};

const appendElementsToFormByPart = async (elementContent, strElements, strDefaultFormElements) => {
    elementContent.innerHTML = strElements;
    return true;
};

/**
 * Método que espera objeto y lo va a recorrer, creando los elementos dentro del formulario a definir, y yendo a guardar a la localización deseada
 * objToSend = objeto a dividir por partes según el tamaño estipulado
 * strIDForm = ID del formulario a enviar
 * strURLSend = dirección del servicio a guardar
 * strMethod = tipo de petición a ejecutar (opcional)
 * intSizeSplit = tamaño en bytes para dividir el objeto (opcional)
 */
const saveObjectByParts = async (objToSend, strIDForm, strURLSend, strPositionRecursive = 'none', strMethod = 'POST', intSizeSplit = 10000, strDefaultFormElements = '') => {
    let boolError = false,
        strError = '',
        intDone = 0,
        strPositionBackend = 0,
        elementAlert = document.querySelector('.swal2-container');

    if (elementAlert) {
        elementAlert.remove();
    }

    if (typeof objToSend == 'object') {
        const elementContent = document.getElementById(strIDForm);
        if (elementContent) {
            let objParts = await splitObjectBySize(objToSend, intSizeSplit),
                intLength = Object.keys(objParts).length,
                intPercentage = 0;
            for (const k in objParts) {
                const part = objParts[k];
                await launchModalSavingByParts(intPercentage);
                if (strDefaultFormElements !== '') {
                    let strElementRecursive = '';
                    if (strPositionRecursive !== 'none')
                        strElementRecursive = `<input type='hidden' name='${strPositionRecursive}' value='${strPositionBackend}' />`;
                    document.getElementById(strIDForm).innerHTML = `${strDefaultFormElements} ${strElementRecursive}`;
                }
                for (const key in part) {
                    const detail = part[key];
                    await makeInputsFromPositions(strIDForm, detail);
                }
                let arrSend = await sendPartForm(strIDForm, strURLSend, strPositionRecursive, strMethod);
                if (arrSend.status) {
                    strPositionBackend = arrSend.str_position;
                    intDone++;
                    intPercentage = ((intDone / intLength) * 100).toFixed(0);
                    elementContent.innerHTML = '';
                } else {
                    boolError = true;
                    strError = 'Ocurrió un error mientras se guardaban los datos, contacta con soporte';
                }
            }
        } else {
            strError = 'No existe el elemento del formulario';
            boolError = true;
        }
    } else {
        strError = 'Solamente se pueden guardar en partes los objetos';
        boolError = true;
    }
    if (!boolError) {
        boolLaunch = await launchModalSavingByParts(100);
        const divLoading = document.getElementById('div-saving-by-parts');
        if (divLoading) divLoading.remove();
    }
    return {
        'status': (!boolError),
        'error': strError,
    }
};

function clearElementsForm(element) {
    for (let i = 0; i < element.childNodes.length; i++) {
        const e = element.childNodes[i];
        if (e.tagName) switch (e.tagName.toLowerCase()) {
            case 'input':
                switch (e.type) {
                    case "radio":
                    case "checkbox":
                        e.checked = false;
                        break;
                    case "button":
                    case "submit":
                    case "image":
                        break;
                    default:
                        e.value = '';
                        break;
                }
                break;
            case 'select':
                e.selectedIndex = 0;
                break;
            case 'textarea':
                e.innerHTML = '';
                break;
            default:
                clearElementsForm(e);
        }
    }
}

function selectAllChecksByName(strNameElement, boolChecked) {
    let inputs = document.querySelectorAll(`input[name='${strNameElement}']`);
    if (inputs && Object.keys(inputs).length > 0) {
        inputs.forEach(element => {
            element.checked = boolChecked;
        });
    }
}

async function forObjMultiSend(objSend, strURL) {
    let intTotal = Object.keys(objSend).length,
        countFor = 0;

    for (const k in objSend) {
        const d = objSend[k];
        let response = await sendObjPartSend(d, strURL);
        if (response) {
            countFor++;
            const intPercentage = (100 / intTotal) * countFor;
            intGlobalPercentageLoading = Math.round(intPercentage);
            drawModalProgressLoading();
        } else {
            break;
        }
    }
    return intTotal === countFor;
}

async function sendObjPartSend(objSend, strURL) {
    const form = new FormData();
    form.append('csrfmiddlewaretoken', document.getElementsByName('csrfmiddlewaretoken')[0].value);
    form.append('data', JSON.stringify(objSend));
    let response = await fetch(`${strURL}`, {
        method: 'POST',
        body: form,
    })
        .then(response => response.json())
        .then(data => {
            if (data)
                return true;
        })
        .catch(error => {
            console.error(error);
            return false;
        });
}

function drawModalProgressLoading() {
    const progressBar = document.getElementById('progress-bar');
    if (!progressBar) {
        const element = `   <div class="modal fade" id="modalLoadingByParts" tabindex="-1" role="dialog" aria-labelledby="modalLoadingByPartsLabel" aria-hidden="true">
                                <div class="modal-dialog modal-lg">
                                    <div class="modal-content">
                                        <div class="modal-body" style='display: table;'>
                                            <h1 id='progress-count-global' class='progress-count-global'></h1>
                                            <div class='str-progress-bar-global'>Cargando</div>
                                            <div id='progress-bar-global' class='progress-bar-global'></div>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
        document.body.innerHTML += element;
        $('#modalLoadingByParts').modal({
            show: true,
            keyboard: false,
            backdrop: 'static',
        });
    }
    requestAnimationFrame(drawProgressBarGlobal);
}

function drawProgressBarGlobal() {
    let bar = document.getElementById('progress-bar-global'),
        counter = document.getElementById('progress-count-global');
    if (intGlobalPercentageLoading > 100) {
        intGlobalPercentageLoading = 100;
    }
    let strPercentage = `${intGlobalPercentageLoading}%`;
    bar.style.width = strPercentage;
    counter.innerHTML = strPercentage;
}

function drawGlobalHighChartsLondon(objGraphic = {}, boolFuncion = false, strFuncion = '') {
    let objSeriesAtDay = {};

    if (Object.keys(objGraphic).length > 0) {
        if (objGraphic.str_id !== '') {
            let strValue = (objGraphic?.valueChart) ? ((objGraphic.valueChart == '.') ? '' : objGraphic.valueChart) : '%',
                strSubtitle = (objGraphic.subTitle) ? objGraphic.subTitle : '',
                strUOM = (objGraphic?.uom) ? objGraphic.uom : '';
            if (strSubtitle === '') {
                if (objGraphic?.strObjective) {
                    strSubtitle += `<br> <p style='color: #00FF00; font-weight: bold; font-size: 14px;'>Objetivo: ${objGraphic.strObjective} ${strUOM}</p>`;
                }
                if (objGraphic?.strAlcance) {
                    strSubtitle += `<br> <p style='color: #FF0000; font-weight: bold; font-size: 14px;'>Período Base: ${objGraphic.strAlcance} ${strUOM}</p>`;
                }
            }

            if (objGraphic?.objSerieToDay) {
                let strSaleAtDay = (objGraphic.objSerieToDay[3] * 1).toFixed(0);
                strSubtitle += `<br> <p style='color: #1A4F77; font-weight: bold; font-size: 14px;'>Venta al Dia seria de: ${strSaleAtDay} ${strUOM}</p>`;
                objSeriesAtDay = {
                    name: 'Al Dia',
                    type: 'spline',
                    lineWidth: 0,
                    color: '#1A4F77',
                    data: objGraphic.objSerieToDay,
                    tooltip: {valueSuffix: ''}
                };
            }
            Highcharts.chart(objGraphic.str_id, {
                chart: {
                    zoomType: 'xy',
                    backgroundColor: '#F8F8F8',
                },
                title: {text: objGraphic.title},
                subtitle: {text: strSubtitle},
                xAxis: [{
                    categories: objGraphic.objCategories,
                    crosshair: true
                }],
                credits: {enabled: false},
                yAxis: [
                    {
                        labels: {
                            format: '{value} ' + strValue,
                        },
                        title: {
                            text: '',
                        },
                        tickInterval: (objGraphic?.interval) ? objGraphic.interval : 25,
                    },
                ],
                tooltip: {shared: true},
                legend: {enabled: false,},
                series: [
                    {
                        name: 'Real',
                        type: 'column',
                        data: objGraphic.objReal,
                        tooltip: {valueSuffix: ''},
                        color: objGraphic.type === 'monthly' ? '#333F50' : '#2E75B6',
                        dataLabels: {
                            format: "{y} " + strValue,
                            enabled: true,
                            color: "white",
                            shadow: true,
                            style: {fontSize: "14px", textShadow: "0px"},
                            verticalAlign: "bottom",
                            y: 1000,
                        },
                        cursor: (boolFuncion) ? 'pointer' : '',
                        point: {
                            events: {
                                click: function () {
                                    if (boolFuncion) {
                                        strFuncion(this.category);
                                    }
                                }
                            }
                        }
                    },
                    {
                        name: 'Objetivo',
                        type: 'spline',
                        data: objGraphic.objObjective,
                        tooltip: {valueSuffix: ''},
                        color: '#00FF00',
                    },
                    {
                        name: 'PB',
                        type: 'spline',
                        color: '#FF0000',
                        data: objGraphic.objAlcance,
                        tooltip: {valueSuffix: ''}
                    },
                    objSeriesAtDay,
                ],
            });
        }
    }
}

function setFormValidation(id, objRules, objMessages, objMethod) {
    $(id).validate({
        rules: objRules,
        messages: objMessages,
        highlight: function (element) {
            $(element).closest('.form-group').removeClass('has-success').addClass('has-danger');
            $(element).closest('.form-check').removeClass('has-success').addClass('has-danger');

            alert_nova.showNotification("Debe llenar los campos marcados.", "warning", "danger");
        },
        success: function (element) {
            $(element).closest('.form-group').removeClass('has-danger').addClass('has-success');
            $(element).closest('.form-check').removeClass('has-danger').addClass('has-success');

        },
        errorPlacement: function (error, element) {
            $(element).closest('.form-group').append(error);
        },
        submitHandler: function (form) {
            dialogConfirm(objMethod, form);
        }
    });
}


/**
 *** Función para crear elementos
 @param objOptions = {
  "element": "input",
  "name": "nombre_elemento",
  "classes": ["form-control"],
  "styles": {"background": "white", "color": "black"},
  "attributes": {"data-prueba": "prueba", "data-fake": true}
  }
 */
const createElement = async (objOptions) => {
    const objCreate = document.createElement(objOptions.element);

    if (objOptions?.id) objCreate.id = objOptions.id;
    if (objOptions?.name) objCreate.name = objOptions.name;
    if (objOptions?.value) objCreate.value = objOptions.value;
    if (objOptions?.type) objCreate.type = objOptions.type;
    if (objOptions?.src) objCreate.src = objOptions.src;
    if (objOptions?.alt) objCreate.alt = objOptions.alt;
    if (objOptions?.href) objCreate.href = objOptions.href;
    if (objOptions?.download) objCreate.download = objOptions.download;
    if (objOptions?.placeholder) objCreate.placeholder = objOptions.placeholder;
    if (objOptions?.htmlFor) objCreate.htmlFor = objOptions.htmlFor;

    if (objOptions?.classes) {

        for (let strClass of objOptions.classes) {
            objCreate.classList.add(strClass);
        }

    }

    if (objOptions?.styles) {

        for (let strKey in objOptions.styles) {
            const strStyle = objOptions.styles[strKey];
            objCreate.style.setProperty(strKey, strStyle);
        }

    }

    if (objOptions?.attributes) {

        for (let strAttribute in objOptions.attributes) {
            const strValue = objOptions.attributes[strAttribute];
            objCreate.setAttribute(strAttribute, strValue);
        }

    }

    return objCreate;
};

const validateLogin = () => {

    if (typeof (boolGlobalBlockValidateLogin) === "undefined") {
        // open_loading();
        const csrftoken = getCookie('csrftoken');

        fetch("/core/validate_login/", {
            method: 'POST',
            headers: {"X-CSRFToken": csrftoken},
        })
            .then(response => response.json())
            .then((data) => {
                if (!data.status && data.session_expired) {
                    //simple_redireccion('/login/');
                    if (!document.getElementById('mdlLogin')) {
                        const strModal = `
                    <div class="modal" tabindex="-1" id="mdlLogin" aria-modal="true" role="dialog" data-backdrop="static" data-keyboard="false" style="display: block; z-index: 100000; background: black;">
                        <div class="modal-dialog modal-dialog-centered" style="margin-top: 0;">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title"></h5>
                                </div>
                                <div class="modal-body">
                                    <div class="row" style="margin-bottom: 15px;">
                                        <div class="col-12">
                                            <div class="alert alert-warning">
                                                <span>Su sesión ha expirado, por favor vuelva a ingresar sus datos para continuar usando el sistema.</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row" style="margin-bottom: 15px;">
                                        <div class="col-12">
                                            <span class="bmd-form-group">
                                                <div class="input-group">
                                                    <div class="input-group-prepend" style='width: 100%'>
                                                        <span class="input-group-text">
                                                            <i class="material-icons">face</i>
                                                        </span>
                                                        <input type="email" name='username' id='username' class="form-control" placeholder='Usuario'>
                                                    </div>
                                                </div>
                                            </span>
                                        </div>
                                    </div>
        
                                    <div class="row" style="margin-bottom: 15px;">
                                        <div class="col-12">
                                            <span class="bmd-form-group">
                                                <div class="input-group">
                                                    <div class="input-group-prepend" style='width: 100%'>
                                                        <span class="input-group-text">
                                                            <i class="material-icons">lock_outline</i>
                                                        </span>
                                                        <input type="password" name='password' id='password' class="form-control" placeholder='Contraseña'>
                                                    </div>
                                                </div>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer text-center">
                                    <button type="button" class="btn btn-primary" id="btnLogin" onclick="loginFetch();">Login</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                        document.body.insertAdjacentHTML('afterend', strModal);
                        $(`#mdlLogin`).modal({show: true, backdrop: 'static', keyboard: false});
                    } else {
                        $(`#mdlLogin`).modal({show: true, backdrop: 'static', keyboard: false});
                    }
                }
                // close_loading();
            })
            .catch(() => {
                if (!document.getElementById('mdlLogin')) {
                    const strModal = `
                    <div class="modal" tabindex="-1" id="mdlLogin" aria-modal="true" role="dialog"  data-backdrop="static" data-keyboard="false" style="display: block; z-index: 100000; background: black;">
                        <div class="modal-dialog modal-dialog-centered" style="margin-top: 0;">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title"></h5>
                                </div>
                                <div class="modal-body">
                                    <div class="row" style="margin-bottom: 15px;">
                                        <div class="col-12">
                                            <div class="alert alert-warning">
                                                <span>Su sesión ha expirado, por favor vuelva a ingresar sus datos para continuar usando el sistema.</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row" style="margin-bottom: 15px;">
                                        <div class="col-12">
                                            <span class="bmd-form-group">
                                                <div class="input-group">
                                                    <div class="input-group-prepend" style='width: 100%'>
                                                        <span class="input-group-text">
                                                            <i class="material-icons">face</i>
                                                        </span>
                                                        <input type="email" name='username' id='username' class="form-control" placeholder='Usuario'>
                                                    </div>
                                                </div>
                                            </span>
                                        </div>
                                    </div>
        
                                    <div class="row" style="margin-bottom: 15px;">
                                        <div class="col-12">
                                            <span class="bmd-form-group">
                                                <div class="input-group">
                                                    <div class="input-group-prepend" style='width: 100%'>
                                                        <span class="input-group-text">
                                                            <i class="material-icons">lock_outline</i>
                                                        </span>
                                                        <input type="password" name='password' id='password' class="form-control" placeholder='Contraseña'>
                                                    </div>
                                                </div>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer text-center">
                                    <button type="button" class="btn btn-primary" id="btnLogin" onclick="loginFetch();">Login</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    document.body.insertAdjacentHTML('afterend', strModal);
                    $(`#mdlLogin`).modal({show: true, backdrop: 'static', keyboard: false});
                } else {
                    $(`#mdlLogin`).modal({show: true, backdrop: 'static', keyboard: false});
                }
                // close_loading();
                //console.error(error);
            });
    }
};

const loginFetch = () => {
    open_loading();
    const objForm = new FormData(),
        csrftoken = getCookie('csrftoken');

    objForm.append('username', document.getElementById('username').value.trim());
    objForm.append('password', document.getElementById('password').value.trim());
    objForm.append('csrfmiddlewaretoken', csrftoken);

    fetch("/core/login_fetch/", {
        method: 'POST',
        body: objForm
    })
        .then(response => response.json())
        .then((data) => {
            if (data.status) {
                $(`#mdlLogin`).modal('hide');
                document.getElementById('mdlLogin').remove();
                let token = getCookie('csrftoken');
                const objTockens = document.querySelectorAll('input[name="csrfmiddlewaretoken"]');
                csrfTokenFP = data.token;
                objTockens.forEach(element => {
                    element.value = data.token;
                });
                alert_nova.showNotification('Sesión restablecida correctamente.', "add_alert", "success");
            } else {
                alert_nova.showNotification('Datos incorrectos.', "warning", "danger");
            }
            close_loading();
        })
        .catch((error) => {
            close_loading();
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
        });

};


function cuiIsValid(cui) {
    if (!cui) {
        alert_nova.showNotification("CUI vacío", "warning", "danger");
        return false;
    }

    const cuiRegExp = /^[0-9]{4}\s?[0-9]{5}\s?[0-9]{4}$/;

    if (!cuiRegExp.test(cui)) {
        alert_nova.showNotification("CUI con formato inválido", "warning", "danger");
        return false;
    }

    cui = cui.replace(/\s/, '');
    const depto = parseInt(cui.substring(9, 11), 10);
    const muni = parseInt(cui.substring(11, 13));
    const numero = cui.substring(0, 8);
    const verificador = parseInt(cui.substring(8, 9));

    // Se asume que la codificación de Municipios y
    // departamentos es la misma que está publicada en
    // http://goo.gl/EsxN1a

    // Listado de municipios actualizado según:
    // http://goo.gl/QLNglm

    // Este listado contiene la cantidad de municipios
    // existentes en cada departamento para poder
    // determinar el código máximo aceptado por cada
    // uno de los departamentos.
    const munisPorDepto = [
        /* 01 - Guatemala tiene:      */ 17 /* municipios. */,
        /* 02 - El Progreso tiene:    */  8 /* municipios. */,
        /* 03 - Sacatepéquez tiene:   */ 16 /* municipios. */,
        /* 04 - Chimaltenango tiene:  */ 16 /* municipios. */,
        /* 05 - Escuintla tiene:      */ 13 /* municipios. */,
        /* 06 - Santa Rosa tiene:     */ 14 /* municipios. */,
        /* 07 - Sololá tiene:         */ 19 /* municipios. */,
        /* 08 - Totonicapán tiene:    */  8 /* municipios. */,
        /* 09 - Quetzaltenango tiene: */ 24 /* municipios. */,
        /* 10 - Suchitepéquez tiene:  */ 21 /* municipios. */,
        /* 11 - Retalhuleu tiene:     */  9 /* municipios. */,
        /* 12 - San Marcos tiene:     */ 30 /* municipios. */,
        /* 13 - Huehuetenango tiene:  */ 32 /* municipios. */,
        /* 14 - Quiché tiene:         */ 21 /* municipios. */,
        /* 15 - Baja Verapaz tiene:   */  8 /* municipios. */,
        /* 16 - Alta Verapaz tiene:   */ 17 /* municipios. */,
        /* 17 - Petén tiene:          */ 14 /* municipios. */,
        /* 18 - Izabal tiene:         */  5 /* municipios. */,
        /* 19 - Zacapa tiene:         */ 11 /* municipios. */,
        /* 20 - Chiquimula tiene:     */ 11 /* municipios. */,
        /* 21 - Jalapa tiene:         */  7 /* municipios. */,
        /* 22 - Jutiapa tiene:        */ 17 /* municipios. */
    ];

    if (depto === 0 || muni === 0) {
        alert_nova.showNotification("CUI con código de municipio o departamento inválido.", "warning", "danger");
        return false;
    }

    if (depto > munisPorDepto.length) {
        alert_nova.showNotification("CUI con código de departamento inválido.", "warning", "danger");
        return false;
    }

    if (muni > munisPorDepto[depto - 1]) {
        alert_nova.showNotification("CUI con código de municipio inválido.", "warning", "danger");
        return false;
    }

    // Se verifica el correlativo con base
    // en el algoritmo del complemento 11.
    let total = 0;

    for (let i = 0; i < numero.length; i++) {
        total += numero[i] * (i + 2);
    }

    const modulo = (total % 11);

    // alert_nova.showNotification("CUI con módulo: " + modulo, "warning", "danger");
    return modulo === verificador;
}

/**
 * @param {string} nit - número de DPI
 * @returns {boolean} true para NIT válido y false para NIT no válido
 * */
const nitValido = (nit) => {
    if (!nit) {
        return false;
    }

    let nitRegExp = new RegExp('^[0-9]+(-?[0-9kK])?$');

    if (!nitRegExp.test(nit)) {
        return false;
    }

    nit = nit.replace(/-/, '');
    let lastChar = nit.length - 1;
    let number = nit.substring(0, lastChar);
    let expectedChecker = nit.substring(lastChar, lastChar + 1).toLowerCase();

    let factor = number.length + 1;
    let total = 0;

    for (let i = 0; i < number.length; i++) {
        let character = number.substring(i, i + 1);
        let digit = parseInt(character, 10);

        total += (digit * factor);
        factor = factor - 1;
    }

    let modulus = (11 - (total % 11)) % 11;
    let computedChecker = (modulus === 10 ? "k" : modulus.toString());

    return expectedChecker === computedChecker;
}

const zfill = (number, width) => {
    let numberOutput = Math.abs(number),
        length = number.toString().length,
        zero = "0";

    if (width <= length) {
        if (number < 0)
            return ("-" + numberOutput.toString());
        else
            return numberOutput.toString();
    } else {
        if (number < 0)
            return ("-" + (zero.repeat(width - length)) + numberOutput.toString());
        else
            return ((zero.repeat(width - length)) + numberOutput.toString());
    }
};

setInterval(validateLogin, ((1000 * 60) * 30));

const makeImageJPG = async (strElementID, strNameImage) => {
    html2canvas($(`#${strElementID}`)[0]).then((canvas) => {
        let a = document.createElement('a');
        a.href = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
        a.download = `${strNameImage}.jpg`;
        a.click();
        a.remove();
    });
}

const errorDblClick = async () => {
    alert_nova.showNotification('Recuerda solo dar un click', 'warning', 'danger');
};

function formatoMonto(numero) {
    // Verificar si el número es válido
    if (isNaN(numero)) {
        return "Número no válido";
    }

    // Separar parte entera y decimal
    const partes = numero.toFixed(2).toString().split(".");

    // Formatear parte entera con comas para separar miles y millardos
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Unir parte entera y decimal con punto
    return partes.join(".");
}

function obtenerSimboloMoneda(codigoISO) {
    if (monedas.hasOwnProperty(codigoISO)) {
        return monedas[codigoISO];
    } else {
        return 'No se encontró el símbolo de la moneda';
    }
}


const callbackError = (objError, boolShowErrorAlert = true) => {
    if (boolShowErrorAlert) alert_nova.showNotification('Ocurrió un error, contacte con IT', 'warning', 'danger');
    console.error(objError);
};

const defaultNovaFetchOptions = {
    boolShowSuccessAlert: true,
    boolJson: true,
    boolShowErrorAlert: true,
    fntErrorFunction: callbackError
};

const coreFetch = async (strParamUrl, objInit, fntExecFunction, options = {}) => {
    const {
        boolShowSuccessAlert,
        boolJson,
        boolShowErrorAlert,
        fntErrorFunction
    } = {...defaultNovaFetchOptions, ...options};

    try {
        const response = await fetch(strParamUrl, objInit);
        let data;
        if (boolJson) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        await fntExecFunction(data);
        if (boolShowSuccessAlert) {
            if (data.status) {
                alert_nova.showNotification(data.msj ?? data.msg, "add_alert", "success");
            } else {
                alert_nova.showNotification(data.msj ?? data.msg, "warning", "danger");
            }
        }
        if (!data.status && data.session_expired) {
            validateLogin();
        }
        return true;
    } catch (error) {
        close_loading();
        fntErrorFunction(error, boolShowErrorAlert);
        return false;
    }
}

const mobileCheck = () => {
    let check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};


const createFormData = (selectors) => {
    // Crear una nueva instancia de FormData
    const formData = new FormData();

    // Iterar sobre cada clave en el objeto de selectores
    for (const key in selectors) {
        if (selectors.hasOwnProperty(key)) {
            // Obtener el selector
            const selector = selectors[key];

            // Seleccionar el elemento del DOM
            const element = document.querySelector(selector);

            if (element) {
                // Obtener el valor del elemento
                let value;
                if (element.type === 'checkbox' || element.type === 'radio') {
                    // Para checkboxes y radio buttons, obtener el valor solo si están chequeados
                    value = element.checked ? element.value : null;
                } else if (element.tagName === 'SELECT' && element.multiple) {
                    // Para selects múltiples, obtener todos los valores seleccionados
                    value = Array.from(element.selectedOptions).map(option => option.value);
                } else {
                    // Para otros tipos de elementos
                    value = element.value;
                }

                // Agregar el valor a FormData si no es nulo
                if (value !== null) {
                    if (Array.isArray(value)) {
                        // Si es un array (para selects múltiples), agregar cada valor por separado
                        value.forEach(val => formData.append(key, val));
                    } else {
                        // Para valores únicos
                        formData.append(key, value);
                    }
                }
            } else {
                console.warn(`Elemento no encontrado para el selector: ${selector}`);
            }
        }
    }

    return formData;
};
