# ApexSpend - Personal Expense & Budget Tracker SPA

A production-ready Single Page Application (SPA) built with **Angular 20 (Standalone Architecture)**, **Angular Signals**, **Tailwind CSS**, and **Chart.js**, deployed via automated CI/CD to **GitHub Pages**.

🌐 **Live Demo**: [https://Pokharaj.github.io/expense-tracker/](https://Pokharaj.github.io/expense-tracker/)

---

## 🚀 Key Highlights & Architecture

- **Angular Standalone Architecture**: Modern standalone components without `NgModule` overhead.
- **Signal-Driven Reactivity**: Reactive state and computed analytics using `signal()`, `computed()`, and `effect()`.
- **Chart.js Visualizations**: Planned vs. Actual spend (Bar Chart) and Category Distribution (Doughnut Chart) with automated signal-driven redraws and formatted INR (`₹`) tooltips.
- **Budget Performance Matrix**: Real-time variance analysis, percentage utilization progress bars, status badges (`On Track`, `Near Limit >85%`, `Over Budget`, `No Budget`), and inline target editing.
- **Reactive Transaction Forms**: Validated user inputs using Angular `FormBuilder` and `Validators` for Expenses, Incomes, and Monthly Budget Allocators.
- **Itemized Ledger with Filters**: Dual ledger tabs (Expenses & Incomes) with live search, category/source filters, dual-mode sorting (Date / Amount), pagination, and delete confirmation modals.
- **Client-Side Persistence & Portability**: Automatic hydration & synchronization to `localStorage` with error handling, JSON export backup, and JSON backup restoration.
- **Continuous Deployment (CI/CD)**: Automated GitHub Actions pipeline using native `actions/deploy-pages` and automatic SPA `404.html` deep-link handling.

---

## 📦 Local Development

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Start Development Server
```bash
npm start
# or
npx ng serve
```
Navigate to `http://localhost:4200/` in your browser.

### 3. Production Build
```bash
npm run build
```

---

## 🚀 Continuous Deployment to GitHub Pages

### Dedicated Release Script
```bash
npm run build:gh-pages
```
This script:
1. Builds the Angular application with production optimizations.
2. Injects `--base-href /expense-tracker/` for subpath routing on `https://Pokharaj.github.io/expense-tracker/`.
3. Creates a duplicate `404.html` from `index.html` in `dist/expense-tracker/browser/` to ensure SPA deep-links and page refreshes never return a 404 error.

### Automated GitHub Actions Workflow
The workflow file at `.github/workflows/deploy.yml`:
- Triggers on every push to `main` (and manual `workflow_dispatch`).
- Sets up Node.js 22 with npm cache.
- Runs `npm ci --legacy-peer-deps` and `npm run build:gh-pages`.
- Verifies the `404.html` fallback.
- Uses `actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4` for zero-configuration, secure deployments.

> **GitHub Repository Setting Note**:
> In the repository on GitHub:
> Navigate to **Settings** → **Pages** → under **Build and deployment**, set **Source** to **GitHub Actions**.
