export VERMUTH_ARGS="--module /home/tinmar/Dev/abbayLight/node/build/index.js"

echo "tsc"
cd ../abbayLight/node/
rm -rf ./build/ && tsc

cd -
cd server
npm run start:watch
