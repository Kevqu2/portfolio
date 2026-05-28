# Portfolio Website

A modern, responsive portfolio website built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎨 Dark and Light mode toggle
- 📱 Fully responsive design
- ⚡ Fast and optimized with Next.js
- 🎯 Clean, professional UI/UX
- 📜 Smooth scrolling sections

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Add your character image:
   - Place `character_kevin.jpg` in the `public/` directory

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
portfolio/
├── app/
│   ├── globals.css      # Global styles and theme variables
│   ├── layout.tsx       # Root layout with theme provider
│   └── page.tsx         # Main page with all sections
├── components/
│   ├── Header.tsx              # Header with name and theme toggle
│   ├── HeroSection.tsx         # Hero section with introduction
│   ├── AboutSection.tsx        # About me section
│   ├── SocialLinks.tsx         # Social media icons
│   ├── ExperienceSection.tsx   # Work experience
│   ├── ProjectsSection.tsx     # Projects showcase
│   ├── ExtracurricularsSection.tsx  # Extracurricular activities
│   ├── TechnicalSkillsSection.tsx   # Technical skills
│   └── ThemeProvider.tsx       # Dark/light mode provider
└── public/
    └── character_kevin.jpg     # Character image (add your image here)
```

## Customization

- Update social media links in `components/SocialLinks.tsx`
- Modify content in respective section components
- Adjust colors and styling in `app/globals.css` and Tailwind classes
- Change theme defaults in `components/ThemeProvider.tsx`

## Build for Production

```bash
npm run build
npm start
```

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide React (icons)
