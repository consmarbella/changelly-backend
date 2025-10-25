const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const API_PUBLIC_KEY = 'cf78349b4c615368149cb03f46c7b79b54e3ef1174f8170c7e89061bccaedba2';
const API_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDkgKNOKohjAsrV
qWgdm2LxgVGJaxGw5csibJqFVUuHOPC9TqCdlVLsVmvXzSRJugTmB878S6hRMqOo
rx9YotOMgTP/siQ7uAOT5JmlP8pkXBj9509MKSBXJ/HnAuYs55UJCJPRo2v1mKhZ
UXGuRn7GZ3kw6h7Pb+HoyTDwN8RhXLnISvaQiwW5kEnzXFz10tfGMrruxwYIv7nT
YLrtUUQ5tW/ACjBGISpaD cE1egQTmes1pXTQVuNDT1yaqzGmsnTmebR8lakfIwII
tfChGdMmcw6n31NM3l/vnBPb9ROk8zNsPqDeRBE0Mqf/FjnL45cfqLJOisT18SPl
Ap0cW5g5AgMBAAECggEAHT24/Y/D1FJ50nh+B7aS0C+prNmJcgcgxPmmQdnLHeAo
2TuZTOaHA2eBICSduDGYiYyw7ZMLqcMT3nT1S0p1oqKwx3qXLcKRR/kWZbyRZzZs
nFFgJxw8NJW6scKqjKSLaz8wa2trrV9+a6+tyeI2PFLm115JLb02PlaWGfzeTKHA
g9l8lfuHEOfX1KPzzVBGwzErkKh6XiGrcfhJcpS9yCEoH7au1jKIcIdqFU4qCq7m
zdNoC1pO0bj7F1t+eqNryxxeeLtrBN4p3qccWK0dmDKJiAlKt/2L2m1121WUuwy7
LguJeXjya1trUv7u/N9dtlsK6FjM4meieup5ZM7a4QKBgQD3qc+xyxbyADwoDMm/
gKWdWAwzGJlYoteQE0Uj0OBx7OGbZwEeFGjKM2T8v2fx6fKXBvxqJo7YHz7+BCTv
Fjw7GuoAKLJbtewAFT1NHHA7wblDQgZtpXoyNmLLqre8C4OalnTqLMvBKaUMJYcF
JQd7TPqTnZ2VIUfv0vy4stQOXwKBgQDsMbZFCB2j0+XlSMmLwWeMX+hhMpsREqzb
QIXf4C3mgE3Ww2EGuxR6waXB4AtqiUTKZGXKJtHobFo22tyHE/HWXs6osdibi2t3
lqV6weL B7NIpVc6OhItghG/kX3NjoI3udqvvrrW7RnKLDHI/mxtwjCpgrwXFwFYG
+pd3CKgwZwKBgF1Mooq3GIjIX+EymBpFq55v2gCxxqsmhZCoQcaxXKxucbtqfXhI
dgWegO/aZ50x5grRPev7ZJq0grWM+CD9vmkBxZ+TtUVpbmPFnJdbzS+EVneo+uT5
juQ1qthREvCLYeOtxJOnlobJWn0N8iSVA5GGuWs82G2i4QfO8xfdfpd/AoGAG/TC
WydbwsFY66uS12zb4byUV7TSr9GjDgx0DAyPwkGbdPkJKe/Iu8Lh6LGpCEIZF0+M
0MGJhNYWU3nSMlbFABeWpFbwiWRG2w/EpGQAf+2U7nmOikXb7V+fkstNcBRX2ErJ
jQQD1JfBBP5DI44rUEX22hy9NSvPwuG0Pc2Tgq8CgYAPijH0f/ZkHnv0pJiDdTQQ
PAnsDirjahnS6s2Jt2F8dvkIuzTR+5ZPKRVYUVKSNOyey4NVzdfJ1LyPRmVspx4N
sSyPOMiqvV30tqDAuY7IfcT4oIPTMp3Xn1wZQN4jQqT4YoeGC+Bu5XSiouKu4jRI
NtDJe3qIg5uoWrctCOG9Cw==
-----END PRIVATE KEY-----`;

const privateKeyObject = crypto.createPrivateKey({
  key: API_PRIVATE_KEY,
  type: 'pkcs8',
  format: 'pem'
});

app.post('/api/changelly', async (req, res) => {
  try {
    const { fiatCurrency, cryptoCurrency, amount } = req.body;
    
    // Construir URL con query parameters (GET request)
    const baseUrl = 'https://fiat-api.changelly.com/v1/offers';
    const queryParams = new URLSearchParams({
      currencyFrom: fiatCurrency,
      currencyTo: cryptoCurrency,
      amountFrom: amount,
      country: 'US',
      state: 'CA'
    });
    
    const path = `${baseUrl}?${queryParams.toString()}`;
    
    // Para GET requests, el message debe estar vacío
    const message = {};
    
    const payload = path + JSON.stringify(message);
    const signature = crypto.sign('sha256', Buffer.from(payload), privateKeyObject).toString('base64');
    
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(path, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_PUBLIC_KEY,
        'X-Api-Signature': signature
      }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
