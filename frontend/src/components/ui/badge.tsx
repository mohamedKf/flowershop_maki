import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase font-medium',
  {
    variants: {
      variant: {
        default: 'bg-red text-white',
        secondary: 'bg-bg-elevated text-ink-body border border-rule',
        outline: 'border border-red text-red',
        success: 'bg-bg-elevated text-ink-primary border border-rule',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
