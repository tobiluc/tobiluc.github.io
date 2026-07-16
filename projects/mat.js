const vecEq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

const vecNeg = (a) =>  a.map(val => -val);

const vecDot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);

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

const mat2x2VecMul = (A, v) => [
    A[0][0] * v[0] + A[0][1] * v[1],
    A[1][0] * v[0] + A[1][1] * v[1]
];

const mat2x2Add = (A, B) => [
    [A[0][0] + B[0][0], A[0][1] + B[0][1]],
    [A[1][0] + B[1][0], A[1][1] + B[1][1]]
];

const mat2x2Scaled = (A, s) => [
    [A[0][0] * s, A[0][1] * s],
    [A[1][0] * s, A[1][1] * s]
];

export {
    vecEq, vecNeg, vecDot, vecSqNorm, vecNorm, vecScaled, vecAdd, vecSub, vecMul, vecDiv, vecZero,
    mat2x2Det, mat2x2Inv, mat2x2VecMul, mat2x2Add, mat2x2Scaled
};
