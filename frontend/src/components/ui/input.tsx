import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-12 w-full bg-transparent border border-rule px-4 py-2 text-sm text-white placeholder:text-ink-muted',
        'focus:outline-none focus:border-red transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:bg-red file:text-white file:tracking-[0.15em] file:uppercase file:cursor-pointer hover:file:bg-red-bright',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
