# 🏋️ NK's Fit Journal

> A personal fitness & nutrition tracker — built for anyone who wants to lose weight, gain weight, or maintain. Track calories, macros, water, and your journey.

**Live URL:** `https://NikhilKadari38.github.io/nks-fit-journal`

---

## 📁 File Structure

```
nks-fit-journal/
├── index.html              ← Landing page (constellation animation)
├── dashboard.html          ← Daily summary, macros, water, day type toggle
├── foodlog.html            ← Log food entries, browse previous days
├── database.html           ← Browse & quick-log foods, add custom items
├── progress.html           ← Charts: weight, calories, macros, streak
├── profile.html            ← Personal stats, goals, calorie targets
├── login.html              ← Sign in / Create account
├── main.css                ← Global styles, CSS variables, light/dark themes
├── components.css          ← Navbar, buttons, cards, all UI components
├── firebase-config.js      ← Firebase + NKStorage (multi-user data layer)
├── auth.js                 ← Custom username/password auth system
├── app.js                  ← Theme, nav, toast, modal, utilities, side figures
├── animations.js           ← 6 unique canvas background animations per page
├── fooddb.js               ← 91+ food database + FoodDB utility functions (Firebase-backed)
├── dashboard.js            ← Dashboard logic
├── foodlog.js              ← Food log + date navigation logic
├── database.js             ← Database page logic
├── progress.js             ← Chart.js charts logic
└── profile.js              ← Profile save/load + BMR auto-calc logic
```

---

## ✨ Features

### 👤 Multi-User Auth
- Custom **username + password** login — no email required
- Passwords hashed with **SHA-256 + salt + pepper** via Web Crypto API
- Sessions expire after **72 hours**
- Each user's data is fully **isolated** in Firebase under their username
- Admin account (`nikhil`) can view all users and delete accounts
- Deleted users are **instantly kicked out** on next page load

### 🎯 Goal-Aware Dashboard
- Set your current weight and goal weight — app auto-detects your goal:
  - Current > Goal → 📉 Weight Loss mode
  - Current < Goal → 📈 Weight Gain mode
  - Current = Goal → ⚖️ Maintain mode
- **3-state day type toggle:** 😴 Rest · 🏃 Moderate · 🏋️ Full Workout
- Calorie ring, macro bars, goal progress bar all update live per day type

### 🧮 Smart BMR & Calorie Calculator
- BMR calculated using Mifflin-St Jeor formula
- 3 calorie targets auto-calculated on profile save or weight log:
  - 😴 Rest Day = BMR × 1.2 ± adjustment
  - 🏃 Moderate = BMR × 1.55 ± adjustment
  - 🏋️ Full Workout = BMR × 1.725 ± adjustment
- Logging weight on dashboard automatically recalculates and saves everything

### 📊 Dynamic Macro Targets
Macros split from calorie goal based on your goal type:

| Goal | Protein | Fat | Carbs |
|---|---|---|---|
| 📉 Lose | 35% | 25% | 40% |
| 📈 Gain | 25% | 25% | 50% |
| ⚖️ Maintain | 30% | 25% | 45% |

### 🍽️ Food Log
- Log food freely with timestamps — no meal categories
- Browse **previous days** with arrow navigation or calendar picker
- Totals strip: calories, protein, carbs, fat for any selected day

### 🗄️ Food Database
- **91+ foods** — Indian + international, veg + non-veg
- Clickable stat cards filter by Veg / Non-Veg / Custom
- Quick-log directly from the database page
- Add unlimited custom foods (saved to your account only)

### 🎨 Design & UX
- Light / Dark mode — consistent font in both modes
- **Side body figures** in page margins, goal-aware:
  - 📉 Lose: 🫃 Now → 🏃 Goal
  - 📈 Gain: 🧎 Now → 🏋️ Goal
  - 🎉 Goal reached: same emoji on both sides!
- Smooth page load with spinner — no value flickering
- Fully responsive — mobile, tablet, desktop
- Date tracking uses **browser local time** — correct for any country worldwide

---

## 🚀 Deployment

### Push updates
```bash
git add .
git commit -m "describe your changes"
git push
```

### First time setup
```bash
git init
git remote add origin https://github.com/NikhilKadari38/nks-fit-journal.git
git add .
git commit -m "Initial commit"
git push -u origin master
```
Then go to repo **Settings → Pages → Deploy from branch → master**.

---

## 🔥 Firebase Structure

```
auth/users/accounts/{username}/     ← auth record
userData/{username}/meta/           ← profile, settings
userData/{username}/foodlogs/       ← daily food entries
userData/{username}/weights/        ← daily weight logs
userData/{username}/water/          ← daily water intake
```

---

## 👤 Admin Panel

Admin username: `nikhil` (set in `auth.js`). Admin powers:
- View all registered users with join date and last login
- Delete any user and all their data instantly
- Deleted users are redirected to login on their next page load with a message

---

## 📝 Tech Stack

| Layer | Technology |
|---|---|
| Hosting | GitHub Pages |
| Backend / DB | Firebase Firestore (europe-west3) |
| Auth | Custom SHA-256 + Web Crypto API |
| Charts | Chart.js (CDN) |
| Fonts | Playfair Display, DM Sans |
| Animations | Vanilla Canvas API |
| Framework | None — pure HTML, CSS, JavaScript |

---

*Built with ❤️ for anyone on a fitness journey 💪*
