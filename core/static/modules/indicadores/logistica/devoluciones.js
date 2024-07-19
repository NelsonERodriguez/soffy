objSeries = [
    {
        name: 'Porcentaje',
        yAxis: 1,
        data: objPorcentajes,
        type: 'spline'
    },
    {
        name: 'Quincena 1',
        data: objQuincenaUno,
        type: 'column'
    },
    {
        name: 'Quincena 2',
        data: objQuincenaDos,
        type: 'column'
    }
];

const drawCharts = () => {
    Highcharts.chart('divChart', {
        chart: { type: 'column' },
        title: { text: '' },
        xAxis: {
            categories: objCategorias
        },
        yAxis: [{
            title: {
                text: 'Devoluciones totales'
            },
            stackLabels: {
                enabled: false,
                style: {
                    fontWeight: 'bold',
                    color: ( // theme
                        Highcharts.defaultOptions.title.style &&
                        Highcharts.defaultOptions.title.style.color
                    ) || 'gray'
                }
            },
        },
        {
            min: 0,
            title: {
                text: 'Porcentaje'
            },
            labels: {
                format: '{value} %'
            },
            opposite: true
        }],
        legend: {
            align: 'right',
            x: -30,
            verticalAlign: 'top',
            y: 25,
            floating: true,
            backgroundColor:
                Highcharts.defaultOptions.legend.backgroundColor || 'white',
            borderColor: '#CCC',
            borderWidth: 1,
            shadow: false
        },
        plotOptions: {
            spline: {
                dataLabels: {
                    enabled: true,
                    formatter: function(){
                        return this.y == 0 ? "0 %" : this.y+" %";
                    }
                },
                color: "transparent",
                enableMouseTracking: false,
                connectNulls: true
            },
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: true
                }
            },
            
        },
        series: objSeries,
    });

};

$(document).ready(function(){
    drawCharts();
});