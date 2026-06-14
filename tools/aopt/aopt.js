import * as Mat from "../mat.js";

function fd_grad(func, h=1e-4)
{
    return function(x) {
        const fx = func(x);
        const n = x.length;
        const grad = new Array(n);

        for (let i = 0; i < n; i++) {
            const xh = x.slice(); // copy
            xh[i] += h;
            grad[i] = (func(xh) - fx) / h;
        }

        return grad;
    };
}

function fd_hess(grad, h=1e-4) {
    return function (x) {
        const n = x.length;
        const H = Array.from({length: n}, () => new Array(n).fill(0));

        for (let i = 0; i < n; ++i) {
            const xr = x.slice();
            const xl = x.slice();

            xr[i] += h;
            xl[i] -= h;

            const gr = grad(xr);
            const gl = grad(xl);

            for (let j = 0; j < n; ++j) {
                H[j][i] = (gr[j] - gl[j]) / (2*h);
            }
        }
        return H;
    };
}

function backtracking_line_search(objective, x, dir, options = {})
{
    const timeoutMs = 500;
    const startTime = performance.now();

    let t = options.t0 || 1;
    const f = objective.func(x);
    const g = objective.grad(x);
    const alphaTimesGDotDir = Mat.vecDot(g, dir) * (options.alpha || 0.2);
    while ((objective.func(Mat.vecAdd(x, Mat.vecScaled(dir, t))) > f + t * alphaTimesGDotDir)) {
        t = t * (options.tau || 0.9);

        if (performance.now() - startTime > timeoutMs) {
            console.warn("backtracking line search time limit exceeded.");
            return t;
        }
    }
    return t;
}

function line_search_descent_method(objective, options={})
{
    options.direction = options.direction || "gradient-descent";
    if (options.direction == "newton-step" && !objective.hess) {
        throw Error("newtons-method selected but no hessian provided");
    }

    const timeoutMs = 5000;
    const startTime = performance.now();

    const eps = options.eps || 1e-6;
    const eps2 = eps*eps;

    let pts = []

    let x = options.x0 || [0,0];
    let currGrad = objective.grad(x);
    pts.push(x);
    let numIters = 0;
    let numGDFallbackIters = 0;
    while (true)
    {
        ++numIters;

        // Get search direction
        let searchDir = options.direction=="newton-step" ? Mat.vecNeg(Mat.mat2x2VecMul(Mat.mat2x2Inv(objective.hess(x)), currGrad))
                    :  Mat.vecNeg(currGrad);

        // Gradient Descent fallback if we do not have a descent direction
        if (Mat.vecDot(currGrad, searchDir) >= 0) {
            searchDir = Mat.vecNeg(currGrad);
            ++numGDFallbackIters;
        }

        // Search for step size
        const t = backtracking_line_search(objective, x, searchDir, options);

        // Compute current point
        x = Mat.vecAdd(x, Mat.vecScaled(searchDir, t));
        pts.push(x);

        // Stopping Criterion
        currGrad = objective.grad(x);
        if (Mat.vecSqNorm(currGrad) < eps2) {
            break;
        }

        // Check Timeout
        if (performance.now() - startTime > timeoutMs) {
            console.warn("line search descent time limit exceeded.");
            return pts;
        }
    }
    return pts;
}

export {
    fd_grad, fd_hess,
    backtracking_line_search, line_search_descent_method
};