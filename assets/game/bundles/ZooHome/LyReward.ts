import { _decorator } from 'cc';
import { ZooLayer } from './ZooLayer';

const { ccclass } = _decorator;

/** 待领奖励。内容挂 this.body；顶栏（标题条 + 关闭钮）由 ZooLayer 统一建 */
@ccclass('LyReward')
export class LyReward extends ZooLayer {
    protected onLayerInit(): void {
        this.setTitle('待领奖励');
    }
}
