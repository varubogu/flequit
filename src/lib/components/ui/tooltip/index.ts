import { Tooltip as TooltipPrimitive } from 'bits-ui';
import Trigger from '$lib/components/ui/tooltip/tooltip-trigger.svelte';
import Content from '$lib/components/ui/tooltip/tooltip-content.svelte';

const Root = TooltipPrimitive.Root;
const Provider = TooltipPrimitive.Provider;
const Portal = TooltipPrimitive.Portal;

export {
  Root,
  Trigger,
  Content,
  Provider,
  Portal,
  //
  Root as Tooltip,
  Content as TooltipContent,
  Trigger as TooltipTrigger,
  Provider as TooltipProvider,
  Portal as TooltipPortal
};
