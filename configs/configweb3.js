
//const Web3=require('web3')
// import Web3 from "web3";

//const infuraurlmain=   '' // 'https://mainnet.infura.io/v3/cd35bc8ac4c14bc5b464e267e88ee9d0'
// const infuraurlropsten= XXX 'https://data-seed-prebsc-2-s2.binance.org:8545/' // 'https://ropsten.infura.io/v3/cd35bc8ac4c14bc5b464e267e88ee9d0'
//	const infuraurlropsten= 'https://data-seed-prebsc-1-s3.binance.org:8545/'
//		const infuraurlropsten= 'https://data-seed-prebsc-2-s3.binance.org:8545/'
// const infuraurlropsten='https://ropsten.infura.io/v3/cd35bc8ac4c14bc5b464e267e88ee9d0'  ???
//const infuraurlropsten='https://ropsten.infura.io/v3/5799d55e1e66488786f26d987bfcfd05'

//const NETCLASS='testnet' // require('fs').readFileSync('NETTYPE.cfg').toString().replace(/ /g,'');console.log(NETCLASS)
//const jnetkind={mainnet:'mainnet',testnet:'ropsten'}
//const jnettype={mainnet:'mainnet',testnet:'testnet'}
//const jinfuraurl={mainnet:infuraurlmain,testnet:infuraurlropsten}
//const infuraurl=jinfuraurl[NETCLASS]  //
//const netkind=jnetkind[NETCLASS],nettype=jnettype[NETCLASS] // 'testnet' //  'ropsten'
// const infuraurl=infuraurlmain // infuraurlropsten // 
//let web3 = new Web3(new Web3.providers.HttpProvider(infuraurl))

//module.exports={ web3 ,netkind,nettype } // ,createaccount,aapikeys,getapikey
const Web3=require('web3')
const infuraurlmain=		'https://mainnet.infura.io/v3/cd35bc8ac4c14bc5b464e267e88ee9d0'
const infuraurlropsten=		'https://ropsten.infura.io/v3/cd35bc8ac4c14bc5b464e267e88ee9d0'
const infurawssropsten = "wss://ropsten.infura.io/ws/v3/5799d55e1e66488786f26d987bfcfd05";
const NETCLASS= 'testnet' // require('fs').readFileSync('NETTYPE.cfg').toString().replace(/ /g,'');console.log(NETCLASS)
const jnetkind={mainnet:'mainnet',testnet:'ropsten'}
const jnettype={mainnet:'mainnet',testnet:'testnet'}
const jinfuraurl={mainnet:infuraurlmain,testnet:infuraurlropsten} 
const infuraurl=jinfuraurl[NETCLASS]  //
const netkind=jnetkind[NETCLASS],nettype=jnettype[NETCLASS] // 'testnet' //  'ropsten'
// const infuraurl=infuraurlmain // infuraurlropsten // 
let web3 = new Web3(new Web3.providers.HttpProvider(infuraurl))
let web3wss = new Web3(new Web3.providers.WebsocketProvider(infurawssropsten));
// const db=require('../models')
/** db.balance.findAll({raw:true,where:{currency:'ETH',netkind:netkind}}).then(aresps=>{
  aresps.forEach(e=>{    const prvk=e['privatekey']; if(prvk && prvk.length>=64){} else {return false}
    try{web3.eth.accounts.wallet.add(prvk)} catch(err){console.log(err)}
  })
}) */
const createaccount=()=>{return web3.eth.accounts.create()}
web3 = Object.assign(web3, createaccount)
module.exports={ web3, web3wss, netkind,nettype,createaccount}
// module.exports={web3,netkind,nettype}

