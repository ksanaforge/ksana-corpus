const bsearch=require("./bsearch");
const BILINKSEP="<";
const getField=function(name,cb){
	if (typeof name=="object") {
		return getFields.call(this,'fields',name,cb);
	}
	return this.get(["fields",name],{recursive:true},cb);
}
const getFields=function(names,cb){
	const keys=names.map(function(name){return ['fields',name]});
	return this.get(keys,{recursive:true},cb);	
}
const getGField=function(name,cb){
	return this.get(["gfields",name],{recursive:true},cb);
}
const getKeyField=function(name,cb){
	return this.get(["kfields",name],{recursive:true},cb);
}
const getBookField=function(name,book,cb){
	if (typeof name=="object") {
		return getBookFields.call(this,name,book,cb);
	}
	return this.get(["fields",name,book],{recursive:true},cb);	
}
const getBookFields=function(names,book,cb){
	const keys=names.map(function(name){return ["fields",name,book]});
	return this.get(keys,{recursive:true},cb);		
}

const getArticleField=function(narticle,name,cb){
	var article=narticle;
	if (typeof narticle=="number") {
		article=this.getArticle(narticle);
	}
	var names=name;
	if (typeof name=="string") names=[name]
	const keys=names.map(function(n){return ["afields",article.at,n]});

	return this.get(keys,{recursive:true},cb);
}

const getArticleFields=function(narticle,cb){
	var article=narticle;
	if (typeof narticle=="number") {
		article=this.getArticle(narticle);
	}
	const fields=this.get("gfields");
	var afields={};

	for (var i in fields) {
		if (i.indexOf(BILINKSEP)>0){
			afields[i]=trimRangeField.call(this,fields[i],article.start,article.end);
		}
	}
	return this.get(["afields",article.at],{recursive:true},function(data){
		cb(Object.assign(afields,data));
		//do not load any afields/article/field before this call
		/*
		const notloaded=[];
		for (key in data) {
			if (typeof data[key]=="string") {
				notloaded.push(["afields",article.at,key]);
			}
		}
		if (notloaded.length==0) {
			cb(data);	
		} else {//work around
			this.get(notloaded,{recursive:true},function(d){
				cb(d)
			});
		}
		*/
	}.bind(this));
}

const getFieldNames=function(cb){
	const r=this.get(["fields"],function(data){return cb(Object.keys(data))});
	return r?Object.keys(r):[];
}
const trimField=function(field,start,end){
	var out={};
	
	const s=bsearch(field.pos,start+1,true);
	const e=bsearch(field.pos,end,true);

	for (var key in field){
		out[key]=field[key].slice(s,e);
	}
	return out;
}

const trimRangeField=function(field,start,end){
	var out={};

	const ss=this.makeRange(start,start);
	const ee=this.makeRange(end,end);
	const s=bsearch(field.pos,ss+1,true);
	const e=bsearch(field.pos,ee,true);

	for (var key in field){
		out[key]=field[key].slice(s,e);
	}
	return out;
}

module.exports={getField:getField,getFields:getFields,getGField:getGField,
	getKeyField:getKeyField,
	getBookFields:getBookFields,getBookField:getBookField,
	getArticleField:getArticleField,getArticleFields:getArticleFields,
	getFieldNames:getFieldNames,BILINKSEP:BILINKSEP,
trimField:trimField,trimRangeField:trimRangeField}