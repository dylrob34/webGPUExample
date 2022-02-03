/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const shaders_1 = __webpack_require__(/*! ./shaders */ "./src/shaders.ts");
const colorValues = [
    [128, 0, 0],
    [128, 128, 0],
    [0, 128, 0],
    [128, 0, 128],
    [0, 128, 128],
    [0, 0, 128]
];
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
function initGPU(canvasName) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const canvas = document.getElementById(canvasName);
        const adapter = yield ((_a = navigator.gpu) === null || _a === void 0 ? void 0 : _a.requestAdapter());
        const device = yield (adapter === null || adapter === void 0 ? void 0 : adapter.requestDevice());
        const context = canvas.getContext("webgpu");
        const swapChainFormat = "bgra8unorm";
        context.configure({
            device: device,
            format: swapChainFormat,
        });
        return { device, context, swapChainFormat };
    });
}
function createBuffer(device, data, usageFlag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usageFlag,
        mappedAtCreation: true
    });
    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    return buffer;
}
function createIntBuffer(device, data, usageFlag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usageFlag,
        mappedAtCreation: true
    });
    new Int32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    return buffer;
}
function CreateTriangle(color = "(1.0,1.0,1.0,1.0)") {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Creating Triangle");
        if (!navigator.gpu) {
            throw ("Your current browser does not support WebGPU!");
        }
        const gpu = yield initGPU("canvas-webgpu");
        const device = gpu.device;
        const context = gpu.context;
        const swapChainFormat = gpu.swapChainFormat;
        const shader = (0, shaders_1.Shaders)(color);
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
            primitive: { topology: "triangle-list" },
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
        });
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
    });
}
function toRadians(angle) {
    return angle * (Math.PI / 180);
}
function rotate(angle, point) {
    let resultX = (point[0] * Math.cos(toRadians(angle))) + (point[1] * Math.sin(toRadians(angle)));
    let resultY = (-1 * point[0] * Math.sin(toRadians(angle))) + (point[1] * Math.cos(toRadians(angle)));
    return [resultX, resultY];
}
function rotateMatrix(angle, matrix) {
    let vertexs = [];
    for (var i = 0; i < matrix.length; i++) {
        vertexs.push(rotate(angle, matrix[i]));
    }
    return vertexs;
}
function offsetMatrix(matrix) {
    for (var i = 0; i < matrix.length; i++) {
        matrix[i] = matrix[i] + .5;
    }
}
function matToArray(matrix) {
    let arr = [];
    for (var i = 0; i < matrix.length; i++) {
        arr.push(matrix[i][0]);
        arr.push(matrix[i][1]);
    }
    return arr;
}
function createWedge(start, current, resolution) {
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
    let beginX = .0;
    let beginY = .9;
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
function getWedgeColorVertexs(start, size, resolution, colorIndex) {
    let colors = [];
    let vertexs = [];
    let wedge = createWedge(start, size, resolution);
    for (var j = 0; j < wedge.length; j++) {
        if (j % 2 == 0) {
            colors.push(colorValues[colorIndex][0]);
            colors.push(colorValues[colorIndex][1]);
            colors.push(colorValues[colorIndex][2]);
        }
        vertexs.push(wedge[j]);
    }
    return [colors, vertexs];
}
function pieChart(categories, resolution) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Creating Triangle");
        if (!navigator.gpu) {
            throw ("Your current browser does not support WebGPU!");
        }
        const gpu = yield initGPU("canvas-pie");
        const device = gpu.device;
        const context = gpu.context;
        const swapChainFormat = gpu.swapChainFormat;
        categories = categories.sort((a, b) => a - b);
        let currentStart = 0;
        let vertexs = [];
        let colors = [];
        for (var i = 0; i < categories.length; i++) {
            if (categories[i] > 180) {
                const categorySize = categories[i];
                const min = Math.floor(categorySize / 90);
                const remainder = categorySize % 90;
                let wedges;
                if (remainder === 0) {
                    wedges = min;
                }
                else {
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
                    });
                    colorVerts[1].map((value) => {
                        vertexs.push(value);
                    });
                    currentStart += size;
                }
            }
            else {
                const colorVerts = getWedgeColorVertexs(currentStart, categories[i], resolution, i);
                colorVerts[0].map((value) => {
                    colors.push(value);
                });
                colorVerts[1].map((value) => {
                    vertexs.push(value);
                });
            }
            currentStart += categories[i];
        }
        const vertexBuffer = createBuffer(device, Float32Array.from(vertexs));
        const colorBuffer = createBuffer(device, Float32Array.from(colors));
        const shader = (0, shaders_1.Shaders1)();
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
            primitive: { topology: "triangle-list" },
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
        });
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
    });
}
//document.onload = function() {
let button = document.getElementById("b");
if (button != null) {
    console.log("setting button on click");
    button.onclick = () => {
        const input = document.getElementById("id-color");
        const color = input.value;
        console.log(`InnerText: ${color}`);
        if (color != null) {
            CreateTriangle(color);
        }
    };
}
else {
    console.log("Fuck the button");
}
let pieButton = document.getElementById("pie");
if (pieButton != null) {
    pieButton.onclick = () => {
        const input = document.getElementById("id-array");
        let resolutionInput = document.getElementById("id-resolution");
        const resolution = parseInt(resolutionInput.value);
        const inputArr = input.value.split(",");
        let newArr = [];
        let total = 0;
        for (let i = 0; i < inputArr.length; i++) {
            const num = parseInt(inputArr[i]);
            total += num;
            newArr.push(num);
        }
        if (total < 360) {
            newArr.push(360 - total);
        }
        console.log(`InnerText: ${resolution}`);
        if (resolution != null) {
            pieChart(newArr, resolution);
        }
    };
}
else {
    console.log("Fuck the button");
}
//}


/***/ }),

/***/ "./src/shaders.ts":
/*!************************!*\
  !*** ./src/shaders.ts ***!
  \************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ShadersOld = exports.Shaders1 = exports.Shaders = void 0;
const Shaders = (color) => {
    const vertex = `
        [[stage(vertex)]]
        fn main([[builtin(vertex_index)]] VertexIndex: u32) -> [[builtin(position)]] vec4<f32> {
            var pos = array<vec2<f32>, 3>(
                vec2<f32>(0.0, 0.5),
                vec2<f32>(-0.5, -0.5),
                vec2<f32>(0.5, -0.5));
            return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        }
    `;
    const fragment = `
        [[stage(fragment)]]
        fn main() -> [[location(0)]] vec4<f32> {
            return vec4<f32>${color};
        }
    `;
    return { vertex, fragment };
};
exports.Shaders = Shaders;
const Shaders1 = () => {
    const vertex = `
        struct Inputs {
            [[location(0)]] pos : vec4<f32>;
            [[location(1)]] index: vec4<f32>;
        };

        struct Outputs {
            [[builtin(position)]] Position : vec4<f32>;
            [[location(0)]] vColor : vec4<f32>;
        };

        [[stage(vertex)]]
        fn main(in: Inputs) -> Outputs {
            let outPos = vec4<f32>(in.pos[0], in.pos[1], 0.0, 1.0);
            let outColor = vec4<f32>(in.index[0], in.index[1], in.index[2], 1.0);
            var out: Outputs;
            out.Position = outPos;
            out.vColor = outColor;
            return out;
        }
    `;
    const fragment = `
        [[stage(fragment)]]
        fn main([[location(0)]] vColor : vec4<f32>) -> [[location(0)]] vec4<f32> {
            return vColor;
        }
    `;
    return { vertex, fragment };
};
exports.Shaders1 = Shaders1;
const ShadersOld = (color) => {
    const vertex = `
        const pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(
            vec2<f32>(0.0, 0.5),
            vec2<f32>(-0.5, -0.5),
            vec2<f32>(0.5, -0.5));
        [[builtin(position)]] var<out> Position : vec4<f32>;
        [[builtin(vertex_idx)]] var<in> VertexIndex : i32;
        [[stage(vertex)]]
        fn main() -> void {
            Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
            return;
        }
    `;
    const fragment = `
        [[location(0)]] var<out> outColor : vec4<f32>;
        [[stage(fragment)]]
        fn main() -> void {
            outColor = vec4<f32>${color};
            return;
        }
    `;
    return { vertex, fragment };
};
exports.ShadersOld = ShadersOld;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.bundle.js.map