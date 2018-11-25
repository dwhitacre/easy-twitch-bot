function onDisconnectedHandler(reason) {
  this._log({
    message: `Disonnected for: ${reason}`
  });
}

module.exports = onDisconnectedHandler;