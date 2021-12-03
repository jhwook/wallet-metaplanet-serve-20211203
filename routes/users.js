var express = require('express');
var router = express.Router();
const {findone,findall,createrow , updaterow
, countrows_scalar
}=require('../utils/db')
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

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/join',(req,res)=>{let {username , pw }=req.body
	if(username && pw ){} else {resperr(res, messages.MSG_ARGMISSING,40761);return false}
	findone( 'users' , {username} ).then(respuser=>{
		if(respuser){resperr(res,messages.MSG_ID_DUP,82532);return false}
		createrow({username 
		, pw 
		, ip
		, active:1
//		, pwhash:hasher(pw)
	}) //    db.operations.findOne({raw:true,where:{key_:'CURRENCIES'}}).then(respcurr=>{      const currencies=JSON.parse(respcurr['value_'])
	respok(res,null,null)
	false && callhook({name:username,path:'join'});return false
	})
})
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
  updaterow_mon('users' , { username} , {... jreqbody} ).then(resp=>{
    respok(res)
  }).catch(err=>{
    resperr(res,messages.MSG_INTERNALERR)
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
  const {address , cryptotype }=req.body
  LOGGER('m9m9hptxoA',req.body) //  respok(res);return
  if(address && cryptotype){} else {resperr(res,messages.MSG_ARGMISSING);return}
  let isaddressvalid = WAValidator.validate(address , cryptotype.toLowerCase() )
  if(isaddressvalid){} else {   resperr(res , messaegs.MSG_ARGINVALID);return
  }
  const token=generaterandomstr(TOKENLEN)
  let username=address
  let ipaddress = getipaddress(req)
  createrow('sessionkeys', {
    username
    , token
    , useragent:getuseragent(req)
    , ipaddress
  }).then(async resp=>{
    respok(res ,null,null,{respdata:token })
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
