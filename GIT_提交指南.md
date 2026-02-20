# 易宿项目 Git 提交指南

> 大作业要求：从项目创建到完成的过程需在 Git 中有所体现，每个提交点应有明确意义，不要一口气提交。

---

## 一、前置准备

### 1.1 确认本地 Git 仓库

在 **EasyStay_Project** 目录下打开终端（PowerShell 或 CMD），执行：

```bash
cd 你的EasyStay_Project完整路径
git status
```

- **若提示 "not a git repository"**：说明该目录不是 Git 仓库，需按 1.2 操作。
- **若显示分支和文件状态**：说明已是仓库，跳到第二节。

### 1.2 若需初始化仓库并关联 GitHub

```bash
cd EasyStay_Project所在路径
git init
git remote add origin https://github.com/n0mikudo/EasyStay_Hotel_Booking_kud.git
```

若远程已有内容（如初始化提交），先拉取：

```bash
git fetch origin
git branch -M main
git reset --soft origin/main
```

---

## 二、分批提交策略（体现开发过程）

将当前所有改动拆成 **多个有意义的提交**，每个提交对应一个功能或阶段。

### 提交顺序建议

| 序号 | 提交说明 | 涉及文件/操作 |
|------|----------|---------------|
| 1 | feat: 配置百度地图 AK 与定位功能 | server/.env.example、项目手册中定位说明 |
| 2 | feat: 新增 IP 定位备用方案（桌面端无 GPS 时） | server/app.js（/api/geo/ip）、client-mobile/src/utils/geoLocation.js |
| 3 | docs: 整合项目文档，精简为 README + 项目手册 + Coze | README.md、项目手册.md、Coze_Agent 文档，删除冗余 md |
| 4 | chore: 更新 README 与项目手册中的文档链接 | README.md、项目手册.md |

> 注意：`server/.env` 含 AK 密钥，已在 .gitignore 中，**不要提交**。只提交 .env.example。

---

## 三、逐步执行（复制到终端）

### 步骤 1：进入项目目录

```bash
cd "d:\360MoveData\Users\胡聪威\Desktop\前端-携程\Project-ALL\EasyStay_Project"
```

（若路径不同，请替换为你的实际路径）

### 步骤 2：查看当前状态

```bash
git status
```

确认哪些文件已修改、新增、删除。

### 步骤 3：提交 1 - 百度地图配置说明

```bash
git add server/.env.example
git add 项目手册.md
git commit -m "feat: 配置百度地图 AK 与定位功能说明"
```

若 `.env.example` 无变化可跳过，或只提交有改动的文件。

### 步骤 4：提交 2 - IP 定位备用方案

```bash
git add server/app.js
git add client-mobile/src/utils/geoLocation.js
git commit -m "feat: 新增 IP 定位备用方案，解决桌面端无 GPS 时定位失败"
```

### 步骤 5：提交 3 - 文档整合

```bash
git add README.md
git add 项目手册.md
git add Coze_Agent_设计方案与部署步骤.md
git status
```

确认已删除的文档在 `git status` 中显示为 `deleted`，若有则：

```bash
git add -u
git commit -m "docs: 整合项目文档，精简为 README、项目手册、Coze 扩展"
```

### 步骤 6：提交 4 - 文档链接更新（若与提交 3 合并可跳过）

若 README、项目手册还有小改动：

```bash
git add README.md 项目手册.md
git commit -m "docs: 更新文档链接与常见问题说明"
```

### 步骤 7：推送到 GitHub

```bash
git branch -M main
git remote -v
```

确认 remote 为 `https://github.com/n0mikudo/EasyStay_Hotel_Booking_kud.git`，若无则：

```bash
git remote add origin https://github.com/n0mikudo/EasyStay_Hotel_Booking_kud.git
```

推送：

```bash
git push -u origin main
```

若远程已有提交且产生冲突，先拉取再推送：

```bash
git pull origin main --rebase
git push -u origin main
```

---

## 四、若仓库在上级目录（如 Desktop）

若 `git status` 显示的是 Desktop 下大量无关文件，说明 Git 根目录在上级。此时应：

1. **在 EasyStay_Project 内单独建仓**（推荐）：
   ```bash
   cd EasyStay_Project
   git init
   git remote add origin https://github.com/n0mikudo/EasyStay_Hotel_Booking_kud.git
   git fetch origin
   git reset --soft origin/main
   ```
   然后按第二节分批 `git add` 和 `git commit`。

2. **或** 将 GitHub 仓库 clone 到新文件夹，把 EasyStay_Project 内容复制进去，再分批提交。

---

## 五、提交信息规范（便于展示）

建议使用前缀：

- `feat:` 新功能
- `fix:` 修复
- `docs:` 文档
- `chore:` 杂项

示例：`feat: 新增 IP 定位备用方案，解决桌面端无 GPS 时定位失败`

---

## 六、场景：本地是完整项目，GitHub 只有初始化提交

若你本地 EasyStay_Project 已是完整项目，而 GitHub 上只有最初的 1 个提交，可按下面方式处理。

### 方案 A：在 EasyStay_Project 内单独建仓（推荐）

1. 备份当前 EasyStay_Project 整个文件夹。
2. 新建空文件夹，克隆远程仓库：
   ```bash
   git clone https://github.com/n0mikudo/EasyStay_Hotel_Booking_kud.git EasyStay_temp
   cd EasyStay_temp
   ```
3. 用你本地的 EasyStay_Project 内容覆盖 EasyStay_temp（保留 .git 文件夹）。
4. 在 EasyStay_temp 中按第二节分批提交，然后 `git push origin main`。
5. 确认无误后，用 EasyStay_temp 替换原 EasyStay_Project，或删除 EasyStay_temp。

### 方案 B：在现有 EasyStay_Project 中初始化并关联

```bash
cd EasyStay_Project路径
git init
git remote add origin https://github.com/n0mikudo/EasyStay_Hotel_Booking_kud.git
git fetch origin
git branch -M main
git reset --soft origin/main
```

此时所有本地文件会变成「待提交」状态，再按第二节分批 `git add` 和 `git commit`，最后 `git push -u origin main`。

---

## 七、验证

推送后在 GitHub 仓库页面查看：

- `main` 分支应有多个提交（建议至少 3–5 个）
- 每个提交有清晰说明，能体现开发过程
- 文件列表与本地一致（不含 .env、node_modules）
