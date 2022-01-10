const { resolveContent } = require('nodemailer/lib/shared');
const { web3 } = require('../configs/configweb3');
const getBalances = async (data) => {
    let senderAddress = data;
    return new Promise((resolve, reject) => {
        web3.eth.getBalance(senderAddress).then( resp => {
            resolve(resp);
        })
    });
};

module.exports = { getBalances };
