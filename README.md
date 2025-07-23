# 📘 README: Interactive Learning Quiz

## 📝 Overview
This project is an interactive HTML-based quiz module designed to help learners understand various forms of business organizations—such as partnerships, corporations, LLCs, and cooperatives. It includes multiple-choice questions with feedback, a student section selector, and a randomized student picker for classroom engagement.

## 🎯 Features
- **Multiple-choice quiz** with instant feedback and explanations
- **Sidebar panel** for selecting student sections (A, B, C)
- **Random student selector** to promote participation
- **Responsive layout** with collapsible sidebar
- **Accessible design** using semantic HTML and clear visual cues

## 📂 File Structure
This project consists of a single HTML file containing:
- Embedded CSS for styling
- Embedded JavaScript for interactivity
- Structured HTML for layout and content

## 🚀 How to Use
1. **Open the HTML file** in any modern browser.
2. **Take the quiz** by selecting answers and clicking "Check Answer."
3. **Use the sidebar** to choose a student section (A, B, or C).
4. **Click “🎲 Randomize”** to randomly select a student from the chosen section.
5. **Toggle the sidebar** using the ☰ button to show/hide the student panel.

## 👨‍🏫 Educational Purpose
This module is ideal for:
- Classroom use to reinforce concepts of business organization
- Encouraging student participation through random selection
- Self-paced learning with immediate feedback

## 🛠️ Technologies Used
| Technology | Purpose |
|------------|---------|
| HTML5      | Structure and content |
| CSS3       | Styling and layout |
| JavaScript | Interactivity and logic |

## 📌 Customization Tips
- **Add more questions** by extending the `questions` array in the script.
- **Update student names** in the `sections` object.
- **Style enhancements** can be made by modifying the CSS in the `<style>` tag.
- **Integrate with LMS** platforms like Microsoft Teams using WebView or iframe embedding.

## ⚠️ Known Issues
- Student names in the `sections` array contain syntax errors (e.g., `"Anna, "Ben"` should be `"Anna", "Ben"`).
- The `#student-ul` selector in `startRandomizer()` refers to a non-existent element and may need correction.

## 📚 License
This project is intended for educational use. You may modify and distribute it freely for non-commercial purposes.
