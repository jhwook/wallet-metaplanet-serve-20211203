var express = require('express');
var router = express.Router();
const moment=require('moment')
/* GET home page. */
const {findall}=require('../utils/db')
const {respok , resperr } =require('../utils/rest')
const {getusernamefromsession}=require('../utils/session')
const cliredisa=require('async-redis').createClient()
const KEYS=Object.keys
const LOGGER=console.log
const {messages}=require('../configs/messages');
const { getBalances } = require('../contracts/getBalances');
const { getBalancesToken } = require('../contracts/getBalances_token');
const { getethrep } = require('../utils/eth');

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
	if(username){}
	else {resperr(res,messages.MSG_PLEASELOGIN);return}
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
router.get('/history/:username', (req,res)=>{
	const { username } = req.params;
	if(!username){resperr (res,messages.MSG_PLEASELOGIN); return;}
	findall('tokens', {nettype:'ETH-TESTNET'}).then(listtokens =>{
		findall("transactionsinside", {username} )
		.then( list => {
			let jreturndata = {} 
			let jreturndata2 = {} 
			listtokens.forEach(token=>{
				LOGGER("--token:");
				LOGGER(token);
				LOGGER("list");
				LOGGER(list);
				let listfiltered = list.filter(txelem =>  token.name == txelem.currency );
				LOGGER("listfiltered:");
				LOGGER(listfiltered);
				LOGGER(listfiltered.length);
				let sum = 0;
				if(listfiltered.length != 0) { 
					for(let i in listfiltered) { sum += Number(listfiltered[i].amount) };
				}
				jreturndata2[token.name] = sum;
			//	jreturndata [token.name] = listfiltered.length ? listfiltered.reduce( (a,b)=> +a.amount + +b.amount ) : 0
			})
			LOGGER(jreturndata);
			LOGGER(jreturndata2);
			respok ( res, null, null ,{ payload : jreturndata2 } )
		} );	
	})
})
router.get('/getbalances/eth/:senderAddress', (req,res)=>{
	let {senderAddress} = req.params;
	if(!senderAddress){resperr (res,messages.MSG_PLEASELOGIN); return;}
	getBalances(senderAddress).then(resp=>{
		respok ( res, null, null , {payload : {
			getData: resp
		}})
	});
});
router.get('/getbalances/token/:senderAddress', (req,res)=>{
	let {senderAddress} = req.params;
	if(!senderAddress){resperr (res,messages.MSG_PLEASELOGIN); return;}
	getBalancesToken(senderAddress).then(resp=>{
		respok ( res, null, null , {payload : {
			getData: resp
		}})
	});
});
router.get('/getbalances/totalAmount/outside/:username', (req, res)=>{
	const { username } = req.params;
	findall('tokens', {nettype:'ETH-TESTNET'}).then(listtokens =>{
		let tmp = [];
		for (let i in listtokens){ tmp.push(listtokens[i].name); }
		findall("transactionsoutside", {username: username, currency: "ETH", typestr: "RECEIVE-ETH"} ).then(listEI => {
			let tmpObj = {};
			let sum = 0;
			for (let i in listEI){ sum += Number(listEI[i].amount); }
			tmpObj.ethInc = sum; sum = 0;
			findall("transactionsoutside", {username: username, currency: "METAPLANET", typestr: "RECEIVE-METAPLANET"} ).then(listMI => {
				for (let i in listMI){ sum += Number(listMI[i].amount); }
				tmpObj.metaInc = sum; sum = 0;
				findall("transactionsoutside", {username: username, currency: "ETH", typestr: "SEND-ETH"} ).then(listED => {
					for (let i in listED){ sum += Number(listED[i].amount); }
					tmpObj.ethDec = sum; sum = 0;
					findall("transactionsoutside", {username: username, currency: "METAPLANET", typestr: "SEND-METAPLANET"} ).then(listMD => {
						for (let i in listMD){ sum += Number(listMD[i].amount); }
						tmpObj.metaDec = sum;
						respok ( res, null, null , { payload : [
							{name: "ETH", value: `${tmpObj.ethInc}/${tmpObj.ethDec}` },
							{name: "METAPLANET", value: `${tmpObj.metaInc}/${tmpObj.metaDec}` }
							]
						})
					});
				});
			});
		});
			// respok ( res, null, null , { payload : { test: listtokens } })
	});
	// });
});
router.get('/getbalances/totalAmount/inside/:username', (req, res)=>{
	const { username } = req.params;
	LOGGER(username);
	findall('tokens', {nettype:'ETH-TESTNET'}).then(listtokens =>{
		// LOGGER("listtokens:");
		// LOGGER(listtokens);
		let tmp = [];
		for (let i in listtokens){ tmp.push(listtokens[i].name); }
		// LOGGER(tmp);
		// db["transactionsinside"].findAll({raw:true,
		// 	where:{ username: username, currency: "ETH" }
		// 	, offset
		// 	, limit
		// 	, order: [['id','DESC']]
		//   }).then(list=>{
		// 	  LOGGER("deposit:");
		// 	  LOGGER(list);
		// 	respok(res,null,null,{list} )
		//   });
	// 		LOGGER("deposit");
	// 		LOGGER(list);
	// 		LOGGER("--end");
		// findall("transactionsinside", {username: username, currency: "ETH", typestr: "INCREMENT"} ).then(listEI => {
		findall("transactionsinside", {username: username, currency: "ETH", typestr: "INCREMENT"} ).then(listEI => {
			LOGGER("listEI------------");
			let tmpObj = {};
			let sum = 0;
			for (let i in listEI){ sum += Number(listEI[i].amount); }
			tmpObj.ethInc = sum; sum = 0;
			findall("transactionsinside", {username: username, currency: "METAPLANET", typestr: "INCREMENT"} ).then(listMI => {
				for (let i in listMI){ sum += Number(listMI[i].amount); }
				tmpObj.metaInc = sum; sum = 0;
				findall("transactionsinside", {username: username, currency: "ETH", typestr: "DECREMENT"} ).then(listED => {
					for (let i in listED){ sum += Number(listED[i].amount); }
					tmpObj.ethDec = sum; sum = 0;
					findall("transactionsinside", {username: username, currency: "METAPLANET", typestr: "DECREMENT"} ).then(listMD => {
						for (let i in listMD){ sum += Number(listMD[i].amount); }
						tmpObj.metaDec = sum;
						respok ( res, null, null , { payload : [
							{name: "ETH", value: `${tmpObj.ethInc}/${tmpObj.ethDec}` },
							{name: "METAPLANET", value: `${tmpObj.metaInc}/${tmpObj.metaDec}` }
							]
						})
					});
				});
			});
		});
			// respok ( res, null, null , { payload : { test: listtokens } })
	});
	// });
});
/**************** */
router.get('/getbalances/sum/:senderAddress/:username', (req,res)=>{
	let {senderAddress, username} = req.params;
	if(!senderAddress){resperr (res, messages.MSG_PLEASELOGIN); return;}
	getBalances(senderAddress).then(resp1=>{
		LOGGER("eth: " , resp1)
		getBalancesToken(senderAddress).then(resp2=>{
			LOGGER("token:" , resp2) //			LOG GER(resp2);
			findall('tokens', {nettype:'ETH-TESTNET'}).then(listtokens =>{
				findall("transactionsinside", {username} )
				.then( list => {
					let jreturndata = {} 
					listtokens.forEach(token=>{
						let listfiltered = list.filter(txelem =>  token == txelem.currency )
						jreturndata [token.name] = listfiltered.length ? listfiltered.reduce ( (a,b)=> +a.amount + +b.amount ) : 0
					})
//					LOGGER("innerRecode:");	//				LOGGER(jreturndata)		//			LOGGER("output:");
					LOGGER({
						ethSum: getethrep(+resp1 + +jreturndata.ETH),
						tokenSum: +resp2 + +jreturndata.METAPLANET
					})
					respok ( res, null, null , { payload : {
						ETH: getethrep(+resp1 + +jreturndata.ETH),
						METAPLANET: getethrep(+resp2 + +jreturndata.METAPLANET)
					}})
				} );	
			})
		});
	});
});


		// let sum = 0;
		// for (let i in list){ sum += Number(list[i].amount); }
		// respok(res, null, null, { payload: {sum: sum} })} );

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
