function isVector(x) {
    return Array.isArray(x) && typeof x[0] === "number";
}

function isMatrix(x) {
    return Array.isArray(x) && Array.isArray(x[0]);
}

const vecEq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

const vecNeg = (a) =>  a.map(val => -val);

const vecDot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);

const vecSqNorm = (a) => vecDot(a, a);

const vecNorm = (a) => Math.sqrt(vecSqNorm(a));

const vecScaled = (a, s) => a.map(val => val*s);

const vecAdd = (a, b) => a.map((x, i) => a[i] + b[i]);

const vecSub = (a, b) => a.map((x, i) => a[i] - b[i]);

const vecMul = (a, b) => a.map((x, i) => a[i] * b[i]);

const vecDiv = (a, b) => a.map((x, i) => a[i] / b[i]);

const vecZero = (n) => new Array(n).fill(0);

const mat2x2Det = (A) => A[0][0]*A[1][1] - A[0][1]*A[1][0];

const mat2x2Inv = (A) => {
    const det = mat2x2Det(A);
    if (Math.abs(det) < 1e-12) {throw new Error("singular matrix");}
    return [
        [A[1][1] / det, -A[0][1] / det],
        [-A[1][0] / det, A[0][0] / det]
    ];
};

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

function dot(a, b) {
    if (isVector(a)) {return vecDot(a, b);}
    if (isMatrix(a)) {return matDot(a, b);}
    assert(false, "dot expected vector or matrix");
    return 0;
}

function squaredNorm(a) {
    return dot(a, a);
}

function norm(a) {
    return Math.sqrt(dot(a, a));
}

export {
    vecEq, vecNeg, vecDot, vecSqNorm, vecNorm, vecScaled, vecAdd, vecSub, vecMul, vecDiv, vecZero,
    mat2x2Det, mat2x2Inv,
    dot,
    squaredNorm,
    norm
};