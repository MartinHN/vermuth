concurrently --kill-others   -i -r "cd server && DEBUG=vermuth:* npm run start:watch" "cd viewer && npm run serve" "cd API && node gen.js"
