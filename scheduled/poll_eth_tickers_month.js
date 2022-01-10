const axios = require('axios');
const { gettimestr , STRINGER  }=require('../utils/common')
const LOGGER=console.log
const moment=require('moment')
const cliredisa=require('async-redis').createClient()

// const polltickers = (date0="2021-11-15", date1="2021-12-15") => {
const  ___polltickers = ( date0 , date1 ) => {
  const polygonUrl = `https://api.polygon.io/v2/aggs/ticker/X:ETHUSD/range/1/day/${date0}/${date1}?adjusted=true&sort=asc&limit=5000&apiKey=O7TnmZ49Pjn7cQUTTEpL7zJ5CKfpPCs8`;
  return new Promise ((resolve,reject)=>{
		axios
    .get(`${polygonUrl}`).then(resp=>{
			cliredisa.hset( 'TICKERS-ETH-MONTHLY' , 'ETH-USDT' , STRINGER( resp.data.results ) )
			resolve( resp.data.results )
		})
  });
};
const polltickers=_=>{
	___polltickers ( moment().subtract(1 , 'months').format( STR_DATE_FORMAT ) 
		, moment().startOf('day').subtract(1 , 'days').format( STR_DATE_FORMAT )
	)
}
polltickers()

// module.exports = { getPolygon };
const STR_DATE_FORMAT='YYYY-MM-DD'
let cron = require('node-cron')
// cron.schedule('* * * * *', _=>{
const OFFSET_POLL_TIME = 8000
cron.schedule('0 0 0 * * *' , _=>{	
	LOGGER( gettimestr() )
	setTimeout(() => {
		polltickers()
	}, OFFSET_POLL_TIME )
})


