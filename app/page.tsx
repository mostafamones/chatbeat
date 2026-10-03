import { readFile } from "node:fs/promises"
import path from "node:path"

import { WhatsAppDashboard } from "@/components/dashboard/whatsapp-dashboard"
import { computeDashboardStats, parseWhatsAppTxt } from "@/lib/whatsapp"

export default async function Page() {
  const fileName = "_chat.txt"
  const filePath = path.join(process.cwd(), fileName)
  let dashboard = null
  let errorMessage: string | null = null

  try {
    const rawText = await readFile(filePath, "utf8")
    const messages = parseWhatsAppTxt(rawText)
    dashboard = computeDashboardStats(messages)
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to read the root chat file."
  }

  return (
    <WhatsAppDashboard
      dashboard={dashboard}
      fileName={fileName}
      error={errorMessage}
    />
  )
}
