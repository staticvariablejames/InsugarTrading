import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
    input: 'src/main.ts',
    output: {
        dir: 'dist',
        format: 'umd',
        freeze: false, // Game.registerMod requires the object to be mutable
        name: 'InsugarTrading',
    },
    plugins: [
        typescript(),
        json(),
    ],
};
