export class Visualizer
{
    constructor(svgSelector, config = {})
    {
        this.width = config.width || 600;
        this.height = config.height || 600;

        this.svg = d3.select(svgSelector)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        this.domain = {xmin: -5, xmax: 5, ymin: -5, ymax: 5};

        this.f = null;
        this.grid = {nx: 160, ny: 160, values:[]};
        this.points = [];
        this.lines = [];

        this.xScale = d3.scaleLinear();
        this.yScale = d3.scaleLinear();

        this._initLayers();
        this._initInteraction();
    }

    setDomain([xmin, xmax], [ymin, ymax])
    {
        this.domain = {xmin, xmax, ymin, ymax};

        this.xScale.domain([xmin, xmax]).range([0, this.width]);
        this.yScale.domain([ymin, ymax]).range([this.height, 0]);
        // this.xScaleInv = xScale.invert;
        // this.yScaleInv = yScale.invert;

        return this;
    }

    addCoordinateAxes()
    {
        if (this.axes) {
            this.axes.remove();
        }

        const {xmin, xmax, ymin, ymax} = this.domain;

        this.axes = this.overlayLayer.append("g").attr("class", "axes");

        this.axes.append("line")
            .attr("x1", this.xScale(xmin))
            .attr("x2", this.xScale(xmax))
            .attr("y1", this.yScale(0))
            .attr("y2", this.yScale(0))
            .attr("stroke", "black");

        this.axes.append("line")
            .attr("x1", this.xScale(0))
            .attr("x2", this.xScale(0))
            .attr("y1", this.yScale(ymin))
            .attr("y2", this.yScale(ymax))
            .attr("stroke", "black");

        return this;
    }

    setFunction(f)
    {
        const {xmin, xmax, ymin, ymax} = this.domain;

        this.f = f;

        this.grid.values = [];

        for (let j = 0; j < this.grid.ny; j++) {
            for (let i = 0; i < this.grid.nx; i++) {
                const x = xmin + (i / (this.grid.nx - 1)) * (xmax - xmin);
                const y = ymin + (j / (this.grid.ny - 1)) * (ymax - ymin);
                this.grid.values.push(f([x, y]));
            }
        }

        return this;
    }

    addHeatmap()
    {
        this.heatmapLayer.selectAll("*").remove();

        const {nx, ny, values} = this.grid;

        const [min, max] = d3.extent(values);
        const color = d3.scaleSequential(d3.interpolateRdBu)
            .domain([max, min]);

        const cellWidth = Math.ceil(this.width / nx);
        const cellHeight = Math.ceil(this.height / ny);

        this.heatmapLayer.selectAll("rect")
            .data(values)
            .join("rect")
            .attr("x", (_, i) => Math.round((i % nx) * cellWidth))
            .attr("y", (_, i) => Math.round(Math.floor(i / nx) * cellHeight))
            .attr("width", cellWidth)
            .attr("height", cellHeight)
            .attr("fill", d => color(d));

        return this;
    }

    addContours(thresholds)
    {
        const {nx, ny, values} = this.grid;
        const {xmin, xmax, ymin, ymax} = this.domain;

        const contours = d3.contours()
            .size([nx, ny])
            .thresholds(thresholds)
            (values);

        const xScale = this.xScale;
        const yScale = this.yScale;
        const path = d3.geoPath(
            d3.geoTransform({
                point: function(x, y) {
                    const sx = xScale(xmin + (x / nx) * (xmax - xmin));
                    const sy = yScale(ymin + (y / ny) * (ymax - ymin));
                    this.stream.point(sx, sy);
                }
            })
        );

        this.contourLayer.selectAll("path")
            .data(contours)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        return this;
    }

    addPoint(x, y, options = {})
    {
        this.points.push({x, y});
    
        const circles = this.pointLayer
            .selectAll("circle")
            .data(this.points);

        circles.enter()
            .append("circle")
            .merge(circles)
            .attr("cx", d => this.xScale(d.x))
            .attr("cy", d => this.yScale(d.y))
            .attr("r", options.radius || 4)
            .attr("fill", d => {
                return options.color || "black";
            })
            .attr("opacity", 0.9);

        circles.exit().remove();

        return this;
    }

    addLine(points, options = {})
    {
        this.lines.push({
            points,
            stroke: options.stroke || "black",
            strokeWidth: options.strokeWidth || 2
        });

        const lineGenerator = d3.line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]));

        const paths = this.lineLayer
            .selectAll("path")
            .data(this.lines);

        paths.enter()
            .append("path")
            .merge(paths)
            .attr("d", d => lineGenerator(d.points))
            .attr("fill", "none")
            .attr("stroke", d => d.stroke)
            .attr("stroke-width", d => d.strokeWidth);

        paths.exit().remove();

        return this;
    }

    clearPoints()
    {
        this.points = [];
        this.pointLayer.selectAll("*").remove();
        return this;
    }

    clearLines()
    {
        this.lines = [];
        this.lineLayer.selectAll("*").remove();
        return this;
    }

    clear()
    {
        this.clearPoints();
        this.clearLines();
        this.heatmapLayer.selectAll("*").remove();
        this.contourLayer.selectAll("*").remove();
        this.overlayLayer.selectAll(".axes").remove();
        this.axes = null;
        return this;
    }

    redraw()
    {
        this.clear();
        if (this.f) {
            this.setFunction(this.f);
        }
        this.addHeatmap();
        this.addContours();
        if (this.axes) {
            this.addCoordinateAxes();
        }
    }

    mouse2point(mx, my)
    {
        const x = this.xScale.invert(mx);
        const y = this.yScale.invert(my);
        const z = this.f ? this.f([x, y]) : null;
        return {x: x, y: y, value: z};
    }

    _initLayers()
    {
        this.heatmapLayer = this.svg.append("g").attr("class", "heatmap-layer");
        this.contourLayer = this.svg.append("g").attr("class", "contour-layer");
        this.lineLayer = this.svg.append("g").attr("class", "line-layer");
        this.pointLayer = this.svg.append("g").attr("class", "point-layer");
        this.overlayLayer = this.svg.append("g").attr("class", "overlay-layer");
    }

    _initInteraction()
    {
        const tooltip = d3.select("#tooltip");

        const crosshair = this.overlayLayer.append("g");

        const vLine = crosshair.append("line")
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("opacity", 0.5);

        const hLine = crosshair.append("line")
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("opacity", 0.5);

        this.svg.on("mousemove", (event) => {

            const [mx, my] = d3.pointer(event);

            crosshair.style("display", "block");

            vLine
            .attr("x1", mx)
            .attr("x2", mx)
            .attr("y1", 0)
            .attr("y2", this.height);

            hLine
                .attr("x1", 0)
                .attr("x2", this.width)
                .attr("y1", my)
                .attr("y2", my);

            const p = this.mouse2point(mx, my);
            const [x, y, z] = [p.x, p.y, p.value];

            if (this.hoverCallback) {
                this.hoverCallback(x, y, z);
            }

            tooltip
                .style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px")
                .text(`f(${x.toFixed(2)}, ${y.toFixed(2)}) = ${z?.toFixed(3)}`);
        });

        this.svg.on("mouseleave", () => {
            tooltip.style("display", "none");
            crosshair.style("display", "none");
        });
    }
}
