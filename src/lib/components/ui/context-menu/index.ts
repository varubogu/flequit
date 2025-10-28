import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';

import Trigger from '$lib/components/ui/context-menu/context-menu-trigger.svelte';
import Group from '$lib/components/ui/context-menu/context-menu-group.svelte';
import RadioGroup from '$lib/components/ui/context-menu/context-menu-radio-group.svelte';
import Item from '$lib/components/ui/context-menu/context-menu-item.svelte';
import GroupHeading from '$lib/components/ui/context-menu/context-menu-group-heading.svelte';
import Content from '$lib/components/ui/context-menu/context-menu-content.svelte';
import Shortcut from '$lib/components/ui/context-menu/context-menu-shortcut.svelte';
import RadioItem from '$lib/components/ui/context-menu/context-menu-radio-item.svelte';
import Separator from '$lib/components/ui/context-menu/context-menu-separator.svelte';
import SubContent from '$lib/components/ui/context-menu/context-menu-sub-content.svelte';
import SubTrigger from '$lib/components/ui/context-menu/context-menu-sub-trigger.svelte';
import CheckboxItem from '$lib/components/ui/context-menu/context-menu-checkbox-item.svelte';
import Label from '$lib/components/ui/context-menu/context-menu-label.svelte';
const Sub = ContextMenuPrimitive.Sub;
const Root = ContextMenuPrimitive.Root;

export {
  Sub,
  Root,
  Item,
  GroupHeading,
  Label,
  Group,
  Trigger,
  Content,
  Shortcut,
  Separator,
  RadioItem,
  SubContent,
  SubTrigger,
  RadioGroup,
  CheckboxItem,
  //
  Root as ContextMenu,
  Sub as ContextMenuSub,
  Item as ContextMenuItem,
  GroupHeading as ContextMenuGroupHeading,
  Group as ContextMenuGroup,
  Content as ContextMenuContent,
  Trigger as ContextMenuTrigger,
  Shortcut as ContextMenuShortcut,
  RadioItem as ContextMenuRadioItem,
  Separator as ContextMenuSeparator,
  RadioGroup as ContextMenuRadioGroup,
  SubContent as ContextMenuSubContent,
  SubTrigger as ContextMenuSubTrigger,
  CheckboxItem as ContextMenuCheckboxItem,
  Label as ContextMenuLabel
};
