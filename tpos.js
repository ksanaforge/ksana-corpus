/* Token Postion */
const bsearch=require("./bsearch");
const Ksanapos=require("./ksanapos");

const TT=require("./tokentypes").TokenTypes;
const prevline=function( kpos, line2tpos, at, adv){
	var r=Ksanapos.unpack(kpos,this.addressPattern);
	while (adv) {
		if (r[2]>0) {
			r[2]--;
			at--;
		} else {
			at--;
			while (at>0&& line2tpos[at]==line2tpos[at-1]) at--;
			const newline = at % this.addressPattern.maxline;
			r[1]--;
			r[2]=newline;
		}
		adv--;
	}
	const k=Ksanapos.makeKPos(r,this.addressPattern);
	return {kpos:k,at:at};
}
/* TODO , check next line crossing a book */
const nextline=function( kpos,line2tpos, at,adv ){
	var r=Ksanapos.unpack(kpos,this.addressPattern);
	while (adv>0) {
		while (at<line2tpos.length-1 && line2tpos[at]==line2tpos[at+1]) {
			at++;
		}
		at++;
		const newline=at % this.addressPattern.maxline;
		if (newline<r[2]) r[1]++;
		r[2] = newline;
		adv--;
	}
	const k=Ksanapos.makeKPos(r,this.addressPattern);
	return {kpos:k, at:at};
}
const absline2kPos=function(bk,page_col_line,C,R) { //see inverted.js putLinePos
  return bk*R + page_col_line*C ;
}	

const tPos2KPos=function(tposs,extraline,linetext,_linetpos,bookline2tpos,bookof){
	const C=Math.pow(2,this.addressPattern.charbits);
	const R=Math.pow(2,this.addressPattern.rangebits);
	const removePunc=!!this.get("meta").removePunc;

	const getLine=function(hittpos,line2tpos){
		if (_linetpos[0] instanceof Array) { //range format , for read text
			for (var i=0;i<_linetpos.length;i++) {
				if (hittpos>=_linetpos[i][0] && hittpos<=_linetpos[i][1]) break;
			}
		} else { //excerpt format, tpos of each line , including end tpos of last line for trimming posting
			for (var i=0;i<_linetpos.length;i++) {
				if (_linetpos[i]>hittpos) break;
			}
			if(i) i--;
		}

		const line=linetext[i]; // the actual line
		return line;
	}
	var kposs=[], 
	  line2tpos_at=[] , //line with hit
	  linetpos=[];      //tpos of staring and ending line, for filtering postings
	for (var i=0;i<tposs.length;i++) {
		const line2tpos=bookline2tpos[bookof[i]];
		if (!line2tpos) {
			//debugger
			//throw "cannot get bookline2tpos of book"+bookof[i];
			continue;
		}
		var at=bsearch(line2tpos,tposs[i],true);
		if (line2tpos[at]>tposs[i]) at--;
		var endlinetpos=line2tpos[at+1];

		//2017.3.13 causing render hit problem
		var nextlinekpos=absline2kPos(bookof[i],at+1,C,R);
		if (this.lineOf(nextlinekpos)==0) {
			//empty line has same tpos, backward to last line
			while (at>0&&line2tpos[at-1]==line2tpos[at]) { 
				at--;
			}
		}

		if (at<0) continue;

		line2tpos_at.push([line2tpos,at]);
		var kpos=absline2kPos(bookof[i],at,C,R);
		if (linetext) { //given texts, calculate accurate char offset
			const tchar=tposs[i]- line2tpos[at];
			const line=((linetext instanceof Array)?getLine(tposs[i],line2tpos):linetext ) ||"";
			kpos+=this.kskiptoken(line,tchar);
		}
		kposs.push(kpos);
		linetpos.push([line2tpos[at],endlinetpos]);
	}
	var out = {kpos:kposs,linetpos:linetpos};

	if (extraline) { //show extra lines above and under hit line
		var linekrange=[];
		if (extraline>2) linetpos=[]; //reset , get from nextline/prevline
		for (var i=0;i<kposs.length;i++) {
			var startlinekpos=kposs[i] , endlinekpos=startlinekpos;
			const line2tpos=line2tpos_at[i][0], at=line2tpos_at[i][1];
			if (extraline>2) {
				var adv=Math.floor((extraline-1)/2);
				if (adv>2) adv=2;
				const s=prevline.call(this,startlinekpos,line2tpos,at,adv );
				const e=nextline.call(this,startlinekpos,line2tpos,at,adv );
				startlinekpos=s.kpos;
				endlinekpos=e.kpos;
				var ltposs=[];
				for (var j=s.at;j<=e.at;j++) {
					ltposs.push(line2tpos[j]);
				}
				ltposs.push(line2tpos[e.at+1]); //for triming posting list
				linetpos.push(ltposs);
			}
			const end=endlinekpos+this.addressPattern.maxchar-1;
			const r=this.makeRange(startlinekpos,end);
			linekrange.push(r);
		}
		out = {kpos:kposs,linekrange:linekrange,line:extraline,linetpos:linetpos};
	}

	return out;
}
const kPos2TPos=function(kposs,bookline2tpos){
	var out=[];
	for (var i=0;i<kposs;i++) {
		const r=Ksanapos.unpack(kpos,this.addressPattern);
		const line2tpos=bookline2tpos[r[0]];
		const absline=r[1]*this.addressPattern.maxline+r[2];
		out.push( line2tpos[absline]);
	}
	return out;
}
const toTPos=function(kpos,cb){
	if (!(kpos instanceof Array)){
		kpos=[kpos];
	}
	
	var keys=[],bookid=[],books={};
	for (var i=0;i<kpos.length;i++) {
		const r=Ksanapos.unpack(kpos,this.addressPattern);
		const bk=r[0];
		bookof.push(r[0]);
		books[bk]=true;
	}
	for (bk in books) {
		keys.push(["inverted","line2tpos",bk]);
		bookid.push(bk);
	}
	var bookline2tpos={};
	if (!cb) { //sync version
		const line2tposs=this.get(keys);//already in cache
		if (!line2tposs) {
			console.error("async get fail , kpos",kpos,"keys",keys);
			return null;
		}
		for (var i=0;i<line2tposs.length;i++) {
			bookline2tpos[bookid[i]] =line2tposs[i];
		}
		return kPos2TPos.call(this,kpos,bookline2tpos);
	} else {
		this.get(keys,function(line2tposs){
			for (var i=0;i<line2tposs.length;i++) {
			  bookline2tpos[bookid[i]] =line2tposs[i];
			}
			cb&&cb(kPos2TPos.call(this,kpos,bookline2tpos));
		}.bind(this));
	}
}
const fromTPos=function(tpos,opts,cb){
	var arr=tpos;

	if (typeof opts=="function") {
		cb=opts;
		opts={};
	}
	opts=opts||{};

	if (typeof tpos=="number") arr=[tpos];
	if (!arr.length) {
		cb&&cb();
		return {kpos:[]};
	}
	const book2tpos=this.get(["inverted","book2tpos"]);
	var bookline2tpos={},bookof=[];
	//get line2tpos of each book                                                                                            
	var keys=[],bookid=[],books={};
	for (var i=0;i<arr.length;i++) {
		var bk=bsearch(book2tpos,arr[i],true);
		bookof.push(bk);
		books[bk]=true;
	}
	for (var bk in books) {
		keys.push(["inverted","line2tpos",bk]);
		bookid.push(bk);
	}
	if (!cb) { //sync version
		const line2tposs=this.get(keys);//already in cache
		if (!line2tposs || !line2tposs[0]) {
			//console.error("async get fail , tpos",tpos,"keys",keys);
			return {kpos:[]};
		}
		for (var i=0;i<line2tposs.length;i++) {
			bookline2tpos[bookid[i]] =line2tposs[i];
		}
		return tPos2KPos.call(this,arr,opts.line,opts.linetext,opts.linetpos,bookline2tpos,bookof);
	} else {
		this.get(keys,function(line2tposs){
			for (var i=0;i<line2tposs.length;i++) {
			  bookline2tpos[bookid[i]] =line2tposs[i];
			}
			cb&&cb(tPos2KPos.call(this,arr,opts.line,opts.linetext,opts.linetpos,bookline2tpos,bookof));
		}.bind(this));
	}
}
const tPosToKRange=function(tpos,opts,cb){
	var kranges=[];
	if (typeof opts=="function") {
		cb=opts;
		opts={};
	}

	const res=fromTPos.call(this,tpos,opts,function(kposs){
		cb&&cb(kranges);
	}.bind(this));

	if (!cb) return res;
}
/* see ksana-corpus-build putToken how tPos++*/
const twidth=function(type,removePunc){ //return tpos advancement by token type
	if (type===TT.SPACE || (type===TT.PUNC && removePunc)) {
		return 0;
	}
	return 1;
}
module.exports={fromTPos:fromTPos,tPosToKRange:tPosToKRange,toTPos:toTPos}