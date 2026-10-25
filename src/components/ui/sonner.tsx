import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Above an open form (z-50) but behind the menu button and its menus (z-[60]), so a message
      // never covers them; Sonner's own default sits above everything. An open form turns off
      // clicks outside itself; the messages keep them so they can still be swiped away.
      style={{ zIndex: 55, pointerEvents: "auto" }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:italic",
          // Room for Lulyssia's sticker (Sonner sizes icons at 16px)
          icon: "group-[.toast]:h-12 group-[.toast]:w-12",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
