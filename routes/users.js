var express = require('express');
var router = express.Router();
const {findone,findall,createrow , updaterow
, countrows_scalar
}=require('../utils/db')
const { updaterow : updaterow_mon}=require('../utils/dbmon')
const KEYS=Object.keys 
const {LOGGER,generaterandomstr , generaterandomstr_charset , gettimestr }=require('../utils/common')
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
const { createaccount }=require('../configs/configweb3')
let nettype='ETH-TESTNET'
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
const MAP_USERPREFS_KEYS={
	notitransactions : 1
	, notinotifies : 1
	, notipromoevents : 1
}
router.get('/userprefs',(req,res)=>{
  const username=getusernamefromsession(req);
  if(username){} else{resperr (res,messages.MSG_PLEASELOGIN);return}
})
const generate_token_and_store=(username, req)=>{
	return new Promise ((resolve,reject)=>{
	  const token=generaterandomstr(TOKENLEN)
//		let username=address
	  let ipaddress = getipaddress(req)
  	createrow('sessionkeys', {
    	username
	    , token
  	  , useragent:getuseragent(req)
	    , ipaddress : getipaddress(req)
  	}).then(async resp=>{
			resolve( token)
   // 	respok(res ,null,null,{respdata:token })
		})
	})
}
router.post('/join',(req,res)=>{let {
	username 
	, nickname
	, pw 
	, email  }=req.body ; LOGGER('' , req.body)
	if(username && pw ){} else {resperr(res, messages.MSG_ARGMISSING,40761);return false}
	findone( 'users' , {username} ).then(respuser=>{ // email 
		if(respuser){resperr(res,messages.MSG_ID_DUP,82532);return false}
		createrow('users', {username
		, nickname
		, pw
		, ip : getipaddress(req)
		, email 
		, active:1
//		, pwhash:hasher(pw)
	}) //    db.operations.findOne({raw:true,where:{key_:'CURRENCIES'}}).then(respcurr=>{      const currencies=JSON.parse(respcurr['value_'])
	let acct = createaccount()
	createrow('accounts' , {
		username
		, ... acct
		, privatekey : acct.privateKey
		, nettype
	}).then(resp=>{
		generate_token_and_store(username , req).then(token=>{
			respok(res,null,null , {payload : {
				address : acct . address 
				, nettype
				, token
			}})
		})
	})
	false && callhook({name:username,path:'join'});return false
	})
})
/** {
  address: '0x37BD824BD9ca792a76B2c0376DF8f937623432d0',
  privateKey: '0xcf8f3a4e03c59f9a5e255b1e8160cdbf088c403b930c4676a35fbdd7abbc0d51',
*/
const MAP_FIELDS_ALLOWED_TO_CHANGE={pw : 1, nickname : 1 }
router.post('/user/myinfo',(req,res)=>{
  const username=getusernamefromsession(req);
  if(username){} else{resperr (res,messages.MSG_PLEASELOGIN);return}
  LOGGER('8t6dIUoLNx',req.body)
  let jreqbody={... req.body}
  let akeys=KEYS(jreqbody)
  akeys.forEach(elem=>{
    if(jreqbody[elem]){}
    else {delete jreqbody[elem]}
    if (MAP_FIELDS_ALLOWED_TO_CHANGE[ elem] ){}
    else { delete jreqbody[elem] }
  })
  if(KEYS(jreqbody).length>0){}
  else {resperr(res,messages.MSG_ARGINVALID);return}
  updaterow('users', {username} , {... jreqbody})
    respok(res)
  updaterow_mon('users' , { username} , {... jreqbody} ).then(resp=>{
  }).catch(err=>{
    resperr(res,messages.MSG_INTERNALERR)
  })
})

router.get('/user/myinfo',async (req , res)=>{
  const username = getusernamefromsession(req);
  if(username){} else{resperr(res,messages.MSG_PLEASELOGIN , 403);return}
  findone( 'users' , { username } ).then(async resp=>{
		delete resp.pw

		let respacct = await findone('accounts' , { username } )
				
		respok ( res, null, null , {payload : {
			myinfo : resp					
			, accounts : {
				'ETH-TESTNET' : respacct.address 
			}
		}})
  })
})
router.get('/user/myinfo/mongo',async (req , res)=>{
  const username=getusernamefromsession(req);
  if(username){} else{resperr(res,messages.MSG_PLEASELOGIN , 403);return}
  dbmon.users.findOne( {username:username} , async(err,doc)=>{
    if(err){LOGGER('',err);resperr(res,messages.MSG_INTERNALERR , 500);return}
    let countfavorites = await countrows_scalar( 'logfavorites',{ username , status : 1 })
    query_user_market_acts( username ).then( respusermarket =>{
      respok(res,null,null,{respdata:doc,
        payload : { ... respusermarket
        , countfavorites
        }
      })
    })
  } )
})

router.post('/email/verifycode/:emailaddress/:code',(req,res)=>{
	const {emailaddress , code }=req.params
	findone('emailverifycode' , {emailaddress : emailaddress}).then(resp=>{
		if(resp){} else {resperrwithstatus(res,412,messages.MSG_DATANOTFOUND);return}
		if(resp['code']==code){} else {resperrwithstatus(res,406,messages.MSG_VERIFYFAIL);return}
		respok(res)
	})
})
router.get('/email/verifycode/:emailaddress',(req,res)=>{
	const {emailaddress}=req.params
	if(validateemail(emailaddress)){} else {resperrwithstatus(res,406,messages.MSG_ARGINVALID );return}
	sendemail(emailaddress).then(resp=>{
		if(resp.status){respok(res);return}
		else {resperrwithstatus(res,501,resp.reason);return}
	})
})
router.post('/login', async(req,res)=>{
  const { username , pw }=req.body
  LOGGER('m9m9hptxoA',req.body) //  respok(res);return
  if( username && pw ){} else {resperr(res,messages.MSG_ARGMISSING);return}
//  let isaddressvalid = WAValidator.validate(address , cryptotype.toLowerCase() )
//  if(isaddressvalid){} else {   resperr(res , messaegs.MSG_ARGINVALID);return
//  }
	findone('users', {username,pw}).then(async resp=>{
		if(resp){}
		else {resperr(res,messages.MSG_VERIFYFAIL);return}

		let respacct = await findone( 'accounts' , { username } )
//		let jacct= {}
	//	jacct= { address : respacct.address , nettype : 'ETH-TESTNET' }

	  const token = generaterandomstr(TOKENLEN)
	  let ipaddress = getipaddress(req)
	  createrow('sessionkeys', {
  	  username
    	, token
	    , useragent:getuseragent(req).substr(0,900)
  	  , ipaddress
	  }).then(async resp=>{
  	  respok(res ,null,null,{respdata:token , 		payload : {token
				, accounts : {
					'ETH-TESTNET' : respacct.address
				}  
			}		 })
		})
	})
})
router.post('/logout',(req,res)=>{  LOGGER('/logout' ,req.headers.token )
  if(req.headers.token){} else {resperrwithstatus(res,403,messages.MSG_PLEASELOGIN , 36632);return}
  db.sessionkeys.findOne({where:{token:req.headers.token}}).then(respfind=>{
    if(respfind && respfind.dataValues){} else {resperrwithstatus(res,403,messages.MSG_PLEASELOGIN);return}
    if(respfind.dataValues.active){} else {resperrwithstatus(res,412,messages.MSG_SESSIONEXPIRED);return }
    respfind.update({active:0}).then(respupdate=>{      respok(res)
/**       let {dataValues}=respfind ;      if(dataValues.isoauth){} else {return}
      db.oauthsessions.findOne({where:{id:dataValues.idtooauthtable}}).then(respoauth=>{
        respupdate.update({active:0})
      }).catch(err=>{LOGGER('PCXENcujpp' ,err) ; resperr(res) })
*/
    }).catch(err=>{LOGGER('sHw1wZpAZ4',err);resperr(res) })
  }).catch(err=>{LOGGER('Cf9NiZEEY7',err);resperr(res) })
})

module.exports = router;
