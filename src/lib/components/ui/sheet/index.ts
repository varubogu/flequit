import { Dialog as SheetPrimitive } from 'bits-ui';
import Trigger from '$lib/components/ui/sheet/sheet-trigger.svelte';
import Close from '$lib/components/ui/sheet/sheet-close.svelte';
import Overlay from '$lib/components/ui/sheet/sheet-overlay.svelte';
import Content from '$lib/components/ui/sheet/sheet-content.svelte';
import Header from '$lib/components/ui/sheet/sheet-header.svelte';
import Footer from '$lib/components/ui/sheet/sheet-footer.svelte';
import Title from '$lib/components/ui/sheet/sheet-title.svelte';
import Description from '$lib/components/ui/sheet/sheet-description.svelte';

const Root = SheetPrimitive.Root;
const Portal = SheetPrimitive.Portal;

export {
  Root,
  Close,
  Trigger,
  Portal,
  Overlay,
  Content,
  Header,
  Footer,
  Title,
  Description,
  //
  Root as Sheet,
  Close as SheetClose,
  Trigger as SheetTrigger,
  Portal as SheetPortal,
  Overlay as SheetOverlay,
  Content as SheetContent,
  Header as SheetHeader,
  Footer as SheetFooter,
  Title as SheetTitle,
  Description as SheetDescription
};
