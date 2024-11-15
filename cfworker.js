addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Get query parameters from the URL
  const domain = url.searchParams.get("domain")
  const option = url.searchParams.get("option") || "0" // Default to 0 (URLs and subdomains)
  const timeout = parseInt(url.searchParams.get("timeout")) || 600 // Default to 600 seconds if not provided
  
  if (!domain) {
    return new Response("Domain is required", { status: 400 })
  }

  // Wayback Machine API URL
  const apiUrl = `http://web.archive.org/cdx/search/cdx?url=*.${domain}/*&output=text&fl=original&collapse=urlkey`

  // Create an AbortController to handle the timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout * 1000) // Timeout in milliseconds

  try {
    // Fetch data from Wayback Machine with timeout handling
    const response = await fetch(apiUrl, { signal: controller.signal })
    const data = await response.text()

    const urls = data.split("\n").filter(line => line.length > 0)
    const subdomains = new Set()

    // Extract subdomains from the URLs
    urls.forEach(url => {
      const match = url.match(/https?:\/\/([^/]+)/)
      if (match && match[1]) {
        subdomains.add(match[1])
      }
    })

    // Prepare the result based on the option
    let result = ""
    if (option === "0") {
      // Both URLs and Subdomains
      result += "URLs\n" + urls.join("\n") + "\n\n"
      result += "Subdomains\n" + Array.from(subdomains).join("\n")
    } else if (option === "1") {
      // URLs only
      result += "URLs\n" + urls.join("\n")
    } else if (option === "2") {
      // Subdomains only
      result += "Subdomains\n" + Array.from(subdomains).join("\n")
    }

    // Convert the result to CSV format
    const csvData = convertToCSV(result)

    // Return the CSV as a response
    return new Response(csvData, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${domain}-wayback-result.csv"`
      }
    })
  } catch (error) {
    if (error.name === "AbortError") {
      return new Response("The request timed out after the specified time limit.", { status: 408 })
    } else {
      console.error("Error occurred:", error)
      return new Response("An error occurred while fetching data.", { status: 500 })
    }
  } finally {
    clearTimeout(timeoutId) // Clear the timeout
  }
}

// Function to convert the data to CSV format
function convertToCSV(data) {
  // Escape any commas inside the text
  const rows = data.split("\n").map(row => {
    return row.split(",").map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")
  })
  return rows.join("\n")
}
