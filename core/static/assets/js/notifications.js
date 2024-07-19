// getUsersBirthDay();

function getUsersBirthDay() {
    let csrftoken = getCookie('csrftoken');
    let strUrl =  window.location.href;
    strUrl = strUrl.replace(window.location.pathname, '/core/notificaciones/birthday');

    fetch(`${strUrl}`, {
        method: 'POST',
        headers: { "X-CSRFToken": csrftoken },
    })
    .then(response => response.json())
    .then( (data) => {
        if(Object.keys(data).length > 0) {
            drawBallons(data);
        }
    })
    .catch((error) => {
        console.error(error);
    });
}

async function drawBallons(objUsers) {
    await makeModel();
    await makeTitle();
    drawNames(objUsers);
    addEventButtonClose();
}

async function makeModel() {
    const element = `   <div class="modal fade" id="modalBallonsGlobal" tabindex="-1" role="dialog" aria-labelledby="modalBallonsGlobal" aria-hidden="true">
                            <div class="modal-dialog modal-xl" role="document">
                                <div class="modal-content modalContainerBallons">
                                    <div class="modal-header" style='height: 80px;'>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close" id="btnCloseModalBallons">
                                            Cerrar
                                        </button>
                                    </div>
                                    <div class="modal-body" id="cntBodyBallons"></div>
                                </div>
                            </div>
                        </div>`;
    document.body.innerHTML += element;
}

async function makeTitle() {
    document.getElementById('cntBodyBallons').innerHTML = `   <div class='col-xs-12 col-md-10 offset-md-1' style='display: table;'>
                            <div class="balloon">
                                <div><span class="span-ballon">F</span></div>
                            </div>
                            <div class="balloon">
                                <div><span class="span-ballon">E</span></div>
                            </div>
                            <div class="balloon">
                                <div><span class="span-ballon">L</span></div>
                            </div>
                            <div class="balloon">
                                <div><span class="span-ballon">I</span></div>
                            </div>
                            <div class="balloon">
                                <div><span class="span-ballon">Z</span></div>
                            </div>

                            <div class="balloon"><div><span class="span-ballon"></span></div></div>

                            <div class="balloon">
                                <div><span class="span-ballon">D</span></div>
                            </div>
                            <div class="balloon">
                                <div><span class="span-ballon">Í</span></div>
                            </div>
                            <div class="balloon">
                                <div><span class="span-ballon">A</span></div>
                            </div>
                        </div>
                        <div id='cntNames' class='col-xs-12 col-md-8 offset-md-2 cntNamesBirthDay'></div>`;
}

function drawNames(objUsers) {
    if(Object.keys(objUsers).length > 0) {
        let element = '';
        for (let key in objUsers) {
            const data = objUsers[key];
            element += `<p>${data.empleado}</p>`;
        }

        document.getElementById('cntNames').innerHTML += element;
        $('#modalBallonsGlobal').modal({
            show: true,
            backdrop: 'static',
            keyboard: false,
        });
    }
}

function addEventButtonClose() {
    document.getElementById('btnCloseModalBallons').addEventListener('click', () => {
        const urlBirthDay = '/upload/';
        let csrftoken = getCookie('csrftoken');
        let data = new FormData();
        data.append('notification', 'birthday');
        data.append('csrfmiddlewaretoken', $('#csrf-helper input[name="csrfmiddlewaretoken"]').attr('value'));
    
        fetch(`${urlBirthDay}`, {
            method: 'POST',
            body: data,
            credentials: 'same-origin',
            headers: { "X-CSRFToken": csrftoken },
        })
        .then(response => response.json())
        .then(data => {
            if(data.status === 'ok'){
                window.location.reload();
            }
        })
    });
}

const makeModalFootball = async (objNotification) => {
    const width = screen.width;
    let height = screen.height,
        heightModal = height * 75 / 100,
        marginDetail = heightModal * 83 / 100,
        strOtherStyles = '';
    if (width < 820) {
        heightModal = height * 45 / 100;
        marginDetail = heightModal * 80 / 100;
        strOtherStyles = "background: gray; padding: 10px; border-radius: 13px; text-align: center;";
    }


    const element = `   <div class="modal fade" id="modalFootball" tabindex="-1" role="dialog" aria-labelledby="modalFootball" aria-hidden="true">
                            <div class="modal-dialog modal-xl" role="document">
                                <div class="modal-content modalContainerFootball" style="background: no-repeat center center; background-image: url('${objNotification.url_imagen}'); background-size: 100% 100%;">
                                    <div class="modal-header" style='height: 80px;'>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close" id="btnCloseModalFootball">
                                            Cerrar
                                        </button>
                                    </div>
                                    <div class="modal-body" style='height: ${heightModal}px;'>
                                        <div id="cntBodyFootball" style="font-weight: bold; color: white; float: right; margin-top: ${marginDetail}px; margin-left: 10px; text-align: center; ${strOtherStyles}"></div>
                                        <div style="margin-top: ${marginDetail}px; ${strOtherStyles}">
                                            <a rel="noopener noreferrer" href="#" class="simple-text logo-mini" style='font-weight:bold; color:white;'>
                                                <img src="/static/assets/img/mundo.png" class="img-sidebar" alt="Logo">
                                                Grupo Buena ©
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
    document.body.innerHTML += element;
};

const makeElementsCounterFootball = async (objNotification) => {
    document.getElementById('cntBodyFootball').innerHTML = `
                            <p style="font-size: 25px; margin:0px;">${objNotification.titulo}</p>
                            <p style="font-size: 18px;">Faltan
                                <span id="days"></span> días  <span id="hours"></span> horas  <span id="minutes"></span> minutos  <span id="seconds"></span> segundos para inscribirte.
                            </p>
                            <a rel="noopener noreferrer" target="_blank" href="https://api.whatsapp.com/send/?phone=50230495458&text=Quiero+unirme+a+la+quiniela+por+favor!&type=phone_number&app_absent=0" class="simple-text logo-mini" style='font-weight:bold; font-size:15px; color:white;'>
                                <i class="fab fa-whatsapp-square"></i>
                                Click aquí para mas información.
                            </a>`;
    return true;
};

const makeCounterFootball = async () => {
    const DATE_TARGET = new Date('11/20/2022 10:01 AM');
    const SPAN_DAYS = document.querySelector('span#days');
    const SPAN_HOURS = document.querySelector('span#hours');
    const SPAN_MINUTES = document.querySelector('span#minutes');
    const SPAN_SECONDS = document.querySelector('span#seconds');
    const MILLISECONDS_OF_A_SECOND = 1000;
    const MILLISECONDS_OF_A_MINUTE = MILLISECONDS_OF_A_SECOND * 60;
    const MILLISECONDS_OF_A_HOUR = MILLISECONDS_OF_A_MINUTE * 60;
    const MILLISECONDS_OF_A_DAY = MILLISECONDS_OF_A_HOUR * 24

    function updateCountdown() {
        const NOW = new Date()
        const DURATION = DATE_TARGET - NOW;
        const REMAINING_DAYS = Math.floor(DURATION / MILLISECONDS_OF_A_DAY);
        const REMAINING_HOURS = Math.floor((DURATION % MILLISECONDS_OF_A_DAY) / MILLISECONDS_OF_A_HOUR);
        const REMAINING_MINUTES = Math.floor((DURATION % MILLISECONDS_OF_A_HOUR) / MILLISECONDS_OF_A_MINUTE);
        const REMAINING_SECONDS = Math.floor((DURATION % MILLISECONDS_OF_A_MINUTE) / MILLISECONDS_OF_A_SECOND);
        SPAN_DAYS.textContent = REMAINING_DAYS;
        SPAN_HOURS.textContent = REMAINING_HOURS;
        SPAN_MINUTES.textContent = REMAINING_MINUTES;
        SPAN_SECONDS.textContent = REMAINING_SECONDS;
    }

    updateCountdown();
    setInterval(updateCountdown, MILLISECONDS_OF_A_SECOND);
};

const getAllInfoFootball = async () => {
    let formData = new FormData(),
        csrfToken = getCookie('csrftoken'),
        arrReturn = [];
    formData.append('csrfmiddlewaretoken', csrfToken);

    let strUrl =  window.location.href;
    strUrl = strUrl.replace(window.location.pathname, '/core/notificaciones/football');
    const response = await fetch(strUrl, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status && Object.keys(data.data).length > 0) {
        arrReturn = data.data[0];
    }
    return arrReturn;
};

const addEventDoneNotification = async (objNotification) => {
    document.getElementById('btnCloseModalFootball').addEventListener('click', async () => {
        let formData = new FormData(),
            csrfToken = getCookie('csrftoken');
        formData.append('csrfmiddlewaretoken', csrfToken);
        formData.append('notification', objNotification.id);

        let strUrl =  window.location.href;
        strUrl = strUrl.replace(window.location.pathname, '/core/notificaciones/done-football');
        const response = await fetch(strUrl, {method: 'POST', body: formData});
        const data = await response.json();
        return !!data.status;

    });
};

const makeNotificationFootball = async () => {
    let objNotification = await getAllInfoFootball();
    if(typeof objNotification.titulo !== 'undefined' && (typeof objNotification.usuario_id !== 'undefined' && isNaN(objNotification.usuario_id))) {
        await makeModalFootball(objNotification);
        await makeElementsCounterFootball(objNotification);
        await makeCounterFootball();
        $('#modalFootball').modal({
            show: true,
            backdrop: 'static',
            keyboard: false,
        });
        await addEventDoneNotification(objNotification);
    }
};

//let makeNotification = makeNotificationFootball();