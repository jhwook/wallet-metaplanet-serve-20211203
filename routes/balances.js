var express = require('express');
var router = express.Router();
const moment=require('moment')
/* GET home page. */
const {findall}=require('../utils/db')
const {respok , resperr } =require('../utils/rest')
const {getusernamefromsession}=require('../utils/session')
const cliredisa=require('async-redis').createClient()
const KEYS=Object.keys

let jcurrencies = {'ETH': 1 , 'METAPLANET':1}  
const convaj=(arr,keyfieldname , valuefieldname )=>{
	let jdata={}
	arr.forEach(elem=>{
		jdata[elem[ keyfieldname ] ] = valuefieldname ? elem[ valuefieldname] : elem
	})
	return jdata
}
router.get('/', (req,res)=>{
	let username = getusernamefromsession(req)
	findall( 'balances' , { username }).then(resp=>{	
		let jresp={}
		if(resp){
			jresp = convaj( resp , 'currency' , 'amount' ) 
		}
		else {}
		let jbalances={}
		KEYS(jcurrencies).forEach(elem=>{
			if(jresp[ elem] ){ jbalances [elem ] = jresp[ elem]}
			else { 	
				jbalances [elem ] = 0
			}
		})
		let normprices={}
		cliredisa.hgetall('TICKERS-USDT').then( jtickers =>{
			KEYS(jbalances).forEach(symbol=>{
				if( jtickers[ `${symbol}-USDT`]) { 
					normprices[ symbol ] = jbalances[ symbol ] *  + jtickers[ `${symbol}-USDT`]
				}
				else {
					normprices[ symbol ] = null
				}
			})

		let list =[]
		KEYS(jbalances).forEach(elem=>{
			list[ list.length]= { name: elem // '' 
				, exchange : normprices[ elem ] // ''
				, price : jbalances[ elem ]
				, unit : elem
			}
		})
//		name:  // "Ethereum",
  //  exchange: // 20185, -> KRW
  //  price: // 2, -> balances
    //unit: // "meta",
			respok(res,null,null , { payload : {
				list 
				, balances : jbalances
				, normprices
			}})
		})
	})
})
module.exports = router;

/** {
  'BTC-USDT': '49601.21000000',
  'ETH-USDT': '4349.32000000',
  'BNB-USDT': '598.80000000',
  'METAPLANET-USDT': '1528'
} */
/*address   | varchar(80)      | YES  |     | NULL                |                               |
| username  | varchar(80)      | YES  |     | NULL                |                               |
| amount    | varchar(20)      | YES  |     | NULL                |                               |
| currency  | varchar(20)      | YES  |     | NULL                |                               |
| nettype   | varcha
*/
