import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Utility function to get the Settings Document reference
const SETTINGS_DOC_REF = (db, appId) => doc(db, `/artifacts/${appId}/public/data/school_settings`, 'config');

/**
 * Fetches settings and populates the Activity Creator UI.
 * @param {object} db - Firestore instance
 * @param {string} userId - Current user ID
 * @param {string} appId - Current app ID
 */
export async function initActivities(db, userId, appId) {
    const container = document.getElementById('activities-module-container');
    container.innerHTML = `
        <div class="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center rounded-t-xl">
            <h3 class="font-bold text-blue-900 text-lg"><i class="fa-solid fa-plus-circle mr-2"></i> Activity Creator Dashboard</h3>
            <p id="activity-status" class="text-xs text-gray-500">Loading Configuration...</p>
        </div>
        
        <div id="activity-form-container" class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Dropdowns will be injected here -->
            <div class="md:col-span-3">
                <div class="bg-yellow-50 p-3 rounded text-sm text-yellow-800 border-l-4 border-yellow-500">
                    <i class="fa-solid fa-triangle-exclamation mr-2"></i> Configuration Data is required to populate headers.
                </div>
            </div>
            <!-- Dynamic Configuration Dropdowns -->
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">School Year</label>
                <select id="ac-sy" class="w-full p-2 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-200" disabled>
                    <option>Loading...</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Semester</label>
                <select id="ac-sem" class="w-full p-2 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-200" disabled>
                    <option>Select SY First</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Term</label>
                <select id="ac-term" class="w-full p-2 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-200" disabled>
                    <option>Select Semester First</option>
                </select>
            </div>

            <!-- Static Dropdowns -->
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Activity Type</label>
                <select id="ac-type" class="w-full p-2 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="Formative Activity">Formative Activity</option>
                    <option value="Coursework">Coursework</option>
                    <option value="Summative Test">Summative Test</option>
                    <option value="Performance Task">Performance Task</option>
                    <option value="Term Exam">Term Exam</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Test Structure / Type</label>
                <select id="ac-test-struct" class="w-full p-2 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="Multiple Choice">Multiple Choice</option>
                    <option value="Problem Solving">Problem Solving</option>
                    <option value="Open-Ended Questions">Open-Ended Questions</option>
                    <option value="Constructed-Response">Constructed-Response</option>
                </select>
            </div>
            
            <div class="flex items-end">
                <button id="create-activity-btn" class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 shadow transition disabled:bg-gray-400" disabled>
                    Create Activity Context
                </button>
            </div>
        </div>

        <div id="generated-heading" class="p-6">
            <h4 class="text-lg font-bold text-gray-800 mb-2">Generated Activity Heading Preview:</h4>
            <div id="heading-preview" class="p-4 bg-gray-100 rounded-lg border border-gray-300 font-mono text-sm">
                [School Name/Logo will appear here]<br>
                [School Year] | [Semester] | [Term]
                <hr class="my-1">
                [Activity Type]: [Test Type]
            </div>
        </div>
    `;

    const statusElement = document.getElementById('activity-status');
    
    try {
        const docRef = SETTINGS_DOC_REF(db, appId);
        const docSnap = await getDoc(docRef);
        const config = docSnap.exists() ? docSnap.data() : null;

        if (config && config.schoolYears && config.schoolYears.length > 0) {
            populateDropdowns(config);
            statusElement.textContent = 'Configuration loaded.';
        } else {
            statusElement.textContent = 'ERROR: Please setup School Years in Settings first.';
            container.querySelector('#create-activity-btn').disabled = true;
        }
    } catch (error) {
        console.error("Error loading settings for activities:", error);
        statusElement.textContent = 'Error loading configuration. See console.';
    }
}

/**
 * Populates SY, Semester, and Term dropdowns based on loaded config.
 * @param {object} config - The school configuration object
 */
function populateDropdowns(config) {
    const sySelect = document.getElementById('ac-sy');
    const semSelect = document.getElementById('ac-sem');
    const termSelect = document.getElementById('ac-term');
    const createBtn = document.getElementById('create-activity-btn');

    // Enable dropdowns
    sySelect.disabled = false;
    semSelect.disabled = false;
    termSelect.disabled = false;
    createBtn.disabled = false;

    // Clear previous options
    sySelect.innerHTML = '<option value="">-- Select School Year --</option>';
    semSelect.innerHTML = '<option value="">-- Select Semester --</option>';
    termSelect.innerHTML = '<option value="">-- Select Term --</option>';
    
    const schoolYearsMap = {};

    // 1. Populate School Years
    config.schoolYears.forEach(sy => {
        const option = document.createElement('option');
        option.value = sy.year;
        option.textContent = sy.year;
        sySelect.appendChild(option);
        schoolYearsMap[sy.year] = sy;
    });

    // 2. Setup Change Listeners
    sySelect.addEventListener('change', () => {
        updateSemesters(sySelect.value, schoolYearsMap, semSelect, termSelect);
        updateHeadingPreview(config.logoData);
    });
    semSelect.addEventListener('change', () => {
        updateTerms(sySelect.value, semSelect.value, schoolYearsMap, termSelect);
        updateHeadingPreview(config.logoData);
    });
    termSelect.addEventListener('change', () => updateHeadingPreview(config.logoData));
    document.getElementById('ac-type').addEventListener('change', () => updateHeadingPreview(config.logoData));
    document.getElementById('ac-test-struct').addEventListener('change', () => updateHeadingPreview(config.logoData));
    
    // Initial content population
    sySelect.value = config.schoolYears[0]?.year || "";
    if (sySelect.value) {
        updateSemesters(sySelect.value, schoolYearsMap, semSelect, termSelect);
    }

    updateHeadingPreview(config.logoData);
}

/**
 * Updates the Semester dropdown based on the selected School Year.
 */
function updateSemesters(selectedSY, schoolYearsMap, semSelect, termSelect) {
    semSelect.innerHTML = '<option value="">-- Select Semester --</option>';
    termSelect.innerHTML = '<option value="">-- Select Term --</option>';

    const syData = schoolYearsMap[selectedSY];
    if (syData && syData.semesters) {
        syData.semesters.forEach(sem => {
            const option = document.createElement('option');
            option.value = sem.name;
            option.textContent = sem.name;
            semSelect.appendChild(option);
        });
        // Select the first semester and trigger term update
        semSelect.value = syData.semesters[0]?.name || "";
        updateTerms(selectedSY, semSelect.value, schoolYearsMap, termSelect);
    }
}

/**
 * Updates the Term dropdown based on the selected School Year and Semester.
 */
function updateTerms(selectedSY, selectedSem, schoolYearsMap, termSelect) {
    termSelect.innerHTML = '<option value="">-- Select Term --</option>';
    
    const syData = schoolYearsMap[selectedSY];
    if (syData && syData.semesters) {
        const semData = syData.semesters.find(s => s.name === selectedSem);
        if (semData && semData.terms) {
            semData.terms.forEach(term => {
                const option = document.createElement('option');
                option.value = term;
                option.textContent = term;
                termSelect.appendChild(option);
            });
            // Select the first term
            termSelect.value = semData.terms[0] || "";
        }
    }
}

/**
 * Updates the activity heading preview with selected values and school config.
 */
function updateHeadingPreview(logoData) {
    const sy = document.getElementById('ac-sy')?.value || '[Select School Year]';
    const sem = document.getElementById('ac-sem')?.value || '[Select Semester]';
    const term = document.getElementById('ac-term')?.value || '[Select Term]';
    const type = document.getElementById('ac-type')?.value || '[Activity Type]';
    const struct = document.getElementById('ac-test-struct')?.value || '[Test Structure]';
    const preview = document.getElementById('heading-preview');
    
    const logoHtml = logoData ? 
        `<div class="flex items-center justify-center mb-2"><img src="${logoData}" alt="Logo" class="h-10 w-10 object-contain mr-2"> 
        <span class="text-base font-bold text-blue-900">[SCHOOL NAME PLACEHOLDER]</span></div>` 
        : `[Upload School Logo in Settings]`;

    preview.innerHTML = `
        ${logoHtml}<br>
        <span class="font-semibold text-gray-700">${sy}</span> | 
        <span class="font-semibold text-gray-700">${sem}</span> | 
        <span class="font-semibold text-gray-700">${term}</span>
        <hr class="my-1 border-gray-400">
        <span class="font-bold text-blue-600">${type}</span>: 
        <span class="italic text-gray-600">${struct}</span>
    `;
}
