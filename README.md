# 💰 Finly - Personal Finance App

**Finly** is a modern personal finance management application designed for college students and young adults. Track your expenses, set savings goals, learn financial literacy, and motivate friends!

## 🌟 Features

- 📊 **Dashboard**: Track income, expenses, balance, and savings progress
- 💳 **Budgeting**: Create transactions, manage categories, and track spending
- 🎯 **Savings Goals**: Set and track multiple savings goals
- 👥 **Friend Sharing**: Share public savings goals with friends for motivation
- 📚 **Learning Center**: Educational modules on personal finance
- 🤖 **AI Assistant**: Get answers to your financial questions
- 🎨 **Beautiful UI**: Modern, responsive design with Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([sign up free](https://supabase.com))

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd finlyfeatures
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   
   Follow the detailed guide in **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** or use the quick setup:
   
   ```bash
   # Interactive setup
   ./setup_supabase.sh
   
   # Or manually create .env file:
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run database migrations**
   
   ```bash
   # Display migrations
   ./run_migrations.sh
   ```
   
   Then copy and run each migration in the [Supabase SQL Editor](https://app.supabase.com)

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5173
   ```

## 📦 Database Schema

The application uses the following main tables:

- **profiles**: User profile information
- **transactions**: Income and expense records
- **budgets**: Category budgets and limits
- **savings_accounts**: Savings goals with progress tracking
- **friendships**: Friend connections for social features
- **learning_modules**: Educational content
- **user_learning_progress**: User completion tracking
- **ai_questions**: AI assistant Q&A history
- **budget_profile**: Personalized budgeting questionnaire results

All tables have Row Level Security (RLS) enabled for data protection.

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Icons**: Lucide React
- **Build**: Vite

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check with TypeScript

## 🔒 Environment Variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

⚠️ **Never commit `.env` to version control!**

## 📚 Documentation

- [Supabase Setup Guide](SUPABASE_SETUP.md) - Complete setup instructions
- [Migrations](supabase/migrations/) - Database migration files

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

Built with ❤️ using React, Supabase, and Tailwind CSS.
