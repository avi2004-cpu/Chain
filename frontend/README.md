# Frontend

Move the existing ChainGuard React app (Vite project) into this folder,
keeping its internal structure as-is:

```
frontend/
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── lib/
│   ├── pages/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

Once the backend's REST API is live, `src/lib/web3.js` gets replaced with
a new `src/lib/api.js` that calls the backend instead of MetaMask/Ethers
directly. See docs/api-contract.md for the exact endpoint shapes to call.
