# Chatbeat

Chatbeat turns a WhatsApp chat export into a dashboard of message activity, participant stats, and common words and emojis. It opens with a fictional group chat so you can explore the dashboard before opening your own export.

## Download and run locally

You’ll need Node.js 20.9 or newer and npm. Clone the repository and start the development server.

```sh
git clone https://github.com/mostafamones/whatsapp-recap.git
cd whatsapp-recap
npm ci
npm run dev
```

If you prefer to download the source, use **Code → Download ZIP** on GitHub, unzip it, and run `npm ci` and `npm run dev` in the extracted folder. [Download the source ZIP](https://github.com/mostafamones/whatsapp-recap/archive/refs/heads/main.zip)

Once the server starts, open [http://localhost:3000](http://localhost:3000) in your browser.

## Open your own WhatsApp chat

1. Open an individual or group chat in WhatsApp. On **Android**, open the three-dot menu and choose **More → Export chat**. On **iPhone**, tap the contact or group name and choose **Export chat**. [WhatsApp export instructions](https://faq.whatsapp.com/1180414079177245/?locale=en_US)
2. Choose **Without media** when prompted and save or transfer the export to the device running Chatbeat. If WhatsApp gives you a ZIP, extract the chat `.txt` file inside.
3. In Chatbeat, click **Open WhatsApp export** and select the `.txt` file. The dashboard will show your chat’s totals, participant activity, busiest times, and common words and emojis.
4. Refresh the page to clear the imported recap and return to the fictional chat.

## Privacy

Chatbeat reads the selected export in your browser. It sends no chat data to a server and keeps the recap in memory for the current page session. Participant labels use initials. Keep personal exports outside the repository so they stay out of Git.
