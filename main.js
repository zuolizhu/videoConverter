const electron = require('electron');
const ffmpeg = require('fluent-ffmpeg');

const _ = require('lodash');

const { app, BrowserWindow, ipcMain } = electron;

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: { backgroundThrottling: false }
  });

  mainWindow.loadURL(`file://${__dirname}/src/index.html`);

});


ipcMain.on('addedVideos', (e, videos) => {
  //lodash utility
  const promises = _.map(videos, video => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(video.path, (err, metadata) => {

        video.duration = metadata.format.duration;
        video.formart = 'AVI';

        resolve(video);
      });
    });
  });

  Promise.all(promises).then((results) => {
    mainWindow.webContents.send('completeMetadata', results);
  });
});

ipcMain.on('startConversion', (e, videos) => {

  _.each(videos, video => {
    const outputName = video.name.split('.')[0];
    const outputDirectory = video.path.split(video.name)[0];
    const outputPath = `${outputDirectory}${outputName}.${video.format}`;
    ffmpeg(video.path)
    .output(outputPath)
    .on('progress', ({ timemark }) =>
      mainWindow.webContents.send('conversionProgress', { video, timemark })
    )
    .on('end', () =>
    mainWindow.webContents.send('endConversion', {video, outputPath} ))
    .run();
  });
});
