import { app, ipcMain, BrowserWindow } from 'electron'
import os from 'os'

ipcMain.on('appVersionSync', (event, arg) => {
  console.log(arg)
  let currentVersion = ''

  if (process.env.NODE_ENV === 'development') {
    currentVersion = process.env.npm_package_version || ''
  } else {
    currentVersion = app.getVersion()
  }
  event.returnValue = currentVersion
})

ipcMain.on('homeDirPathAsync', async (_, arg) => {
  // Removed invalid property access
  console.log(arg)
  const response = os.homedir()

  const mainWindow = BrowserWindow.getAllWindows()[0]

  // testing shared utils
  await sleep(2000)
  //

  mainWindow.webContents.send('homeDirPathAsyncResponse', response)
})

ipcMain.on('exit', () => {
  console.log('here')
  const mainWindow = BrowserWindow.getAllWindows()[0]

  mainWindow.close()
})

export async function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      return resolve()
    }, ms)
  })
}
