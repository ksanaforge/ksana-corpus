const Ksanapos=require("./ksanapos");
const isOpenBracket=function(c){
	return "︽〈【「〔《『﹁︿﹙﹛〝︵｛".indexOf(c)>-1;
}
const trimRight=function(str,chcount,includePunc) {
	if (!str) return "";
	var c=chcount,dis=0,t,s=str,code;

	t=this.knext(s,c);
	dis+=t;
	
	s=s.substr(t);
	code=s.charCodeAt(0);
	if (includePunc) {
		while ((code<0x3400||code>0xdfff)&&
			!isOpenBracket(s[0])){
			s=s.substr(1);
			code=s.charCodeAt(0);
			dis++;
		}	
	}
	
	return str.substr(0,dis);
}


const trimLeft=function(str,chcount) {
	if (!str) return "";
	var c=chcount,dis=0,t,s=str;
	t=this.knext(s,c);
	dis+=t;
	s=s.substr(t);
	while (s.charCodeAt(0)<0x3400||s.charCodeAt(0)>0xdfff){
		s=s.substr(1);
		dis++;
	}
	return str.substr(dis);
}
const layoutText=function(text,startkpos,breaks){
		var page=0,prevpage=0,lines=[],linetext="";
		var linebreaks=[],pagebreaks=[],kpos=startkpos,nbreak=0;
		var nextkpos;//kpos of next line start
		
		for (var i=0;i<text.length;i++) {
			nextkpos=this.advanceLineChar(startkpos,i+1);
			page=this.pageOf(kpos);
			if (prevpage!==page) {
				while (lines.length>0&&!lines[lines.length-1].trim()) { 
					linebreaks.pop();
					lines.pop(); //remove extra tailing blank lines
				}
				pagebreaks.push(kpos); //show page break on screen
			}
			if (breaks) {
				var breakcount=0,t=text[i],consumed=0;
				//one text line might consist more than one p
				while (nbreak<breaks.length&&nextkpos>breaks[nbreak]) {
					breakcount++;
					const leftpart=trimRight.call(this,text[i],breaks[nbreak]-kpos,true);
					lines.push(linetext+leftpart.substr(consumed));
					consumed=leftpart.length;
					linetext="";
					nbreak++;
				} 
				
				if (!breakcount) {
					linetext+=text[i];
				} else {
					linetext=text[i].substr(consumed);//remaining
				}
			} else {
				lines.push(text[i]);
				linebreaks.push(kpos);
			}
			prevpage=page;
			kpos=nextkpos;
		}
		if (breaks) {
			linebreaks=breaks;
			linebreaks.unshift(startkpos);
			lines.push(linetext);
		}
		return {linebreaks,pagebreaks,lines};
}
const extractKPos=function(text){
	var out={},pat=this.addressPattern,fileOf=this.fileOf.bind(this);
	text.replace(this.addressRegex,function(m,m1){
		const kRange=Ksanapos.parse(m1,pat);
		if (typeof kRange!=="undefined") {
			var f=fileOf(kRange);
			if (!f.filename) return;
			if (!out[f.filename]) out[f.filename]=[];
			out[f.filename].push(kRange);
		}
	});
	return out;
}
/*
  add advline to kpos and return new kpos 
  advline can be more than maxChar
	crossing vol is not allowed
*/

const advanceLineChar=function(kpos,advline,linetext){
	const pat=this.addressPattern;
	kpos+=advline*pat.maxchar;
	
	if (linetext) {
		var arr=Ksanapos.unpack(kpos,pat);
		arr[3]=this.kcount(linetext);
		return Ksanapos.makeKPos(arr,pat);
	} else {
		return kpos;
	}
}
const parseRange=function(kRange,pat,forceRange){
	if (typeof pat=="undefined") pat=this.addressPattern;
	if (typeof kRange=="string") {
		kRange=Ksanapos.parse(kRange,pat);
	}
	const r=Ksanapos.breakKRange(kRange,pat,forceRange);
	
	const startarr=Ksanapos.unpack(r.start,pat);
	var endarr=Ksanapos.unpack(r.end,pat);
	return {startarr,endarr,start:r.start,end:r.end,kRange};
}

const kPosUnpack=function(kpos,pat){
	pat=pat||this.addressPattern;
	const startarr=Ksanapos.unpack(kpos,pat);
	return startarr;
}

const bookOf=function(address){
	const r=parseRange(address,this.addressPattern);
	const arr=kPosUnpack.call(this,r.start);
	return arr[0];
}
const pageOf=function(address){
	const r=parseRange(address,this.addressPattern);
	const arr=kPosUnpack.call(this,r.start);
	return arr[1];
}
const bookLineOf=function(address){ //line counting from this book
	const r=parseRange(address,this.addressPattern);
	const arr=kPosUnpack.call(this,r.start);
	return arr[1]*this.addressPattern.maxline+arr[2];
}
const lineOf=function(address){
	const r=parseRange(address,this.addressPattern);
	const arr=kPosUnpack.call(this,r.start);
	return arr[2];
}
const charOf=function(address){
	const r=parseRange(address,this.addressPattern);
	const arr=kPosUnpack.call(this,r.start);
	return arr[3];
}

module.exports={trimLeft,trimRight,parseRange,bookOf,pageOf,lineOf,charOf,
	bookLineOf,	layoutText,extractKPos,advanceLineChar};