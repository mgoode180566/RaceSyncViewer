# RaceSync Viewer

Vite + React + TypeScript viewer for the RaceSync ESP32 logger.

The browser replaces the previous Java/Spring processing path for local viewing. It connects directly to RaceSync, downloads a VBO session, parses the VBOX text in TypeScript, detects laps from the VBOX start/finish line, renders the GPS trace, charts speed/extra channels and stores the downloaded result in IndexedDB.

## Run

```powershell
npm install
npm run dev
```

Browse to `http://localhost:5173` while the computer is connected to the RaceSync Wi-Fi network.

The default ESP32 address is `http://192.168.4.1` and can be overridden with `VITE_RACESYNC_URL`.

## Silverstone demo workflow

1. Flash the RaceSync V2.1 firmware.
2. Upload `VBOX0004.vbo` to LittleFS on the ESP32.
3. Leave the MG-902 disconnected so RaceSync enters DEMO mode.
4. Connect the laptop/phone to Wi-Fi `RaceSync`.
5. Run/open this web app.
6. The Device tab polls `/api/status` every three seconds.
7. The Sessions tab calls `/api/sessions` and should show `VBOX0004.vbo`.
8. Choose **Download & view**.
9. The VBO is downloaded from `/api/sessions/VBOX0004.vbo` and parsed entirely in the browser.
10. The Viewer tab shows Silverstone GPS trace, detected laps, speed, and extra VBOX channels.

No Spring/Java backend is required for this workflow.

## API used

- `GET /api/status`
- `GET /api/sessions`
- `GET /api/sessions/{filename}`

## Note on Amplify

For development, run the Vite client over HTTP. An HTTPS-hosted page (such as Amplify) may be blocked by browsers from fetching the ESP32's plain HTTP `192.168.4.1` address because of mixed-content/local-network restrictions. The viewer logic itself is static-host compatible, but that browser security boundary needs to be handled before the Amplify deployment is the primary trackside client.
