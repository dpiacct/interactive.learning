import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const LINK_GENERATOR_HTML = `
    <div class="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border-t-8 border-blue-800">
        <h1 class="text-2xl font-bold text-blue-900 mb-6 text-center">Quiz Link Generator</h1>
        <div class="space-y-4">
            <!-- Attendance Dropdown -->
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Select Attendance Record</label>
                <select id="attendance-select" class="w-full p-2 border border-gray-300 rounded bg-gray-50">
                    <option value="">Loading records...</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">Fetching last 10 records from Firebase...</p>
            </div>

            <!-- Expiration Date/Time -->
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Link Expiration Date & Time</label>
                <input type="datetime-local" id="expiry-date" class="w-full p-2 border border-gray-300 rounded">
            </div>

            <!-- Duration -->
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Time Limit (Minutes)</label>
                <input type="number" id="duration-mins" value="60" class="w-full p-2 border border-gray-300 rounded">
            </div>

            <button id="generate-link-btn" class="w-full bg-blue-800 text-white font-bold py-3 rounded hover:bg-blue-900 transition">
                Generate Link
            </button>

            <!-- Result Area -->
            <div id="result-area" class="hidden mt-4 bg-green-50 p-4 rounded border border-green-200">
                <p class="text-sm font-bold text-green-800 mb-2">Generated URL:</p>
                <textarea id="generated-url" class="w-full p-2 text-xs font-mono border rounded h-24 mb-2" readonly></textarea>
                <button id="copy-clipboard-btn" class="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700">Copy to Clipboard</button>
            </div>
        </div>
    </div>
`;


/**
 * Renders the Link Generator UI and loads attendance records from Firestore.
 * @param {object} db - Firestore instance
 * @param {string} userId - Current user ID
 * @param {string} appId - Current app ID
 */
export async function initGenerator(db, userId, appId) {
    const container = document.getElementById('generator-module-container');
    container.innerHTML = LINK_GENERATOR_HTML;

    // Attach event listeners
    document.getElementById('generate-link-btn').addEventListener('click', generateLink);
    document.getElementById('copy-clipboard-btn').addEventListener('click', copyToClipboard);

    await loadAttendanceRecords(db);
}

/**
 * Loads the last 10 attendance records from a placeholder collection.
 * @param {object} db - Firestore instance
 */
async function loadAttendanceRecords(db) {
    const select = document.getElementById('attendance-select');
    try {
        // NOTE: This assumes an 'attendance' collection exists at the root level.
        // For a full app, this path should be based on the required Firestore path: 
        // `/artifacts/${appId}/public/data/attendance`
        const q = query(collection(db, "attendance"), orderBy("date", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        select.innerHTML = '<option value="">-- Select Class Record --</option>';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.date || "No Date";
            const section = data.section || "No Section";
            const option = document.createElement('option');
            option.value = doc.id;
            option.text = `${date} - ${section} (${doc.id.substring(0, 8)}...)`;
            select.appendChild(option);
        });
    } catch (e) {
        console.error("Error loading attendance records:", e);
        select.innerHTML = '<option value="">Error loading records</option>';
    }
};

/**
 * Generates the shareable link based on user inputs.
 */
function generateLink() {
    const attId = document.getElementById('attendance-select').value;
    const expiryInput = document.getElementById('expiry-date').value;
    const duration = document.getElementById('duration-mins').value;

    if(!attId || !expiryInput || !duration) {
        // Using a custom message box instead of alert()
        showModalMessage("Error", "Please fill in all link generation fields.");
        return;
    }

    const expiryTimestamp = new Date(expiryInput).getTime();
    // Use a placeholder URL for the quiz itself
    const baseUrl = "https://jlvcpa.github.io/my-quizzes/t2-summative-test-01.html"; 
    
    const fullUrl = `${baseUrl}?att=${attId}&exp=${expiryTimestamp}&dur=${duration}`;

    document.getElementById('generated-url').value = fullUrl;
    document.getElementById('result-area').classList.remove('hidden');
}

/**
 * Copies the generated link to the clipboard.
 */
function copyToClipboard() {
    const copyText = document.getElementById("generated-url");
    copyText.select();
    document.execCommand("copy");
    showModalMessage("Success", "Generated link copied to clipboard!");
}

/**
 * Placeholder for custom modal message (replaces alert/confirm).
 * @param {string} title - Title of the message
 * @param {string} message - Content of the message
 */
function showModalMessage(title, message) {
    console.log(`[Message: ${title}] ${message}`);
    // In a real application, you would render a custom modal component here.
    // For this demonstration, we'll log to console and briefly show a UI notification if possible.
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-xl z-50 transition-opacity duration-300';
    notification.textContent = `${title}: ${message.split('.')[0]}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
