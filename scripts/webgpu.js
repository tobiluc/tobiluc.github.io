
if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

// Total size of the simulation
const SIM_SIZE = [512, 512];

//-----------------
// Setup
//-----------------
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

// Get normalized Mouse Coordinates
let mouse = {
    x: 0,
    y: 0,
    down: 0
};
canvas.addEventListener("pointerdown", e => mouse.down = 1);
canvas.addEventListener("pointerup",   e => mouse.down = 0);
canvas.addEventListener("pointermove", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) / rect.width;
    mouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
});

// Textures that store current and next
function createTexture() {
    return device.createTexture({
        size: SIM_SIZE,
        format: "rgba16float",
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.STORAGE_BINDING |
            GPUTextureUsage.COPY_DST
    });
}
let dyeA = createTexture();
let dyeB = createTexture();

//---------------
// Shader
//---------------
const simShader = device.createShaderModule({
code: `
struct Uniforms {
    mouse : vec2<f32>,
    mouseDown : f32,
    fade : f32,
}

@group(0) @binding(0)
var inputTex : texture_2d<f32>;

@group(0) @binding(1)
var outputTex : texture_storage_2d<rgba16float, write>;

@group(0) @binding(2)
var<uniform> uniforms : Uniforms;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id : vec3<u32>) {

    if (id.x >= ${SIM_SIZE[0]}u || id.y >= ${SIM_SIZE[1]}u) {
        return;
    }

    let pos = vec2<i32>(id.xy);

    var color = textureLoad(inputTex, pos, 0);

    // Fade
    color *= uniforms.fade;

    // Mouse injection
    if (uniforms.mouseDown > 0.5) {

        let uv = vec2<f32>(id.xy) / vec2<f32>(${SIM_SIZE});
        let dist = distance(uv, uniforms.mouse);

        let radius = 0.07;

        if (dist < radius) {
            let strength = (1.0 - dist / radius);
            color += vec4<f32>(0.6, 0.2, 1.0, 1.0) * strength;
        }
    }

    textureStore(outputTex, pos, color);
}
`
});


//---------------
// Pipeline
//---------------
const simPipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
        module: simShader,
        entryPoint: "main"
    }
});

const simUniformBuffer = device.createBuffer({
    size: 4 * 4, // mouse x, mouse y, mouse down, fade factor
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

//---------------
// Render
//---------------
function simulate() {

    device.queue.writeBuffer(
        simUniformBuffer,
        0,
        new Float32Array([
            mouse.x,
            1.0 - mouse.y, // flip vertical
            mouse.down,
            0.98   // fade factor
        ])
    );

    const encoder = device.createCommandEncoder();

    const bindGroup = device.createBindGroup({
        layout: simPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: dyeA.createView() },
            { binding: 1, resource: dyeB.createView() },
            { binding: 2, resource: { buffer: simUniformBuffer } }
        ]
    });

    const pass = encoder.beginComputePass();
    pass.setPipeline(simPipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(
        Math.ceil(SIM_SIZE[0] / 8),
        Math.ceil(SIM_SIZE[1] / 8)
    );
    pass.end();

    device.queue.submit([encoder.finish()]);

    // Swap
    [dyeA, dyeB] = [dyeB, dyeA];
}

const renderShader = device.createShaderModule({
code: `
@group(0) @binding(0)
var tex : texture_2d<f32>;

@group(0) @binding(1)
var samp : sampler;

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex : u32)
     -> @builtin(position) vec4<f32> {

    var pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>( 1.0, -1.0),
        vec2<f32>(-1.0,  1.0),
        vec2<f32>(-1.0,  1.0),
        vec2<f32>( 1.0, -1.0),
        vec2<f32>( 1.0,  1.0)
    );

    return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

@fragment
fn fs_main(@builtin(position) pos : vec4<f32>)
     -> @location(0) vec4<f32> {

    let uv = pos.xy / vec2<f32>(${canvas.width}.0, ${canvas.height}.0);

    return textureSample(tex, samp, uv);
}
`
});

const renderPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
        module: renderShader,
        entryPoint: "vs_main",
    },
    fragment: {
        module: renderShader,
        entryPoint: "fs_main",
        targets: [{
            format: navigator.gpu.getPreferredCanvasFormat()
        }]
    },
    primitive: {
        topology: "triangle-list",
    }
});

const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear"
});
function frame() {

    simulate();

    const encoder = device.createCommandEncoder();
    const view = context.getCurrentTexture().createView();

    const bindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: dyeA.createView() },
            { binding: 1, resource: sampler }
        ]
    });

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: "clear",
            storeOp: "store"
        }]
    });

    pass.setPipeline(renderPipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6);
    pass.end();

    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
