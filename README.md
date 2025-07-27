# CogniCare Backend

A Node.js backend API built with Express, Prisma, and PostgreSQL for the CogniCare application.

## 🚀 Features

- **Express.js** - Fast, unopinionated web framework
- **Prisma** - Modern database toolkit and ORM
- **PostgreSQL** - Powerful, open source object-relational database
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger
- **Environment Configuration** - Secure environment variable management

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd be_cognicare
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/cognicare_db?schema=public"
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up PostgreSQL database**
   - Create a PostgreSQL database named `cognicare_db`
   - Update the `DATABASE_URL` in your `.env` file with your database credentials

5. **Generate Prisma client**
   ```bash
   npm run prisma:generate
   ```

6. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

## 🏃‍♂️ Running the Application

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## 📚 API Endpoints

### Health Check
- `GET /health` - Check if the server is running

### API Info
- `GET /api` - Get API information and available endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🗄️ Database

### Prisma Commands

- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:push` - Push schema changes to database

### Database Schema

The current schema includes a basic `User` model:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

## 🧪 Testing

```bash
npm test
```

## 📁 Project Structure

```
be_cognicare/
├── lib/
│   └── prisma.js          # Prisma client configuration
├── prisma/
│   └── schema.prisma      # Database schema
├── routes/
│   ├── index.js           # Main routes file
│   └── users.js           # User routes
├── index.js               # Main server file
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:push` - Push schema changes to database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues or have questions, please open an issue in the repository. 