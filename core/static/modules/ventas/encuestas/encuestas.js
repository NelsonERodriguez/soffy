
function fntEnviarEncuesta(){

    if ( $.trim($("#hdnOfrecio")).length == 0 || $.trim($("#hdnValor")).length == 0 || $.trim($("#hdnEncontro")).length == 0 || $.trim($("#hdnRecomendar")).length == 0 ){
        alert_nova.showNotification('No has respondido todas las preguntas de la encuesta', "warning", "danger");
        return false;
    }

    let csrftoken = getCookie('csrftoken');
    let formElement = document.getElementById("frmEncuesta");
    const form = new FormData(formElement);
    open_loading();

    fetch(strUrlSetValor, {
        method: 'POST',
        headers: { "X-CSRFToken": csrftoken },
        body: form
    })
    .then(response => response.json())
    .then( data => {

        close_loading();

        if (data.status) {

            setTimeout(() => {
                swal({
                    title: "Gracias por su opinión.",
                    //text: "I will close in 2 seconds.",
                    timer: 2000,
                    showConfirmButton: false
                  }).catch(swal.noop)
            }, 1000);

            setTimeout(() => {
                window.location.reload();
            }, 2000);

        }
        else {
            alert_nova.showNotification("Ocurrió un error, intente nuevamente.", "warning", "danger");
        }

        close_loading();
    })
    .catch((error) => {
        close_loading();
        alert_nova.showNotification("Ocurrió un error, intente nuevamente.", "warning", "danger");
        console.error(error);
    });
    

}

$(document).ready(function(){
    $("#frmEncuesta").submit(function(e){
        e.preventDefault();
        fntEnviarEncuesta();
    })

    $("i[id^='iconPre']").click(function(){
        let strId = $(this).attr("id");
        let arrSplit = strId.split("_");

        $("i[id^='iconPre_"+arrSplit[1]+"_']").each(function(){
            $(this).removeClass('hideEmoji');
            let strId2 = $(this).attr("id");
            if( strId != strId2 ){
                $(this).css('color', 'gray' );
            }
            else{
                $(this).addClass('hideEmoji');
                $(this).css('color', $(this).data('color') );
            }
        });

        if( arrSplit[1] == "3" || arrSplit[1] == "4" ){
            if( arrSplit[2] == "2" ){
                $("#divPorque"+arrSplit[1]).removeClass("d-none");
            }
            else{
                $("#divPorque"+arrSplit[1]).addClass("d-none");
            }
        }

        $("#"+$(this).data("objeto")).val( $(this).data("value") )
    });

    
});