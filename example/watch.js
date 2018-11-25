const nodemon = require('nodemon');

nodemon({
  script: 'example/example.js',
  ext: 'js json',
  watch: ['src/**/*', 'easy_twitch_bot.js', 'example/example.js']
});

nodemon.on('start', () => {
  console.log('Easy twitch bot example has started..');
}).on('quit', () => {
  console.log('Easy twitch bot example has quit.');
}).on('restart', files => {
  console.log(`Easy twitch bot restarted due to: ${files}`);
});