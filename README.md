# OOTD JUDGE - Vue 3 + TypeScript 版本

这是一个将原始 HTML+JS 项目转换为 Vue 3 + TypeScript 的项目。

## 项目结构

```
ootd-judge/
├── src/
│   ├── App.vue          # 主组件
│   ├── main.ts          # 应用入口
│   ├── style.css        # 样式文件
│   └── vue-shims.d.ts   # Vue 类型声明
├── index.html           # HTML 入口
├── package.json         # 项目配置
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 配置
└── tsconfig.node.json   # Node.js TypeScript 配置
```

## 功能特性

-   ✅ 摄像头访问和切换
-   ✅ 图片上传功能
-   ✅ 拍照/处理功能
-   ✅ 模拟 AI 分析过程
-   ✅ 结果展示（毒舌模式和导师模式）
-   ✅ 打字机效果
-   ✅ 完整的 UI 样式保持

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 技术栈

-   Vue 3 (Composition API)
-   TypeScript
-   Vite
-   CSS3 (保持原样)

## 与原项目的区别

-   使用 Vue 3 Composition API 重构
-   添加 TypeScript 类型支持
-   使用 Vite 作为构建工具
-   组件化架构
-   更好的代码组织和维护性

## 注意事项

-   所有样式和功能都保持与原项目完全一致
-   摄像头功能需要 HTTPS 环境或 localhost
-   图片上传功能支持常见图片格式
