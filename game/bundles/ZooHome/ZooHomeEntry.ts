import { GMBindContext, GMBundleEntryBase, gu, registerBundleEntry } from '../../../gmajor';
import { preloadZoo } from './ScZooHome';

/** web 入口：园景进内存后打开园子 */
class ZooHomeEntry extends GMBundleEntryBase {
    constructor() {
        super('ZooHome');
    }

    onBind(ctx: GMBindContext): Promise<void> {
        gu.loadingShow('ZooHome.scenery');
        return new Promise((resolve, reject) => {
            preloadZoo((err) => {
                gu.loadingHide('ZooHome.scenery');
                if (err) return reject(err);
                ctx.openScene('ScZooHome', (openErr) => {
                    if (openErr) return console.error('[ZooHome] openScene 失败', openErr);
                });
                resolve();
            });
        });
    }
}

registerBundleEntry('ZooHome', new ZooHomeEntry());
