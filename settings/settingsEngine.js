import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firestore path for shared school settings (Public data)
const SETTINGS_COLLECTION_PATH = (appId) => `/artifacts/${appId}/public/data/school_settings`;
const SETTINGS_DOC_REF = (db, appId) => doc(db, SETTINGS_COLLECTION_PATH(appId), 'config');

/**
 * Renders the Settings UI and loads current configuration from Firestore.
 * @param {object} db - Firestore instance
 * @param {string} userId - Current user ID
 * @param {string} appId - Current app ID
 */
export async function initSettings(db, userId, appId) {
    const container = document.getElementById('settings-module-container');
    container.innerHTML = `
        <h3 class="font-bold text-blue-900 text-xl mb-6"><i class="fa-solid fa-cogs mr-2"></i> School Configuration Settings</h3>
        <p id="settings-status" class="text-sm text-gray-500 mb-4">Loading configuration...</p>
        
        <div class="space-y-6">
            <!-- School Logo Setup -->
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label class="block text-sm font-bold text-gray-700 mb-2">School Logo</label>
                <div class="flex items-center space-x-4">
                    <div id="logo-preview-container" class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0 overflow-hidden">
                        <i id="logo-icon" class="fa-solid fa-camera"></i>
                    </div>
                    <input type="file" id="logo-upload" accept="image/*" class="hidden">
                    <button type="button" id="upload-logo-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Upload Logo</button>
                </div>
                <p class="text-xs text-gray-500 mt-2">Note: Logo is stored as a base64 string in Firestore (max 1MB per document).</p>
            </div>

            <!-- School Year Setup -->
            <div class="bg-white p-4 rounded-lg shadow">
                <label class="block text-sm font-bold text-gray-700 mb-2">School Year Configuration</label>
                <div id="sy-container" class="space-y-2">
                    <!-- School Year Inputs will be populated here -->
                </div>
                <button type="button" id="add-sy-btn" class="mt-4 bg-green-500 text-white px-3 py-1 text-sm rounded-lg hover:bg-green-600 transition">
                    <i class="fa-solid fa-plus mr-1"></i> Add School Year
                </button>
            </div>

            <button type="button" id="save-settings-btn" class="w-full bg-blue-800 text-white font-bold py-3 rounded-lg hover:bg-blue-900 transition">
                Save All Settings
            </button>
        </div>
    `;

    // Attach event listeners
    document.getElementById('upload-logo-btn').addEventListener('click', () => {
        document.getElementById('logo-upload').click();
    });
    document.getElementById('logo-upload').addEventListener('change', (e) => handleLogoUpload(e, container));
    document.getElementById('add-sy-btn').addEventListener('click', addSchoolYearInput);
    document.getElementById('save-settings-btn').addEventListener('click', () => saveSettings(db, appId, container));

    await loadSettings(db, appId, container);
}

/**
 * Loads configuration data from Firestore and updates the UI.
 * @param {object} db - Firestore instance
 * @param {string} appId - Current app ID
 * @param {HTMLElement} container - UI container element
 */
async function loadSettings(db, appId, container) {
    const status = container.querySelector('#settings-status');
    try {
        const docRef = SETTINGS_DOC_REF(db, appId);
        const docSnap = await getDoc(docRef);
        const config = docSnap.exists() ? docSnap.data() : { 
            schoolYears: [], 
            logoData: null 
        };
        
        status.textContent = 'Configuration loaded successfully.';
        
        // 1. Load Logo
        if (config.logoData) {
            updateLogoPreview(config.logoData);
            updateHeaderLogo(config.logoData);
        } else {
             // Clear logo placeholder if no logo is set
            container.querySelector('#logo-icon').classList.remove('hidden');
        }

        // 2. Load School Years
        const syContainer = container.querySelector('#sy-container');
        syContainer.innerHTML = ''; // Clear existing
        if (config.schoolYears && config.schoolYears.length > 0) {
            config.schoolYears.forEach(sy => addSchoolYearInput(sy, syContainer));
        } else {
            // Add a default one if none exist
            addSchoolYearInput({}, syContainer);
        }
    } catch (error) {
        console.error("Error loading settings:", error);
        status.textContent = 'Error loading settings. Check console for details.';
    }
}

/**
 * Handles logo file upload and updates the preview.
 * @param {Event} e - File input change event
 * @param {HTMLElement} container - UI container element
 */
function handleLogoUpload(e, container) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // Max 1MB
        alert("File is too large! Maximum size is 1MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const logoData = event.target.result;
        updateLogoPreview(logoData);
    };
    reader.readAsDataURL(file);
}

/**
 * Updates the logo preview on the settings page.
 * @param {string} logoData - Base64 image data
 */
function updateLogoPreview(logoData) {
    const logoContainer = document.getElementById('logo-preview-container');
    logoContainer.innerHTML = `<img src="${logoData}" alt="School Logo" class="w-full h-full object-cover">`;
}

/**
 * Updates the logo in the main sidebar header.
 * @param {string} logoData - Base64 image data
 */
function updateHeaderLogo(logoData) {
    const headerLogoContainer = document.getElementById('school-logo-icon');
    headerLogoContainer.innerHTML = `<img src="${logoData}" alt="School Logo" class="w-full h-full object-cover">`;
}


/**
 * Adds UI elements for one School Year (SY), Semesters, and Terms.
 * @param {object} syData - Existing SY data to populate
 * @param {HTMLElement} [parentContainer] - Optional container to append to
 */
function addSchoolYearInput(syData = {}, parentContainer = null) {
    const syContainer = parentContainer || document.getElementById('sy-container');
    const sy = syData.year || `SY ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const semesters = syData.semesters || [{ name: '1st Semester', terms: ['Term 1'] }];

    const syDiv = document.createElement('div');
    syDiv.className = 'border border-gray-300 p-4 rounded-lg bg-gray-50';
    syDiv.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <input type="text" value="${sy}" class="sy-input text-lg font-bold w-full p-2 border rounded">
            <button type="button" class="remove-sy-btn text-red-500 hover:text-red-700 ml-3">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
        
        <label class="block text-sm font-semibold text-gray-700 mt-3 mb-1">Semesters & Terms:</label>
        <div class="semester-list space-y-3 pl-4 border-l-2 border-gray-200">
            <!-- Semesters go here -->
        </div>
        <button type="button" class="add-sem-btn mt-3 bg-indigo-500 text-white px-3 py-1 text-xs rounded-lg hover:bg-indigo-600 transition">
            <i class="fa-solid fa-plus mr-1"></i> Add Semester
        </button>
    `;

    syDiv.querySelector('.remove-sy-btn').addEventListener('click', () => syDiv.remove());
    syDiv.querySelector('.add-sem-btn').addEventListener('click', (e) => addSemesterInput(e.target.previousElementSibling));
    
    const semesterList = syDiv.querySelector('.semester-list');
    if (semesters.length > 0) {
        semesters.forEach(sem => addSemesterInput(semesterList, sem));
    } else {
        addSemesterInput(semesterList);
    }
    
    syContainer.appendChild(syDiv);
}

/**
 * Adds UI elements for one Semester and its Terms.
 * @param {HTMLElement} parentContainer - The .semester-list container
 * @param {object} semData - Existing Semester data to populate
 */
function addSemesterInput(parentContainer, semData = {}) {
    const semesterName = semData.name || `Semester ${parentContainer.children.length + 1}`;
    const terms = semData.terms || ['Term 1', 'Term 2'];

    const semDiv = document.createElement('div');
    semDiv.className = 'p-3 bg-white border border-gray-200 rounded';
    semDiv.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <input type="text" value="${semesterName}" class="semester-input font-medium w-full p-1 border rounded text-sm">
            <button type="button" class="remove-sem-btn text-red-400 hover:text-red-600 ml-2 text-xs">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Terms:</label>
        <div class="term-list flex flex-wrap gap-2">
            <!-- Terms go here -->
        </div>
        <button type="button" class="add-term-btn mt-2 bg-purple-500 text-white px-2 py-1 text-xs rounded hover:bg-purple-600 transition">
            <i class="fa-solid fa-plus"></i> Term
        </button>
    `;

    semDiv.querySelector('.remove-sem-btn').addEventListener('click', () => semDiv.remove());
    semDiv.querySelector('.add-term-btn').addEventListener('click', (e) => addTermInput(e.target.previousElementSibling));

    const termList = semDiv.querySelector('.term-list');
    terms.forEach(termName => addTermInput(termList, termName));

    parentContainer.appendChild(semDiv);
}

/**
 * Adds a pill input for a single Term name.
 * @param {HTMLElement} parentContainer - The .term-list container
 * @param {string} termName - Existing Term name
 */
function addTermInput(parentContainer, termName = 'New Term') {
    const termDiv = document.createElement('div');
    termDiv.className = 'flex items-center bg-gray-100 rounded-full p-1 pl-3 text-sm border';
    termDiv.innerHTML = `
        <input type="text" value="${termName}" class="term-input bg-transparent w-20 outline-none text-gray-700">
        <button type="button" class="remove-term-btn text-red-400 hover:text-red-600 ml-1 mr-1">
            <i class="fa-solid fa-times text-xs"></i>
        </button>
    `;
    termDiv.querySelector('.remove-term-btn').addEventListener('click', () => termDiv.remove());
    parentContainer.appendChild(termDiv);
}


/**
 * Collects data from the UI and saves it to Firestore.
 * @param {object} db - Firestore instance
 * @param {string} appId - Current app ID
 * @param {HTMLElement} container - UI container element
 */
async function saveSettings(db, appId, container) {
    const status = container.querySelector('#settings-status');
    status.textContent = 'Saving configuration...';
    
    const logoData = document.getElementById('logo-preview-container').querySelector('img')?.src || null;
    
    // 1. Gather School Years Data
    const schoolYears = [];
    const syContainers = container.querySelectorAll('.sy-input').forEach(syInput => {
        const syDiv = syInput.closest('.border-gray-300');
        const syName = syInput.value.trim();
        if (!syName) return;

        const semesters = [];
        syDiv.querySelectorAll('.semester-input').forEach(semInput => {
            const semDiv = semInput.closest('.p-3.bg-white');
            const semName = semInput.value.trim();
            if (!semName) return;

            const terms = [];
            semDiv.querySelectorAll('.term-input').forEach(termInput => {
                const termName = termInput.value.trim();
                if (termName) terms.push(termName);
            });

            semesters.push({ name: semName, terms: terms });
        });

        schoolYears.push({ year: syName, semesters: semesters });
    });

    const configData = {
        schoolYears: schoolYears,
        logoData: logoData,
        updatedAt: new Date().toISOString()
    };

    try {
        const docRef = SETTINGS_DOC_REF(db, appId);
        await setDoc(docRef, configData);
        status.textContent = 'Configuration saved successfully!';
        updateHeaderLogo(logoData); // Update header logo immediately
    } catch (error) {
        console.error("Error saving settings:", error);
        status.textContent = 'Error saving settings! Check console.';
    }
}
