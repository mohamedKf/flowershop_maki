import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-bg-card border border-rule text-ink-primary transition-colors',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export { Card };
