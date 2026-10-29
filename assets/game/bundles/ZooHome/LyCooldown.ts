import { _decorator } from 'cc';
import { ZooLayer } from './ZooLayer';

const { ccclass } = _decorator;

/** 恢复中。内容挂 this.body；顶栏（标题条 + 关闭钮）由 ZooLayer 统一建 */
@ccclass('LyCooldown')
export class LyCooldown extends ZooLayer {
    protected onLayerInit(): void {
        this.setTitle('恢复中');
    }
}
