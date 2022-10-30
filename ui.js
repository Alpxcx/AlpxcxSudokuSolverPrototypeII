const sdui = {};

sdui.doubleCNs = function(Node,x,y,nextNode){
	if(nextNode===true) return Node.childNodes[x].childNodes[y].childNodes[0];
	return Node.childNodes[x].childNodes[y];
	//<td>
}

sdui.unloadPuzzle = function(pClass,num){
	var x=document.getElementsByClassName(pClass)[num].childNodes[1];
	var y=new Array(9);
	var elemtoOuNodes = [0,1,0,3,0,5,2,1,2,3,2,5,4,1,4,3,4,5];
	for(let i=0;i < 9;i++){
		j=i << 1;
		y[i]=sdui.doubleCNs(x,elemtoOuNodes[j],elemtoOuNodes[j+1],true).textContent;
	}
	return y;
	// [ "123456789", "123456789", "123456789", "123456789", "123456789", "123456789", "123456789", "123456789", "123456789" ]
	//this result has to be further processed to be loadable
}

sdui.loadPuzzle = function(puzId,sArr){
	if(sArr.length!=81) return false;
	var x=puzId << 7;
	if(typeof sArr == "string"){
		for(let i=0;i < 81;i++){
			if(sArr[i] == ".") document.getElementById(x+i).textContent="0";
  		else if(isNaN(parseInt(sArr[i]))){
  			clearPuzzle(puzId);
  			return false;
  		}
  		else document.getElementById(x+i).textContent=sArr[i];
  	}
  	return true;
	}
	else{
		for(let i=0;i < 81;i++){
  		document.getElementById(x+i).textContent=sArr[i];
  		//using node.textContent is always recommended because it has better performance than node.innerHTML
  	}
  	return true;
	}
}

sdui.clearPuzzle = function(puzId){
	var x=puzId << 7;
	for(let i=0;i < 81;i++){
		document.getElementById(x+i).textContent="";
		//using node.textContent is always recommended because it has better performance than node.innerHTML
	}
}

sdui.numberPuzzle = function(tab,puzId){
	var x=puzId << 7;
	var y=new Array(81);
	tab.id=puzId;
	var tb=tab.childNodes[1];
	var boxProjection = [[0,1,2,9,10,11,18,19,20],
      	              [3,4,5,12,13,14,21,22,23],
      	              [6,7,8,15,16,17,24,25,26],
      	              [27,28,29,36,37,38,45,46,47],
      	              [30,31,32,39,40,41,48,49,50],
      	              [33,34,35,42,43,44,51,52,53],
      	              [54,55,56,63,64,65,72,73,74],
      	              [57,58,59,66,67,68,75,76,77],
      	              [60,61,62,69,70,71,78,79,80]];
  var elemtoOuNodes = [0,1,0,3,0,5,2,1,2,3,2,5,4,1,4,3,4,5];
  var elemtoInNodes = [0,0,0,1,0,2,1,0,1,1,1,2,2,0,2,1,2,2];
  for(let i=0,pj=0;i < 18;i+=2){
  	let ii=i+1;
  	for(let j=0;j < 18;j+=2){
  		let jj=j+1;
  		pj=boxProjection[i >> 1][j >> 1];
  		y[pj]=sdui.doubleCNs(sdui.doubleCNs(tb,elemtoOuNodes[i],elemtoOuNodes[ii],true).childNodes[0],elemtoInNodes[j],elemtoInNodes[jj],false);
  		//console.log(y[m]);
  		//<td>
  		y[pj].id=x+pj;
  	}
  }
  return y;
}

window.onload=function(){
	window.p1=sdui.numberPuzzle(document.getElementsByClassName("SOuter_S")[0],1);
}
