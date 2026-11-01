import { _decorator } from 'cc';
import { GMFrame } from 'db://gmajor/index';

const { ccclass } = _decorator;

/** 动物园弹窗。顶栏、底框和尺寸在 GMFrame。子类在 onLayerInit 里 setTitle，内容挂 this.body */
@ccclass('ZooLayer')
export class ZooLayer extends GMFrame {}
