

//This JS file is conceptually divided into two sections: Registration and Sign In Validation.
// It is uses localStorage to store mutiple valid credentials (username and password)


//REGITRATION PAGE CODE//

//function to return to sign in page
function signinPage(){
    window.location.href = "signin.html";
}

//pushes new valid credentials object into users array if userEmail isn't already in it, and then stores users array in localStorage
function register(event){ 
    //immediately prevent default form submission
    event.preventDefault();
    
    //Sets users equal to array of accounts stored in localStorage; if localStorage is empty, declare users as empty array
    let users = JSON.parse(localStorage.getItem("accounts") || "[]");

    //set form submission tracker
    let isValid = false;

    //get form Id for custom validation submission
    const form = document.getElementById("registerForm");

    let userEmail = document.getElementById("newEmailId").value.trim();
    let userPassword = document.getElementById("newPasswordId").value.trim();

    //set common email pattern
    let emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/i

    if (userEmail.length == 0){ //check if user left email field blank
        alert("Email required")
    }else if (!emailPattern.test(userEmail)){ //check if user email input matches required pattern
        alert("Please enter an email with the required pattern\nThe special characters % . + _ -  are allowed only before @ symbol\nExample: ab%12.Cd+23_Ef-45@gh67.IJkl")
    }else if(userPassword.length == 0){ //check if user left password field blank
        alert("Password required")
    }else if(userPassword.length < 5){ //check if user password input is at least 5 characters long
        alert("Password must be at least 5 characters long")
    }else{
        users.forEach(credentials =>{
            if(userEmail == credentials.un){ // search if email already exists in users array
                isValid = true; //If a match is found, set form submission tracker to true
            }})

            if (isValid){ //Tell the user that account already exists, and to please sign in. Then...
                alert("Account already exists. Please sign in.\nForgot your password? Sorry, buddy... Just create another account! :D");
                form.submit(); //send them back to the sign in page!
            }else{
        users.push({un: userEmail, pw: userPassword}); // pushes newly created credentials into users array
        localStorage.setItem("accounts", JSON.stringify(users)); //stores updated users array data into localStorage
        alert("Account created!")
        form.submit();
    }
    }
}


//SIGN IN PAGE CODE//

//function to return to sign in page
function registerPage(){
    window.location.href = "register.html";
}

function validation(event) {
    //immediately prevent default form submission
    event.preventDefault();

    //retrieves array of accounts from localStorage and assigns it to users; if localStorage is empty, it assigns an empty array to users
    let users = JSON.parse(localStorage.getItem("accounts") || "[]");

    //set form submission tracker
    let isValid = false;

    //Get from Id for custom validation submission
    const form = document.getElementById("signinForm");
    
    let email = document.getElementById("emailId").value.trim();
    let password = document.getElementById("pwId").value.trim();

    //set common email pattern
    let emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/i

    if (email.length == 0){ //check if user left email field blank
        alert("Email required")
    }else if (!emailPattern.test(email)){ //check if user email input matches required pattern
        alert("Please enter an email with the required pattern\nThe special characters % . + _ -  are allowed only before @ symbol\nExample: ab%12.Cd+23_Ef-45@gh67.IJkl")
    }else if(password.length == 0){ //check if user left password field blank
        alert("Password required")
    }else if(password.length < 5){ //check if user password input is at least 5 characters long
        alert("Password must be at least 5 characters long")
    }else{
        users.forEach(credentials => { //check if user email and password input matches any credentials in array users
        if(email == credentials.un && password == credentials.pw){
            isValid = true; //if match is found, set form submission tracker to true
        }})

        if(isValid){ //if form submission tracker is true...
            if (localStorage.getItem("activeAccount")){ //Prevent sign in if there is already an account signed in
                alert("There's already an account signed in. Please sign out of current account before signing in.");
            }else{
            alert("Welcome!"); //Welcome user...
            localStorage.setItem("dashKey", true); //Provides a one-instance access to dashboard
            localStorage.setItem("activeAccount", email); //Stores current user's email in localStorage for access on dashboard.html
            form.submit(); //and submit form
            }
        }else{
            alert("Invalid credentials"); // else alert the user of invalid credentials entered
        }
        }
    }