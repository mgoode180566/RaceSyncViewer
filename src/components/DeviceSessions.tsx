import { Alert, Button, Card, CardActions, CardContent, Chip, LinearProgress, Stack, Typography } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import type { DeviceSession } from '../types'

const fmt=(n:number)=>n>1048576?`${(n/1048576).toFixed(1)} MB`:`${(n/1024).toFixed(0)} KB`
export function DeviceSessions({sessions,loading,error,active,onRefresh,onDownload}:{sessions:DeviceSession[];loading:boolean;error?:string;active?:string;onRefresh:()=>void;onDownload:(s:DeviceSession)=>void}){
  return <Stack spacing={2}>
    <Stack direction="row" justifyContent="space-between" alignItems="center"><div><Typography variant="h5" fontWeight={800}>Sessions on RaceSync</Typography><Typography variant="body2" color="text.secondary">Copy a VBO file from the ESP32 and process it entirely in this browser.</Typography></div><Button startIcon={<RefreshIcon/>} onClick={onRefresh}>Refresh</Button></Stack>
    {loading&&<LinearProgress/>}{error&&<Alert severity="warning">{error}</Alert>}
    {sessions.map(s=><Card key={s.file} variant="outlined"><CardContent><Stack direction={{xs:'column',sm:'row'}} justifyContent="space-between" gap={1}><div><Typography fontWeight={800}>{s.file}</Typography><Typography variant="body2" color="text.secondary">{fmt(s.sizeBytes)}</Typography></div><Stack direction="row" gap={1}>{s.generatedByRaceSync?<Chip size="small" label="RaceSync recording"/>:<Chip size="small" color="info" label="Demo source"/>}{s.complete&&<Chip size="small" color="success" label="Complete"/>}</Stack></Stack></CardContent><CardActions><Button startIcon={<DownloadIcon/>} disabled={Boolean(active)} onClick={()=>onDownload(s)}>{active===s.file?'Downloading…':'Download & view'}</Button></CardActions></Card>)}
    {!loading&&!error&&sessions.length===0&&<Alert severity="info">No VBO files found.</Alert>}
  </Stack>
}
