"use client"

import { IconHelpCircle } from "@tabler/icons-react"
import { Dialog } from "radix-ui"

import { Button } from "@/components/ui/button"

export function HowToUse() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className="h-10 gap-2 rounded-lg pr-3 pl-5 text-sm text-muted-foreground"
        >
          <IconHelpCircle aria-hidden="true" />
          How to use
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="font-heading text-xl font-semibold tracking-tight">
              How to use Chatbeat
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" className="h-9 px-3 text-sm text-muted-foreground">
                Close
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-base leading-relaxed text-muted-foreground">
            Export a chat from WhatsApp and open it in Chatbeat to see your own recap.
          </Dialog.Description>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground marker:font-semibold marker:text-primary">
            <li>
              <strong className="text-foreground">Export from WhatsApp.</strong>{" "}
              On iPhone, tap the contact or group name and choose <strong>Export chat</strong>.
              On Android, open the three-dot menu and choose <strong>More → Export chat</strong>.
            </li>
            <li>
              Choose <strong>Without media</strong> when prompted and save the export.
              If it’s a ZIP, extract the <code>.txt</code> file inside.
            </li>
            <li>
              In Chatbeat, select <strong className="text-foreground">Open WhatsApp export</strong>{" "}
              and choose the <code>.txt</code> file. The dashboard updates with your chat.
            </li>
          </ol>
          <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
            The export stays in your browser. Refresh the page to clear your recap.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
