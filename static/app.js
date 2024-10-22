// Select DOM elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const audioPlayerContainer = document.getElementById('audio-player-container');
const audioPlayer = document.getElementById('audio-player');
const translationContainer = document.getElementById('translation-container');
const formattedTranslation = document.getElementById('formatted-translation');
const errorMessage = document.getElementById('error-message');

// Trigger file input when upload area is clicked
uploadArea.addEventListener('click', () => fileInput.click());

// Handle drag over event
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

// Handle drag leave event
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

// Handle file drop event
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// Handle file input change event
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
});

// Function to handle file upload
function handleFile(file) {
    // Validate file type (optional)
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/mp4', 'audio/x-m4a'];
    if (!validTypes.includes(file.type)) {
        displayError('Please upload a valid audio file (MP3, WAV, MP4, M4A).');
        return;
    }

    const formData = new FormData();
    formData.append('audio', file);

    // Update UI to indicate uploading
    uploadArea.innerHTML = '<p>Uploading and processing...</p>';

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Restore upload area
        uploadArea.innerHTML = '<p>Drag and drop an audio file here or click to select</p>';

        if (data.error) {
            displayError(`Error: ${data.error}`);
            return;
        }

        // Clear any previous errors
        clearError();

        // Set audio source
        audioPlayer.src = data.audio_url;
        audioPlayerContainer.classList.remove('hidden');

        // Display formatted translation
        translationContainer.classList.remove('hidden');
        formattedTranslation.textContent = data.formatted_translation;

        // Optional: Implement highlighting based on timings
        // Currently, timings are not implemented in the backend
    })
    .catch(err => {
        console.error(err);
        displayError('An unexpected error occurred while processing the audio.');
        // Restore upload area in case of error
        uploadArea.innerHTML = '<p>Drag and drop an audio file here or click to select</p>';
    });
}

// Function to display error messages
function displayError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    // Hide translation and audio player if visible
    translationContainer.classList.add('hidden');
    audioPlayerContainer.classList.add('hidden');
}

// Function to clear error messages
function clearError() {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
}