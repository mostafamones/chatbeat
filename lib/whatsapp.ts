export type ParsedMessage = {
  id: string
  sender: string
  timestamp: Date
  text: string
  hasAttachment: boolean
  isSystemMessage: boolean
  lettersCount: number
  words: string[]
  emojis: string[]
}

export type RankedItem = {
  label: string
  value: number
}

export type LeaderMetric = {
  sender: string
  value: number
}

export type UserSummary = {
  sender: string
  messagesCount: number
  wordsCount: number
  lettersCount: number
  attachmentsCount: number
  emojisCount: number
  topWords: RankedItem[]
  topEmojis: RankedItem[]
}

export type DashboardStats = {
  aggregates: {
    messageCount: number
    letterCount: number
    attachmentCount: number
    emojiCount: number
    participantCount: number
    activeDayCount: number
  }
  perUser: {
    users: UserSummary[]
    comparison: Array<{
      sender: string
      messages: number
      words: number
      letters: number
      attachments: number
      emojis: number
    }>
    leaders: {
      messages: LeaderMetric
      words: LeaderMetric
      letters: LeaderMetric
      attachments: LeaderMetric
      emojis: LeaderMetric
    }
  }
  timeBuckets: {
    byHour: Array<{ hour: number; label: string; count: number }>
    byWeekday: Array<{ dayIndex: number; label: string; count: number }>
    byDate: Array<{ date: string; label: string; count: number }>
  }
  contentStats: {
    topWords: RankedItem[]
    topEmojis: RankedItem[]
  }
  insights: {
    busiestHour: string
    busiestWeekday: string
    busiestDate: string
    longestStreak: {
      days: number
      start: string
      end: string
    }
    averageMessagesPerActiveDay: number
    chatRange: {
      start: string
      end: string
    } | null
  }
}

type DateOrder = "DMY" | "MDY" | "YMD"
type AttachmentKind =
  | "audio"
  | "contact"
  | "document"
  | "gif"
  | "image"
  | "location"
  | "sticker"
  | "video"
  | "view-once"
  | null

type RawEntry = {
  dateText: string
  timeText: string
  rest: string
}

type ClassifiedEntry = {
  sender: string
  cleanedText: string
  hasAttachment: boolean
  isSystemMessage: boolean
}

const INVISIBLE_FORMATTING_REGEX = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g
const LEADING_NOISE_REGEX = /^[\uFEFF\u200e\u200f\u202a-\u202e\u2066-\u2069]+/
const HEADER_PATTERNS = [
  /^[\uFEFF\u200e\u200f\u202a-\u202e\u2066-\u2069]*\[(\d{1,4}[\/.-]\d{1,2}[\/.-]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s*(.*)$/,
  /^[\uFEFF\u200e\u200f\u202a-\u202e\u2066-\u2069]*(\d{1,4}[\/.-]\d{1,2}[\/.-]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s-\s(.*)$/,
] as const

const EDIT_MARKER_REGEX = /\s*<this message was edited>\s*$/i
const DELETED_MESSAGE_REGEX = /^this message was deleted(?: by admin .+)?\.?$/i
const VIEW_ONCE_PLACEHOLDER_REGEX =
  /^you received a view once message(?:\..*)?$/i
const ATTACHMENT_PLACEHOLDER_REGEX =
  /\b(audio|document|gif|image|location|media|sticker|video|contact card)\s+omitted\b/i
const ATTACHED_FILE_REGEX = /<attached:\s*[^>]+>/i
const FILE_ATTACHED_REGEX =
  /\((file|image|video|audio|document|sticker|gif) attached\)/i
const DOCUMENT_METADATA_BULLET_REGEX = /\s*•\s*[^]*$/u
const FILENAME_REGEX =
  /\.[a-z0-9]{2,6}$/i
const WORD_REGEX = /[\p{L}\p{N}]+/gu
const LETTER_REGEX = /\p{L}/gu
const EMOJI_REGEX =
  /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu
const ARABIC_TATWEEL_REGEX = /\u0640+/gu
const ARABIC_CHAR_REGEX = /[\u0600-\u06FF]/u

const SYSTEM_MESSAGE_PATTERNS = [
  /^messages and calls are end-to-end encrypted/i,
  /^disappearing messages were turned on/i,
  /^new messages will disappear/i,
  /^click to change\.?$/i,
  /^you pinned a message\.?$/i,
  /^\S.+ pinned a message\.?$/i,
  /^you changed the group description\.?$/i,
  /^you changed this group's icon\.?$/i,
  /^you changed the subject from/i,
  /^you deleted this message\.?$/i,
  /^you were added\.?$/i,
  /^you joined using this group's invite link\.?$/i,
  /^you joined from the community\.?$/i,
  /^group created by/i,
  /^\S.+ created group /i,
  /^\S.+ added you$/i,
  /^\S.+ added \S.+$/i,
  /^\S.+ removed \S.+$/i,
  /^\S.+ left$/i,
  /^\S.+ turned off disappearing messages/i,
  /^\S.+ turned on disappearing messages/i,
  /^\S.+ changed the subject /i,
  /^\S.+ changed this group's icon/i,
  /^\S.+ changed the group description/i,
  /^\S.+ joined using this group's invite link/i,
  /^\S.+ joined from the community/i,
  /^(?:missed|voice|video) call/i,
  /^security code changed/i,
  /^this message was deleted(?: by admin .+)?\.?$/i,
]

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const dateLabelFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
})

const fullDateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function parseWhatsAppTxt(rawText: string): ParsedMessage[] {
  const entries = splitRawEntries(rawText)

  if (!entries.length) {
    throw new Error(
      "No WhatsApp messages were detected. Export the chat as a .txt file and try again."
    )
  }

  const dateOrder = inferDateOrder(entries.map((entry) => entry.dateText))
  const messages = entries
    .map((entry, index) => createParsedMessage(entry, index, dateOrder))
    .filter((message): message is ParsedMessage => message !== null)

  if (!messages.length) {
    throw new Error(
      "The file was readable, but none of the lines looked like user messages."
    )
  }

  return messages
}

export function computeDashboardStats(
  messages: ParsedMessage[]
): DashboardStats {
  const contentMessages = messages.filter((message) => !message.isSystemMessage)
  const ignoredNameWords = getIgnoredNameWords(messages)
  const userMap = new Map<
    string,
    {
      summary: UserSummary
      wordCounts: Map<string, number>
      emojiCounts: Map<string, number>
    }
  >()
  const overallWordCounts = new Map<string, number>()
  const overallEmojiCounts = new Map<string, number>()
  const dateCounts = new Map<string, number>()
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: formatHourLabel(hour),
    count: 0,
  }))
  const weekdays = WEEKDAY_SHORT.map((label, dayIndex) => ({
    dayIndex,
    label,
    count: 0,
  }))

  let totalLetters = 0
  let totalAttachments = 0
  let totalEmojis = 0

  for (const message of contentMessages) {
    totalLetters += message.lettersCount
    totalAttachments += Number(message.hasAttachment)
    totalEmojis += message.emojis.length

    const dateKey = formatDateKey(message.timestamp)
    hours[message.timestamp.getHours()].count += 1
    weekdays[message.timestamp.getDay()].count += 1
    incrementCount(dateCounts, dateKey)

    if (!userMap.has(message.sender)) {
      userMap.set(message.sender, {
        summary: {
          sender: message.sender,
          messagesCount: 0,
          wordsCount: 0,
          lettersCount: 0,
          attachmentsCount: 0,
          emojisCount: 0,
          topWords: [],
          topEmojis: [],
        },
        wordCounts: new Map<string, number>(),
        emojiCounts: new Map<string, number>(),
      })
    }

    const user = userMap.get(message.sender)

    if (!user) {
      continue
    }

    const filteredWords = message.words.filter(
      (word) => !ignoredNameWords.has(word)
    )
    const uniqueWords = new Set(filteredWords)

    user.summary.messagesCount += 1
    user.summary.wordsCount += filteredWords.length
    user.summary.lettersCount += message.lettersCount
    user.summary.attachmentsCount += Number(message.hasAttachment)
    user.summary.emojisCount += message.emojis.length

    for (const word of uniqueWords) {
      incrementCount(overallWordCounts, word)
      incrementCount(user.wordCounts, word)
    }

    for (const emoji of message.emojis) {
      incrementCount(overallEmojiCounts, emoji)
      incrementCount(user.emojiCounts, emoji)
    }
  }

  const users = [...userMap.values()]
    .map(({ summary, wordCounts, emojiCounts }) => ({
      ...summary,
      topWords: toRankedItems(wordCounts, 5),
      topEmojis: toRankedItems(emojiCounts, 5),
    }))
    .sort((left, right) => right.messagesCount - left.messagesCount)

  const comparison = users.map((user) => ({
    sender: user.sender,
    messages: user.messagesCount,
    words: user.wordsCount,
    letters: user.lettersCount,
    attachments: user.attachmentsCount,
    emojis: user.emojisCount,
  }))

  const byDate = [...dateCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, count]) => ({
      date,
      label: formatDateLabelFromKey(date),
      count,
    }))

  return {
    aggregates: {
      messageCount: contentMessages.length,
      letterCount: totalLetters,
      attachmentCount: totalAttachments,
      emojiCount: totalEmojis,
      participantCount: users.length,
      activeDayCount: byDate.length,
    },
    perUser: {
      users,
      comparison,
      leaders: {
        messages: pickLeader(users, "messagesCount"),
        words: pickLeader(users, "wordsCount"),
        letters: pickLeader(users, "lettersCount"),
        attachments: pickLeader(users, "attachmentsCount"),
        emojis: pickLeader(users, "emojisCount"),
      },
    },
    timeBuckets: {
      byHour: hours,
      byWeekday: weekdays,
      byDate,
    },
    contentStats: {
      topWords: toRankedItems(overallWordCounts, 100),
      topEmojis: toRankedItems(overallEmojiCounts, 25),
    },
    insights: {
      busiestHour: hours.reduce((peak, bucket) =>
        bucket.count > peak.count ? bucket : peak
      ).label,
      busiestWeekday: WEEKDAY_NAMES[
        weekdays.reduce((peak, bucket) =>
          bucket.count > peak.count ? bucket : peak
        ).dayIndex
      ],
      busiestDate: findPeakDate(byDate),
      longestStreak: findLongestStreak(byDate.map((item) => item.date)),
      averageMessagesPerActiveDay: byDate.length
        ? contentMessages.length / byDate.length
        : 0,
      chatRange: getChatRange(contentMessages),
    },
  }
}

function splitRawEntries(rawText: string) {
  const lines = rawText.replace(/\r\n?/g, "\n").split("\n")
  const entries: RawEntry[] = []
  let current: RawEntry | null = null

  for (const line of lines) {
    const parsedLine = parseHeaderLine(line)

    if (parsedLine) {
      if (current) {
        entries.push(current)
      }

      current = parsedLine
      continue
    }

    if (current) {
      current.rest = `${current.rest}\n${stripLeadingNoise(line).trimEnd()}`
    }
  }

  if (current) {
    entries.push(current)
  }

  return entries
}

function parseHeaderLine(line: string): RawEntry | null {
  const normalizedLine = stripLeadingNoise(line)

  for (const pattern of HEADER_PATTERNS) {
    const match = normalizedLine.match(pattern)

    if (!match) {
      continue
    }

    const [, dateText, timeText, rest] = match

    return {
      dateText,
      timeText,
      rest: rest.trimEnd(),
    }
  }

  return null
}

function createParsedMessage(
  entry: RawEntry,
  index: number,
  dateOrder: DateOrder
): ParsedMessage | null {
  const timestamp = parseDateTime(entry.dateText, entry.timeText, dateOrder)

  if (!timestamp) {
    return null
  }

  const classified = classifyEntry(entry.rest)

  if (!classified) {
    return null
  }

  return {
    id: `${timestamp.getTime()}-${index}`,
    sender: classified.sender,
    timestamp,
    text: classified.cleanedText,
    hasAttachment: classified.hasAttachment,
    isSystemMessage: classified.isSystemMessage,
    lettersCount: countLetters(classified.cleanedText),
    words: extractWords(classified.cleanedText),
    emojis: extractEmojis(classified.cleanedText),
  }
}

function classifyEntry(rest: string): ClassifiedEntry | null {
  const { sender, body } = splitSenderAndBody(rest)

  if (!sender) {
    return null
  }

  const senderText = collapseInvisibleFormatting(sender)
  const bodyText = collapseInvisibleFormatting(body)
  const attachmentKind = detectAttachmentKind(bodyText)
  const isSystemMessage = detectSystemMessage(senderText, bodyText, attachmentKind)
  const cleanedText = cleanMessageText(bodyText, attachmentKind, isSystemMessage)

  return {
    sender: senderText,
    cleanedText,
    hasAttachment: attachmentKind !== null,
    isSystemMessage,
  }
}

function splitSenderAndBody(rest: string) {
  const separatorIndex = rest.indexOf(": ")

  if (separatorIndex < 0) {
    return {
      sender: null,
      body: rest,
    }
  }

  return {
    sender: rest.slice(0, separatorIndex).trim(),
    body: rest.slice(separatorIndex + 2),
  }
}

function detectAttachmentKind(text: string): AttachmentKind {
  const normalizedText = text.toLowerCase()

  if (VIEW_ONCE_PLACEHOLDER_REGEX.test(normalizedText)) {
    return "view-once"
  }

  if (ATTACHED_FILE_REGEX.test(normalizedText) || FILE_ATTACHED_REGEX.test(normalizedText)) {
    return "document"
  }

  const omittedMatch = normalizedText.match(ATTACHMENT_PLACEHOLDER_REGEX)

  if (!omittedMatch) {
    return null
  }

  const token = omittedMatch[1]

  if (token === "media") {
    return "image"
  }

  if (token === "contact card") {
    return "contact"
  }

  return token as AttachmentKind
}

function detectSystemMessage(
  sender: string,
  text: string,
  attachmentKind: AttachmentKind
) {
  if (attachmentKind === "view-once") {
    return false
  }

  const normalizedText = text.trim()

  if (DELETED_MESSAGE_REGEX.test(normalizedText)) {
    return true
  }

  if (SYSTEM_MESSAGE_PATTERNS.some((pattern) => pattern.test(normalizedText))) {
    return true
  }

  if (
    sender === "You" &&
    SYSTEM_MESSAGE_PATTERNS.some((pattern) =>
      pattern.test(normalizedText.replace(/^you\s+/i, ""))
    )
  ) {
    return true
  }

  return false
}

function cleanMessageText(
  text: string,
  attachmentKind: AttachmentKind,
  isSystemMessage: boolean
) {
  let cleaned = text.replace(EDIT_MARKER_REGEX, "").trim()

  if (isSystemMessage) {
    return ""
  }

  if (attachmentKind === "view-once") {
    return ""
  }

  if (attachmentKind !== null) {
    cleaned = stripAttachmentDescriptor(cleaned, attachmentKind)
  }

  return cleaned.replace(/\s+/g, " ").trim()
}

function stripAttachmentDescriptor(text: string, attachmentKind: AttachmentKind) {
  if (!attachmentKind) {
    return text
  }

  const attachedIndex = findAttachmentDescriptorIndex(text)

  if (attachedIndex < 0) {
    return text
  }

  const prefix = text.slice(0, attachedIndex).trim()

  if (attachmentKind === "document") {
    return normalizeDocumentCaption(prefix)
  }

  return prefix
}

function findAttachmentDescriptorIndex(text: string) {
  const candidates = [
    text.search(ATTACHMENT_PLACEHOLDER_REGEX),
    text.search(ATTACHED_FILE_REGEX),
    text.search(FILE_ATTACHED_REGEX),
  ].filter((index) => index >= 0)

  if (!candidates.length) {
    return -1
  }

  return Math.min(...candidates)
}

function normalizeDocumentCaption(prefix: string) {
  const beforeBullet = prefix.replace(DOCUMENT_METADATA_BULLET_REGEX, "").trim()

  if (!beforeBullet) {
    return ""
  }

  if (looksLikeFilename(beforeBullet)) {
    return ""
  }

  return beforeBullet
}

function looksLikeFilename(text: string) {
  const compact = text.trim()

  if (!compact) {
    return false
  }

  if (FILENAME_REGEX.test(compact)) {
    return true
  }

  return /(?:^|\s)(pdf|docx?|pptx?|xlsx?|csv|zip|rar|jpg|jpeg|png|gif|mp3|m4a|ogg|mp4|mov)$/i.test(
    compact
  )
}

function inferDateOrder(dateTexts: string[]): DateOrder {
  const parts = dateTexts
    .map((dateText) => dateText.split(/[\/.-]/).map((part) => Number(part)))
    .filter((values) => values.length === 3 && values.every(Number.isFinite))

  if (!parts.length) {
    return "DMY"
  }

  if (String(parts[0][0]).length === 4) {
    return "YMD"
  }

  const firstOver12 = parts.some(([first]) => first > 12)
  const secondOver12 = parts.some(([, second]) => second > 12)

  if (firstOver12 && !secondOver12) {
    return "DMY"
  }

  if (secondOver12 && !firstOver12) {
    return "MDY"
  }

  return "DMY"
}

function parseDateTime(
  rawDate: string,
  rawTime: string,
  dateOrder: DateOrder
): Date | null {
  const dateParts = rawDate.split(/[\/.-]/).map((part) => Number(part))

  if (dateParts.length !== 3 || dateParts.some((part) => !Number.isFinite(part))) {
    return null
  }

  let day = 0
  let month = 0
  let year = 0

  if (dateOrder === "YMD") {
    ;[year, month, day] = dateParts
  } else if (dateOrder === "MDY") {
    ;[month, day, year] = dateParts
  } else {
    ;[day, month, year] = dateParts
  }

  if (year < 100) {
    year += year >= 70 ? 1900 : 2000
  }

  const timeMatch = rawTime.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([APap][Mm]))?$/
  )

  if (!timeMatch) {
    return null
  }

  const [, rawHour, rawMinute, rawSecond, rawPeriod] = timeMatch
  let hour = Number(rawHour)
  const minute = Number(rawMinute)
  const second = Number(rawSecond ?? "0")
  const period = rawPeriod?.toUpperCase()

  if (period === "PM" && hour < 12) {
    hour += 12
  }

  if (period === "AM" && hour === 12) {
    hour = 0
  }

  const timestamp = new Date(year, month - 1, day, hour, minute, second)

  return Number.isNaN(timestamp.getTime()) ? null : timestamp
}

function extractWords(text: string) {
  const sanitized = text.replace(EMOJI_REGEX, " ")
  const matches = sanitized.match(WORD_REGEX) ?? []

  return matches
    .map((word) => normalizeWord(word))
    .filter((word): word is string => Boolean(word))
}

function extractEmojis(text: string) {
  return text.match(EMOJI_REGEX) ?? []
}

function normalizeWord(word: string) {
  let normalized = word.toLocaleLowerCase()

  normalized = normalized.replace(ARABIC_TATWEEL_REGEX, "")

  if (ARABIC_CHAR_REGEX.test(normalized)) {
    normalized = normalized.replace(/(.)\1+/gu, "$1")
  }

  normalized = normalized.trim()

  if (normalized.length < 2 || isNoiseWord(normalized)) {
    return null
  }

  return normalized
}

function isNoiseWord(word: string) {
  if (/^\d+$/.test(word)) {
    return true
  }

  if (/^(?:am|pm)$/i.test(word)) {
    return true
  }

  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(word)) {
    return true
  }

  if (/^\d{1,4}[\/.-]\d{1,2}(?:[\/.-]\d{1,4})?$/.test(word)) {
    return true
  }

  if (/^(?:this|message|edited|deleted|admin|view|once|privacy|phone)$/i.test(word)) {
    return true
  }

  return false
}

function collapseInvisibleFormatting(value: string) {
  return value.replace(INVISIBLE_FORMATTING_REGEX, "").trim()
}

function stripLeadingNoise(value: string) {
  return value.replace(LEADING_NOISE_REGEX, "")
}

function countLetters(text: string) {
  return text.match(LETTER_REGEX)?.length ?? 0
}

function incrementCount(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function toRankedItems(counts: Map<string, number>, limit: number): RankedItem[] {
  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1]
      }

      return left[0].localeCompare(right[0], "en")
    })
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }))
}

function pickLeader(
  users: UserSummary[],
  key:
    | "messagesCount"
    | "wordsCount"
    | "lettersCount"
    | "attachmentsCount"
    | "emojisCount"
): LeaderMetric {
  const leader = users.reduce<UserSummary | null>((currentLeader, user) => {
    if (!currentLeader || user[key] > currentLeader[key]) {
      return user
    }

    return currentLeader
  }, null)

  if (!leader) {
    return { sender: "Nobody", value: 0 }
  }

  return {
    sender: leader.sender,
    value: leader[key],
  }
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatDateLabelFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return dateLabelFormatter.format(new Date(year, month - 1, day))
}

function formatFullDateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return fullDateFormatter.format(new Date(year, month - 1, day))
}

function formatHourLabel(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM"
  const twelveHour = hour % 12 || 12
  return `${twelveHour} ${suffix}`
}

function findPeakDate(byDate: Array<{ date: string; count: number }>) {
  if (!byDate.length) {
    return "No activity yet"
  }

  const peak = byDate.reduce((currentPeak, entry) =>
    entry.count > currentPeak.count ? entry : currentPeak
  )

  return formatFullDateFromKey(peak.date)
}

function findLongestStreak(dateKeys: string[]) {
  if (!dateKeys.length) {
    return {
      days: 0,
      start: "No messages yet",
      end: "No messages yet",
    }
  }

  const sortedKeys = [...dateKeys].sort((left, right) => left.localeCompare(right))
  let bestStart = sortedKeys[0]
  let bestEnd = sortedKeys[0]
  let bestLength = 1
  let currentStart = sortedKeys[0]
  let currentEnd = sortedKeys[0]
  let currentLength = 1

  for (let index = 1; index < sortedKeys.length; index += 1) {
    const previousDay = toDayNumber(sortedKeys[index - 1])
    const currentDay = toDayNumber(sortedKeys[index])

    if (currentDay - previousDay === 1) {
      currentEnd = sortedKeys[index]
      currentLength += 1
    } else {
      currentStart = sortedKeys[index]
      currentEnd = sortedKeys[index]
      currentLength = 1
    }

    if (currentLength > bestLength) {
      bestStart = currentStart
      bestEnd = currentEnd
      bestLength = currentLength
    }
  }

  return {
    days: bestLength,
    start: formatFullDateFromKey(bestStart),
    end: formatFullDateFromKey(bestEnd),
  }
}

function toDayNumber(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}

function getChatRange(messages: ParsedMessage[]) {
  if (!messages.length) {
    return null
  }

  const sorted = [...messages].sort(
    (left, right) => left.timestamp.getTime() - right.timestamp.getTime()
  )

  return {
    start: fullDateFormatter.format(sorted[0].timestamp),
    end: fullDateFormatter.format(sorted.at(-1)!.timestamp),
  }
}

function getIgnoredNameWords(messages: ParsedMessage[]) {
  const ignoredWords = new Set<string>()

  for (const sender of new Set(messages.map((message) => message.sender))) {
    const senderWords = collapseInvisibleFormatting(sender).match(WORD_REGEX) ?? []

    for (const word of senderWords) {
      const normalizedWord = normalizeWord(word)

      if (normalizedWord) {
        ignoredWords.add(normalizedWord)
      }
    }
  }

  return ignoredWords
}
