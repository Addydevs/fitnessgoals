# Backend Application

This is the backend application for the multi-server sample project. It is built using TypeScript and serves as the server-side component that interacts with the front-end application.

## Project Structure

```
backend
├── src
│   ├── server.ts          # Entry point of the application
│   ├── controllers        # Contains controllers for handling requests
│   │   └── index.ts
│   ├── routes             # Defines application routes
│   │   └── index.ts
│   └── types              # Type definitions used throughout the application
│       └── index.ts
├── package.json           # NPM package configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Compile TypeScript:**
   ```
   npm run build
   ```

4. **Run the server:**
   ```
   npm start
   ```

## Usage

Once the server is running, you can access the API endpoints defined in the routes. Refer to the `src/routes/index.ts` file for the available routes and their corresponding handlers.

## Contributing

Feel free to submit issues or pull requests if you have suggestions or improvements for the project.