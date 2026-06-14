import {Visualizer} from "./visualizer.js";
import * as Mat from "../mat.js";
import * as AOPT from "./aopt.js";

const objective = {
    func: (x) => 4*Math.pow(Math.sin(x[0]) - Math.cos(x[1]), 2) + Mat.vecSqNorm(x) + x[0] + x[1],
    grad: (x) => {
        const a = Math.sin(x[0]) - Math.cos(x[1]);
        return [
            8*Math.cos(x[0])*a + 2*x[0] + 1,
            8*Math.sin(x[1])*a + 2*x[1] + 1
        ]
    },
    hess: (x) => {
        const sin0 = Math.sin(x[0]);
        const cos0 = Math.cos(x[0]);
        const sin1 = Math.sin(x[1]);
        const cos1 = Math.cos(x[1]);

        const h00 = 8 * (-sin0 * (sin0 - cos1) + cos0 * cos0) + 2;
        const h01 = 8 * cos0 * sin1;
        const h11 = 8 * (cos1 * (sin0 - cos1) + sin1 * sin1) + 2;

        return [
            [h00, h01],
            [h01, h11]
        ];
    }
}
// objective.grad = AOPT.fd_grad(objective.func);
// objective.hess = AOPT.fd_hess(objective.grad);

// objective.func = (x) => Mat.vecSqNorm(x);
// objective.grad = (x) => Mat.vecScaled(x, 2);
// objective.hess = (x) => [[2,0], [0,2]];


// function myFunc1(x) {
//     return 4*Math.pow(Math.sin(x[0]) - Math.cos(x[1]), 2) + Mat.vecSqNorm(x) + x[0] + x[1];
// }

// function myGrad1(x) {
//     return [
//         8*Math.cos(x[0])*(Math.sin(x[0]) - Math.cos(x[1])) + 2*x[0] + 1,
//         8*Math.sin(x[1])*(Math.sin(x[0]) - Math.cos(x[1])) + 2*x[1] + 1
//     ];
// }

const visualizers = Array.from(
    document.querySelectorAll(".visualizer")
).map(el => new Visualizer(el));

const vis = visualizers[0];
vis.clear();
vis.setDomain([-10, 10], [-10, 10])
    .setFunction(objective.func)
    .addHeatmap()
    .addCoordinateAxes()
    .addContours(32);

vis.onClick((x, y, z) => {
    vis.clearPoints();
    vis.clearLines();

    const params = {
        t0: parseFloat(document.getElementById("lsd-t0").value),
        alpha: parseFloat(document.getElementById("lsd-alpha").value),
        tau: parseFloat(document.getElementById("lsd-tau").value),
        epsilon: parseFloat(document.getElementById("lsd-epsilon").value),
        x0: [x,y],
        direction: document.getElementById("lsd-direction").value
    };

    const pts = AOPT.line_search_descent_method(objective, params);

    pts.forEach(x => {
        vis.addPoint(x[0], x[1], {color:"red", radius:4});
    });
    for (let i = 0; i < pts.length-1; ++i) {
        vis.addLine([pts[i], pts[i+1]], {stroke: "red"})
    }
});