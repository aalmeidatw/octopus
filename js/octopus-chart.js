function OctopusChart(containerId, data, width, height) {
    this.containerId = containerId;
    this.data = data;
    this.width = width;
    this.height = height;

    this.levels = 10;
    this.center = {
        x: this.width / 2,
        y: this.height / 2
    };

    this.radius = Math.min(this.center.x, this.center.y);

    // Constants
    this.TURN = 2 * Math.PI;

    this.capabilities = data[0].map(function(i) {
        return i.capability;
    });
}

OctopusChart.prototype.mapX = function(x, scale, pan, factor, mirror = true) {
    var length = this.capabilities.length;
    return mirror ?
        scale * (1 - factor * Math.sin((x + pan) * this.TURN / length)) :
        scale * Math.sin(x * this.TURN / length);
}

OctopusChart.prototype.mapY = function(y, scale, pan, factor, mirror = true) {
    var length = this.capabilities.length;
    return mirror ?
        scale * (1 - factor * Math.cos((y + pan) * this.TURN / length)) :
        scale * Math.cos(y * this.TURN / length);
}

OctopusChart.prototype.drawLevels = function(canvas) {
    var thiz = this;
    for (var j = 1; j < this.levels; j++) {
        var scale = this.radius * (j / this.levels);

        var translation = {
            x: (this.center.x - scale),
            y: (this.center.y - scale)
        };

        canvas.selectAll("levels")
            .data(this.capabilities)
            .enter()
            .append("svg:line")
            .attr({
                class: "level",
                x1: (d, i) => thiz.mapX(i, scale, 0, 1),
                y1: (d, i) => thiz.mapY(i, scale, 0, 1),
                x2: (d, i) => thiz.mapX(i, scale, 1, 1),
                y2: (d, i) => thiz.mapY(i, scale, 1, 1)
            })
            .attr("transform", "translate(" + translation.x + ", " + translation.y + ")");
    }
};

OctopusChart.prototype.drawLines = function(canvas) {
    var thiz = this;
    canvas.append("line")
        .attr({
            class: "line",
            x1: (d, i) => thiz.center.x,
            y1: (d, i) => thiz.center.y,
            x2: (d, i) => thiz.mapX(i, thiz.center.x, 1, 1),
            y2: (d, i) => thiz.mapY(i, thiz.center.y, 1, 1)
        });
};

OctopusChart.prototype.drawLabels = function(canvas) {
    var thiz = this;
    canvas.append("text")
        .text(d => d)
        .attr({
            class: "legend",
            "text-anchor": "middle",
            dy: "0.75em",
            x: (d, i) => thiz.mapX(i, thiz.center.x, 0, 0.85) - thiz.mapX(i, 60, 0, 1, false),
            y: (d, i) => thiz.mapY(i, thiz.center.y, 0, 1) - thiz.mapY(i, 20, 0, 1, false)
        })
        .attr("transform", (d, i) => "translate(0, -10)");
}

OctopusChart.prototype.fadeTransition = function(canvas, polygon, opacity) {
    canvas.selectAll("polygon")
        .transition(200)
        .style("fill-opacity", opacity);

    if (polygon) {
        canvas.selectAll(polygon)
            .transition(200)
            .style("fill-opacity", .7);
    }
}

OctopusChart.prototype.drawArea = function(canvas, dataValues, color) {
    var thiz = this;
    canvas.selectAll("area")
        .data(dataValues)
        .enter()
        .append("polygon")
        .style({
            stroke: color,
            fill: color
        })
        .attr({
            class: "serie",
            points: d => d.map(p => [p[0], p[1]])
        })
        .on('mouseover',function(d) {
            thiz.fadeTransition(canvas, "polygon." + d3.select(this).attr("class"), 0.1);
        })
        .on('mouseout', m => thiz.fadeTransition(canvas, null, 0.25));
}


var OctopusChart2 = {
    draw: function(id, data, options) {
        var octo = new OctopusChart(id, data, 450, 450);

        var cfg = {
            radius: 5,
            w: 450,
            h: 450,
            factor: 1,
            factorLegend: .85,
            levels: 10,
            maxValue: 10,
            radians: 2 * Math.PI,
            TranslateX: 80,
            TranslateY: 30,
            ExtraWidthX: 200,
            ExtraWidthY: 100,
            color: d3.scale.category10()
        };

        cfg.maxValue = Math.max(cfg.maxValue, d3.max(d, function(i) {
            return d3.max(i.map(function(o) {
                return o.value;
            }))
        }));
        var allAxis = (data[0].map(function(i, j) {
            return i.capability
        }));
        var total = allAxis.length;
        var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);
        var Format = d3.format('');
        d3.select(id).select("svg").remove();

        var g = d3.select(id)
            .append("svg")
            .attr("width", cfg.w + cfg.ExtraWidthX)
            .attr("height", cfg.h + cfg.ExtraWidthY)
            .append("g")
            .attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")");;

        var tooltip;

        octo.drawLevels(g);

        series = 0;

        var axis = g.selectAll(".axis")
            .data(allAxis)
            .enter()
            .append("g")
            .attr("class", "axis");

        octo.drawLines(axis);
        octo.drawLabels(axis);


        data.forEach(function(y, x) {
            dataValues = [];
            g.selectAll(".nodes")
                .data(y, function(j, i) {
                    dataValues.push([
                        cfg.w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total)),
                        cfg.h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total))
                    ]);
                });
            dataValues.push(dataValues[0]);

            octo.drawArea(g, [dataValues], cfg.color(series));
            series++;
        });

        series = 0;

        data.forEach(function(y, x) {
            g.selectAll(".nodes")
                .data(y)
                .enter()
                .append("svg:circle")
                .attr("class", "radar-chart-serie" + series)
                .attr('r', cfg.radius)
                .attr("alt", function(j) {
                    return Math.max(j.value, 0)
                })
                .attr("cx", function(j, i) {
                    dataValues.push([
                        cfg.w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total)),
                        cfg.h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total))
                    ]);
                    return cfg.w / 2 * (1 - (Math.max(j.value, 0) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total));
                })
                .attr("cy", function(j, i) {
                    return cfg.h / 2 * (1 - (Math.max(j.value, 0) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total));
                })
                .attr("data-id", function(j) {
                    return j.axis
                })
                .style("fill", cfg.color(series)).style("fill-opacity", .9)
                .on('mouseover', function(d) {
                    newX = parseFloat(d3.select(this).attr('cx')) - 10;
                    newY = parseFloat(d3.select(this).attr('cy')) - 5;

                    tooltip
                        .attr('x', newX)
                        .attr('y', newY)
                        .text(Format(d.value))
                        .transition(200)
                        .style('opacity', 1);

                    z = "polygon." + d3.select(this).attr("class");
                    g.selectAll("polygon")
                        .transition(200)
                        .style("fill-opacity", 0.1);
                    g.selectAll(z)
                        .transition(200)
                        .style("fill-opacity", .7);
                })
                .on('mouseout', function() {
                    tooltip
                        .transition(200)
                        .style('opacity', 0);
                    g.selectAll("polygon")
                        .transition(200)
                        .style("fill-opacity", cfg.opacityArea);
                })
                .append("svg:title")
                .text(function(j) {
                    return Math.max(j.value, 0)
                });

            series++;
        });
        //Tooltip
        tooltip = g.append('text')
            .style('opacity', 0)
            .style('font-family', 'sans-serif')
            .style('font-size', '13px');
    }
};
