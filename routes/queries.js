var express = require('express');
var router = express.Router();
const {findone,findall,createrow , updaterow
, countrows_scalar
, createorupdaterow
	, fieldexists
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
let nettype='ETH-TESTNET'

router.get('/:tablename/:fieldname/:fieldval' , (req,res)=>{
	let {tablename , fieldname , fieldval }=req.params
	if (tablename=='users'){resperr(res , messages.MSG_NOT_PRIVILEGED ) ; return }
	fieldexists ( tablename , fieldname).then(resp=>{
		if (resp){}
		else { resperr( res, messages.MSG_DATANOTFOUND); return }
		let  jfitler = {}
		jfilter [ fieldnamn ]  = fieldval
		findone ( tablename , {... jfilter } ).then(resp=>{
			if ( resp) {}
			else {resperr( res, messages.MSG_DATANOTFOUND ) ; return }
			respok ( res, null ,null , {payload : {rowdata : resp } } )
		})
	})
})



module.exports = router;
