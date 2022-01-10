var express = require('express');
var router = express.Router();
const moment=require('moment')
const { PARSER } = require('../utils/common')
const { messages } = require ( '../configs/messages')
/* GET home page. */
const {respok} =require('../utils/rest')
const cliredisa=require('async-redis').createClient()

router.get('/eth/month',(req,res)=>{	//	const { date1, date2 } = req.params;
	cliredisa.hget( 'TICKERS-ETH-MONTHLY' , 'ETH-USDT').then(resp=>{
		if (resp && resp.length ){}
		else {resperr(res , messages.MSG_DATANOTFOUND) ; return }
		respok ( res, null , null , { 
			payload : {
				getData : PARSER(resp)
			}
		}) 
	})
})

router.get('/polygon',(req,res)=>{
	//	const { date1, date2 } = req.params;
		getPolygon().then(resp=>{
			respok ( res, null, null , {payload : {
				getData: resp
			}})
		});
	})
	
router.get('/tickers', (req,res)=>{
	let aproms=[]
	aproms [ aproms.length ] =	cliredisa.hgetall('TICKERS-USDT')
	aproms [ aproms.length ] =	cliredisa.hgetall('TICKERS-USDT-UPDATES')
	Promise.all(aproms).then(resp=>{						
		respok(res, null , null , {payload:{
			list : resp[0] 
			, updatetimes : resp[1]
			 }
			}
		)	
	})
})
module.exports = router;
