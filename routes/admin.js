var express = require('express');
var router = express.Router();
const { tableexists
	, fieldexists
	, togglefield
	, createrow 
	, incrementrow
	, findone
	, findall
	,	countrows_scalar
}=require('../utils/db')
const db=require('../models')
const { createrow : createrow_mon 
	, findall : findall_mon
	, countrows : countrows_mon
	, dbmon
}=require('../utils/dbmon') 
const moment = require('moment');
const { ISFINITE , KEYS , create_a_uuid , gettimestr }=require('../utils/common')
const {respok,respreqinvalid,resperr , resperrwithstatus } =require('../utils/rest')
const {messages}=require('../configs/messages')
const {getuseragent , getipaddress}=require('../utils/session')
const LOGGER=console.log
const { NETTYPE } =require('../configs/net' ) // 'ETH-TESTNET'
let { Op } = db.Sequelize;
const convliker=str=>'%' + str + '%';
const { generaterandomstr } = require('../utils/common');
const TOKENLEN = 48;
const { MAP_TX_TYPES }=require('../configs/configs')

router.post('/login', async (req, res) => {
	const { username , pw } = req.body;
	LOGGER('9zDR9JKsqq',req.body);
	if( !username || !pw ) { resperr(res,messages.MSG_ARGMISSING); return; }
	findone("users", { username, pw} ).then(async resp=> {
		if(!resp){ resperr(res,messages.MSG_VERIFYFAIL); LOGGER(messages.MSG_VERIFYFAIL); return; }
		let respacct = await findone( 'users' , { username } )
		console.log(respacct);
		console.log(respacct.level);
		if(respacct.level < 5) {
			resperr(res, messages.MSG_LEVEL_FAILED); LOGGER(messages.MSG_LEVEL_FAILED); return;
		}
		const token = generaterandomstr( TOKENLEN )
		let ipaddress = getipaddress( req )
		createrow('sessionkeys', {
			username
			, token
			, useragent:getuseragent( req ).substr(0, 900)
			, ipaddress
		  }).then(async resp=>{
			let userinfo = await findone( 'users' , { username } )
			
			if(			userinfo){
				delete userinfo.pw
			}
			respok(res ,null,null, {
				respdata : token ,
				payload : {token,
					userinfo
				}		 
			})
		});
	});
})

router.post('/balances/increment/:username/:token/:value',(req,res)=>{
	let {username , token , value}=req.params
	let { writer , note  }=req.body
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
			, to_ : username
			, nettype : NETTYPE
			, typestr: +value>0? 'INCREMENT' : 'DECREMENT'
			, uuid
			, note : note? note : null
			, supertype : +value>0? 1 : 2 
		} )	
		aproms[aproms.length] = incrementrow( { table : 'balances' 
			, jfilter: { username , currency : token } 
			, fieldname : 'amount' 
			, incvalue : value
		})
		Promise.all(aproms).then(resp=>{  //			LOGGER('' , resp ) 
			respok (res,null,null, {payload: {
				uuid
			}})
		createrow ( 'pushnotifies' , {
			username
			, from_ : ''
			, to_ : ''
			, amount : value 
			, currency : token 
			, type : +value>0? MAP_TX_TYPES[ 'INCREMENT' ] : MAP_TX_TYPES[ 'DECREMENT' ]
			, typestr : +value>0? 'INCREMENT' : 'DECREMENT'
			, txhash : null // ''
			, nettype :NETTYPE 
			, title : +value>0 ? `${value} ${token} 입금되었습니다`  : `${value} ${token} 차감되었습니다`
			, contentbody : `${value} ${token}`
		})

		incrementrow({
			table : 'users'
			,	jfilter : {username}
			,	fieldname : +value>0 ? 'countincrements' : 'countdecrements'
			, incvalue : +1 
		})
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
router.get('/common/mongo/:tablename/:offet/:limit/:option',async(req,res)=>{
	let { tablename, offset, limit, option } = req.params
	offset=+offset ; limit =+limit;
	console.log(req.params);
	// findall_mon( tablename, { skip: 10, limit: 5 }, function(err, result) {
	// 	if(err){
	// 		console.log("error");
	// 		respok(res,null,null,{ err : err });
	// 	}
	// 	console.log("result");
	// 	console.log(result);
	// 	respok(res,null,null,{list : result });
	// });
	dbmon[tablename].find()
    // .select(tablename)
    .limit(limit)
    .skip(offset * limit)
    .sort({
        createdat: 'asc'
    })
    .exec(function(err, events) {
        Event.count().exec(function(err, count) {
            res.render('events', {
                events: events,
                page: page,
                pages: count / perPage
            })
        })
    })

});
router.get('/common/mongo/:tablename/datarange/:date0/:date1/:offet/:limit/:option',async(req,res)=>{
	let { tablename, date0, date1, offset, limit, option } = req.params
	offset=+offset ; limit =+limit;
	console.log(rep.params);
	findall_mon( tablename, {
		createdat: {
			$gt: new Date(date0),
			$lt: new Date(date1)
		}
	}).then(async resp => {
		console.log(resp);
	});
	// if(Number.isFinite(offset) && Number.isFinite(limit)){} else {resperr(res,messages.MSG_ARGINVALID , 53192 );return}
	// findall_mon( tablename ,{ raw: true,
	// 	where :{
	// 		createdat: {
	// 			[Op.gte] : moment(date0).add(1, "days").format('YYYY-MM-DD HH:mm:ss'),
	// 			[Op.lte] : moment(date1).add(1,'days').format('YYYY-MM-DD HH:mm:ss')
	// 			}
	// 		}
	// 	, offset,limit
	// 	, order:[ [option,'DESC'] ]
	// })
	// .then(async resp=>{
	// 	let count = await countrows_mon( tablename , {} )
	// 	respok(res,null,null,{list : resp
	// 		, payload : { count }	
	// 	})
	// });
});
router.get('/common/mongo/:tablename',async(req,res)=>{
	let { tablename }=req.params
	findall_mon( tablename ,{
	}).then(async resp=>{
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
  console.log(req.params);
  if(Number.isFinite(offset) && Number.isFinite(limit)){} else {resperr(res,messages.MSG_ARGINVALID , 75459, offset);return}
  tableexists(tablename).then(resp=>{
  	console.log(resp);
    if(resp){} else {resperr(res,messages.MSG_DATANOTFOUND);return}
    db[tablename].findAll({raw:true, where:{}
      , offset
      , limit
      , order: [['id','DESC']]
    }).then(list=>{
		console.log(list);
      respok(res,null,null,{list} )
    })
  })
})
router.get("/searchUser/:tablename/:username/:option", (req, res) => {
	let { tablename, username, option } = req.params;
	db[tablename].findAll({
		where:{
			username: username
		}, order: [[option, 'DESC']]
	}).then( list =>{
		respok(res,null,null,{ list } )
	});
})
router.get('/onlyUser/:offset/:limit',(req,res)=>{
	let { offset , limit } = req.params
	offset=+offset; limit=+limit
	if(Number.isFinite(offset) && Number.isFinite(limit)){} else {resperr(res,messages.MSG_ARGINVALID , 75459, offset);return}
	tableexists("users").then(resp=>{
	  if(resp){} else {resperr(res,messages.MSG_DATANOTFOUND);return}
	  db["users"].findAll({raw:true,
		where:{
			level: { [Op.lte] : 3 }
		}
			, offset
			, limit
			, order: [['id','DESC']]
	  }).then(list=>{
		respok(res,null,null,{list} )
	  })
	})
})
const { TOKENNAME } =require('../configs/net')
let TOKENS=[ 'ETH' , TOKENNAME ] // 'META PLANET' ]
const reduce_inner_tx_to_balances=async username=>{
	let list =	await findall('transactionsinside' , {username})
	let jdata={}
	TOKENS.forEach ( tokenelem=>{
		let listfiltered = list.filter( listelem => {return listelem.currency == tokenelem })
		false && LOGGER( '3oBdRgWscj' , listfiltered )
		if ( listfiltered){
			switch (listfiltered.length){
				case 0 : 
					jdata[ tokenelem ] =  0
				break
				case 1 : 
					jdata [tokenelem ] = listfiltered[0].amount
				break
				default :
//						jdata[ tokenelem ] =  listfiltered.reduce ((a,b)=>+a.amount + +b.amount) ; LOGGER('ks4OYb10vO' , jdata[ tokenelem ])
					jdata[ tokenelem ] = 0 
					for ( let i=listfiltered.length-1; i>=0; i--){
						jdata[ tokenelem ] += + listfiltered[i].amount
					}
				break 
			}
		} else { 
			jdata[ tokenelem ] = 0
		}
	})
// 	jdata[ tokenelem ] = listfiltered && >1? listfiltered.reduce ((a,b)=>+a.amount + +b.amount) : 0
LOGGER('Nci3humt2Y' , username , jdata)
	return jdata
}
router.get('/onlyUser/list/:offset/:limit', async(req,res)=>{
	let {date0, date1, option} = req.query;
	console.log( req.params, '', req.query,'', date0 + "/" + date1);
	let {offset,limit} = req.params
	offset=+offset ; limit =+limit;
	if(Number.isFinite(offset) && Number.isFinite(limit)){} else {resperr(res,messages.MSG_ARGINVALID , 53192 );return}
	if ( offset>=0 && limit > 0 ){} else {resperr(res , messages.MSG_ARGINVALID , 53193 ) ;return }
	let jfilter={
		level: { [Op.lte] : 3 },
//		createdat: {
	//		[Op.gte] : moment(date0).add(1, "days").format('YYYY-MM-DD HH:mm:ss')
		//, [Op.lte] : moment(date1).add(1, 'days').format('YYYY-MM-DD HH:mm:ss')
	//	}
	}
	if (option && option.length ){
		if ( typeof option == 'string' ){
		}
		else if ( typeof option == 'object' ){
			option = option[ 0 ] 
		}
			let respfieldexists =await fieldexists('users', option )
			if (respfieldexists){}
			else {option='id' }
	}
	else { option='id'}
	let jdata00={}
	let jdata01={}
	if (date0 ){	date0=gettimestr( date0 ); 	jdata00[ 'createdat' ] = { [Op.gte] : date0 } } 
	if (date1 ){	date1=gettimestr( date1 ); 	jdata01[ 'createdat' ] = { [Op.lte] : date1 } }
	db[ "users" ].findAll({raw:true
	, where :{
			level: { [Op.lte] : 3 }
			, ... jdata00 
			, ... jdata01
//		createdat: {
	//		[Op.gte] : moment(date0).add(1, "days").format('YYYY-MM-DD HH:mm:ss')
		//, [Op.lte] : moment(date1).add(1, 'days').format('YYYY-MM-DD HH:mm:ss')
//			}
		}
		, offset
		, limit
		, order:[ [option,'DESC'] ]
		}
	).then(async respusers =>{ //		console.log(resp);
		let aproms=[]; 
		let aproms_accounts=[]
		respusers.forEach ( elemuser =>{
			aproms[ aproms.length ] =reduce_inner_tx_to_balances ( elemuser.username )
			aproms_accounts [ aproms_accounts.length ]  = findone('accounts', { username : elemuser.username} )
		})
		Promise.all ( aproms).then(async respbalances =>{
			let respaccounts = await Promise.all ( aproms_accounts )
			respaccounts = 	respaccounts.map ( elem=>{ delete elem.privatekey ; return elem } ) 
			LOGGER( 'ia0jPUpeqU' , respbalances )
			let list = respusers.map ( (elemuser, idx) => { return { 
				... elemuser 
				, ... respbalances[ idx ]
				, balance : respbalances[ idx ]
				, account : respaccounts[ idx]  } } ) 
			let count=			await countrows_scalar("users" , jfilter) 
			respok(res,null,null,{list  , payload : {count} })
		})
	})
})

router.get('/onlyUser/daterange/:offset/:limit', async(req,res)=>{
	let {date0, date1, option} = req.query;
	console.log(date0 + "/" + date1);
	let {offset,limit} = req.params
	offset=+offset ; limit =+limit;
	if(Number.isFinite(offset) && Number.isFinite(limit)){} else {resperr(res,messages.MSG_ARGINVALID , 53192 );return}
	let jfilter={
		level: { [Op.lte] : 3 },
		createdat: {
			[Op.gte] : moment(date0).add(1, "days" ).format('YYYY-MM-DD HH:mm:ss')
		, [Op.lte] : moment(date1).add(1, 'days' ).format('YYYY-MM-DD HH:mm:ss')
		}
	}
	db[ "users" ].findAll({raw:true
	, where :{
		level: { [Op.lte] : 3 },
		createdat: {
			[Op.gte] : moment(date0).add(1, "days" ).format('YYYY-MM-DD HH:mm:ss')
		, [Op.lte] : moment(date1).add(1, 'days' ).format('YYYY-MM-DD HH:mm:ss')
			}
		}
		, offset,limit
		, order:[ [option,'DESC'] ]
		}
	).then(async respusers =>{ //		console.log(resp);
		let aproms=[]
		respusers.forEach ( elem=>{
			aproms[aproms.length ] =reduce_inner_tx_to_balances ( elem.username )
		})
		Promise.all ( aproms).then(async resp=>{
			let list = respusers.map ( (elemuser, idx) => { return { ... elemuser , ... resp[idx ] } } ) 
			let count=			await countrows_scalar("users" , jfilter) 
			respok(res,null,null,{list  , payload : {count} })
		})

	})
})

router.get('/onlyUser/searches/:keyword/:offset/:limit/:option', async(req,res)=>{
	let {keyword , offset , limit, option} = req.params
	offset=+offset ; limit= +limit
	if(Number.isFinite(offset) && Number.isFinite(limit)){} else {resperr(res,messages.MSG_ARGINVALID , 80536 );return}
	let liker = convliker( keyword )
	let jfilter= {
			[Op.and] : [
				{ level: {[Op.lte] : 3} },	
			],
			[Op.or] : [
					{ username : {[Op.like] : liker } },
			]
		}
	db["users"].findAll({raw: true,
		where : {
			[Op.and] : [
					{ level: {[Op.lte] : 3} },	
			],
			[Op.or] : [
					{ username : {[Op.like] : liker } },
			]
		}
		, offset , limit
		,order:[ [option, 'DESC'] ]
	}).then(async resp=>{
		let count = await countrows_scalar ("users", jfilter)
		respok(res,null,null,{ list : resp , 
			payload: {	count
			}
		})
	})
})

router.get('/common/:tablename/daterange/:offset/:limit', async(req,res)=>{
	let {date0,date1,option} = req.query;
	console.log(date0 + "/" + date1);
	let {offset,limit , tablename} = req.params
	offset=+offset ; limit =+limit;
	if(Number.isFinite(offset) && Number.isFinite(limit)){} else {resperr(res,messages.MSG_ARGINVALID , 53192 );return}
	let jfilter={
		createdat: {
			[Op.gte] : moment(date0).add(1, "days").format('YYYY-MM-DD HH:mm:ss')
		, [Op.lte] : moment(date1).add(1,'days').format('YYYY-MM-DD HH:mm:ss')
			}
	}
	db[ tablename ].findAll({raw:true
	, where :{
		createdat: {
			[Op.gte] : moment(date0).add(1, "days").format('YYYY-MM-DD HH:mm:ss')
		, [Op.lte] : moment(date1).add(1,'days').format('YYYY-MM-DD HH:mm:ss')
			}
		}
		, offset,limit
		, order:[ [option,'DESC'] ]
		}
	).then(async resp=>{
		console.log(resp);
		let count=			await countrows_scalar(tablename , jfilter) 
		respok(res,null,null,{list : resp , payload : {count} })
	})
})


router.get('/searches/tokens/:keyword/:offset/:limit/:option' , async(req,res)=>{
	let {keyword , offset , limit, option}=req.params
	offset=+offset ; limit= +limit
	if(Number.isFinite(offset) && Number.isFinite(limit)){} else {resperr(res,messages.MSG_ARGINVALID , 80536 );return}
	let liker = convliker( keyword )
	let jfilter= {
			[Op.or] : [
					{name : {[Op.like] : liker }}
			]
		}
	db["tokens"].findAll({raw: true,
		where : {
			[Op.or] : [
					{name : {[Op.like] : liker }}
			]
		}
		, offset , limit
		,order:[ [option, 'DESC'] ]
	}).then(async resp=>{
		let count = await countrows_scalar ("tokens", jfilter)
		respok(res,null,null,{ list : resp , 
			payload: {	count
			}
		})
	})
})

router.get('/transactions/daterange/:where/:offset/:limit', async(req,res)=>{
	let {date0, date1, option} = req.query;
	console.log(date0 + "/" + date1);
	let {where, offset,limit} = req.params
	offset=+offset ; limit =+limit;
	if(Number.isFinite(offset) && Number.isFinite(limit)){} else {resperr(res,messages.MSG_ARGINVALID , 53192 );return}
	let jfilter={
		createdat: {
			[Op.gte] : moment(date0).add(1, "days").format('YYYY-MM-DD HH:mm:ss')
		, [Op.lte] : moment(date1).add(1,'days').format('YYYY-MM-DD HH:mm:ss')
			}
	}
	db[ "transactions"+where ].findAll({raw:true
	, where :{
		createdat: {
			[Op.gte] : moment(date0).add(1, "days").format('YYYY-MM-DD HH:mm:ss')
		, [Op.lte] : moment(date1).add(1,'days').format('YYYY-MM-DD HH:mm:ss')
			}
		}
		, offset,limit
		, order:[ [option,'DESC'] ]
		}
	).then(async resp=>{
		false && console.log('' , resp);
		let count=			await countrows_scalar("transactions"+where , jfilter) 
		respok(res,null,null,{list : resp , payload : {count} })
	})
})

router.get('/transactions/searches/:where/:keyword/:offset/:limit/:option', async(req,res)=>{
	let {where, keyword , offset , limit, option} = req.params
	offset=+offset ; limit= +limit
	if(Number.isFinite(offset) && Number.isFinite(limit)){} else {resperr(res,messages.MSG_ARGINVALID , 80536 );return}
	let liker = convliker( keyword )
	let jfilter= {
			[Op.or] : [
					{ currency : {[Op.like] : liker } },
			],
			[Op.or] : [
				{ username : {[Op.like] : liker } },
			]
		}
	db["transactions"+where].findAll({raw: true,
		where : {
			[Op.or] : [
					{ currency : {[Op.like] : liker } },
			],
			[Op.or] : [
					{ username : {[Op.like] : liker } },
			]
		}
		, offset , limit
		,order:[ [option, 'DESC'] ]
	}).then(async resp=>{
		let count = await countrows_scalar ("transactions"+where, jfilter)
		respok(res,null,null,{ list : resp , 
			payload: {	count
			}
		})
	})
})

router.get('/onlyUser/createdat/:username',(req, res)=>{
	const { username } = req.params;
	console.log("username");
	console.log(username);
	
	respok(res,null,null, { payload: {username: "hi"} } )

	// findall("users", { username } ).then( resp=> {
	// 	console.log(resp[0].createdat);
	// 	respok( res, null, null, { payload: { createdat: resp[0].createdat} } );
	// });
	

	// findall('transactionsinside', {username}).then(list=>{
	// 	console.log(list);
	// 	respok(res,null,null, { payload: {list} } )
	// })
})
router.get('/onlyUser/detailHistory/:username',(req, res)=>{
	const { username } = req.params;
	console.log("history username:");
	console.log(username);
	
	respok(res,null,null, { payload: {username: "hi"} } )

	// findall("users", { username } ).then( resp=> {
	// 	console.log(resp[0].createdat);
	// 	respok( res, null, null, { payload: { createdat: resp[0].createdat} } );
	// });
	

	// findall('transactionsinside', {username}).then(list=>{
	// 	console.log(list);
	// 	respok(res,null,null, { payload: {list} } )
	// })
})
module.exports = router;
