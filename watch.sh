concurrently -i "cd server && DEBUG=localtunnel:* npm run start:watch" "cd viewer && npm run serve" "cd API && node gen.js"
