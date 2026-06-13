import {Visualizer} from "./visualizer.js";
import * as Mat from "../mat.js";
import * as AOPT from "./aopt.js";

const objective = {
    func: (x) => 4*Math.pow(Math.sin(x[0]) - Math.cos(x[1]), 2) + Mat.vecSqNorm(x) + x[0] + x[1],
    grad: (x) => [
        8*Math.cos(x[0])*(Math.sin(x[0]) - Math.cos(x[1])) + 2*x[0] + 1,
        8*Math.sin(x[1])*(Math.sin(x[0]) - Math.cos(x[1])) + 2*x[1] + 1
    ]
}

// function myFunc1(x) {
//     return 4*Math.pow(Math.sin(x[0]) - Math.cos(x[1]), 2) + Mat.vecSqNorm(x) + x[0] + x[1];
// }

// function myGrad1(x) {
//     return [
//         8*Math.cos(x[0])*(Math.sin(x[0]) - Math.cos(x[1])) + 2*x[0] + 1,
//         8*Math.sin(x[1])*(Math.sin(x[0]) - Math.cos(x[1])) + 2*x[1] + 1
//     ];
// }

const vis = new Visualizer("#visualizer-svg", "#heatmap");
vis.clear();
vis.setDomain([-10, 10], [-10, 10])
    .setFunction(objective.func)
    .addHeatmap()
    .addCoordinateAxes()
    .addContours(32);

vis.onClick((x, y, z) => {
    vis.clearPoints();
    vis.clearLines();

    const pts = AOPT.line_search_descent_method(objective, {x0: [x,y], eps: 0.01, t0:0.1});

    pts.forEach(x => {
        vis.addPoint(x[0], x[1], {color:"red", radius:4});
    });
    for (let i = 0; i < pts.length-1; ++i) {
        vis.addLine([pts[i], pts[i+1]], {stroke: "red"})
    }
});