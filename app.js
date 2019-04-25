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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForQueue(page) {
  return new Promise(async (resolve) => {
    let queue = true
    while (queue) {
      queue = await page.evaluate(() => {
        try {
          return window.currentFetchQueue.queue.length
        } catch {
          return false
        }
      })
      if(queue) await sleep(1000)
    }

    return resolve()
  })
}

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
        await page.goto(urlToRender, { waitUntil: ['networkidle0', 'load', 'domcontentloaded'] });

        await waitForQueue(page)

        const buffer    = await page.evaluate(() => '<!DOCTYPE HTML>\n' + document.documentElement.outerHTML),
              subWindow = await page.evaluate(() => window.ssrHydrationParams);

        console.log(subWindow)


        res.setHeader('Content-Disposition', 'attachment;filename="' + urlToRender + '.html"');
        res.setHeader('Content-Type', 'text/html');

        await res.send(buffer.replace(/<body([^>]*)>/, '$&<div id="ssr-hydration-params" style="display:none">' + JSON.stringify(subWindow) + '</div>'))

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
