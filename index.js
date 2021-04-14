const { join } = require('path')
const { tmpdir } = require('os')
const puppeteer = require('puppeteer')
const download = require('download')
const prompt = require('prompt')
// eslint-disable-next-line no-sequences
const chunk = (arr, size) => arr.reduce((acc, e, i) => (i % size ? acc[acc.length - 1].push(e) : acc.push([e]), acc), [])
const data = []
const noOfParallelDownloads = 5
const colors = require('colors/safe')
const cliProgress = require('cli-progress')
const failedList = []
const tmpPath = tmpdir()
const chromePath = join(tmpPath, '.local-chromium')

prompt.start()

prompt.message = colors.gray('» ')

console.clear()

console.log(colors.brightWhite.bold.bgRed('├─────── GCEGUIDE DOWNLOADER - By sabster ────────┤')) // Drops the bass
console.log('')
console.log(colors.brightCyan('Enter folder name and url. Once you are done press enter without typing anything.')); // Drops the bass

(async () => {
  while (true) {
    console.log('')
    const { folderName } = await prompt.get({
      properties: {
        folderName: {
          description: colors.magenta('Folder Name')
        }
      }
    })
    if (!folderName) {
      console.clear()
      break
    }
    const { uri } = await prompt.get({
      properties: {
        uri: {
          description: colors.green('URL')
        }
      }
    })

    if (!uri) {
      console.clear()
      break
    }
    data.push({
      folderName,
      uri
    })
  }

  for (let j = 0; j < data.length; j++) {
    const bar = new cliProgress.SingleBar({
      format: `${colors.brightCyan(`» ${data[j].folderName}`)} |${colors.cyan('{bar}')}| ${colors.brightWhite('{percentage}% | {value}/{total} Files')}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })

    const chromiumBar = new cliProgress.SingleBar({
      format: 'Downloading Chromium (This is One time process) [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
    })
    let chromiumTotalBytes = 0

    const browserFetcher = puppeteer.createBrowserFetcher({
      path: chromePath
    })
    const revisionInfo = await browserFetcher.download('856626', function (downloadedBytes, totalBytes) {
      if (chromiumTotalBytes === 0) {
        chromiumTotalBytes = totalBytes
        chromiumBar.start(totalBytes, 0)
      } else {
        chromiumBar.update(downloadedBytes)
      }
    })

    // create browser
    const browser = await puppeteer.launch({
      // headless: false,
      executablePath: revisionInfo.executablePath
    })

    const page = await browser.newPage()

    await page.goto(data[j].uri)

    // Wait for the results page to load and display the results.
    const resultsSelector = '#paperslist li.file a'

    // Extract the results from the page.
    const links = await page.evaluate((resultsSelector) => {
      const anchors = Array.from(document.querySelectorAll(resultsSelector))
      return anchors.map((anchor) => {
        return anchor.href
      })
    }, resultsSelector)

    await browser.close()

    bar.start(links.length, 0)

    const downloadList = chunk(links, noOfParallelDownloads)
    for (let i = 0; i < downloadList.length; i++) {
      await Promise.all(downloadList[i].map(async url => {
        try {
          await download(url, `downloads/${data[j].folderName}`)
          bar.increment()
        } catch (error) {
          failedList.push(url)
        }
      }))
    }
    bar.stop()
    console.log('')
  }

  console.log('')
  console.log('      ' + colors.brightWhite.bgGreen(' ┌───────────────────────────────────────┐ '))
  console.log('      ' + colors.brightWhite.bgGreen(' │        All Downloads Completed        │ '))
  console.log('      ' + colors.brightWhite.bgGreen(' │               Have Fun!!              │ '))
  console.log('      ' + colors.brightWhite.bgGreen(' └───────────────────────────────────────┘ '))
})()
