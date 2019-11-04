var DEBUG_PAGE = null;

var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

var pages = [{
    ID: "main-menu",
    backgroundColor: "white"
},{
    ID: "hangman",
    backgroundColor: "#6a538c"
},{
    ID: "word-search"
},{
    ID: "word-banks",
    backgroundColor: "#080808"
}];
function ScrollToTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}
function CreateKeyboard(){
    var alphabetElement = document.getElementById("alphabet");
    function letterReset() {
        this.classList.remove("disabled");
    }
    for(var i = 0;i<ALPHABET.length;i++) {
        var letter = document.createElement("p");
        letter.appendChild(document.createTextNode(
            ALPHABET.charAt(i)
        ));
        letter.resetForGame = letterReset.bind(letter);
        letter.addEventListener("click",function(event){
            if(!event.currentTarget.classList.contains("disabled")) {
                event.currentTarget.classList.add("disabled");
                GameLetterClicked(
                    event.currentTarget.textContent,event.currentTarget
                );
            }
        },true);
        alphabetElement.appendChild(letter);
    }
}
function GetDefaultWordCache() {
    var cache = {
        completed: 0,
        total: 0,
        failed: 0
    }
    for(var i = 0;i<ALPHABET.length;i++) {
        cache[ALPHABET.charAt(i)] = [];
    }
    return cache;
}
var regularHeartImage = "images/heart.png";
var emptyHeartImage = "images/heart-empty.png";

var hearts = document.getElementById("hearts");
var heartCount = 6;
function CreateHearts() {
    for(var i = 0;i<heartCount;i++) {
        var image = new Image();
        image.src = regularHeartImage;
        hearts.appendChild(image);
    }
    var preloadImage = new Image();
    preloadImage.src = emptyHeartImage;
}
function ResetHearts() {
    for(var i = 0;i<heartCount;i++) {
        hearts.children[i].src = regularHeartImage;
    }
}
function ProcessPageData() {
    for(let i = 0;i<pages.length;i++) {
        var page = pages[i];
        var pageElement = document.getElementById(page.ID);
        if(page.backgroundColor) {
            pageElement.backgroundColor = page.backgroundColor;
        }
        pages[i] = pageElement;
    }
}

CreateKeyboard();
CreateHearts();
ProcessPageData();

var letterCallback = null;
var pressedButtons = [];

function GameLetterClicked(letter,element) {
    if(letterCallback !== null) {
        letterCallback(letter);
    }
    pressedButtons.push(element);
}
function ResetGameKeyboard() {
    for(let i = 0;i<pressedButtons.length;i++) {
        pressedButtons[i].resetForGame();
    }
    pressedButtons.splice(0);
}
var activePage = null;
var exitButtonCallback = null;
var exitButton = document.body.getElementsByClassName("exit-button")[0];

exitButton.addEventListener("click",function(){
    if(exitButtonCallback !== null) {
        exitButtonCallback();
    } else {
        console.warn("Tried to exit but missing valid exit button callback!");
    }
},true);

var mainMenu = pages[0];
var hangmanPage = pages[1];
var wordSearchPage = pages[2];
var wordBanksPage = pages[3];

function GetRandomHangmanSentence() {
    return "THIS IS A TEST SENTENCE";
}

var currentSentence = null;
var activeWordBank = null;
function RefreshHangmanSentence() {
    var newSentence;
    if(activeWordBank && activeWordBank.length) {
        newSentence = "FEATURE NOT YET COMPLETE";
    } else {
        newSentence = GetRandomHangmanSentence();
    }
    currentSentence = newSentence;
    PopulateWordArea(newSentence);
}
function HangmanEndGameCallback(callbackID) {
    ResetGameKeyboard();
    ResetHearts();
    if(callbackID === 0) {
        RefreshHangmanSentence();
    } else {
        letterCallback = null;
        ReturnToMainMenu();
    }
}
var HangmanEndGameButtons = [
    {text:"Keep playing",type:"good"},
    {text:"Stop playing",type:"bad"},
]
function TryCompleteHangmanGame() {
    var title = null;
    var message = null;
    if(currentWordCache.failed === heartCount) {
        title = "Game over!";
        message = "Sentence: \"" + currentSentence + "\"";
    } else if(currentWordCache.completed === currentWordCache.total) {
        title = "Yay!";
        message = "You guessed the sentence: \"" + currentSentence + "\"";
    }
    if(title) {
        CustomPrompt(
            title,message,
            HangmanEndGameButtons,
            HangmanEndGameCallback
        );
    }
}
function HangmanLetterCallback(letter) {
    var bucket = currentWordCache[letter];
    if(bucket.length) {
        for(var i = 0;i<bucket.length;i++) {
            bucket[i].className = "guessed";
            currentWordCache.completed++;
        }
    } else {
        currentWordCache.failed++;
        hearts.children[
            hearts.childElementCount-currentWordCache.failed
        ].src = emptyHeartImage;
    }
    TryCompleteHangmanGame();
}

function LoadHangman() {
    RefreshHangmanSentence();
    letterCallback = HangmanLetterCallback;
    ShowPage(hangmanPage,function(){
        CustomPrompt("Warning!","Are you sure you want to exit?",[
            {text:"I'm sure",type:"good"},
            {text:"No, keep playing",type:"bad"}
        ],function(callbackID){
            if(callbackID === 0) {
                letterCallback = null;
                ReturnToMainMenu();
            }
        });
    });
}

var wordBanks = [];
LoadWordBanks();

var menuButtons = mainMenu.querySelectorAll(
    "div.grid-item"
);
menuButtons[0].addEventListener(
    "click",MenuButton1Clicked,true
);
menuButtons[1].addEventListener(
    "click",MenuButton2Clicked,true
);
menuButtons[2].addEventListener(
    "click",MenuButton3Clicked,true
);

var wordArea = document.getElementById("word-area");

var currentWordCache = null;
function MapWordToParagraphs(target,word,cache) {
    for(let i = 0;i<word.length;i++) {
        var paragraph = document.createElement("p");
        var letter = word.charAt(i);
        paragraph.appendChild(
            document.createTextNode(letter)
        );
        cache.total++;
        cache[letter].push(paragraph);
        target.appendChild(paragraph);
    }
}
function PopulateWordArea(sentence) {
    while(wordArea.lastChild) {
        wordArea.removeChild(wordArea.lastChild);
    }
    currentWordCache = GetDefaultWordCache();
    sentence = sentence.split(" ");
    for(var i = 0;i<sentence.length;i++) {
        MapWordToParagraphs(wordArea,sentence[i],currentWordCache);
        if(i < sentence.length-1) {
            var space = document.createElement("div");
            space.className = "space";
            wordArea.appendChild(space);
        }
    }
}

function ReturnToMainMenu() {
    ShowPage(mainMenu,null);
}

function WordBankRequiredPrefix() {
    if(!wordBanks.length) {
        CustomPrompt("Slow down there!","You need to create a word bank first!",[
            {text:"Proceed",type:"good"},
            {text:"Not right now",type:"bad"}
        ],function(callbackID){
            if(callbackID === 0) {
                ShowPage(wordBanksPage,ReturnToMainMenu);
            }
        });
        return true;
    } else {
        return false;
    }
}
function MenuButton1Clicked(event) {
    if(WordBankRequiredPrefix()) {
        return;
    }
    LoadHangman();
}
function MenuButton2Clicked(event) {
    if(WordBankRequiredPrefix()) {
        return;
    }
}
function MenuButton3Clicked(event) {
    ShowPage(wordBanksPage,ReturnToMainMenu);
}

function ShowPage(page,exitCallback) {
    if(activePage) {
        activePage.classList.add("hidden");
    }
    activePage = page;
    activePage.classList.remove("hidden");
    if(activePage.backgroundColor) {
        document.body.style.backgroundColor = activePage.backgroundColor;
    } else {
        delete document.body.style.backgroundColor;
    }
    if(exitCallback) {
        exitButton.classList.remove("hidden");
        exitButtonCallback = exitCallback;
    } else {
        exitButton.classList.add("hidden");
        exitButtonCallback = null;
    }
    ScrollToTop();
}
function TestCustomPrompt() {
    CustomPrompt(
        "Caution!","What is done cannot be undone!",[
        {text:"Okay",type:"good"},
        {text:"Cancel",type:"bad"}
    ],function(callbackID){
        console.log("Callback ID: " + callbackID);
    });
}
function CustomPrompt(title,message,buttons,callback,target) {
    if(!target) {
        target = document.body;
    }
    var popup = document.createElement("div");
    popup.className = "popup";
    var callbackProxy = function(event) {
        var buttonCallbackID = event.currentTarget.callbackID;
        if(callback) {
            callback(buttonCallbackID);
        }
        target.removeChild(popup);
        target.classList.remove("no-scroll");
    }
    var innerPopup = document.createElement("div");
    innerPopup.className = "inner-popup";
    var buttonContainer = document.createElement("div");
    buttonContainer.className = "button-container";

    var innerPopupText = document.createElement("div");
    innerPopupText.className = "inner-popup-text";
    
    var titleElement = document.createElement("h1");
    var messageElement = document.createElement("p");

    titleElement.appendChild(document.createTextNode(title));
    messageElement.appendChild(document.createTextNode(message));

    innerPopupText.appendChild(titleElement);
    innerPopupText.appendChild(messageElement);

    for(var i = 0;i<buttons.length;i++) {
        var button = buttons[i];
        var buttonElement = GetPromptButton(
            button.text,
            button.type,
            callbackProxy
        );
        buttonElement.callbackID = i;
        buttonContainer.appendChild(buttonElement);
    }

    innerPopup.appendChild(innerPopupText);
    innerPopup.appendChild(buttonContainer);
    popup.appendChild(innerPopup);

    target.classList.add("no-scroll");
    target.appendChild(popup);
}
function GetPromptButton(text,type,callback) {
    var button = document.createElement("button");
    var buttonText = document.createTextNode(text);
    button.className = type;
    button.appendChild(buttonText);
    button.addEventListener("click",callback,true);
    return button;
}
function CreateHangmanAlphabet() {

}
function LoadWordBanks() {
    //todo
}
function SaveWordBanks() {
    //todo
}

if(DEBUG_PAGE === null) {
    ShowPage(mainMenu);
} else {
    LoadHangman();
}
