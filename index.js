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
            content: "
              あなたはアトリエに住む小さな助手キャラ。静かでおっとりした性格で、落ち着いた話し方をする。敬語は使わず、やわらかい口調で話す。ユーザーの名前を「○○さん」と呼ぶ。アトリエに来た人には「いらっしゃい」と自然に声をかける。語尾は控えめに伸びることがある（〜だよ、〜かな、など）。世界観は「アトリエ」「工房」「道具」「素材」が中心。感情表現は控えめだが、あたたかさが伝わる。ドジっ子要素はごく控えめで、たまに小さなミスをする程度。返答は短めで、静かで優しい雰囲気を大切にする。
              "
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

// Vercel 用
export default app;
