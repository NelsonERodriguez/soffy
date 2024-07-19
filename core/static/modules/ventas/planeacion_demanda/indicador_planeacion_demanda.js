const reportPowerBiIndicadoresDeVentas = () => {
    // Grab the reference to the div HTML element that will host the report
    let embedContainer = $('#embedContainer')[0];

    let txtEmbedUrl = 'https://app.powerbi.com/reportEmbed?reportId=' + reportid_planeacion_demanda + '&groupId=' + groups_planeacion_demanda + '&config=eyJjbHVzdGVyVXJsIjoiaHR0cHM6Ly9XQUJJLVVTLU5PUlRILUNFTlRSQUwtcmVkaXJlY3QuYW5hbHlzaXMud2luZG93cy5uZXQiLCJlbWJlZEZlYXR1cmVzIjp7Im1vZGVybkVtYmVkIjp0cnVlfX0%3d';

    let config = {
        type: 'report',
        tokenType: 1,
        accessToken: token_planeacion_demanda,
        embedUrl: txtEmbedUrl,
        id: reportid_planeacion_demanda,
        permissions: 7,
        settings: {
            panes: {
                filters: {
                    visible: true
                },
                pageNavigation: {
                    visible: true
                }
            }
        }
    };


    // Create report
    let report = powerbi.embed(embedContainer, config);

    report.off("loaded");

    // Report.on will add an event handler which prints to Log window.
    report.on("loaded", function () {
        console.log("Loaded");
    });

    // Report.off removes a given event handler if it exists.
    report.off("rendered");

    // Report.on will add an event handler which prints to Log window.
    report.on("rendered", function () {
        console.log("Rendered");
    });

    report.on("error", function (event) {
        console.log(event.detail);

        if (event.detail.message == 'TokenExpired') {
            window.location.href = urlpower;
        }

        report.off("error");
    });

    report.off("saved");
    report.on("saved", function (event) {
        if (event.detail.saveAs) {
            console.log('In order to interact with the new report, create a new token and load the new report');
        }
    });
};
open_loading();
setTimeout(()=> {
    reportPowerBiIndicadoresDeVentas();
    close_loading();
}, 3500)

