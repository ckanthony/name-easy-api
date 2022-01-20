const express = require('express');
const bodyParser = require('body-parser');
const naming = require('./lib/naming');
var cors = require('cors');
const app = express();
const fs = require('fs/promises');
const port = 11100;

app.use(bodyParser.json())
app.use(cors());

app.get('/ping', (req, res) => {
  res.send('pong');
})

app.post('/name-easy', async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 
    await fs.appendFile('log/log.csv', `${Date.now()},${(req.body.data).replace(/\,/g, "\\,").replace(/\n/g, "\\n")},${ip}\n`);
  } catch (e) {
    console.error(e);
  }
  return next();
}, async (req, res) => {
  const mission = req.body.data;
  let results = await naming(mission)
  if (!! results && !!results.length) {
    return res.json({ data: results });
  }
  return res.json({ data: false })
})

app.listen(port, () => {
  console.log(`up and running at port ${port}`)
})
