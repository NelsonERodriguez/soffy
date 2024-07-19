const getMenu = () => {
    let csrftoken = getCookie('csrftoken');
    console.log(csrftoken);
    let strUrl = window.location.href;
    const strUrlGet = strUrl.replace(window.location.pathname, '/core/interfaces/get_links/' + intIDUser);

    fetch(strUrlGet, {
        method: 'POST',
        headers: {"X-CSRFToken": csrftoken},
    })
        .then(response => response.json())
        .then((data) => {
            if (Object.keys(data).length > 0) {
                makeObjMenu(data);
            }
        })
        .catch((error) => {
            console.error(error);
        });
}

const makeObjMenu = async (objData) => {
    const objMenu = [];
    for (let key in objData) {
        const data = objData[key];
        if (typeof objMenu[data.modulo] == 'undefined') {
            objMenu[data.modulo] = [];
            objMenu[data.modulo].name = data.modulo;
            objMenu[data.modulo].modulo = data.link.split('/')[0];
            objMenu[data.modulo].icon = data.icono;
            objMenu[data.modulo].sub_modulos = [];
            objMenu[data.modulo].windows = [];
        }
        let objWindow = {
            'name': data.ventana,
            'icon': data.icono,
            'route': data.link,
        };

        if (data?.sub_modulo && data.sub_modulo !== "" && typeof objMenu[data.modulo]['sub_modulos'][data.sub_modulo] == 'undefined') {
            objMenu[data.modulo]['sub_modulos'][data.sub_modulo] = [];
            objMenu[data.modulo]['sub_modulos'][data.sub_modulo].name = data.sub_modulo;
            objMenu[data.modulo]['sub_modulos'][data.sub_modulo].icon = data.icono;
            objMenu[data.modulo]['sub_modulos'][data.sub_modulo].windows = [];
        }

        if (data?.sub_modulo && data.sub_modulo !== "") objMenu[data.modulo]['sub_modulos'][data.sub_modulo]['windows'].push(objWindow);
        else objMenu[data.modulo]['windows'].push(objWindow);
    }

    drawMenu(objMenu);
};

const drawMenu = async (objMenu) => {
    for (let key in objMenu) {
        const module = objMenu[key],
            strModuleID = module.name.replaceAll(' ', '_');
        let strShow = '';
        if (window.location.pathname.split('/')[1] == module.modulo.split('/')[0]) {
            strShow = 'show';
        }

        const element = `   <li class="nav-item">
                                <a class="nav-link" data-toggle="collapse" href="#divContentMenu_${strModuleID}">
                                    <i class="material-icons"> ${module.icon} </i>
                                    <p>
                                        ${module.name}
                                        <b class="caret"></b>
                                    </p>
                                </a>
                                <div class="collapse ${strShow}" id="divContentMenu_${strModuleID}">
                                    <ul class="nav" id='contentDetailMenu_${strModuleID}'></ul>
                                </div>
                            </li>`;
        document.getElementById(`cntGlobalAllMenu`).innerHTML += element;

        await drawDetailMenu(module);
    }

    const objLink = document.querySelector(`li[class="nav-item active subMenuOption"]`);
    if (objLink) objLink.scrollIntoView(true);
};

const drawDetailMenu = async (module) => {
    const strModuleID = module.name.replaceAll(' ', '_');
    for (let k in module.sub_modulos) {
        const dSubModulo = module.sub_modulos[k];
        let strSubModuleID = '';
        if (dSubModulo?.name)
            strSubModuleID = dSubModulo.name.replaceAll(' ', '_');
        let strUrl = window.location.href;
        let strActive = '';

        if (window.location.pathname.search(dSubModulo.route) > -1) {
            strActive = 'active';
        }
        strUrl = strUrl.replace(window.location.pathname, `/${dSubModulo.route}`);
        const detail = `<li class="nav-item ${strActive} subMenuOption">
                                    <a class="nav-link" data-toggle="collapse" href="#divContentMenu_${strModuleID}_${strSubModuleID}">
                                        <i class="material-icons"> ${dSubModulo.icon} </i>
                                        <span class="sidebar-normal"> ${dSubModulo.name}
                                          <b class="caret"></b>
                                        </span>
                                    </a>
                                    <div class="collapse" id="divContentMenu_${strModuleID}_${strSubModuleID}">
                                        <ul class="nav" id='contentDetailMenu_${strModuleID}_${strSubModuleID}'></ul>
                                    </div>
                                </li>`;
        document.getElementById(`contentDetailMenu_${strModuleID}`).innerHTML += detail;
        for (let k in dSubModulo.windows) {
            const dWindow = dSubModulo.windows[k];
            let strUrl = window.location.href;
            let strActive = ''

            if (window.location.pathname.search(dWindow.route) > -1) {
                strActive = 'active';
                document.querySelector(`#divContentMenu_${strModuleID}_${strSubModuleID}`).classList.add('show');
            }
            strUrl = strUrl.replace(window.location.pathname, `/${dWindow.route}`);
            const detail = `<li class="nav-item ${strActive} subMenuOption">
                                <a class="nav-link" href="${strUrl}">
                                    <i class="material-icons"> ${dWindow.icon} </i>
                                    <span class="sidebar-normal"> ${dWindow.name} </span>
                                </a>
                            </li>`;
            document.getElementById(`contentDetailMenu_${strModuleID}_${strSubModuleID}`).innerHTML += detail;
        }
    }

    for (let k in module.windows) {
        const dWindow = module.windows[k];
        let strUrl = window.location.href;
        let strActive = ''

        if (window.location.pathname.search(dWindow.route) > -1) {
            strActive = 'active';
        }
        strUrl = strUrl.replace(window.location.pathname, `/${dWindow.route}`);
        const detail = `<li class="nav-item ${strActive} subMenuOption">
                            <a class="nav-link" href="${strUrl}">
                                <i class="material-icons"> ${dWindow.icon} </i>
                                <span class="sidebar-normal"> ${dWindow.name} </span>
                            </a>
                        </li>`;
        document.getElementById(`contentDetailMenu_${strModuleID}`).innerHTML += detail;
    }
    return true;
};

getMenu();