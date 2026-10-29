import { _decorator } from 'cc';
import { ZooLayer } from './ZooLayer';

const { ccclass } = _decorator;

/** 商店。内容挂 this.body；顶栏（标题条 + 关闭钮）由 ZooLayer 统一建 */
@ccclass('LyShop')
export class LyShop extends ZooLayer {
    protected onLayerInit(): void {
        this.setTitle('商店');
    }
}
