/** 项目配置（跟 assets/game/ 走；gmajor 不 import 本文件） */
export const config = {
    v: 1, // 本文件格式
    version: { app: '0.1.0', gmajor: '0.5.0' }, // app 版本；gmajor = 按哪个框架版本写的
    boot: [], // 常驻以后再绑
    entry: { web: 'ZooHome' }, // role → 入口包
    alert: { bundle: 'ZooHome', prefab: 'LyAlert' }, // 确认框以后再做，开机不预载
};
