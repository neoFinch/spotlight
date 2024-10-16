// main.js
const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron')
const path = require('path')
const { exec } = require('child_process')
const fs = require('fs').promises
const ini = require('ini')

/**
 * @type {BrowserWindow}
 */
let mainWindow;
let apps = [];

async function findIconPath(iconName) {
  const iconDirs = [
    '/usr/share/icons/hicolor/256x256/apps/',
    '/usr/share/icons/hicolor/128x128/apps/',
    '/usr/share/icons/hicolor/64x64/apps/',
    '/usr/share/icons/hicolor/48x48/apps/',
    '/usr/share/icons/hicolor/32x32/apps/',
    '/usr/share/pixmaps/',
    '/usr/share/icons/'
  ]

  const extensions = ['.png', '.svg', '.xpm', '']

  for (const dir of iconDirs) {
    for (const ext of extensions) {
      const iconPath = path.join(dir, `${iconName}${ext}`)
      try {
        await fs.access(iconPath)
        return iconPath
      } catch (err) {
        // Icon not found with this extension, continue to next
      }
    }
  }

  // If icon not found, try to find it in the system icon theme
  const possibleThemeDirs = [
    '/usr/share/icons/gnome/',
    '/usr/share/icons/hicolor/',
    '/usr/share/icons/Adwaita/'
  ]

  for (const themeDir of possibleThemeDirs) {
    const themeFolders = ['256x256', '128x128', '64x64', '48x48', '32x32', '24x24', '16x16']
    for (const folder of themeFolders) {
      for (const ext of extensions) {
        const iconPath = path.join(themeDir, folder, 'apps', `${iconName}${ext}`)
        try {
          await fs.access(iconPath)
          return iconPath
        } catch (err) {
          // Icon not found in this location, continue to next
        }
      }
    }
  }

  return null // Icon not found
}


async function scanForApps() {
  const directories = [
    '/usr/share/applications/',
    '/usr/local/share/applications/',
    path.join(app.getPath('home'), '.local/share/applications/')
  ];

  for (const dir of directories) {
    try {
      const files = await fs.readdir(dir)
      for (const file of files) {
        if (file.endsWith('.desktop')) {
          try {
            const content = await fs.readFile(path.join(dir, file), 'utf-8')
            const parsed = ini.parse(content)

            if (parsed['Desktop Entry'] && !parsed['Desktop Entry'].NoDisplay) {
              const iconName = String(parsed['Desktop Entry'].Icon)

              const iconPath = await findIconPath(iconName)
              apps.push({
                name: parsed['Desktop Entry'].Name,
                exec: parsed['Desktop Entry'].Exec,
                icon: iconPath,
                iconV2: iconName.includes('.png') ? iconPath : null
              })
            }
          } catch (err) {
            console.error(`Error parsing ${file}:`, err)
          }
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err)
    }
  }
  // console.log({apps})
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 600,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false // Don't show the window immediately
  })

  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('blur', () => {
    mainWindow.hide()
  })

  // Error logging
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('Renderer Console: ', message)
  })

  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  // Disable hardware acceleration if not needed
  // if (!app.isAccessibilitySupportEnabled()) {
  //   app.disableHardwareAcceleration()
  // }

  scanForApps();
  createWindow();
  let {width, height} = screen.getPrimaryDisplay().workAreaSize;

  mainWindow?.setBounds({ x: (width / 2) - 600, y: (height / 2) - 300, width: 800, height: 600 });

  // add super keu for linux and window
  globalShortcut.register('Meta+J', async () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// This is a placeholder. In a real app, you'd implement
// a way to get the list of installed applications on the system.
// apps = [
//   { name: 'Terminal', command: 'gnome-terminal' },
//   { name: 'Firefox', command: 'firefox' },
//   { name: 'Visual Studio Code', command: 'code' },
//   // Add more apps here
// ]

ipcMain.handle('search-apps', (event, searchTerm) => {
  return apps.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
})

ipcMain.on('launch-app', (event, appCommand) => {
  exec(appCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }
    console.log(`stdout: ${stdout}`)
    console.error(`stderr: ${stderr}`)
  })
  mainWindow.hide()
})

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

ipcMain.on('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide()
  }
})