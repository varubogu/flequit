import { dateTimeFormatStore } from '$lib/stores/datetime-format.svelte';
import { toast } from 'svelte-sonner';
import type { DateFormatEditorController } from '$lib/components/settings/date-format/date-format-editor-controller.svelte';

export function useFormatManagement(controller: DateFormatEditorController) {
  async function saveFormat() {
    if (controller.testFormatName.trim() && controller.testFormat.trim()) {
      const trimmedName = controller.testFormatName.trim();
      const trimmedFormat = controller.testFormat.trim();
      const duplicateCheck = controller.checkDuplicates(
        trimmedFormat,
        trimmedName,
        controller.editMode === 'edit' ? controller.editingFormatId || undefined : undefined
      );
      if (duplicateCheck.isDuplicate) {
        toast.error(
          `同じ${duplicateCheck.type === 'format' ? 'フォーマット文字列' : 'フォーマット名'}が既に存在します`,
          {
            description: `「${duplicateCheck.type === 'format' ? duplicateCheck.existingName : duplicateCheck.existingFormat}」で既に使用されています`
          }
        );
        return;
      }
      try {
        if (controller.editMode === 'edit' && controller.editingFormatId) {
          await dateTimeFormatStore.updateCustomFormat(controller.editingFormatId, {
            name: trimmedName,
            format: trimmedFormat
          });
          controller.editMode = 'manual';
          controller.editingFormatId = null;
          toast.success('フォーマットを更新しました');
        } else {
          const newId = await dateTimeFormatStore.addCustomFormat(trimmedName, trimmedFormat);
          toast.success('新しいフォーマットを保存しました');
          controller.editMode = 'manual';
          // Select the newly added format
          const newFormat = controller.allFormats().find((f) => f.id === newId);
          if (newFormat) {
            controller.testFormat = newFormat.format;
            controller.testFormatName = newFormat.name;
          }
        }
      } catch (error) {
        console.error('Failed to save format:', error);
        toast.error('保存に失敗しました');
      }
    }
  }

  async function deleteCustomFormat() {
    const preset = controller.selectedPreset();
    if (preset?.group === 'カスタムフォーマット') {
      try {
        await dateTimeFormatStore.removeCustomFormat(preset.id as string);
        controller.testFormat = '';
        controller.testFormatName = '';
        toast.success('フォーマットを削除しました');
        controller.closeDeleteDialog();
      } catch (error) {
        console.error('Failed to delete format:', error);
        toast.error('削除に失敗しました');
        controller.closeDeleteDialog();
      }
    }
  }

  return {
    saveFormat,
    deleteCustomFormat
  };
}
