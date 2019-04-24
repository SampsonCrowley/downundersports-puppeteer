const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const port = process.env.PORT || 8080;
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
    var urlToScreenshot = parseUrl(req.query.url);

    if (validUrl.isWebUri(urlToScreenshot)) {
        console.log('Screenshotting: ' + urlToScreenshot);
        (async() => {
            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.goto(urlToScreenshot);
            await page.evaluate(() => '<!DOCTYPE HTML>\n' + document.documentElement.outerHTML).then(function(buffer) {
                res.setHeader('Content-Disposition', 'attachment;filename="' + urlToScreenshot + '.html"');
                res.setHeader('Content-Type', 'text/html');
                res.send(buffer)
            });

            await browser.close();
        })();
    } else {
        res.send('Invalid url: ' + urlToScreenshot);
    }

});
app.get('/', function(req, res) {
  res.send("To render a page, make request in the form /render?url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dtest");
});

app.listen(port, function() {
    console.log('App listening on port ' + port)
})
