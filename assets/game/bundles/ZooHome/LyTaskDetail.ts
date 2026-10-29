import { _decorator } from 'cc';
import { ZooLayer } from './ZooLayer';

const { ccclass } = _decorator;

/** 任务详情。内容挂 this.body；顶栏（标题条 + 关闭钮）由 ZooLayer 统一建 */
@ccclass('LyTaskDetail')
export class LyTaskDetail extends ZooLayer {
    protected onLayerInit(): void {
        this.setTitle('任务详情');
    }
}
