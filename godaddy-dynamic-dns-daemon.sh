#!/bin/sh

_term() {
	echo "Shutting down daemon"
	exit
}

STOPPED=0
if [ "$INTERVAL" = "" ]; then
	INTERVAL=3600
fi

trap _term SIGTERM

echo "Starting up daemon"

while [ "$STOPPED" != "1" ]
do
	npm start
	echo "Sleeping for $INTERVAL seconds..."
	sleep $INTERVAL&
	wait
done
