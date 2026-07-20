import dotenv from 'dotenv'
dotenv.config()

// On some Windows setups Node's DNS resolver defaults to a local stub
// (127.0.0.1, often injected by a VPN client or security software) that
// refuses SRV-type queries, even though the OS resolver handles them fine.
// That breaks `mongodb+srv://` connection strings specifically. Pointing
// Node's resolver at public DNS servers sidesteps it; harmless in any
// environment (Railway, etc.) since these are always reachable.
if ((process.env.MONGO_URI || '').startsWith('mongodb+srv://')) {
  const dns = require('dns')
  dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()])
}

import app from './app'

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`)
})
