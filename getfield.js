const bsearch=require("./bsearch");

const getField=function(name,cb){
	if (typeof name=="object") {
		return getFields.call(this,name,cb);
	}
	return this.get(["fields",name],{recursive:true},cb);
}
const getFields=function(names,cb){
	const keys=names.map(function(name){return ["fields",name]});
	return this.get(keys,{recursive:true},cb);	
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
	return this.get(["afields",article.at],{recursive:true},cb);
}

const getFieldNames=function(cb){
	const r=this.get(["fields"],function(data){return cb(Object.keys(data))});
	return r?Object.keys(r):[];
}
const findAField=function(afield,address,cb){
	if (!this.meta.invertAField || !this.meta.invertAField[afield]) return;

	this.getField([afield+"_start",afield+"_end"],function(datum){ 
		const start=datum[0],end=datum[1];
		var i=0;

		for (i=0;i<start.value.length;i++) {
			if (address>=start.value[i] && address<=end.value[i]) break;
		}

		if (i==start.value.length) {
			cb(0,"address not found");
			return;
		}

    //find corpus address by pbaddress
    this.getArticleField(i,afield,function(data2){
      const at2=bsearch(data2.value,address);//
      if (at2>0) {
      	cb(0,data2.pos[at2-1])
      } else {
      	cb("address "+address+" not found in article"+(at));
      }
    });
  }.bind(this));
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

module.exports={getField:getField,getFields:getFields,
	getBookFields:getBookFields,getBookField:getBookField,
	getArticleField:getArticleField,getArticleFields:getArticleFields,
	getFieldNames:getFieldNames,
findAField:findAField,trimField:trimField}