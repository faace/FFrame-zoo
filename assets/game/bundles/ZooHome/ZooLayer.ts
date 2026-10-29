import { _decorator, Color, Label, Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { EDITOR, PREVIEW } from 'cc/env';
import { GMLayer, applySkin, gu } from 'db://gmajor/index';
import { zooFont } from './ZooFont';

const { ccclass } = _decorator;

const editing = EDITOR && !PREVIEW;

/** 面板默认尺寸。预制体里 panel 的 UITransform 与这里一致；改尺寸两处一起改 */
export const PANEL_W = 620;
export const PANEL_H = 800;

/** 标题条：压在 panel 顶边上，条身中心在顶边往下 15 */
const TITLE_H = 85;
const TITLE_OFFSET_Y = 15;
const TITLE_FILL = new Color(92, 64, 32, 255);

/** 关闭钮：88×88 中档纯图标，中心距 panel 右边缘 15 */
const CLOSE_SIZE = 88;
const CLOSE_INSET = 15;

/**
 * 本工程所有弹窗的基类：在 GMLayer 之上补标题条与关闭钮。
 * 子类不要自己摆顶栏，改 this.setTitle() 换字；内容一律挂 this.body。
 */
@ccclass('ZooLayer')
export class ZooLayer extends GMLayer {
    protected body: Node | null = null;
    private titleLabel: Label | null = null;

    onInit(): void {
        if (!this.panel) return;
        this.buildChrome();
        this.onLayerInit();
    }

    /** 子类在这里建自己的内容 */
    protected onLayerInit(): void {}

    /** 换标题字。子类预制体里没放标题条也能用 */
    setTitle(text: string): void {
        if (this.titleLabel) this.titleLabel.string = text;
    }

    /** 关自己。框架会把 mask 和 panel 一起退场 */
    protected close(): void {
        gu.closeLayer(this.node.name);
    }

    private buildChrome(): void {
        const panel = this.panel;
        if (!panel) return;
        const halfH = PANEL_H / 2;

        // 标题条
        if (!panel.getChildByName('titleBar')) {
            const bar = new Node('titleBar');
            bar.layer = panel.layer;
            panel.addChild(bar);
            const barUit = bar.addComponent(UITransform);
            barUit.setContentSize(PANEL_W - 80, TITLE_H);
            barUit.setAnchorPoint(0.5, 0.5);
            const plate = bar.addComponent(Sprite);
            plate.sizeMode = Sprite.SizeMode.CUSTOM;
            plate.type = Sprite.Type.SLICED;
            applySkin('title_bar', (frame: SpriteFrame) => {
                if (!plate.isValid) return;
                plate.spriteFrame = frame;
                plate.sizeMode = Sprite.SizeMode.CUSTOM;
                plate.type = Sprite.Type.SLICED;
            });
            bar.setPosition(0, halfH - TITLE_OFFSET_Y, 0);

            const labelNode = new Node('label');
            labelNode.layer = bar.layer;
            bar.addChild(labelNode);
            labelNode.addComponent(UITransform).setAnchorPoint(0.5, 0.5);
            const label = labelNode.addComponent(Label);
            label.string = '';
            label.fontSize = 36;
            label.lineHeight = 36;
            label.color = TITLE_FILL;
            label.horizontalAlign = Label.HorizontalAlign.CENTER;
            label.verticalAlign = Label.VerticalAlign.CENTER;
            label.overflow = Label.Overflow.SHRINK;
            label.enableWrapText = false;
            const f = zooFont();
            if (f) {
                label.font = f;
                label.isSystemFontUsed = false;
            } else {
                label.isSystemFontUsed = true;
            }
            labelNode.setPosition(0, 0, 0);
            this.titleLabel = label;
        } else {
            this.titleLabel = panel.getChildByName('titleBar')?.getChildByName('label')?.getComponent(Label) ?? null;
        }

        // 关闭钮
        if (!panel.getChildByName('btnClose')) {
            const btn = new Node('btnClose');
            btn.layer = panel.layer;
            panel.addChild(btn);
            const uit = btn.addComponent(UITransform);
            uit.setContentSize(CLOSE_SIZE, CLOSE_SIZE);
            uit.setAnchorPoint(0.5, 0.5);
            const plate = btn.addComponent(Sprite);
            plate.sizeMode = Sprite.SizeMode.CUSTOM;
            plate.type = Sprite.Type.SLICED;
            applySkin('btn_secondary', (frame: SpriteFrame) => {
                if (!plate.isValid) return;
                plate.spriteFrame = frame;
                plate.sizeMode = Sprite.SizeMode.CUSTOM;
                plate.type = Sprite.Type.SLICED;
            });

            const iconNode = new Node('icon');
            iconNode.layer = btn.layer;
            btn.addChild(iconNode);
            const iconUit = iconNode.addComponent(UITransform);
            iconUit.setContentSize(48, 48);
            iconUit.setAnchorPoint(0.5, 0.5);
            const icon = iconNode.addComponent(Sprite);
            icon.sizeMode = Sprite.SizeMode.CUSTOM;
            applySkin('icon_close', (frame: SpriteFrame) => {
                if (!icon.isValid) return;
                icon.spriteFrame = frame;
                icon.sizeMode = Sprite.SizeMode.CUSTOM;
            });

            btn.setPosition(PANEL_W / 2 - CLOSE_INSET - CLOSE_SIZE / 2, halfH - TITLE_OFFSET_Y, 0);
            if (!editing) gu.addClick(btn, () => this.close());
        }

        // 内容根：标题条下沿到面板底边之间
        if (!panel.getChildByName('body')) {
            const body = new Node('body');
            body.layer = panel.layer;
            panel.addChild(body);
            const bodyUit = body.addComponent(UITransform);
            const topInset = TITLE_OFFSET_Y + TITLE_H / 2;
            bodyUit.setContentSize(PANEL_W - 48, PANEL_H - topInset - 48);
            bodyUit.setAnchorPoint(0.5, 0.5);
            body.setPosition(0, -topInset / 2, 0);
        }
        this.body = panel.getChildByName('body');
    }
}
