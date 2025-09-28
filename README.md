# 💰 AI-Powered Personal Finance Assistant

A comprehensive financial management application built on **Cloudflare's edge infrastructure** with intelligent AI capabilities, real-time analytics, and beautiful modern UI.

🚀 **Live Demo**: [https://finance-agent.aryaninus.workers.dev](https://finance-agent.aryaninus.workers.dev)

## ✨ Features

### 🤖 **Intelligent AI Assistant**
- **Llama 3.3 Integration**: Powered by Cloudflare Workers AI
- **Context-Aware**: AI has access to your complete financial data
- **Natural Language**: Add expenses with simple commands like "Add $50 grocery expense"
- **Personalized Advice**: Get tailored financial recommendations based on your spending patterns

### 📊 **Comprehensive Analytics**
- **Monthly Spending Trends**: Visual bar charts showing spending patterns over time
- **Category Breakdown**: Detailed analysis of spending by category with percentages
- **Budget Performance**: Real-time tracking against your custom budgets
- **AI-Generated Insights**: Smart recommendations based on your financial data

### 💳 **Budget Management**
- **Customizable Budgets**: Set individual budgets for each spending category
- **Visual Progress Tracking**: Color-coded progress bars and status indicators
- **Real-time Updates**: Instant feedback when approaching or exceeding budget limits
- **Smart Categorization**: Automatic expense categorization using AI

### 📱 **Modern User Interface**
- **Three-Tab Layout**: AI Assistant, Budget Manager, and Analytics
- **Responsive Design**: Works perfectly on desktop and mobile
- **Beautiful Animations**: Smooth transitions and interactive elements
- **Real-time Notifications**: Instant feedback for all actions

## 🏗️ **Architecture**

### **Cloudflare Edge Stack**
- **Workers**: Serverless backend with sub-10ms startup time
- **Durable Objects**: Persistent state management for transactions and budgets
- **Workers AI**: Native Llama 3.3 integration without external API keys
- **Pages**: Static asset hosting for the frontend

### **Technology Stack**
- **Backend**: TypeScript, Cloudflare Workers, Durable Objects
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **AI**: Cloudflare Workers AI (Llama 3.3-70B-Instruct)
- **Database**: Durable Objects key-value storage
- **Deployment**: Wrangler CLI

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 20+ 
- npm or yarn
- Cloudflare account
- Wrangler CLI

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/aryaninus123/ai-finance-assistant.git
   cd ai-finance-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Cloudflare**
   ```bash
   npx wrangler login
   ```

4. **Deploy to Cloudflare**
   ```bash
   npm run deploy
   ```

### **Development**

```bash
# Start local development server
npm run dev

# Build TypeScript
npm run build

# Deploy to production
npm run deploy
```

## 📖 **Usage**

### **Adding Transactions**
- **Chat Interface**: "Add $25 coffee expense" or "Add $1000 salary income"
- **Budget Manager**: Use the form to add transactions with specific categories
- **Smart Categorization**: AI automatically categorizes your expenses

### **Managing Budgets**
- Click the ⚙️ settings icon on any budget card
- Set custom budget amounts for each category
- Watch real-time progress bars update

### **Viewing Analytics**
- **Monthly Trends**: See spending patterns over the last 6 months
- **Category Analysis**: Understand where your money goes
- **Budget Performance**: Track your progress against set budgets
- **AI Insights**: Get personalized financial recommendations

## 🎯 **Key Features Showcase**

### **Intelligent Expense Parsing**
```
User: "Add $75 restaurant dinner expense"
AI: ✅ Successfully added $75 food expense for "restaurant dinner"
```

### **Real-time Budget Tracking**
- Food: $270/$400 (67.5%) ✅ On track
- Transportation: $69/$250 (27.6%) ✅ On track
- Housing: $80/$1200 (6.7%) ✅ On track

### **Smart Financial Insights**
> "Based on your financial data: You currently have a balance of $541.00. You've spent $459.00 across 13 transactions. Your highest spending category is food at $270.00. Your finances look healthy!"

## 🔧 **Configuration**

### **Environment Variables**
```bash
CLOUDFLARE_API_TOKEN=your_api_token_here
ENVIRONMENT=development
```

### **Wrangler Configuration**
```toml
name = "finance-agent"
main = "src/index.ts"
compatibility_date = "2024-09-27"
compatibility_flags = ["nodejs_compat"]

[ai]
binding = "AI"

[[durable_objects.bindings]]
name = "FinanceAgent"
class_name = "FinanceAgent"
```

## 📊 **API Endpoints**

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/` | GET | Main application interface |
| `/api/advice` | POST | AI chat and expense parsing |
| `/api/add-transaction` | POST | Add new transaction |
| `/api/get-summary` | GET | Financial summary and transactions |
| `/api/set-budget` | POST | Update category budget |
| `/api/get-budgets` | GET | Retrieve all budgets |

## 🎨 **Screenshots**

### **AI Assistant**
- Natural language expense tracking
- Intelligent financial advice
- Real-time chat interface

### **Budget Manager**
- Visual budget cards with progress bars
- Monthly transaction filtering
- Easy budget customization

### **Analytics Dashboard**
- Monthly spending trend charts
- Category breakdown analysis
- Budget performance metrics

## 🚀 **Performance**

- **Worker Startup**: ~11ms cold start
- **Response Time**: Sub-100ms for most operations
- **Global Edge**: Deployed to 200+ Cloudflare locations
- **Scalability**: Handles thousands of concurrent users

## 🛠️ **Development**

### **Project Structure**
```
finance-agent/
├── src/
│   ├── index.ts          # Main worker entry point
│   └── simple-agent.ts   # Core Durable Object logic
├── public/               # Static assets (if any)
├── package.json         # Dependencies and scripts
├── wrangler.toml        # Cloudflare configuration
└── tsconfig.json        # TypeScript configuration
```

### **Key Components**
- **FinanceAgent**: Main Durable Object handling all logic
- **AI Integration**: Cloudflare Workers AI with Llama 3.3
- **Storage**: Key-value persistence for transactions and budgets
- **Frontend**: Embedded HTML/CSS/JS served from the Worker

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Cloudflare**: For the amazing edge computing platform
- **Meta**: For the Llama 3.3 language model
- **Community**: For inspiration and feedback

## 🔗 **Links**

- **Live Demo**: [https://finance-agent.aryaninus.workers.dev](https://finance-agent.aryaninus.workers.dev)
- **Cloudflare Workers**: [https://workers.cloudflare.com](https://workers.cloudflare.com)
- **Cloudflare AI**: [https://ai.cloudflare.com](https://ai.cloudflare.com)

---

**Built with ❤️ by [Aryan Gupta](https://github.com/aryaninus123)**

*Showcasing the power of Cloudflare's edge computing platform for AI-powered applications*