/*
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
  not use Cocos Creator software for developing other software or tools that's
  used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/

/**
 * @category material
 */

import { Asset } from '../../assets/asset';
import { ccclass, property } from '../../core/data/class-decorator';
import { GFXDynamicState, GFXPrimitiveMode, GFXType } from '../../gfx/define';
import { GFXBlendState, GFXDepthStencilState, GFXRasterizerState } from '../../gfx/pipeline-state';
import { RenderPassStage } from '../../pipeline/define';
import { programLib } from '../../renderer/core/program-lib';

export interface IPropertyInfo {
    type: number; // auto-extracted
    value?: number[] | string;
    sampler?: Array<number | undefined>;
}
export interface IPassStates {
    priority?: number;
    primitive?: GFXPrimitiveMode;
    stage?: RenderPassStage;
    rasterizerState?: GFXRasterizerState;
    depthStencilState?: GFXDepthStencilState;
    blendState?: GFXBlendState;
    dynamics?: GFXDynamicState[];
    customizations?: string[];
    phase?: string;
}
export interface IPassInfo extends IPassStates {
    program: string; // auto-generated
    switch?: string;
    properties?: Record<string, IPropertyInfo>;
}
export interface ITechniqueInfo {
    passes: IPassInfo[];
    name?: string;
}

export interface IBlockMember {
    size: number;
    // extends GFXUniform
    name: string;
    type: GFXType;
    count: number;
}
export interface IBlockInfo {
    size: number;
    // extends GFXUniformBlock
    binding: number;
    name: string;
    members: IBlockMember[];
}
export interface ISamplerInfo {
    // extends GFXUniformSampler
    binding: number;
    name: string;
    type: GFXType;
    count: number;
}
export interface IDefineInfo {
    name: string;
    type: string;
    range?: number[];
    options?: string[];
    default?: string;
}
export interface IBuiltinInfo {
    blocks: string[];
    samplers: string[];
}
export interface IShaderInfo {
    name: string;
    hash: number;
    glsl3: { vert: string, frag: string };
    glsl1: { vert: string, frag: string };
    builtins: { globals: IBuiltinInfo, locals: IBuiltinInfo };
    defines: IDefineInfo[];
    blocks: IBlockInfo[];
    samplers: ISamplerInfo[];
    dependencies: Record<string, string>;
}

const effects: Record<string, EffectAsset> = {};

/**
 * @zh
 * Effect 资源，作为材质实例初始化的模板，每个 effect 资源都应是全局唯一的。
 */
@ccclass('cc.EffectAsset')
export class EffectAsset extends Asset {
    /**
     * @zh
     * 将指定 effect 注册到全局管理器。
     */
    public static register (asset: EffectAsset) { effects[asset.name] = asset; }
    /**
     * @zh
     * 将指定 effect 从全局管理器移除。
     */
    public static remove (name: string) {
        if (effects[name]) { delete effects[name]; return; }
        for (const n in effects) {
            if (effects[n]._uuid === name) {
                delete effects[n];
                return;
            }
        }
    }
    /**
     * @zh
     * 获取指定名字的 effect 资源。
     */
    public static get (name: string) {
        if (effects[name]) { return effects[name]; }
        for (const n in effects) {
            if (effects[n]._uuid === name) {
                return effects[n];
            }
        }
        return null;
    }
    /**
     * @zh
     * 获取所有已注册的 effect 资源。
     */
    public static getAll () { return effects; }
    protected static _effects: Record<string, EffectAsset> = {};

    /**
     * @zh
     * 当前 effect 的所有可用 technique。
     */
    @property
    public techniques: ITechniqueInfo[] = [];

    /**
     * @zh
     * 当前 effect 使用的所有 shader。
     */
    @property
    public shaders: IShaderInfo[] = [];

    /**
     * @zh
     * 通过 Loader 加载完成时的回调，将自动注册 effect 资源。
     */
    public onLoaded () {
        this.shaders.forEach((s) => programLib.define(s));
        EffectAsset.register(this);
        // replace null with undefined
        this.techniques.forEach((t) => t.passes.forEach((p) => {
            if (!p.properties) { return; }
            for (const prop of Object.values(p.properties)) {
                if (!prop.sampler) { continue; }
                prop.sampler = prop.sampler.map((s) => s === null ? undefined : s);
            }
        }));
    }
}

cc.EffectAsset = EffectAsset;