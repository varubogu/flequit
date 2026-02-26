# frontend.md

## About Modes

Since design and functionality differ by operation mode, refer to [About Modes](../mode.md)

## About Data Structure

- Project
  - List
    - Task
      - SubTask

## Overall Design

※Items enclosed in <> display corresponding variables

- Entire Screen
  - Side Menu (left side of screen, collapsible)
    - Side Menu Header (top of screen)
      - Collapse (button)
      - Search (text box)
    - Side Menu Content (center of screen)
      - Due Date Button Group
        - Overdue (button)
        - Today (button)
        - Tomorrow (button)
        - 3 Days (button)
        - This Week (button)
        - This Month (button)
        - This Quarter (button)
        - This Year (button)
        - This Fiscal Year (button)
    - Project Button Group
      - <Project1> (accordion)
        - <Project1 List1> (button)
        - <Project1 List2> (button)
        - <Project1 List3> (button)
        - <Project1 Lists, repeated> (button)
      - <Project2> (accordion)
        - <Project2 List1> (button)
        - <Project2 List2> (button)
        - <Project2 List3> (button)
        - <Project2 Lists, repeated> (button)
      - <Projects, repeated> (accordion)
        - <Project3 List1> (button)
        - <Project3 List2> (button)
        - <Project3 List3> (button)
        - <Project3 Lists, repeated> (button)
    - Side Menu Footer (bottom of screen)
      - Help (button)
      - Settings (button)
      - Account (button)
  - Task List
    - Add Task (fixed "+" icon button in bottom right)
  - Task Details
    - <Task Name>
    - <Due Date>
    - <Priority>
    - <Start Date>
    - <End Date>
    - <Recurrence>
    - <Recurrence Interval>
    - <Task Notes>

Notes:

- Task list and task details are displayed based on device width - either both or one side only
- On mobile, side menu is displayed as hamburger menu

## About Side Menu Design and Behavior

- All design is left-aligned (when collapsed, shows icon + title → icon only)
- Side menu displays all items in <SVG icon + name> format
- When collapsed, only icons are displayed
  - Projects can have no icon set. In that case, when collapsed, display first 2-3 characters of project name
- Selected items have background color changed (due date button group, project button group)

### Collapse Button

Displays only icon, toggles side menu collapse/expand on each click

### Search Text Box

Displays task list based on content entered in search text box
Also changes URL in web version
Search conditions based on entered content:

- When search text box content starts with "@", search using that content as keyword
  - When "@" is entered, display input suggestions for due date selection, project names, list names, account names, and further input narrows down suggestions to data that partially matches conditions
  - When "#" is entered, display tag input suggestions, and further input narrows down tag suggestions with prefix matching

#### Due Date Keywords

- Due date keywords are "@期限" (期限 supports both Japanese and English)
- Time is 23:59:59 (end of day) unless specified
  - Tasks past due date: @期限切れ, @deadline
  - Due today: @今日, @本日, @today
  - Due tomorrow: @明日, @翌日, @2日, @tomorrow
  - Due day after tomorrow: @明後日, @3日, @3days
  - Due within 7 days: @今週, @週, @weeks
  - Due within 30 days: @今月, @月, @months
  - Due within 90 days from period start: @今期, @period (※period start date must be set in advance)
  - Due within 365 days: @今年, @years
  - Due within 365 days from fiscal year start: @今年度, @years (※fiscal year start date must be set in advance)
  - Due date keywords can also be entered as "@<number><unit>" (e.g., @10日, @10days, @2か月, @3month, 1Q, @2period, next fiscal year)

#### Non-time Keywords

- Project name keywords are "@proj:<project name>" or "@project:<project name>" (e.g., @proj:プロジェクト1, @project:プロジェクト2)
- List name keywords are "@list:<list name>" (e.g., @list:リスト1, @list:リスト2)
- Task name keywords are "@task:<task name>" (e.g., @task:タスク1, @task:タスク2)
- Note keywords are "@note:<note>" (e.g., @note:ノート1, @note:ノート2)
- SubTask name keywords are "@subtask:<subtask name>"
- SubTask note keywords are "@subtasknote:<subtask note>"
- Account keywords are "@<account name>"

#### Tag Keywords

- When search text box content starts with "#", search using that content as tag
  - Tags are "#<tag name>" (e.g., #タグ1, #タグ2)

#### Other Keywords

- If none of the above apply, search task names, notes, subtask names, subtask notes with partial matching

### Due Date Button Group

Provides text box with placeholder "🔍️検索"
Clicking buttons inputs "@今日", "@明日", "@今週", etc. into search text box based on button conditions
Displays task list filtered by search text box results
※All ignore time units (if "今日" was displayed at 12:00 on 1st, display tasks due until 23:59:59 on 1st)

| Filter           | Description                             | Search Reflection |
| ---------------- | --------------------------------------- | ----------------- |
| Overdue          | Tasks past due date                     | @期限切れ         |
| Today            | Due today                               | @今日             |
| Tomorrow         | Due today and tomorrow                  | @明日             |
| 3 Days           | Due today, tomorrow, day after tomorrow | @3日              |
| This Week        | Due within 7 days                       | @今週             |
| This Month       | Due within 30 days                      | @今月             |
| This Quarter     | Due within 90 days                      | @今期             |
| This Year        | Due within 365 days                     | @今年             |
| This Fiscal Year | Due within 365 days                     | @今年度           |

### <Project Name>

When project itself is selected, "@project:<project name>" is input into search text box
All tasks in task lists within that project are displayed
Accordion format allows collapsing project lists

#### Project Task List Buttons

Display list names associated with project
When task list is selected, "@project:<project name> @list:<list name>" is input into search text box
Tasks in that list are displayed

### Account Button

Display user icon and name
Click to show menu below

- When not logged in
  - Settings
  - Help
  - Login
  - Create User
- When logged in
  - Settings
  - Help
  - Profile
  - Logout
