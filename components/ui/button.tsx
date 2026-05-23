import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex scale-100 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.96] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      color: {
        primary: "",
        secondary: "",
        success: "",
        warning: "",
        destructive: "",
        neutral: "",
      },
      variant: {
        fill: "",
        soft: "",
        outline: "",
        "soft-outline": "",
        ghost: "",
        link: "underline-offset-4 hover:underline",
      },
      size: {
        md:
          "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-6 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11",
      },
    },
    compoundVariants: [
      {
        color: "primary",
        variant: "fill",
        className:
          "bg-primary text-primary-foreground hover:bg-primary/80 aria-expanded:bg-primary aria-expanded:text-primary-foreground",
      },
      {
        color: "secondary",
        variant: "fill",
        className:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover aria-expanded:bg-secondary-hover aria-expanded:text-secondary-foreground",
      },
      {
        color: "success",
        variant: "fill",
        className:
          "bg-success text-success-foreground hover:bg-success/80 aria-expanded:bg-success aria-expanded:text-success-foreground",
      },
      {
        color: "warning",
        variant: "fill",
        className:
          "bg-warning text-warning-foreground hover:bg-warning/80 aria-expanded:bg-warning aria-expanded:text-warning-foreground",
      },
      {
        color: "destructive",
        variant: "fill",
        className:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80 aria-expanded:bg-destructive aria-expanded:text-destructive-foreground focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
      },
      {
        color: "neutral",
        variant: "fill",
        className:
          "bg-muted text-foreground hover:bg-muted/80 aria-expanded:bg-muted aria-expanded:text-foreground",
      },
      {
        color: "primary",
        variant: "soft",
        className:
          "bg-primary-soft text-primary hover:bg-primary/15 aria-expanded:bg-primary/15 aria-expanded:text-primary",
      },
      {
        color: "secondary",
        variant: "soft",
        className:
          "bg-secondary-soft text-secondary-soft-foreground hover:bg-secondary-soft-hover aria-expanded:bg-secondary-soft-hover aria-expanded:text-secondary-soft-foreground",
      },
      {
        color: "success",
        variant: "soft",
        className:
          "bg-success-soft text-success hover:bg-success/15 aria-expanded:bg-success/15 aria-expanded:text-success",
      },
      {
        color: "warning",
        variant: "soft",
        className:
          "bg-warning-soft text-warning hover:bg-warning/20 aria-expanded:bg-warning/20 aria-expanded:text-warning",
      },
      {
        color: "destructive",
        variant: "soft",
        className:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
      },
      {
        color: "neutral",
        variant: "soft",
        className:
          "bg-muted text-foreground hover:bg-muted/80 aria-expanded:bg-muted aria-expanded:text-foreground",
      },
      {
        color: "primary",
        variant: "outline",
        className:
          "border-primary bg-transparent text-primary hover:bg-primary-soft aria-expanded:bg-primary-soft aria-expanded:text-primary",
      },
      {
        color: "secondary",
        variant: "outline",
        className:
          "border-secondary/70 bg-transparent text-secondary-soft-foreground hover:bg-secondary-soft-hover aria-expanded:bg-secondary-soft-hover aria-expanded:text-secondary-soft-foreground",
      },
      {
        color: "success",
        variant: "outline",
        className:
          "border-success bg-transparent text-success hover:bg-success-soft aria-expanded:bg-success-soft aria-expanded:text-success",
      },
      {
        color: "warning",
        variant: "outline",
        className:
          "border-warning bg-transparent text-warning hover:bg-warning-soft aria-expanded:bg-warning-soft aria-expanded:text-warning",
      },
      {
        color: "destructive",
        variant: "outline",
        className:
          "border-destructive bg-transparent text-destructive hover:bg-destructive/10 aria-expanded:bg-destructive/10 aria-expanded:text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
      },
      {
        color: "neutral",
        variant: "outline",
        className:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
      },
      {
        color: "primary",
        variant: "soft-outline",
        className:
          "border-primary bg-primary-soft text-primary hover:bg-primary/15 aria-expanded:bg-primary/15 aria-expanded:text-primary",
      },
      {
        color: "secondary",
        variant: "soft-outline",
        className:
          "border-secondary/70 bg-secondary-soft text-secondary-soft-foreground hover:bg-secondary-soft-hover aria-expanded:bg-secondary-soft-hover aria-expanded:text-secondary-soft-foreground",
      },
      {
        color: "success",
        variant: "soft-outline",
        className:
          "border-success bg-success-soft text-success hover:bg-success/15 aria-expanded:bg-success/15 aria-expanded:text-success",
      },
      {
        color: "warning",
        variant: "soft-outline",
        className:
          "border-warning bg-warning-soft text-warning hover:bg-warning/20 aria-expanded:bg-warning/20 aria-expanded:text-warning",
      },
      {
        color: "destructive",
        variant: "soft-outline",
        className:
          "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20 aria-expanded:bg-destructive/10 aria-expanded:text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
      },
      {
        color: "neutral",
        variant: "soft-outline",
        className:
          "border-border bg-muted text-foreground hover:bg-muted/80 aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input",
      },
      {
        color: "primary",
        variant: "ghost",
        className:
          "text-primary hover:bg-primary-soft aria-expanded:bg-primary-soft aria-expanded:text-primary",
      },
      {
        color: "secondary",
        variant: "ghost",
        className:
          "text-secondary-soft-foreground hover:bg-secondary-soft-hover aria-expanded:bg-secondary-soft-hover aria-expanded:text-secondary-soft-foreground",
      },
      {
        color: "success",
        variant: "ghost",
        className:
          "text-success hover:bg-success-soft aria-expanded:bg-success-soft aria-expanded:text-success",
      },
      {
        color: "warning",
        variant: "ghost",
        className:
          "text-warning hover:bg-warning-soft aria-expanded:bg-warning-soft aria-expanded:text-warning",
      },
      {
        color: "destructive",
        variant: "ghost",
        className:
          "text-destructive hover:bg-destructive/10 aria-expanded:bg-destructive/10 aria-expanded:text-destructive",
      },
      {
        color: "neutral",
        variant: "ghost",
        className:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
      },
      {
        color: "primary",
        variant: "link",
        className: "text-primary",
      },
      {
        color: "secondary",
        variant: "link",
        className: "text-secondary-soft-foreground",
      },
      {
        color: "success",
        variant: "link",
        className: "text-success",
      },
      {
        color: "warning",
        variant: "link",
        className: "text-warning",
      },
      {
        color: "destructive",
        variant: "link",
        className: "text-destructive",
      },
      {
        color: "neutral",
        variant: "link",
        className: "text-foreground",
      },
    ],
    defaultVariants: {
      color: "primary",
      variant: "fill",
      size: "md",
    },
  }
)

type ButtonColor = NonNullable<VariantProps<typeof buttonVariants>["color"]>
type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>["variant"]
>

type ButtonProps = Omit<ButtonPrimitive.Props, "color"> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean
    loading?: boolean
    loadingLabel?: string
  }

function Button({
  className,
  color = "primary",
  variant = "fill",
  size = "md",
  isLoading = false,
  loading = false,
  loadingLabel = "처리 중",
  disabled,
  children,
  "aria-busy": ariaBusy,
  ...props
}: ButtonProps) {
  const showLoading = isLoading || loading

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ color, variant, size, className }))}
      aria-busy={showLoading ? true : ariaBusy}
      disabled={disabled || showLoading}
      {...props}
    >
      {showLoading ? (
        <>
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          <span className="sr-only">{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants, type ButtonColor, type ButtonVariant }
