const apigClient = apigClientFactory.newClient();

// Function to search for photos
function searchPhotos() {
    const query = document.getElementById('search-query').value;
    if (!query) {
        alert('Please enter a search term.');
        return;
    }

    // Make GET /search request
    apigClient.searchGet({ q: query })
        .then(response => {
            const resultsDiv = document.getElementById('search-results');
            resultsDiv.innerHTML = '';

            if (response.data.data && response.data.data.length > 0) {
                response.data.data.forEach(photoUrl => {
                    const img = document.createElement('img');
                    img.src = photoUrl;
                    resultsDiv.appendChild(img);
                });
            } else {
                resultsDiv.innerHTML = '<p>No photos found :(</p>';
            }
        })
        .catch(error => {
            console.error('Error searching photos:', error);
            alert('An error occurred while searching for photos.');
        });
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      // reader.onload = () => resolve(reader.result)
      reader.onload = () => {
        let encoded = reader.result.replace(/^data:(.*;base64,)?/, '');
        if (encoded.length % 4 > 0) {
          encoded += '='.repeat(4 - (encoded.length % 4));
        }
        resolve(encoded);
      };
      reader.onerror = (error) => reject(error);
    });
}


// Function to upload a new photo
function uploadPhoto(event) {
    event.preventDefault();

    console.log(`Event: ${event}`)

    const fileInput = document.getElementById('photo-file');
    const customLabelsInput = document.getElementById('custom-labels');
    const file = fileInput.files[0];

    console.log(`File Details: ${file.name}`)

    if (!file) {
        alert('Please select a photo to upload.');
        return;
    }

    // Create a comma-separated list of custom labels
    const customLabels = customLabelsInput.value.split(',').map(label => label.trim()).join(',');

    // Define S3 bucket and key (you might want to dynamically assign the key based on the filename or a UUID)
    const bucket = 'photos-assignment3';
    const key = file.name;

    // Prepare the headers and body for the PUT request
    const headers = {
        'Content-Type': file.type,
        'customLabels': customLabels,
        'Access-Control-Allow-Origin': '*',
    };

    console.log(headers)

    const params = {
        bucket: bucket,
        key: key,
    };

    console.log(params)

    const reader = new FileReader();
    reader.onload = function(event) {
        // Convert ArrayBuffer to Uint8Array for binary upload
        const arrayBuffer = event.target.result;
        const binaryData = new Uint8Array(arrayBuffer);

        console.log(binaryData);

        // Make PUT /upload/{bucket}/{key} request with binary data
        apigClient.uploadBucketKeyPut(params, binaryData, { headers: headers })
            .then(response => {
                console.log(response);
                alert('Photo uploaded successfully!');
                fileInput.value = '';
                customLabelsInput.value = '';
            })
            .catch(error => {
                console.error('Error uploading photo:', error);
                alert('An error occurred while uploading the photo.');
            });
    };
    reader.onerror = function(error) {
        console.error('Error reading file:', error);
        alert('Failed to read file');
    };

    // Start reading the file as ArrayBuffer
    reader.readAsArrayBuffer(file);
}
