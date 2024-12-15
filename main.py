#!/usr/bin/python
# Simple script to scrape URLs from Wayback Machine

import requests
import csv
import os
import sys
from urllib.parse import urlparse

# Wayback API endpoint
wayback_api = "https://web.archive.org/cdx/search/cdx?url="

# Function to extract domain name from URL
def get_domain_from_url(website_url):
    parsed_url = urlparse(website_url)
    domain = parsed_url.netloc
    # Remove www. if it exists
    domain = domain.replace("www.", "")
    return domain

# Get inputs from GitHub Actions environment variables
website_url = os.getenv('INPUT_WEBSITE_URL')
from_date = os.getenv('INPUT_FROM_DATE')
to_date = os.getenv('INPUT_TO_DATE')

# Validate inputs
if website_url is None or from_date is None or to_date is None:
    print("Error: Missing input parameters.")
    print("Please set INPUT_WEBSITE_URL, INPUT_FROM_DATE, and INPUT_TO_DATE.")
    sys.exit(1)

# Extract domain name for filename
domain_name = get_domain_from_url(website_url)

# Construct full URL for Wayback Machine API
wayback_date = f"&from={from_date}&to={to_date}&gzip=false"
full_url = wayback_api + website_url + '/*' + wayback_date
response = requests.get(full_url)

# Process the response (CSV format from Wayback)
if response.status_code == 200:
    # Parse CSV from response content
    lines = response.text.splitlines()
    csv_reader = csv.reader(lines)
    next(csv_reader)  # Skip header row

    # Prepare the CSV file to store the results, named by domain name
    csv_filename = f"wayback_links_{domain_name}.csv"
    with open(csv_filename, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['URL'])  # Write header
        for row in csv_reader:
            url = row[0]  # The first column is the URL
            # Only keep the URL path (after the domain)
            if website_url in url:
                path = url.split(website_url)[-1]
                writer.writerow([path])

    print(f"CSV file '{csv_filename}' created with extracted links.")
else:
    print(f"Error: Unable to fetch data from Wayback Machine. Status code: {response.status_code}")
