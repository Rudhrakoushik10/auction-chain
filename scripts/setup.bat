@echo off
echo Setting up AuctionChain 4-Server Environment (Blockchain, Backend/AI, Oracle, and Frontend)...
cd blockchain && call npm install
cd ../backend && pip install -r requirements.txt
cd ../oracle && pip install -r requirements.txt
cd ../frontend && call npm install
echo Setup complete.
