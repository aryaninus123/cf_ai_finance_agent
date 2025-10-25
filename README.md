# 💰 AI-Powered Personal Finance Assistant

[![CI](https://github.com/aryaninus123/cf_ai_finance_agent/actions/workflows/ci.yml/badge.svg)](https://github.com/aryaninus123/cf_ai_finance_agent/actions/workflows/ci.yml)
[![Deploy](https://github.com/aryaninus123/cf_ai_finance_agent/actions/workflows/deploy.yml/badge.svg)](https://github.com/aryaninus123/cf_ai_finance_agent/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)

A comprehensive financial management application built on **Cloudflare's edge infrastructure** with intelligent AI capabilities, computer vision receipt scanning, real-time analytics, and beautiful modern UI.

🚀 **Live Demo**: [https://finance-agent.aryaninus.workers.dev](https://finance-agent.aryaninus.workers.dev)

---

## ✨ Features

### 🤖 **Intelligent AI Assistant**
- **Llama 4 Scout Integration**: Powered by Cloudflare Workers AI with latest multimodal model
- **Context-Aware Responses**: AI understands your complete financial history
- **Natural Language Commands**: "Add $50 grocery expense" or "How much did I spend in September?"
- **Monthly Spending Queries**: Ask about specific months and get accurate breakdowns
- **Personalized Financial Advice**: Get tailored recommendations based on spending patterns

### 📸 **AI Receipt Scanner**
- **Computer Vision OCR**: Automatically extract amount, merchant, date, and category from receipt photos
- **Llama 4 Scout Vision Model**: State-of-the-art multimodal AI for receipt processing
- **Instant Form Auto-fill**: Scanned data populates transaction form automatically
- **Smart Categorization**: AI intelligently categorizes expenses (food, transportation, etc.)
- **Fallback Extraction**: Multiple parsing strategies ensure high success rate

### 📊 **Comprehensive Analytics**
- **Monthly Spending Trends**: Interactive bar charts showing 3-month spending history
- **Real-time Budget Tracking**: Visual progress bars with color-coded status indicators
- **Category Breakdown**: Detailed spending analysis with percentages
- **Budget Performance Metrics**: Track "On track" / "Near limit" / "Over budget" status
- **AI-Generated Insights**: Smart recommendations from Llama 4

### 💳 **Advanced Budget Management**
- **Per-Month Filtering**: View budgets and spending for any month
- **Dynamic Month Navigation**: Navigate through July, August, September with ‹ › buttons
- **Customizable Category Budgets**: Set individual limits for food, housing, transportation, etc.
- **Real-time Progress**: Instant visual feedback on budget consumption
- **Smart Alerts**: Visual warnings when approaching or exceeding limits

### 📱 **Modern User Interface**
- **Three-Tab Layout**: AI Chat, Budget Manager, Analytics Dashboard
- **Responsive Design**: Beautiful on desktop and mobile devices
- **Smooth Animations**: Gradient transitions and interactive hover effects
- **Custom File Upload**: Styled file picker matching app theme
- **Real-time Notifications**: Toast messages for all user actions

---

## 🏗️ Architecture

### **Cloudflare Edge Stack**
- **Workers**: Serverless TypeScript backend with ~10ms cold start
- **Durable Objects**: Persistent state management for transactions and budgets
- **Workers AI**: Native Llama 4 Scout integration (text + vision)
- **Edge Deployment**: Global distribution across 200+ locations

### **Technology Stack**
- **Backend**: TypeScript, Cloudflare Workers, Durable Objects
- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (served from Worker)
- **AI Models**: 
  - `@cf/meta/llama-4-scout-17b-16e-instruct` (chat & vision)
- **Storage**: Durable Objects key-value persistence
- **Build Tools**: TypeScript Compiler, Wrangler CLI

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js v20.0.0 or higher
- npm or yarn
- Cloudflare account (free tier works!)
- Wrangler CLI

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/finance-agent.git
   cd finance-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Login to Cloudflare**
   ```bash
   npx wrangler login
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Deploy to Cloudflare**
   ```bash
   npx wrangler deploy
   ```

Your app will be live at: `https://finance-agent.YOUR-SUBDOMAIN.workers.dev`

### **Local Development**

```bash
# Start local dev server (requires login for AI features)
npx wrangler dev --local --persist-to=./.wrangler/state

# Or use remote mode (full AI features)
npx wrangler dev --remote

# Build TypeScript
npm run build
```

---

## 🔄 CI/CD Pipeline

This project includes automated CI/CD workflows using **GitHub Actions**.

### **Continuous Integration (CI)**

Runs on every push and pull request:
- ✅ TypeScript type checking
- ✅ Build validation
- ✅ Security audit
- ✅ Wrangler configuration validation

### **Continuous Deployment (CD)**

Automatically deploys to Cloudflare Workers when code is merged to `main`:
- 🚀 Automatic deployment on merge
- 🏥 Post-deployment health checks
- 🔄 Manual deployment trigger available

### **Setup GitHub Actions**

1. **Add GitHub Secrets** (Settings → Secrets → Actions):
   ```
   CLOUDFLARE_API_TOKEN=<your-api-token>
   CLOUDFLARE_ACCOUNT_ID=<your-account-id>
   ```

2. **Get Cloudflare API Token**:
   - Visit: https://dash.cloudflare.com/profile/api-tokens
   - Create token with "Edit Cloudflare Workers" permissions

3. **Get Account ID**:
   - Visit: https://dash.cloudflare.com/
   - Click "Workers & Pages"
   - Account ID shown on right sidebar

**For detailed CI/CD setup instructions**, see [`.github/workflows/README.md`](.github/workflows/README.md)

---

## 📖 Usage Guide

### **Adding Transactions via AI Chat**
```
User: "Add $75 restaurant dinner expense"
AI: ✅ Successfully added $75 food expense for "restaurant dinner"

User: "How much did I spend in September?"
AI: In September, you spent $1,847.23 across 45 transactions. 
    Your highest spending was in housing ($800.00).
```

### **Scanning Receipts**
1. Click **Budget** tab → **Scan Receipt** sub-tab
2. Click purple **Choose File** button (shows filename when selected)
3. Select receipt photo (clear, well-lit images work best)
4. Click **Scan** - AI extracts data automatically
5. Verify/edit auto-filled fields
6. Click **Add** to save transaction

### **Managing Budgets**
1. Navigate to **Budget** tab
2. Click ⚙️ icon on any category card
3. Set custom budget amount
4. Watch real-time progress update
5. Use ‹ › to navigate between months

### **Viewing Analytics**
- **Monthly Trends**: 3-month bar chart with spending amounts
- **Category Breakdown**: Pie-chart-style percentages
- **Budget Performance**: Side-by-side spending vs. budget comparison
- **AI Insights**: Personalized recommendations below charts

---


### **Smart JSON Extraction**
- Handles object responses directly
- Parses markdown code fences
- Fallback natural language extraction
- Multiple retry strategies

### **Realistic Sample Data Generation**
- 3 months of transaction history
- Budget-aware spending patterns (60-120% of limits)
- Varied transaction amounts by category
- Monthly income of $3000-3500
- Balanced to show ~$3000-5000 total balance

---

## 🎨 UI Components

### **Dashboard Cards**
- **Balance**: Total income - total expenses
- **This Month**: Current month spending only  
- **Savings**: Balance minus current month expenses

### **Budget Cards** (per category)
- Category icon + name
- Current spending / Budget limit
- Progress bar (capped at 100% visual, logic handles >100%)
- Status: ✅ On track / ⚠️ Near limit / 🚨 Over budget
- ⚙️ Edit button to adjust budget

### **Analytics Charts**
- Bar chart: 3 months of spending trends
- Category breakdown: All-time spending percentages
- Budget performance: Current month vs. limits
- AI Insights: Real-time Llama 4 analysis

---

## 🚀 Performance Metrics

- **Worker Startup**: ~10-13ms cold start
- **AI Response Time**: 
  - Chat: 200-500ms
  - Vision: 1-2 seconds (image processing)
- **API Latency**: <100ms for CRUD operations
- **Global Edge**: Deployed to 200+ Cloudflare locations
- **Concurrent Users**: Handles thousands via Durable Objects

---

## 🛠️ Project Structure

```
finance-agent/
├── src/
│   ├── index.ts              # Worker entry point
│   └── simple-agent.ts       # Main Durable Object (2900+ lines)
│       ├── Sample data generation
│       ├── HTML/CSS/JS serving
│       ├── API endpoints
│       ├── AI chat logic
│       ├── Receipt scanner
│       └── Budget management
├── dist/                     # Compiled JavaScript
├── public/                   # Legacy static assets (unused)
├── node_modules/
├── package.json             # Dependencies + scripts
├── wrangler.toml            # Cloudflare config
├── tsconfig.json            # TypeScript config
└── README.md
```

---

## 🔧 Configuration Files

### **wrangler.toml**
```toml
name = "finance-agent"
main = "dist/index.js"
compatibility_date = "2024-09-27"
compatibility_flags = ["nodejs_compat"]

[ai]
binding = "AI"

[[durable_objects.bindings]]
name = "FinanceAgent"
class_name = "FinanceAgent"

[[migrations]]
tag = "v1"
new_classes = ["FinanceAgent"]

[vars]
ENVIRONMENT = "development"
```

### **package.json scripts**
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "wrangler dev --local --persist-to=./.wrangler/state",
    "deploy": "npm run build && wrangler deploy"
  }
}
```

---

## 🤖 AI Capabilities

### **Supported Queries**
- ✅ "Add $X [description] expense" → Auto-categorizes and saves
- ✅ "Add $X [description] income" → Records income
- ✅ "How much did I spend in [month]?" → Monthly breakdown
- ✅ "What's my balance?" → Current financial status
- ✅ "How much did I spend on [category]?" → Category totals
- ✅ General financial advice → AI analysis with recommendations

### **Vision Model Features**
- Extract total amount (including tax)
- Identify merchant/store name
- Parse date (converts to YYYY-MM-DD)
- Categorize transaction
- Return confidence score

---

## 🌟 Key Innovations

1. **Embedded Frontend**: Entire UI served from Worker (no separate hosting)
2. **Multimodal AI**: Single model for both chat and vision
3. **Monthly Granularity**: Real-time month-by-month filtering
4. **Natural Language**: Conversational expense tracking
5. **Zero External APIs**: Fully self-contained on Cloudflare
6. **Edge-First**: Sub-100ms responses globally

---

---

## 🔗 Links

- **Live Demo**: [https://finance-agent.aryaninus.workers.dev](https://finance-agent.aryaninus.workers.dev)

---

## 📄 License

MIT License - feel free to use this project for learning or building your own applications!

---


---


