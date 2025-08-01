<script lang="ts">
  import { Button as ButtonPrimitive } from 'bits-ui';
  import { tv, type VariantProps } from 'tailwind-variants';
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';

  const buttonVariants = tv({
    base: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  });

  type Props = {
    variant?: VariantProps<typeof buttonVariants>['variant'];
    size?: VariantProps<typeof buttonVariants>['size'];
    class?: string;
    children?: Snippet;
    onclick?: (event?: Event) => void;
    disabled?: boolean;
    title?: string;
    'aria-label'?: string;
    'data-testid'?: string;
  };

  let {
    class: className,
    variant = 'default',
    size = 'default',
    children,
    ...restProps
  }: Props = $props();
</script>

<ButtonPrimitive.Root class={cn(buttonVariants({ variant, size, className }))} {...restProps}>
  {@render children?.()}
</ButtonPrimitive.Root>
