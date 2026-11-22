"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { IconFileUpload } from "@tabler/icons-react"

import { WhatsAppDashboard } from "@/components/dashboard/whatsapp-dashboard"
import { Button } from "@/components/ui/button"
import type { DashboardStats } from "@/lib/whatsapp"

export function ChatRecap({ sample }: { sample: DashboardStats }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [imported, setImported] = useState<{
    dashboard: DashboardStats
    revision: number
  } | null>(null)
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dashboard = imported?.dashboard ?? sample
  const { byHour } = dashboard.timeBuckets
  const { busiestHour } = dashboard.insights
  const peakCount = Math.max(1, ...byHour.map(({ count }) => count))

  async function openExport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (!file || isReading) return

    setError(null)
    if (!/\.txt$/i.test(file.name)) {
      setError(
        /\.zip$/i.test(file.name)
          ? "Unzip the export and select the .txt file inside."
          : "Choose a WhatsApp chat export ending in .txt."
      )
      return
    }

    setIsReading(true)
    try {
      const { computeDashboardStats, parseWhatsAppTxt } =
        await import("@/lib/whatsapp")
      const next = computeDashboardStats(parseWhatsAppTxt(await file.text()))
      if (!next.aggregates.messageCount) {
        throw new Error("This export contains no chat messages to analyze.")
      }
      setImported((current) => ({
        dashboard: next,
        revision: (current?.revision ?? 0) + 1,
      }))
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Couldn’t open the chat export."
      )
    } finally {
      setIsReading(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <section
        aria-labelledby="recap-title"
        className="relative isolate grid items-end gap-7 pt-10 pb-8 sm:pt-14 lg:grid-cols-[1.3fr_1fr] lg:gap-12 lg:pt-16"
      >
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_45%,var(--hero-glow),transparent_70%)]"
          aria-hidden="true"
        />
        <div>
          <h1
            id="recap-title"
            className="font-heading text-4xl leading-[1.07] font-bold tracking-[-0.055em] text-balance sm:text-6xl"
          >
            Every chat has a <span className="text-primary">rhythm.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            See who keeps the conversation going, when the group gets busiest,
            and which emojis show up the most.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <input
              ref={fileInput}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={openExport}
            />
            <Button
              aria-describedby="chat-export-hint"
              className="h-10 gap-2 rounded-lg px-3 text-sm"
              disabled={isReading}
              onClick={() => fileInput.current?.click()}
            >
              <IconFileUpload data-icon="inline-start" aria-hidden="true" />
              {isReading ? "Reading chat…" : "Open WhatsApp export"}
            </Button>
            <p id="chat-export-hint" className="text-sm text-muted-foreground">
              Choose a .txt file. It stays in your browser.
            </p>
          </div>
          <p role="status" className="sr-only">
            {imported ? "Your WhatsApp recap is ready." : ""}
          </p>
          {error ? (
            <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <figure className="flex min-h-56 flex-col justify-between self-stretch rounded-2xl border border-primary/24 bg-linear-to-br from-activity-panel to-card p-5 sm:p-6">
          <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
            <span className="text-base font-semibold">Messages by hour</span>
            <span className="rounded-full bg-highlight/12 px-2.5 py-1 font-medium text-highlight">
              Busiest at {busiestHour}
            </span>
          </figcaption>
          <div
            className="mt-6 grid h-28 grid-cols-[repeat(24,minmax(0,1fr))] items-end gap-1 border-b border-primary/20 sm:h-32 sm:gap-1.5"
            aria-hidden="true"
          >
            {byHour.map(({ hour, count }) => (
              <div
                key={hour}
                className={
                  count === peakCount
                    ? "rounded-t-sm bg-highlight"
                    : "rounded-t-sm bg-primary/78"
                }
                style={{ height: `${(count / peakCount) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground" aria-hidden="true">
            <span>12 AM</span>
            <span>12 PM</span>
            <span>11 PM</span>
          </div>
        </figure>
      </section>

      <WhatsAppDashboard key={imported?.revision ?? "sample"} dashboard={dashboard} />
    </main>
  )
}
