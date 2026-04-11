# NK's Fit Journal — Full Project Context

## What this project is
A personal fitness & nutrition tracking web app built with vanilla HTML/CSS/JS + Firebase Firestore. Deployed on GitHub Pages at `https://NikhilKadari38.github.io/nks-fit-journal`. All files are in a FLAT folder structure (no subfolders for HTML/CSS/JS — everything at root level except JS files are in `/js/` folder).

---

## Tech Stack
- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks)
- **Backend/DB:** Firebase Firestore (europe-west3)
- **Auth:** Custom username/password (SHA-256 + salt + pepper via Web Crypto API)
- **Charts:** Chart.js (CDN)
- **Deployment:** GitHub Pages (branch: master)
- **Fonts:** Playfair Display, DM Sans

---

## File Structure
```
Fitness/
├── index.html          ← Landing page (constellation animation)
├── dashboard.html      ← Main dashboard (calories, macros, water, day type)
├── foodlog.html        ← Food log (add entries, view by date)
├── database.html       ← Food database (Firebase-backed, row format)
├── progress.html       ← Charts (weight, calories, macros)
├── profile.html        ← Profile settings + Admin panel
├── login.html          ← Sign in / Register
├── main.css            ← Global styles, CSS variables, light/dark themes
├── components.css      ← All UI components (navbar, cards, buttons etc.)
├── fooddb.js           ← NEW: Firebase food database manager (replaces fooddata.js)
├── js/
│   ├── firebase-config.js  ← Firebase init + NKStorage API + syncFromCloud
│   ├── auth.js             ← Custom auth system
│   ├── app.js              ← Theme, Nav, Toast, Modal, Utils, SideFigures
│   ├── animations.js       ← 6 canvas background animations
│   ├── dashboard.js        ← Dashboard logic
│   ├── foodlog.js          ← Food log logic + date navigation
│   ├── database.js         ← Database page + three-dots menu + edit/reset
│   ├── progress.js         ← Chart.js charts
│   └── profile.js          ← Profile + BMR calc + Admin CSV upload/download
```

---

## Firebase Structure
```
globalFoods/{foodId}          ← Global food database (admin-managed)
auth/users/accounts/{username} ← Auth records (hashed password, salt, role)
userData/{username}/
  meta/                        ← profile, settings
  foodlogs/                    ← daily food entries
  weights/                     ← daily weight logs
  water/                       ← daily water intake
  foodOverrides/{foodId}       ← user's personal edits to global food values
```

---

## Firebase Config (real keys — already in firebase-config.js)
```js
apiKey: "AIzaSyDTSc_gkA0kmx3T4n6IPBOsRC054v-6bWk"
projectId: "nk-s-fit-journal"
// Firestore rules: currently open (allow read, write: if true)
```

---

## Key APIs

### NKStorage (firebase-config.js)
```js
NKStorage.getProfile() / setProfile(data)
NKStorage.getFoodLog(date) / addFoodEntry(date, entry) / deleteFoodEntry(date, id)
NKStorage.getWeight(date) / setWeight(date, kg) / getAllWeights()
NKStorage.getWater(date) / setWater(date, ml)
NKStorage.getCustomFoods() / addCustomFood(food) / deleteCustomFood(id) / saveCustomFoods(foods)
NKStorage.getDayType(date) / setDayType(date, type) / cycleDayType(date)
// Day types: 'rest' | 'moderate' | 'full'
NKStorage.getSettings() / updateSettings(patch)
```

### FoodDB (fooddb.js)
```js
await FoodDB.load()              // loads from Firebase, falls back to BUILTIN_FOODS
FoodDB.getAll()                  // global foods + user overrides + custom foods
FoodDB.getById(id)
FoodDB.search(query)
FoodDB.searchFilter(query, type) // type: 'all' | 'veg' | 'nonveg'
FoodDB.calcMacros(food, qty)     // returns {calories, protein, carbs, fat}
FoodDB.setOverride(foodId, per100)   // user personal edit
FoodDB.resetOverride(foodId)         // reset to global default
FoodDB.adminExportCSV()              // admin only
FoodDB.adminImportCSV(csvText)       // admin only
FoodDB.adminMigrateAll(foods)        // admin only - push all to Firebase
```

### Auth (auth.js)
```js
Auth.getCurrentUser()    // returns username string or null
Auth.isAdmin()           // true if username === 'nikhil'
Auth.requireAuth()       // redirects to login if not logged in
Auth.logout()
```

### Utils (app.js)
```js
Utils.today()            // local date as 'YYYY-MM-DD'
Utils.formatDate(str)    // '14 Mar 2026'
Utils.formatTime(ts)     // '09:42 pm'
Utils.round1(n)          // round to 1 decimal
Utils.clamp(n, min, max)
```

### FitnessCalc (profile.js — exposed globally)
```js
FitnessCalc.calcBMR(weight, height, age)
FitnessCalc.calcBMI(weight, height)
FitnessCalc.calcAge(dob)
FitnessCalc.calcMacros(calories, goalType) // goalType: 'lose'|'gain'|'maintain'
FitnessCalc.calcCaloriesFromBMR(bmr, adjustment, goalType)
FitnessCalc.recalcAndSave(newWeight)  // recalcs everything and saves to profile
```

---

## Profile Data Structure
```js
{
  name, dob, weight, height, goalWeight,
  goalType: 'lose' | 'gain' | 'maintain',  // auto-detected from weights
  dietaryPref: 'veg' | 'nonveg' | 'vegan',
  caloriesRest, caloriesModerate, caloriesWorkout,  // auto-calc from BMR
  calAdjustment,  // kcal deficit/surplus (default 500)
  waterGoal,      // in ml (default 3000)
  macrosRest: { protein, carbs, fat },
  macrosModerate: { protein, carbs, fat },
  macrosFull: { protein, carbs, fat },
}
```

---

## Macro Splits by Goal
```
Lose:     Protein 35% | Fat 25% | Carbs 40%
Gain:     Protein 25% | Fat 25% | Carbs 50%
Maintain: Protein 30% | Fat 25% | Carbs 45%
```

---

## BMR & Calorie Formula
```
BMR = 10×weight + 6.25×height - 5×age + 5  (Mifflin-St Jeor)
Rest     = BMR × 1.2   ± calAdjustment
Moderate = BMR × 1.55  ± calAdjustment
Full     = BMR × 1.725 ± calAdjustment
```

---

## Auth System
- Username/password only (no email)
- SHA-256 + salt + pepper ('nkfitjournal2025')
- Session in localStorage, expires 72 hours
- Admin: username === 'nikhil' (hardcoded in auth.js)
- On every page load: verifyUserExists() checks Firebase — deleted users get kicked out instantly

---

## Food Log Entry Structure
```js
{
  foodId, name, qty, unit, type,
  calories, protein, carbs, fat,  // stored as numbers at time of logging
  addedAt: timestamp
}
// Past log entries NEVER change even if food values are edited later
```

---

## Day Type Toggle (Dashboard)
3 states: 😴 Rest | 🏃 Moderate | 🏋️ Full
- Stored per date in settings.dayTypes[date]
- Each has its own calorie target from profile

---

## Side Figures (app.js — SideFigures)
Shown in page margins on wide screens (>1350px):
- Lose: 🫃 Now → 🏃 Goal
- Gain: 🧎 Now → 🏋️ Goal
- Goal reached (within 0.5kg): same emoji both sides + faster bounce

---

## Mobile
- Bottom nav bar on mobile (≤768px): Dashboard | Food Log | Database | Progress | Profile
- Hamburger menu hidden on mobile (replaced by bottom nav)
- Page loader spinner shown until data ready, then content fades in

---

## Admin Panel (profile page, nikhil only)
- View all users (join date, last login)
- Delete user (removes all data, kicks them out instantly)
- Download food database as CSV
- Upload CSV to update global Firebase food database
- Migrate built-in foods to Firebase (one-time)

---

## Important Patterns
1. **Script load order** on every page:
   Firebase SDKs → firebase-config.js → auth.js → app.js → animations.js → fooddb.js → [page].js

2. **Page init pattern:**
   ```js
   document.addEventListener('DOMContentLoaded', async () => {
     BGAnim.init('pagename');
     await syncFromCloud(); // loads Firebase data + FoodDB.load()
     PageModule.init();
     SideFigures.init();
     // reveal loader → fade in content
   });
   ```

3. **Date handling:** Always use `Utils.today()` — uses browser local time, never toISOString()

4. **Template literals in JS files** — avoid escaped backticks, use string concatenation instead

5. **Flat file structure** — all HTML at root, JS in /js/ folder, NO subfolders for assets

---

## Common IDs to Know
```
dashboard: cal-eaten, cal-remaining, cal-goal-label, bar-protein, bar-carbs, bar-fat,
           val-protein, val-carbs, val-fat, goal-bar, goal-pct, current-weight,
           weight-changed, goal-target-weight, goal-progress-label,
           water-ml, water-target, water-glass-svg, weight-input, weight-save-btn,
           day-type-icon, day-type-toggle, today-date, today-day

foodlog:   food-search, search-results, food-log-entries, log-date, log-count,
           log-day-label, log-total-calories, log-total-protein, log-total-carbs, log-total-fat,
           date-prev, date-next, date-picker, add-food-modal, modal-food-name, modal-qty

database:  foods-grid, db-search, db-total, db-veg, db-nonveg, db-custom,
           quick-log-modal, ql-food-name, ql-qty, ql-unit, ql-calories,
           add-custom-modal, c-name, c-calories, c-protein, c-carbs, c-fat

profile:   p-name, p-dob, p-weight, p-height, p-goal-weight, p-dietary-pref,
           p-calories-rest, p-calories-moderate, p-calories-workout, p-cal-adjustment,
           p-water-goal, save-profile-btn, recalc-calories-btn,
           display-name, display-weight, display-bmi, display-bmr, display-goal,
           avatar-initials, admin-panel, users-list, download-csv-btn, upload-csv-input
```

---

## What NOT to do
- Never use `toISOString()` for dates — always `Utils.today()`
- Never hardcode personal values (76kg, 65kg, 1462 kcal etc.)
- Never use template literal backticks in Python-generated JS (use string concatenation)
- Never add subfolders — flat structure only
- Never break the script load order
