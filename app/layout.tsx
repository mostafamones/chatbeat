import type { Metadata } from "next"
import { Geist_Mono, Outfit, Raleway } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const ralewayHeading = Raleway({
  subsets: ["latin"],
  variable: "--font-heading",
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "WhatsApp Recap",
  description: "A dark WhatsApp dashboard for uploaded chat exports.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        fontMono.variable,
        outfit.variable,
        ralewayHeading.variable
      )}
    >
      <body className="min-h-svh">
        <ThemeProvider defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
