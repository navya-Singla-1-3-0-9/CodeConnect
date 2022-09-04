// Retrieve Elements
const executeCodeBtn = document.querySelector('.editor__run');
const resetCodeBtn = document.querySelector('.editor__reset');
let consoleMessages = [];
let op = document.querySelector(".editor__console-logs");


// Setup Ace
let codeEditor = ace.edit("editorCode");
let defaultCode = 'console.log("Hello World!")';

let editorLib = {
    init() {
        // Configure Ace

        // Theme
        codeEditor.setTheme("ace/theme/dracula");

        // Set language
        codeEditor.session.setMode("ace/mode/javascript");

        // Set Options
        codeEditor.setOptions({
           
            fontSize: '12pt',
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
        });

        // Set Default Code
        codeEditor.setValue(defaultCode);
    }
}

// Events
executeCodeBtn.addEventListener('click', () => {
    // Get input from the code editor
    const userCode = codeEditor.getValue();
    

    // Run the user code
    try {
        new Function(userCode)();
        op.innerHTML="";
        for(let output of consoleMessages){
            op.innerHTML+=`<li>${output.message}</li>`
        }
        op.innerHTML+=`<hr/>`
        consoleMessages=[];
        
    } catch (err) {
        console.error(err);
    }
});

resetCodeBtn.addEventListener('click', () => {
    // Clear ace editor
    codeEditor.setValue(defaultCode);
})

editorLib.init();