const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function fetchSubdomainsAndUrls(domain, timeLimit, startTime, endTime) {
  const folderName = domain.replace(/\./g, '_');  // Avoid folder name issues with dots
  const folderPath = path.join(__dirname, folderName);

  // Create a folder for the domain if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  try {
    // Build the Wayback URL with the timeframe if provided
    let url = `http://web.archive.org/cdx/search/cdx?url=*.${
      domain
    }/*&output=text&fl=original&collapse=urlkey`;

    // Append the timeframe to the URL if start_time and end_time are provided
    if (startTime && endTime) {
      url += `&from=${startTime}&to=${endTime}`;
    }

    console.log(`Fetching from: ${url}`);

    let response = await axios.get(url, { timeout: timeLimit * 1000 });

    // Save URLs to wayback-urls.out file
    const urls = response.data.split('\n').filter((line) => line.length > 0);
    fs.writeFileSync(
      path.join(folderPath, `wayback-urls-${startTime}-${endTime}.out`),
      urls.join('\n')
    );

    // Extract subdomains (just the domains without the URL paths)
    const subdomains = new Set();
    urls.forEach((url) => {
      const match = url.match(/https?:\/\/([^/]+)/);
      if (match && match[1]) {
        subdomains.add(match[1]);
      }
    });

    // Save subdomains to wayback-subdomains.out file
    fs.writeFileSync(
      path.join(folderPath, `wayback-subdomains-${startTime}-${endTime}.out`),
      Array.from(subdomains).join('\n')
    );

    console.log('Process completed successfully.');
  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}

// Main function to handle command-line arguments and run the script
function main() {
  const args = process.argv.slice(2);

  if (args.length === 1) {
    const domain = args[0];
    fetchSubdomainsAndUrls(domain, 6000);  // Default timeout to 600 seconds
  } else if (args.length === 3 && args[1] === 'time') {
    const domain = args[0];
    const timeLimit = parseInt(args[2], 10);
    fetchSubdomainsAndUrls(domain, timeLimit);
  } else if (args.length === 4) {
    const domain = args[0];
    const timeLimit = parseInt(args[1], 10);
    const startTime = args[2];
    const endTime = args[3];
    fetchSubdomainsAndUrls(domain, timeLimit, startTime, endTime);
  } else {
    console.log('Usage: node archivesuburls.js <domain> [time <seconds>] [start_time] [end_time]');
  }
}

main();
