import { useEffect, useState } from 'react'
import { Alert, AppBar, Box, Button, Container, CssBaseline, Tab, Tabs, ThemeProvider, Toolbar, Typography, createTheme } from '@mui/material'
import type { DeviceSession, DeviceStatus, ParsedSession } from './types'
import { downloadSession, fetchSessions, fetchStatus } from './services/raceSyncApi'
import { parseVBox } from './vbo/vboParser'
import { listStoredSessions, saveSession } from './storage/sessionDb'
import { StatusPanel } from './components/StatusPanel'
import { DeviceSessions } from './components/DeviceSessions'
import { SessionViewer } from './components/SessionViewer'
const theme=createTheme({palette:{mode:'dark'}})
export default function App(){
 const [tab,setTab]=useState(0),[status,setStatus]=useState<DeviceStatus>(),[statusErr,setStatusErr]=useState<string>(),[sessions,setSessions]=useState<DeviceSession[]>([]),[sessErr,setSessErr]=useState<string>(),[loading,setLoading]=useState(false),[active,setActive]=useState<string>(),[viewer,setViewer]=useState<ParsedSession>(),[stored,setStored]=useState<ParsedSession[]>([]),[msg,setMsg]=useState<string>()
 const loadStatus=async()=>{try{setStatus(await fetchStatus());setStatusErr(undefined)}catch(e){setStatusErr(e instanceof Error?e.message:'Device unavailable')}}
 const loadSessions=async()=>{setLoading(true);try{const r=await fetchSessions();setSessions(r.sessions??[]);setSessErr(undefined)}catch(e){setSessErr(e instanceof Error?e.message:'Could not list sessions')}finally{setLoading(false)}}
 const refreshStored=async()=>{try{setStored(await listStoredSessions())}catch{}}
 useEffect(()=>{loadStatus();loadSessions();refreshStored();const t=setInterval(loadStatus,3000);return()=>clearInterval(t)},[])
 const openDevice=async(s:DeviceSession)=>{setActive(s.file);try{const txt=await downloadSession(s.file,s.downloadUrl);const parsed=parseVBox(txt,s.file);await saveSession(parsed).catch(()=>{});await refreshStored();setViewer(parsed);setMsg(`${s.file} downloaded and processed locally.`);setTab(2)}catch(e){setMsg(`Unable to open session: ${e instanceof Error?e.message:'unknown error'}`)}finally{setActive(undefined)}}
 const openLocal=async(f?:File)=>{if(!f)return;try{const p=parseVBox(await f.text(),f.name);await saveSession(p).catch(()=>{});await refreshStored();setViewer(p);setTab(2)}catch(e){setMsg(e instanceof Error?e.message:'Could not parse file')}}
 return <ThemeProvider theme={theme}><CssBaseline/><AppBar position="sticky" color="default" elevation={0}><Toolbar><Typography variant="h6" fontWeight={900} sx={{flex:1}}>RaceSync</Typography><Typography variant="caption" color="text.secondary">ESP32 browser viewer</Typography></Toolbar><Tabs value={tab} onChange={(_,v)=>setTab(v)}><Tab label="Device"/><Tab label="Sessions"/><Tab label="Viewer"/></Tabs></AppBar><Container maxWidth="xl" sx={{py:3}}>{msg&&<Alert sx={{mb:2}} severity={msg.startsWith('Unable')?'error':'success'} onClose={()=>setMsg(undefined)}>{msg}</Alert>}{tab===0&&<StatusPanel status={status} error={statusErr}/>} {tab===1&&<Box><DeviceSessions sessions={sessions} loading={loading} error={sessErr} active={active} onRefresh={loadSessions} onDownload={openDevice}/><Box mt={4}><Typography variant="h6" fontWeight={800}>Stored in this browser</Typography>{stored.map(s=><Button key={s.filename} variant="outlined" sx={{m:.5}} onClick={()=>{setViewer(s);setTab(2)}}>{s.trackName} · {s.filename}</Button>)}</Box><Box mt={4}><Button component="label" variant="outlined">Open local VBO<input hidden type="file" accept=".vbo,text/plain" onChange={e=>openLocal(e.target.files?.[0])}/></Button></Box></Box>}{tab===2&&(viewer?<SessionViewer session={viewer}/>:<Alert severity="info">Select a RaceSync session to view it.</Alert>)}</Container></ThemeProvider>
}
