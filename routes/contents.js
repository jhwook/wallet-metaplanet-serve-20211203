var express = require('express');
var router = express.Router();
const moment=require('moment')
/* GET home page. */
const {respok} =require('../utils/rest')
const dbmon=require('../modelsmongo')
let { findall , createrow } =require('../utils/dbmon')

router.post('/notifies', (req,res)=>{
	let {title , contentbody , writer, countviews}=req.body
	createrow('notifies' , {... req.body}).then(resp=>{
		respok(res)
	})	
})
router.get('/notifies',(req,res)=>{
	findall ('notifies' , {} ).then(list=>{
		respok(res,null,null,{ 
			payload : {
				list
			}
		} )
	})
})

module.exports = router;
