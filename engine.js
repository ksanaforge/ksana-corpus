/* Corpus Engine 
   provide core interface to make use of ksana corpus
*/
const JsonRom=require("ksana-jsonrom");
const platform=require("./platform");
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
	var engine={kdb};

	engine.get=require("./get"); //install first API

	if (kdb.fs.mergePostings) { //native mergePostings
		engine.mergePostings=kdb.fs.mergePostings.bind(kdb.fs);
	}

	opts.preload=opts.preload||[]; //user specified preload
	var preload=[["meta"],["fields","article"]];
	opts.preload.forEach(function(p){preload.push(p)});

	engine.get(preload,{recursive:true},function(res){
		engine.meta=res[0];
		Corpus.init(engine);
		cb(0,engine);
	});
}


const open=function(id,opts,cb){
	if (typeof opts=="function") {
		cb=opts;
		opts={};
	}

	if (opening) throw "nested open kdb"+id;

	var engine=pool[id];
	if (engine) {
		cb(0,engine);
		return engine;
	}
	var fn=id;
	if (fn.indexOf(".cor")==-1) fn+=".cor";
	opening=id;

	new JsonRom.open(fn,function(err,kdb){
		if (err) {
			opening="";
			cb(err);
		} else {
			createEngine(kdb,opts,function(err2,engine){
				opening="";
				if (err2) cb(err2);
				else {
					if (engine&&engine.meta){
						pool[id]=engine;
						cb(0,engine);						
					} else {
						cb(id+" is invalid");
					}
				} 
			});
		}
	});
}

module.exports={open,close};