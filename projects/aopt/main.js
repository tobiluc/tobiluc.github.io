import {FunctionVisualizer2D} from "./FunctionVisualizer2D.js";
import * as Mat from "../mat.js";
import * as AOPT from "./aopt.js";
import {evaluateNode} from "../expr.js";
import jsep from "jsep"

jsep.removeAllBinaryOps();
jsep.removeAllUnaryOps();
jsep.addBinaryOp('+', 3, false);
jsep.addBinaryOp('-', 3, false);
jsep.addBinaryOp('*', 4, false);
jsep.addBinaryOp('/', 4, false);
jsep.addBinaryOp('^', 10, true);
jsep.addUnaryOp('-');
jsep.addUnaryOp('+');

// const objective = {
//     func: (x) => 4*Math.pow(Math.sin(x[0]) - Math.cos(x[1]), 2) + Mat.vecSqNorm(x) + x[0] + x[1],
//     grad: (x) => {
//         const a = Math.sin(x[0]) - Math.cos(x[1]);
//         return [
//             8*Math.cos(x[0])*a + 2*x[0] + 1,
//             8*Math.sin(x[1])*a + 2*x[1] + 1
//         ]
//     },
//     hess: (x) => {
//         const sin0 = Math.sin(x[0]);
//         const cos0 = Math.cos(x[0]);
//         const sin1 = Math.sin(x[1]);
//         const cos1 = Math.cos(x[1]);

//         const h00 = 8 * (-sin0 * (sin0 - cos1) + cos0 * cos0) + 2;
//         const h01 = 8 * cos0 * sin1;
//         const h11 = 8 * (cos1 * (sin0 - cos1) + sin1 * sin1) + 2;

//         return [
//             [h00, h01],
//             [h01, h11]
//         ];
//     }
// }

const visualizers = Array.from(
    document.querySelectorAll(".visualizer")
).map(el => new FunctionVisualizer2D(el));

function setFunctionFromExpression(vis, text)
{

}

//===============================
// Line Search Descent
//===============================
{
    const objective = {
        func: ([x, y]) => x*x + y*y
    };
    objective.grad = AOPT.fd_grad(objective.func);
    objective.hess = AOPT.fd_hess(objective.grad);

    const vis = visualizers[0];
    vis.clear();
    vis.setDomain([-5, 5], [-5, 5])
        .setFunction(objective.func)
        .addHeatmap()
        .addCoordinateAxes()
        .addContours(32);

    const funcInput = document.getElementById("lsd-func");
    const funcButton = document.getElementById("lsd-func-confirm");
    function updateFunction() {
        const node = jsep.parse(funcInput.value);
        objective.func = ([x, y]) => {
            const scope = {
                pi: Math.PI,
                sin: (x) => Math.sin(x),
                cos: (x) => Math.cos(x),
                pow: (x, y) => Math.pow(x, y),
                sqrt: (x) => Math.sqrt(x),
                x: x,
                y: y
            };
            const z = evaluateNode(node, scope);
            // console.log(`f(x,y) = ${z}`)
            return z;
        }
        objective.grad = AOPT.fd_grad(objective.func);
        objective.hess = AOPT.fd_hess(objective.grad);
        vis.setFunction(objective.func)
            .addHeatmap()
            .addCoordinateAxes()
            .addContours(32);
    }
    updateFunction();

    funcButton.addEventListener("click", (event) => {
        updateFunction();
    });

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
}
