# Launch kit

## Positioning

**Name:** Pi Our Free Model

**Tagline:** Public models. Your terminal.

**One-liner:** A Pi-native extension for live public free-model discovery, streaming and tool calls, with no Kilo account or API key.

Never advertise unlimited usage, private inference, guaranteed model access, complete DSH feature parity, or keyless DeepSeek/Kimi access. Do not imply endorsement by Pi, Kilo, OpenCode or the original author.

## Assets

| File | Use | Dimensions |
| --- | --- | --- |
| `assets/icon.svg` | Project avatar / docs | 256 × 256 |
| `assets/hero.png` / `.svg` | README and launch page | 1600 × 820 |
| `assets/social-card.png` / `.svg` | GitHub social preview, link posts | 1280 × 640 |
| `assets/walkthrough.png` / `.svg` | Clearly labelled illustrated workflow | 1600 × 980 |

Authored vector artwork; PNG exports generated with `scripts/render-assets.mjs`. Source files are editable and included. This is not AI-generated imagery and the walkthrough is not a captured interface. Use MIT attribution from LICENSE when redistributing substantial material.

To set a GitHub custom social preview, upload `assets/social-card.png` in repository Settings → General → Social preview. The image is also referenced in the Pi package gallery metadata. Committing an image alone does not configure GitHub's custom preview.

## Short English post

> Built a Pi-native version of Our Free Model: live discovery of Kilo's public free pool, native streaming and tool calls, no Kilo account or API key. Install with `pi install git:github.com/chengyixu/pi-our-free-model`. Free tiers can rate-limit and log prompts—keep secrets out. MIT; inspired by Ebony-Vinyl's DSH project.
>
> https://github.com/chengyixu/pi-our-free-model

## 中文发布文案

> 把 Our Free Model 做成了 Pi 原生扩展：直接发现 Kilo 公开免费模型池，保留 Pi 的流式输出、工具调用和会话用量，无需 Kilo 账号或 API Key。一条 `pi install git:github.com/chengyixu/pi-our-free-model` 即可安装。免费不等于无限或隐私，请勿发送敏感内容。MIT 开源，灵感来自 Ebony-Vinyl 的 DSH 项目。
>
> https://github.com/chengyixu/pi-our-free-model

## Release summary

0.1.0 ships two native provider registrations: verified keyless Kilo and optional authorized-key Zen. Includes exact-ID commands, native model selector, offline catalog reuse, instrumentation, honest failure handling, bilingual docs, and a hermetic real-Pi CLI test. No local gateway, account pools or desktop authorization gate.
