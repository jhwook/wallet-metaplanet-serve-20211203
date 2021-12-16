
var express = require('express');
var router = express.Router();
const { tableexists
	, fieldexists
	, togglefield
	, createrow 
	, incrementrow
	, findone
	, findall
}=require('../utils/db')
const { createrow : createrow_mon 
	, findall : findall_mon
	, countrows : countrows_mon 
}=require('../utils/dbmon') 
const { ISFINITE , KEYS , create_a_uuid }=require('../utils/common')
const {respok,respreqinvalid,resperr , resperrwithstatus } =require('../utils/rest')
const {messages}=require('../configs/messages')
const {getuseragent , getipaddress}=require('../utils/session')
const LOGGER=console.log
let NETTYPE = 'ETH-TESTNET'

router.post('/balances/increment/:username/:token/:value',(req,res)=>{
	let {username , token , value}=req.params
	let { writer }=req.body
	findone('users', {username}).then(resp=>{
		if(resp){} else {resperr(res,messages.MSG_DATANOTFOUND);return}
		let uuid =		create_a_uuid	() 
		LOGGER('hvBPgIJ6cy' , uuid )
		let aproms= [] 
		aproms[aproms.length] = createrow	('transactionsinside' , {
			username
			, amount : value
			, currency : token
			, from_ : writer
			, nettype : NETTYPE
			, typestr: +value>0? 'INCREMENT' : 'DECREMENT'
			, uuid 		
		} )	
		aproms[aproms.length] = incrementrow( { table : 'balances' 
			, jfilter: { username , currency : token } 
			, fieldname : 'amount' 
			, incvalue : value
		})
		Promise.all(aproms).then(resp=>{ 
			LOGGER('' , resp ) 
			respok (res,null,null, {payload: {
				uuid
			}})
		})
	})
})
/**transactionsinside;
+-----------+------------------+------+-----+---------------------+-------------------------------+
| Field     | Type             | Null | Key | Default             | Extra                         |
+-----------+------------------+------+-----+---------------------+-------------------------------+
| username  | varchar(80)      | YES  |     | NULL                |                               |
| amount    | varchar(20)      | YES  |     | NULL                |                               |
| currency  | varchar(20)      | YES  |     | NULL                |                               |
| from_     | varchar(80)      | YES  |     | NULL                |                               |
| to_       | varchar(80)      | YES  |     | NULL                |                               |
| writer    | varchar(80)      | YES  |     | NULL                |                               |
| nettype   | varchar(20)      | YES  |     | NULL                |                               |
| type      | tinyint(4)       | YES  |     | NULL                |                               |
| typestr   | varchar(20)      | YES  |     | NULL                |                               |
| uuid      | varchar(50)      | YES  |     | NULL                |      
*/
router.post ('/common/increment/:tablename/:fieldname/:value',(req,res)=>{
	LOGGER('MHVIz8Rje3' , req.body )
	let { tablename , fieldname , value }=req.params
	if( KEYS(req.body).length ){}
	else {resperr(res,messages.MSG_ARGMISSING );return}
	fieldexists (tablename , fieldname).then(resp=>{
		if(resp){} else {resperr( res,messages.MSG_DATANOTFOUND); return }
		incrementrow( { table : tablename 
			, jfilter: { ... req.body } 
			, fieldname 
			, incvalue : value
		}).then(resp=>{
			respok(res)
		})
//		incrementrow( tablename , { ... req.body } , fieldname , value )
	})
})
router.post ('/XXX/common/increment/:tablename/:fieldname/:value',(req,res)=>{
	let { tablename , fieldname , value }=req.params
	let { filterkey , filterval } =req.body
	if( filterkey && ( filterval || ISFINITE(filterval))){}
	else {resperr(res,messages.MSG_ARGMISSING );return}
	fieldexists (tablename , fieldname).then(resp=>{
		if(resp){} else {resperr( res,messages.MSG_DATANOTFOUND); return }
		let jfilter={} ; jfilter[ filterkey ] =filterval 
		incrementrow( tablename , { ... jfilter } , fieldname , value )
	})
})
router.post( '/common/create/maria/:tablename', async(req,res)=>{
	let {tablename}=req.params
	let bfieldsvalid=true
	KEYS(req.body).forEach(async elem=>{
		let resp=await fieldexists( tablename , elem)
		if(resp){}
		else {bfieldsvalid=false;  return}
	})
	if(bfieldsvalid){}
	else {resperr(res,messages.MSG_FIELDNOTFOUND); return}
	createrow(tablename , { ... req.body } ).then(resp=>{
		if(resp){} else {resperr(res, messages.MSG_INTERNALERR ) ; return}
		respok( res)
	})
})
router.post( '/common/create/mongo/:tablename', async(req,res)=>{
	let {tablename}=req.params
	createrow_mon(tablename , { ... req.body } ).then(resp=>{
		if(resp){} else {resperr(res, messages.MSG_INTERNALERR ) ; return}
		respok( res)
	})
})
router.post('/token/register',(req,res)=>{
	let { name , address ,writer , active }=req.body
	if (name && address){}
	else {resperr(res, messages.MSG_ARGMISSING, 48916 );return}
	let nettype=NETTYPE
	findone('tokens' , {address , nettype}).then(resp=>{
		if(resp){resperr(res,messages.MSG_DATADUPLICATE ); return} else {}
		createrow( 'tokens' , { name , address ,writer , active } ).then(resp=>{
			respok(res )
		})
	})
})
router.post('/toggle/:tablename/:fieldname',(req,res)=>{
	let { tablename , fieldname}=req.params
	let { filterkey , filterval } =req.body ; LOGGER('JxiJ87QTfb' , req.body )
	if (tablename && fieldname ){}
	else {resperr(res,messages.MSG_ARGINVALID , 81515  );return}
	if( filterkey && ( filterval || ISFINITE(filterval))){}
	else {resperr(res,messages.MSG_ARGMISSING , 23526 );return}
	let jfilter={}
	jfilter [ filterkey ] =filterval
	fieldexists( tablename , fieldname ).then(async resp=>{
		if(resp){} else {resperr(res,messages.MSG_DATANOTFOUND , 77273 );return}
		togglefield( tablename , jfilter , fieldname ).then(resp=>{
			if( ISFINITE( resp)){}
			else { resperr(res,messages.MSG_DATANOTFOUND , 75784);return}
			respok ( res,null,null, {payload : {aftertogglevalue : resp }})
		})	
	})
})

router.get('/common/mongo/:tablename',async(req,res)=>{
	let { tablename }=req.params
	findall_mon( tablename ,{}).then(async resp=>{
		let count = await countrows_mon( tablename , {} )
		respok(res,null,null,{list : resp
			, payload : { count }	
		})
	})
})

router.get('/common/:tablename/count',async(req,res)=>{
	let {tablename}=req.params
	tableexists(tablename).then(async resp=>{
		if(resp){} else {resperr(res,messages.MSG_DATANOTFOUND);return}
		let respcount = await countrows_scalar (tablename , {})
		respok(res,null,null,{respdata: respcount })
	})
})
router.get('/common/:tablename',(req,res)=>{
	let {tablename}=req.params
//	tableexists(
	findall( tablename ,{}).then(resp=>{
		if (tablename=='users'){
			resp = resp.map(elem=> {delete elem.pw; delete elem.pwhash; return elem}) 
			respok(res,null,null,{list : resp })
		}
		else {
			respok(res,null,null,{list : resp })
		}
	})
})
router.get('/common/:tablename/:offset/:limit',(req,res)=>{
  let {tablename , offset , limit }=req.params
  offset=+offset ; limit= +limit
  if(Number.isFinite(offset) && Number.isFinite(limit)){} else {resperr(res,messages.MSG_ARGINVALID , 75459);return}
  tableexists(tablename).then(resp=>{
    if(resp){} else {resperr(res,messages.MSG_DATANOTFOUND);return}
    db[tablename].findAll({raw:true, where:{}
      , offset
      , limit
      , order: [['id','DESC']]
    }).then(list=>{
      respok(res,null,null,{list} )
    })
  })
})
router.get('/common/:tablename/daterange/:offset/:limit', async(req,res)=>{
	let {date0,date1}=req.query
	let {offset,limit , tablename } = req.params
	offset=+offset ; limit =+limit
	if(Number.isFinite(offset) && Number.isFinite(limit)){} else {resperr(res,messages.MSG_ARGINVALID , 53192 );return}
	let jfilter={
		createdat: {
			[Op.gte] : moment(date0).format('YYYY-MM-DD HH:mm:ss')
		, [Op.lte] : moment(date1).add(1,'days').format('YYYY-MM-DD HH:mm:ss')
			}
	}
	db[ tablename ].findAll({raw:true
	, where :{
		createdat: {
			[Op.gte] : moment(date0).format('YYYY-MM-DD HH:mm:ss')
		, [Op.lte] : moment(date1).add(1,'days').format('YYYY-MM-DD HH:mm:ss')
			}
		}
		, offset,limit
		, order:[ ['id','DESC'] ]
		}
	).then(async resp=>{
		let count=			await countrows_scalar(tablename , jfilter) 
		respok(res,null,null,{list : resp , payload : {count} })
	})
})

module.exports = router;

