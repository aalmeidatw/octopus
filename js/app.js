var colorscale = d3.scale.category10();

var d = []

$.getJSON("test/data.json", function(json) {
    d = json;
    var octo = new OctopusChart("#chart", d, 450, 450);
    octo.draw();
}).error(function(jqXHR, textStatus, errorThrown) {
    console.log(errorThrown);
    console.log(textStatus);
});

$('#loadButton').click(function() {
    $('#files').click();
});

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    f = files[0];
    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function(theFile) {
        return function(e) {
            // Render thumbnail.
            json = JSON.parse(e.target.result);
            OctopusChart2.draw("#chart", json);
        };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsText(f);
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
