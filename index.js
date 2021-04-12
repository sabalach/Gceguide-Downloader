const fs = require('fs');
const puppeteer = require('puppeteer');
const download = require('download');
const chunk = (arr, size) => arr.reduce((acc, e, i) => (i % size ? acc[acc.length - 1].push(e) : acc.push([e]), acc), []);
const rawdata = fs.readFileSync('data.json');
const data = JSON.parse(rawdata);
const noOfParallelDownloads = 5;

(async () => {

  for(let j = 0; j < data.length; j++){

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(data[j].uri);

    // Wait for the results page to load and display the results.
    const resultsSelector = '#paperslist li.file a';

    // Extract the results from the page.
    const links = await page.evaluate((resultsSelector) => {
      const anchors = Array.from(document.querySelectorAll(resultsSelector));
      return anchors.map((anchor) => {
        return anchor.href;
      });
    }, resultsSelector);
    
    await browser.close();
    console.log(`Found ${links.length} files in ${data[j].folderName}`);

    const downloadList = chunk(links, noOfParallelDownloads);
    for(let i = 0; i < downloadList.length; i++){
      await Promise.all(downloadList[i].map(async url => {
        try {
          await download(url, `downloads/${data[j].folderName}`)
          console.log(`${url} complete`);
        } catch (error) {
          console.log(`${url} failed`, error);
          failedList.push(url);
        }
      }));
    }
  }

  console.log('\n');
  console.log('\n');
  console.log('\n');
  console.log('---------- All Downloads Completed-------');
  console.log('--------------- Have Fun ✌✌------------');

})();

