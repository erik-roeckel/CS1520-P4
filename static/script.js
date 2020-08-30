var purchaseAmount;
var purchaseCat;
var categories;

function setup() {
    document.getElementById("newCatButton").addEventListener("click", sendCategory, true);
    document.getElementById("newPurchaseButton").addEventListener("click", sendPurchase, true);

	// initialize theTable
	poller();
}


/***********************************************************
 * AJAX boilerplate
 ***********************************************************/

function makeRec(method, target, retCode, handlerAction, data) {
	var httpRequest = new XMLHttpRequest();

	if (!httpRequest) {
		alert('Giving up :( Cannot create an XMLHTTP instance');
		return false;
	}

	httpRequest.onreadystatechange = makeHandler(httpRequest, retCode, handlerAction);
	httpRequest.open(method, target);
	
	if (data) {
		httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		httpRequest.send(data);
	}
	else {
		httpRequest.send();
	}	
}


function makeHandler(httpRequest, retCode, action) {
	console.log("making handler!");
	function handler() {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === retCode) {
				console.log("recieved response text:  " + httpRequest.responseText);
				action(httpRequest.responseText);
			} else {
				alert("There was a problem with the request.  you'll need to refresh the page!");
			}
		}
	}
	return handler;
}

function poller(){
    makeRec("GET", "/cats", 200, repopulateCategories);
}

function sendCategory(){
    var newCatName = document.getElementById("newCatName").value
    if(newCatName == ""){
        alert("You must enter a name to add a new category");
    }
    var newCatLimit = document.getElementById("newCatLimit").value
    var formattedLimit = validateCurrency(newCatLimit);
    if(formattedLimit == false){
        alert("You must enter a $ limit in the form xx.xx (x's being valid digits [1-9]");
    }
    if(formattedLimit != false && newCatName != ""){
        var currentPurchases = [0];
        var data;
        data = "name=" + newCatName + "&limit=" + formattedLimit + "&purchases=" + currentPurchases;
        makeRec("POST", "/cats", 201, poller, data);
    }
    document.getElementById("newCatName").value = "";
    document.getElementById("newCatLimit").value = "";
}

function sendUncategorizedCategory(){
    var newCatName = "Uncategorized";
    purchaseCat = newCatName;
    var newCatLimit = "No limit set";
    var currentPurchases = [0];
    var data;
    data = "name=" + newCatName + "&limit=" + newCatLimit + "&purchases=" + currentPurchases;
    makeRec("POST", "/cats", 201, poller, data);
}

function deleteCategory(catID){
    var currentPurchases = [];
    var catName;
    var uncategorizedExist = false;
    var uncategorizedID;
    var uncategorizedName = "Uncategorized";
    var uncategorizedLimit = "No limit set";
    var uncategorizedAmount;
    var deletedAmount;

    for(c in categories){
        for(cat in categories[c]){
            if(cat == "name"){
                catName = categories[c][cat];
                if(catName == uncategorizedName){
                    uncategorizedExist = true;
                    uncategorizedID = c;
                }
            }
            else if(cat == "purchases" && catName == "Uncategorized"){
                uncategorizedAmount = categories[c][cat];
            }
            if(c == catID && cat == "purchases"){
                deletedAmount = categories[c][cat];
                if(uncategorizedExist == false){
                    currentPurchases[0] = deletedAmount;
                }
            }
        }
    }
    if(uncategorizedExist == true){
        currentPurchases[0] = uncategorizedAmount;
        currentPurchases.push(deletedAmount);
        currentPurchases = addPArray(currentPurchases);
        currentPurchases = parseFloat(currentPurchases).toFixed(2);
        updateCategory(uncategorizedID, "Uncategorized", "No limit set", currentPurchases);
    }
    else{
        var data = "name=" + uncategorizedName + "&limit=" + uncategorizedLimit + "&purchases=" + currentPurchases;
        makeRec("POST", "/cats", 201, poller, data);
    }
    makeRec("DELETE", "/cats/" + catID, 204, poller);
}

function updateCategory(catID, name, limit, purchases){
    var data = "name=" + name + "&limit=" + limit + "&purchases=" + purchases;
    makeRec("PUT", "/cats/" + catID, 201, poller, data);
}

function sendPurchase(){
    var newPName = document.getElementById("newPurchaseName").value
    if(newPName == ""){
        alert("You must enter a name to add a new purchase");
    }
    var newPAmount = document.getElementById("newPurchaseAmount").value
    var formattedAmount = validateCurrency(newPAmount);
    if(formattedAmount == false){
        alert("You must enter currency in the format (xx.xx)");
    }
    var newPDate = document.getElementById("newPurchaseDate").value
    var formattedDate = formatDate(newPDate);
    if(formattedDate == false){
        alert("You must enter date in the format (YYYY-MM-DD)");
    }
    else if(formattedDate == "wrong month"){
        alert("You have added a purchase for a date not in current month, this will not be visible to you until this month is reached");
    }
    var newPCat = document.getElementById("newPurchaseCategory").value
    document.getElementById("newPurchaseName").value = "";
    document.getElementById("newPurchaseAmount").value = "";
    document.getElementById("newPurchaseDate").value = "";
    document.getElementById("newPurchaseCategory").value = "";
    
    if(newPName != "" && formattedDate != false && formattedDate != "wrong month" && formattedAmount != false){
        purchaseAmount = newPAmount;
        purchaseCat = newPCat;
        var data;
        data = "pName=" + newPName + "&pAmount=" + newPAmount + "&pDate=" + formattedDate + "&pCat=" + newPCat;
        makeRec("POST", "/purchases", 201, poller, data);
        if(purchaseCat == ""){
            sendUncategorizedCategory();
        }
        else if(purchaseCat ==""){
            purchaseCat = "Uncategorized";
        }
    }

}

function addCell(row, text) {
    var newCell = row.insertCell();
    var newText = document.createTextNode(text);
    newCell.appendChild(newText);
}

function repopulateCategories(responseText) {
    console.log("repopulating categories!");
    categories = JSON.parse(responseText);
    var tab = document.getElementById("categoryTable");
    var newRow, newCell, c, category, newButton;

    while(tab.rows.length > 0){
        tab.deleteRow(0);
    }

    var tableHeader = tab.insertRow();
    var categoryName = document.createElement('th');
    var categoryLimit = document.createElement('th');
    var categorySpent = document.createElement('th');
    categoryName.textContent = "Category";
    categoryLimit.textContent = "$ Limit";
    categorySpent.textContent = "$ Spent";
    tableHeader.appendChild(categoryName);
    tableHeader.appendChild(categoryLimit);
    tableHeader.appendChild(categorySpent);
    
    var currentCat;
    var currentLimit;
    var currentPurchases = [];

    for(c in categories){
        newRow = tab.insertRow();
        for(category in categories[c]){
            if(category == "name"){
                currentCat = categories[c][category];
                if(currentCat == "Uncategorized"){
                    uncategorizedExists = true;
                }
            }
            if(category == "limit"){
                currentLimit = categories[c][category];
            }
            if(category == "purchases" && currentCat == purchaseCat && purchaseAmount != null){
                currentPurchases[0] = categories[c][category];
                currentPurchases.push(purchaseAmount);
                purchaseAmount = null;
                currentPurchases = addPArray(currentPurchases);
                currentPurchases = parseFloat(currentPurchases).toFixed(2);
                updateCategory(c, currentCat, currentLimit, currentPurchases);
            }
            addCell(newRow, categories[c][category]);
        }
        

        newCell = newRow.insertCell();
        newButton = document.createElement('input');
        newButton.type = "button";
        newButton.value = "Delete " + currentCat + " Category";
        (function(_c){ newButton.addEventListener("click", function() { deleteCategory(_c); }); }) (c);
        newCell.appendChild(newButton);
    }

}

function grabAtt(att){
    return function(item) {return item[att]; };
}

function add(a, b){
    return parseFloat(a) + parseFloat(b);
}

function addPArray(pArr){
    return pArr.reduce(add, 0);
}

function formatDate(date) {
    if(/^\d{4}\-\d{2}\-\d{2}$/.test(date)){
        var parsed = date.split('-');
        var formatDate = new Date(parsed[0], parsed[1] - 1, parsed[2]);
        var currentDate = new Date();
        if(formatDate.getMonth() == currentDate.getMonth()){
            return formatDate;
        }
        else{
            return "wrong month";
        }
    }
    else{
        return false;
    }
}

function validateCurrency(amount){
    if(/^[+-]?[0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2}$/.test(amount)){
        return amount;
    }
    else{
        return false;
    }
}

window.addEventListener("load", setup, true);