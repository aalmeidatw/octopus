var colorscale = d3.scale.category10();

var d = []

$.getJSON("test/data.json", function(json) {
    d = json;
    var octo = new OctopusChart("#chart", d, 450, 450);
    octo.draw();

    var colors = d3.scale.category10()
    d
        .filter(p => p.show)
        .forEach(function(map, index) {
            var table = document.getElementById("maps");
            var row = table.insertRow(0);

            var cell = row.insertCell(0);
            cell.innerHTML = '<span class="badge" style="background-color: ' + colors(index) + '">&nbsp;</span>';
            cell.className = "fit"
            row.insertCell(1).innerHTML = map.name;
            // row.insertCell(2).innerHTML = '<input type="checkbox" />';
        });

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
