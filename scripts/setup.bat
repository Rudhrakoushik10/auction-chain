@echo off
echo Setting up AuctionChain 4-Server Environment (Blockchain, Backend/AI, Oracle, and Frontend)...
call npm install
cd blockchain && call npm install
cd ../backend && pip install -r requirements.txt
cd ../oracle && pip install -r requirements.txt
cd ../frontend && call npm install
cd ..
echo Setup complete.

