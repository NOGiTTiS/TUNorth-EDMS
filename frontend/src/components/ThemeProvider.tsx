"use client"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSettingStore } from "@/store/settingStore"

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { settings, fetchSettings } = useSettingStore()
  const pathname = usePathname()

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // จัดการ Favicon แบบ Dynamic
  useEffect(() => {
    const updateFavicon = () => {
      const faviconUrl = settings.favicon_url || settings.logo_url
      if (faviconUrl) {
        // 1. แก้ไข Path ให้ถูกต้องก่อน
        let cleanPath = faviconUrl.replace(/\\/g, "/")
        if (cleanPath.startsWith("/loads")) {
          cleanPath = cleanPath.replace("/loads", "/uploads")
        }
        const fullFaviconUrl = `${process.env.NEXT_PUBLIC_API_URL}${cleanPath}`

        // 2. ค้นหาและเปลี่ยน Link Tag (rel icon หรือ shortcut icon)
        const existingLinks = document.querySelectorAll("link[rel*='icon']")
        if (existingLinks.length > 0) {
          existingLinks.forEach((link: any) => {
            link.href = fullFaviconUrl
          })
        } else {
          const newLink = document.createElement("link")
          newLink.rel = "icon"
          newLink.href = fullFaviconUrl
          document.head.appendChild(newLink)
        }
      }
    }

    // เรียกทันที
    updateFavicon()

    // และเรียกอีกครั้งหลังจาก Next.js จัดการ Metadata เสร็จ (กรณีเปลี่ยนหน้า)
    const timeoutId = setTimeout(updateFavicon, 100)
    return () => clearTimeout(timeoutId)
  }, [settings.favicon_url, settings.logo_url, pathname])

  return (
    <div
      className="theme-wrapper min-h-screen bg-theme-grad"
      style={
        {
          "--theme-main": settings.theme_main_color || "#db2777",
          "--theme-grad-start": settings.theme_bg_gradient_start || "#fdf2f8",
          "--theme-grad-end": settings.theme_bg_gradient_end || "#ffffff",
          // Injecting into standard Tailwind/Shadcn variables
        } as React.CSSProperties
      }
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
          --theme-main: ${settings.theme_main_color || "#db2777"};
          --primary: ${settings.theme_main_color || "#db2777"};
          --ring: ${settings.theme_main_color || "#db2777"};
        }
        .bg-theme-main { background-color: var(--theme-main) !important; color: white !important; }
        .text-theme-main { color: var(--theme-main) !important; }
        .border-theme-main { border-color: var(--theme-main) !important; }
        .bg-theme-grad { background: linear-gradient(to bottom right, var(--theme-grad-start), var(--theme-grad-end)) !important; }
        .hover\\:bg-theme-main:hover { filter: brightness(0.9); }

        /* Dynamic Classes for Shading */
        .text-theme-dark { color: color-mix(in srgb, var(--theme-main), black 20%) !important; }
        .bg-theme-main-light { background-color: color-mix(in srgb, var(--theme-main), white 90%) !important; }
        .border-theme-main-light { border-color: color-mix(in srgb, var(--theme-main), white 80%) !important; }
        .shadow-theme-main { --tw-shadow-color: color-mix(in srgb, var(--theme-main), transparent 80%) !important; --tw-shadow: var(--tw-shadow-colored) !important; }
      `,
        }}
      />
      {children}
    </div>
  )
}
