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
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
  }
  
  let { 
    show, 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    onConfirm,
    onCancel 
  }: Props = $props();
</script>

<Dialog open={show} onOpenChange={(open: boolean) => !open && onCancel()}>
  <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>
        {message}
      </DialogDescription>
    </DialogHeader>
    
    <DialogFooter>
      <Button variant="outline" onclick={onCancel}>
        {cancelText}
      </Button>
      <Button onclick={onConfirm}>
        {confirmText}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>