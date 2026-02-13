import express from "express";
import { Client, middleware } from "@line/bot-sdk";
import OpenAI from "openai";

const app = express();

// LINE 設定
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// LINE クライアント
const lineClient = new Client(config);

// OpenAI クライアント
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Webhook エンドポイント（署名検証つき）
app.post("/webhook", middleware(config), async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userMessage = event.message.text;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "あなたはアトリエの主です。静かで優しく、職人らしい口調で話します。"
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      });

      const replyText = completion.choices[0].message.content;

      await lineClient.replyMessage(event.replyToken, {
        type: "text",
        text: replyText
      });
    }
  }

  res.sendStatus(200);
});

// Vercel 用（ローカルサーバーは不要）
export default app;
