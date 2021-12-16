var express = require('express');
var router = express.Router();
const moment=require('moment')
/* GET home page. */
const {respok , resperr } =require('../utils/rest')
let {create_a_uuid , gettimestr }=require('../utils/common')
const {getusernamefromsession}=require('../utils/session')
const { findone,createrow}=require('../utils/db')
const { messages}=require('../configs/messages') 
let NETTYPE='ETH-TESTNET'
router.post('/transaction/imadeatx/:txhash',(req,res)=>{
  const username=getusernamefromsession(req);
  if(username){} else{resperr (res,messages.MSG_PLEASELOGIN);return}
	let {txhash}=req.params
	let TABLENAME='transactionsoutside'
	findone( TABLENAME , {
		txhash
	}).then(resp=>{
		if(resp){
			resperr(res,messages.MSG_DATADUPLICATE);return
		} else {
			createrow( TABLENAME , 
				{ username
					, txhash
					, nettype : NETTYPE
					, typestr: 'SEND-ETH'
				}
			).then(resp=>{
				respok ( res )
			})	
		}
	})
})
/** username  | varchar(80)      | YES  |     | NULL                |                               |
| from_     | varchar(80)      | YES  |     | NULL                |                               |
| to_       | varchar(80)      | YES  |     | NULL                |                               |
| txhash    | varchar(80)      | YES  |     | NULL                |                               |
| amount    | varchar(20)      | YES  |     | NULL                |                               |
| currency  | varchar(20)      | YES  |     | NULL                |                               |
| nettype   | varchar(20)      | YES  |     | NULL                |                               |
| writer    | varchar(80)      | YES  |     | NULL                |                               |
| type      | tinyint(4)       | YES  |     | NULL                |                               |
| typestr   | varchar(20)      | YES  |     | NULL 
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
