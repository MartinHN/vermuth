#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"


# these should have been run before if repo has been cloned
#apt --yes --force-yes install git
#git clone https://github.com/MartinHN/vermuth.git

if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi





apt update
apt --yes --force-yes upgrade



#install node 10 LTS
# curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
#install node 12
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
apt-get install -y nodejs

#sudo apt-get install gcc g++ make ## already in pi



pip install -r $DIR/requirements.txt

############
## Vermuth
#########


apt-get install -y pigpio

# sudo npm install -g typescript
# if ssh
#ssh-keygen -t rsa -b 4096 -C "lampignon@example.com"
#eval "$(ssh-agent -s)"
#ssh-add -K ~/.ssh/id_rsa



cd $DIR/..

sh install.sh
sh build.sh



### to auto start add following line in /etc/rc.local
#sudo node /home/pi/vermuth/run.sh &
