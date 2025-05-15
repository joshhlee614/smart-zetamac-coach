Smart Zetamac Coach (v0.0.1)

A Chrome extension that helps you get better at Zetamac Mental Math by tracking your performance and recommending personalized drills based on the types of problems you struggle with the most.

What It Does:
	•	Automatically logs your completed Zetamac problems
	•	Tracks the exact timing of each problem
	•	Categorizes each problem by operation (add, sub, mul, div) and digit structure (e.g., 2×1-digit)
	•	Identifies the slowest categories and most time-consuming problem types
	•	Recommends specific practice settings (Range A and Range B) to help you improve
	•	Displays a clean interactive dashboard summarizing your performance

Features:
	•	Tracks all answers and timestamps during real-time Zetamac runs
	•	Automatically detects when a session finishes (when the timer hits zero)
	•	Suggests focused practice settings by detecting common weaknesses
	•	Groups problems by digit structure and operator for deeper insights
	•	All data is stored locally using chrome.storage.local
	•	Built-in dashboard to explore your sessions and weaknesses visually

How to Use:
	1.	Clone or download the repository
	2.	In the project directory, run:
	•	npm install
	•	npm run build
	3.	Open Google Chrome and go to chrome://extensions
	4.	Enable “Developer mode” (top right)
	5.	Click “Load unpacked”
	6.	Select the “dist” folder inside the project

You’re ready to go! The extension will begin logging once you start a new game on https://arithmetic.zetamac.com/.

Default Tracking Settings:
	•	Addition/Subtraction: 2 to 100
	•	Multiplication/Division: 2 to 12 × 2 to 100

File Structure:
/public
	manifest.json
	icon assets
/src
	content.js (injected into Zetamac)
	dashboard.tsx (React/TS UI)
/dist
	Auto-generated build output

Tech Stack:
	•	TypeScript
	•	React
	•	Vite
	•	Chrome Extensions (Manifest V3)
	•	Chrome local storage

Version:
	•	Current version: 0.0.1

License:
	•	MIT License