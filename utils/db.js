
const db=require('../models')
const {LOGGER}=require('./common')

const tableexists=async tablename=>{
  let resp=await db.sequelize.query(`SHOW TABLES LIKE '${tablename}'`)
  return resp[0][0]
}
const fieldexists=async (tablename,fieldname)=>{
  let resp=await db.sequelize.query (`SHOW COLUMNS FROM ${tablename} LIKE '${fieldname}'`)
  return resp[0][0]
}
const findone=async(table,jfilter)=>          { return await db[table].findOne({raw:true,where:jfilter})}
const togglefield=async (tablename , jfilter , fieldname)=>{
  let resp =await findone(tablename , {... jfilter} ) 
  if(resp){} else {return null}
  let valuetoupdate = + resp[fieldname] ? 0 : 1
  let jupdates={} ; jupdates[ fieldname] = valuetoupdate 
  await updaterow(tablename , {id: resp.id} , {... jupdates } )
  return valuetoupdate  
}

const findall=async(table,jfilter)=>          { return await db[table].findAll({raw:true,where:jfilter})}
const updatetable=async(table,jfilter,jupdates)=>  { return await db[table].update(jupdates,{where:jfilter})}
const updaterow=updatetable
const createrow=async(table,jdata)=>{return await db[table].create(jdata)}
const countrows= (table,jfilter)=>{
  return new Promise ((resolve,reject)=>{
    db[table].count({where:{... jfilter} } ).then(resp=>{
      if(resp)  {resolve({status:1 ,respdata:resp }  )}
      else      {resolve({status:0 })    }
    })
  })
} //
const createorupdaterow=(table,jfilter,jupdates)=>{
  return new Promise((resolve,reject)=>{
    db[table].findOne({where:jfilter}).then(resp=>{
      if(resp){resp.update(jupdates).then(respupdate=>{        resolve(respupdate);return false      })}
      else {db[table].create({... jfilter , ... jupdates}).then(respcreate=>{resolve(respcreate); return false })}
    })
  }) 
}
const updateorcreaterow=createorupdaterow
const incrementroworcreate=async jargs=>{let {table,jfilter,fieldname,incvalue }=jargs;  let resprow
  try{ resprow=await db[table].findOne({where:jfilter}) } // .then(resprow=>{  
  catch(err){LOGGER('yHshy8Ist5',err); return null}
  let jdata={}; jdata[fieldname]=+incvalue
  if(resprow){  jdata[fieldname]+= +resprow.dataValues[fieldname] ;      return await resprow.update({ ... jdata  })  }
  else { return await db[table].create({... jfilter , ... jdata })}  //  })
}
const incrementrow=incrementroworcreate

const createifnoneexistent=async(table,jfilter,jupdates)=>{
	let resp=await findone(table , jfilter)
	if(resp){return null}
	return await createrow(table,{...jfilter, ... jupdates})
}

const countrows_scalar = (table,jfilter)=>{
  return new Promise ((resolve,reject)=>{
    db[table].count({where:{... jfilter} } ).then(resp=>{
      if(resp)  {resolve( resp)}
      else      {resolve( )    }
    })
  })
}

module.exports={
	tableexists
	, fieldexists
	,	findone
	, togglefield	
	, findall,updatetable, updaterow , createrow,createorupdaterow , updateorcreaterow , incrementroworcreate 
  ,countrows , createifnoneexistent
	, incrementrow
	, countrows_scalar
}

const test=_=>{
  incrementroworcreate()
}
