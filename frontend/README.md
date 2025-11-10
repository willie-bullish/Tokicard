# Tokicard - Waitlist Landing Page

A modern JavaScript-based waitlist landing page for Tokicard, built with vanilla JavaScript and Vite.

## Features

- 🎨 Modern, responsive design
- 📱 Mobile-first approach
- ✨ Smooth animations and transitions
- 📝 Form validation
- 🔗 Referral link generation
- 🔐 Email/Password authentication
- 🔵 Google OAuth Sign-In
- 🚀 Fast development with Vite

## Project Structure

```
tokicard/
├── public/              # Static assets
│   ├── tokilogo.png
│   └── customercard.png
├── src/
│   ├── api/            # API handlers
│   │   └── waitlist.js
│   ├── pages/          # Page components
│   │   ├── waitlist.js
│   │   └── thankyou.js
│   ├── router.js       # Client-side routing
│   ├── main.js         # Entry point
│   └── styles.css      # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Google OAuth Setup

To enable Google Sign-In:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure the OAuth consent screen
6. Create an OAuth 2.0 Client ID (Web application)
7. Add your authorized JavaScript origins and redirect URIs
8. Copy your Client ID
9. Create a `.env` file in the `frontend` directory:
```bash
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_API_URL=http://localhost:4000/api
```

## API Integration

All network requests are routed through `VITE_API_URL` (default `http://localhost:4000/api`).  
Set this to the Fastify backend you configured in `/backend`. The frontend automatically handles:

- Waitlist registration (`POST /waitlist`)
- OTP verify/resend (`POST /verify-otp`, `/resend-otp`)
- Email/password login (`POST /auth/login`)
- Authenticated quest APIs (`GET /quests`, `POST /quests/:slug/complete`)

If you self-host the backend, update `VITE_API_URL` accordingly (e.g., `https://api.tokicard.com/api`).

## Pages

### Waitlist Page (`/`)
- Form with name, email, and phone number
- Client-side validation
- Responsive design

### Dashboard Page (`/dashboard`)
- Personalized card display
- Referral link sharing (`/register?ref=CODE`)
- Social media quest actions
- Copy-to-clipboard functionality and referral list with pagination

## Customization

### Social Media Links

Update the social media URLs in `src/pages/thankyou.js`:
```javascript
twitterBtn.addEventListener('click', () => {
  window.open('https://twitter.com/YOUR_HANDLE', '_blank');
});
```

### Styling

The project uses utility classes similar to Tailwind CSS. You can:
- Modify `src/styles.css` for global styles
- Add custom classes as needed
- Or integrate Tailwind CSS for more utility classes

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

