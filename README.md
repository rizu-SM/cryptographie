# Cryptographie

A cryptography learning suite with a Python Flask backend and a React + Vite frontend. This project demonstrates classical, symmetric, asymmetric, signature, and secret sharing algorithms through an interactive web interface.

## Project structure

- `backend/` - Flask API server
  - `App.py` - Flask application entrypoint
  - `requirements.txt` - Python dependencies
  - `routes/` - API route blueprints
  - `Algorithmes/` - cryptographic algorithm implementations
    - `Simple/` - classical ciphers: César, Affine, Hill, Playfair, Vigenère
    - `symetrique/` - symmetric ciphers: AES, DES, RC4
    - `Asymetrique/` - public-key algorithms: RSA, ElGamal
    - `Signature/` - digital signatures: RSA, ElGamal, DSA
    - `PartageSecret/` - secret sharing and key exchange: Diffie-Hellman, Shamir
    - `Hachage/` - hashing algorithms: MD4, MD5, SHA1, SHA256, SHA512

- `frontend/` - React + Vite application
  - `src/` - demo components and application logic
  - `package.json` - Node dependencies and scripts
  - `vite.config.js` - Vite configuration

- `docker-compose.yml` - local development container orchestration for backend and frontend

## Features

- Classical ciphers: César, Affine, Vigenère, Hill, Playfair
- Symmetric encryption: AES, DES, RC4
- Asymmetric crypto: RSA, ElGamal
- Digital signatures: RSA, ElGamal, DSA
- Secret sharing / key exchange: Diffie-Hellman, Shamir
- Hashing support in backend via algorithms folder
- React UI that communicates with the Flask backend at `http://localhost:5000/api`

## Prerequisites

- Docker and Docker Compose
- Python 3.11+ (if running backend without Docker)
- Node.js 18+ (if running frontend without Docker)

## Run with Docker Compose

From the repository root:

```bash
docker compose up --build
```

Then open the frontend at:

```text
http://localhost:5173
```

## Run locally without Docker

### Backend

1. Create and activate a Python virtual environment.
2. Install dependencies:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
```

3. Run the backend:

```bash
cd backend
python App.py
```

The backend listens on `http://0.0.0.0:5000`.

### Frontend

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the app in the browser at:

```text
http://localhost:5173
```

## Notes

- The frontend is configured to call the backend API at `http://localhost:5000/api`.
- Use the sidebar in the React app to select algorithms and provide keys or input text.
- The Docker Compose setup mounts source folders for live development.

## License

This repository does not include a license file. Add one if you plan to share or publish the project.
