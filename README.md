# FFrame-zoo

动物园 app。一个独立的 Cocos Creator 工程（3.8.8）。框架在兄弟目录 `..\FFrame`，通过扩展挂载成只读资源库 `db://gmajor`。

```
D:\creator\
  FFrame\          框架 gmajor + demo
  FFrame-zoo\      本仓库
```

## 打开

1. 用 Cursor 打开 `FFrame-zoo.code-workspace`（同时带上 `../FFrame`，框架规则在那边）。
2. 用 Creator 3.8.8 打开本目录。播放 `assets/game/ScMain.scene`。

## 目录

```
assets/game/            游戏：ScMain、config.ts、bundles/ZooHome、bundles/Skin
extensions/gmajor/      把 ../FFrame/gmajor 挂成 db://gmajor（只读）
策划/                   动物园玩法、数值、已定方案、讨论记录；入口为策划/README.md
del/                    临时文件，已忽略
.cursor/rules/          本 app 的规则；框架规则在 FFrame/.cursor/rules/
```

要求 `FFrame` 和本目录是兄弟目录。`extensions/gmajor/package.json` 里的 `path` 是相对路径，换位置要一起改。

脚本里引用框架只写 `import { ... } from 'db://gmajor/index'`。框架不锁版本；`config.ts` 里 `version.gmajor` 写所按的框架版本，开机只打日志。框架改动看 `FFrame/CHANGELOG.md`。

设计从 [策划/README.md](策划/README.md) 进入。原 GameDesign 的动物园资料已迁入这里，既有策划案和讨论记录保留。系列总规划在 [FFrame-asset-line/docs/系列策划](../FFrame-asset-line/docs/系列策划/现在做这个.md)；提示词、母图试画和生成过程在 [素材仓库](../FFrame-asset-line/scenes/动物园/README.md)，通用物品在 [物品生成工作区](../FFrame-asset-line/通用资源/物品生成/README.md)。

2026-10-06 园景图在 `assets/game/bundles/ZooHome/res`，清单是 `scenery.json`。`ScZooHome` 按清单摆上 place 有值的 78 件，place 为空的 10 件不摆。窗口、数值和另外三张场景还没做。

界面图 `bundles/Skin` 最初是从 FFrame demo 的 `assets/game/bundles/Skin` 整个复制来的，连同 `.meta`（uuid 相同）。之后在这里自己改图，文件名和 uuid 保持不变。demo 的图以后再变，不会自动同步过来。
