const path = require('path');
const fs = require('fs');

module.exports = async function globalTeardown() {
  const stateFile = path.join(__dirname, '../.auth-state.json');
  if (fs.existsSync(stateFile)) {
    fs.unlinkSync(stateFile);
  }
};