# BrandOrb AI - Frontend

BrandOrb AI is an AI-powered assistant that helps investors and business owners turn ideas into market-ready products through a comprehensive 10-stage product development lifecycle.

## Features

- 🚀 **Modern Landing Page** - Compelling hero section with features, statistics, and FAQ
- 🎯 **Interactive Onboarding** - Step-by-step guided flow with AI-powered questions
- 💫 **Animated UI** - Smooth Framer Motion animations and transitions
- 🎨 **Beautiful Design** - Modern, responsive design with Tailwind CSS
- 🌙 **Dark Mode** - Full dark mode support
- 📱 **Mobile First** - Fully responsive across all devices
- ⚡ **Fast Performance** - Optimized Next.js 14+ with App Router

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── onboarding/
│   │   └── page.tsx            # Onboarding flow
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── landing/                # Landing page components
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Stats.tsx
│   │   ├── FAQ.tsx
│   │   └── Footer.tsx
│   └── onboarding/            # Onboarding components
│       ├── StepIndicator.tsx
│       ├── QuestionCard.tsx
│       └── AnimatedOrb.tsx
├── lib/
│   └── utils.ts               # Utility functions
└── types/
    └── index.ts               # TypeScript type definitions
```

## Key Components

### Landing Page
- **Header**: Navigation with mobile menu
- **Hero**: Main headline with CTA buttons
- **Features**: Key benefits and features
- **Stats**: Animated statistics
- **FAQ**: Expandable questions
- **Footer**: Links and newsletter signup

### Onboarding Flow
- **StepIndicator**: Progress visualization
- **QuestionCard**: Dynamic question interface
- **AnimatedOrb**: AI thinking animation

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Components

1. Create component in appropriate directory
2. Use TypeScript for type safety
3. Follow existing patterns for styling
4. Add animations with Framer Motion
5. Ensure mobile responsiveness

## Deployment

This project can be deployed on:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Any static hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
