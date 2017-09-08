#!/bin/sh

serverId=$1
user=$2
pwd=$3

echo enter directroy $(pwd)
echo deploying authServer...
echo input serverId=$serverId,user=$user,pwd=$pwd

echo install third-party modules.
chmod +x npm-install.sh && ./npm-install.sh

echo modify configs if needed.
cd config && echo enter directroy $(pwd)

echo modify port.
yes | cp config.json.bak config.json
port=$[ 3003 + $serverId * 1000 ]
#use "" in sed command to reference variables in it
sed -i "s/3003/$port/" config.json

echo modify db name,user and password.
yes | cp mysql.json.bak mysql.json
sed -i "s/GlobalUser/GlobalUser$serverId/" mysql.json
sed -i "s/test/$user/" mysql.json
sed -i "s/123456/$pwd/" mysql.json

echo exec db script.
cd schema && echo enter directroy $(pwd)

echo modify db name,user and password
sed -i "s/GlobalUser/GlobalUser$serverId/" createTable.sql

#modify script
sed -i "s/test/$user/" createTable.sh
sed -i "s/123456/$pwd/" createTable.sh
echo run sql script...
chmod +x createTable.sh && ./createTable.sh

echo end!