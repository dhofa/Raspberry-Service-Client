import os
import time
import serial
import string
import pynmea2
import urllib2
import requests
import urllib

while True:
 port = "/dev/ttyS0"
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

  if lat != 0.0:
   url = "https://rmvts.jagopesan.com/api/gps/5b1d648ad429f20014b6e45e"
   payload = {"latitude": lat, "longitude": lng}
   #headers = {'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInVzZXJJZCI6IjVhZjE2NmRkYWY1MzNhNGI5YzNmYzBkNiIsImlhdCI6MTUyNTgzNzMyN30.pz7xzIvwedAOOU3ZU_tajw3SrQQ8E5owwV3IrcCKRio'}
   #f = requests.post(url, data=payload, headers=headers)
   f = requests.post(url, data=payload)
   #print f.json()

   #delay 5 detik
   time.sleep(10)
   #time.sleep(2)
