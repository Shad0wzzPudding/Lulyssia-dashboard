import { useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { pickRandom, TOAST_LINES, type ToastMood } from "@/lib/stickers"

type ToastBodyProps = { title?: ReactNode; description?: ReactNode; mood: ToastMood | false }

// Lulyssia's sticker beside the text, plus one of her lines when the toast has no description.
// Picked once per toast, so they don't change while it is shown.
const ToastBody = ({ title, description, mood }: ToastBodyProps) => {
  const [line] = useState(() => (mood ? pickRandom(TOAST_LINES[mood]) : null))
  return (
    <div className="flex items-center gap-3">
      {line && <img src={line.sticker} alt="" className="h-12 w-12 shrink-0 object-contain" />}
      <div className="grid gap-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description ? (
          <ToastDescription>{description}</ToastDescription>
        ) : (
          line && <ToastDescription className="italic">{line.text}</ToastDescription>
        )}
      </div>
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, mood, ...props }) {
        return (
          <Toast key={id} {...props}>
            <ToastBody
              title={title}
              description={description}
              mood={mood ?? (props.variant === "destructive" ? "error" : "success")}
            />
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
