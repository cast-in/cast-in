import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden rounded-4xl border border-transparent font-medium leading-none whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none",
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
      },
      size: {
        sm: "h-4 gap-0.5 px-1.5 text-[0.65rem] has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 [&>svg]:size-2.5!",
        md:
          "h-5 gap-1 px-2 py-0.5 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3!",
        lg: "h-6 gap-1 px-2.5 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&>svg]:size-3.5!",
      },
    },
    compoundVariants: [
      {
        color: "primary",
        variant: "fill",
        className: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
      },
      {
        color: "secondary",
        variant: "fill",
        className:
          "bg-secondary-soft text-secondary-soft-foreground [a]:hover:bg-secondary-soft-hover",
      },
      {
        color: "success",
        variant: "fill",
        className: "bg-success text-success-foreground [a]:hover:bg-success/80",
      },
      {
        color: "warning",
        variant: "fill",
        className: "bg-warning text-warning-foreground [a]:hover:bg-warning/80",
      },
      {
        color: "destructive",
        variant: "fill",
        className:
          "bg-destructive text-destructive-foreground focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/80",
      },
      {
        color: "primary",
        variant: "soft",
        className: "bg-primary-soft text-primary [a]:hover:bg-primary/15",
      },
      {
        color: "secondary",
        variant: "soft",
        className:
          "bg-secondary-soft text-secondary-soft-foreground [a]:hover:bg-secondary-soft-hover",
      },
      {
        color: "success",
        variant: "soft",
        className: "bg-success-soft text-success [a]:hover:bg-success/15",
      },
      {
        color: "warning",
        variant: "soft",
        className: "bg-warning-soft text-warning [a]:hover:bg-warning/20",
      },
      {
        color: "destructive",
        variant: "soft",
        className:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
      },
      {
        color: "primary",
        variant: "outline",
        className:
          "border-primary bg-transparent text-primary [a]:hover:bg-primary-soft",
      },
      {
        color: "secondary",
        variant: "outline",
        className:
          "border-secondary/70 bg-transparent text-secondary-soft-foreground [a]:hover:bg-secondary-soft-hover",
      },
      {
        color: "success",
        variant: "outline",
        className:
          "border-success bg-transparent text-success [a]:hover:bg-success-soft",
      },
      {
        color: "warning",
        variant: "outline",
        className:
          "border-warning bg-transparent text-warning [a]:hover:bg-warning-soft",
      },
      {
        color: "destructive",
        variant: "outline",
        className:
          "border-destructive bg-transparent text-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/10",
      },
      {
        color: "neutral",
        variant: "outline",
        className:
          "border-border bg-transparent text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
      },
      {
        color: "primary",
        variant: "soft-outline",
        className:
          "border-primary bg-primary-soft text-primary [a]:hover:bg-primary/15",
      },
      {
        color: "secondary",
        variant: "soft-outline",
        className:
          "border-secondary/70 bg-secondary-soft text-secondary-soft-foreground [a]:hover:bg-secondary-soft-hover",
      },
      {
        color: "success",
        variant: "soft-outline",
        className:
          "border-success bg-success-soft text-success [a]:hover:bg-success/15",
      },
      {
        color: "warning",
        variant: "soft-outline",
        className:
          "border-warning bg-warning-soft text-warning [a]:hover:bg-warning/20",
      },
      {
        color: "destructive",
        variant: "soft-outline",
        className:
          "border-destructive bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
      },
    ],
    defaultVariants: {
      color: "primary",
      variant: "fill",
      size: "md",
    },
  }
)

type BadgeColor = NonNullable<VariantProps<typeof badgeVariants>["color"]>
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

function Badge({
  className,
  color = "primary",
  variant = "fill",
  size = "md",
  render,
  ...props
}: Omit<useRender.ComponentProps<"span">, "color"> &
  VariantProps<typeof badgeVariants>) {
  const resolvedVariant = color === "neutral" ? "outline" : variant

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(
          badgeVariants({ color, variant: resolvedVariant, size }),
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      color,
      variant: resolvedVariant,
      size,
    },
  })
}

export { Badge, badgeVariants, type BadgeColor, type BadgeVariant }
