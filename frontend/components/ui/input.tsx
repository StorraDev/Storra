import { cn } from '@/lib/utils'
import * as React from 'react'

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  error?: string
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, name, error, className, ...props }, ref) => {
    return (
      <div className='flex flex-col gap-2 w-full'>
        <label
          htmlFor={name}
          className='block capitalize text-sm font-medium text-gray-700'
        >
          {label}
        </label>
        <input
          id={name}
          name={name}
          ref={ref}
          className={cn(
            'w-full px-3 h-12 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue',
            error ? 'border-red' : 'border-gray-300',
            className
          )}
          {...props}
        />
        {error && <p className='text-xs text-red-500'>{error}</p>}
      </div>
    )
  }
)

InputField.displayName = 'InputField'
export default InputField
