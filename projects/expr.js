import jsep from "./deps/jsep/dist/jsep.min.js"

export function evaluateNode(node, scope)
{
    switch (node.type)
    {
        case 'Literal':
            return node.value;
        case 'Identifier':
            return scope[node.name];
        case 'CallExpression': {
            const fn = scope[node.callee.name];
            if (!fn) {
            throw new Error(`unknown function: ${node.callee.name}`);
            }
            const args = node.arguments.map(arg => evaluateNode(arg, scope));
            return fn(...args);
        }
        case 'BinaryExpression': {
            const left = evaluateNode(node.left, scope);
            const right = evaluateNode(node.right, scope);
            switch (node.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '^': return Math.pow(left, right);
            default: throw new Error(`unsupported binary operator: ${node.operator}`);
            }
        }
        case 'UnaryExpression': {
            const val = evaluateNode(node.argument, scope);
            switch (node.operator) {
                case '-': return -val;
                case '+': return +val;
                default: throw new Error(`unsupported unary operator: ${node.operator}`);
            }
        }
        default: throw new Error(`unsupported node type: ${node.type}`);
    }
}