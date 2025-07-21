import { test, expect, vi } from "vitest";

// データフローのインテグレーションテスト（モック使用）

test("task creation workflow", () => {
  // タスク作成のワークフローをシミュレート
  const mockStore = {
    tasks: [] as any[],
    addTask: vi.fn((listId: string, taskData: any) => {
      const newTask = {
        id: `task-${Date.now()}`,
        list_id: listId,
        ...taskData,
        created_at: new Date(),
        updated_at: new Date()
      };
      mockStore.tasks.push(newTask);
      return newTask;
    })
  };
  
  // タスク作成実行
  const taskData = {
    title: "新しいタスク",
    description: "テスト用のタスク",
    status: "not_started",
    priority: 1
  };
  
  const createdTask = mockStore.addTask("list-123", taskData);
  
  expect(mockStore.addTask).toHaveBeenCalledWith("list-123", taskData);
  expect(createdTask.title).toBe("新しいタスク");
  expect(createdTask.list_id).toBe("list-123");
  expect(mockStore.tasks).toHaveLength(1);
});

test("task status update workflow", () => {
  // タスクステータス更新のワークフローをシミュレート
  const mockStore = {
    tasks: [
      {
        id: "task-1",
        title: "テストタスク",
        status: "not_started",
        updated_at: new Date('2024-01-01')
      }
    ],
    updateTask: vi.fn((taskId: string, updates: any) => {
      const taskIndex = mockStore.tasks.findIndex(t => t.id === taskId);
      if (taskIndex >= 0) {
        mockStore.tasks[taskIndex] = {
          ...mockStore.tasks[taskIndex],
          ...updates,
          updated_at: new Date()
        };
        return mockStore.tasks[taskIndex];
      }
      return null;
    })
  };
  
  // ステータス更新実行
  const updatedTask = mockStore.updateTask("task-1", { status: "completed" });
  
  expect(mockStore.updateTask).toHaveBeenCalledWith("task-1", { status: "completed" });
  expect(updatedTask?.status).toBe("completed");
  expect(updatedTask?.updated_at > new Date('2024-01-01')).toBe(true);
});

test("task deletion workflow", () => {
  // タスク削除のワークフローをシミュレート
  const mockStore = {
    tasks: [
      { id: "task-1", title: "Task 1" },
      { id: "task-2", title: "Task 2" }
    ],
    deleteTask: vi.fn((taskId: string) => {
      const taskIndex = mockStore.tasks.findIndex(t => t.id === taskId);
      if (taskIndex >= 0) {
        mockStore.tasks.splice(taskIndex, 1);
        return true;
      }
      return false;
    })
  };
  
  // タスク削除実行
  const result = mockStore.deleteTask("task-1");
  
  expect(mockStore.deleteTask).toHaveBeenCalledWith("task-1");
  expect(result).toBe(true);
  expect(mockStore.tasks).toHaveLength(1);
  expect(mockStore.tasks[0].id).toBe("task-2");
});

test("subtask management workflow", () => {
  // サブタスク管理のワークフローをシミュレート
  const mockStore = {
    tasks: [
      {
        id: "task-1",
        title: "メインタスク",
        sub_tasks: [
          { id: "sub-1", title: "サブタスク1", status: "not_started" },
          { id: "sub-2", title: "サブタスク2", status: "completed" }
        ]
      }
    ],
    updateSubTask: vi.fn((subTaskId: string, updates: any) => {
      for (const task of mockStore.tasks) {
        const subTaskIndex = task.sub_tasks.findIndex((st: any) => st.id === subTaskId);
        if (subTaskIndex >= 0) {
          task.sub_tasks[subTaskIndex] = {
            ...task.sub_tasks[subTaskIndex],
            ...updates
          };
          return task.sub_tasks[subTaskIndex];
        }
      }
      return null;
    })
  };
  
  // サブタスクステータス更新
  const updatedSubTask = mockStore.updateSubTask("sub-1", { status: "completed" });
  
  expect(mockStore.updateSubTask).toHaveBeenCalledWith("sub-1", { status: "completed" });
  expect(updatedSubTask?.status).toBe("completed");
  
  // 全サブタスクの完了確認
  const task = mockStore.tasks[0];
  const allCompleted = task.sub_tasks.every((st: any) => st.status === "completed");
  expect(allCompleted).toBe(true);
});