export class Visualizer
{
    constructor(container, config = {})
    {
        this.container = container;
        this.width = 600;
        this.height = 600;

        this.svg = d3.select(container.querySelector(".visualizer-svg"))
            .attr("viewBox", `0 0 ${this.width} ${this.height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        this.canvas = d3.select(container.querySelector(".visualizer-canvas")).node();
        this.ctx = this.canvas.getContext("2d");

        this.domain = {xmin: -5, xmax: 5, ymin: -5, ymax: 5};

        this.f = null;
        this.grid = {nx: 128, ny: 128, values:[]};
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

        // D3 Contours expect row-major layout where the top row comes first (highest Y value down to lowest)
        this.grid.values = new Float64Array(this.grid.nx * this.grid.ny);
        let index = 0;
        for (let j = 0; j < this.grid.ny; j++) {
            for (let i = 0; i < this.grid.nx; i++) {
                const x = xmin + (i / (this.grid.nx - 1)) * (xmax - xmin);
                const y = ymin + (j / (this.grid.ny - 1)) * (ymax - ymin);
                this.grid.values[index++] = f([x, y]);
            }
        }

        return this;
    }

    addHeatmap()
    {
        const {nx, ny, values} = this.grid;
        if (!values || values.length === 0) return this;

        this.canvas.width = nx;
        this.canvas.height = ny;

        const [min, max] = d3.extent(values);
        const color = d3.scaleSequential(d3.interpolateRdBu).domain([max, min]);

        // ImageData is fast!
        const imgData = this.ctx.createImageData(nx, ny);
        const data = imgData.data;

        for (let i = 0; i < values.length; i++) {
            // Parse Color String
            const rgbStr = color(values[i]); // e.g. "rgb(255, 0, 0)"
            const parsed = rgbStr.match(/\d+/g);
            if (parsed) {
                const idx = i * 4;
                data[idx]     = +parsed[0]; // R
                data[idx + 1] = +parsed[1]; // G
                data[idx + 2] = +parsed[2]; // B
                data[idx + 3] = 255;        // A
            }
        }

        this.ctx.putImageData(imgData, 0, 0);
        return this;
    }

    addContours(thresholds)
    {
        const {nx, ny, values} = this.grid;
        if (!values || values.length === 0) {return this;}

        this.clearContours();
        
        const {xmin, xmax, ymin, ymax} = this.domain;

        const contours = d3.contours()
            .size([nx, ny])
            .thresholds(thresholds || 10)
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
            .join("path")
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        return this;
    }

    addPoint(x, y, options = {})
    {
        this.points.push({x, y});

        this.pointLayer
            .append("circle")
            .attr("cx", this.xScale(x))
            .attr("cy", this.yScale(y))
            .attr("r", options.radius || 4)
            .attr("fill", options.color || "black")
            .attr("opacity", 0.9);

        return this;
    }

    addLine(points, options = {})
    {
        const lineGenerator = d3.line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]));

        this.lineLayer
            .append("path")
            .attr("d", lineGenerator(points))
            .attr("fill", "none")
            .attr("stroke", options.stroke || "black")
            .attr("stroke-width", options.strokeWidth || 2);

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

    clearContours()
    {
        this.contourLayer.selectAll("*").remove();
    }

    clear()
    {
        this.clearPoints();
        this.clearLines();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.clearContours();
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

    onHover(callback)
    {
        this.hoverCallback = callback;
        return this;
    }

    onClick(callback)
    {
        this.clickCallback = callback;
        return this;
    }

    _initLayers()
    {
        this.contourLayer = this.svg.append("g").attr("class", "contour-layer");
        this.lineLayer = this.svg.append("g").attr("class", "line-layer");
        this.pointLayer = this.svg.append("g").attr("class", "point-layer");
        this.overlayLayer = this.svg.append("g").attr("class", "overlay-layer");
    }

    _hideInteraction()
    {
        this.tooltip.style("display", "none");
        this.crosshair.style("display", "none");
    }

    _initInteraction()
    {
        this.tooltip = d3.select(this.container.querySelector(".visualizer-tooltip"));

        this.crosshair = this.overlayLayer.append("g")
            .style("display", "none");

        const vLine = this.crosshair.append("line")
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("opacity", 0.5);

        const hLine = this.crosshair.append("line")
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("opacity", 0.5);

        this.svg.on("mousemove", (event) => {
            let [mx, my] = d3.pointer(event, this.overlayLayer.node());
            const p = this.mouse2point(mx, my);
            const [x, y, z] = [p.x, p.y, p.value];
    
            this.crosshair.style("display", "block");

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

            [mx, my] = d3.pointer(event, this.container);

            if (this.hoverCallback) {
                this.hoverCallback(x, y, z);
            }

            this.tooltip
                .style("display", "block")
                .style("left", (mx + 10) + "px")
                .style("top", (my + 10) + "px")
                .text(`f(${x.toFixed(2)}, ${y.toFixed(2)}) = ${z?.toFixed(3)}`);
        });

        this.svg.on("click", (event) => {
            const [mx, my] = d3.pointer(event, this.overlayLayer.node());
            const p = this.mouse2point(mx, my);

            if (this.clickCallback) {
                this.clickCallback(p.x, p.y, p.value, event);
            }
        });

        this.svg.on("mouseleave", () => {
            this._hideInteraction();
        });
    }
}
