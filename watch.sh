concurrently --kill-others -i -r "cd server && npm run start:watch" "cd viewer && npm run serve" "cd API && node gen.js"
