import time
import RPi.GPIO as gpio

gpio.setwarnings(False)
gpio.setmode(gpio.BOARD)
gpio.setup(12,gpio.OUT)

try:
        while True:
                gpio.output(12,0)
                time.sleep( .2)
                gpio.output(12,1)
                time.sleep( .2)
except KeyboardInterrupt:
        gpio.cleanup()
        exit
