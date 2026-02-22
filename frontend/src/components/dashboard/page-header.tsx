import { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  children?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 bg-theme-main/10 rounded-lg">
            <Icon className="w-6 h-6 text-theme-main" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-theme-main">{title}</h1>
          {description && (
            <p className="text-slate-500 text-sm mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
