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
        video.formart = 'avi';

        resolve(video);
      });
    });
  });

  Promise.all(promises).then((results) => {
    mainWindow.webContents.send('completeMetadata', results);
  });
});

ipcMain.on('startConversion', (e, videos) => {
  const keyName = Object.keys(videos);
  const video = videos[keyName];
  const outputName = video.name.split('.')[0];
  const outputDirectory = video.path.split(video.name)[0];
  const outputPath = `${outputDirectory}${outputName}.${video.format}`;
  console.log(outputPath);


});
