import { Visualizer } from "./visualizer.js";

function backtracking_line_search(func, grad, [x, y], [dx, dy], t0, alpha, tau)
{
    let t = t0;
    const f = func(x,y);
    const g = grad(x,y);
    while (func(x+t*dx, y+t*dy) > f + t*alpha*(g[0]*dx+g[1]*dy)) {
        t = tau*t;
    }
    return t;
}

function line_search_descent_method(func, grad, [x0,y0], eps)
{
    let pts = []

    let [x,y] = [x0,y0];
    let curr_grad = grad(x,y);
    pts.push([x,y]);
    while (true) {
        const d = [-curr_grad[0],-curr_grad[1]];
        const t = backtracking_line_search(func, grad, [x,y], d, 0.9, 0.6, 0.9)
        x += t*d[0];
        y += t*d[1];
        pts.push([x,y]);
        curr_grad = grad(x,y);
        if (curr_grad[0]*curr_grad[0]+curr_grad[1]*curr_grad[1] < eps) {
            break;
        }
    }
    return pts;
}

function myFunc(x, y) {
    //return 4*Math.pow(Math.sin(x) - Math.cos(y), 2) + x*x + y*y + x + y;
    return x*x + y*y;
    //return (x*x + y - 11)**2 + (x + y*y - 7)**2;
}

function myGrad(x, y) {
    return [2*x, 2*y];
}

const pts = line_search_descent_method(myFunc, myGrad, [4,3], 0.1);

const vis = new Visualizer("#plot", {
    width: 600,
    height: 600
});
vis.clear();
vis.setDomain([-6, 6], [-6, 6])
    .setFunction(myFunc)
    .addHeatmap()
    .addCoordinateAxes()
    .addContours(32);

pts.forEach(p => {
    vis.addPoint(p[0], p[1]);
});
