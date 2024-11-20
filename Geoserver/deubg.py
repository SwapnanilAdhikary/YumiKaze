import requests
import time
wms_url = "http://localhost:8080/geoserver/test/wms"

params = {
    'service':'WMS',
    'version':'1.1.1',
    'request':'GetMap',
    'layers':'god_give',
    'bbox':'minX,minY.maxX,maxY',
    'width':800,
    'height':600,
    'srs':'EPSG:4326',
    'format':'image/png'
}
response = requests.get(wms_url,params=params)
print(response)