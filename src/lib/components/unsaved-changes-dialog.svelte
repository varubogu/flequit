<script lang="ts">
  import Dialog from "$lib/components/ui/dialog.svelte";
  import DialogContent from "$lib/components/ui/dialog-content.svelte";
  import DialogHeader from "$lib/components/ui/dialog-header.svelte";
  import DialogTitle from "$lib/components/ui/dialog-title.svelte";
  import DialogDescription from "$lib/components/ui/dialog-description.svelte";
  import DialogFooter from "$lib/components/ui/dialog-footer.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { Save, Trash2, X } from 'lucide-svelte';

  interface Props {
    show: boolean;
    onSaveAndContinue: () => void;
    onDiscardAndContinue: () => void;
    onCancel: () => void;
  }
  
  let { 
    show, 
    onSaveAndContinue,
    onDiscardAndContinue,
    onCancel 
  }: Props = $props();
</script>

<Dialog open={show} onOpenChange={(open: boolean) => !open && onCancel()}>
  <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>未保存の変更があります</DialogTitle>
      <DialogDescription>
        編集中の内容が保存されていません。どうしますか？
      </DialogDescription>
    </DialogHeader>
    
    <DialogFooter class="flex flex-row gap-2 justify-center">
      <Button size="icon" onclick={onSaveAndContinue} title="保存して移動">
        <Save class="h-4 w-4" />
      </Button>
      <Button 
        variant="secondary" 
        size="icon"
        onclick={onDiscardAndContinue} 
        title="破棄して移動"
      >
        <Trash2 class="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon"
        onclick={onCancel} 
        title="キャンセル"
      >
        <X class="h-4 w-4" />
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>