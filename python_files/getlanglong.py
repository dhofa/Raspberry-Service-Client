import os
import time
import serial
import string
import pynmea2
import urllib2
import requests
import urllib

while True:
 port = "/dev/ttyAMA0"
 ser = serial.Serial(port, baudrate=9600, timeout=0.5)
 dataout = pynmea2.NMEAStreamReader()
 newdata = ser.readline()

 #print("Get Lat and Long")
 if newdata[0:6] == '$GPGGA':
  newmsg = pynmea2.parse(newdata)
  lat = newmsg.latitude
  #print (lat)
  lng = newmsg.longitude
  #print (lng)
  print lat,",",lng

  #url = "https://rmvts.herokuapp.com/api/gps/5af166ddaf533a4b9c3fc0d6"
  url = "http://192.168.8.100:3000/api/gps/5af166ddaf533a4b9c3fc0d6"
  payload = {"latitude": lat, "longitude": lng}
  #headers = {'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInVzZXJJZCI6IjVhZjE2NmRkYWY1MzNhNGI5YzNmYzBkNiIsImlhdCI6MTUyNTgzNzMyN30.pz7xzIvwedAOOU3ZU_tajw3SrQQ8E5owwV3IrcCKRio'}
  #f = requests.post(url, data=payload, headers=headers)
  f = requests.post(url, data=payload)
  print f.json()

  #delay 5 detik
  time.sleep(5)
