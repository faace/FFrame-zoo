/** 项目配置（跟 game/ 走；gmajor 不 import 本文件） */
export const config = {
    v: 1, // 本文件格式
    version: { app: '0.1.0' }, // 游戏版本
    boot: [], // 常驻以后再绑
    entry: { web: 'ZooHome' }, // role → 入口包
    alert: { bundle: 'ZooHome', prefab: 'LyAlert' }, // 确认框以后再做，开机不预载
};
