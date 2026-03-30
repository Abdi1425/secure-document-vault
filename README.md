# 🔐 Secure Document Vault

A secure Node.js web application that allows users to securely upload documents, compute cryptographic hashes, verify file integrity, and apply digital signatures. 

Built with the goal of ensuring that uploaded files are authentic, trackable, and free from corruption or tampering.

## ✨ Features

- **User Authentication:** Secure registration and login using JWT and password hashing (bcrypt).
- **Document Management:** Upload documents and manage them in a personal vault.
- **Duplicate Detection & Savings:** The system prevents you from redundantly uploading the exact same file, saving disk space while providing an option to bypass if truly desired.
- **Cryptographic Hashing:** Automatically computes `MD5`, `SHA1`, and `SHA256` checksum hashes for every uploaded document to strictly track file contents.
- **Integrity Verification:** Verify at any time whether a file has been tampered with by strictly cross-referencing its current live hashes with its original upload hashes from the database.
- **Digital Signatures:** Generate personal RSA key pairs associated with your account to cryptographically sign documents.

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Templating:** Handlebars (`hbs`)
- **File Uploads:** Multer
- **Cryptography:** Node `crypto`, `bcryptjs`, `jsonwebtoken`

## ⚙️ Setup and Installation

### 1. Prerequisites
- Node.js installed on your machine.
- MySQL server installed and running.

### 2. Clone the Repository
```bash
git clone <your-repository-url>
cd secure-document-vault
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Variables
Create a `.env` file in the root directory and add your MySQL database credentials and application settings:

```env
PORT=3000
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE=secure_vault_db
JWT_SECRET=your_super_secret_jwt_key
```

### 5. Setup Database
Ensure the database configured in the `.env` file exists. (Import any corresponding `.sql` files if you have pre-configured schemas for `users`, `documents`, `user_keys`, and `digital_signatures`).

### 6. Run the Application
Start the server using Node:
```bash
node index.js
```
Or if you have nodemon installed globally for development:
```bash
npx nodemon index.js
```

The app will be accessible at `http://localhost:3000`.

## 📜 License
ISC License
