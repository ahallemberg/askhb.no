# Ask Hallem-Berg Portfolio

A portfolio website built with React, TypeScript, and TailwindCSS. Features dark mode support, smooth animations, and data fetched from r2 cloudflare storage endpoint.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── DarkModeToggle.tsx
│   ├── ExperienceItem.tsx
│   ├── EducationItem.tsx
│   ├── SocialLink.tsx
│   ├── FadeIn.tsx
│   ├── LoadingSpinner.tsx
│   └── ErrorMessage.tsx
├── pages/              # Page components
│   └── Portfolio.tsx
├── hooks/              # Custom React hooks
│   └── useData.ts
├── types/              # TypeScript type definitions
│   └── props.ts
├── constants/          # App constants and endpoints
│   └── app.ts
├── config/             # Configuration files
│   └── sociallinks.json
└── App.tsx             # Main app component
```

## Getting Started

### Prerequisites

- Node.js (≥20.0.0)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd askhb.no.v2
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Data Sources

The portfolio fetches data from cloud endpoints:

- **Personal Info**: `/personalinfo.json` - Name, title, and about section
- **Experience**: `/experiences.json` - Work experience with skills
- **Education**: `/education.json` - Educational background
- **Profile Picture**: `/profilepicture.png` - Profile image

## Customization

### Social Links
Edit `src/config/sociallinks.json` to update social media links:

```json
[
  {
    "name": "GitHub",
    "url": "https://github.com/username",
    "icon": "Github"
  }
]
```

### Styling
The project uses TailwindCSS 4 with custom dark mode variants. Styles can be customized in:
- `src/index.css` - Global styles
- `tailwind.config.js` - Tailwind configuration

### Data Endpoints
Update endpoint URLs in `src/constants/app.ts`:

```typescript
export const R2_ENDPOINT = "https://your-domain.com"
```

## Deployment

This project is deployed using Cloudflare Pages with automatic CI/CD:

- **Preview Deployments**: Automatically created for all merge requests
- **Production Deployment**: Automatically deployed when merging to the main branch
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

Cloudflare Pages handles the build process and serves the static files with global CDN distribution.