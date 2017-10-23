#!/bin/sh

ports=`echo "$1" | awk -F ',' '{print $0}' | sed "s/,/ /g"`

for port in $ports
do
	echo opening port ${port} ...
	iptables -I INPUT -p tcp --dport ${port} -j ACCEPT
	iptables -I OUTPUT -p tcp --sport ${port} -j ACCEPT
	echo open port ${port} ok!
done

iptables-save
service iptables save