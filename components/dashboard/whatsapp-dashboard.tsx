"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import {
  IconCalendarStats,
  IconCalendarWeek,
  IconClockHour4,
  IconFlame,
  IconMessageCircle,
  IconMoodSmile,
  IconPaperclip,
  IconSparkles,
  IconTypography,
  IconUsers,
} from "@tabler/icons-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  type DashboardStats,
  type LeaderMetric,
  type RankedItem,
} from "@/lib/whatsapp"

const numberFormatter = new Intl.NumberFormat("en")

const userComparisonConfig = {
  messages: {
    label: "Messages",
    color: "var(--chart-1)",
  },
  words: {
    label: "Words",
    color: "var(--chart-2)",
  },
  letters: {
    label: "Letters",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const userExpressiveConfig = {
  attachments: {
    label: "Attachments",
    color: "var(--chart-4)",
  },
  emojis: {
    label: "Emojis",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

const talkerConfig = {
  messages: {
    label: "Messages",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const countConfig = {
  count: {
    label: "Messages",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const dateConfig = {
  count: {
    label: "Messages",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const wordsConfig = {
  value: {
    label: "Messages containing word",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const emojiConfig = {
  value: {
    label: "Emoji uses",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

const dashboardTabs = [
  { id: "overview", label: "Overview", Panel: OverviewTab },
  { id: "people", label: "People", Panel: PeopleTab },
  { id: "time", label: "Time", Panel: TimeTab },
  { id: "words", label: "Words & Emojis", Panel: WordsTab },
  { id: "highlights", label: "Highlights", Panel: HighlightsTab },
]

export function WhatsAppDashboard({ dashboard }: { dashboard: DashboardStats }) {
  const { messageCount, letterCount, attachmentCount, emojiCount } = dashboard.aggregates

  return (
    <>
      <dl
        aria-label="Chat totals"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4"
      >
        <StatCard title="Messages" value={messageCount} icon={IconMessageCircle} />
        <StatCard title="Letters typed" value={letterCount} icon={IconTypography} />
        <StatCard title="Attachments" value={attachmentCount} icon={IconPaperclip} warm />
        <StatCard title="Emojis used" value={emojiCount} icon={IconMoodSmile} warm />
      </dl>

      <Tabs defaultValue="overview" className="mt-7 gap-5">
        <div className="overflow-x-auto border-b border-border pb-1.5">
          <TabsList
            aria-label="Chat analytics"
            variant="line"
            className="min-h-11 justify-start gap-2"
          >
            {dashboardTabs.map(({ id, label }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="min-h-10 px-3 text-sm after:bg-primary sm:px-4"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {dashboardTabs.map(({ id, Panel }) => (
          <TabsContent key={id} value={id}>
            <Panel dashboard={dashboard} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  )
}

function OverviewTab({ dashboard }: { dashboard: DashboardStats }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-4">
        <ChartCard
          title="Top talkers"
          description="Messages sent by each participant."
        >
          <ChartContainer config={talkerConfig} className="h-80 w-full aspect-auto">
            <BarChart data={dashboard.perUser.comparison}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="sender"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) => truncateLabel(value, 10)}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="messages" radius={[8, 8, 0, 0]} fill="var(--color-messages)" />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard
          title="Messages by date"
          description="Daily message totals across the sample."
        >
          <ChartContainer config={dateConfig} className="h-80 w-full aspect-auto">
            <AreaChart data={dashboard.timeBuckets.byDate}>
              <defs>
                <linearGradient id="overview-date" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={28}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-count)"
                fill="url(#overview-date)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4">
        <Card className="border border-border bg-card ring-0">
          <CardHeader>
            <CardTitle>Conversation snapshot</CardTitle>
            <CardDescription>
              Participation and consistency over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <InsightTile
              title="Participants"
              value={String(dashboard.aggregates.participantCount)}
              description="Distinct senders detected in the export."
              icon={IconUsers}
            />
            <InsightTile
              title="Active days"
              value={String(dashboard.aggregates.activeDayCount)}
              description="Dates with at least one message."
              icon={IconCalendarWeek}
            />
            <InsightTile
              title="Average / active day"
              value={dashboard.insights.averageMessagesPerActiveDay.toFixed(1)}
              description="Average message density across active days."
              icon={IconCalendarStats}
            />
            <InsightTile
              title="Longest streak"
              value={`${dashboard.insights.longestStreak.days} days`}
              description={`${dashboard.insights.longestStreak.start} to ${dashboard.insights.longestStreak.end}`}
              icon={IconFlame}
            />
          </CardContent>
        </Card>

        <Card className="border border-border bg-card ring-0">
          <CardHeader>
            <CardTitle>Peak moments</CardTitle>
            <CardDescription>
              When the conversation was most active.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <PeakMoment
              label="Busiest hour"
              value={dashboard.insights.busiestHour}
              detail="Hour of day with the most messages."
            />
            <PeakMoment
              label="Busiest weekday"
              value={dashboard.insights.busiestWeekday}
              detail="Which day of the week gets the most conversation."
            />
            <PeakMoment
              label="Peak date"
              value={dashboard.insights.busiestDate}
              detail="Single date with the highest message count."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PeopleTab({ dashboard }: { dashboard: DashboardStats }) {
  const users = dashboard.perUser.users

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <LeaderCard
          title="Most messages"
          leader={dashboard.perUser.leaders.messages}
          icon={IconCalendarStats}
        />
        <LeaderCard
          title="Most words"
          leader={dashboard.perUser.leaders.words}
          icon={IconTypography}
        />
        <LeaderCard
          title="Most letters"
          leader={dashboard.perUser.leaders.letters}
          icon={IconTypography}
        />
        <LeaderCard
          title="Most attachments"
          leader={dashboard.perUser.leaders.attachments}
          icon={IconPaperclip}
        />
        <LeaderCard
          title="Most emojis"
          leader={dashboard.perUser.leaders.emojis}
          icon={IconMoodSmile}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Talk volume by user"
          description="Messages, words, and letters side by side."
        >
          <ChartContainer
            config={userComparisonConfig}
            className="w-full aspect-auto"
            style={{ height: Math.max(280, users.length * 58) }}
          >
            <BarChart data={dashboard.perUser.comparison} layout="vertical">
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="sender"
                type="category"
                tickLine={false}
                axisLine={false}
                width={92}
                tickFormatter={(value) => truncateLabel(value, 12)}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="messages" fill="var(--color-messages)" radius={8} />
              <Bar dataKey="words" fill="var(--color-words)" radius={8} />
              <Bar dataKey="letters" fill="var(--color-letters)" radius={8} />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard
          title="Attachments & emojis"
          description="Who leans hardest into media and reactions."
        >
          <ChartContainer
            config={userExpressiveConfig}
            className="w-full aspect-auto"
            style={{ height: Math.max(280, users.length * 58) }}
          >
            <BarChart data={dashboard.perUser.comparison} layout="vertical">
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="sender"
                type="category"
                tickLine={false}
                axisLine={false}
                width={92}
                tickFormatter={(value) => truncateLabel(value, 12)}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="attachments" fill="var(--color-attachments)" radius={8} />
              <Bar dataKey="emojis" fill="var(--color-emojis)" radius={8} />
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>

      <Card className="border border-border bg-card ring-0">
        <CardHeader>
          <CardTitle>Per-user drilldown</CardTitle>
          <CardDescription>
            Switch between participants to inspect their strongest stats, top
            words, and top emojis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="user-0" className="gap-4">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/70 p-2">
              {users.map((user, index) => (
                <TabsTrigger key={index} value={`user-${index}`}>
                  {user.sender}
                </TabsTrigger>
              ))}
            </TabsList>
            {users.map((user, index) => (
              <TabsContent
                key={index}
                value={`user-${index}`}
                className="space-y-4"
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <MiniStat label="Messages" value={user.messagesCount} />
                  <MiniStat label="Words" value={user.wordsCount} />
                  <MiniStat label="Letters" value={user.lettersCount} />
                  <MiniStat label="Attachments" value={user.attachmentsCount} />
                  <MiniStat label="Emojis" value={user.emojisCount} />
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <RankedItemsCard
                    title="Top words"
                    description="Counts reflect messages containing the word."
                    items={user.topWords}
                  />
                  <RankedItemsCard
                    title="Top emojis"
                    description="Most frequently used emoji by this person."
                    items={user.topEmojis}
                    emoji
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function TimeTab({ dashboard }: { dashboard: DashboardStats }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard
        title="Messages by hour"
        description="What hours of the day get the most action."
      >
        <ChartContainer config={countConfig} className="h-80 w-full aspect-auto">
          <BarChart data={dashboard.timeBuckets.byHour}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={1}
              tickFormatter={(value) => value.replace(" ", "")}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="var(--color-count)" />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Messages by weekday"
        description="The seven-day pattern of the conversation."
      >
        <ChartContainer config={countConfig} className="h-80 w-full aspect-auto">
          <BarChart data={dashboard.timeBuckets.byWeekday}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="var(--color-count)" />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Messages by date"
        description="A full timeline view for spikes, streaks, and lulls."
        className="xl:col-span-2"
      >
        <ChartContainer config={dateConfig} className="h-96 w-full aspect-auto">
          <AreaChart data={dashboard.timeBuckets.byDate}>
            <defs>
              <linearGradient id="timeline-date" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={28}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--color-count)"
              fill="url(#timeline-date)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </ChartCard>
    </div>
  )
}

function WordsTab({ dashboard }: { dashboard: DashboardStats }) {
  const topWordsChart = dashboard.contentStats.topWords.slice(0, 12)
  const topEmojiChart = dashboard.contentStats.topEmojis.slice(0, 12)

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard
        title="Top words"
        description="Top normalized words ranked by how many messages contain them."
      >
        <ChartContainer config={wordsConfig} className="h-[30rem] w-full aspect-auto">
          <BarChart data={[...topWordsChart].reverse()} layout="vertical">
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={92}
              tickFormatter={(value) => truncateLabel(value, 12)}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={8} fill="var(--color-value)" />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Top emojis"
        description="Most frequently used emojis."
      >
        <ChartContainer config={emojiConfig} className="h-[30rem] w-full aspect-auto">
          <BarChart data={topEmojiChart}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--color-value)" />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <RankedItemsCard
        title="Top 100 words"
        description="Long-tail word ranking for deeper digging."
        items={dashboard.contentStats.topWords}
        columns={2}
      />
      <RankedItemsCard
        title="Emoji ranking"
        description="Every emoji that made it into the export."
        items={dashboard.contentStats.topEmojis}
        emoji
      />
    </div>
  )
}

function HighlightsTab({ dashboard }: { dashboard: DashboardStats }) {
  const highlights = [
    {
      title: "Busiest hour",
      value: dashboard.insights.busiestHour,
      description: "Most active hour of the day across the chat.",
      icon: IconClockHour4,
    },
    {
      title: "Busiest weekday",
      value: dashboard.insights.busiestWeekday,
      description: "The weekday where the conversation is loudest.",
      icon: IconCalendarWeek,
    },
    {
      title: "Peak date",
      value: dashboard.insights.busiestDate,
      description: "Single date with the highest number of messages.",
      icon: IconCalendarStats,
    },
    {
      title: "Longest streak",
      value: `${dashboard.insights.longestStreak.days} days`,
      description: `${dashboard.insights.longestStreak.start} to ${dashboard.insights.longestStreak.end}`,
      icon: IconFlame,
    },
    {
      title: "Average per active day",
      value: dashboard.insights.averageMessagesPerActiveDay.toFixed(1),
      description: "How dense the chat feels once a day is active.",
      icon: IconSparkles,
    },
    {
      title: "Participants",
      value: String(dashboard.aggregates.participantCount),
      description: "Distinct senders recognized in the file.",
      icon: IconUsers,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {highlights.map((highlight) => (
        <Card key={highlight.title} className="border border-border bg-card ring-0">
          <CardHeader className="gap-3">
            <div className="flex items-center gap-2 text-primary">
              <highlight.icon className="size-4" />
              <CardTitle>{highlight.title}</CardTitle>
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {highlight.value}
            </div>
            <CardDescription>{highlight.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  warm = false,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  warm?: boolean
}) {
  const accent = warm ? "bg-highlight/14 text-highlight" : "bg-primary/14 text-primary"
  return (
    <div className="bg-card p-4 sm:p-5">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${accent}`}>
          <Icon className="size-4" aria-hidden />
        </span>
        {title}
      </dt>
      <dd className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
        {numberFormatter.format(value)}
      </dd>
    </div>
  )
}

function ChartCard({
  title,
  description,
  children,
  className,
}: React.PropsWithChildren<{
  title: string
  description: string
  className?: string
}>) {
  return (
    <Card className={`border border-border bg-card ring-0 ${className ?? ""}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function LeaderCard({
  title,
  leader,
  icon: Icon,
}: {
  title: string
  leader: LeaderMetric
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="border border-border bg-card ring-0">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-4" />
          <CardDescription>{title}</CardDescription>
        </div>
        <CardTitle className="text-base" dir="auto">
          {leader.sender}
        </CardTitle>
        <div className="text-2xl font-semibold">{numberFormatter.format(leader.value)}</div>
      </CardHeader>
    </Card>
  )
}

function RankedItemsCard({
  title,
  description,
  items,
  emoji = false,
  columns = 1,
}: {
  title: string
  description: string
  items: RankedItem[]
  emoji?: boolean
  columns?: 1 | 2
}) {
  return (
    <Card className="border border-border bg-card ring-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ol
            className={`grid gap-2 ${columns === 2 ? "xl:grid-cols-2" : ""}`}
          >
            {items.map((item, index) => (
              <li
                key={`${item.label}-${index}`}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-[0.7rem] font-medium text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <span
                    className={`font-medium ${emoji ? "text-xl leading-none" : ""}`}
                    dir="auto"
                  >
                    {item.label}
                  </span>
                </div>
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {numberFormatter.format(item.value)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing ranked yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

function InsightTile({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-[0.18em]">
          {title}
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function PeakMoment({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold" dir="auto">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {numberFormatter.format(value)}
      </p>
    </div>
  )
}

function truncateLabel(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value
}
