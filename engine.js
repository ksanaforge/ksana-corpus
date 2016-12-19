/* Corpus Engine 
   provide core interface to make use of ksana corpus
*/
const JsonRom=require("ksana-jsonrom");
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

const createEngine=function(kdb,opts,cb){//preload meta and other fields
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
	var preload=[["meta"]
	,["fields","article"]
	,["fields","toc"],["fields","subtoc_range"],["fields","group"]
	];
  if (!opts.textOnly) {
    preload.push(["inverted","book2tpos"]
    	,["inverted","tokens"]
    	,["inverted","posting_length"]
    	,["inverted","groupnames"]
    	,["inverted","group2tpos"]
    	);
  }	
	opts.preload.forEach(function(p){preload.push(p)});

	engine.get(preload,{recursive:true},function(res){
		engine.meta=res[0];
		Corpus.init(engine);
		cb(0,engine);
	});
}

const prepareEngine=function(id,kdb,opts,cb){
	createEngine(kdb,opts,function(err2,engine){
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

	var fn=id;
	if (fn.indexOf(".cor")==-1) fn+=".cor";
	opening=id;
	opts=opts||{};
	if ((typeof window!=="undefined" && window.node_modules)||isNode()) {
		fn2="../"+id+"-corpus/"+fn; //for nw
	} else {
		fn2=id+"-corpus/"+fn;
	}
	new JsonRom.open(fn,function(err,kdb){
		if (err) {
			new JsonRom.open(fn2,function(err2,kdb2){
				if (err2) {
					opening="";
					cb&&cb(err2);
				} else {
					prepareEngine(id,kdb2,opts,cb)
				}
			});
		} else {
			prepareEngine(id,kdb,opts,cb)
		}
	});
}

module.exports={open:open,close:close};