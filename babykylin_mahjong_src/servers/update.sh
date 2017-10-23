#!/bin/sh

if [ -f $"servers.zip" ] ;then	 	
	unzip -ao servers.zip
fi

cd update-server/public/
if [ -f $"public.zip" ] ;then	 
	unzip -ao public.zip
fi
cd ../../

cd configMaker/game-server
chmod +x do.sh && ./do.sh
cd ../../

chmod +x server.sh && ./server.sh stop

#cd authServer && npm install -d && cd ..
#cd game-server && npm install -d && cd ..
#cd serverManager && npm install -d && cd ..
#cd update-server && npm install -d && cd ..

cd shells && chmod +x backup_db.sh && ./backup_db.sh && cd ..
cd game-server/MySQL/MySqlBat
chmod +x GameUser-Source.sh && ./GameUser-Source.sh
chmod +x statistics.sh && ./statistics.sh
chmod +x GameLog.sh && ./GameLog.sh
cd ../../../
cd serverManager/config/schema && chmod +x createTable.sh && ./createTable.sh && cd ../../../
cd shells && chmod +x resume_db.sh && ./resume_db.sh && cd ..
./server.sh start
