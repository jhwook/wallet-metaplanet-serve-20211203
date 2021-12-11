var express = require('express');
var router = express.Router();
const moment=require('moment')
/* GET home page. */
const {respok} =require('../utils/rest')

const cliredisa=require('async-redis').createClient()

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
