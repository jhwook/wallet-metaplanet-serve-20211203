var express = require('express');
var router = express.Router();
const {findone,findall,createrow , updaterow
, countrows_scalar
, createorupdaterow
}=require('../utils/db')
const { updaterow : updaterow_mon}=require('../utils/dbmon')
const KEYS=Object.keys 
const {LOGGER,generaterandomstr , generaterandomstr_charset , gettimestr
	, convaj
 }=require('../utils/common')
const {respok,respreqinvalid,resperr , resperrwithstatus } =require('../utils/rest')
const {messages}=require('../configs/messages')
const {getuseragent , getipaddress}=require('../utils/session')
const {sendemail, sendemail_customcontents_withtimecheck}=require('../services/mailer')
const {validateemail}=require('../utils/validates')
const db=require('../models')
// const dbmon=require('../modelsmongo')
const {getusernamefromsession}=require('../utils/session')
// const { createrow:createrow_mon , updaterow : updaterow_mon }=require('../utils/dbmon')
const TOKENLEN=48
const { web3, createaccount }=require('../configs/configweb3')
//const { getWalletRecode } = require("../utils/wallet_recode");
const { getWalletRecode } = require("../utils/wallet_recode");
const { getMetaplanetRecode } = require("../utils/wallet_recode_metaplanet");
const { getPolygon } = require("../utils/get_polygon");
const {generateSlug }=require('random-word-slugs')
// let net type='ETH-TESTNET'
/* GET users listing. */

let legend = [
	'count_users'
	, 'count_txs_external_deposit'
	, 'count_txs_external_withdraw'
	, 'count_txs_internal_deposit'
	, 'count_txs_internal_withdraw'
]
router.get('/dash', (req,res)=>{
	let aproms=[]
	aproms[aproms.length] = countrows_scalar('users', {}) // 0
	aproms[aproms.length] = countrows_scalar('transactionsoutside' , {supertype : 1} ) // 1 , in 
	aproms[aproms.length] = countrows_scalar('transactionsoutside' , {supertype : 2} ) // 2, out
	aproms[aproms.length] = countrows_scalar('transactionsinside' , {supertype : 1} ) // 2, out
	aproms[aproms.length] = countrows_scalar('transactionsinside' , {supertype : 2} ) // 2, out
	Promise.all ( aproms).then(resp=>{
		let jdata={}
		legend.forEach( ( elem , idx ) =>{
			jdata [elem ] = resp[ idx ] 
		})
		respok ( res, null,null ,{list : jdata } )
	})
})

module.exports = router;
