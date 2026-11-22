import { readFile } from "node:fs/promises"
import path from "node:path"

import Image from "next/image"

import { ChatRecap } from "@/components/dashboard/chat-recap"
import { HowToUse } from "@/components/dashboard/how-to-use"
import { computeDashboardStats, parseWhatsAppTxt } from "@/lib/whatsapp"

import chatbeatIcon from "./icon.png"

export default async function Page() {
  const rawText = await readFile(
    path.join(process.cwd(), "public", "sample-chat.txt"),
    "utf8"
  )
  const dashboard = computeDashboardStats(parseWhatsAppTxt(rawText))

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
            <Image src={chatbeatIcon} width={28} height={28} alt="" unoptimized />
            Chatbeat
          </div>
          <HowToUse />
        </div>
      </header>

      <ChatRecap sample={dashboard} />
    </>
  )
}
