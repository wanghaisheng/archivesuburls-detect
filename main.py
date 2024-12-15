#!/usr/bin/python
# Simple script to scrape URLs from Wayback Machine

import requests
import csv
import sys

# Wayback API endpoint
wayback_api = "https://web.archive.org/cdx/search/cdx?url="

# Check if arguments are provided
if len(sys.argv) > 1:
    website_url = str(sys.argv[1])
    
    if len(sys.argv) > 3:
        # Date range parameters
        wayback_date = "&from=" + str(sys.argv[2]) + "&to=" + str(sys.argv[3]) + "&gzip=false"
    else:
        print("Error: Missing DATE-FROM and DATE-TO")
        print("Example: ./wayback.py www.google.com 2020 2023")
        sys.exit(1)
    
    print("NOTICE: This might take a while.. Go grab a coffee!!")
    
    # Construct full URL for Wayback Machine API
    full_url = wayback_api + website_url + '/*' + wayback_date
    response = requests.get(full_url)
    
    # Process the response (CSV format from Wayback)
    if response.status_code == 200:
        # Parse CSV from response content
        lines = response.text.splitlines()
        csv_reader = csv.reader(lines)
        next(csv_reader)  # Skip header row
        
        # Prepare the CSV file to store the results
        csv_filename = "wayback_links.csv"
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
else:
    print("Error: Invalid usage....")
    print("Example usage: ./wayback.py www.google.com 2020 2023")
