# Peak Brew Trading - Invoice Generator

A modern, beer-themed invoice management system built with React, Firebase, and Tailwind CSS.

## 🍺 Features

- **Firebase Authentication** - Secure login system
- **Invoice Management** - Create, edit, delete, and view invoices
- **PDF Export** - Download invoices as PDF files
- **Beer-themed UI** - Dark brown design with beer aesthetics
- **Real-time Database** - Cloud Firestore integration
- **Responsive Design** - Works on desktop and mobile
- **Modern Animations** - Smooth transitions and effects

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Firebase project setup

### Installation

1. **Clone and install dependencies:**
```bash
cd peakbrew
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Open browser:**
Navigate to `http://localhost:5173`

### Login Credentials
- **Email:** peakbrewtrading@gmail.com
- **Password:** Peak@brew123

## 🏗️ Tech Stack

- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Auth + Firestore)
- **Animations:** Framer Motion
- **PDF Generation:** jsPDF + html2canvas
- **Icons:** Lucide React
- **Routing:** React Router DOM

## 📦 Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx      # Main dashboard with invoice list
│   ├── Login.jsx         # Authentication page
│   ├── InvoiceForm.jsx   # Create/edit invoice form
│   └── InvoicePreview.jsx # Invoice preview and PDF export
├── contexts/
│   └── AuthContext.jsx   # Authentication context
├── firebase.js           # Firebase configuration
├── App.jsx              # Main app component
├── main.jsx             # Entry point
└── index.css            # Global styles
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🚀 Production Deployment

### Firebase Hosting

1. **Build the project:**
```bash
npm run build
```

2. **Deploy to Firebase:**
```bash
firebase deploy
```

### Alternative Deployment (Render, Vercel, Netlify)

1. **Build the project:**
```bash
npm run build
```

2. **Upload the `dist` folder to your hosting provider**

## 🍺 Beer Products Database

The system includes predefined beer products:

- **Barahsinghe Pilsner** (330ml/650ml bottles)
- **Barahsinghe Hazy IPA** (330ml bottles)  
- **Gorkha Premium** (330ml bottles)
- **Gorkha Strong** (500ml cans)
- **Nepal Ice Premium** (330ml bottles)

## 🔐 Security Features

- Firebase Authentication
- Firestore security rules
- User-specific data access
- Input validation
- XSS protection

## 📱 Company Information

**Peak Brew Trading**
- **Address:** 7840 Tyler Blvd, Unit 6201, Mentor, OH 44060
- **Phone:** +1 412-894-6129
- **Email:** peakbrewtrading@gmail.com

## 🎨 Design Features

- **Dark brown beer theme** with gradient accents
- **Floating beer bubble animations**
- **Responsive grid layouts**
- **Modern card-based UI**
- **Smooth transitions and hover effects**
- **Professional invoice templates**

## 🛠️ Development

### Environment Setup

1. Ensure Firebase project is configured
2. Update Firebase config in `src/firebase.js`
3. Set up Firestore database rules
4. Enable Authentication (Email/Password)

### Adding New Features

1. Create components in `src/components/`
2. Add routes in `App.jsx`
3. Update authentication logic in `AuthContext.jsx`
4. Style with Tailwind CSS classes

### Troubleshooting

**Development Server Issues:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Ensure Node.js version compatibility

**Firebase Issues:**
- Check Firebase configuration
- Verify Firestore rules
- Ensure Authentication is enabled

## 📄 License

Private project for Peak Brew Trading.

---

**Built with ❤️ and 🍺 by the Peak Brew Trading team**+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
