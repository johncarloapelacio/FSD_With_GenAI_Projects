
//Prevents access to dashboard without dashKey, and if an account is already signed in
if(!localStorage.getItem("dashKey")){
    window.location.href = "signin.html";
}

//To prevent directly opening a second dashboard window while user is logged in
localStorage.removeItem("dashKey");

//Allows a user to sign in if the dashboard window is exited (effectively signing out the current user);
window.addEventListener('beforeunload', function () {
//     // Deactivates account when user leaves or refreshes window
    this.localStorage.removeItem("activeAccount");
});

//Display's the email address of the active account
let activeAccount = localStorage.getItem("activeAccount");
document.getElementById("emailDisplay").innerHTML = activeAccount;

let cart = []; //Create empty array for cart

let itemsInCart = 0;


//show total items in cart
document.getElementById("itemsInCart").innerHTML = `Items in Cart: ${itemsInCart}`;


let menuDisplay = document.getElementById("menuDisplay");
let cartDisplay = document.getElementById("cartDisplay");

let cartInView = false; //tracks whether cart display is in view; later used for checkout functionality

menuDisplay.style.display = ""; //no change to menu display
cartDisplay.style.display = "none"; //remove cart display from view

function displayMenu() {
    menuDisplay.style.display = ""; //no change to cart display
    cartDisplay.style.display = "none"; //remove menu display from view
    cartInView = false;
}

function displayCart() {
    cartDisplay.style.display = ""; //no change to display
    menuDisplay.style.display = "none"; //remove cart display from view
    cartInView = true;
}

//sign out function
function signOut() {
    window.location.href ="signin.html" //Sends user back to sign in page
}

function addItem(itemId, itemName, price){
    // look for item in cart; if found, return item; otherwise return undefined (falsy)
    let itemAdded  = cart.find(c=>c.Id === itemId); // check if added item is already in cart
    
    if(itemAdded){
        itemAdded.Qty += 1; // if added item is found in cart, increase quantity by 1
    }else {
        cart.push({Id: itemId, Name: itemName, Price: price, Qty: 1}); // add new item to cart
    }
    refreshCart(); //refresh items to be displayed in cart
}

//shows the menu and relevant item details, with button to add item to cart
function showItems(items) {
    items.forEach(item => {
        //sets a random reasonable price for item using item id
        let price = Math.trunc((item.idMeal/2000 - Math.random()*10)*100)/100;

        menuDisplay.innerHTML +=`
        <div class="bg-[url('images/marbleBG.png')] bg-cover p-4 rounded-4xl shadow-md flex flex-col items-center">
            <div class="w-full p-2 mb-2 overflow-hidden flex items-center justify-center">
                <img src="${item.strMealThumb}" alt="${item.strMeal}"
                    class="object-cover w-full h-full rounded-lg max-h-48" />
            </div>
            <h3 class="text-xl text-orange-200 font-semibold text-center">${item.strMeal}</h3>
            <p class="text-gray-200 text-sm text-center">Price: $${price}</p>
            <input type="button" value = "ADD TO CART"
                onclick="addItem(${item.idMeal},'${item.strMeal}',${price})"
                class="bg-purple-300 text-green-900 p-2 font-sans font-bold italic rounded-4xl hover:bg-purple-400 transition-colors duration-200 cursor-pointer w-full mt-2" />
        </div>
    `
    }
)
}

//refreshes the cart display with current items in cart
function refreshCart() {
    let cartItem = document.getElementById("cartItem");
    cartItem.innerHTML = ""; //clear previous cart items to display refreshed cart
    itemsInCart = 0; //clear items in cart for recount
    let total = 0; //reset total to zero for recalculation
    cart.forEach(item => {
        cartItem.innerHTML += `
            <div class="bg-black rounded-4xl shadow p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 class="text-xl text-orange-200 font-semibold font-semibold mb-1">${item.Name}</h3>
                    <p class="text-gray-200 mb-1">Price: <span class="font-medium">$${item.Price}</span></p>
                    <p class="text-gray-200 mb-2">Quantity: <span class="font-medium">${item.Qty}</span></p>
                </div>
                <div class="flex space-x-2 mt-2 md:mt-0">
                    <input type="button" value="+" onClick="changeQty(${item.Id}, 1)"
                        class="bg-green-800 hover:bg-green-900 text-white text-xl font-bold py-1 px-3 rounded-2xl cursor-pointer"/>
                    <input type="button" value="-" onClick="changeQty(${item.Id}, -1)"
                        class="bg-purple-400 hover:bg-purple-500 text-black text-xl font-bold py-1 px-3 rounded-2xl cursor-pointer"/>
                </div>
            </div>
        `;
        total += item.Price * item.Qty;
        //gives the calculated total to two decimal places
        dollarTotal = total.toFixed(2);
    });
    if(cart.length > 0) {
        cartItem.innerHTML += `<div class="text-center"><h3 class="text-3xl font-bold">Total Amount: <span class="text-green-900">$${dollarTotal}</span></h3></div>`;
            //update number of items in cart
        cart.forEach(item => {
            itemsInCart += item.Qty;
        })
    }
    document.getElementById("itemsInCart").innerHTML = `Items in Cart: ${itemsInCart}`; //display number of items in cart
}

//increments or decrements the passed items quantity
function changeQty(itemId, change) {
    cart = cart.map(item => {
            if(item.Id === itemId){
                item.Qty += change; // increment or decrement item quantity
            }
        return item;
        }).filter(item => item.Qty != 0); // remove item from cart if quantity is decremented to 0  

        refreshCart(); // update cart section in dashboard page after changing quantity
}

//simulates checkout of ordered items in cart
function checkOut() {
    //checks if cart is in view, and puts the cart display in view if it is not
    if(!cartInView) {
        displayCart();
    }else{
    if (cart.length == 0) {//checks if the cart is empty and alerts user if it is
        alert("your cart is empty!");
    }else{
        //creates array receipt using array cart for generating a receipt in alert message
        let receipt = [];
        for (let i = 0; i < cart.length ; i++) {
            receipt.push(cart[i].Name);
            receipt.push(cart[i].Price);
            receipt.push(cart[i].Qty)
        }
        cart = [];//empties cart
        //alerts user of successfull checkout and generates a receit within the alert message
        alert(`Checkout Successful!\n\nReceipt:\n\n${receipt.join('\n')}\n\nTotal Charged: ${dollarTotal}\nThank you for choosing John Carlo's!`);
        refreshCart();
     }
    }
}


let URLmenu = "https://www.themealdb.com/api/json/v1/1/search.php?f=a"

//retrieve menu info from above URL
fetch(URLmenu).then(response => response.json()).then(menu => {
    console.log(menu);
    showItems(menu.meals);
}).catch(error =>{
    console.log(error);
})

