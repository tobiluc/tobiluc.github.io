import { Visualizer } from "./visualizer.js";
import * as Mat from "../mat.js";

function backtracking_line_search(func, grad, x, dir, t0, alpha, tau)
{
    let t = t0;
    const f = func(x);
    const g = grad(x);
    const alphaTimesGDotDir = Mat.vecDot(g, dir) * alpha;
    while (func(Mat.vecAdd(x, Mat.vecScaled(dir, t))) > f + t * alphaTimesGDotDir) {
        t = tau*t;
    }
    return t;
}

function line_search_descent_method(func, grad, x0, eps)
{
    const eps2 = eps*eps;

    let pts = []

    let x = x0;
    let g = grad(x);
    pts.push(x);
    while (true) {
        const d = Mat.vecNeg(g);
        const t = backtracking_line_search(func, grad, x, d, 0.9, 0.6, 0.9);
        x = Mat.vecAdd(x, Mat.vecScaled(d, t));
        pts.push(x);
        g = grad(x);
        if (Mat.vecSqNorm(g) < eps2) {
            break;
        }
    }
    return pts;
}

function myFunc1(x) {
    return 4*Math.pow(Math.sin(x[0]) - Math.cos(x[1]), 2) + Mat.vecSqNorm(x) + x[0] + x[1];
}

function myGrad1(x) {
    return [
        8*Math.cos(x[0])*(Math.sin(x[0]) - Math.cos(x[1])) + 2*x[0] + 1,
        8*Math.sin(x[1])*(Math.sin(x[0]) - Math.cos(x[1])) + 2*x[1] + 1
    ];
}

const pts = line_search_descent_method(myFunc1, myGrad1, [4,5], 0.01);

const vis = new Visualizer("#plot", {
    width: 600,
    height: 600
});
vis.clear();
vis.setDomain([-6, 6], [-6, 6])
    .setFunction(myFunc1)
    .addHeatmap()
    .addCoordinateAxes()
    .addContours(32);

pts.forEach(x => {
    vis.addPoint(x[0], x[1], {color:"red", radius:5});
});
for (let i = 0; i < pts.length-1; ++i) {
    vis.addLine([pts[i], pts[i+1]], {stroke: "red"})
}
