/* Corpus Engine 
   provide core interface to make use of ksana corpus
*/
const CorpusROM=require("ksana-corpus-rom");
const Corpus=require("./corpus");

var opening="";
var pool={};

const close=function(id) {
	var engine=pool[id];
	if (engine) {
		engine.kdb.free();
		delete pool[id];
	}
}

const createEngine=function(id,kdb,opts,cb){//preload meta and other fields
	if (typeof opts=="function") {
		cb=opts;
		opts={};
	}
	var engine={kdb:kdb};

	engine.get=require("./get"); //install first API

	if (kdb.fs.mergePostings) { //native mergePostings
		engine.mergePostings=kdb.fs.mergePostings.bind(kdb.fs);
	}

	opts.preload=opts.preload||[]; //user specified preload
	var preload=[["meta"],["fields"]];
  if (!opts.textOnly) {
    preload.push(["inverted","book2tpos"]
    	,["inverted","article2tpos"]
    	,["inverted","tokens"]
    	,["inverted","posting_length"]
    	,["inverted","group2tpos"]
    	);
  }	
	opts.preload.forEach(function(p){preload.push(p)});

	engine.get(preload,{recursive:true},function(res){
		engine.meta=res[0];
		if (!engine.meta.displayOptions) {
			engine.meta.displayOptions={};
		}
		engine.id=id;
		Corpus.init(engine);
		cb(0,engine);
	});
}

const prepareEngine=function(id,kdb,opts,cb){
	createEngine(id,kdb,opts,function(err2,engine){
		opening="";
		if (err2) cb(err2);
		else {
			if (engine&&engine.meta){
				pool[id]=engine;
				cb&& cb(0,engine);						
			} else {
				cb&&cb(id+" is invalid");
			}
		} 
	});
}
const open=function(id,opts,cb){
	if (typeof opts=="function") {
		cb=opts;
		opts={};
	}
	var timer=0;

	var engine=pool[id];
	if (engine) {
		cb&&cb(0,engine);
		return engine;
	}

	if (opening) {
		timer=setInterval(function(){
			if (!opening) {
				clearInterval(timer);
				_open(id,opts,cb);
			}
		} ,200);
	} else {
		return _open(id,opts,cb);
	}
}
const isNode=function(){
	return (typeof process!=="undefined") &&
	process.versions && process.versions.node;
}
const _open=function(id,opts,cb){
	var engine=pool[id];
	if (engine) {
		cb&&cb(0,engine);
		return engine;
	}

	var fn=id,fn2;

	opening=id;
	opts=opts||{};
	const chromeextension=window && window.location.protocol=="chrome-extension:";
	if (typeof fn=="string" && fn.substr(0,5)!=="blob:") {

		if (fn.indexOf(".cor")==-1) fn+=".cor";
		if (!chromeextension) {
			if ((typeof window!=="undefined" && window.node_modules)||isNode()) {
				fn2="../"+id+"-corpus/"+fn; //for nw
			} else {
				const ofn=fn;
				fn=id+"-corpus/"+fn;
				fn2=ofn;//web mode try xxx-corpus first, to avoid http warning message
			}			
		}
		opening=id;
	} else {
		//input type File
		if (fn.name) {
			id=fn.name.replace(/\..+$/,"");
			opening=id;			
		} else {
			opening=fn.substr(fn.lastIndexOf("/")+1);
		}
	}

	new CorpusROM.open(fn,function(err,kdb){
		if (err) {
			if (typeof fn2=="string") {
				new CorpusROM.open(fn2,function(err2,kdb2){
					if (err2) {
						opening="";
						cb&&cb(err2);
					} else {
						prepareEngine(id,kdb2,opts,cb)
					}
				})				
			}
		} else {
			prepareEngine(id,kdb,opts,cb)
		}
	});
}
const isBusy=function(){
	return !!opening;
}
module.exports={open:open,close:close,isBusy:isBusy};