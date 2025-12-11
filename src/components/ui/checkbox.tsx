"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked = false, onCheckedChange, className, disabled }, ref) => (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "h-4 w-4 shrink-0 rounded-sm border border-primary flex items-center justify-center",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary text-primary-foreground" : "bg-background",
        className
      )}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
