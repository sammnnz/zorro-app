// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    frame: false,
    icon: '',
    webPreferences: {
      javascript: true,
      plugins: true,
      enableRemoteModule: false,
      nodeIntegrationInWorker: true,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    }
  })

  const { url } = require('./zorro/core/js/url');

  // Load the index.html of the app.
  mainWindow.loadURL(url)
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  })

  // Open the DevTools.
  // Explicitly with Ctrl + Shift + I.
  mainWindow.webContents.openDevTools({mode: "bottom"})
}

// EventHandlers.
ipcMain.handle('CurrentWindowAPI', (event, arg) => {
    if (arg === 'close'){
      mainWindow.close()
    }
    else if (arg === 'isMaximized') {
      return mainWindow.isMaximized()
    }
    else if (arg === 'maximize'){
      mainWindow.maximize()
      mainWindow.webContents.send('CurrentWindowAPI.maximize')
    }
    else if (arg === 'minimize'){
      mainWindow.minimize()
    }
    else if (arg === 'unmaximize'){
      mainWindow.unmaximize()
      mainWindow.webContents.send('CurrentWindowAPI.unmaximize')
    }
  })

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.