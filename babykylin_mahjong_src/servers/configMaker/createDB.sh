#!/bin/sh
cd ../
chmod +x *.sh

echo clear db and create db ...

cd game-server/MySQL/MySqlBat/
chmod +x *.sh
./createUser.sh
./GameLog.sh
./GameUser-Source.sh
./statistics.sh

cd ../../../authServer/config/schema/
chmod +x *.sh
./createTable.sh

cd ../../../serverManager/config/schema/
chmod +x *.sh
./createTable.sh

#cd ../../../snExchangeServer/config/schema/
#chmod +x *.sh
#./createTable.sh

cd ../../../gmServer/config/schema/
chmod +x *.sh
./createTable.sh

cd ../../../shells/
rm -rf *.sql
echo  create db ok ...
 