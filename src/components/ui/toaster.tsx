import { Toaster as Sonner } from "sonner"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#111] group-[.toaster]:text-slate-100 group-[.toaster]:border group-[.toaster]:shadow-xl rounded-xl px-4 py-3.5 flex items-start gap-3.5 w-full font-sans transition-all",
          description: "group-[.toast]:text-slate-400 text-[13px] mt-0.5 font-normal leading-relaxed",
          actionButton:
            "group-[.toast]:bg-slate-50 group-[.toast]:text-slate-900 font-medium",
          cancelButton:
            "group-[.toast]:bg-slate-800 group-[.toast]:text-slate-400 font-medium",
          success: "group-[.toaster]:border-green-500/40",
          error: "group-[.toaster]:border-red-500/40",
          warning: "group-[.toaster]:border-yellow-500/40",
          info: "group-[.toaster]:border-blue-500/40",
          title: "font-semibold text-[14.5px] tracking-tight",
          icon: "mt-0.5",
          closeButton: "group-[.toast]:bg-transparent group-[.toast]:border-none group-[.toast]:text-slate-500 group-[.toast]:hover:text-white transition-colors"
        },
      }}
      icons={{
        success: <CheckCircle2 className="w-[18px] h-[18px] text-green-500" strokeWidth={2.5} />,
        error: <XCircle className="w-[18px] h-[18px] text-red-500" strokeWidth={2.5} />,
        warning: <AlertTriangle className="w-[18px] h-[18px] text-yellow-500" strokeWidth={2.5} />,
        info: <Info className="w-[18px] h-[18px] text-blue-500" strokeWidth={2.5} />,
      }}
      {...props}
    />
  )
}
