// ==============================================================================
// CONTRACT EXPORT ENTRYPOINT
// File: blockchain/chaincode/pharma-contract/index.js
// ==============================================================================

const PharmaContract = require('./lib/pharmaContract');

module.exports.PharmaContract = PharmaContract;
module.exports.contracts = [PharmaContract];

