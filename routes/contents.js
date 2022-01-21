var express = require('express');
var router = express.Router();
const moment=require('moment')
/* GET home page. */
const {respok , resperr } =require('../utils/rest')
const dbmon=require('../modelsmongo')
let { findall : findall_mon , createrow : createrow_mon } =require('../utils/dbmon')
let { findall  , updatetable , createrow } =require('../utils/db')
const {messages}=require('../configs/messages')
const { ISFINITE , LOGGER 
	, create_a_uuid
} = require('../utils/common') 
const {getusernamefromsession}=require('../utils/session')

router.get('/pushnotifies', (req,res)=>{
	let username = getusernamefromsession (req ) 
  if(username){} else{resperr (res,messages.MSG_PLEASELOGIN);return}
	let { markasread }=req.query
	LOGGER( 'e6H9QuXXxN' , req.query)
	markasread = + markasread
	findall ('pushnotifies' , { username}).then(resp=>{
		let countunread =0
		if(resp.length){
			countunread = resp.filter(elem=> elem.read_== 0).length
		}
		else {
		}
		respok (res, null ,null , {list : resp , payload : {countunread}})
		if (ISFINITE ( markasread ) && markasread > 0 ) {
			updatetable ( 'pushnotifies' , { username } , {
				read_ : 1
			} )	
		}
	})
})
router.post('/notifies', (req,res)=>{ 	LOGGER('9D3l4ZvTnD' , req.body )
	let {title , contentbody , writer // , countviews
	}=req.body
	let uuid = create_a_uuid()
	createrow('notifies' , {... req.body
		, uuid
	}).then(resp=>{
		respok(res, null, null , {payload : {uuid }} )
	})
})
router.get('/notifies',(req,res)=>{
	findall ('notifies' , {} ).then(list=>{
		respok(res,null,null,{ 
			payload : {
				list
			}
		} )
	})
})

module.exports = router;
