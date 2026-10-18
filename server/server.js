const core = require('./core');
module.exports = core;

if (require.main === module) {
  core.start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
