import { Prefab } from 'cc';
import { GMBindContext, GMBundleEntryBase, gm, gu, registerBundleEntry } from 'db://gmajor/index';
import { config } from '../../config';
import { preloadZoo } from './ScZooHome';

/** web 入口：预载确认框，园景进内存后打开园子 */
class ZooHomeEntry extends GMBundleEntryBase {
    constructor() {
        super('ZooHome');
    }

    onBind(ctx: GMBindContext): Promise<void> {
        gu.loadingShow('ZooHome.scenery');
        const { bundle, prefab } = config.alert;
        return new Promise((resolve, reject) => {
            ctx.resource.load(bundle, prefab, Prefab, (err, asset) => {
                if (err || !asset) {
                    gu.loadingHide('ZooHome.scenery');
                    console.error('[ZooHome] 预载 LyAlert 失败', err);
                    return reject(err ?? new Error('[ZooHome] 预载 LyAlert 失败'));
                }
                gm.ui.setAlertPrefab(asset);
                preloadZoo((zooErr) => {
                    gu.loadingHide('ZooHome.scenery');
                    if (zooErr) return reject(zooErr);
                    ctx.openScene('ScZooHome', (openErr) => {
                        if (openErr) return console.error('[ZooHome] openScene 失败', openErr);
                    });
                    resolve();
                });
            });
        });
    }
}

registerBundleEntry('ZooHome', new ZooHomeEntry());
