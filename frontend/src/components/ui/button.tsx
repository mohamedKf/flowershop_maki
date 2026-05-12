import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-medium tracking-[0.28em] uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-red text-white hover:-translate-y-0.5 shadow-[0_8px_32px_rgba(200,16,46,0.33)] hover:shadow-[0_12px_40px_rgba(200,16,46,0.45)]',
        outline:
          'border border-rule-strong bg-transparent text-ink-primary hover:border-red hover:text-red',
        ghost: 'bg-transparent text-ink-body hover:text-ink-primary',
        link: 'border-b border-red pb-1 text-ink-primary hover:text-red rounded-none px-0',
        destructive: 'bg-red-deep text-white hover:bg-red',
        secondary:
          'bg-bg-elevated text-ink-primary border border-rule hover:border-red',
      },
      size: {
        default: 'h-12 px-7',
        sm: 'h-9 px-4 text-[10px] tracking-[0.25em]',
        lg: 'h-14 px-10 text-sm',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
