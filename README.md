# Foxall PO UI

A modern, responsive Purchase Order management system built with React, TypeScript, and Vite. This application provides a comprehensive interface for managing purchase orders, entities, and users with role-based authentication.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-06B6D4?logo=tailwindcss)

## Features

- **Authentication System**
  - JWT-based authentication
  - Secure token storage with httpOnly cookie support
  - Role-based access control (Admin, User, Manager)
  - Protected routes

- **Purchase Orders Management**
  - List all purchase orders with pagination
  - Create, edit, and view purchase order details
  - Status tracking (Draft, Pending, Approved, Rejected, etc.)
  - Line items management

- **Entities Management**
  - CRUD operations for business entities
  - Entity details and contact information
  - Tax and registration details

- **Users Management**
  - User administration (Admin only)
  - Role assignment
  - Profile management

- **UI/UX**
  - Responsive design with Tailwind CSS
  - Modern icon system (Font Awesome, Tabler Icons)
  - Country flags support (Flag Icon CSS)
  - Loading states and error handling
  - Clean and intuitive interface

## Tech Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript 5
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **Routing**: React Router DOM 6
- **HTTP Client**: Native Fetch API with custom client
- **Icons**: Font Awesome, Tabler Icons, Flag Icon CSS
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone git@github.com:ausangshukla/foxall_po_ui.git
cd foxall_po_ui
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
VITE_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Project Structure

```
foxall_po_ui/
├── public/                 # Static assets
├── src/
│   ├── api/               # API client and service functions
│   │   ├── auth.ts        # Authentication API
│   │   ├── client.ts      # HTTP client with interceptors
│   │   ├── entities.ts    # Entities API
│   │   ├── purchase-orders.ts  # Purchase orders API
│   │   └── users.ts       # Users API
│   ├── assets/            # Fonts, images, styles
│   │   ├── fonts/         # Font Awesome, Tabler Icons, Flag Icons
│   │   └── styles/        # Global styles
│   ├── components/        # React components
│   │   ├── common/        # Shared components (LoadingSpinner, etc.)
│   │   └── Layout/        # Layout components (Navbar, Layout)
│   ├── config/            # Configuration files
│   ├── contexts/          # React contexts (AuthContext)
│   ├── lib/               # Utility functions
│   │   ├── jwt.ts         # JWT utilities
│   │   └── storage.ts     # Local storage utilities
│   ├── pages/             # Page components
│   │   ├── entities/      # Entity pages
│   │   ├── purchase-orders/  # Purchase order pages
│   │   └── users/         # User pages
│   ├── router/            # React Router configuration
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main App component
│   └── main.tsx           # Application entry point
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

## API Integration

The application communicates with a REST API. Configure the API base URL in your `.env` file:

```env
VITE_API_URL=https://api.example.com/api
```

### Authentication Flow

1. User logs in with email/password
2. API returns JWT token
3. Token is stored securely and attached to subsequent requests
4. Token expiry is handled automatically with refresh mechanism

## Development

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Code Style

This project uses:
- **ESLint** for linting TypeScript and React code
- **Prettier** for code formatting
- TypeScript strict mode for type safety

### Adding New Features

1. Create types in `src/types/api.ts`
2. Add API functions in `src/api/`
3. Create pages in `src/pages/`
4. Update routing in `src/router/index.tsx`
5. Add navigation links in `src/components/Layout/Navbar.tsx`

## Authentication & Authorization

### Roles

- **Admin**: Full access to all features including user management
- **Manager**: Can manage purchase orders and entities
- **User**: Can view and create purchase orders

### Protected Routes

Routes are protected based on authentication status and user roles. See `src/router/index.tsx` for route configurations.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For support, please contact the development team or create an issue in the repository.

---

Built with ❤️ using React, TypeScript, and Vite.