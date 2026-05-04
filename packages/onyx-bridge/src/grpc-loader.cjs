const path = require('path');
// Manually resolve the path to handle pnpm hoisting on Windows
let grpcPath;
try {
  grpcPath = require.resolve('@grpc/grpc-js', { paths: [__dirname] });
} catch (e) {
  // Fallback to monorepo root
  grpcPath = require.resolve('@grpc/grpc-js', { paths: [path.resolve(__dirname, '../../../node_modules')] });
}
module.exports = require(grpcPath);
