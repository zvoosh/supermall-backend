## SuperMall Backend
A Node.js backend for SuperMall — a marketplace-style application. This service handles API endpoints, data persistence, and integration with Firebase.
---
## About
This repository contains the backend server for the SuperMall application. It provides RESTful APIs to manage products, users, orders, and more. It uses Firebase for data storage and authentication and a Node.js server to handle the backend logic.
---
## Features
- User authentication (via Firebase)
- CRUD operations (products, shops)
- REST API architecture
- Environment-based configuration
- Modular and extensible structure — easy to add new routes and services
---
## Tech Stack
- Node.js – JavaScript runtime
- Express.js – Web framework
- Firebase SDK – For database and authentication
- JavaScript – Server-side code
---
## Getting Started

### Prerequisites

Make sure you have the following installed:
- Node.js (>= 14.x recommended)  
- npm (or yarn)
- A Firebase project (for database and auth)

### Installation

1. Clone the repo:
```bash
git clone https://github.com/zvoosh/supermall-backend.git
cd supermall-backend
```
2. Install dependencies:
```bash
npm install
# or
yarn install
```
### Configuration
1. Create a .env file in the root directory.
2. Add the required environment variables:
```bash
FIREBASE_API_KEY=your_firebase_api_key  
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com  
FIREBASE_PROJECT_ID=your_project_id  
FIREBASE_STORAGE_BUCKET=your_bucket  
FIREBASE_MESSAGING_SENDER_ID=...  
FIREBASE_APP_ID=...  
PORT=3000
```
3. Check firebase.js to ensure the Firebase SDK is initialized correctly with your credentials.
### Running
```bash
npm start
# or 
node server.js
```
---
## API Endpoints
Here’s a rough outline of API endpoints — adjust to your actual implementation:
| Method   | Endpoint               | Description                               |
| -------- | ---------------------- | ----------------------------------------- |
| `GET`    | `/`                    | Health check                              |
| `POST`   | `/api/admin`           | Register                                  |
| `POST`   | `/api/login`           | Login                                     |
| `POST`   | `/api/stores`          | Create a new store                        |
| `GET`    | `/api/stores`          | Get all stores                            |
| `GET`    | `/api/stores/:id`      | Get single store                          |
| `PUT`    | `/api/stores/:id`      | Update single store                       |
| `DELETE` | `/api/stores/:id`      | Delete a store                            |
| `POST`   | `/api/product`         | Create a new product                      |
| `GET`    | `/api/products`        | Get all products                          |
| `GET`    | `/api/product/:id`     | Get a product                             |
| `POST`   | `/api/products/upload` | Upload a product image                    |
| `PUT`    | `/api/product/:id`     | Update a product                          |
| `DELETE` | `/api/product/:id`     | Delete a product                          |

---
Built with ❤️ by zvoosh.
