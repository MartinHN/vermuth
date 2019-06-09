apt update
apt --yes --force-yes upgrade

apt --yes --force-yes install git

#install node 10 LTS
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs

#sudo apt-get install gcc g++ make ## already in pi





############
## Vermuth
#########


sudo apt-get install pigpio

# sudo npm install -g typescript
# if ssh
#ssh-keygen -t rsa -b 4096 -C "lampignon@example.com"
#eval "$(ssh-agent -s)"
#ssh-add -K ~/.ssh/id_rsa

git clone https://github.com/MartinHN/vermuth.git



### to auto start add following line in /etc/rc.local
#sudo node /home/pi/vermuth/server/dist/server.js &
