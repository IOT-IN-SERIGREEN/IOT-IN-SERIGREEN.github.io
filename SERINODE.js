// Function to fetch data and update the page
async function fetchData() {
    try {
        // Define the request options for fetching data
        const response = await fetch('https://us-east-1-1.aws.cloud2.influxdata.com/api/v2/query', {
            method: 'POST',
            headers: {
                'Authorization': 'Token QJFg6PSmmX2QXqqpTNAbnDkp7CkzZHXy_04mNfXYGnf1hjHJLIPSup2WeE5u5hwYjREBOtLvAak1bjzWj6fohw==',
                'Content-Type': 'application/vnd.flux',
            },
            body: `
                from(bucket: "SERINODE")
                |> range(start: -2m)
                |> last()
            `
        });

        // Check if the response is OK
        if (response.ok) {
            const text = await response.text();

            // Print the raw response text
            console.log('Raw Response:', text);

            // Split the response into lines
            const lines = text.split('\n');

            // Initialize an array to store values
            const extractedValues = [];

            // Extract the values from each line
            lines.forEach((line, index) => {
                // Skip the header row (index 0) and empty lines
                if (index > 0 && line.trim() !== '') {
                    const values = line.split(','); // Split line into values
                    if (values.length > 6) { // Ensure there are enough values
                        const value = values[6].trim(); // Extract the 7th value and trim any extra spaces
                        extractedValues.push(value); // Add the value to the array
                    }
                }
            });

            // Print the array of extracted values
            console.log('Extracted Values:', extractedValues);

            // Update the text content of the HTML elements based on extracted values
            if (extractedValues.length >= 5) {
                document.getElementById('co2').textContent = `${extractedValues[0]} ppm`;
                document.getElementById('humidity').textContent = `${extractedValues[1]}%`;
                document.getElementById('light').textContent = `${extractedValues[2]} lux`;
                document.getElementById('o2').textContent = `${extractedValues[3]} vol%`;
                document.getElementById('temperature').textContent = `${extractedValues[4]}°C`;
            }
        } else {
            console.error('Error fetching data:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to send a POST request (not used in the current setup but can be adapted if needed)
async function sendPostRequest() {
    try {
        const response = await fetch('https://us-east-1-1.aws.cloud2.influxdata.com/api/v2/query', {
            method: 'POST',
            headers: {
                'Authorization': 'Token QJFg6PSmmX2QXqqpTNAbnDkp7CkzZHXy_04mNfXYGnf1hjHJLIPSup2WeE5u5hwYjREBOtLvAak1bjzWj6fohw==',
                'Content-Type': 'application/vnd.flux',
            },
            body: `
                from(bucket: "SERINODE")
                |> range(start: -10m)
                |> last()
            `
        });

        if (response.ok) {
            const text = await response.text();
            console.log('Post Request Response:', text);
        } else {
            console.error('Error sending post request:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Initial data fetch on page load
fetchData();

// Set interval to fetch and update data every 5 minutes (300000 milliseconds)
setInterval(fetchData, 300000); // 300000 milliseconds = 5 minutes
