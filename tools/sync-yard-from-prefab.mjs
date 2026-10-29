#!/usr/bin/env node
/**
 * 从 PfZooHomeYard.prefab 读回每个园景节点的 position / scale，
 * 写进 scenery.json，保证编辑器所见与运行时一致。
 *
 * 用法（在工程根执行）：
 *   node tools/sync-yard-from-prefab.mjs          # 写回
 *   node tools/sync-yard-from-prefab.mjs --dry    # 只看差异
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const PREFAB = path.join(root, 'assets/game/bundles/ZooHome/PfZooHomeYard.prefab');
const SCENERY = path.join(root, 'assets/game/bundles/ZooHome/scenery.json');
const TODO_SUFFIX = '__TODO';
const dry = process.argv.includes('--dry');

if (!fs.existsSync(PREFAB)) {
  console.error('找不到', PREFAB);
  process.exit(1);
}

const arr = JSON.parse(fs.readFileSync(PREFAB, 'utf8').replace(/^\uFEFF/, ''));
const scenery = JSON.parse(fs.readFileSync(SCENERY, 'utf8'));

/** 收集：节点名（去掉 __TODO） → {pos, scale, layer, size, anchor} */
const nodes = new Map();
const rootNodeIdx = arr.findIndex(n => n && n.__type__ === 'cc.Node' && n._parent === null);
if (rootNodeIdx < 0) {
  console.error('预制体里找不到根节点');
  process.exit(1);
}
const layerNodes = new Set((arr[rootNodeIdx]._children || []).map(c => c.__id__));

for (const n of arr) {
  if (!n || n.__type__ !== 'cc.Node' || !n._parent) continue;
  if (!layerNodes.has(n._parent.__id__)) continue; // 只取层节点下面的件
  const parent = arr[n._parent.__id__];
  const uit = arr[n._components[0].__id__];
  const key = n._name.replace(new RegExp(TODO_SUFFIX + '$'), '');
  nodes.set(key, {
    x: n._lpos.x,
    y: n._lpos.y,
    scale: n._lscale.x,
    layer: parent._name,
    w: uit._contentSize.width,
    h: uit._contentSize.height,
    ax: uit._anchorPoint.x,
    ay: uit._anchorPoint.y,
  });
}

let changed = 0;
const rows = [];

for (const p of scenery.pieces) {
  if (p.id === 'opening') continue; // 开场背景不是队列件，单独处理
  const key = p.id.replace(/\//g, '_');
  const n = nodes.get(key);
  if (!n) {
    rows.push({ id: p.id, status: '预制体里没有' });
    continue;
  }

  const cocos = { x: n.x, y: n.y, scale: n.scale };
  const foot = [Math.round(n.x * 2), Math.round(2560 - n.y * 2)];
  const oldCocos = p.cocos ? JSON.stringify(p.cocos) : '(无)';
  const isNew = !p.cocos;

  if (oldCocos !== JSON.stringify(cocos)) {
    changed++;
    rows.push({
      id: p.id,
      status: isNew ? '新增坐标' : '位置变化',
      from: oldCocos,
      to: JSON.stringify(cocos),
      foot,
    });
  }

  p.cocos = cocos;
  p.scale = n.scale;
  p.scaleEach = n.scale;
  p.view = { x: n.x, y: 1280 - n.y, scale: n.scale };
  p.layer = n.layer;
  // 锚点跟随预制体：预制体里挪锚点，json 同步，避免两边不一致
  p.anchor = [n.ax, n.ay];
  // place 统一为 foot：所有件都用「锚点落在母图的哪一点」表达位置。
  // 区域地面的覆盖范围另外记在 masterBox，运行时不读，仅供核对。
  p.place = 'foot';
  p.foot = foot;

  // ground 件补 masterBox（覆盖的母图矩形）
  if (p.layer === 'ground') {
    const leftC = n.x - n.w * n.scale * n.ax;
    const bottomC = n.y - n.h * n.scale * n.ay;
    p.masterBox = [
      Math.round(leftC * 2),
      Math.round(2560 - (bottomC + n.h * n.scale) * 2),
      Math.round((leftC + n.w * n.scale) * 2),
      Math.round(2560 - bottomC * 2),
    ];
  }
}

console.log(`预制体件数 ${nodes.size}，scenery 件数 ${scenery.pieces.length}`);
console.log(`变化 ${changed} 件`);
for (const r of rows) {
  if (r.status === '预制体里没有') console.log(`  ✗ ${r.id}  ${r.status}`);
  else console.log(`  · ${r.id}\n      ${r.from} → ${r.to}   foot=${JSON.stringify(r.foot)}`);
}

if (dry) {
  console.log('\n--dry 模式，未写文件');
} else {
  fs.writeFileSync(SCENERY, JSON.stringify(scenery, null, 2) + '\n', 'utf8');
  console.log('\n已写回 scenery.json');
}
