import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const home = path.join(root, 'assets/game/bundles/ZooHome');
const out = path.join(home, 'Merge');
const archive = path.resolve(root, '../FFrame-asset-line/scenes/动物园/合成棋盘');
const framework = path.resolve(root, '../FFrame/gmajor');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
const uuid = (name) => {
    const hex = crypto.createHash('sha256').update('zoo-merge-ui-v1/' + name).digest('hex').slice(0, 32);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
const compress = (id) => {
    const hex = id.replaceAll('-', '');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let value = hex.slice(0, 5);
    for (let i = 5; i < 32; i += 3) {
        const n = parseInt(hex.slice(i, i + 3), 16);
        value += chars[n >> 6] + chars[n & 63];
    }
    return value;
};
const ref = (id) => ({ __id__: id });
const asset = (id) => ({ __uuid__: id, __expectedType__: 'cc.SpriteFrame' });
const vec = (x = 0, y = 0, z = 0) => ({ __type__: 'cc.Vec3', x, y, z });
const color = (r, g, b, a = 255) => ({ __type__: 'cc.Color', r, g, b, a });
fs.mkdirSync(path.join(out, 'res'), { recursive: true });

// Keep stable UUIDs and unmodified source images; Creator owns the imported cache.
const imageTemplate = read(path.join(home, 'res/SouthGate/gate_01.png.meta'));
function importImage(source, name, width, height) {
    const dest = path.join(out, 'res', name + '.png');
    if (!fs.existsSync(source)) throw new Error('Missing source: ' + source);
    fs.copyFileSync(source, dest);
    const id = uuid(name);
    const meta = structuredClone(imageTemplate);
    meta.uuid = id;
    meta.userData.redirect = id + '@6c48a';
    const texture = meta.subMetas['6c48a'];
    texture.uuid = id + '@6c48a';
    texture.displayName = name;
    texture.userData.imageUuidOrDatabaseUri = id;
    texture.userData.minfilter = 'nearest';
    texture.userData.magfilter = 'nearest';
    const sprite = meta.subMetas.f9941;
    sprite.uuid = id + '@f9941';
    sprite.displayName = name;
    Object.assign(sprite.userData, {
        trimX: 0, trimY: 0, offsetX: 0, offsetY: 0, width, height, rawWidth: width, rawHeight: height,
        trimType: 'none', imageUuidOrDatabaseUri: id + '@6c48a',
        vertices: { rawPosition: [], indexes: [], uv: [], nuv: [], minPos: [], maxPos: [] },
    });
    write(dest + '.meta', meta);
    return asset(sprite.uuid);
}
const frames = {};
for (const entry of read(path.join(archive, 'exports/manifest.json'))) {
    const id = entry.review_id;
    frames[id] = importImage(path.join(archive, 'exports/64', id + '.png'), 'item_' + id.toLowerCase().replaceAll('-', '_'), 64, 64);
}
frames.background = importImage(path.join(archive, 'sources/background-v1.png'), 'merge_background', 941, 1672);
frames.board = importImage(path.join(archive, 'sources/board-v2.png'), 'merge_board', 1108, 1419);
for (const sheet of ['ctrl', 'item']) {
    const meta = read(path.join(root, 'assets/game/bundles/Skin/ZooV7', sheet + '.plist.meta'));
    for (const sub of Object.values(meta.subMetas)) frames[sub.name] = asset(sub.uuid);
}

const scene = read(path.join(home, 'ScZooHome.scene'));
const scriptUuid = uuid('ScMerge.ts');
const sceneUuid = uuid('ScMerge.scene');
const nestedRoots = [];
scene[0]._name = scene[1]._name = scene[8]._name = 'ScMerge';
scene[1]._id = sceneUuid;
scene[9].__type__ = compress(scriptUuid);
scene[9]._id = uuid('script-instance');
const add = (obj) => { scene.push(obj); return scene.length - 1; };
const nodeTemplate = structuredClone(scene[8]);
function node(name, parent, x = 0, y = 0, w = 100, h = 100) {
    const obj = structuredClone(nodeTemplate);
    Object.assign(obj, { _name: name, _children: [], _components: [], _prefab: null, _parent: ref(parent), _lpos: vec(x, y), _id: uuid(name + '/' + scene.length) });
    const id = add(obj);
    scene[parent]._children.push(ref(id));
    component(id, 'cc.UITransform', { _contentSize: { __type__: 'cc.Size', width: w, height: h }, _anchorPoint: { __type__: 'cc.Vec2', x: 0.5, y: 0.5 } });
    return id;
}
function component(id, type, props = {}) {
    const index = add({ __type__: type, _name: '', _objFlags: 0, __editorExtras__: {}, node: ref(id), _enabled: true, __prefab: null, ...props, _id: uuid(type + '/' + scene.length) });
    scene[id]._components.push(ref(index));
    return index;
}
const btnSource = read(path.join(framework, 'prefabs/PfGMBtn.prefab'));
const spriteTemplate = btnSource.find((o) => o.__type__ === 'cc.Sprite');
const labelTemplate = btnSource.find((o) => o.__type__ === 'cc.Label');
function picture(name, parent, frame, x, y, w, h, sliced = false) {
    if (!frame) throw new Error('Missing frame: ' + name);
    const id = node(name, parent, x, y, w, h);
    const sprite = structuredClone(spriteTemplate);
    delete sprite.node; delete sprite.__prefab; delete sprite._id; delete sprite.__type__;
    component(id, 'cc.Sprite', { ...sprite, _spriteFrame: frame, _type: sliced ? 1 : 0, _sizeMode: 0, _isTrimmedMode: false });
    return id;
}
function label(name, parent, text, x, y, w, h, size = 24, white = false) {
    const id = node(name, parent, x, y, w, h);
    const lb = structuredClone(labelTemplate);
    delete lb.node; delete lb.__prefab; delete lb._id; delete lb.__type__;
    component(id, 'cc.Label', { ...lb, _string: text, _fontSize: size, _lineHeight: size + 4,
        _color: white ? color(255, 255, 255) : color(78, 53, 29), _horizontalAlign: 1, _verticalAlign: 1,
        _overflow: 2, _enableWrapText: false, _enableOutline: white, _outlineWidth: 3, _outlineColor: color(62, 40, 18) });
    return id;
}
function nested(name, parent, prefabName, x, y, fields = {}, scale = 1) {
    const src = read(path.join(framework, 'prefabs', prefabName + '.prefab'));
    const meta = read(path.join(framework, 'prefabs', prefabName + '.prefab.meta'));
    const rootInfo = src[src[1]._prefab.__id__];
    const ts = src.find((o) => o.__type__ && !o.__type__.startsWith('cc.') && o.node?.__id__ === 1);
    const tsFile = src[ts.__prefab.__id__].fileId;
    const id = node(name, parent, x, y);
    scene[id]._components = [];
    const info = add({ __type__: 'cc.PrefabInfo', root: ref(id), asset: { __uuid__: meta.uuid, __expectedType__: 'cc.Prefab' }, fileId: uuid(name).replaceAll('-', '').slice(0, 16), instance: null, targetOverrides: null, nestedPrefabInstanceRoots: null });
    const instance = add({ __type__: 'cc.PrefabInstance', fileId: uuid(name + 'instance').replaceAll('-', '').slice(0, 16), prefabRootNode: null, mountedChildren: [], mountedComponents: [], propertyOverrides: [], removedComponents: [] });
    scene[id]._prefab = ref(info);
    nestedRoots.push(ref(id));
    scene[info].instance = ref(instance);
    const override = (fileId, key, value) => {
        const target = add({ __type__: 'cc.TargetInfo', localID: [fileId] });
        const prop = add({ __type__: 'CCPropertyOverrideInfo', targetInfo: ref(target), propertyPath: [key], value });
        scene[instance].propertyOverrides.push(ref(prop));
    };
    override(rootInfo.fileId, '_name', name);
    override(rootInfo.fileId, '_lpos', vec(x, y));
    if (scale !== 1) override(rootInfo.fileId, '_lscale', vec(scale, scale, 1));
    for (const [key, value] of Object.entries(fields)) override(tsFile, key, value);
    return id;
}
function button(name, parent, x, y, text, icon = '', theme = 1) {
    return nested(name, parent, 'PfGMBtn', x, y, { size: 2, theme, style: icon ? 2 : 1, text, icon: icon ? frames[icon] : null });
}

const page = node('mergePage', 2, 0, 0, 720, 1280);
picture('background', page, frames.background, 0, 0, 720, 1280);
button('pfBtnHome', page, -304, 584, '', 'icon_home');
button('pfBtnSetting', page, 304, 584, '', 'icon_settings');
for (const [name, icon, text, x] of [['Energy', 'icon_energy', '100/100', -150], ['Gold', 'icon_gold', '1,280', 24], ['Diamond', 'icon_diamond', '50', 176]]) {
    picture('hud' + name, page, frames.input, x, 584, name === 'Energy' ? 164 : 138, 56, true);
    picture('icon' + name, page, frames[icon], x - (name === 'Energy' ? 56 : 44), 584, 44, 44);
    label('value' + name, page, text, x + 20, 584, name === 'Energy' ? 110 : 90, 36, 23);
}
const tasks = [
    { title: '修缮围栏', needs: ['W05', 'T01'], progress: ['1/2', '1/1'], reward: '120', },
    { title: '布置花圃', needs: ['P03', 'P04'], progress: ['1/2', '0/1'], reward: '180', },
    { title: '动物新家', needs: ['A01', 'W06'], progress: ['1/1', '0/1'], reward: '240', },
];
tasks.forEach((task, index) => {
    const x = (index - 1) * 216;
    const card = picture('task' + index, page, frames.panel, x, 454, 208, 176, true);
    label('title', card, task.title, 0, 54, 176, 28, 24);
    task.needs.forEach((id, i) => {
        picture('need' + i, card, frames[id], (i ? 1 : -1) * 43, 10, 50, 50);
        label('progress' + i, card, task.progress[i], (i ? 1 : -1) * 43, -26, 64, 26, 20);
    });
    picture('reward', card, frames.icon_gold, -25, -58, 28, 28);
    label('rewardValue', card, '+' + task.reward, 24, -58, 80, 28, 23);
});

picture('boardBase', page, frames.board, 0, -50, 644, 825);
const board = node('board', page, 0, -50, 556, 716);
for (let i = 0; i < 63; i++) nested('cell' + i, board, 'PfGMItemCell', (i % 7 - 3) * 80, (4 - Math.floor(i / 7)) * 80, {}, 76 / 96);
const samples = {
    8: 'W01', 9: 'W01', 10: 'W02', 15: 'W03', 16: 'W04', 17: 'W05', 19: 'T01',
    22: 'P01', 23: 'P02', 24: 'P03', 26: 'T02', 29: 'A01', 30: 'A02', 31: 'GEN-W',
    33: 'GEN-T', 36: 'C01', 37: 'F01', 38: 'W06', 40: 'G01',
};
for (const [index, id] of Object.entries(samples)) {
    const i = Number(index);
    picture('item' + i, board, frames[id], (i % 7 - 3) * 80, (4 - Math.floor(i / 7)) * 80, 72, 72);
    if (id.startsWith('GEN')) picture('generator' + i, board, frames.icon_energy, (i % 7 - 3) * 80 + 23, (4 - Math.floor(i / 7)) * 80 - 22, 25, 25);
}
button('pfBtnShop', page, -240, -504, '', 'icon_gold');
label('shopTitle', page, '商店', -240, -548, 90, 26, 22, true);
button('pfBtnReward', page, 0, -504, '', 'icon_gift');
label('rewardTitle', page, '待领取', 0, -548, 100, 26, 22, true);
button('pfBtnBag', page, 240, -504, '', 'icon_bag');
label('bagTitle', page, '背包', 240, -548, 90, 26, 22, true);

const detail = picture('detail', page, frames.panel, 0, -596, 656, 84, true);
scene[detail]._active = false;
picture('detailIcon', detail, frames.W01, -278, 0, 56, 56);
label('detailName', detail, '树枝', -153, 14, 166, 28, 24);
label('detailLevel', detail, 'Lv.1 · 木料', -153, -15, 166, 24, 18);
button('pfBtnInfo', detail, 272, 0, '', 'icon_help');
label('detailSource', detail, '木料生成器', 68, 0, 190, 28, 20);

scene[1]._prefab = ref(add({ __type__: 'cc.PrefabInfo', root: null, asset: null, fileId: '', instance: null, targetOverrides: null, nestedPrefabInstanceRoots: nestedRoots }));
write(path.join(out, 'ScMerge.scene'), scene);
write(path.join(out, 'ScMerge.scene.meta'), { ver: '1.1.50', importer: 'scene', imported: true, uuid: sceneUuid, files: ['.json'], subMetas: {}, userData: {} });
write(path.join(out, 'ScMerge.ts.meta'), { ver: '4.0.24', importer: 'typescript', imported: true, uuid: scriptUuid, files: [], subMetas: {}, userData: {} });
console.info('Created ScMerge: 63 PfGMItemCell instances, framework buttons, 53 item exports.');
