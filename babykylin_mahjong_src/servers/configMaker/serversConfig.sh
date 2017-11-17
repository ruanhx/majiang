#!/bin/sh
cd authServer
chmod +x *.sh
./do.sh

cd ../update-server
chmod +x *.sh
./do.sh

cd ../serverManager
chmod +x *.sh
./do.sh

cd ../game-server
chmod +x *.sh
./do.sh

#cd ../snExchangeServer
#chmod +x *.sh
#./do.sh

cd ../game-admin
chmod +x *.sh
./do.sh

cd ../others
chmod +x *.sh
./do.sh

cd ../shells
chmod +x *.sh
./do.sh

cd ../../
chmod +x *.sh
  
