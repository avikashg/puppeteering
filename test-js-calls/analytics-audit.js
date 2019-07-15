const puppeteer = require('puppeteer');
const ExceHandling = require('./src/excel/readexcel');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');




(async () => {
    var excelHandling = new ExceHandling(path.resolve('auditSites.xlsx'), 0);
    //var urls = await excelHandling.getSiteUrls();
    var urls = ["http://calcmenuservice.unileverservices.com","br.recepedia.com"];
    var set = new Set();
    var map = new Map();
    for (let index = 0; index < urls.length; index++) {
        let currentUrl = urls[index];
        var trackidSet = await getTrackId(currentUrl, puppeteer);
        //console.log( currentUrl + " " + trackidSet);
        map.set(currentUrl, trackidSet);
    }
    console.log(map)
})();


async function getTrackId(url, puppeteer) {    
    console.log(`launching ${url}`);
    const browser = await puppeteer.launch(
        {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            ignoreHTTPSErrors: false,
            headless: false
        });
    const page = await browser.newPage();
    var existingUrl = null;
    page.once('load', () => {
        console.log('page loaded');
        existingUrl = page.url();
    });

    let uniqueValSet = new Set();
    page.on('request', interceptedRequest => {
        if (interceptedRequest.url().indexOf('www.google-analytics.com') >= 0) {
            //console.log(interceptedRequest.url());
            let url = interceptedRequest.url();
            let abc = getParameterByName('tid', url);
            console.log(abc);
            uniqueValSet.add(abc);
            interceptedRequest.continue();
        }
        else
            interceptedRequest.continue();
    });

    await page.setRequestInterception(true);

    try {
        await launchUrl(page, url);            
    } catch (error) {
        console.log(error);
        return {};
    }


    await handleCookiePopUps(page);

    await browser.close();
    return {
        'origUrl': url,
        'redirectUrl': existingUrl,
        'trackingIds': Array.from(uniqueValSet).join(',')
    };
}

async function launchUrl(page, url) {
    if (await url.indexOf('http') < 0) {
        url = 'http://' + url;
    }
    await page.goto(url, {
        //timeout:30000,
        waitUntil: 'networkidle0',
    }).catch(async () => {
        console.log(`error in launching ${url}`);
        await browser.close().catch(()=>{});
        return {};
    });
}


async function handleCookiePopUps(page) {
    if (await page.$('#_evidon-banner-acceptbutton') != null) {
        await page.click('#_evidon-banner-acceptbutton');
        await page.waitForNavigation({waitUntil:'load'}).catch((err)=>console.log(err));
    } else {
        var frames = await page.frames();
        var cookiePolicyFrame = await frames.find(f => f.url().indexOf("cookiepolicy") > 0);
        if (typeof (cookiePolicyFrame) != 'undefined') {
            console.log('inside frame');
            await cookiePolicyFrame.$x("//*[@class='closeButton acceptButton']/span | //a[contains(@href,'accepted')]")
                .then(async (elem) => {
                    await elem[0].click();
                })
                .catch(() => {
                    console.log('unable to click accept button in frame');
                });
            await page.reload().catch((err)=>console.log(err));
            await page.waitForNavigation({waitUntil:'load'}).catch((err)=>console.log(err));
        }
    }
}


async function getBatches(urlsToTest) {
    try {
        //logger.log(urlsToTest);
        let urlsPerThread = Math.ceil(urlsToTest.length / config.parallelthread);
        logger.log(`Items per Thread: ${urlsPerThread}`);

        let batches = [];
        let batch;
        let batchCount = 1;//
        for (let i = 0; i < urlsToTest.length; i += urlsPerThread) {
            batch = urlsToTest.slice(i, i + urlsPerThread);
            batches.push(batch);
            logger.log(`Batch ${batchCount} is ${batch.length} item(s)`);
            batchCount++;
        }
        return batches;
    } catch (err) {
        logger.error(err);
        return [];
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
