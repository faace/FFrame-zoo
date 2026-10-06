import { _decorator, assetManager, AssetManager, CCObjectFlags, JsonAsset, Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { EDITOR, PREVIEW } from 'cc/env';
import { GMScene, gm } from '../../../gmajor';

const { ccclass, executeInEditMode } = _decorator;

const editing = EDITOR && !PREVIEW;
const DB = 'db://assets/game/bundles/ZooHome';
const RETRY = 30; // 编辑器首次导入图之前多等几轮

type Piece = {
    id: string;
    file: string;
    layer: string;
    order: number;
    place: string | null;
    png?: [number, number];
    anchor: [number, number];
    cocos?: { x: number; y: number; scale: number };
};

type Scenery = {
    layers: string[];
    cocos: { w: number; h: number };
    pieces: Piece[];
};

type Art = { scenery: Scenery; frames: Map<string, SpriteFrame> };

type EditorHost = {
    Message?: { request: (module: string, method: string, url: string) => Promise<string> };
};

let cached: Art | null = null;
let pending: Array<(err: Error | null) => void> | null = null;

/** 把 place 有值的贴纸载进内存。入口在开场景前调用 */
export function preloadZoo(done: (err: Error | null) => void): void {
    if (cached) return done(null);
    if (pending) {
        pending.push(done);
        return;
    }
    pending = [done];
    gm.resource.loadBundle('ZooHome', (err) => {
        if (err) return donePreload(err);
        const bundle = gm.resource.getBundle('ZooHome');
        if (!bundle) return donePreload(new Error('[ScZooHome] ZooHome 未加载'));
        loadArt(bundle, (loadErr, art) => {
            if (loadErr || !art) return donePreload(loadErr ?? new Error('[ScZooHome] 园景失败'));
            cached = art;
            donePreload(null);
        });
    });
}

function donePreload(err: Error | null): void {
    const list = pending ?? [];
    pending = null;
    for (const fn of list) fn(err);
}

function frameKey(file: string): string {
    return file.replace(/\.png$/i, '');
}

function placed(scenery: Scenery): Piece[] {
    return scenery.pieces.filter((piece) => piece.place && piece.cocos && piece.png && piece.png.length === 2);
}

function loadArt(bundle: AssetManager.Bundle, done: (err: Error | null, art?: Art) => void): void {
    bundle.load('scenery', JsonAsset, (err, asset) => {
        if (err || !asset?.json) return done(err ?? new Error('[ScZooHome] scenery 失败'));
        const scenery = asset.json as Scenery;
        const list = placed(scenery);
        const frames = new Map<string, SpriteFrame>();
        if (!list.length) return done(null, { scenery, frames });
        let left = list.length;
        for (const piece of list) {
            takeFrame(bundle, frameKey(piece.file), (frame) => {
                if (frame) frames.set(frameKey(piece.file), frame);
                if (--left > 0) return;
                done(null, { scenery, frames });
            });
        }
    });
}

function takeFrame(bundle: AssetManager.Bundle, key: string, done: (frame: SpriteFrame | null) => void): void {
    bundle.load(key + '/spriteFrame', SpriteFrame, (err, frame) => {
        if (!err && frame) return done(frame);
        bundle.load(key, SpriteFrame, (err2, frame2) => done(!err2 && frame2 ? frame2 : null));
    });
}

function place(canvas: Node, scenery: Scenery, frames: Map<string, SpriteFrame>, reportMissing: boolean): void {
    const old = canvas.getChildByName('yard');
    if (old) {
        old.removeFromParent();
        old.destroy();
    }
    const w = scenery.cocos.w;
    const h = scenery.cocos.h;
    const yard = new Node('yard');
    yard.layer = canvas.layer;
    canvas.addChild(yard);
    yard.setSiblingIndex(0);
    const rootUt = yard.addComponent(UITransform);
    rootUt.setAnchorPoint(0, 0); // 原点在画面左下，cocos 坐标直接当本地坐标
    rootUt.setContentSize(w, h);
    yard.setPosition(-w / 2, -h / 2, 0);

    const groups = new Map<string, Node>();
    for (const name of scenery.layers) groups.set(name, makeLayer(yard, name));

    let count = 0;
    const list = placed(scenery).sort((a, b) => a.order - b.order);
    for (const piece of list) {
        const parent = groups.get(piece.layer);
        const frame = frames.get(frameKey(piece.file));
        if (!parent) {
            console.error('[ScZooHome] 没有层', piece.layer);
            continue;
        }
        if (!frame) {
            if (reportMissing) console.error('[ScZooHome] 没有', piece.file);
            continue;
        }
        addPiece(parent, piece, frame);
        count += 1;
    }
    dontSave(yard);
    console.info('[ScZooHome] 摆上', count);
}

function makeLayer(yard: Node, name: string): Node {
    const node = new Node(name);
    node.layer = yard.layer;
    yard.addChild(node);
    const uit = node.addComponent(UITransform);
    uit.setAnchorPoint(0, 0);
    return node;
}

function addPiece(parent: Node, piece: Piece, frame: SpriteFrame): void {
    const png = piece.png;
    const cocos = piece.cocos;
    if (!png || !cocos) return;
    const node = new Node(piece.id.replace(/\//g, '_'));
    node.layer = parent.layer;
    parent.addChild(node);
    const uit = node.addComponent(UITransform);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.trim = false; // 锚点按整张 png，含透明边
    sprite.spriteFrame = frame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    uit.setContentSize(png[0], png[1]);
    uit.setAnchorPoint(piece.anchor[0], piece.anchor[1]);
    node.setPosition(cocos.x, cocos.y, 0);
    node.setScale(cocos.scale, cocos.scale, 1);
}

/** 清单才是坐标来源，生成的节点不写进场景 */
function dontSave(node: Node): void {
    node._objFlags |= CCObjectFlags.DontSave;
    for (const child of node.children) dontSave(child);
}

function queryUuid(url: string, done: (uuid: string | null) => void): void {
    const editor = (globalThis as { Editor?: EditorHost }).Editor;
    const request = editor?.Message?.request;
    if (!request) return done(null);
    request.call(editor.Message, 'asset-db', 'query-uuid', url).then(
        (uuid: string) => done(uuid || null),
        () => done(null),
    );
}

/** 园子。开场背景和 place 有值的贴纸按 scenery.json 的 cocos、anchor 摆。place 为空的不摆 */
@ccclass('ScZooHome')
@executeInEditMode(true)
export class ScZooHome extends GMScene {
    private token = 0;
    private seen = 0; // 编辑器里已经摆上的张数，变多才重摆

    onInit(): void {
        const canvas = this.node.scene?.getChildByName('Canvas');
        if (!canvas) return console.error('[ScZooHome] 没有 Canvas');
        const token = ++this.token;
        this.seen = 0;
        if (editing) this.loadEditor(canvas, token, 0);
        else if (cached) place(canvas, cached.scenery, cached.frames, true);
        else preloadZoo((err) => {
            if (token !== this.token || !this.isValid) return;
            if (err || !cached) return console.error('[ScZooHome] 园景失败', err);
            place(canvas, cached.scenery, cached.frames, true);
        });
    }

    /** 编辑器里按 db 路径取图，不进播放也能看见 */
    private loadEditor(canvas: Node, token: number, attempt: number): void {
        if (token !== this.token || !this.isValid) return;
        queryUuid(`${DB}/scenery.json`, (uuid) => {
            if (token !== this.token || !this.isValid) return;
            if (!uuid) return this.again(canvas, token, attempt);
            assetManager.loadAny({ uuid }, (err: Error | null, asset: JsonAsset) => {
                if (token !== this.token || !this.isValid) return;
                const scenery = asset?.json as Scenery | undefined;
                if (err || !scenery?.pieces) return this.again(canvas, token, attempt);
                this.loadEditorFrames(canvas, scenery, token, attempt);
            });
        });
    }

    private again(canvas: Node, token: number, attempt: number): void {
        if (attempt + 1 >= RETRY) return console.error('[ScZooHome] 编辑器还没有导入 ZooHome');
        setTimeout(() => this.loadEditor(canvas, token, attempt + 1), 500);
    }

    private loadEditorFrames(canvas: Node, scenery: Scenery, token: number, attempt: number): void {
        const list = placed(scenery);
        const frames = new Map<string, SpriteFrame>();
        let left = list.length;
        const finish = (): void => {
            if (token !== this.token || !this.isValid) return;
            const got = frames.size;
            const missing = got < list.length;
            const grew = got > this.seen;
            const last = attempt + 1 >= RETRY;
            const keepWaiting = missing && !last && (grew || !got);
            if (grew) this.seen = got;
            if (grew || (!keepWaiting && got)) place(canvas, scenery, frames, !keepWaiting);
            if (keepWaiting) setTimeout(() => this.loadEditorFrames(canvas, scenery, token, attempt + 1), 500);
            else if (missing && !got) console.error('[ScZooHome] 编辑器还没有贴纸');
        };
        if (!left) return finish();
        for (const piece of list) {
            queryUuid(`${DB}/${piece.file}/spriteFrame`, (uuid) => {
                if (!uuid) {
                    if (--left === 0) finish();
                    return;
                }
                assetManager.loadAny({ uuid }, (err: Error | null, frame: SpriteFrame) => {
                    if (!err && frame) frames.set(frameKey(piece.file), frame);
                    if (--left === 0) finish();
                });
            });
        }
    }
}
