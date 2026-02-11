
if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

// Setup
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

const canvas = document.querySelector("canvas");
const context = canvas.getContext("webgpu");

const format = navigator.gpu.getPreferredCanvasFormat();

context.configure({
    device: device,
    format: format,
    alphaMode: "opaque",
});

function resizeCanvas() {
    const devicePixelRatio = window.devicePixelRatio || 1;

    const width  = canvas.clientWidth  * devicePixelRatio;
    const height = canvas.clientHeight * devicePixelRatio;

    canvas.width  = width;
    canvas.height = height;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

//---------------
// Shader
//---------------
const shaderModule = device.createShaderModule({
    code: `
@group(0) @binding(0)
var<uniform> time : f32;

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex : u32)
     -> @builtin(position) vec4<f32> {

    var positions = array<vec2<f32>, 3>(
        vec2<f32>( 0.0,  0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>( 0.5, -0.5)
    );

    let pos = positions[vertexIndex];

    let angle = time;
    let c = cos(angle);
    let s = sin(angle);

    let rotated = vec2<f32>(
        pos.x * c - pos.y * s,
        pos.x * s + pos.y * c
    );

    return vec4<f32>(rotated, 0.0, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
    return vec4<f32>(0.9, 0.6, 0.5, 1.0);
}

    `
});

//---------------
// Pipeline
//---------------
const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
    },
    fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [{
            format: format
        }]
    },
    primitive: {
        topology: "triangle-list",
    },
});

const uniformBuffer = device.createBuffer({
    size: 4, // one float = 4 bytes
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
        binding: 0,
        resource: { buffer: uniformBuffer }
    }]
});

//---------------
// Render
//---------------

// Handle theme dependent clear color
function getClearColor(theme) {
    return theme === "light" 
        ? { r: 1, g: 1, b: 1, a: 1 }
        : { r: 0.05, g: 0.05, b: 0.08, a: 1 };
}
let clearColor = getClearColor(localStorage.getItem("theme") || "light");
window.addEventListener("storage", (event) => {
    if (event.key === "theme") {
        clearColor = getClearColor(event.newValue);
    }
});

// Render Frame
function frame(timeMS) {
    const time = timeMS * 0.001;

    device.queue.writeBuffer(
        uniformBuffer,
        0,
        new Float32Array([time])
    );

    const encoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();

    const renderPass = encoder.beginRenderPass({
        colorAttachments: [{
            view: textureView,
            clearValue: clearColor,
            loadOp: "clear",
            storeOp: "store",
        }]
    });

    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(3);
    renderPass.end();

    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);