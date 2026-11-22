import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

// Deterministic synthetic group chat. It does not read any exported chat data.
const TARGET_MESSAGES = 12_000
const START = Date.UTC(2025, 0, 1)
const DAY_MS = 24 * 60 * 60 * 1000
const DAYS = 365
const OUT = resolve('public/sample-chat.txt')
const members = ['AL', 'BM', 'CR', 'DS', 'EK', 'FN', 'GT', 'HW']
const topics = [
  ['weekend plan', 'Should we do brunch or the beach this weekend?', 'Brunch first, beach if the weather holds 🌤️'],
  ['movie night', 'Movie night vote: comedy, mystery, or the one BM keeps recommending?', 'Mystery wins. Snacks are non-negotiable 🍿'],
  ['shared recipe', 'I tried the lemon pasta from the group recipe thread 🍋', 'Tiny bit more parmesan next time and it is perfect.'],
  ['lost keys', 'Has anyone seen my blue keys? Last had them at the cafe.', 'They were by the window seat! I can bring them tomorrow 🙌'],
  ['trip planning', 'Train tickets are open for the long weekend. What time works?', 'The 9:20 one gets us there before lunch 🚆'],
  ['game night', 'Game night scores are still disputed 😂', 'The rules were clear and I stand by my victory.'],
  ['plant check', 'The balcony basil survived another week 🌱', 'Give it a little water before the afternoon sun.'],
  ['coffee run', 'Coffee run in ten? I am ordering for everyone ☕', 'Flat white for me please, thanks!'],
  ['book club', 'Finished chapter six. That ending was wild.', 'No spoilers here, but the next chapter is even better 📚'],
  ['playlist', 'Added a few songs to the road trip playlist 🎶', 'The last track is now stuck in my head, excellent choice.'],
  ['birthday', 'Reminder: surprise cake pickup is at 6:30 🎂', 'I will bring candles and plates. Keep it quiet 🤫'],
  ['weather', 'Rain is coming later, bring a light jacket ☔', 'Good call, I nearly left without one.'],
]
const reactions = [
  '😂😂', 'This is so us 😅', 'Agreed!', 'On my way 🏃', 'Perfect, see you there 👋',
  'Adding it to the list ✅', 'Wait, what happened after that?', 'Sending the details now.',
  'That made my day 💛', 'I can bring extra!', 'Noted 👍', 'We should make this a tradition.',
  'The group has spoken 🗳️', 'I vote yes 🙋', 'Deal 🤝', 'Thanks for sorting this out!',
]
const media = [
  'image omitted', 'video omitted', 'audio omitted', 'sticker omitted',
  'document omitted', 'location omitted',
]
const places = [
  'the station', 'the park entrance', 'the corner cafe', 'the library',
  'the market', 'the bakery', 'the footbridge', 'the food trucks',
  'the picnic tables', 'the metro exit', 'the bookshop', 'the river path',
]
const snacks = [
  'sourdough', 'ginger cookies', 'grapes', 'pretzels', 'brownies',
  'sparkling water', 'clementines', 'iced coffee', 'popcorn', 'lemon cake',
]
const followUps = [
  () => `Could someone save me a spot near ${pick(places)}?`,
  () => `I'll bring ${pick(snacks)} if we still need snacks.`,
  () => `I'm free after ${between(5, 9)}. Does that work for everyone?`,
  () => `I can pick up ${pick(snacks)} on my way past ${pick(places)}.`,
  () => `It takes me about ${between(5, 45)} minutes to get to ${pick(places)}.`,
  () => `If we're still deciding, ${pick(places)} has my vote 👍`,
  () => `I have enough ${pick(snacks)} for ${between(3, 8)} people.`,
  () => `Just checked. There are ${between(2, 9)} spots left.`,
  () => `Give me ${between(2, 20)} minutes and I'll send an update.`,
  () => `Anyone heading over from ${pick(places)} around ${between(5, 9)}?`,
  () => `Good news, there's still ${pick(snacks)} in the kitchen.`,
  () => `Wait, did we say ${pick(places)} or ${pick(places)}? 😅`,
]

// Seeded PRNG keeps the checked-in export reproducible across machines.
let seed = 0x85a14c19
function between(min, max) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return min + Math.floor((seed / 2 ** 32) * (max - min + 1))
}

function pick(items) {
  return items[between(0, items.length - 1)]
}

function pad(number) {
  return String(number).padStart(2, '0')
}

function weightedMember() {
  return pick(members.slice(0, between(2, members.length + 2)))
}

const dailyWeights = Array.from({ length: DAYS }, (_, day) => {
  const date = new Date(START + day * DAY_MS)
  const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6
  if (between(1, 18) === 1) return 0

  return between(6, 35) + (weekend ? 12 : 0) + (day % 29 === 0 ? 35 : 0)
})
const totalWeight = dailyWeights.reduce((sum, weight) => sum + weight, 0)
const lines = []
let cumulativeWeight = 0

for (const [day, weight] of dailyWeights.entries()) {
  if (weight === 0) continue

  cumulativeWeight += weight
  const target = Math.floor((cumulativeWeight * TARGET_MESSAGES) / totalWeight)
  const date = new Date(START + day * DAY_MS)
  const dateText = `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`
  const messages = []

  while (lines.length + messages.length < target) {
    const remaining = target - lines.length - messages.length
    const size = Math.min(remaining, between(3, 10))
    const [topic, opener, reply] = pick(topics)
    const bodies = [opener, reply]
    let minute = 60 * pick([0, 7, 8, 11, 12, 15, 17, 18, 18, 19, 19, 20, 20, 21, 22]) + between(0, 35)

    for (let index = 0; index < size; index += 1) {
      const sender = weightedMember()
      let body = bodies[index]
      if (body === undefined) {
        const roll = between(1, 20)
        if (roll === 1) body = pick(media)
        else if (roll < 8) body = pick(reactions)
        else if (roll === 8) body = `I'll put the ${topic} details in the group after ${between(5, 9)}.`
        else body = pick(followUps)()
      }

      messages.push({ minute, sender, body })
      minute += between(0, 4)
    }
  }

  messages.sort((left, right) => left.minute - right.minute)
  for (const { minute, sender, body } of messages) {
    const time = `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`
    lines.push(`${dateText}, ${time} - ${sender}: ${body}`)
  }
}

await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, `${lines.join('\n')}\n`, 'utf8')
console.log(`Wrote ${lines.length.toLocaleString()} synthetic messages to ${OUT}`)
