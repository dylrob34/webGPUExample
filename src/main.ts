import { Shaders, Shaders1 } from "./shaders";

const colorValues = [
    [128, 0, 0],
    [128, 128, 0],
    [0, 128, 0],
    [128, 0, 128],
    [0, 128, 128],
    [0, 0, 128]
]


function CheckWebGPU() {
    let result = "Great, your current browser supports WebGPU!";
    if (!navigator.gpu) {
        result = "Your current browser does not support WebGPU";
    }
    return result;
}

let test = document.getElementById("id-gpu-check");

if (test != null) {
    test.innerHTML = CheckWebGPU();
}

async function initGPU(canvasName: string) {
    const canvas = document.getElementById(canvasName) as HTMLCanvasElement;
    const adapter = await navigator.gpu?.requestAdapter() as GPUAdapter;
    const device = await adapter?.requestDevice() as GPUDevice;
    const context = canvas.getContext("webgpu") as unknown as GPUCanvasContext;

    const swapChainFormat = "bgra8unorm";
    context.configure({
        device: device,
        format: swapChainFormat,
    });

    return {device, context, swapChainFormat}
}

function createBuffer(device:GPUDevice, data:Float32Array,
    usageFlag:GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) {
        const buffer = device.createBuffer({
            size: data.byteLength,
            usage: usageFlag,
            mappedAtCreation: true
        })
        new Float32Array(buffer.getMappedRange()).set(data);
        buffer.unmap();
        return buffer;
    }

function createIntBuffer(device:GPUDevice, data: Int32Array,
    usageFlag: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) {
        const buffer = device.createBuffer({
            size: data.byteLength,
            usage: usageFlag,
            mappedAtCreation: true
        })
        new Int32Array(buffer.getMappedRange()).set(data);
        buffer.unmap();
        return buffer;
    }

async function CreateTriangle(color="(1.0,1.0,1.0,1.0)") {
    console.log("Creating Triangle")
    if (!navigator.gpu) {
        throw("Your current browser does not support WebGPU!");
    }

    const gpu = await initGPU("canvas-webgpu");
    const device = gpu.device;
    const context = gpu.context;
    const swapChainFormat = gpu.swapChainFormat as GPUTextureFormat;

    const shader = Shaders(color);
    const pipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({
                code: shader.vertex
            }),
            entryPoint: "main"
        },
        multisample: {
            count: 4,
            alphaToCoverageEnabled: false
        },
        fragment: {
            module: device.createShaderModule({
                code: shader.fragment
            }),
            entryPoint: "main",
            targets: [{
                format: swapChainFormat
            }]
        },
        primitive: {topology: "triangle-list"},
        depthStencil: {
            format: swapChainFormat
        }
        
    });

    const commandEncoder = device.createCommandEncoder();
    const myTexture = device.createTexture({
        size: {
            width: 640,
            height: 640
        },
        sampleCount: 4,
        format: swapChainFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    })
    const attachment = myTexture.createView();
    const textureView = context.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: attachment,
            resolveTarget: textureView,
            loadValue: [0.5, 0.5, 0.8, 1],
            storeOp: "discard"
        }]
    });
    renderPass.setPipeline(pipeline);
    renderPass.draw(3, 1, 0, 0);
    renderPass.endPass();

    device.queue.submit([commandEncoder.finish()]);

}

function toRadians(angle: number) {
    return angle * (Math.PI/180);
}

function rotate(angle: number, point: Array<number>) {
    let resultX = (point[0]*Math.cos(toRadians(angle))) + (point[1]*Math.sin(toRadians(angle)));
    let resultY = (-1*point[0]*Math.sin(toRadians(angle))) + (point[1]*Math.cos(toRadians(angle)));
    return [resultX, resultY]
}

function rotateMatrix(angle: number, matrix: Array<Array<number>>) {
    let vertexs = [];
    for (var i = 0; i < matrix.length; i++) {
        vertexs.push(rotate(angle, matrix[i]));
    }
    return vertexs;
}

function offsetMatrix(matrix: Array<number>) {
    for (var i = 0; i < matrix.length; i++) {
        matrix[i] = matrix[i] + .5;
    }
}

function matToArray(matrix: Array<Array<number>>) {
    let arr: Array<number> = [];
    for (var i = 0; i < matrix.length; i++) {
        arr.push(matrix[i][0]);
        arr.push(matrix[i][1]);
    }
    return arr
}

function createWedge(start: number, current: number, resolution: number) {
    let vertexs = [];
    // center
    vertexs.push([.0, .0]);
    // top
    vertexs.push([.0, .9]);
    // right
    let right = rotate(current, [.0, .9]);
    vertexs.push(right);

    // build small triangles
    //const halfway = [.0 - (.0 - right[0]) / 2, .9 - (.9 - right[1]) / 2];
    const halfway = [right[0] / 2, .9 - (.9 - right[1]) / 2];

    // rotate by start
    let beginX: number = .0;
    let beginY: number = .9;
    let max = current * resolution;
    for (var i = 1; i < max + 1; i++) {
        // first
        vertexs.push([beginX, beginY]);
        // second
        let end = rotate(current / max * i, [0.0, 0.9]);
        vertexs.push(end);
        // center
        vertexs.push(halfway);

        beginX = end[0];
        beginY = end[1];
    }
    vertexs = rotateMatrix(start, vertexs);
    vertexs = matToArray(vertexs);
    //offsetMatrix(vertexs);

    return vertexs;
}

function getWedgeColorVertexs(start: number, size: number, resolution: number, colorIndex: number)
{
    let colors: Array<number> = [];
    let vertexs: Array<number> = [];
    let wedge = createWedge(start, size, resolution)
    for (var j = 0; j < wedge.length; j++){
        if (j%2 == 0) {
            colors.push(colorValues[colorIndex][0]);
            colors.push(colorValues[colorIndex][1]);
            colors.push(colorValues[colorIndex][2]);
        }
        vertexs.push(wedge[j]);
    }

    return [colors, vertexs]

}

async function pieChart(categories: Array<number>, resolution: number) {
    console.log("Creating Triangle")
    if (!navigator.gpu) {
        throw("Your current browser does not support WebGPU!");
    }

    const gpu = await initGPU("canvas-pie");
    const device = gpu.device;
    const context = gpu.context;
    const swapChainFormat = gpu.swapChainFormat as GPUTextureFormat;

    categories = categories.sort((a, b) => a-b);
    let currentStart = 0;
    let vertexs = [] as Array<number>;

    let colors: Array<number> = [];

    for (var i = 0; i < categories.length; i++) {
        if (categories[i] > 180) {
            const categorySize = categories[i];
            const min = Math.floor(categorySize / 90);
            const remainder = categorySize % 90;
            let wedges;
            if (remainder === 0) {
                wedges = min;
            } else {
                wedges = min + 1;
            }
            for (let j = 0; j < wedges; j++) {
                let size = 90;
                if (j === wedges - 1) {
                    size = remainder;
                }
                const colorVerts = getWedgeColorVertexs(currentStart, size, resolution, i);
                colorVerts[0].map((value) => {
                    colors.push(value);
                })
                colorVerts[1].map((value) => {
                    vertexs.push(value);
                })
                currentStart += size;
            }
        } else {
            const colorVerts = getWedgeColorVertexs(currentStart, categories[i], resolution, i);
            colorVerts[0].map((value) => {
                colors.push(value);
            })
            colorVerts[1].map((value) => {
                vertexs.push(value);
            })

        }
        currentStart += categories[i];
    }

    const vertexBuffer = createBuffer(device, Float32Array.from(vertexs));
    const colorBuffer = createBuffer(device, Float32Array.from(colors));

    

    const shader = Shaders1();
    const pipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({
                code: shader.vertex
            }),
            buffers: [{
                arrayStride: 8,
                attributes: [{
                    format: "float32x2",
                    offset: 0,
                    shaderLocation: 0
                }]
            }, {
                arrayStride: 12,
                attributes: [{
                    format: "float32x3",
                    offset: 0,
                    shaderLocation: 1
                }]
            }],
            entryPoint: "main"
        },
        multisample: {
            count: 4,
            alphaToCoverageEnabled: false
        },
        fragment: {
            module: device.createShaderModule({
                code: shader.fragment
            }),
            entryPoint: "main",
            targets: [{
                format: swapChainFormat
            }]
        },
        primitive: {topology: "triangle-list"},
        
    });

    const commandEncoder = device.createCommandEncoder();
    const myTexture = device.createTexture({
        size: {
            width: 640,
            height: 640
        },
        sampleCount: 4,
        format: swapChainFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    })
    const attachment = myTexture.createView();
    const textureView = context.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: attachment,
            resolveTarget: textureView,
            loadValue: [0.0, 0.5, 1.0, 1],
            storeOp: "store"
        }]
    });

    
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setVertexBuffer(1, colorBuffer);
    renderPass.draw(vertexs.length / 2);
    renderPass.endPass();
    device.queue.submit([commandEncoder.finish()]);
}

//document.onload = function() {
    let button = document.getElementById("b");
    if (button != null) {
        console.log("setting button on click")
        button.onclick = () => {
            const input = document.getElementById("id-color") as HTMLInputElement;
            const color = input.value;
            console.log(`InnerText: ${color}`)
            if (color != null) {
                CreateTriangle(color);
            }
        }
    } else {
        console.log("Fuck the button");
    }

    
    let pieButton = document.getElementById("pie");
    if (pieButton != null) {
        pieButton.onclick = () => {
            const input = document.getElementById("id-array") as HTMLInputElement;
            let resolutionInput = document.getElementById("id-resolution") as HTMLInputElement;
            const resolution: number = parseInt(resolutionInput.value);

            const inputArr = input.value.split(",");
            let newArr: Array<number> = [];
            let total = 0;
            for (let i = 0; i < inputArr.length; i++) {
                const num = parseInt(inputArr[i]);
                total += num;
                newArr.push(num);
            }
            if (total < 360) {
                newArr.push(360 - total);
            }

            console.log(`InnerText: ${resolution}`)
            if (resolution != null) {
                pieChart(newArr, resolution);
            }
        }
    } else {
        console.log("Fuck the button");
    }
//}