import { _decorator, Label, Node, Sprite, tween, Tween, Vec3 } from 'cc';
import { GMScene, gu, PfGMItemCell } from 'db://gmajor/index';

const { ccclass } = _decorator;

const ITEMS: Record<string, { name: string; level: number; chain: string; source: string; next: string }> = {
    W01: { name: '树枝', level: 1, chain: '木料', source: '木料生成器', next: '枝干' },
    W02: { name: '枝干', level: 2, chain: '木料', source: '树枝合成', next: '树桩' },
    W03: { name: '树桩', level: 3, chain: '木料', source: '枝干合成', next: '原木' },
    W04: { name: '原木', level: 4, chain: '木料', source: '树桩合成', next: '木板' },
    W05: { name: '木板', level: 5, chain: '木料', source: '原木合成', next: '木板堆' },
    W06: { name: '木板堆', level: 6, chain: '木料', source: '木板合成', next: '成捆木料' },
    T01: { name: '斧头', level: 1, chain: '工具', source: '工具生成器', next: '锤子' },
    T02: { name: '锤子', level: 2, chain: '工具', source: '斧头合成', next: '螺丝刀' },
    P01: { name: '嫩芽', level: 1, chain: '植物', source: '植物生成器', next: '草丛' },
    P02: { name: '草丛', level: 2, chain: '植物', source: '嫩芽合成', next: '花丛' },
    P03: { name: '花丛', level: 3, chain: '植物', source: '草丛合成', next: '灌木' },
    A01: { name: '兔子', level: 1, chain: '动物', source: '动物生成器', next: '狐狸' },
    A02: { name: '狐狸', level: 2, chain: '动物', source: '兔子合成', next: '浣熊' },
    C01: { name: '清洁刷', level: 1, chain: '清洁', source: '清洁生成器', next: '清洁用品 Lv.2' },
    F01: { name: '餐食', level: 1, chain: '餐食', source: '餐食生成器', next: '餐食 Lv.2' },
    G01: { name: '导览物品', level: 1, chain: '导览', source: '导览产出', next: '导览 Lv.2' },
    'GEN-W': { name: '木料生成器', level: 1, chain: '生成器', source: '产出木料', next: '使用升级套件' },
    'GEN-T': { name: '工具生成器', level: 1, chain: '生成器', source: '产出工具', next: '使用升级套件' },
};

const SAMPLE_ITEMS: Record<number, string> = {
    8: 'W01', 9: 'W01', 10: 'W02', 15: 'W03', 16: 'W04', 17: 'W05', 19: 'T01',
    22: 'P01', 23: 'P02', 24: 'P03', 26: 'T02', 29: 'A01', 30: 'A02', 31: 'GEN-W',
    33: 'GEN-T', 36: 'C01', 37: 'F01', 38: 'W06', 40: 'G01',
};

/** 合成页 UI 样例。样例物品与任务不读写玩家数据，正式玩法接入时替换这一层绑定。 */
@ccclass('ScMerge')
export class ScMerge extends GMScene {
    private page: Node | null = null;
    private selected = -1;

    onInit(): void {
        this.page = this.node.scene?.getChildByName('Canvas')?.getChildByName('mergePage') ?? null;
        if (!this.page) return console.error('[ScMerge] 缺少 mergePage');
        this.click('pfBtnHome', () => gu.openScene('ScZooHome', { bundle: 'ZooHome' }));
        this.click('pfBtnSetting', () => this.openLayer('LySetting'));
        this.click('pfBtnShop', () => this.openLayer('LyShop'));
        this.click('pfBtnBag', () => this.openLayer('LyBag'));
        this.click('pfBtnReward', () => this.openLayer('LyReward'));
        const detail = this.page.getChildByName('detail');
        const info = detail?.getChildByName('pfBtnInfo');
        if (info) gu.addClick(info, () => this.showInfo());
        const board = this.page.getChildByName('board');
        for (let i = 0; i < 63; i++) {
            const cell = board?.getChildByName('cell' + i);
            if (cell) gu.addClick(cell, () => this.select(i), { press: 'none' });
            const art = board?.getChildByName('item' + i);
            if (art) gu.addClick(art, () => this.select(i), { press: 'none' });
        }
        const descriptions = [
            '修缮围栏\n木板 1/2 · 斧头 1/1\n奖励：120 金币',
            '布置花圃\n花丛 1/2 · 灌木 0/1\n奖励：180 金币',
            '动物新家\n兔子 1/1 · 木板堆 0/1\n奖励：240 金币',
        ];
        descriptions.forEach((text, i) => this.click('task' + i, () => gu.alert({ content: text, ok: { text: '确定' } })));
        this.select(31);
    }

    private click(name: string, cb: () => void): void {
        const node = this.page?.getChildByName(name);
        if (node) gu.addClick(node, cb);
    }

    private openLayer(name: string): void {
        gu.showLayer(name, { bundle: 'ZooHome' }, (err: Error | null) => {
            if (err) console.error('[ScMerge] 打开弹窗失败', name, err);
        });
    }

    private select(index: number): void {
        const board = this.page?.getChildByName('board');
        const old = board?.getChildByName('cell' + this.selected)?.getComponent(PfGMItemCell);
        if (old) old.selected = false;
        const cell = board?.getChildByName('cell' + index)?.getComponent(PfGMItemCell);
        if (cell) cell.selected = true;
        this.selected = index;
        const item = ITEMS[SAMPLE_ITEMS[index]];
        const detail = this.page?.getChildByName('detail');
        if (!detail) return;
        detail.active = !!item;
        if (!item) return;
        this.setLabel(detail, 'detailName', item.name);
        this.setLabel(detail, 'detailLevel', `Lv.${item.level} · ${item.chain}`);
        this.setLabel(detail, 'detailSource', item.source);
        const source = board?.getChildByName('item' + index)?.getComponent(Sprite)?.spriteFrame;
        const icon = detail.getChildByName('detailIcon')?.getComponent(Sprite);
        if (icon && source) icon.spriteFrame = source;
        const art = board?.getChildByName('item' + index);
        if (art) {
            Tween.stopAllByTarget(art);
            tween(art).to(0.08, { scale: new Vec3(1.08, 1.08, 1) }).to(0.08, { scale: Vec3.ONE }).start();
        }
    }

    private setLabel(parent: Node, name: string, value: string): void {
        const label = parent.getChildByName(name)?.getComponent(Label);
        if (label) label.string = value;
    }

    private showInfo(): void {
        const item = ITEMS[SAMPLE_ITEMS[this.selected]];
        if (!item) return;
        gu.alert({ content: `${item.name} · Lv.${item.level}\n来源：${item.source}\n下一阶段：${item.next}`, ok: { text: '确定' } });
    }
}
