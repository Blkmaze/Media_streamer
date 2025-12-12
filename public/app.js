const API_BASE = '/api';
let currentFilter = 'all';
let mediaLibrary = [];

// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const libraryContainer = document.getElementById('libraryContainer');
const playerContainer = document.getElementById('playerContainer');
const playerControls = document.getElementById('playerControls');
const currentFileName = document.getElementById('currentFileName');
const currentFileInfo = document.getElementById('currentFileInfo');
const refreshBtn = document.getElementById('refreshBtn');
const filterButtons = document.querySelectorAll('.filter-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMediaLibrary();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    uploadForm.addEventListener('submit', handleUpload);
    refreshBtn.addEventListener('click', loadMediaLibrary);

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderLibrary();
        });
    });
}

// Load Media Library
async function loadMediaLibrary() {
    try {
        libraryContainer.innerHTML = '<p class="loading">Loading library...</p>';

        const response = await fetch(`${API_BASE}/media`);
        const data = await response.json();

        if (data.success) {
            mediaLibrary = data.files;
            renderLibrary();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        libraryContainer.innerHTML = `<p class="error">Error loading library: ${error.message}</p>`;
    }
}

// Render Library
function renderLibrary() {
    if (mediaLibrary.length === 0) {
        libraryContainer.innerHTML = '<div class="empty-library">No media files found. Upload some files to get started!</div>';
        return;
    }

    const filteredMedia = currentFilter === 'all'
        ? mediaLibrary
        : mediaLibrary.filter(file => file.type === currentFilter);

    if (filteredMedia.length === 0) {
        libraryContainer.innerHTML = `<div class="empty-library">No ${currentFilter} files found.</div>`;
        return;
    }

    libraryContainer.innerHTML = filteredMedia.map(file => `
        <div class="media-item" data-path="${file.path}" data-type="${file.type}">
            <div class="media-info">
                <div class="media-name">
                    <span class="media-type">${file.type.toUpperCase()}</span>
                    ${file.name}
                </div>
                <div class="media-details">
                    Size: ${formatFileSize(file.size)} | Modified: ${formatDate(file.modified)}
                </div>
            </div>
            <div class="media-actions">
                <button class="btn-play" onclick="playMedia('${file.path}', '${file.name}', '${file.type}', ${file.size})">Play</button>
                <button class="btn-delete" onclick="deleteMedia('${file.path}', event)">Delete</button>
            </div>
        </div>
    `).join('');
}

// Play Media
function playMedia(filePath, fileName, fileType, fileSize) {
    const streamUrl = `${API_BASE}/stream/${filePath}`;

    // Update UI
    document.querySelectorAll('.media-item').forEach(item => {
        item.classList.remove('playing');
    });
    document.querySelector(`[data-path="${filePath}"]`)?.classList.add('playing');

    // Create player
    const playerElement = fileType === 'video'
        ? `<video controls autoplay>
             <source src="${streamUrl}" type="${getMediaType(fileName)}">
             Your browser does not support the video tag.
           </video>`
        : `<audio controls autoplay>
             <source src="${streamUrl}" type="${getMediaType(fileName)}">
             Your browser does not support the audio tag.
           </audio>`;

    playerContainer.innerHTML = playerElement;

    // Update info
    currentFileName.textContent = fileName;
    currentFileInfo.textContent = `${fileType.toUpperCase()} | ${formatFileSize(fileSize)}`;
    playerControls.classList.remove('hidden');

    // Scroll to player
    playerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Delete Media
async function deleteMedia(filePath, event) {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/media/${filePath}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            await loadMediaLibrary();

            // Clear player if deleted file was playing
            const currentPlayer = playerContainer.querySelector('video, audio');
            if (currentPlayer && currentPlayer.src.includes(filePath)) {
                playerContainer.innerHTML = '<p class="placeholder">Select a file from the library to start playing</p>';
                playerControls.classList.add('hidden');
            }
        } else {
            alert('Error deleting file: ' + data.error);
        }
    } catch (error) {
        alert('Error deleting file: ' + error.message);
    }
}

// Handle Upload
async function handleUpload(e) {
    e.preventDefault();

    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);

    uploadProgress.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressText.textContent = 'Uploading...';

    try {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressFill.style.width = percentComplete + '%';
                progressText.textContent = `Uploading: ${Math.round(percentComplete)}%`;
            }
        });

        xhr.addEventListener('load', async () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                if (data.success) {
                    progressText.textContent = 'Upload complete!';
                    fileInput.value = '';
                    await loadMediaLibrary();
                    setTimeout(() => {
                        uploadProgress.classList.add('hidden');
                    }, 2000);
                } else {
                    throw new Error(data.error);
                }
            } else {
                throw new Error('Upload failed');
            }
        });

        xhr.addEventListener('error', () => {
            progressText.textContent = 'Upload failed!';
            setTimeout(() => {
                uploadProgress.classList.add('hidden');
            }, 3000);
        });

        xhr.open('POST', `${API_BASE}/upload`);
        xhr.send(formData);

    } catch (error) {
        alert('Upload error: ' + error.message);
        uploadProgress.classList.add('hidden');
    }
}

// Helper Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getMediaType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'avi': 'video/x-msvideo',
        'mkv': 'video/x-matroska',
        'mov': 'video/quicktime'
    };
    return types[ext] || 'video/mp4';
}
