// drawElementsInMenu();

async function drawElementsInMenu() {
    await getNotifications();
    await getMessages();
}

async function getNotifications() {
    const objNotifications = [];
    await drawButtonNotificacion(objNotifications);
    await drawDetailNotification(objNotifications);
}

async function drawButtonNotificacion(objNotifications) {
    const quantityNotifications = Object.keys(objNotifications).length;
    const strClass = ( (quantityNotifications * 1) > 0) ? 'shakeNotification' : '';
    /*<div class="dropdown-item">
        <p class="dropdown-notification-text">Esta es la prueba de un texto para ver que tan largo puedo ser</p>
    </div>
    <div class="dropdown-item">
        <p class="dropdown-notification-text">Esta es la prueba de un texto para ver que tan largo puedo ser</p>
    </div>
    <div class="dropdown-item">
        <p class="dropdown-notification-text">Esta es la prueba de un texto para ver que tan largo puedo ser</p>
    </div>
    <div class="dropdown-item">
        <p class="dropdown-notification-text">Esta es la prueba de un texto para ver que tan largo puedo ser</p>
    </div>
    <div class="dropdown-item">
        <p class="dropdown-notification-text">Esta es la prueba de un texto para ver que tan largo puedo ser</p>
    </div>
    <div class="dropdown-item">
        <p class="dropdown-notification-text">Esta es la prueba de un texto para ver que tan largo puedo ser</p>
    </div>*/
    document.getElementById('notificationGlobalMenu').innerHTML = `   <a class="nav-link notificationMessageGlobalContent ${strClass}" id="navbarDropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <i class="material-icons">notifications</i>
                            <span class="notification notification-system">${quantityNotifications}</span>
                            <p class="d-lg-none d-md-block">
                                Notificaciones
                            </p>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownMenuLink" id="cntGlobalDetailNotifications">

                        </div>`;
}

async function drawDetailNotification(objNotifications) {
    for(let key in objNotifications) {
        const data = objNotifications[key];

        const element = `   <a class='dropdown-item' href='${data.url}'>
                                <i class='material-icons'>${data.icon}</i>
                                ${data.message}
                            </a>`;

        document.getElementById('cntGlobalDetailNotifications').innerHTML += element;
    }
}

const drawButtonCustomMenu = async () => {
    const quantityNotifications = Object.keys([]).length;
    const element = `   <a class="nav-link notificationMessageGlobalContent" id="navbarDropdownMenuMessages" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <i class="material-icons">dashboard-customize</i>
                            <span class="notification notification-message">${quantityNotifications}</span>
                                <p class="d-lg-none d-md-block">
                                Mensajes
                            </p>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownMenuMessages" id="cntGlobalDetailMessages"></div>`;
    document.getElementById('messagesGlobalMenu').innerHTML += element;
};

async function getMessages() {
    const objMessages = [];
    await drawButtonMessages(objMessages);
    await drawDetailMessages(objMessages);
}

async function drawButtonMessages(objNotifications) {
    const quantityNotifications = Object.keys(objNotifications).length;
    const element = `   <a class="nav-link notificationMessageGlobalContent" id="navbarDropdownMenuMessages" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <i class="material-icons">chat</i>
                            <span class="notification notification-message">${quantityNotifications}</span>
                                <p class="d-lg-none d-md-block">
                                Mensajes
                            </p>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownMenuMessages" id="cntGlobalDetailMessages"></div>`;
    document.getElementById('messagesGlobalMenu').innerHTML += element;
}

async function drawDetailMessages(objNotifications) {
    for(let key in objNotifications) {
        const data = objNotifications[key];

        const element = `   <a class='dropdown-item' href='${data.url}'>
                                <i class='material-icons'>${data.icon}</i>
                                ${data.message}
                            </a>`;

        document.getElementById('cntGlobalDetailMessages').innerHTML += element;
    }
}

const makeCounterFootballNavigation = async (boolMinutes = true, boolHours = true) => {
    const DATE_TARGET = new Date('11/18/2022 4:00 PM');
    const SPAN_DAYS = document.querySelector('span#days-navigation');
    if(boolHours) {
        const SPAN_HOURS = await document.querySelector('span#hours-navigation');
    }
    if(boolMinutes){
        const SPAN_MINUTES = document.querySelector('span#minutes-navigation');
        const SPAN_SECONDS = document.querySelector('span#seconds-navigation');
    }

    const MILLISECONDS_OF_A_SECOND = 1000;
    const MILLISECONDS_OF_A_MINUTE = MILLISECONDS_OF_A_SECOND * 60;
    const MILLISECONDS_OF_A_HOUR = MILLISECONDS_OF_A_MINUTE * 60;
    const MILLISECONDS_OF_A_DAY = MILLISECONDS_OF_A_HOUR * 24

    function updateCountdownNavigation() {
        const NOW = new Date();
        const DURATION = DATE_TARGET - NOW;
        const REMAINING_DAYS = Math.floor(DURATION / MILLISECONDS_OF_A_DAY);
        const REMAINING_HOURS = Math.floor((DURATION % MILLISECONDS_OF_A_DAY) / MILLISECONDS_OF_A_HOUR);
        const REMAINING_MINUTES = Math.floor((DURATION % MILLISECONDS_OF_A_HOUR) / MILLISECONDS_OF_A_MINUTE);
        const REMAINING_SECONDS = Math.floor((DURATION % MILLISECONDS_OF_A_MINUTE) / MILLISECONDS_OF_A_SECOND);
        SPAN_DAYS.textContent = REMAINING_DAYS;
        if(boolHours){
            if(typeof SPAN_HOURS == 'undefined') {
                document.querySelector('span#hours-navigation').textContent = REMAINING_HOURS;
            }
            else {
                SPAN_HOURS.textContent = REMAINING_HOURS;
            }
        }
        if(boolMinutes){
            if(typeof SPAN_MINUTES == 'undefined') {
                document.querySelector('span#minutes-navigation').textContent = REMAINING_MINUTES;
                document.querySelector('span#seconds-navigation').textContent = REMAINING_SECONDS;
            }
            else {
                SPAN_MINUTES.textContent = REMAINING_MINUTES;
                SPAN_SECONDS.textContent = REMAINING_SECONDS;
            }
        }
    }

    updateCountdownNavigation();
    setInterval(updateCountdownNavigation, MILLISECONDS_OF_A_SECOND);
};

const callCounterFootballNavigation = async () => {
    if (screen.width >= 1375) {
        await makeCounterFootballNavigation();
    }
    else if(screen.width >= 1085 && screen.width < 1375) {
        await makeCounterFootballNavigation(false, true);
        document.getElementById('str-minutes-navigation').style.display = 'none';
        document.getElementById('str-seconds-navigation').style.display = 'none';
    }
    else if(screen.width < 1085) {
        await makeCounterFootballNavigation(false, false);
        document.getElementById('str-hours-navigation').style.display = 'none';
        document.getElementById('str-minutes-navigation').style.display = 'none';
        document.getElementById('str-seconds-navigation').style.display = 'none';
    }
};

const makeRedirectToMessage = () => {
    document.getElementById('elementANavFootball').click();
};

//callCounterFootballNavigation();