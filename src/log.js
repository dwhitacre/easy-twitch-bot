const uuid = require('uuid');

function log({ id, from, message, ...moreInfo } = {}, enabled = true) {
  if (!enabled) return;
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    id: id || uuid.v1(),
    from,
    message,
    ...moreInfo
  }));
}

module.exports = log;