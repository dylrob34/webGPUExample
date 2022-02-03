export const Shaders = (color:string) => {
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
    return {vertex, fragment};
}

export const Shaders1 = () => {
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
    return {vertex, fragment};
}

export const ShadersOld = (color:string) => {
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
    return {vertex, fragment};
}