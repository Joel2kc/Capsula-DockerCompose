# Capsula 🕰️

> Time-locked messages and media, minted as NFTs on the Hedera blockchain.

## What is Capsula?

Capsula is a Web3 application that lets users create encrypted time capsules, lock them to a specific date, and mint them as NFTs on the Hedera blockchain. The content stays encrypted until the unlock date passes, and only the NFT owner can decrypt it. Not even the platform can read what is inside.

The idea is straightforward: you write a message, attach media if you want, set a future date, and mint the capsule as an NFT. When that date arrives, whoever holds the NFT at that point can open it. The blockchain handles ownership and access control, IPFS stores the content, and the backend ties everything together.

Ownership of a capsule is transferable like any other NFT. You can send one to someone else and they become the only person who can open it when the time comes. This makes Capsula useful for anything from letters to a future self, to surprise messages for other people, to time-delayed digital gifts.

## Tech Stack

**Frontend**

React and Vite, styled with Tailwind CSS. Wallet connection is handled through Wagmi and AppKit for Hedera wallet integration. Framer Motion handles page transitions and animations.

**Backend**

FastAPI with Python. MongoDB is used for data storage with Beanie as the ODM. File and media content is stored on IPFS through Infura. Encryption is applied at the API layer before any content leaves the server.

**Blockchain**

Solidity smart contracts deployed on Hedera, built and managed with Hardhat. The contracts handle NFT minting, ownership tracking, and time-based access control. The dual metadata system keeps NFT metadata public while the actual capsule content stays encrypted and private.

**Infrastructure**

The entire stack runs in Docker containers managed with Docker Compose. The backend and frontend each have their own Dockerfile, and MongoDB runs as a containerised service using the official image directly. A named volume keeps database data alive across container restarts.

The frontend uses a multi-stage Docker build. The first stage uses Node to compile the React and Vite application into static files. The second stage copies only that compiled output into a clean Nginx image and discards everything else, including node_modules and all build tooling. This keeps the final image significantly smaller than it would be if Node were shipped into production.

All three services communicate over a shared Docker network. Docker resolves service names as hostnames on this network, so the backend reaches MongoDB as `mongo` rather than `localhost`, which is a distinction that matters inside a containerised environment.

## Running Locally with Docker

Docker is the recommended way to run Capsula locally. It is the only method that requires nothing installed on your machine beyond Docker itself. One command starts the full stack.

**Prerequisites**

Docker and Docker Compose. That is all.

**Setup**

Clone the repository:

```bash
git clone https://github.com/Joel2kc/Capsula-DockerCompose
cd capsula
```

Copy the environment file and fill in your credentials:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in the required values. The environment variables section below explains each one.

Start everything:

```bash
docker compose up --build
```

The first build takes a few minutes because Docker pulls base images and installs dependencies. Every build after that is faster because Docker caches layers and only rebuilds what has changed.

**Services and ports**

| Service | Address |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (auto-generated) | http://localhost:8000/docs |
| MongoDB | localhost:27017 |

**Stopping the stack**

```bash
# Stop all containers but keep your database data intact
docker compose down

# Stop everything and delete the database volume as well
docker compose down -v
```

## Environment Variables

All variables live in `backend/.env`. Copy `backend/.env.example` to get the full list with empty values ready to fill in.

| Variable | Description |
|---|---|
| `secret_key` | A random secret string used for internal security. Generate one by running: `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `ipfs_project_id` | Your Infura IPFS project ID |
| `ipfs_project_secret` | Your Infura IPFS project secret |
| `ipfs_gateway` | IPFS gateway URL. Defaults to `https://ipfs.infura.io` |
| `hedera_capsula_address` | The deployed contract address on Hedera |
| `hedera_testnet_url` | Hedera testnet RPC URL |
| `hedera_mainnet_url` | Hedera mainnet RPC URL |
| `private_key` | Wallet private key used for contract interaction |
| `etherscan_api_key` | Etherscan API key for contract verification |

The `db_url` does not need to be set when running with Docker. The compose file sets it automatically to point at the MongoDB container using Docker's internal networking.

## Contract Deployment

The smart contracts in the `contract` folder are not part of the Docker setup, and intentionally so. Hardhat is a deployment tool, not a running service. Once a contract is deployed to Hedera, it lives on that network and the backend interacts with it directly through the RPC URL. There is nothing to containerise.

To compile and deploy:

```bash
cd contract
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network hederaTestnet
```

Once deployed, copy the contract address and add it to `backend/.env` as `hedera_capsula_address`.

## Running Without Docker

If you prefer to run services individually during development:

**Backend**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

You will need MongoDB running locally or a remote connection string. Update `db_url` in `backend/.env` to point at your MongoDB instance.

## Project Structure

```
capsula/
├── backend/                # FastAPI application
│   ├── Dockerfile
│   ├── .env.example
│   └── requirements.txt
├── contract/               # Hardhat project and Solidity contracts
│   └── hardhat.config.js
├── frontend/               # React and Vite application
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

## Use Cases

**Personal**

Writing a letter to your future self, setting milestone goals you want to revisit, or recording a personal reflection you want to open years from now.

**Gifts and surprises**

Creating a birthday message someone cannot open until the day arrives, or a graduation gift that unlocks on a specific date.

**Digital legacy**

Storing important documents, memories, or creative work with permanent, blockchain-backed ownership that can be passed on.

**Professional**

Project reveal timelines, course completion certificates, or research publications with a scheduled release date.

## Future Plans

- Support for additional blockchain networks beyond Hedera
- Social features for community capsule discovery
- Native mobile applications for iOS and Android
- Enterprise tier for secure document storage workflows

## License

MIT License. See the LICENSE file for details.

## Infrastructure Contribution

The containerisation and local development environment for this project was implemented using Docker and Docker Compose. This covers the backend, frontend, and database services, and includes multi-stage image builds, internal service networking, environment variable configuration, and persistent data storage via named volumes. The contract deployment workflow was deliberately kept outside of Docker since Hardhat is a one-time deployment tool rather than a running service, and that distinction is reflected in the project structure.

## Acknowledgments

The original application was developed for the Hedera Hackathon Africa by https://github.com/timileyindev

Thanks to Hedera Hashgraph for the blockchain infrastructure, Infura and the IPFS ecosystem for decentralised storage, OpenZeppelin for audited smart contract standards, and the React and Vite communities for the tooling that makes frontend development enjoyable.