// components/ui/Button.tsx
import { cn } from '@/lib/utils'
import * as React from 'react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, children, variant = 'default', size = 'md', ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-md capitalize transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none',
          variant === 'default' && 'bg-blue text-white hover:bg-blue/80',
          variant === 'outline' &&
            'border border-gray text-gray bg-white hover:bg-gray/80',
          variant === 'ghost' && 'text-black bg-gray hover:bg-gray-200',
          variant === 'destructive' && 'bg-red text-white hover:bg-red/80',
          variant === 'link' && 'text-blue hover:text-blue p-0 h-auto',
          size === 'sm' && 'h-8 px-3 text-sm',
          size === 'md' && 'h-10 px-4 text-sm',
          size === 'lg' && 'h-12 px-6 text-base',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
