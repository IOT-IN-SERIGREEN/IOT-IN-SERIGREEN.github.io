document.addEventListener('DOMContentLoaded', function() {
    let lastStates = [];
    let isRequestInProgress = false;

    async function updateToggleStates() {
        const toggles = document.querySelectorAll('input[type="checkbox"]');
        let states = [];

        toggles.forEach((toggle, index) => {
            states.push(`RELAY${index + 1}=${toggle.checked ? 1 : 0}`);
        });

        const body = `SMART_RELAY ${states.join(',')}`;

        console.log('POST body:', body);

        try {
            const response = await fetch('https://us-east-1-1.aws.cloud2.influxdata.com/api/v2/write?org=3291e74de80ecb17&bucket=SERIAUTOMATE', {
                method: 'POST',
                headers: {
                    'Authorization': 'Token QJFg6PSmmX2QXqqpTNAbnDkp7CkzZHXy_04mNfXYGnf1hjHJLIPSup2WeE5u5hwYjREBOtLvAak1bjzWj6fohw==',
                    'Content-Type': 'text/plain'
                },
                body: body
            });

            if (response.ok) {
                console.log('Toggle state request successful');
            } else {
                console.error('Toggle state request failed:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Error posting toggle states:', error);
        }
    }

    async function queryInfluxDB() {
        if (isRequestInProgress) return;

        isRequestInProgress = true;

        try {
            const response = await fetch('https://us-east-1-1.aws.cloud2.influxdata.com/api/v2/query', {
                method: 'POST',
                headers: {
                    'Authorization': 'Token QJFg6PSmmX2QXqqpTNAbnDkp7CkzZHXy_04mNfXYGnf1hjHJLIPSup2WeE5u5hwYjREBOtLvAak1bjzWj6fohw==',
                    'Content-Type': 'application/vnd.flux'
                },
                body: 'from(bucket:"SERIAUTOMATE")|>range(start:-2m)|>filter(fn:(r)=>r._measurement=="SMART_RELAY")|>last()'
            });

            if (response.ok) {
                const responseText = await response.text();
                console.log('InfluxDB query response:', responseText);

                // Parse the response to extract integers between the 6th and 7th commas
                const responseLines = responseText.split('\n');
                const numbers = responseLines.map(line => {
                    const parts = line.split(',');
                    if (parts.length >= 7) {
                        const value = parts[6].trim().match(/\d+/);
                        return value ? parseInt(value[0], 10) : null;
                    }
                    return null;
                }).filter(value => value !== null);

                console.log('Extracted numbers:', numbers);

                if (numbers.length === 8) {
                    const toggles = document.querySelectorAll('input[type="checkbox"]');
                    toggles.forEach((toggle, index) => {
                        const expectedState = numbers[index] === 1;
                        if (toggle.checked !== expectedState) {
                            toggle.checked = expectedState;
                            toggle.dispatchEvent(new Event('change'));
                        }
                    });
                } else {
                    console.error('Unexpected number of elements in response:', numbers.length);
                }
            } else {
                console.error('InfluxDB query failed:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Error querying InfluxDB:', error);
        } finally {
            isRequestInProgress = false;
        }
    }

    function handleToggleChange() {
        // If a request is in progress, we do nothing
        if (isRequestInProgress) return;

        // Update the toggle states
        updateToggleStates();

        // Wait for a second and then query the InfluxDB to adjust the toggle states
        setTimeout(queryInfluxDB, 1000);
    }

    // Attach event listeners to all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleToggleChange);
    });

    // Start the periodic query
    setInterval(queryInfluxDB, 5000); // Adjust interval as needed
});
