var express = require('express');
var router = express.Router();
const moment=require('moment')
/* GET home page. */
const {findone , findall}=require('../utils/db')
const {respok , resperr } =require('../utils/rest')
const {getusernamefromsession}=require('../utils/session')
const cliredisa=require('async-redis').createClient()
const KEYS=Object.keys
const LOGGER=console.log
const {messages}=require('../configs/messages');
const { getBalances } = require('../contracts/getBalances');
const { getBalancesToken } = require('../contracts/getBalances_token');
const { getethrep } = require('../utils/eth');
const { NETTYPE , TOKENNAME } =require('../configs/net' ) // 'ETH- TESTNET'
// let jcurrencies = {'ETH': 1 , 'META PLANET':1}
let jcurrencies = {'ETH': 1 } //  , 'MET APLANET':1}
jcurrencies [ TOKENNAME ] = 1 
let DENOMINATING_CURRENCY_DEF='KRW' 
let keytotickers = `TICKERS-${DENOMINATING_CURRENCY_DEF}` 

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
		cliredisa.hgetall( keytotickers ).then( jtickers =>{ // 'TICKERS-US DT'
			KEYS(jbalances).forEach( symbol =>{
				let keytoticker= `${symbol}-${DENOMINATING_CURRENCY_DEF}` 
				if( jtickers[ keytoticker ]) { // US DT 
					normprices[ symbol ] = jbalances[ symbol ] *  + jtickers[ keytoticker]
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
	findall('tokens', {nettype:NETTYPE }).then(listtokens =>{
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
	findall('tokens', {nettype: NETTYPE }).then(listtokens =>{
		let tmp = [];
		for (let i in listtokens){ tmp.push(listtokens[i].name); }
		findall("transactionsoutside", {username: username, currency: "ETH", typestr: "RECEIVE-ETH"} ).then(listEI => {
			let tmpObj = {};
			let sum = 0;
			for (let i in listEI){ sum += Number(listEI[i].amount); }
			tmpObj.ethInc = sum; sum = 0;
			findall("transactionsoutside", {username: username, currency: TOKENNAME , typestr: "RECEIVE-TOKEN"} ).then(listMI => { // "METAPLAN ET"pME TAPLANET
				for (let i in listMI){ sum += Number(listMI[i].amount); }
				tmpObj.metaInc = sum; sum = 0;
				findall("transactionsoutside", {username: username, currency: "ETH", typestr: "SEND-ETH"} ).then(listED => {
					for (let i in listED){ sum += Number(listED[i].amount); }
					tmpObj.ethDec = sum; sum = 0;
					findall("transactionsoutside", {username: username, currency: TOKENNAME , typestr: "SEND-TOKEN"} ).then(listMD => { // "METAPL ANET"
						for (let i in listMD){ sum += Number(listMD[i].amount); }
						tmpObj.metaDec = sum;
						respok ( res, null, null , { payload : [
							{name: "ETH", value: `${tmpObj.ethInc}/${tmpObj.ethDec}` },
							{name: TOKENNAME , value: `${tmpObj.metaInc}/${tmpObj.metaDec}` } // "METAPL ANET"
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
	findall('tokens', {nettype: NETTYPE }).then(listtokens =>{
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
			findall("transactionsinside", {username: username, currency: TOKENNAME , typestr: "INCREMENT"} ).then(listMI => { // "METAPLA NET"
				for (let i in listMI){ sum += Number(listMI[i].amount); }
				tmpObj.metaInc = sum; sum = 0;
				findall("transactionsinside", {username: username, currency: "ETH", typestr: "DECREMENT"} ).then(listED => {
					for (let i in listED){ sum += Number(listED[i].amount); }
					tmpObj.ethDec = sum; sum = 0;
					findall("transactionsinside", {username: username, currency: TOKENNAME , typestr: "DECREMENT"} ).then(listMD => { //"METAPLA NET" 
						for (let i in listMD){ sum += Number(listMD[i].amount); }
						tmpObj.metaDec = sum;
						respok ( res, null, null , { payload : [
							{name: "ETH", value: `${tmpObj.ethInc}/${tmpObj.ethDec}` },
							{name: TOKENNAME , value: `${tmpObj.metaInc}/${tmpObj.metaDec}` } // "METAPL ANET"
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
// let TOKEN_NAME = 'METAPLAi NET'
router.get('/getbalances/sum/:senderAddress/:username', (req,res)=>{
	let {senderAddress, username} = req.params;
	if(!senderAddress){resperr (res, messages.MSG_PLEASELOGIN); return }	
	let aproms=[]
	aproms[ aproms.length ] = getBalances( senderAddress ) // 0
	aproms[ aproms.length ] = getBalancesToken( senderAddress ) // 1
	aproms[ aproms.length ] = cliredisa.hgetall ( keytotickers ) // 2 // 'TICKERS-US DT'
	aproms[ aproms.length ] = findall( 'tokens', { nettype : NETTYPE }) // 3
	aproms[ aproms.length ] = findall( "transactionsinside", {username} ) // 4
	aproms[ aproms.length ] = findone( 'settings' , { key_ : 'TOKEN_DECIMALS' } ) // 5

	Promise.all ( aproms).then( aresps => {
		let [ balance_eth // => 0 
			, balance_token // => 0
			, tickers				// 2
			, listtokens 		// 3
			, listtransactions	// 4
			, resp_decimals	// 5
		]=aresps
false && LOGGER('EBeVW4FuX1' , aresps)
///		findall('tokens', { nettype : 'ETH- TESTNET' }).then(listtokens =>{
//			findall("transactionsinside", {username} )			.then( list => {
				let jreturndata = {}
				listtokens.forEach(token=>{
					let listfiltered = listtransactions.filter(txelem => token.name == txelem.currency )

//					LOGGER( 'eH2Dq9W1sW' , listfiltered?.map(elem=>elem.amount) )
	//				jreturndata [ token.name ] = listfiltered.length ? listfiltered.reduce ( (a,b)=> +a.amount + +b.amount ) : 0				
					listfiltered=listfiltered?.map(elem=>elem.amount)
					jreturndata [ token.name ] = listfiltered.length ? listfiltered.reduce ( (a,b)=> +a + +b ) : 0
				}) //					LOGGER("innerRecode:");	//				LOGGER(jreturndata)		//			LOGGER("output:");
LOGGER( 'YidV6gFOVN' , jreturndata )
// respok ( res )
// return
				let amount_eth = + getethrep( '' + (balance_eth)) + +jreturndata.ETH 
				let amount_token = +balance_token / 10** (+resp_decimals.value_) + +jreturndata[ TOKENNAME ] // .METAPL ANET 
				LOGGER({
					ethSum: amount_eth ,
					tokenSum: amount_token
				})
				let jdata={}; jdata[ TOKENNAME ] = amount_token
				let jdata_02={}; jdata_02[TOKENNAME] =  
tickers[`${TOKENNAME}-${DENOMINATING_CURRENCY_DEF}`] ? + tickers[`${TOKENNAME}-${DENOMINATING_CURRENCY_DEF}`] * amount_token : 0 
	
				respok ( res, null, null , { payload : {
					ETH: amount_eth  ,
					... jdata
//						METAP LANET: amount_token
				} , normprices : {
					'ETH' :	tickers[`ETH-${DENOMINATING_CURRENCY_DEF}`] ? + tickers[ `ETH-${DENOMINATING_CURRENCY_DEF}` ] * amount_eth : 0 // -US DT US DT
					, ... jdata_02
// , 'META PLANET' :	tickers[`META PLANET-${DENOMINATING_CURRENCY_DEF}`] ? + tickers[`META PLANET-${DENOMINATING_CURRENCY_DEF}`] * amount_token : 0 // -US DT
				}
				, components : {
						'ETH-OUT' :		getethrep( '' + (balance_eth) )
					, 'ETH-IN' :		jreturndata.ETH
					, 'TOKEN-IN' :	jreturndata[ TOKENNAME ] // .ME TAPLANET
					, 'TOKEN-OUT' :	balance_token / 10** (+resp_decimals.value_)
				}
			})
//			} );	
//		})
	})
//	getBalances(senderAddress).then(balance_eth=>{
	//	LOGGER("eth: " , balance_eth)
		// getBalancesToken(senderAddress).then(balance_token=>{
//			LOGGER("token:" , balance_token ) //			LOG GER(balance_token);
//		});
// })
})

/**  {
  'BTC-US DT': '41693.52000000',
  'ETH-US DT': '3120.04000000',
  'BNB-US DT': '435.00000000',
  'METAP LANET-US DT': '1528'
}*/

		// let sum = 0;
		// for (let i in list){ sum += Number(list[i].amount); }
		// respok(res, null, null, { payload: {sum: sum} })} );

module.exports = router;

/** {
  'BTC-US DT': '49601.21000000',
  'ETH-US DT': '4349.32000000',
  'BNB-US DT': '598.80000000',
  'META PLANET-US DT': '1528'
} */
/*address   | varchar(80)      | YES  |     | NULL                |                               |
| username  | varchar(80)      | YES  |     | NULL                |                               |
| amount    | varchar(20)      | YES  |     | NULL                |                               |
| currency  | varchar(20)      | YES  |     | NULL                |                               |
| nettype   | varcha
*/
