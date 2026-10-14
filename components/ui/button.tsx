import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/** See docs/design-system.md → Buttons for when to use each variant/size. */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[color,background-color,border-color,box-shadow,filter,scale] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] outline-none select-none active:scale-[0.98] active:duration-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "glass-solid text-primary-foreground",
        secondary: "glass glass-tint text-accent-foreground",
        outline: "glass text-foreground",
        ghost: "text-foreground hover:bg-accent/70",
        destructive: "glass-danger text-destructive-foreground focus-visible:ring-destructive/30",
        "destructive-soft": "bg-destructive/10 text-destructive hover:bg-destructive/15 focus-visible:ring-destructive/30",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        xs: "h-7 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 px-3 text-[13px] has-[>svg]:px-2.5",
        default: "h-10 px-4 has-[>svg]:px-3.5",
        lg: "h-11 px-6 text-[15px] has-[>svg]:px-5",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
