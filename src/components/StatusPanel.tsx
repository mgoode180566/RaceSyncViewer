import { Alert, Card, CardContent, Chip, Grid, LinearProgress, Stack, Typography } from '@mui/material'
import type { DeviceStatus } from '../types'

const Row=({label,value}:{label:string;value:React.ReactNode})=><Stack direction="row" justifyContent="space-between" gap={2}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="body2" fontWeight={700}>{value}</Typography></Stack>
const CardBox=({title,children}:{title:string;children:React.ReactNode})=><Card variant="outlined" sx={{height:'100%'}}><CardContent><Typography variant="overline" color="text.secondary">{title}</Typography><Stack spacing={.75} mt={1}>{children}</Stack></CardContent></Card>
const bytes=(n?:number)=>n==null?'—':n>1024*1024?`${(n/1024/1024).toFixed(1)} MB`:`${(n/1024).toFixed(0)} KB`

export function StatusPanel({status,error}:{status?:DeviceStatus;error?:string}){
  if(error) return <Alert severity="warning">{error}. Connect to RaceSync Wi-Fi and confirm 192.168.4.1 is reachable.</Alert>
  if(!status) return <LinearProgress/>
  const overall=status.health?.overall??'UNKNOWN'
  return <Stack spacing={2}>
    <Stack direction={{xs:'column',sm:'row'}} gap={1} alignItems={{sm:'center'}}>
      <Typography variant="h5" fontWeight={800}>{status.system?.product??'RaceSync'}</Typography>
      <Chip size="small" color={overall==='OK'?'success':'warning'} label={`${status.system?.mode??'—'} · ${overall}`}/>
      <Typography variant="body2" color="text.secondary">Firmware {status.system?.firmware??'—'} · {status.system?.uptime??'—'}</Typography>
    </Stack>
    <Grid container spacing={2}>
      <Grid size={{xs:12,md:6,lg:3}}><CardBox title="GPS"><Row label="Source" value={status.gps?.source??'—'}/><Row label="Connected" value={status.gps?.connected?'Yes':'No'}/><Row label="Fix" value={status.gps?.validFix?'Valid':'No fix'}/><Row label="Satellites" value={status.gps?.satellites??0}/><Row label="Rate" value={`${(status.gps?.sampleRateHz??0).toFixed(1)} Hz`}/><Row label="Speed" value={`${(status.gps?.speedKmh??0).toFixed(1)} km/h`}/><Row label="Packet age" value={`${status.gps?.lastPacketAgeMs??'—'} ms`}/><Row label="Errors" value={status.gps?.checksumErrors??0}/></CardBox></Grid>
      <Grid size={{xs:12,md:6,lg:3}}><CardBox title="Logger"><Row label="State" value={status.logger?.state??'—'}/><Row label="File" value={status.logger?.currentFile||'—'}/><Row label="Samples" value={status.logger?.samplesWritten??0}/><Row label="Started at" value={`${status.logger?.startSpeedKmh??'—'} km/h`}/><Row label="Stops below" value={`${status.logger?.stopSpeedKmh??'—'} km/h`}/><Row label="Stop delay" value={`${status.logger?.stopDelaySeconds??'—'} s`}/></CardBox></Grid>
      <Grid size={{xs:12,md:6,lg:3}}><CardBox title="Storage"><Row label="Type" value={`${status.storage?.type??'—'} / ${status.storage?.filesystem??'—'}`}/><Row label="Sessions" value={status.storage?.sessionCount??0}/><Row label="Used" value={bytes(status.storage?.usedBytes)}/><Row label="Free" value={bytes(status.storage?.freeBytes)}/><Row label="Used %" value={`${(status.storage?.usedPercent??0).toFixed(1)}%`}/><Row label="Write errors" value={status.storage?.writeErrors??0}/></CardBox></Grid>
      <Grid size={{xs:12,md:6,lg:3}}><CardBox title="System"><Row label="Board" value={String(status.board?.model??'—')}/><Row label="CPU" value={`${status.board?.cpuMHz??'—'} MHz`}/><Row label="Free heap" value={bytes(Number(status.board?.freeHeapBytes??0))}/><Row label="Boot count" value={status.system?.bootCount??'—'}/><Row label="Reset" value={status.system?.resetReason??'—'}/><Row label="Clients" value={status.wifi?.connectedClients??0}/><Row label="IP" value={status.wifi?.ip??'—'}/></CardBox></Grid>
    </Grid>
  </Stack>
}
