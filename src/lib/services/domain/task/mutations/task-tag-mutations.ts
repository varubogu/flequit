import type { Tag } from '$lib/types/tag';

type TaskProjectContext = {
  project: { id: string };
  taskList: { id: string };
};

type TaskStoreLike = {
  getTaskProjectAndList(taskId: string): TaskProjectContext | null | undefined;
  attachTagToTask(taskId: string, tag: Tag): void;
  detachTagFromTask(taskId: string, tagId: string): Tag | null | undefined;
};

type TagStoreLike = {
  tags: Tag[];
  addTagWithId(tag: Tag): void;
};

type TaggingServiceLike = {
  createTaskTag(projectId: string, taskId: string, tagName: string): Promise<Tag>;
  deleteTaskTag(projectId: string, taskId: string, tagId: string): Promise<unknown>;
};

type ErrorHandlerLike = {
  addSyncError(action: string, entity: 'task', itemId: string, error: unknown): void;
};

export type TaskTagMutationsDependencies = {
  taskStore: TaskStoreLike;
  tagStore: TagStoreLike;
  taggingService: TaggingServiceLike;
  errorHandler: ErrorHandlerLike;
};

export class TaskTagMutations {
  constructor(private readonly deps: TaskTagMutationsDependencies) {}

  async addTagToTaskByName(taskId: string, tagName: string): Promise<void> {
    const trimmed = tagName.trim();
    if (!trimmed) return;

    const context = this.deps.taskStore.getTaskProjectAndList(taskId);
    if (!context) return;

    try {
      const created = await this.deps.taggingService.createTaskTag(
        context.project.id,
        taskId,
        trimmed
      );
      this.deps.tagStore.addTagWithId(created);
      this.deps.taskStore.attachTagToTask(taskId, created);
    } catch (error) {
      this.deps.errorHandler.addSyncError('タスクタグ追加', 'task', taskId, error);
    }
  }

  async addTagToTask(taskId: string, tagId: string): Promise<void> {
    const tag = this.deps.tagStore.tags.find((item) => item.id === tagId);
    if (!tag) return;

    const context = this.deps.taskStore.getTaskProjectAndList(taskId);
    if (!context) return;

    try {
      const created = await this.deps.taggingService.createTaskTag(
        context.project.id,
        taskId,
        tag.name
      );
      this.deps.taskStore.attachTagToTask(taskId, created);
    } catch (error) {
      this.deps.errorHandler.addSyncError('タスクタグ追加', 'task', taskId, error);
    }
  }

  async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
    const context = this.deps.taskStore.getTaskProjectAndList(taskId);
    if (!context) return;

    const removed = this.deps.taskStore.detachTagFromTask(taskId, tagId);
    if (!removed) return;

    try {
      await this.deps.taggingService.deleteTaskTag(context.project.id, taskId, tagId);
    } catch (error) {
      this.deps.taskStore.attachTagToTask(taskId, removed);
      this.deps.errorHandler.addSyncError('タスクタグ削除', 'task', taskId, error);
    }
  }
}
