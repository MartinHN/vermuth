deps = ['netifaces']

def _getMACUNIX():
  iNames = {"osx":"en0","pi":"eth0"}
  import netifaces
  def getForI(n):
    ifaces = netifaces.interfaces()
    if not n in ifaces:
      NameError(n +'not in '+ifaces)
    return netifaces.ifaddresses(n)[netifaces.AF_LINK]
  return getForI(iNames[sysID])[0]['addr']


def _getMACDefault():
  from uuid import getnode as get_mac
  mac = get_mac()
  return ':'.join(("%012X" % mac)[i:i+2] for i in range(0, 12, 2))


def getCurrentMAC():
  return getMACUNIX()

def applyNewMAC(opt=None):
  randMAC =  opt or "52:54:00:%02x:%02x:%02x" % (
          random.randint(0, 255),
          random.randint(0, 255),
          random.randint(0, 255),
          )

  

if __name__=="__main__":
  testMAC()

def testMAC():
  print(getCurrentMAC())
