import { Box, Typography } from '@mui/material'
import type { Lap, ParsedSession } from '../types'
export function TrackMap({session,lap}:{session:ParsedSession;lap?:Lap}){
  const src=lap?session.samples.slice(lap.startIndex,lap.endIndex+1):session.samples
  const lats=src.map(s=>s.latitude), lons=src.map(s=>s.longitude)
  const minLat=Math.min(...lats),maxLat=Math.max(...lats),minLon=Math.min(...lons),maxLon=Math.max(...lons)
  const W=900,H=520,p=30,cos=Math.cos(((minLat+maxLat)/2)*Math.PI/180)
  const sx=(W-2*p)/Math.max(1e-9,(maxLon-minLon)*cos), sy=(H-2*p)/Math.max(1e-9,maxLat-minLat), scale=Math.min(sx,sy)
  const x=(v:number)=>p+(v-minLon)*cos*scale, y=(v:number)=>H-p-(v-minLat)*scale
  const step=Math.max(1,Math.floor(src.length/4000))
  const pts=src.filter((_,i)=>i%step===0).map(s=>`${x(s.longitude).toFixed(1)},${y(s.latitude).toFixed(1)}`).join(' ')
  return <Box><Typography variant="subtitle2" color="text.secondary" mb={1}>GPS trace {lap?`· Lap ${lap.lapNumber}`:'· Full session'}</Typography><Box component="svg" viewBox={`0 0 ${W} ${H}`} sx={{width:'100%',display:'block',border:1,borderColor:'divider',borderRadius:2,bgcolor:'background.default'}}><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke"/>{session.startLine&&<line x1={x(session.startLine.a.longitude)} y1={y(session.startLine.a.latitude)} x2={x(session.startLine.b.longitude)} y2={y(session.startLine.b.latitude)} stroke="currentColor" opacity=".65" strokeWidth="7" vectorEffect="non-scaling-stroke"/>}</Box></Box>
}
