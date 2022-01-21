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
const { NETTYPE }=require( '../configs/net')
// let nettype='ETH-TESTNET'
/* GET users listing. */

router.get('/',(req,res)=>{
	findone('tokens', {istoken:1 , nettype: NETTYPE , active : 1 }).then(resp=>{ // 'ETH-MAINNET'
		respok ( res, null, null , {respdata : resp } )
	})
})
module.exports = router;
