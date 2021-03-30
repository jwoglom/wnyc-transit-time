
var layer,mblayer, map, hex;
function updateHash(){
    var center = map.getCenter();
    var zoom = map.getZoom();
    location.hash = '#' + center.lat.toFixed(5) + ',' + center.lng.toFixed(5) + ',' + zoom + ',' + hex;
    $('.hashview').html('&lt;iframe frameborder="0" scrolling ="no" src="https://project.wnyc.org/transit-time/index.html{{hash}}" width="100%" height="785" &gt;&lt;/iframe&gt;'.replace("{{hash}}",location.hash));

}
function getColor(minutes){
    if (minutes < 10)
    {
        return '#f46d6c';
    }
    else if (minutes < 15)
    {
        return '#fda36c';

    }
    else if (minutes < 20)
    {
        return '#fedc6c';

    }
    else if (minutes < 30)
    {
        return '#d4f470';

    }
    else if (minutes < 40)
    {
        return '#a7f49a';

    }
    else if (minutes < 50)
    {
        return '#85ffe0';

    }
    else if (minutes < 60)
    {
        return '#6fcfff';

    }
    else if (minutes < 75)
    {
        return '#6d91f3';

    }
    else if (minutes < 90)
    {
        return '#6b69e8';

    }
    return '#7c7dbb';


}
function selectHex(num){
    if (num === undefined || num === null) {
        num = 747; // Default selection on load
    }
 
    if (num == 1789 || num == 1732)
    {
        // Deal with Bronx Zoo oddities
        num = 1847;
    }
    hex = num;
    updateHash();
    $.getJSON('data/json/' + num + '.json?nocache=' + Math.random(), function(data){
        _.each(layer._layers, function(hex){
            var num = hex.feature.properties.num;

            if (num == 1789 || num == 1732)
            {
                // Streets we call the Zoo
                num = 1847;
            }
            if (_.has(data, num))
            {
                hex.setStyle({
                    fill: true,
                    fillColor: getColor(data[num]),
                    fillOpacity: 1

                });
            }
            else
            {
                hex.setStyle({
                    fillOpacity: 0

                });
            }


        });

    });
}
function clickHandler(e){
    selectHex(e.target.feature.properties.num);
}
function geocode(){
    var address = $('#zoombox').val();
    if (address.toLowerCase().indexOf('new york') === -1 && address.toLowerCase().indexOf('nyc') === -1 && parseInt(address.substr(-5)) === NaN)
        address += ', new york ny';
    var url = 'https://open.mapquestapi.com/nominatim/v1/search?key=nqdAiXfAZX7VseX26ox9T4Bz20GAAcHE&format=json&json_callback=?&limit=1&location=New York, NY&q=' + address;
    url = encodeURI(url);

    $.getJSON(url, function(data){
        if (!_.has(data,0)){
            // Not valid address
            return;
        }

        var lat = data[0].lat;
        var lon = data[0].lon;

        var whichHex = leafletPip.pointInLayer([lon, lat],  layer, true);
        map.panTo([lat, lon]);
        if (whichHex.length == 0)
        {
            return;
        }
        selectHex(whichHex[0].feature.properties.num);




    });


}
function initialize_map(){
    L.mapbox.accessToken = 'pk.eyJ1IjoiandvZ2xvbSIsImEiOiJja212OTM1N2gwMnVvMm9sZG05Z251dHE1In0._jzGH6j8lD9SSxG4OEAEwg';

    map = new L.mapbox.map('map', null,{
        center: new L.LatLng(40.72280, -73.95464),
        zoom: 12,
        attributionControl: false,
        scrollWheelZoom: false
    });
    


    var whichFeature = 1;
    $.getJSON('data/nyc_hexes.topojson', function(data){
        layer = L.geoJson(topojson.feature(data, data.objects['nyc_hexes_2000ft_4326']),{
        style: {
            fill: true,
            fillOpacity: 0,
            stroke: false,
            zIndex: 2
        },
        onEachFeature: function (feature, layer) {
            feature.properties.num = whichFeature;
            layer.on('click', clickHandler);
            whichFeature++;
        }
        
        });
        /*var tileId = 'jkeefe.map-id6ukiaw';
        mblayer = new L.mapbox.tileLayer(tileId,
		{tileSize: 512,
		zoomOffset: -1,
		id: tileId});
        mblayer.addTo(map);
        */
	map.addLayer(L.mapbox.styleLayer('mapbox://styles/mapbox/streets-v11').setOpacity(0.5));
	map.addLayer(layer, true ); // Add at bottom
	

	map.on('click', function(e){
            var whichHex = leafletPip.pointInLayer(e.latlng, layer, true);
            if (whichHex.length == 0)
            {
                return;
            }
            $('#zoombox').val("");
            selectHex(whichHex[0].feature.properties.num);
            

        });
        if (location.hash)
        {
            var splithash = location.hash.substr(1).split(",");
            var center = new L.LatLng(splithash[0],splithash[1]);
            var zoom = splithash[2];
            map.setView(center, zoom);
            selectHex(splithash[3]);
            

        }
        else
        {
            // Don't select any
        }

    });

    $('#zoombutton').click(geocode);
    $('#zoombox').keydown(function(event){
        if(event.which == 13)
        {
            // Enter key
            geocode();
        }
    });
    map.on('moveend zoomend', function(){
        updateHash();

    });



}
$(document).ready(function(){
    var selector = $('#headerTop, #legend, #tools, #headerBottom');
    var mapHeight = $(document).height();

    selector.each(function(i, elt){
        var $elt = $(elt);
        if ($elt.is(":visible"))
        {
            mapHeight -= $elt.outerHeight(true);
        }

    });

    $('#map').height(mapHeight);
    initialize_map();



});
