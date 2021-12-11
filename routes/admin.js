
var express = require('express');
var router = express.Router();
const { tableexists}=require('../utils/db')
/* GET home page. */

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
		respok(res,null,null,{list : resp })
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

