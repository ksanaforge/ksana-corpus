const buildAddressPattern=function(b,column){
	const bookbits=b[0],pagebits=b[1],linebits=b[2], charbits=b[3];
	if (charbits*2+linebits*2+pagebits*2+bookbits>53) {
		throw "address has more than 53 bits";
	}
	const maxchar=1<<(charbits);
	const maxline=1<<(linebits);
	const maxpage=1<<(pagebits);
	const maxbook=1<<(bookbits);
	var rangebits=charbits+linebits+pagebits;
	const maxrange=1<<(rangebits);
	const bits=[bookbits,pagebits,linebits,charbits];
	return {maxbook,maxpage,maxline,maxchar,maxrange,bits,
					bookbits,pagebits,linebits,charbits,rangebits,column};
}
var checknums=function(nums,pat){
	if (nums[4]>pat.maxchar) {
		console.error(nums[4],"exceed maxchar",pat.maxchar)
		return 0;
	}
	if (nums[3]>pat.maxpage) {
		console.error(nums[3],"exceed maxpage",pat.maxpage)
		return 0;
	}
	if (nums[1]>pat.maxpage) {
		console.error(nums[1],"exceed maxpage",pat.maxpage)
		return 0;
	}
	if (nums[0]>pat.maxbook) {
		console.error(nums[0],"exceed maxbook",pat.maxbook)
		return 0;
	}
	return 1;
}
var makeKPos=function(nums,pat){
	var i,mul=1, kpos=0;
	for (i=0;i<nums.length;i++) {
		if (nums[i]<0) {
			console.error("negative value",nums[i],nums);
			return -1;
		}
	}
	if(!checknums(nums,pat))return -1;

	kpos=nums[3];       mul*=Math.pow(2,pat.charbits);
	kpos+= nums[2]*mul; mul*=Math.pow(2,pat.linebits);
	kpos+= nums[1]*mul; mul*=Math.pow(2,pat.pagebits);
	kpos+= nums[0]*mul;

	return kpos;
}
const breakKRange=function(kRange,pat){
	var r=Math.pow(2,pat.rangebits);
	var dis=Math.floor(kRange%r);
	start=Math.floor(kRange/r);
	end=start+dis;
	return {start,end};
}
const makeKRange=function(startkpos,endkpos,pat){
	if (isNaN(startkpos)||isNaN(endkpos)) {
		return 0;
	}
	var r=endkpos-startkpos;
	if (r>pat.maxrange) {
		//throw "range too far "+ r;
		r=pat.maxrange-1;
	}
	return startkpos*Math.pow(2,pat.rangebits)+r;
}
var unpack=function(kpos,pat){
	var ch=kpos%pat.maxchar;
	var line=Math.floor((kpos/pat.maxchar)%pat.maxline);
	var page=Math.floor((kpos/ Math.pow(2,pat.charbits+pat.linebits)) %pat.maxpage);
	var vol=Math.floor((kpos/Math.pow(2,pat.charbits+pat.linebits+pat.pagebits))%pat.maxbook);

	var r=[vol,page,line,ch];
	return r;
}
const stringify=function(kpos,pat){
	const parts=unpack(kpos,pat);
	var s= (parts[0]+1)+'p';
	if (pat.column){//for taisho
		s+=Math.floor(parts[1]/pat.column)+1;	
		s+=String.fromCharCode((parts[1]%pat.column)+0x61);
	} else {
		s+=(1+parts[1]);
		s+='.';
	}
	s+=(parts[2]+1);
	s+='#'+(parts[3]+1);
	return s;
}
const regexAddress=/(\d+)p(\d+)([a-z\.])(\d+)/
const regexFollow1=/(\d+)([a-z\.])(\d+)/
const regexFollow2=/(\d+)/
/* convert human readible address to an integer*/
const parseLineChar=function(arr,linech){
	var l=linech.length-2; //last two digit is ch
	if (l<1) {
		arr[2]=parseInt(linech,10)-1;
		arr[3]=0;
	} else {
		arr[2]=parseInt(linech.substr(0,l),10)-1; 
		arr[3]=parseInt(linech.substr(l),10)-1;
	}
}
const parseRemain=function(remain,pat,arr){ //arr=[book,page,col,line,ch]
	var m=remain.match(regexFollow1);
	var start=makeKPos(arr,pat);

	if (!m) {
		m=remain.match(regexFollow2); //only have line and ch
		if (!m) return start+1; 
		var l=m[1].length-2; //last two digit is ch
		parseLineChar(arr,m[1]);
	} else { //has page, col
		arr[1]=parseInt(m[1],10)-1; 
		if (pat.column) {
			arr[1]=arr[1]*pat.column+(parseInt(m[2],36)-10);
		}
		parseLineChar(arr,m[3]);
	}

	var end=makeKPos(arr,pat);
	if (end<start) {
		console.error("end bigger than start",arr);
		return start+1;
	}
	return end;
}
const parse=function(address,pat){
	var m=address.match(regexAddress);
	if (!m) return null;
	var arr=[0,0,0,0];//book,page,col,line,ch
	
	arr[0]=parseInt(m[1],10)-1; 
	arr[1]=parseInt(m[2],10)-1;
	if (pat.column) {
		arr[1]=arr[1]*pat.column+(parseInt(m[3],36)-10);
	}
	
	parseLineChar(arr,m[4]);

	var start=makeKPos(arr,pat);
	var end;

	const at=address.indexOf("-");
	if (at>-1) {
		remain=address.substr(at+1);
		end=parseRemain(remain,pat,arr);
	} else {
		end+=start+1;
	}
	
	return makeKRange(start,end,pat);
}
module.exports={parse,buildAddressPattern,makeKPos,
	makeKRange,breakKRange,unpack,stringify};