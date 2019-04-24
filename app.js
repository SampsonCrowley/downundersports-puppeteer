const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const port = process.env.PORT || 5000;
const validUrl = require('valid-url');

var parseUrl = function(url) {
    url = decodeURIComponent(url)
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = 'http://' + url;
    }

    return url;
};

app.get('/render', function(req, res) {
  console.log(req.query.url)
  var urlToRender = parseUrl(req.query.url);

  if (validUrl.isWebUri(urlToRender)) {
    console.log('Screenshotting: ' + urlToRender);
    (async() => {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      try {

        const page = await browser.newPage();
        await page.goto(urlToRender);
        const buffer = await page.evaluate(() => '<!DOCTYPE HTML>\n' + document.documentElement.outerHTML)

        res.setHeader('Content-Disposition', 'attachment;filename="' + urlToRender + '.html"');
        res.setHeader('Content-Type', 'text/html');

        await res.send(buffer)

        await browser.close();
      } catch (err) {
        res.status(422).send(err.stack)
        try { await browser.close() } catch {}
      }
    })();
  } else {
    res.status(500).send('Invalid url: ' + urlToRender);
  }

});
app.get('/', function(req, res) {
  res.send("To render a page, make request in the form /render?url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dtest");
});

app.listen(port, function() {
    console.log('App listening on port ' + port)
})
