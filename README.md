Learning Hub Teacher Dashboard (Modular)

The Learning Hub Teacher Dashboard is a modern, modular web application designed to help teachers manage their classes, create academic activities with dynamic headers based on school settings, and generate secure links for quizzes and attendance.

This application is built as a single-page application (SPA) using vanilla JavaScript modules and Tailwind CSS for a responsive, clean user interface. All persistent data is managed through Google Firestore.

✨ Features

Teacher Authentication: Secure login using the teacher's ID Number and custom password stored in Firestore.

Modular Navigation: Dashboard features are segregated into distinct JavaScript modules (/settings, /activities, /generator, etc.) for improved maintainability and scalability.

Dynamic School Settings: Allows the teacher to configure global parameters (School Logo, School Year, Semesters, and Terms) that are persisted in Firestore's public data collection.

Activity Creator: Dynamically populates School Year, Semester, and Term dropdowns using the saved global settings, ensuring consistent formatting for activity headers.

Link Generator: A utility to create time-limited, secured links for external resources like attendance tracking or quizzes.

🧱 Architecture and Structure

The application follows a modular JavaScript pattern. The core logic handles global state and authentication, delegating UI rendering and domain-specific functionality to dedicated feature engines.

Directory Structure

learning-hub/
├── index.html                  <-- Main layout and UI structure
├── main.js                     <-- Core entry point (Auth, Router/Switcher, Global State)
├── settings/                   <-- Module for school configuration (Logo, SY, Semesters, Terms)
│   ├── settingsEngine.js       
│   └── helpers.js              
├── activities/                 <-- Module for creating and managing academic activities
│   ├── activitiesEngine.js     
│   └── helpers.js              
├── generator/                  <-- Module for generating secure quiz/attendance links
│   ├── generatorEngine.js      
│   └── helpers.js              
├── students/                   <-- Module for student management (Placeholder)
│   ├── studentsEngine.js       
│   └── helpers.js
├── classes/                    <-- Module for class management (Placeholder)
│   ├── classesEngine.js        
│   └── helpers.js
└── ... (other module directories)


Core Components

index.html: Defines the static UI layout (Sidebar, Header, Content areas) and imports main.js as a module.

main.js:

Initializes Firebase and establishes the global db, auth, and appId variables.

Manages the Teacher Login process by querying the teachers_info collection.

Controls the sidebar navigation (window.switchTab), dynamically invoking the init[Module] function for the selected tab.

Feature Engine (e.g., settingsEngine.js): Contains the specific logic for that feature, including:

Rendering the UI for its corresponding section container (e.g., #settings-module-container).

Handling all Firestore read/write operations for that domain.

Attaching event listeners for user interactions.

🛠️ Installation and Setup

Prerequisites

A Firebase Project.

A database initialized with Firestore.

The necessary global environment variables provided by the Canvas environment:

__app_id

__firebase_config

__initial_auth_token (used for base authentication)

Firestore Data Requirements

For the Teacher Login and Settings to function, the following collections must be populated under the Public Data Path (/artifacts/{appId}/public/data):

Teacher Authentication Data

Collection: teachers_info

Document: [idNumber]_[lastName]_[firstName]

Fields: Must contain idNumber and passWord for validation.

School Configuration Data

Collection: school_settings

Document: config

Data: Populated by the Settings module (stores logoData, schoolYears, etc.).

🚀 Usage

1. Teacher Login

Upon opening the dashboard, you will be presented with the Teacher Login overlay:

Enter your ID Number (e.g., 12700).

Enter your Password (e.g., 14344230321).

Click Log In.

⚠️ Security Note: The current login implementation validates the password directly against the data retrieved from a public Firestore collection (teachers_info). In a production environment, this password validation must be performed on a secure backend server to prevent exposing user passwords.

2. Configure Settings (First Use)

Before using the Activities module, you must set up the academic structure:

Click the Settings navigation item.

Use the input fields to define your School Year, Semesters, and Terms (e.g., 1st Semester contains Term 1, Term 2).

(Optional) Upload your School Logo.

Click Save All Settings.

3. Create Activities

Click the Activities navigation item.

The School Year, Semester, and Term dropdowns will be automatically populated from the saved settings.

Select the desired academic context (SY, Semester, Term) and the Activity Type.

The Activity Heading Preview will update in real-time, showing how the configured global parameters will be used in your created materials.
