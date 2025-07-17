# Data Structure

## Tree Structure

- App(1)
  - Account(n) ※Storeに登録
    - AccountSettings(1)
    - Project(n)
      - Members(n)
      - ProjectSettings(1)
      - TagTree(n)
      - Lists(n)
        - Tasks(n)
          - SubTasks(n)
  - CommonSettings(1) ※Storeに登録
    - DailySettings(1)
    - Theme(1)
    - Locale(1)
  - SideMenuTree(1) ※Storeに登録
    - Term(1)
      - Project
      - List
      - Task
      - SubTask
      - Daily
      - Tag
      - Account
      - String
    - Daily(1)
    - Projects(n)
      - Lists(n)
  - SelectedState(1) ※Storeに登録
    - Daily(1)
    - Project(1)
    - List(1)
    - Task(1)
    - SubTask(1)

## Items

### Project

#### Project Properties

- Name
- Members
- ProjectSettings
- TaskLists
- TagTree

### TaskList

#### TaskList Properties

- Name
- Tasks

### Task

#### Task Properties

- Name
- Description
- Status
- DueDate
- 優先度（Priority）
- 重要度（Importance）
- StartDate
- EndDate
- Tags
- Files
- SubTasks

### Tag

- attachment to project, list, task, subtask

#### Tag Properties

- Name
- TextColor
- BackgroundColor

### File

- attachment to task, subtask

### DailySettings

#### DailySettingsProperties

- title
- icon
- isShow

#### DailySettingsItems

- 期限切れ（Expired）
- 今日（Today）
- 明日（Tomorrow）
- 3日（3 Days）
- 今週（Week）
- 今月（Month）
- 今期（Quarter）※年度開始日から3ヶ月単位
- 今年（Year）
- 今年度（Fiscal Year）※年度開始日から1年単位
- 受信トレイ（Inbox）

※年度開始日は別途設定が必要

### Account(Member)Settings

#### AccountSettingsProperties

- Name
- Email
- Role
- ServerUrl
- Password
- 2FACode
- Passkey

### ProjectSettings

- 年度開始日

### UserSettings

- 曜日開始日（日、月）
- DailySettings
