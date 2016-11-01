var gets=function(paths,opts,cb) { //get many data with one call

	if (!paths) return ;
	if (typeof paths=='string') {
		paths=[paths];
	}
	var engine=this, output=[], taskqueue=[];
	if (opts.syncable) opts.syncable=false;

	var makecb=function(path){
		return function(data){
				if (!(data && typeof data =='object' && data.__empty)) output.push(data);
				engine.get(path,opts,taskqueue.shift());
		};
	};

	for (var i=0;i<paths.length;i++) {
		if (typeof paths[i]=="null") { //this is only a place holder for key data already in client cache
			output.push(null);
		} else {
			taskqueue.push(makecb(paths[i]));
		}
	};

	taskqueue.push(function(data){
		output.push(data);
		cb.apply(engine.context||engine,[output,paths]); //return to caller
	});

	taskqueue.shift()({__empty:true}); //run the task
}


var get=function(path,opts,cb) {
	var engine=this;

	if (typeof opts=="function") {
		context=cb;
		cb=opts;
		opts={recursive:false};
	}
	opts=opts||{};

	if (!path) {
		cb&&cb([null]);
		return null;
	}

	if (typeof cb!="function") {
		return engine.kdb.get(path,opts);
	}

	if (typeof path==="string") {
		path=[path];
	}

	if (typeof path[0] =="string") {
		return engine.kdb.get(path,opts,function(data){
			cb(data);//return top level keys
		});
	} else if (typeof path[0] =="object") {
		return gets.call(engine,path,opts,function(data){
			cb(data);//return top level keys
		});
	} else {
		engine.kdb.get([],opts,function(data){
			cb(data);//return top level keys
		});
	}
};	

module.exports=get;