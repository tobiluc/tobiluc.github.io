import * as Mat from "../mat.js";

function backtracking_line_search(objective, x, dir, options = {})
{
    let t = options.t0 || 1;
    const f = objective.func(x);
    const g = objective.grad(x);
    const alphaTimesGDotDir = Mat.vecDot(g, dir) * (options.alpha || 0.2);
    let iter = 0;
    while ((objective.func(Mat.vecAdd(x, Mat.vecScaled(dir, t))) > f + t * alphaTimesGDotDir) && iter < (options.maxIters || 1000)) {
        t = t * (options.tau || 0.9);
        ++iter;
    }
    return t;
}

function line_search_descent_method(objective, options={})
{
    const eps = options.eps || 1e-6;
    const eps2 = eps*eps;

    let pts = []

    let x = options.x0 || [0,0];
    let g = objective.grad(x);
    pts.push(x);
    for (let iter = 0; iter < options.maxIters || 1000; ++iter)
    {
        const dir = Mat.vecNeg(g);
        const t = backtracking_line_search(objective, x, dir, options);

        x = Mat.vecAdd(x, Mat.vecScaled(dir, t));
        pts.push(x);

        g = objective.grad(x);
        if (Mat.vecSqNorm(g) < eps2) {
            break;
        }
    }
    return pts;
}

export {
    backtracking_line_search, line_search_descent_method
};