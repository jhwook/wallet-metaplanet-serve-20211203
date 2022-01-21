var express = require('express');
var router = express.Router();
const moment=require('moment')
/* GET home page. */
const {respok , resperr } =require('../utils/rest')
let {create_a_uuid , gettimestr }=require('../utils/common')
const {getusernamefromsession}=require('../utils/session')
const { findone,createrow}=require('../utils/db')
const { messages}=require('../configs/messages') 
const { v5 : uuidv5 } =require('uuid')
const { NETTYPE } =require('../configs/net' )
// let NET TYPE='ETH-TESTNET'
router.post('/transaction/imadeatx/:txhash',(req,res)=>{
  const username=getusernamefromsession(req);
  if(username){} else{resperr (res,messages.MSG_PLEASELOGIN);return}
	let {txhash}=req.params
	let {from_     , to_            , amount    , currency  , nettype : NETTYPE , typestr  }=req.body

	let TABLENAME='transactionsoutside'
	findone( TABLENAME , {
		txhash
	}).then(resp=>{
		if(resp){
			resperr(res,messages.MSG_DATADUPLICATE);return
		} else {
			let uuid = uuidv5 ( txhash , Array.from ( Array(16).keys() ) )
			createrow( TABLENAME , 
				{ username
					, txhash
					, nettype : NETTYPE
					, supertype : typestr.match ( /^RECEIVE/ ) ? 1 : 2
					, uuid
//					, typestr: 'SEND-ETH'
					, ... req.body
				}
			).then(resp=>{
				respok ( res )
			})	
		}
	})
})
/** 
  username  | varchar(80)
| from_     | varchar(80)
| to_       | varchar(80)
| txhash    | varchar(80)
| amount    | varchar(20)
| currency  | varchar(20)
| nettype   | varchar(20)
| writer    | varchar(80)
| type      | tinyint(4) 
| typestr   | varchar(20)
| uuid      | varchar(50)
| supertype | tinyint(4) 
*/

router.post('/withdraw/:token/:amount/:toaddress',(req,res)=>{
  const username=getusernamefromsession(req);
  if(username){} else{resperr (res,messages.MSG_PLEASELOGIN);return}
	let uuid = create_a_uuid()
	respok ( res,null,null , { payload : {uuid
		, timestamp : gettimestr()
		} 
	})
})

module.exports = router;
