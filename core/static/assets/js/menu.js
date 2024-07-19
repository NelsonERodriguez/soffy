$('.fixed-plugin .img-holder').click( () => {
    let sidebar = $('.sidebar');
    let sidebar_img_container = sidebar.find('.sidebar-background');
    $(this).parent('li').siblings().removeClass('active');
    $(this).parent('li').addClass('active');
    let new_image = $(this).find("img").attr('src');
    
    sidebar_img_container.fadeOut('fast', () => {    
        sidebar_img_container.css('background-image', `url(${new_image})`);
        sidebar_img_container.fadeIn('fast');        
    });

    new_image = $('.fixed-plugin li.active .img-holder').find("img").attr('src');
    sidebar_img_container.css('background-image', `url(${new_image})`);
} );