#!/bin/sh
if [ "$1" = "start" ]; then
	echo starting all servers...
	
	#echo starting snExchangeServer...
	#cd snExchangeServer && nohup node app > snExchangeServer.log 2>&1 &
	#echo start snExchangeServer ok-0
	
	echo starting serverManager...
	cd serverManager && nohup node app > serverManager.log 2>&1 &
	echo start serverManager ok-0

	echo starting game-server...
	cd game-server &&  nohup node app > game-server.log 2>&1 &
	echo start game-server ok-1
	
	echo starting authServer...
	cd authServer && nohup node app > authServer.log 2>&1 &
	echo start authServer ok-2

	echo starting update-server...
	cd update-server && nohup node app > update-server.log 2>&1 &
	echo start update-server ok-3

    #echo starting gmServer...
    #cd gmServer && nohup node app > gmServer.log 2>&1 &
    #echo start gmServer ok-4
	
	echo start all servers ok-5
elif [ "$1" = "stop" ]; then
	echo stopping game servers...
	cd game-server && chmod +x node_modules/pomelo/bin/pomelo && node_modules/pomelo/bin/pomelo stop -p admin -P  3005 
	echo stop game servers ok!
	
	kill -9 $(netstat -alnp | grep '3000\|3001\|3003\|3701\|3901\|3014\|3010\|3150\|3250\|3550\|3602\|3802\|3410\|3005' | awk '{print $7}' | awk -F '/' '{print $1}')
	netstat -alnp | grep '3000\|3001\|3003\|3701\|3901\|3014\|3010\|3150\|3250\|3550\|3602\|3802\|3410\|3005' 
	echo stop all servers ok!
elif [ "$1" = "list" ]; then
	echo ------------------------------------------------------------------
	cd game-server && chmod +x node_modules/pomelo/bin/pomelo && node_modules/pomelo/bin/pomelo list -p admin -P  3005 
	echo ------------------------------------------------------------------
	netstat -alnp | grep '3000\|3001\|3003\|3701\|3901\|3014\|3010\|3150\|3250\|3550\|3602\|3802\|3410\|3005'
else
	echo unknown cmd[$1]!
fi
