import { TTFont, assetManager } from 'cc';

/** db://gmajor/fonts/main.ttf，框架标题、按钮与本工程文本共用这一支 */
const FONT_UUID = 'ee40121d-0b21-4bb3-b95c-fa7d2df322b4';

let font: TTFont | null = null;
let loading = false;
let failed = false;
const waiters: Array<() => void> = [];

/**
 * 载一次字体。没载到（资源缺失）也放行，调用方自行退回系统字体。
 * 全工程共用这一份，不要在别处重复载。
 */
export function preloadZooFont(done: () => void): void {
    if (font || failed) return done();
    waiters.push(done);
    if (loading) return;
    loading = true;
    assetManager.loadAny({ uuid: FONT_UUID }, (err: Error | null, asset: TTFont) => {
        if (!err && asset) font = asset;
        else failed = true;
        loading = false;
        const list = waiters.splice(0);
        for (const fn of list) fn();
    });
}

/** 已载到才非空。没载到返回 null，调用方用系统字体 */
export function zooFont(): TTFont | null {
    return font;
}
