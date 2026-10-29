import { _decorator, Color, Label, Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { EDITOR, PREVIEW } from 'cc/env';
import { gu, applySkin } from 'db://gmajor/index';
import { zooFont } from './ZooFont';

const { ccclass } = _decorator;

const editing = EDITOR && !PREVIEW;

/** HUD 文字颜色：白字配深褐描边，压在园景上也看得清 */
const TEXT = new Color(255, 255, 255, 255);
const OUTLINE = new Color(62, 40, 18, 255);
const OUTLINE_W = 3;

/** 顶部一行的高度与位置（画布 720×1280，原点在中心） */
const TOP_Y = 600;
const SIDE_PAD = 24;

type LabelOpts = {
    text: string;
    x: number;
    y: number;
    size?: number; // 字号，缺省 32
    anchorX?: number; // 缺省 0.5 居中
    color?: Color;
};

/** 建一个带描边的标签，返回 Label 便于之后 setText */
function makeLabel(parent: Node, opts: LabelOpts): Label {
    const node = new Node('label');
    node.layer = parent.layer;
    parent.addChild(node);
    node.addComponent(UITransform).setAnchorPoint(opts.anchorX ?? 0.5, 0.5);
    const label = node.addComponent(Label);
    label.string = opts.text;
    label.fontSize = opts.size ?? 32;
    label.lineHeight = opts.size ?? 32;
    label.color = opts.color ?? TEXT;
    label.horizontalAlign = opts.anchorX === 0 ? Label.HorizontalAlign.LEFT
        : (opts.anchorX === 1 ? Label.HorizontalAlign.RIGHT : Label.HorizontalAlign.CENTER);
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.overflow = Label.Overflow.NONE;
    label.enableWrapText = false;
    label.enableOutline = true;
    label.outlineWidth = OUTLINE_W;
    label.outlineColor = OUTLINE;
    const f = zooFont();
    if (f) {
        label.font = f;
        label.isSystemFontUsed = false;
    } else {
        label.isSystemFontUsed = true;
    }
    node.setPosition(opts.x, opts.y, 0);
    return label;
}

/** 建一个取 Skin 槽的图标 */
function makeIcon(parent: Node, slot: string, size: number, x: number, y: number): Sprite {
    const node = new Node(slot);
    node.layer = parent.layer;
    parent.addChild(node);
    const uit = node.addComponent(UITransform);
    uit.setContentSize(size, size);
    uit.setAnchorPoint(0.5, 0.5);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    applySkin(slot, (frame: SpriteFrame) => {
        if (!sprite.isValid) return;
        sprite.spriteFrame = frame;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    });
    node.setPosition(x, y, 0);
    return sprite;
}

/** HUD 上会变的文字，挂出去给业务更新 */
export type HomeHudView = {
    root: Node;
    setEnergy: (cur: number, max: number) => void;
    setBuild: (built: number, total: number) => void;
    setMaterial: (n: number) => void;
};

/**
 * 在 home 容器里搭顶部 HUD 与底部素材数。返回各文字的 setter。
 * 数值先给占位，等数据层接上再换。
 */
export function mountHud(home: Node, canvas: Node, onToggle: (hidden: boolean) => void): HomeHudView {
    const W = 720;
    const halfW = W / 2;

    // —— 顶部：体力（左）、建设进度（中）、隐藏 UI（右）——
    const top = new Node('hudTop');
    top.layer = home.layer;
    home.addChild(top);

    makeIcon(top, 'icon_energy', 48, -halfW + SIDE_PAD + 24, TOP_Y);
    const energy = makeLabel(top, {
        text: '100/100',
        x: -halfW + SIDE_PAD + 48 + 8,
        y: TOP_Y,
        size: 30,
        anchorX: 0,
    });

    const build = makeLabel(top, {
        text: '0%  ·  0/86',
        x: 20,
        y: TOP_Y,
        size: 30,
    });

    // 隐藏 UI：纯图标方钮，88×88 是框架中档的图标版尺寸
    const hideBtn = new Node('btnHideUi');
    hideBtn.layer = top.layer;
    top.addChild(hideBtn);
    const hideUit = hideBtn.addComponent(UITransform);
    hideUit.setContentSize(88, 88);
    hideUit.setAnchorPoint(0.5, 0.5);
    const hidePlate = hideBtn.addComponent(Sprite);
    hidePlate.sizeMode = Sprite.SizeMode.CUSTOM;
    hidePlate.type = Sprite.Type.SLICED;
    applySkin('btn_secondary', (frame: SpriteFrame) => {
        if (!hidePlate.isValid) return;
        hidePlate.spriteFrame = frame;
        hidePlate.sizeMode = Sprite.SizeMode.CUSTOM;
        hidePlate.type = Sprite.Type.SLICED;
    });
    makeIcon(hideBtn, 'icon_help', 56, 0, 0);
    hideBtn.setPosition(halfW - SIDE_PAD - 44, TOP_Y, 0);

    // —— 底部：剩余素材，贴在建设按钮上方 ——
    const material = makeLabel(home, {
        text: '素材 0',
        x: 140,
        y: -365,
        size: 28,
    });

    // —— 隐藏 UI 后的恢复按钮：半透明，留在原按钮位置 ——
    const restore = new Node('btnRestoreUi');
    restore.layer = canvas.layer;
    canvas.addChild(restore);
    const rUit = restore.addComponent(UITransform);
    rUit.setContentSize(88, 88);
    rUit.setAnchorPoint(0.5, 0.5);
    const rPlate = restore.addComponent(Sprite);
    rPlate.sizeMode = Sprite.SizeMode.CUSTOM;
    rPlate.type = Sprite.Type.SLICED;
    rPlate.color = new Color(255, 255, 255, 150); // 半透明
    applySkin('btn_secondary', (frame: SpriteFrame) => {
        if (!rPlate.isValid) return;
        rPlate.spriteFrame = frame;
        rPlate.sizeMode = Sprite.SizeMode.CUSTOM;
        rPlate.type = Sprite.Type.SLICED;
    });
    makeIcon(restore, 'icon_settings', 56, 0, 0);
    restore.setPosition(halfW - SIDE_PAD - 44, TOP_Y, 0);
    restore.active = false;

    let hidden = false;
    const toggle = (): void => {
        hidden = !hidden;
        home.active = !hidden;
        restore.active = hidden;
        onToggle(hidden);
    };

    if (!editing) {
        gu.addClick(hideBtn, toggle);
        gu.addClick(restore, toggle);
    }

    return {
        root: top,
        setEnergy: (cur, max) => { energy.string = `${cur}/${max}`; },
        setBuild: (built, total) => {
            const pct = total > 0 ? Math.floor((built / total) * 100) : 0;
            build.string = `${pct}%  ·  ${built}/${total}`;
        },
        setMaterial: (n) => { material.string = `素材 ${n}`; },
    };
}
