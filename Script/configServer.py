import os
import subprocess
import json
from fabric import SerialGroup,ThreadingGroup,Connection,runners

import copy 

scriptDir = os.path.dirname(os.path.realpath(__file__))


def getPiIPLists():
  hosts = []
  with open(scriptDir+'/hosts.txt','r') as fp:
    hosts=fp.readlines()
  return hosts

def ssh(ip,script):
  cmd = 'ssh pi@%s "bash -s "%s""'%(ip,script)
  res = subprocess.run(cmd, shell=True,stdout=subprocess.PIPE ,stderr=subprocess.STDOUT)
  if(res!=0):
    return False;
  return True;


# class ComplexEncoder(json.JSONEncoder):
#     def default(self, obj):
#         if isinstance(obj, Connection):
#             return obj.name
#         # Let the base class default method raise the TypeError
#         return json.JSONEncoder.default(self, obj)
def toStrKeys(dOri):
  d = dOri.copy()
  for key, val in list(d.items()):
    if isinstance(key, Connection): 
      val = d.pop(key)
      key = str(key.host)
      d[key] = val 
    if isinstance(val, dict): 
      d[key] = toStrKeys(val)
    elif(isinstance(val,runners.Result)):
      d[key] = {'stderr':val.stderr,'stdout':val.stdout}
    # elif isinstance(val, object): 
    #   d[key] = str(val)
  return d

def mountSSHFS(host):
  cmd = "sshfs pi@{0}: ~/sshfs_mnt/{1} -oauto_cache,reconnect,defer_permissions,noappledouble,noapplexattr,daemon_timeout=5,volname={1}".format(host,host.split('.local')[0])
  print("sshfs cmd",cmd)
  res = subprocess.run(cmd, shell=True,stdout=subprocess.PIPE ,stderr=subprocess.STDOUT)
  print (res)

if __name__=="__main__":
  global dry
  import argparse
  parser = argparse.ArgumentParser()
  parser.add_argument("-t","--try",type=bool)
  parser.add_argument("-c","--code",help="command string",type=str)
  parser.add_argument("-m","--mount",help="mount using sshfs",default=None,action="store_true")
  parser.add_argument("-n","--noThread",help="not threaded",type=bool)
  parser.add_argument("-f","--file",help="file to provide")
  parser.add_argument("-p","--password",help="ssh password to provide")
  parser.add_argument("-H","--hosts",help="manually set hosts (comma separated )")

  args = parser.parse_args()
  
  if (args.code or args.file or args.mount) is None:
    parser.error('nothing asked')
  
  if args.hosts:
    pis = args.hosts.split(',')
  else:
    pis = getPiIPLists()
    
  if(len(pis)==0):
      NameError("no pi provided")
  
  if(args.mount):
    for pi in pis:
      mountSSHFS(pi)


  script = ""
  if(args.code):
    script = args.code
  elif(args.file):
    fileToLoad = scriptDir+"/remoteAction.sh"
    with open(fileToLoad,'r') as fp: 
      script = fp.read()
  if script!="":
    CG = SerialGroup if args.noThread else ThreadingGroup
    print("starting execution of %s"%script)
    res = CG(*pis,user="pi",connect_kwargs={"password":args.password}).run(script)
    with open(scriptDir+"/results.txt",'w') as fp:
      fp.write(str(res))
    strRes = toStrKeys(res)
    print (strRes)
    with open(scriptDir+"/results.json",'w') as fp:
      json.dump(strRes,fp,indent=2)




