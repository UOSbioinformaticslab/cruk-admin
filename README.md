# CRUK Admin Dashboard

A modern Next.js admin dashboard for managing users, teams, roles, and cancer type filters.

## Features

- **Users Management**: Create, read, update, and delete users
- **Teams Management**: Manage teams with full CRUD operations
- **Roles Management**: Handle roles and permissions
- **Cancer Type Filters**: View hierarchical cancer type filter data
- **Modern UI**: Built with Tailwind CSS and Lucide icons
- **Type Safety**: Full TypeScript support
- **API Integration**: Connected to the backend API at `http://localhost:8100/api`

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running at `http://localhost:8100/api`

### Installation

1. Clone the repository and navigate to the project:
```bash
cd cruk-admin
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your API URL if different:
```
NEXT_PUBLIC_API_URL=http://localhost:8100/api
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
cruk-admin/
├── app/                    # Next.js app directory
│   ├── users/             # Users management page
│   ├── teams/             # Teams management page
│   ├── roles/             # Roles management page
│   ├── cancer-type-filters/ # Cancer type filters page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard home
│   └── providers.tsx      # React Query provider
├── components/            # React components
│   ├── layout/            # Layout components (Sidebar, DashboardLayout)
│   ├── users/             # User-specific components
│   ├── teams/             # Team-specific components
│   ├── roles/             # Role-specific components
│   └── ui/                 # Reusable UI components
├── lib/                    # Utilities and configurations
│   ├── api-client.ts      # API client with all endpoints
│   └── types.ts           # TypeScript type definitions
└── public/                # Static assets
```

## API Endpoints

The dashboard connects to the following API endpoints:

### Users
- `GET /api/v1/users` - List users
- `GET /api/v1/users/{id}` - Get user
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Teams
- `GET /api/v1/teams` - List teams
- `GET /api/v1/teams/{id}` - Get team
- `POST /api/v1/teams` - Create team
- `PUT /api/v1/teams/{id}` - Update team
- `DELETE /api/v1/teams/{id}` - Delete team

### Roles
- `GET /api/v1/roles` - List roles
- `GET /api/v1/roles/{id}` - Get role
- `POST /api/v1/roles` - Create role
- `PUT /api/v1/roles/{id}` - Update role
- `DELETE /api/v1/roles/{id}` - Delete role

### Cancer Type Filters
- `GET /api/v1/cancer-type-filters` - List filters
- `GET /api/v1/cancer-type-filters/{id}` - Get filter

## Authentication

The API client automatically handles authentication tokens. To authenticate:

1. The token should be stored in localStorage as `auth_token`
2. The API client will automatically include the token in the `Authorization` header
3. If you receive a 401 response, you'll be redirected to `/login`

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Technologies Used

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **Lucide React** - Icons

## Notes

- The dashboard assumes the API is running at `http://localhost:8100/api`
- Authentication tokens are stored in localStorage
- All API calls include error handling and automatic token management
- The UI is responsive and works on desktop and tablet devices
