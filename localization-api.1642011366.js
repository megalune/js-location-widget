// Create event for when the location is set
var location_set = document.createEvent('Event');
var location_clicked = document.createEvent('Event');

// Define that the event name is 'location_set'.
location_set.initEvent('location_set', true, true);
location_clicked.initEvent('location_clicked', true, true);





/*  * fires once the entire page (images or iframes), not just the DOM, is ready */
/* checks for user input. if they enter more than 2 characters, start searching for coverage*/
$( window ).on( "load", function() {
    $("#q").on("keyup", function() {
    	var scrubbed = $("#q").val().split(",",1);
        if (scrubbed[0].length > 2) {
            check_coverage();
        } else {
            // do nothing
            $("#filtered").empty();
        }
    });
});








// determine the script environment
if (window.location.href.indexOf("//dev") > -1 || window.location.href.indexOf("localhost") > -1 || window.location.href.indexOf("file:") > -1) {
    api_domain = "dev-api";
} else if (window.location.href.indexOf("//qa") > -1) {
    api_domain = "qa-api";
} else if (window.location.href.indexOf("//uat") > -1) {
    api_domain = "uat-api";
} else {
    api_domain = "prod-api";
}
var locationAPI = "https://"+api_domain+".healthalliance.org/plans/serviceArea/search?";








/*
function to take user input and check for coverage with the API
*/
var api_call;
function check_coverage(){
    if (api_call) {
        api_call.abort();
    }

    // remove all existing options
    $("#filtered").empty();
    $( "#filtered" ).append('<p class="text-center"><img src="/images/loading.gif"><br><strong>Searching...</strong></p>');

    // ajax request
    api_call = $.getJSON( locationAPI, {
        q: $("#q").val().split(",",1)[0],
        take: 50,
        serviceYear: $('#serviceYear').val()
    })
        .done(function( data ) {
            $("#filtered").empty();
            var NC = false;

            // when done, process the results
            if(data === undefined || data.length == 0){
                $( "#filtered" ).append('<p class="callout alert">We do not have policies available in the location that was entered.</p>');
            } else {
                
                data.sort(function(a, b) {
                    return a.city == b.city ? 0 : (a.city < b.city ? -1 : 1);
                });

                $.each( data, function( r, result ) {
                    if (result.state == "NC") {
                        NC = true;
                    } else {
                        if($( "#filtered" ).html() == ""){
                            $( "#filtered" ).append('<p>Please select your location:</p>');
                        }
                        var locationname = result.city + ', ' + result.state + ' ' + result.zipCode + ' (' + result.countyName + ' County)';
                        var location_slug = locationname.toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,'');

                        var choice = '<button class="button small hollow" id="' + location_slug + '" data-serviceyear="' + result.serviceYear + '" data-city="' + result.city + '" data-countyname="' + result.countyName + '" data-state="' + result.state + '" data-zipcode="' + result.zipCode + '" data-fips="' + result.fips + '" data-serviceareaids="' + result.serviceAreaIds + '" data-producttypeswithtags=\'' + JSON.stringify(result.productTypesWithTags) + '\'" data-locationname="' + locationname + '" onclick="setLocation(this)">' + locationname + '</button>';
                        $( "#filtered" ).append( choice ); 
                    }
                }); // end each
            }
            if(data.length == 50){
                $( "#filtered" ).append('<p>... additional locations available, please refine your search to narrow this list ...</p>');
            }
            if(NC){
                $( "#filtered" ).append('<div class="callout alert"><p>Health Alliance Medical Plans does not currently offer plans in North Carolina, but our partner, FirstCarolinaCare may have a plan that fits your needs.</p><p class="text-weight-demi"><a href="https://firstcarolinacare.com/">Continue to the FirstCarolinaCare Website</a></p></div>');
            }

        });
}










// put the location data in localstorage
function setLocation(l){
    localStorage.setItem('serviceyear', $(l).data('serviceyear'));
    localStorage.setItem('city', $(l).data('city'));
    localStorage.setItem('countyname', $(l).data('countyname'));
    localStorage.setItem('state', $(l).data('state'));
    localStorage.setItem('zipcode', $(l).data('zipcode'));
    localStorage.setItem('fips', $(l).data('fips'));
    localStorage.setItem('serviceareaids', $(l).data('serviceareaids'));
    localStorage.setItem('locationname', $(l).data('locationname'));
    localStorage.setItem('producttypeswithtags', JSON.stringify($(l).data('producttypeswithtags')));

    hideConditionalContent();
    showConditionalContent();
    $('#set-state').foundation('close');
    $('body').removeClass('modal-locked');

    document.dispatchEvent(location_clicked);
}







// hide conditional classes
function hideConditionalContent(){
    $('#set-state .close-button').hide();
    $('.show-alert').hide();
    $('*[class*="ha-show-for-"]').hide();
    $('*[class*=ha-hide-for]').show();
}





// show conditional classes
function showConditionalContent(){


    // state logic
    $('.ha-show-for-'+localStorage.state).show();
    $('.ha-hide-for-'+localStorage.state).hide();




    // serviceareaid logic
    if(localStorage.getItem("serviceareaids") !== null){
        var said = localStorage.serviceareaids.split(",");
        $.each( said, function( index, value ) {
            $('.ha-show-for-'+value).show();
            $('.ha-hide-for-'+value).hide();
        });
    }




    // productTypesWithTags logic
    if(localStorage.getItem("producttypeswithtags") !== null){
        var ptwt = JSON.parse(localStorage.producttypeswithtags);
        $.each( ptwt, function( product, tags ) {
            // console.log( product + ": " + tags );
            $('.ha-show-for-'+product).show();
            $('.ha-hide-for-'+product).hide();
            if(tags != "" && tags != null){
                // console.log( "iterate over: " + tags );
                $.each( tags.split(","), function( index, tag ) {
                    $('.ha-show-for-'+tag.trim()).show();
                    $('.ha-hide-for-'+tag.trim()).hide();
                });
            }
        });
    }


    // update inline location text
    $(".your_state").text(localStorage.locationname);

    // change logo if we aren't ignoring the location
    if (!$('#ignoreLocation').length) {
        if(localStorage.state == "WA"){
            $("body:not([data-brand='ha']) .logo-color").attr("src", "/images/logo-northwest.png");
            $("body:not([data-brand='ha']) .logo-color").prop("alt", "Health Alliance Northwest");
            $("body:not([data-brand='ha']) .logo-white").attr("src", "/images/logo-northwest-white.png");
            $("body:not([data-brand='ha']) .logo-white").prop("alt", "Health Alliance Northwest");
            $("brand").text("Health Alliance Northwest");
        } else{
            $("body:not([data-brand='hanw']) .logo-color").attr("src", "/images/logo.png");
            $("body:not([data-brand='hanw']) .logo-color").prop("alt", "Health Alliance");
            $("body:not([data-brand='hanw']) .logo-white").attr("src", "/images/logo-white.png");
            $("body:not([data-brand='hanw']) .logo-white").prop("alt", "Health Alliance");
            $("brand").text("Health Alliance");
        }
    }

    // let people who have a location set close the modal, else no
    $('#set-state .close-button').show();

    document.dispatchEvent(location_set);
}









/* called when the page is loaded, sets up visibility conditionals */
function location_setup(){
    hideConditionalContent();

    // setup page load, check if we have a location
    if(localStorage.getItem('locationname') != null){
        // console.log("location set in localStorage, use it");
        showConditionalContent();
    } else if ($('*[class*=ha-]').length == 0) {
        // console.log("location not set, but we don't care");
    } else {
        // force the modal
        $('#set-state').foundation('open');
        $('body').addClass('modal-locked');
    }
}












// focus on the location entry field when the modal opens
jQuery(document).on(
    'open.zf.reveal', '[data-reveal]', function () {
        $("#q").focus();
    }
);









// reset location; called manually in js console; never used by the code
function clear_location(){
    window.localStorage.clear();
    location.reload();
}