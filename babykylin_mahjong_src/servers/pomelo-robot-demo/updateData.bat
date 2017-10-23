SET SRC=.\game-server\config\data
SET DEST=.\pomelo-robot-demo\app\data\json\
SET CLIENT_SRC=E:\projects\summoner\trunk\program\server\tools\tableConvertor\client-lua\clientMD5.json

XCOPY %SRC%\*.json %DEST% /Y

XCOPY %CLIENT_SRC% %DEST% /Y