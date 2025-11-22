import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, setPersistence, browserSessionPersistence, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, setLogLevel, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- MODULE IMPORTS (for the feature engines) ---
// Assuming these files exist in their respective directories
import { initSettings } from './settings/settingsEngine.js';
import { initActivities } from './activities/activitiesEngine.js';
import { initGenerator } from './generator/generatorEngine.js';


// --- FIREBASE GLOBAL SETUP ---
setLogLevel('Debug');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Configuration directly provided by the user.
const firebaseConfig = {
    apiKey: "AIzaSyAgOsKAZWwExUzupxSNytsfOo9BOppF0ng",
    authDomain: "jlvcpa-quizzes.firebaseapp.com",
    projectId: "jlvcpa-quizzes",
    storageBucket: "jlvcpa-quizzes.appspot.com",
    messagingSenderId: "629158256557",
    appId: "1:629158256557:web:b3d1a424b32e28cd578b24"
};

// Firestore path for the public teachers collection (Note: Insecure for production, but necessary for front-end only implementation)
const TEACHERS_COLLECTION_PATH = (appId) => `/artifacts/${appId}/public/data/teachers_info`;

// Global Firebase instances and state
let app, db, auth, userId = null;
let currentTeacher = null; // Stores authenticated teacher details {idNumber, firstName, lastName}
let isFirebaseInitialized = false; // NEW FLAG

/**
 * Shows the login overlay and hides the main content.
 */
function showLoginScreen() {
    document.getElementById('login-overlay').classList.remove('hidden');
    document.getElementById('sidebar').classList.add('hidden');
    document.querySelector('main').classList.add('hidden');
}

/**
 * Hides the login overlay and shows the main dashboard content.
 */
function showDashboard() {
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('sidebar').classList.remove('hidden');
    document.querySelector('main').classList.remove('hidden');

    // Set default view to dashboard
    switchTab('dashboard'); 
}

/**
 * Initializes Firebase, authenticates the user, and sets up global state.
 */
async function initializeFirebaseAndAuth() {
    try {
        // Since firebaseConfig is now explicitly defined, we assume it's correct.
        
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        
        // Ensure shared data is available
        window.db = db;
        window.appId = appId;
        window.auth = auth; // Expose auth for sign out
        isFirebaseInitialized = true; // Set flag upon successful initialization

        // Set persistence to session to maintain login state
        await setPersistence(auth, browserSessionPersistence);
        
        // Use onAuthStateChanged for continuous state monitoring
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // If a user is signed in (either by token or successful login)
                userId = user.uid;
                window.userId = userId;
                
                // If currentTeacher data is not set, attempt to load info (e.g., from a cookie/storage or assume sign-in sets it)
                if (!currentTeacher) {
                    // For now, we assume if a custom token was used, it corresponds to an ID Number.
                    // This is a safety catch for token-based authentication.
                    currentTeacher = { firstName: "Authenticated", lastName: "User", profession: "Teacher" }; 
                }
                
                document.getElementById('user-info').innerText = `ID: ${userId}`;
                document.getElementById('teacher-name').innerText = `${currentTeacher.firstName} ${currentTeacher.lastName}`;
                
                console.log("Firebase initialized. User authenticated:", userId);
                showDashboard();

            } else {
                // User is signed out, force login screen
                userId = null;
                window.userId = null;
                currentTeacher = null;
                document.getElementById('user-info').innerText = `Not Signed In`;
                document.getElementById('teacher-name').innerText = `Guest User`;
                showLoginScreen();
            }
        });

        // Handle initial token. Sign in silently to establish basic auth state.
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            // Sign in anonymously if no token, this will trigger onAuthStateChanged
            await signInAnonymously(auth);
        }

    } catch (error) {
        // Check if initialization failed entirely
        console.error("Firebase Initialization or Auth Error:", error);
        document.getElementById('user-info').innerText = `Auth Error: ${error.message}`;
        showLoginScreen();
    }
}

/**
 * Handles sign-in initiated from the UI form.
 */
window.teacherSignInFromUI = async function() {
    // FIX 2: Guard clause to ensure Firestore is initialized before attempting queries
    if (!isFirebaseInitialized || !db) {
        console.error("Firestore DB not initialized yet. Please wait.");
        document.getElementById('login-error').textContent = 'System initializing, please try again in a moment.';
        document.getElementById('login-error').classList.remove('hidden');
        return;
    }

    const idInput = document.getElementById('login-id');
    const passInput = document.getElementById('login-password');
    const errorBox = document.getElementById('login-error');
    const idNumber = idInput.value.trim();
    const passWord = passInput.value.trim();
    
    errorBox.classList.add('hidden');
    errorBox.textContent = '';

    if (!idNumber || !passWord) {
        errorBox.textContent = 'Please enter both ID Number and Password.';
        errorBox.classList.remove('hidden');
        return;
    }

    try {
        // 1. Query Firestore for the teacher document using idNumber
        const q = query(collection(db, TEACHERS_COLLECTION_PATH(appId)), 
                        where("idNumber", "==", idNumber));
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            errorBox.textContent = 'Login failed: Teacher not found.';
            errorBox.classList.remove('hidden');
            return;
        }

        let teacherData = null;
        querySnapshot.forEach(doc => {
            teacherData = doc.data();
        });

        // 2. Validate Password (Insecure front-end check)
        if (teacherData.passWord !== passWord) {
            errorBox.textContent = 'Login failed: Invalid password.';
            errorBox.classList.remove('hidden');
            return;
        }

        // 3. Successful login - Update global and UI state
        currentTeacher = {
            idNumber: teacherData.idNumber,
            firstName: teacherData.firstName,
            lastName: teacherData.lastName,
            profession: teacherData.profession 
        };
        
        // Use the ID number as the userId for session tracking
        userId = teacherData.idNumber;
        window.userId = userId;

        // Since we cannot generate a custom token securely, we bypass Firebase Auth 
        // sign-in flow here and rely on the UI/global state for identity.
        // If the teacher has signed out, the base user is anonymous/null, but we 
        // proceed with the dashboard.

        // Update UI immediately (onAuthStateChanged will not fire, so we manually update)
        document.getElementById('user-info').innerText = `ID: ${userId}`;
        document.getElementById('teacher-name').innerText = `${currentTeacher.firstName} ${currentTeacher.lastName}`;
        
        console.log("Teacher logged in (front-end simulation):", userId);
        
        // Hide login and show dashboard
        showDashboard();

    } catch (error) {
        console.error("Login attempt failed:", error);
        errorBox.textContent = `An error occurred: ${error.message}`;
        errorBox.classList.remove('hidden');
    }
}

/**
 * Handles teacher sign-out.
 */
window.teacherSignOut = async function() {
    try {
        // Sign out the current Firebase user (if any)
        await signOut(auth); 
        // The onAuthStateChanged listener handles showing the login screen.
    } catch (error) {
        console.error("Sign out failed:", error);
    }
}


/**
 * Toggles the sidebar collapsed state.
 */
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('toggle-icon');
    
    sidebar.classList.toggle('collapsed');
    sidebar.classList.toggle('w-64'); 
    
    if (sidebar.classList.contains('collapsed')) {
        toggleIcon.classList.remove('fa-bars');
        toggleIcon.classList.add('fa-chevron-right');
    } else {
        toggleIcon.classList.remove('fa-chevron-right');
        toggleIcon.classList.add('fa-bars');
    }
};

/**
 * Switches the main content area tab and calls the corresponding module initializer.
 * @param {string} tabName 
 */
window.switchTab = function(tabName) {
    // 1. UI Tab Switching
    document.querySelectorAll('.content-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    document.getElementById(`section-${tabName}`).classList.remove('hidden');
    document.getElementById(`nav-${tabName}`).classList.add('active');

    // 2. Update Header Title
    const titles = {
        'dashboard': 'Dashboard Overview',
        'students': 'Student Management',
        'classes': 'Class Management',
        'attendance': 'Attendance Monitoring',
        'materials': 'Learning Materials',
        'activities': 'Activity Creator',
        'grades': 'Grades',
        'settings': 'School Settings',
        'generator': 'Link Generator'
    };
    document.getElementById('page-title').innerText = titles[tabName];

    // 3. Dynamic Module Loading/Initialization
    // Call the respective module's initializer function only if Firebase is ready
    if (db && userId) {
        switch (tabName) {
            case 'settings':
                initSettings(db, userId, appId);
                break;
            case 'activities':
                initActivities(db, userId, appId);
                break;
            case 'generator':
                initGenerator(db, userId, appId);
                break;
            // Add other cases for students, classes, etc. here later
            default:
                // For placeholder sections (dashboard, students, etc.), no action needed
                break;
        }
    } else {
        console.warn("Firebase not ready. Cannot initialize module:", tabName);
    }
}

// Start the entire application flow on load
window.addEventListener('DOMContentLoaded', initializeFirebaseAndAuth);
