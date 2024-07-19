const cntGlobal = document.getElementById('menuGlobalCustomStyles');
$sidebar = $('.sidebar');
$sidebar_img_container = $sidebar.find('.sidebar-background');
$full_page = $('.full-page');
$sidebar_responsive = $('body > .navbar-collapse');

const saveCustomStyleMenu = async (strOption, strValue) => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', csrfTokenFP);

    if (strOption == 'background-menu') {
        formData.append('background_shadow', strValue);
    } else if (strOption == 'color-option-menu') {
        formData.append('background_color', strValue);
    } else if (strOption == 'background_image') {
        formData.append('show_image', strValue);
    } else if (strOption == 'image') {
        formData.append('image', strValue);
    }
    const response = await fetch(urlSaveConfigMenu, {method: 'POST', body: formData});
    const data = await response.json();
    if (!data.status)
        console.error(data.message);

    close_loading();
};

const drawImages = async () => {
    const header = `<li class="header-title">Imágenes</li>`;
    cntGlobal.innerHTML += header;

    const objImages = [
        {'url_image': '/static/assets/img/sidebar-1.jpg', 'id': 1},
        {'url_image': '/static/assets/img/sidebar-2.jpg', 'id': 2},
        {'url_image': '/static/assets/img/sidebar-3.jpg', 'id': 3},
        {'url_image': '/static/assets/img/sidebar-4.jpg', 'id': 4},
    ];
    let userImage = `/static/${objGlobalCustomStyles.response['image']}`;
    objImages.map(data => {
        const image = data.url_image;
        let active = (image == userImage) ? 'active' : '';
        const element = `   <li class="${active}">
                                <a class="img-holder switch-trigger" href="javascript:void(0)">
                                    <img src="${data.url_image}" alt="Imagen para fondo" int-image='${data.id}'>
                                </a>
                            </li>`;
        cntGlobal.innerHTML += element;
    });
    if (objGlobalCustomStyles.response['show-image']) {
        $sidebar_background = $('.sidebar-background');
        $sidebar_background.css('background-image', 'url("' + userImage + '")');
        $sidebar_background.fadeIn('fast');
    }
}

const drawBackgroundColorMenu = async () => {
    const objColors = objGlobalCustomStyles['background-menu'],
        header = `  <li class="header-title">Fondo del menú</li>
                    <li class="adjustments-line">
                        <a href="javascript:void(0)" class="switch-trigger background-color">
                            <div class="ml-auto mr-auto" id='cntColorMenus'></div>
                            <div class="clearfix"></div>
                        </a>
                    </li>`;
    cntGlobal.innerHTML += header;

    objColors.map(data => {
        const strActive = (objGlobalCustomStyles['response']['background-menu'] == data.id) ? 'active' : '';
        let element = `<span class='badge filter badge-${data.color} ${strActive}' data-background-color-id='${data.id}' data-background-color='${data.color}' ></span>`;
        document.getElementById('cntColorMenus').innerHTML += element;
        if (strActive === 'active') {
            if ($sidebar.length != 0)
                $sidebar.attr('data-background-color', data.color);
        }
    });
};

const drawOptionColorMenu = async () => {
    const objColors = objGlobalCustomStyles['colors-menu'],
        header = `  <li class="header-title">Color del Menú</li>
                    <li class="adjustments-line">
                        <a href="javascript:void(0)" class="switch-trigger active-color">
                            <div class="badge-colors ml-auto mr-auto" id='cntColorOptionMenuGlobal'></div>
                            <div class="clearfix"></div>
                        </a>
                    </li>`;
    cntGlobal.innerHTML += header;

    objColors.map(data => {
        const strActive = (objGlobalCustomStyles['response']['color-option-menu'] == data.id) ? 'active' : '';
        let element = `<span class="badge filter badge-${data.color} ${strActive}" data-color="${data.color}" data-color-id='${data.id}'></span>`;
        document.getElementById('cntColorOptionMenuGlobal').innerHTML += element;
        if (strActive === 'active') {
            if ($sidebar.length != 0)
                $sidebar.attr('data-color', data.color);
            if ($full_page.length != 0)
                $full_page.attr('filter-color', data.color);
            if ($sidebar_responsive != 0)
                $sidebar_responsive.attr('data-color', data.color);
        }
    });
};

const drawShowImage = async () => {
    const strChecked = (objGlobalCustomStyles.response['show-image']) ? 'checked' : '';
    const header = `<li class="adjustments-line">
                        <a href="javascript:void(0)" class="switch-trigger">
                            <p>Mostrar Imágenes</p>
                            <label class="switch-mini ml-auto">
                            <div class="togglebutton switch-sidebar-image">
                                <label>
                                    <input type="checkbox" ${strChecked}>
                                    <span class="toggle"></span>
                                </label>
                            </div>
                            </label>
                            <div class="clearfix"></div>
                        </a>
                    </li>`;
    cntGlobal.innerHTML += header;
    if (strChecked === 'checked')
        await drawMenuWithImage();
    else
        await drawMenuWithOutImage();
};

const getGlobalAllConfigStyles = async () => {
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', csrfTokenFP);
    const response = await fetch(urlGetConfigMenu, {method: 'POST', body: formData});
    const data = await response.json();
    if(data.status)
        objGlobalCustomStyles = data;
    else
        console.error(data.message, 'getGlobalAllConfigStyles');
    return true;
};

const drawMenuWithImage = async (boolSet = false) => {
    $full_page_background = $('.full-page-background');
    $sidebar_img_container = $sidebar.find('.sidebar-background');
    if ($sidebar_img_container.length != 0) {
        $sidebar_img_container.fadeIn('fast');
        $sidebar.attr('data-image', '#');
    }

    if ($full_page_background.length != 0) {
        $full_page_background.fadeIn('fast');
        $full_page.attr('data-image', '#');
    }
    background_image = true;
    if (boolSet)
        saveCustomStyleMenu('background_image', 1);
};

const drawMenuWithOutImage = async (boolSet = false) => {
    $full_page_background = $('.full-page-background');
    $sidebar_img_container = $sidebar.find('.sidebar-background');
    if ($sidebar_img_container.length != 0) {
        $sidebar.removeAttr('data-image');
        $sidebar_img_container.fadeOut('fast');
    }
    if ($full_page_background.length != 0) {
        $full_page.removeAttr('data-image', '#');
        $full_page_background.fadeOut('fast');
    }
    background_image = false;
    if (boolSet)
        saveCustomStyleMenu('background_image', 0);
};

const addDefaultEvents = async () => {
    window_width = $(window).width();
    fixed_plugin_open = $('.sidebar .sidebar-wrapper .nav li.active a p').html();

    if (window_width > 767 && fixed_plugin_open == 'Dashboard') {
        if ($('.fixed-plugin .dropdown').hasClass('show-dropdown'))
            $('.fixed-plugin .dropdown').addClass('open');
    }

    $('.fixed-plugin a').click(function (event) {
        if ($(this).hasClass('switch-trigger')) {
            if (event.stopPropagation)
                event.stopPropagation();
            else if (window.event)
                window.event.cancelBubble = true;
        }
    });

    $('.fixed-plugin .active-color span').click(function () {
        $full_page_background = $('.full-page-background');
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
        var new_color = $(this).data('color');
        if ($sidebar.length != 0)
            $sidebar.attr('data-color', new_color);
        if ($full_page.length != 0)
            $full_page.attr('filter-color', new_color);
        if ($sidebar_responsive.length != 0)
            $sidebar_responsive.attr('data-color', new_color);
        let a = $(this).data('color-id');
        saveCustomStyleMenu('color-option-menu', a);
    });

    $('.fixed-plugin .background-color .badge').click(function () {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
        var new_color = $(this).data('background-color');
        if ($sidebar.length != 0)
            $sidebar.attr('data-background-color', new_color);
        let a = $(this).data('background-color-id');
        saveCustomStyleMenu('background-menu', a);
    });

    $('.fixed-plugin .img-holder').click(function () {
        $full_page_background = $('.full-page-background');

        $(this).parent('li').siblings().removeClass('active');
        $(this).parent('li').addClass('active');


        var new_image = $(this).find("img").attr('src');
        let intImage = $(this).find("img").attr('int-image');
        saveCustomStyleMenu('image', intImage);

        if ($sidebar_img_container.length != 0 && $('.switch-sidebar-image input:checked').length != 0) {
            $sidebar_img_container.fadeOut('fast', function () {
                $sidebar_img_container.css('background-image', 'url("' + new_image + '")');
                $sidebar_img_container.fadeIn('fast');
            });
        }

        if ($full_page_background.length != 0 && $('.switch-sidebar-image input:checked').length != 0) {
            var new_image_full_page = $('.fixed-plugin li.active .img-holder').find('img').data('src');

            $full_page_background.fadeOut('fast', function () {
                $full_page_background.css('background-image', 'url("' + new_image_full_page + '")');
                $full_page_background.fadeIn('fast');
            });
        }

        if ($('.switch-sidebar-image input:checked').length == 0) {
            var new_image = $('.fixed-plugin li.active .img-holder').find("img").attr('src');
            var new_image_full_page = $('.fixed-plugin li.active .img-holder').find('img').data('src');

            $sidebar_img_container.css('background-image', 'url("' + new_image + '")');
            $full_page_background.css('background-image', 'url("' + new_image_full_page + '")');
        }

        if ($sidebar_responsive.length != 0) {
            $sidebar_responsive.css('background-image', 'url("' + new_image + '")');
        }
    });

    $('.switch-sidebar-image input').change(async function () {
        $full_page_background = $('.full-page-background');
        $sidebar_img_container = $sidebar.find('.sidebar-background');
        $input = $(this);
        if ($input.is(':checked')) {
            await drawMenuWithImage(true);
        } else {
            await drawMenuWithOutImage(true);
        }
    });

    $('.switch-sidebar-mini input').change(function () {
        console.log('c');
        $body = $('body');

        $input = $(this);

        if (md.misc.sidebar_mini_active == true) {
            $('body').removeClass('sidebar-mini');
            md.misc.sidebar_mini_active = false;

            $('.sidebar .sidebar-wrapper, .main-panel').perfectScrollbar();

        } else {

            $('.sidebar .sidebar-wrapper, .main-panel').perfectScrollbar('destroy');

            setTimeout(function () {
                $('body').addClass('sidebar-mini');

                md.misc.sidebar_mini_active = true;
            }, 300);
        }

        var simulateWindowResize = setInterval(function () {
            window.dispatchEvent(new Event('resize'));
        }, 180);

        setTimeout(function () {
            clearInterval(simulateWindowResize);
        }, 1000);

    });
};

const drawElementsMenuCustom = async () => {
    await getGlobalAllConfigStyles();
    await drawBackgroundColorMenu();
    await drawOptionColorMenu();
    await drawShowImage();
    await drawImages();
    await addDefaultEvents();
};

document.addEventListener("DOMContentLoaded", async () => {
    await drawElementsMenuCustom();
});