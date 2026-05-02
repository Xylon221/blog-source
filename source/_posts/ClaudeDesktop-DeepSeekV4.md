---
title: Claude Desktop + DeepSeek V4 完整配置指南：免登录，无需订阅，5 分钟上手
date: 2026-05-02
tags: []
---
# Claude Desktop + DeepSeek V4 完整配置指南：免登录，无需订阅，5 分钟上手

> 2026 年 4 月起，Claude Desktop 正式开放第三方模型支持。现在你无需 Claude 订阅账号，只需一个 DeepSeek API Key，就能在 Claude 桌面客户端中使用性能强劲、价格低廉的 DeepSeek V4 系列模型。本文整理 Windows 平台的完整配置流程与进阶技巧，让你一次搞定。

---

## 01 | 为什么值得一试？

- **零登录门槛**：Claude Desktop 在登录界面即可开启开发者模式，无需注册 Claude 账号。
- **极致性价比**：DeepSeek V4-Pro 每百万输出 token 约 $3.48，V4-Flash 仅 $0.28，配合 Claude 的 Cowork/Code 能力，重度 Agent 使用一天也不过 $7 左右。
- **百万上下文**：DeepSeek V4 原生支持 1M 上下文窗口，只需手动添加模型名即可解锁。
- **多模式切换**：左上角一键在 Cowork（知识工作）与 Code（编程开发）之间切换，覆盖你的全部工作场景。

---

## 02 | 前置准备

| 必需项 | 说明 |
|--------|------|
| **Claude Desktop** | 从 [Claude 官网下载页](https://claude.ai/downloads) 获取，支持 Windows 10+ |
| **DeepSeek API Key** | 在 [DeepSeek 开放平台](https://platform.deepseek.com) 注册并创建，以 `sk-` 开头 |
| **网络环境** | 需能正常访问 `api.deepseek.com` |

---

## 03 | 配置流程

### 第 1 步：安装 Claude Desktop

访问 **https://claude.ai/downloads**，下载 Windows 版本（.exe 或 MSIX 安装包），按提示完成安装并启动应用。

### 第 2 步：开启开发者模式

启动后看到登录界面时**不要登录**，直接开启开发者模式：点击左上角三条横线 → `Help` → `Troubleshooting` → `Enable Developer Mode`。

点击后，Claude Desktop 会自动重启。重启后菜单栏会多出一个 `Developer` 入口。

### 第 3 步：配置第三方推理

点击 `Developer` → `Configure Third-Party Inference…`，在配置页面按下表填写：

| 参数 | 填写内容 |
|------|---------|
| Connection 模式 | `Gateway` |
| Gateway base URL | `https://api.deepseek.com/anthropic` |
| Gateway API Key | 你的 DeepSeek API Key（`sk-` 开头） |
| Gateway auth scheme | `bearer`（默认即可） |

### 第 4 步：添加模型

在配置窗口下方点击 `Add`，依次添加以下模型：

- `deepseek-v4-pro` — 旗舰模型，适合复杂推理和深度分析
- `deepseek-v4-flash` — 闪电模型，速度快、价格极低，适合日常任务
- `deepseek-v4-pro[1m]` — 旗舰模型的 1M 上下文版本（手动添加可解锁百万 token 窗口）

### 第 5 步：保存并重启

- 勾选 `Skip login-mode chooser`
- 点击 `Apply locally`
- 点击 `Relaunch Now` 重启应用

---

## 04 | 开始使用

重启后即可进入主界面。两个关键切换：

| 左上角模式 | 用途 |
|-----------|------|
| **Cowork** | 面向知识工作者的 AI Agent，可读写本地文件、制作计划、批量处理文档 / Excel / PPT 等 |
| **Code** | 面向开发者的编程模式，类比 Claude Code 图形化版本，权限更高 |

右下角模型选择区域会列出你配置的所有 DeepSeek 模型，点击即可切换。输入问题，开始体验！

---

## 05 | 环境变量配置（Claude Code）

如果你同时在用 **Claude Code** 终端工具，可通过 PowerShell 一键配置环境变量，让 Claude Code 也默认走 DeepSeek：

```powershell
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://api.deepseek.com/anthropic", "User")
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "sk-你的DeepSeekKey", "User")
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_MODEL", "deepseek-v4-pro", "User")
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_DEFAULT_OPUS_MODEL", "deepseek-v4-pro", "User")
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_DEFAULT_HAIKU_MODEL", "deepseek-v4-flash", "User")
[System.Environment]::SetEnvironmentVariable("CLAUDE_CODE_SUBAGENT_MODEL", "deepseek-v4-flash", "User")
```

## 06 | 扩展玩法：接入更多第三方模型

此配置方式不仅限于 DeepSeek。任何兼容 Anthropic Messages API 格式的模型都可以用同样方式接入，只需替换 Base URL 和 API Key 即可。目前已知兼容的模型/服务包括：

- GLM 系列（智谱 AI）
- Kimi 系列（月之暗面）
- MiniMax 系列
- 其他自部署的 Anthropic API 兼容网关

---

## 07 | 成本参考

| 模型 | 输出价格（每百万 token） | 相对 Claude Opus |
|------|-------------------------|-----------------|
| DeepSeek V4-Pro | ~$3.48 | 约 1/7 |
| DeepSeek V4-Flash | ~$0.28 | 约 1/89 |

以一天的重度 Agent 使用为例（400+ 工具调用），总花费约 **$7**，按当前汇率折合人民币约 50 元。

---

## 08 | 总结

Claude Desktop 开放第三方模型支持，是 AI 工具链的重大利好。你不再需要为 Claude 订阅付费，只需一个廉价的 DeepSeek API Key，就能享受 Claude Desktop 出色的 Agent 能力（Cowork 的文档处理、Code 的编程辅助）搭配 DeepSeek V4 的强劲性能与百万上下文。

整个过程 5 分钟搞定，一次配置，长期受益。快去试试吧！

> **免责声明**：本文信息基于 2026 年 4–5 月的公开资料整理。软件界面与价格可能随版本更新而变动，请以官方最新信息为准。
