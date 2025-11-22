import { collection, getDocs, getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// CSS Styles (Injected dynamically)
const ATTENDANCE_STYLES = `
<style id="attendance-styles">
/* 🧩 Responsive Layout Enhancements */
.attendance-container {
    display: flex;
    height: calc(100vh - 100px); /* Adjusted for dashboard header */
    width: 100%;
    font-family: Arial, sans-serif;
    overflow: hidden;
}

.attendance-input-panel {
    flex-grow: 1;
    width: 95%;
    padding: 10px;
    display: block;
    transition: width 0.3s ease, padding 0.3s ease;
    background-color: #f0f0f0;
    border-right: 1px solid #ccc;
    overflow-y: auto;
    overflow-x: auto;
}

.attendance-record-panel {
    flex-grow: 0;
    width: 40px; /* Start collapsed */
    transition: width 0.3s ease, padding 0.3s ease;
    background-color: #d0e6ff;
    overflow: hidden;
    position: relative;
}

.attendance-record-panel.expanded {
    width: 40%;
    overflow: auto;
}

.record-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.toggle-btn {
    background-color: #e0e0e0;
    border: none;
    padding: 6px 12px;
    font-weight: bold;
    cursor: pointer;
    white-space: nowrap;
}

/* COMPACT TABLE STYLES */
table.attendance-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    background: white;
}

.attendance-table th,
.attendance-table td {
    padding: 1px 2px; /* Reduced padding as requested */
    border: 1px solid #ddd;
    text-align: center;
    font-size: 0.8rem; /* Slightly smaller font for compactness */
    line-height: 1.1;
}

.attendance-table th {
    padding: 4px 2px; /* Give header slightly more breathing room than rows */
    background-color: #f9fafb;
    font-weight: 600;
}

.attendance-table th.sortable:hover {
    cursor: pointer;
    background-color: #f0f0f0;
}

td.last-name,
td.first-name {
    text-align: left !important;
    white-space: nowrap;
}

/* Compact Inputs inside table */
.attendance-table input[type="text"] {
    width: 100%;
    min-width: 40px;
    border: 1px solid #ccc;
    padding: 0px 2px;
    font-size: 0.8rem;
    height: 1.2rem;
    margin: 0;
}

.attendance-table input[type="radio"] {
    margin: 0;
    vertical-align: middle;
    height: 0.9rem;
    width: 0.9rem;
}

.status-display {
    font-weight: bold;
    width: 30px;
}
.status-check { color: green; }
.status-absent { color: red; }
.status-late { color: gray; }
.status-hol { background-color: #ffebee; color: #c62828; }

.attendanceInputHeader-conductGradeHeader-panel {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
}

/* Fixed width for attendance panel */
.attendance-control-panel {
    width: 370px;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background-color: #f9f9f9;
    flex-shrink: 0;
}

/* COMPACT FORM GRID LAYOUT */
.attendance-form-grid {
    display: grid;
    grid-template-columns: max-content 1fr; /* Labels shrink to fit, inputs take rest */
    gap: 2px 8px; /* Row gap 2px, Col gap 8px */
    align-items: center;
    margin-top: 4px;
}

.attendance-form-grid label {
    text-align: right; /* Right aligned labels */
    font-size: 0.85rem;
    font-weight: bold;
    margin: 0;
    white-space: nowrap;
}

.attendance-form-grid select,
.attendance-form-grid input {
    width: 100%;
    padding: 1px 4px; /* Very small padding */
    font-size: 0.85rem;
    border: 1px solid #ccc;
    border-radius: 3px;
    height: auto; /* Allow height to be determined by font size + padding */
    min-height: 0;
}

/* Flexible conduct grade panel */
.conductGradeHeader-pane {
    flex: 1;
    min-width: 300px;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background-color: #f9f9f9;
}

.attendanceHeader-showHideBtn-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.attendanceHeader-showHideBtn-panel h3 {
    margin: 0;
    font-size: 1.1rem;
}

.toggle-conduct-panel {
    padding: 2px 8px;
    font-size: 0.75rem;
    cursor: pointer;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
}

.attendance-table tr:hover {
    background-color: #eef6ff;
}

/* Spinner */
#loadingSpinner {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ffffff;
    padding: 20px 30px;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0,0,0,0.2);
    text-align: center;
    z-index: 1000;
}
.dot-loader { display: flex; justify-content: center; margin-bottom: 10px; }
.dot-loader span { width: 10px; height: 10px; margin: 0 5px; background-color: #0078D4; border-radius: 50%; animation: bounce 0.6s infinite alternate; }
.dot-loader span:nth-child(2) { animation-delay: 0.2s; }
.dot-loader span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0% { transform: translateY(0); opacity: 0.6; } 100% { transform: translateY(-10px); opacity: 1; } }
</style>
`;

const ATTENDANCE_HTML = `
<div class="attendance-container">
    <!-- 🟦 Panel 1: Attendance Input -->
    <div class="attendance-input-panel" id="inputPanel">
        <div class="attendanceInputHeader-conductGradeHeader-panel">
            
            <!-- Control Panel -->
            <div class="attendance-control-panel">
                <div class="attendanceInput-header">
                    <div class="attendanceHeader-showHideBtn-panel">
                        <h3>Attendance Taking</h3>
                        <button class="toggle-conduct-panel">Hide Description</button>
                    </div>
                </div>
                
                <!-- New Grid Layout for Compactness -->
                <div class="attendance-form-grid">
                    <label for="SectionSelect">Section:</label>
                    <select id="SectionSelect">
                        <option value="">-- Select Section --</option>
                    </select>

                    <label for="attendanceDate">Date:</label>
                    <input type="date" id="attendanceDate" />

                    <label for="dayType">Day Type:</label>
                    <select id="dayType">
                        <option value="">-- Regular Class --</option>
                        <option value="HOL">Holiday</option>
                        <option value="ILD">Alternative Learning Day</option>
                        <option value="SAT">Saturday</option>
                        <option value="SUN">Sunday</option>
                    </select>
                </div>

                <button id="saveAttendanceBtn" class="w-full bg-blue-600 text-white font-bold py-1 rounded hover:bg-blue-700 mt-3 text-sm">
                    Save Attendance
                </button>
            </div>

            <!-- Conduct Description Panel -->
            <div class="conductGradeHeader-pane" id="conductDescPanel">
                <h3 class="font-bold text-sm">Conduct Description</h3>
                <ul class="text-xs list-disc pl-4 space-y-1 mb-2">
                    <li><strong>Prayer Life</strong>: Respectful disposition during prayer.</li>
                    <li><strong>Relationship</strong>: Self-discipline and respect.</li>
                    <li><strong>Attitude</strong>: Responsibility, punctuality, industry, honesty.</li>
                </ul>
                <h3 class="font-bold text-sm">Grades</h3>
                <div class="text-xs grid grid-cols-3 gap-x-2">
                    <span><strong>A</strong>: Exceptional</span>
                    <span><strong>B+</strong>: Gen. good</span>
                    <span><strong>B</strong>: Satisfactory</span>
                    <span><strong>C+</strong>: Some extent</span>
                    <span><strong>C</strong>: Needs reminders</span>
                    <span><strong>D</strong>: Offenses</span>
                </div>
            </div>
        </div>

        <!-- Students Table -->
        <div class="overflow-x-auto">
            <table id="studentsTable" class="attendance-table">
                <thead>
                    <tr>
                        <th class="sortable">CN</th>
                        <th class="sortable">Last Name</th>
                        <th class="sortable">First Name</th>
                        <th>Status</th>
                        <th>P</th>
                        <th>A</th>
                        <th>L</th>
                        <th>X</th>
                        <th>Prayer Life</th>
                        <th>Reason</th>
                        <th>Rel. w/ Others</th>
                        <th>Reason</th>
                        <th>Attitude</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>

    <!-- 📊 Panel 2: Attendance Records (Collapsible) -->
    <div class="attendance-record-panel" id="recordPanel">
        <div class="p-2">
            <button id="toggleAttendanceInputPanelBtn" class="toggle-btn mb-2 text-xs" title="Show/Hide Records"><< Records</button>
            
            <div id="recordPanelContent" style="display: none;">
                <div class="record-header">
                    <h3 class="font-bold text-sm">Records</h3>
                    <!-- Placeholder for Generate Letter -->
                </div>
                <div class="record-table-wrapper">
                    <table id="recordTable" class="attendance-table text-xs">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Section</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="3">Feature coming soon...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Spinner -->
<div id="loadingSpinner">
    <div class="dot-loader"><span></span><span></span><span></span></div>
    <div>Saving attendance records...</div>
</div>
`;

/**
 * Initializes the Attendance Module.
 */
export async function initAttendance(db, userId, appId) {
    const container = document.getElementById('section-attendance');
    
    // 1. Inject CSS (if not already present)
    if (!document.getElementById('attendance-styles')) {
        document.head.insertAdjacentHTML('beforeend', ATTENDANCE_STYLES);
    }

    // 2. Inject HTML
    container.innerHTML = ATTENDANCE_HTML;
    container.classList.remove('hidden'); // Ensure visibility

    // 3. Initialize Logic
    const studentsMap = new Map();
    const SectionSelect = document.getElementById("SectionSelect");
    const studentsTableBody = document.querySelector("#studentsTable tbody");
    const spinner = document.getElementById("loadingSpinner");

    // --- Setup Event Listeners ---
    
    // Toggle Conduct Description
    document.querySelector('.toggle-conduct-panel').addEventListener('click', function() {
        const panel = document.getElementById('conductDescPanel');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            this.textContent = 'Hide Description';
        } else {
            panel.style.display = 'none';
            this.textContent = 'Show Description';
        }
    });

    // Toggle Record Panel (Expand/Collapse)
    document.getElementById('toggleAttendanceInputPanelBtn').addEventListener('click', function() {
        const panel = document.getElementById('recordPanel');
        const content = document.getElementById('recordPanelContent');
        const inputPanel = document.getElementById('inputPanel');
        
        if (panel.classList.contains('expanded')) {
            // Collapse
            panel.classList.remove('expanded');
            inputPanel.style.width = '95%';
            content.style.display = 'none';
            this.textContent = '<< Records';
        } else {
            // Expand
            panel.classList.add('expanded');
            inputPanel.style.width = '60%';
            content.style.display = 'block';
            this.textContent = '>> Hide';
        }
    });

    // Populate Sections
    await populateSections(db, SectionSelect);

    // Section Change Listener
    SectionSelect.addEventListener("change", async () => {
        const selectedSection = SectionSelect.value;
        const selectedDayType = document.getElementById("dayType").value;
        const selectedDate = document.getElementById("attendanceDate").value;
        
        if (selectedSection) {
            await loadStudentsBySection(db, selectedSection, selectedDayType, studentsMap, studentsTableBody);
            if (selectedDate) {
                await populateSavedAttendance(db, selectedSection, selectedDate, studentsTableBody);
            }
        } else {
            studentsTableBody.innerHTML = "";
        }
    });

    // Date/DayType Change Listener
    const refreshTable = async () => {
        const section = SectionSelect.value;
        if(section) {
            await loadStudentsBySection(db, section, document.getElementById("dayType").value, studentsMap, studentsTableBody);
            const date = document.getElementById("attendanceDate").value;
            if(date) await populateSavedAttendance(db, section, date, studentsTableBody);
        }
    };
    
    document.getElementById("attendanceDate").addEventListener("change", refreshTable);
    document.getElementById("dayType").addEventListener("change", refreshTable);

    // Save Button
    document.getElementById("saveAttendanceBtn").addEventListener("click", async () => {
        await handleSave(db, studentsMap, studentsTableBody, SectionSelect, spinner);
    });

    // Column Sorting
    setupColumnSorting();
}


// --- LOGIC HELPERS ---

async function populateSections(db, selectElement) {
    // NOTE: Assuming 'students' collection exists at ROOT
    const snapshot = await getDocs(collection(db, "students"));
    const sections = new Set();
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.Section) sections.add(data.Section);
    });
    
    // Clear existing options first (except default)
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    [...sections].sort().forEach(section => {
        const option = document.createElement("option");
        option.value = section;
        option.textContent = section;
        selectElement.appendChild(option);
    });
}

async function loadStudentsBySection(db, section, dayType, studentsMap, tbody) {
    tbody.innerHTML = "";
    studentsMap.clear();
    const isNoClass = ["HOL", "ILD", "SAT", "SUN"].includes(dayType);

    const snapshot = await getDocs(collection(db, "students"));
    const students = [];
    
    snapshot.forEach(doc => {
        const s = doc.data();
        if (s.Section === section) {
            students.push(s);
            studentsMap.set(String(s.Idnumber), s);
        }
    });

    // Sort by CN
    students.sort((a, b) => (parseInt(a.CN) || 0) - (parseInt(b.CN) || 0));

    students.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${s.CN || ""}</td>
            <td class="last-name">${s.LastName || ""}</td>
            <td class="first-name">${s.FirstName || ""}</td>
            <td class="status-display center ${isNoClass ? 'status-hol' : ''}">${isNoClass ? dayType : ''}</td>
            <td><input type="radio" name="att_${s.Idnumber}" value="P" ${isNoClass ? 'disabled' : ''}></td>
            <td><input type="radio" name="att_${s.Idnumber}" value="A" ${isNoClass ? 'disabled' : ''}></td>
            <td><input type="radio" name="att_${s.Idnumber}" value="L" ${isNoClass ? 'disabled' : ''}></td>
            <td><input type="radio" name="att_${s.Idnumber}" value="X" ${isNoClass ? 'disabled' : ''}></td>
            
            <td><input type="text" name="grade_prayer_${s.Idnumber}"></td>
            <td><input type="text" name="reason_prayer_${s.Idnumber}" class="reason-schoolwork"></td>
            
            <td><input type="text" name="grade_rel_${s.Idnumber}"></td>
            <td><input type="text" name="reason_rel_${s.Idnumber}" class="reason-schoolwork"></td>
            
            <td><input type="text" name="grade_work_${s.Idnumber}"></td>
            <td><input type="text" name="reason_work_${s.Idnumber}" class="reason-schoolwork"></td>
        `;

        // Logic to update status cell
        if (!isNoClass) {
            tr.querySelectorAll(`input[name="att_${s.Idnumber}"]`).forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const statusCell = tr.querySelector('.status-display');
                    const val = e.target.value;
                    statusCell.textContent = val === 'P' ? '✔' : val;
                    statusCell.className = 'status-display ' + (val === 'P' ? 'status-check' : val === 'A' ? 'status-absent' : 'status-late');
                });
            });
        }

        tbody.appendChild(tr);
    });
}

async function populateSavedAttendance(db, section, date, tbody) {
    const docId = `${section}_${date}`;
    try {
        const docRef = doc(db, "attendance", docId);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
            const data = snap.data();
            data.students.forEach(s => {
                const id = s.Idnumber;
                const tr = tbody.querySelector(`input[name="att_${id}"]`)?.closest('tr');
                if (!tr) return;

                // Set Status Radio
                // Map saved status symbols back to P/A/L values if needed
                let radioVal = null;
                if (s.status.includes("✔") || s.status === "P" || s.status === "V") radioVal = "P";
                else if (s.status === "A" || s.status === "/") radioVal = "A";
                else if (s.status === "L") radioVal = "L";

                if (radioVal) {
                    const radio = tr.querySelector(`input[name="att_${id}"][value="${radioVal}"]`);
                    if (radio) {
                        radio.checked = true;
                        // Trigger change event to update text status
                        radio.dispatchEvent(new Event('change'));
                    }
                }

                // Set Conduct Grades
                if (s.conductGrade && Array.isArray(s.conductGrade)) {
                    const [prayer, rel, work] = s.conductGrade;
                    if (prayer) {
                        tr.querySelector(`input[name="grade_prayer_${id}"]`).value = prayer.value || "";
                        tr.querySelector(`input[name="reason_prayer_${id}"]`).value = prayer.valueReason || "";
                    }
                    if (rel) {
                        tr.querySelector(`input[name="grade_rel_${id}"]`).value = rel.value || "";
                        tr.querySelector(`input[name="reason_rel_${id}"]`).value = rel.valueReason || "";
                    }
                    if (work) {
                        tr.querySelector(`input[name="grade_work_${id}"]`).value = work.value || "";
                        tr.querySelector(`input[name="reason_work_${id}"]`).value = work.valueReason || "";
                    }
                }
            });
            console.log("Attendance Loaded");
        }
    } catch (e) {
        console.error("Error loading attendance:", e);
    }
}

async function handleSave(db, studentsMap, tbody, sectionSelect, spinner) {
    const section = sectionSelect.value;
    const date = document.getElementById("attendanceDate").value;
    const dayType = document.getElementById("dayType").value;
    
    if (!section || !date) {
        alert("Please select both Section and Date.");
        return;
    }

    spinner.style.display = 'block';

    const studentRecords = [];
    const rows = tbody.querySelectorAll('tr');
    const isNoClass = ["HOL", "ILD", "SAT", "SUN"].includes(dayType);

    rows.forEach(row => {
        const radio = row.querySelector('input[type="radio"]');
        if (!radio) return;
        const id = radio.name.replace('att_', '');
        const studentOriginal = studentsMap.get(id);
        if (!studentOriginal) return;

        const statusText = row.querySelector('.status-display').textContent;
        
        // Gather Conduct
        const conductGrade = [
            {
                value: row.querySelector(`input[name="grade_prayer_${id}"]`).value,
                valueReason: row.querySelector(`input[name="reason_prayer_${id}"]`).value
            },
            {
                value: row.querySelector(`input[name="grade_rel_${id}"]`).value,
                valueReason: row.querySelector(`input[name="reason_rel_${id}"]`).value
            },
            {
                value: row.querySelector(`input[name="grade_work_${id}"]`).value,
                valueReason: row.querySelector(`input[name="reason_work_${id}"]`).value
            }
        ];

        studentRecords.push({
            Idnumber: id,
            CN: studentOriginal.CN,
            LastName: studentOriginal.LastName,
            firstName: studentOriginal.FirstName,
            fullName: `${studentOriginal.LastName}, ${studentOriginal.FirstName}`,
            passWord: studentOriginal.passWord || "",
            status: isNoClass ? dayType : statusText,
            conductGrade: conductGrade
        });
    });

    // Helper to normalize metadata (from original code)
    const firstS = studentsMap.values().next().value;
    const metadata = {
        schoolYear: firstS?.schoolYear?.replace(/–/g, "-").trim() || "",
        term: firstS?.term?.trim() || "",
        subject: firstS?.subject?.trim() || ""
    };

    const saveData = {
        date,
        section,
        schoolYear: metadata.schoolYear,
        term: metadata.term,
        subject: metadata.subject,
        students: studentRecords
    };
    if (dayType) saveData.dayType = dayType;

    try {
        const docId = `${section}_${date}`;
        await setDoc(doc(collection(db, "attendance"), docId), saveData);
        alert("Attendance saved successfully!");
    } catch (e) {
        console.error("Save failed:", e);
        alert("Error saving data: " + e.message);
    } finally {
        spinner.style.display = 'none';
    }
}

function setupColumnSorting() {
    document.querySelectorAll("#studentsTable th.sortable").forEach(header => {
        header.addEventListener("click", () => {
            const table = header.closest("table");
            const tbody = table.querySelector("tbody");
            const rows = Array.from(tbody.querySelectorAll("tr"));
            const index = Array.from(header.parentNode.children).indexOf(header);
            const isNumeric = header.textContent === "CN";

            rows.sort((a, b) => {
                const aText = a.children[index].textContent.trim();
                const bText = b.children[index].textContent.trim();
                if (isNumeric) return (parseInt(aText)||0) - (parseInt(bText)||0);
                return aText.localeCompare(bText);
            });

            tbody.innerHTML = "";
            rows.forEach(row => tbody.appendChild(row));
        });
    });
}
