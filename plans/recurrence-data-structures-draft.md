# 繰り返し関連データ構造サマリ

作成日: 2025-11-01
目的: フロントエンドから SQLite / Automerge までの繰り返し系データ構造を整理し、今後の統一設計に向けたベース情報を共有する。

---

## 0. 繰り返しデータ構造の概要
```json
{
  "recurrenceRule": {
    "id": "string | null",
    "exitConditions": {
      "endDate": "2025-12-31T00:00:00.000Z | null", // 繰り返し終了日
      "maxOccurrences": 10 // 最大繰り返し回数
    },
    "interval": 1, // 繰り返し間隔
    "unit": "minute|hour|day|week|month|quarter|halfyear|year", // 繰り返し間隔の単位
    "intervalUnitPattern": { //いずれかのプロパティを１つだけ指定可能
      "weekly": { // 週次パターン（unit: week）
        "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], // 曜日を任意数個指定可能
        "adjustment": {} // この単位の繰り返しルールに適用される補正条件
      },
      "monthly": { // 月次パターン（unit: month）
        "dayOfMonth": [1, 15, 30], // 月次開始日から見て、任意の日付を任意の数だけ指定可能
        "weekOfMonths": [ // 月次開始日から見て、任意の週を任意の数だけ指定可能
          { //月次開始日から見て、第1週の月曜日
            "week": 1,
            "dayOfWeek": "monday"
          },
          { //月次開始日から見て、第2週の火曜日
            "week": 2,
            "dayOfWeek": "tuesday"
          }
        ],
        "adjustment": {} // この単位の繰り返しルールに適用される補正条件
      },
      "yearly": { // 年次パターン（unit: year）
        "days": [1, 15, 30, 45], // 年次開始日から見て、任意の日付を任意の数だけ指定可能
        "weeks": [ // 年次開始日から見て、任意の週を任意の数だけ指定可能
          { //年次開始日から見て、第1週の月曜日
            "week": 1, // 第1週
            "dayOfWeek": "monday"
          },
          { //年次開始日から見て、第10週の火曜日
            "week": 10, // 第10週
            "dayOfWeek": "tuesday"
          }
        ],
        "months": [ // 年次開始日から見て、任意の月の条件を指定可能
          { //年次開始日から見て、1月1日の月曜日
            "month": 1,
            "dayOfMonth": [1, 15, 30], // 年次開始日から見て、任意の日付を任意の数だけ指定可能
            "weekOfMonths": [ // 年次開始日から見て、任意の週を任意の数だけ指定可能
              { //年次開始日から見て、第1週の月曜日
                "week": 1,
                "dayOfWeek": "monday"
              },
              { //年次開始日から見て、第2週の火曜日
                "week": 2,
                "dayOfWeek": "tuesday"
              }
            ],
          }
        ],
      },
      "quarterly": { // 四半期パターン（unit: quarter）
        "days": [1, 15, 30, 45], // 四半期開始日から見て、任意の日付を任意の数だけ指定可能
        "weeks": [ // 四半期開始日から見て、任意の週を任意の数だけ指定可能
          { //四半期開始日から見て、第1週の月曜日
            "week": 1,
            "dayOfWeek": "monday"
          },
          { //四半期開始日から見て、第10週の火曜日
            "week": 10,
            "dayOfWeek": "tuesday"
          }
        ],
        "months": [ // 四半期開始日から見て、任意の月の条件を指定可能
          { //四半期開始日から見て、1月1日の月曜日
            "month": 1,
            "dayOfMonth": [1, 15, 30], // 四半期開始日から見て、任意の日付を任意の数だけ指定可能
            "weekOfMonths": [
              { //四半期開始日から見て、第1週の月曜日
                "week": 1,
                "dayOfWeek": "monday"
              },
              { //四半期開始日から見て、第2週の火曜日
                "week": 2,
                "dayOfWeek": "tuesday"
              }
            ],
          },
          { //四半期開始日から見て、2月1日の月曜日
            "month": 2,
            "dayOfMonth": [1, 15, 30], // 四半期開始日から見て、任意の日付を任意の数だけ指定可能
            "weekOfMonths": [
              { //四半期開始日から見て、第1週の月曜日
                "week": 1,
                "dayOfWeek": "monday"
              },
              { //四半期開始日から見て、第2週の火曜日
                "week": 2,
                "dayOfWeek": "tuesday"
              }
            ],
          }
        ],
      },
      "halfyearly": { // 半年パターン（unit: halfyear）
        "days": [1, 15, 30, 45], // 半年開始日から見て、任意の日付を任意の数だけ指定可能
        "weeks": [ // 半年開始日から見て、任意の週を任意の数だけ指定可能
          { //半年開始日から見て、第1週の月曜日
            "week": 1,
            "dayOfWeek": "monday"
          },
          { //半年開始日から見て、第10週の火曜日
            "week": 10,
            "dayOfWeek": "tuesday"
          }
        ],
        "months": [ // 半年開始日から見て、任意の月の条件を指定可能
          { //半年開始日から見て、1月1日の月曜日
            "month": 1,
            "dayOfMonth": [1, 15, 30], // 半年開始日から見て、任意の日付を任意の数だけ指定可能
            "weekOfMonths": [ // 半年開始日から見て、任意の週を任意の数だけ指定可能
              { //半年開始日から見て、第1週の月曜日
                "week": 1,
                "dayOfWeek": "monday"
              },
              { //半年開始日から見て、第2週の火曜日
                "week": 2,
                "dayOfWeek": "tuesday"
              }
            ],
          },
          { //半年開始日から見て、2月1日の月曜
            "month": 2,
            "dayOfMonth": [1, 15, 30], // 半年開始日から見て、任意の日付を任意の数だけ指定可能
            "weekOfMonths": [ // 半年開始日から見て、任意の週を任意の数だけ指定可能
              { //半年開始日から見て、第1週の月曜日
                "week": 1,
                "dayOfWeek": "monday"
              },
              {
                "week": 2,
                "dayOfWeek": "tuesday"
              }
            ], // 任意の週を任意の数だけ指定可能
          }
        ], // 半年開始日から見て、任意の月の条件を任意の数だけ指定可能
      },
      "fiscalYearly": { // 会計年度パターン（unit: fiscalYearly）
        "days": [1, 15, 30, 45], // 会計年度開始日から見て、任意の日付を任意の数だけ指定可能
        "weeks": [ // 会計年度開始日から見て、任意の週を任意の数だけ指定可能
          {
            "week": 1,
            "dayOfWeek": "monday"
          },
        ],
        "months": [ // 会計年度開始日から見て、任意の月の条件を指定可能
          {
            "month": 1,
            "dayOfMonth": [1, 15, 30], // 会計年度開始日から見て、任意の日付を任意の数だけ指定可能
            "weekOfMonths": [
              { //会計年度開始日から見て、第1週の月曜日
                "week": 1,
                "dayOfWeek": "monday"
              },
              { //会計年度開始日から見て、第2週の火曜日
                "week": 2,
                "dayOfWeek": "tuesday"
              }
            ], // 会計年度開始日から見て、任意の週を任意の数だけ指定可能
          }
        ],
      }
    },
    "globalAdjustment": { // この繰り返しルールに適用される補正条件
      "holidayAdjustment": "none|skip|before|after",
      "monthEndAdjustment": "none|lastDay|before",
      "dateConditions": [
        {
          "id": "string",
          "relation": "before|on_or_before|on_or_after|after",
          "referenceDate": "2025-11-01T00:00:00.000Z"
        }
      ],
      "weekdayConditions": [
        {
          "id": "string",
          "ifWeekday": "monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekday|weekend|holiday|non_holiday|weekend_only|non_weekend|weekend_holiday|non_weekend_holiday|specific_weekday",
          "thenDirection": "previous|next",
          "thenTarget": "weekday|weekend|holiday|non_holiday|weekend_only|non_weekend|weekend_holiday|non_weekend_holiday|specific_weekday",
          "thenWeekday": "monday|tuesday|wednesday|thursday|friday|saturday|sunday|null",
          "thenDays": 0
        }
      ]
    },
  },
  "recurrenceReference": {
    "entityId": "string",
    "entityType": "task|subtask|project|…",
    "recurrenceRuleId": "string"
  },
  "task": {
    "id": "string",
    "projectId": "string",
    "listId": "string",
    "title": "string",
    "description": "string|null",
    "status": "not_started|in_progress|waiting|completed|cancelled",
    "priority": 0,
    "planStartDate": "2025-11-01T09:00:00.000Z|null",
    "planEndDate": "2025-11-01T10:00:00.000Z|null",
    "isRangeDate": false,
    "recurrenceRule": { "$ref": "#/recurrenceRule" },
    "assignedUserIds": ["string"],
    "tagIds": ["string"],
    "orderIndex": 0,
    "isArchived": false,
    "createdAt": "2025-11-01T08:55:00.000Z",
    "updatedAt": "2025-11-01T08:55:00.000Z",
    "subTasks": [
      {
        "id": "string",
        "taskId": "string",
        "title": "string",
        "status": "not_started|in_progress|waiting|completed|cancelled",
        "priority": 0,
        "planStartDate": "2025-11-01T09:30:00.000Z|null",
        "planEndDate": "2025-11-01T09:45:00.000Z|null",
        "isRangeDate": false,
        "recurrenceRule": { "$ref": "#/recurrenceRule" },
        "orderIndex": 0,
        "completed": false,
        "assignedUserIds": ["string"],
        "tagIds": ["string"],
        "createdAt": "2025-11-01T08:55:00.000Z",
        "updatedAt": "2025-11-01T08:55:00.000Z"
      }
    ]
  }
}

**備考**
- intervalUnitPattern はいずれかのプロパティを１つだけ指定可能。選択したプロパティによって追加オプションが使用可能となる。
- 四半期、半期、会計年度はプロジェクトが持つ年度開始日を起点に計算される。
- adjustment は globalAdjustment と pattern 内の adjustment の両方が適用される。優先はpattern内で、次がglobalAdjustment。

```


---
