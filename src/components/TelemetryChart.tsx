import { Box, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Lap, ParsedSession } from '../types'
export function TelemetryChart({session,lap,channel,onChannel}:{session:ParsedSession;lap?:Lap;channel:string;onChannel:(v:string)=>void}){
  const src=lap?session.samples.slice(lap.startIndex,lap.endIndex+1):session.samples
  const step=Math.max(1,Math.floor(src.length/1800)), t0=src[0]?.timeSeconds??0
  const data=src.filter((_,i)=>i%step===0).map(s=>({time:Number((s.timeSeconds-t0).toFixed(2)),value:channel==='Speed'?s.velocityKmh:(s.channels[channel]??0)}))
  return <Stack spacing={2}><Stack direction={{xs:'column',sm:'row'}} gap={2}><Typography variant="subtitle2" color="text.secondary" sx={{flex:1}}>Telemetry {lap?`· Lap ${lap.lapNumber}`:'· Full session'}</Typography><FormControl size="small" sx={{minWidth:220}}><InputLabel>Channel</InputLabel><Select value={channel} label="Channel" onChange={e=>onChannel(e.target.value)}><MenuItem value="Speed">Speed (km/h)</MenuItem>{session.channelNames.map(n=><MenuItem key={n} value={n}>{n}</MenuItem>)}</Select></FormControl></Stack><Box sx={{height:330}}><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time" type="number" domain={['dataMin','dataMax']} tickFormatter={v=>`${v}s`}/><YAxis domain={['auto','auto']}/><Tooltip formatter={v=>[Number(v).toFixed(2),channel]} labelFormatter={v=>`${v}s`}/><Line dataKey="value" dot={false} isAnimationActive={false} stroke="currentColor" strokeWidth={2}/></LineChart></ResponsiveContainer></Box></Stack>
}
