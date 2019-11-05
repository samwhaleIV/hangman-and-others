var DEBUG_PAGE = null;

var LOCAL_STORAGE_KEY = "hangman_word_banks";
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

var ALPHABET_LOOKUP = {};

for(var i = 0;i<ALPHABET.length;i++) {
    ALPHABET_LOOKUP[ALPHABET.charAt(i)] = true;
}

var DEFAULT_BANK_TITLE = "Untitled Word Bank"
var WORD_TYPES = [
    "noun","adjective",
    "verb","other"
];
var WORD_TYPES_DISPLAY = [];
for(var i = 0;i<WORD_TYPES.length;i++) {
    var type = WORD_TYPES[i];
    WORD_TYPES_DISPLAY[i] = type.charAt(0).toUpperCase() + type.slice(1);
}

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
    backgroundColor: "#0a0a0a"
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
    for(var i = 0;i<pages.length;i++) {
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
    for(var i = 0;i<pressedButtons.length;i++) {
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
    return activeWordBank.words[
        Math.floor(Math.random() * activeWordBank.words.length)
    ].text;
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
];
var hangmanGameIsSentence = false;
function TryCompleteHangmanGame() {
    var title = null;
    var message = null;
    currentSentence = currentSentence.toLowerCase();
    currentSentence = currentSentence.charAt(0).toUpperCase() + currentSentence.slice(1);
    if(currentWordCache.failed === heartCount) {
        title = "Game over!";
        message = "Darn! So close. Answer: " + currentSentence;
    } else if(currentWordCache.completed === currentWordCache.total) {
        var wordOrSentence = hangmanGameIsSentence ? "sentence" : "word";
        title = "Yay!";
        message = "You guessed the " + wordOrSentence + ": " + currentSentence;
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

var wordBanks = null;
var nextWordBankID = 0;
var colors = ["green","purple","blue","orange","red"];
function GetNewWordBankID() {
    return ++nextWordBankID;
}
function GetNextRandomColor() {
    return colors[nextWordBankID%colors.length];
}
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
var wordBanksElement = document.body.querySelector(
    "div#word-banks div.word-banks"
);

var currentWordCache = null;
function MapWordToParagraphs(target,word,cache) {
    for(var i = 0;i<word.length;i++) {
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
    hangmanGameIsSentence = sentence.length >= 2;
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
                ShowWordBankPage();
            }
        });
        return true;
    } else {
        return false;
    }
}
function MenuButton1Clicked() {
    if(WordBankRequiredPrefix()) {
        return;
    }
    ShowWordSelectionPage(LoadHangman,null);
}
function MenuButton2Clicked() {
    if(WordBankRequiredPrefix()) {
        return;
    }
}
function MenuButton3Clicked() {
    ShowWordBankPage();
}

function ShowPage(page,exitCallback) {
    if(activePage) {
        activePage.classList.add("hidden");
    }
    activePage = page;
    activePage.classList.remove("hidden");
    if(activePage.backgroundColor) {
        document.body.style.backgroundColor = activePage.backgroundColor;
        document.body.style.borderColor = activePage.backgroundColor;
    } else {
        delete document.body.style.backgroundColor;
        delete document.body.style.borderColor;
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
function EnableGlobalScroll() {
    target.classList.remove("no-scroll");
}
function DisableGlobalScroll() {
    target.classList.add("no-scroll");
}
function CustomPrompt(title,message,buttons,callback) {
    target = document.body;
    var popup = document.createElement("div");
    popup.className = "popup";
    var callbackProxy = function(event) {
        var buttonCallbackID = event.currentTarget.callbackID;
        if(callback) {
            callback(buttonCallbackID);
        }
        target.removeChild(popup);
        EnableGlobalScroll();
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

    DisableGlobalScroll();
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
function CreateWordBankCreationEntry(createCallback) {
    var wordBank = document.createElement("div");
    wordBank.className = "word-bank green";
    
    var heading = document.createElement("h1");
    heading.appendChild(document.createTextNode(
        "Create Word Bank"
    ));

    var description = document.createElement("p");
    description.appendChild(document.createTextNode(
        "You need to make a word bank before you can play games"
    ));

    var actionContainer = document.createElement("div");
    actionContainer.className = "action-container";
    AddWordBankButton(
        actionContainer,"Create",createCallback,null
    );

    wordBank.appendChild(heading);
    wordBank.appendChild(description);
    wordBank.appendChild(actionContainer);

    return wordBank;
}
function PrettifyWordBankList(words) {
    words = words.slice(0);
    if(words.length) {
        var wordsBuffer = "Words: ";
        for(var i = 0;i < words.length;i++) {
            var word = words[i].text.toLowerCase();
            words[i] = word.charAt(0).toUpperCase() + word.slice(1);
        }
        wordsBuffer += words.join(", ");
        return wordsBuffer;
    } else {
        return "This word bank is empty :(";
    }
}
function AddWordBankButton(target,name,callback,callbackID) {
    var button = document.createElement("button");
    button.callbackID = callbackID;
    button.appendChild(document.createTextNode(name));
    if(callback) {
        button.addEventListener("click",callback,true);
    }
    target.appendChild(button);
}
function CreateWordBank(
    wordBankID,title,words,color,forSelection,firstCallback,secondCallback
) {
    var wordBank = document.createElement("div");
    wordBank.className = "word-bank " + color;
    
    var heading = document.createElement("h1");
    heading.appendChild(document.createTextNode(title));

    words = PrettifyWordBankList(words);

    var description = document.createElement("p");
    description.appendChild(document.createTextNode(words));

    var actionContainer = document.createElement("div");
    actionContainer.className = "action-container";

    if(forSelection) {
        AddWordBankButton(
            actionContainer,"Select",firstCallback,wordBankID
        );
    } else {
        AddWordBankButton(
            actionContainer,"Edit",firstCallback,wordBankID
        );
        AddWordBankButton(
            actionContainer,"Delete",secondCallback,wordBankID
        );
    }

    wordBank.appendChild(heading);
    wordBank.appendChild(description);
    wordBank.appendChild(actionContainer);

    return wordBank;
}
function PopulateWordBankList(
    forSelection,createCallback,firstCallback,secondCallback
) {
    ClearWordBankList();
    if(!forSelection) {
        var creationEntry = CreateWordBankCreationEntry(createCallback);
        wordBanksElement.appendChild(creationEntry);
    }
    for(var i = 0;i<wordBanks.length;i++) {
        var wordBank = wordBanks[i];
        var wordBankElement = CreateWordBank(
            wordBank.ID,wordBank.title,wordBank.words,
            wordBank.color,
            forSelection,firstCallback,secondCallback
        )
        wordBanksElement.appendChild(wordBankElement);
    }
}
function ClearWordBankList() {
    while(wordBanksElement.lastChild) {
        wordBanksElement.removeChild(wordBanksElement.lastChild);
    }
}
function GetWordBankByID(ID) {
    for(var i = 0;i<wordBanks.length;i++) {
        var wordBank = wordBanks[i];
        if(wordBank.ID === ID) {
            return wordBank;
        }
    }
    return null;
}
function DeleteWordBankByID(ID) {
    for(var i = 0;i<wordBanks.length;i++) {
        var wordBank = wordBanks[i];
        if(wordBank.ID === ID) {
            wordBanks.splice(i,1);
            return;
        }
    }
}
function EditWordBankByID(ID,editCallback) {
    var wordBank = GetWordBankByID(ID);
    activeWordBank = wordBank;
    ShowWordBankModal(editCallback);
}
function GetNewWordBankObject() {
    return {
        title: DEFAULT_BANK_TITLE,
        words: [],
        ID: GetNewWordBankID(),
        color: GetNextRandomColor()
    }
}
function GetColorSelect(startColor,colorChanged) {
    var wordWrapper = document.createElement("div");
    wordWrapper.className = "word";

    var selector = document.createElement("div");
    selector.className = "color-select";
    var selected = null;
    function colorChangedPrefix() {
        if(selected) {
            selected.classList.remove("selected");
        }
        selected = this;
        this.classList.add("selected");
        if(colorChanged) {
            colorChanged(this.selectionValue);
        }
    }
    for(var i = 0;i<colors.length;i++) {
        var color = colors[i];
        var colorSelection = document.createElement("div");
        colorSelection.className = color;
        colorSelection.selectionValue = color;
        if(color === startColor) {
            selected = colorSelection;
            colorSelection.classList.add("selected");
        }
        colorSelection.addEventListener(
            "click",colorChangedPrefix.bind(colorSelection),true
        );
        selector.appendChild(colorSelection);
    }

    wordWrapper.appendChild(selector);
    return wordWrapper;
}
function GetWordInputPair(startWord,valueUpdated,wordDeleted) {
   var word = document.createElement("div");
   word.className = "word";

   var wordInput = document.createElement("input");
   wordInput.setAttribute("type","text");
   wordInput.setAttribute("placeholder","New word..");
   word.appendChild(wordInput);

   var selectElement = document.createElement("select");
   for(var i = 0;i<WORD_TYPES.length;i++) {
        var wordType = WORD_TYPES[i];
        var option = document.createElement("option");
        option.appendChild(document.createTextNode(
            WORD_TYPES_DISPLAY[i]
        ));
        option.value = wordType;
        selectElement.appendChild(option);
    }
    word.appendChild(selectElement);

    if(startWord) {
        var text = startWord.text;
        text = text.toLowerCase();
        text = text.charAt(0).toUpperCase() + text.slice(1);
        wordInput.value = text;
        selectElement.value = startWord.type;
    }

    function sendValueUpdated() {
        //todo input validation
        if(valueUpdated) {
            valueUpdated(
                wordInput.value,
                selectElement.value
            );
        }
    }
    function sendWordDeleted() {
        if(wordDeleted) {
            wordDeleted(word);
        }
    }

    wordInput.addEventListener("input",sendValueUpdated,true);
    selectElement.addEventListener("change",sendValueUpdated,true);

    var deleteButton = document.createElement("button");
    deleteButton.appendChild(document.createTextNode(
        "Delete"
    ));
    deleteButton.addEventListener("click",sendWordDeleted,true);
    word.appendChild(deleteButton);

    return word;
}
function GetNewWord() {
    return {
        text: "",
        type: "noun"
    }
}
function TextFilter(text) {
    text = text.toUpperCase();
    var buffer = "";
    for(var i = 0;i<text.length;i++) {
        var character = text.charAt(i);
        if(character in ALPHABET_LOOKUP) {
            buffer += character;
        }
    }
    return buffer;
}
function ShowWordBankModal(callback) {
    var popup = document.createElement("div");
    popup.className = "popup";

    function exit() {
        var currentWords = activeWordBank.words;
        for(var i = currentWords.length-1;i>=0;i--) {
            var word = currentWords[i].text;
            if(!word) {
                currentWords.splice(i,1);
            } else {
                word = TextFilter(word);
                if(!word) {
                    currentWords.splice(i,1);
                } else {
                    currentWords[i].text = word;
                }
            }
        }
        document.body.removeChild(popup);
        if(callback) {
            callback();
        }
    }

    var oldListener = exitButtonCallback;
    exitButton.style.zIndex = 3;
    var oldBorder = exitButton.style.border;
    exitButton.style.border = "none";

    exitButtonCallback = function() {
        exit();
        exitButtonCallback = oldListener;
        exitButton.style.border = oldBorder;
        delete exitButton.style.zIndex;
    }

    var popupModal = document.createElement("div");
    popupModal.className = "word-bank-modal";

    var titleInput = document.createElement("input");
    titleInput.className = "title";
    titleInput.setAttribute("placeholder",DEFAULT_BANK_TITLE);
    titleInput.setAttribute("type","text");
    if(activeWordBank.title && activeWordBank.title !== DEFAULT_BANK_TITLE) {
        titleInput.value = activeWordBank.title;
    }

    titleInput.addEventListener("input",function(){
        activeWordBank.title = titleInput.value;
    });

    popupModal.appendChild(titleInput);

    var wordBankList = document.createElement("div");
    wordBankList.classList = "words";

    var colorSelector = GetColorSelect(
        activeWordBank.color,function(newColor) {
            activeWordBank.color = newColor
        }
    );
    wordBankList.appendChild(colorSelector);

    function wordUpdated(text,type) {
        if(text) {
            this.text = text;
        }
        if(this.type) {
            this.type = type;
        }
    }
    function wordDeleted(wordElement) {
        this.text = "";
        wordBankList.removeChild(wordElement);
    }

    function addNewWord() {
        var newWord = GetNewWord();
        wordBankList.insertBefore(GetWordInputPair(
            newWord,
            wordUpdated.bind(newWord),
            wordDeleted.bind(newWord)
        ),wordBankList.lastChild);
        activeWordBank.words.push(newWord);
    }

    function layoutWords() {
        var total = wordBankList.childElementCount;
        for(var i = 1;i<total;i++) {
            wordBankList.removeChild(wordBankList.lastChild);
        }
        var currentWords = activeWordBank.words;
        for(var i = currentWords.length-1;i>=0;i--) {
            if(!currentWords[i].text) {
                currentWords.splice(i,1);
            }
        }
        for(var i = 0;i<currentWords.length;i++) {
            var currentWord = currentWords[i];
            if(!currentWord.text) {
                continue;
            }
            var wordPairElement = GetWordInputPair(
                currentWord,
                wordUpdated.bind(currentWord),
                wordDeleted.bind(currentWord)
            );
            wordBankList.appendChild(wordPairElement);
        }
        var createButton = document.createElement("button");
        createButton.appendChild(document.createTextNode(
            "New Word"
        ));
        createButton.className = "create";
        createButton.addEventListener("click",addNewWord,true);

        var buttonWordWrapper = document.createElement("div");
        buttonWordWrapper.className = "word";
        buttonWordWrapper.appendChild(createButton);
        wordBankList.appendChild(buttonWordWrapper);
    }
    layoutWords();

    popupModal.appendChild(wordBankList);
    popup.appendChild(popupModal);

    document.body.appendChild(popup);
}
function CreateNewWordBank(createCallback) {
    var newWordBank = GetNewWordBankObject();
    wordBanks.push(newWordBank);
    activeWordBank = newWordBank;
    ShowWordBankModal(function(){
        if(createCallback) {
            createCallback(true);
        }
    });
}
function ShowWordBankPage() {
    ShowPage(wordBanksPage,ReturnToMainMenu);
    function saveAndRefresh(scrollLast) {
        SaveWordBanks();
        refresh(scrollLast);
    }
    function refresh(scrollLast) {
        PopulateWordBankList(false,function(){
            CreateNewWordBank(saveAndRefresh);
        },function(editEvent){
            var wordBankID = editEvent.currentTarget.callbackID;
            EditWordBankByID(wordBankID,saveAndRefresh);
        },function(deleteEvent){
            var wordBankID = deleteEvent.currentTarget.callbackID;
            CustomPrompt(
                "Warning!","If you delete this word bank, you can't get it back!",[
                {text:"Do not delete",type:"good"},
                {text:"Delete",type:"bad"}
            ],function(callbackID){
                console.log("Yeet")
                if(callbackID === 1) {
                    DeleteWordBankByID(wordBankID);
                    saveAndRefresh();
                }
            });
        });
        if(scrollLast) {
            document.body.querySelector("div#word-banks div.word-banks").lastChild.scrollIntoView();
        }
    }
    refresh();
}
function ShowWordSelectionPage(callback,cancelCallback) {
    ShowPage(wordBanksPage,cancelCallback);
    PopulateWordBankList(true,null,function(selectEvent){
        var wordBankID = selectEvent.currentTarget.callbackID;
        activeWordBank = GetWordBankByID(wordBankID);
        if(callback) {
            callback();
        }
    },null);
}
function LoadWordBanks() {
    var data = localStorage.getItem(
        LOCAL_STORAGE_KEY
    );
    if(data !== null) {
        wordBanks = JSON.parse(data);
    } else {
        wordBanks = [];
    }
    for(var i = 0;i<wordBanks.length;i++) {
        var wordBank = wordBanks[i];
        if(!wordBank.color) {
            wordBank.color = "green";
        }
        if(wordBank.ID >= nextWordBankID) {
            nextWordBankID = wordBank.ID + 1;
        }
    }
}
function SaveWordBanks() {
    var saveData = JSON.stringify(wordBanks);
    localStorage.setItem(
        LOCAL_STORAGE_KEY,
        saveData
    );
}

if(DEBUG_PAGE === null) {
    ShowPage(mainMenu);
} else {
    LoadHangman();
}
