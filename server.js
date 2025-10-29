const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Load from environment
const API_PUBLIC_KEY = process.env.CHANGELLY_API_KEY;
const PEM_PATH = process.env.CHANGELLY_PRIVATE_KEY_PATH; // absolute or relative to project root

if (!API_PUBLIC_KEY || !PEM_PATH) {
  console.warn('Missing env: CHANGELLY_API_KEY or CHANGELLY_PRIVATE_KEY_PATH');
}

function getPrivateKey() {
  try {
    const p = path.isAbsolute(PEM_PATH) ? PEM_PATH : path.join(process.cwd(), PEM_PATH);
    const pem = fs.readFileSync(p, 'utf8');
    return crypto.createPrivateKey({ key: pem, type: 'pkcs8', format: 'pem' });
  } catch (e) {
    console.error('Failed to read private key:', e.message);
    return null;
  }
}

app.post('/api/changelly', async (req, res) => {
  try {
    const { fiatCurrency, cryptoCurrency, amount, country = 'US', state } = req.body || {};
    if (!fiatCurrency || !cryptoCurrency || !amount) {
      return res.status(400).json({ error: 'fiatCurrency, cryptoCurrency, amount are required' });
    }

    const baseUrl = 'https://fiat-api.changelly.com/v1/offers';
    const qp = new URLSearchParams({
      currencyFrom: String(fiatCurrency),
      currencyTo: String(cryptoCurrency),
      amountFrom: String(amount),
      country: String(country),
    });
    if (state) qp.set('state', String(state));

    const pathWithQuery = `${baseUrl}?${qp.toString()}`;

    // Changelly X-API-SIGNATURE = base64(sign(sha256, path + body, privateKey))
    const messageObj = {};
    const payload = pathWithQuery + JSON.stringify(messageObj);

    const keyObj = getPrivateKey();
    if (!keyObj) return res.status(500).json({ error: 'Private key not available' });

    const signature = crypto.sign('sha256', Buffer.from(payload), keyObj).toString('base64');

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(pathWithQuery, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_PUBLIC_KEY,
        'X-Api-Signature': signature,
        'Accept': 'application/json',
      },
    });

    const text = await response.text();
    if (!response.ok) {
      console.error('Changelly error', response.status, text);
      return res.status(response.status).send(text);
    }

    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }
    return res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
