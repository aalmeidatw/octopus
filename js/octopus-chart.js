(function() {
    'use strict'

    function OctopusChart(containerId, data, width, height) {
        this.containerId = containerId;
        this.data = data;
        this.width = width;
        this.height = height;

        this.scale = 10;
        this.levels = 10;
        this.center = { x: this.width / 2, y: this.height / 2 };
        this.color = d3.scale.category10();

        this.radius = Math.min(this.center.x, this.center.y);
        this.capabilities = data[0].content.map(function(i) {
            return i.capability;
        });

        this.TURN = 2 * Math.PI;
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

    OctopusChart.prototype.drawLevels = function() {
        var thiz = this;
        for (var j = 1; j < this.levels; j++) {
            var scale = this.radius * (j / this.levels);

            var translation = {
                x: (this.center.x - scale),
                y: (this.center.y - scale)
            };

            thiz.canvas.selectAll("levels")
                .data(this.capabilities).enter().append("svg:line")
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

    OctopusChart.prototype.drawLines = function(axes) {
        var thiz = this;
        axes.append("line")
            .attr({
                class: "line",
                x1: (d, i) => thiz.center.x,
                y1: (d, i) => thiz.center.y,
                x2: (d, i) => thiz.mapX(i, thiz.center.x, 1, 1),
                y2: (d, i) => thiz.mapY(i, thiz.center.y, 1, 1)
            });
    };

    OctopusChart.prototype.drawLabels = function(axes) {
        var thiz = this;
        axes.append("text").text(d => d)
            .attr({
                class: "legend",
                "text-anchor": "middle",
                dy: "0.75em",
                x: (d, i) => thiz.mapX(i, thiz.center.x, 0, 0.85) - thiz.mapX(i, 60, 0, 1, false),
                y: (d, i) => thiz.mapY(i, thiz.center.y, 0, 1) - thiz.mapY(i, 20, 0, 1, false)
            })
            .attr("transform", (d, i) => "translate(0, -10)");
    }

    OctopusChart.prototype.fadeTransition = function(polygon, opacity) {
        this.canvas.selectAll("polygon")
            .transition(200)
            .style("fill-opacity", opacity);

        if (polygon) {
            this.canvas.selectAll(polygon)
                .transition(200)
                .style("fill-opacity", .7);
        }
    }

    OctopusChart.prototype.drawArea = function(map, color) {
        var thiz = this;

        var dataValues = [];
        this.canvas.selectAll("nodes")
            .data(map, function(j, i) {
                dataValues.push([
                    thiz.center.x * (1 - (parseFloat(Math.max(j.value, 0)) / thiz.scale) * thiz.mapX(i, 1, 0, 1, false)),
                    thiz.center.y * (1 - (parseFloat(Math.max(j.value, 0)) / thiz.scale) * thiz.mapY(i, 1, 0, 1, false))
                ]);
            });
        dataValues.push(dataValues[0]);

        this.canvas.selectAll("area").data([dataValues]).enter().append("polygon")
            .style({
                stroke: color,
                fill: color
            })
            .attr({
                class: "serie",
                points: d => d.map(p => [p[0], p[1]])
            })
            .on('mouseover', function(d) {
                thiz.fadeTransition("polygon." + d3.select(this).attr("class"), 0.1);
            })
            .on('mouseout', m => thiz.fadeTransition(null, 0.25));
    }


    OctopusChart.prototype.showTooltip = function(d, tooltip, thiz) {
        tooltip
            .attr('x', parseFloat(d3.select(thiz).attr('cx')) - 10)
            .attr('y', parseFloat(d3.select(thiz).attr('cy')) - 5)
            .text(d3.format('')(d.value))
            .transition(100)
            .style('opacity', 1);
    };

    OctopusChart.prototype.hideTooltip = function(tooltip) {
        tooltip
            .transition(100)
            .style('opacity', 0);
    };


    OctopusChart.prototype.drawNodes = function(map, color) {
        var thiz = this;
        var tooltip = this.canvas.append('text').attr("class", tooltip);

        this.canvas.selectAll("nodes").data(map).enter().append("svg:circle")
            .attr({
                class: "radar-chart-serie-node",
                r: 5,
                cx: (j, i) => thiz.center.x * (1 - (Math.max(j.value, 0) / thiz.scale) * thiz.mapX(i, 1, 0, 1, false)),
                cy: (j, i) => thiz.center.y * (1 - (Math.max(j.value, 0) / thiz.scale) * thiz.mapY(i, 1, 0, 1, false)),
                "data-id": j => j.axis
            })
            .style({
                fill: color,
                "fill-opacity": .8
            })
            .on('mouseover', function(d) {
                thiz.showTooltip(d, tooltip, this);
            })
            .on('mouseout', () => thiz.hideTooltip(tooltip));
    }

    OctopusChart.prototype.drawAxes = function() {
        var axes = this.canvas.selectAll("axes")
            .data(this.capabilities)
            .enter()
            .append("g")
            .attr("class", "axis");

        this.drawLines(axes);
        this.drawLabels(axes);
    };

    OctopusChart.prototype.draw = function() {
        this.canvas = d3.select(this.containerId)
            .append("svg")
            .attr("width", this.width + 200)
            .attr("height", this.height + 100)
            .append("g")
            .attr("transform", "translate(80,30)");

        this.drawLevels();
        this.drawAxes()

        var thiz = this;
        this.data.forEach(function(map, index) {
            thiz.drawArea(map.content, thiz.color(index));
            thiz.drawNodes(map.content, thiz.color(index));
        });
    }
    window.OctopusChart = OctopusChart;
})();
