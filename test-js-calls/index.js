const puppeteer = require('puppeteer');
const ExceHandling = require('./src/excel/readexcel');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');




(async () => {
    var excelHandling = new ExceHandling(path.resolve('sites.xlsx'),3);
    //var urls = await excelHandling.getSiteUrls();
    var urls = ["https://www.dove.com/in/home.html"];
    var set = new Set();
    for (let index = 0; index < urls.length; index++) {
        var siteType = await getSiteType(urls[index], puppeteer);
        await set.add(siteType);
        console.log(`${urls[index]} : ${siteType}`);
    }

    console.log(set)


})();







async function getSiteType(url, puppeteer) {
    console.log(`launching ${url}`);
    const browser = await puppeteer.launch(
        {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            ignoreHTTPSErrors: false,
            headless: true
        });
    const page = await browser.newPage();
    page.once('load', () => {
        console.log('page loaded');
        //browser.close();
    });

    let uniqueValSet = new Set();
    page.on('request', interceptedRequest => {
        if (interceptedRequest.url().indexOf('www.google-analytics.com/collect')>=0){
            console.log(interceptedRequest.url());
            let url = interceptedRequest.url();
            let abc = getParameterByName('tid',url);
            console.log(abc);
            uniqueValSet.push(abc) ; 
            interceptedRequest.continue();                        
        }
        else
          interceptedRequest.continue();
      });
    
    await page.setRequestInterception(true);
    await page.goto(url);

    let siteType = await page.evaluate(() => {
        let siteType = null;
        if (typeof UDM != 'undefined') {
            siteType = UDM.sitetype;
        } else {
            console.log('UDM is undefined');
        }
        return siteType;
    }
    );
    await browser.close();
    return siteType;
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
