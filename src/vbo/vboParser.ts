import type { Lap, ParsedSession, StartLine, VBoxSample } from '../types'

const lat = (raw: number) => raw / 60
const lon = (raw: number) => -raw / 60

const timeSeconds = (raw: number) => {
  const h = Math.floor(raw / 10000)
  const m = Math.floor((raw % 10000) / 100)
  return h * 3600 + m * 60 + (raw - h * 10000 - m * 100)
}

const distance = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const R = 6371000
  const p1 = a.latitude * Math.PI / 180
  const p2 = b.latitude * Math.PI / 180
  const dp = (b.latitude - a.latitude) * Math.PI / 180
  const dl = (b.longitude - a.longitude) * Math.PI / 180
  const h = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1-h))
}

const intersect = (p1: VBoxSample, p2: VBoxSample, q1: StartLine['a'], q2: StartLine['b']) => {
  const ref = (p1.latitude + p2.latitude + q1.latitude + q2.latitude) / 4
  const c = Math.cos(ref * Math.PI / 180)
  const P = (p: {latitude:number; longitude:number}) => ({x:p.longitude*c,y:p.latitude})
  const a=P(p1), b=P(p2), c1=P(q1), d=P(q2)
  const o=(p:any,q:any,r:any)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x)
  return o(a,b,c1)*o(a,b,d)<0 && o(c1,d,a)*o(c1,d,b)<0
}

const parseStartLine = (lines: string[]): StartLine | undefined => {
  for (const lineText of lines) {
    const n = lineText.match(/[+-]?\d+(?:\.\d+)?/g)?.map(Number)
    if (!n || n.length < 4) continue
    const candidates: StartLine[] = [
      { a:{longitude:lon(n[0]), latitude:lat(n[1])}, b:{longitude:lon(n[2]), latitude:lat(n[3])} },
      { a:{latitude:lat(n[0]), longitude:lon(n[1])}, b:{latitude:lat(n[2]), longitude:lon(n[3])} },
    ]
    const ok = candidates.find(x => Math.abs(x.a.latitude)<=90 && Math.abs(x.b.latitude)<=90 && Math.abs(x.a.longitude)<=180 && Math.abs(x.b.longitude)<=180 && distance(x.a,x.b)<500)
    if (ok) return ok
  }
}

const lapsFrom = (samples: VBoxSample[], line?: StartLine): Lap[] => {
  if (!line) return []
  const crossings:number[]=[]
  let last=-1000
  for(let i=1;i<samples.length;i++){
    if(i-last<25) continue
    if(intersect(samples[i-1],samples[i],line.a,line.b)){crossings.push(i);last=i}
  }
  const laps:Lap[]=[]
  for(let j=1;j<crossings.length;j++){
    const a=crossings[j-1], b=crossings[j]
    const slice=samples.slice(a,b+1)
    const lapTime=samples[b].timeSeconds-samples[a].timeSeconds
    if(lapTime<20||lapTime>600) continue
    let metres=0
    for(let i=1;i<slice.length;i++) metres+=distance(slice[i-1],slice[i])
    const speeds=slice.map(x=>x.velocityKmh)
    laps.push({lapNumber:laps.length+1,startIndex:a,endIndex:b,lapTimeSeconds:lapTime,distanceMeters:metres,maxSpeedKmh:Math.max(...speeds),avgSpeedKmh:speeds.reduce((x,y)=>x+y,0)/speeds.length})
  }
  return laps
}

const detectTrack = (samples: VBoxSample[]) => {
  const mid=samples[Math.floor(samples.length/2)]
  if(distance(mid,{latitude:52.0733,longitude:-1.0147})<5000) return 'Silverstone'
  return 'Unknown circuit'
}

export function parseVBox(text:string, filename:string):ParsedSession{
  const sections=new Map<string,string[]>()
  let current=''
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim(); if(!line) continue
    const m=line.match(/^\[(.+)]$/)
    if(m){current=m[1].toLowerCase(); if(!sections.has(current)) sections.set(current,[]); continue}
    if(current) sections.get(current)!.push(line)
  }
  const data=sections.get('data')??[]
  const col=(sections.get('column names')??[])[0]?.split(/\s+/)??[]
  const defaults=['sats','time','lat','long','velocity','heading','height','vert-vel','Tsample','solution_type','avifileindex','avitime','ComboAcc','OilPressure','OilTemp','WaterTemp','Revs','FuelPressure','Combo_G']
  const columns=col.length>=12?col:defaults
  const samples:VBoxSample[]=[]
  for(const lineText of data){
    const v=lineText.split(/\s+/).map(Number)
    if(v.length<12||v.slice(0,12).some(x=>!Number.isFinite(x))) continue
    const channels:Record<string,number>={}
    for(let i=12;i<v.length;i++) channels[columns[i]??`channel${i}`]=v[i]
    samples.push({index:samples.length,sats:v[0],timeRaw:v[1],timeSeconds:timeSeconds(v[1]),latitude:lat(v[2]),longitude:lon(v[3]),velocityKmh:v[4],heading:v[5],height:v[6],verticalVelocity:v[7],samplePeriod:v[8]>0&&v[8]<=1?v[8]:0.04,solutionType:v[9],channels})
  }
  if(!samples.length) throw new Error('No VBOX data rows found')
  let dayOffset=0, prev=samples[0].timeSeconds
  for(let i=0;i<samples.length;i++){let t=samples[i].timeSeconds+dayOffset;if(i&&t<prev-43200){dayOffset+=86400;t=samples[i].timeSeconds+dayOffset}samples[i].timeSeconds=t;prev=t}
  const startLine=parseStartLine(sections.get('laptiming')??[])
  const laps=lapsFrom(samples,startLine)
  const channelNames=[...new Set(samples.flatMap(s=>Object.keys(s.channels)))]
  return {filename,trackName:detectTrack(samples),samplePeriod:samples[0].samplePeriod,samples,laps,startLine,channelNames,maxSpeedKmh:Math.max(...samples.map(s=>s.velocityKmh)),durationSeconds:samples.at(-1)!.timeSeconds-samples[0].timeSeconds,rawText:text}
}
