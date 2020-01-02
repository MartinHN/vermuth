import os
import json
from glob import glob
import yaml

def parseLibGen(libPath):
    allFiles = [y for x in os.walk(libPath) for y in glob(os.path.join(x[0], '*.json'))]
    for f in allFiles:
      with open(f,'r') as fp:
        yield json.load(fp)
  

countId = "__"
def getStats(gen,maxDepth=-1):
  i=0
  globalHist = {}
  def updateHistFromObj(o,hist,maxDepth):
    for k,v in o.items():
      if(not k in hist):
        hist[k] = {countId:0}
      hist[k][countId]+=1
      if(isinstance (v,dict)):
        if(maxDepth!=0):
          updateHistFromObj(v,hist[k],maxDepth-1)


  for j in gen:
    updateHistFromObj(j,globalHist,maxDepth)
  def postFilter(hist):
    
    if(isinstance (hist,dict)):
      invalidKeys = [k for k in hist.keys() if ( k!=countId) and (hist[k][countId]<3)]
      for k in invalidKeys:
        del hist[k]

    for k in hist.keys():
      v = hist[k]
      if(isinstance (v,dict)):
        if v.keys()==[countId]:
          hist[k] = v[countId]
        else:
          postFilter(v)
  postFilter(globalHist)
  return globalHist


if __name__ == "__main__":
  libPath = "/private/tmp/ofl_export_ofl"
  g = getStats(parseLibGen(libPath),maxDepth=1)
  filename = "/tmp/olf.yml"
  
  yaml.safe_dump(g,file(filename,'w'),encoding='utf-8', allow_unicode=True)
  # print(json.dumps(g,indent=2))