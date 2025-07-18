<script lang="ts">
  import Dialog from "$lib/components/ui/dialog.svelte";
  import DialogContent from "$lib/components/ui/dialog-content.svelte";
  import DialogHeader from "$lib/components/ui/dialog-header.svelte";
  import DialogTitle from "$lib/components/ui/dialog-title.svelte";
  import DialogDescription from "$lib/components/ui/dialog-description.svelte";
  import DialogFooter from "$lib/components/ui/dialog-footer.svelte";
  import Button from "$lib/components/ui/button.svelte";

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
    
    <DialogFooter class="flex flex-col gap-2 sm:flex-col">
      <Button onclick={onSaveAndContinue} class="w-full">
        保存して移動
      </Button>
      <Button 
        variant="secondary" 
        onclick={onDiscardAndContinue} 
        class="w-full"
      >
        破棄して移動
      </Button>
      <Button 
        variant="ghost" 
        onclick={onCancel} 
        class="w-full"
      >
        キャンセル
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>