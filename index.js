let port;
let reader;
let inputDone;
let outputDone;
let inputStream;
let outputStream;

var inRawRepl = false;

const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton')
const ctrlAButton = document.getElementById('ctrla')
const ctrlBButton = document.getElementById('ctrlb')
const ctrlCButton = document.getElementById('ctrlc')
const ctrlDButton = document.getElementById('ctrld')
const ctrlEButton = document.getElementById('ctrle')
const enterRawREPLButton = document.getElementById('enterRawREPL')
const leaveRawREPLButton = document.getElementById('leaveRawREPL')
const sendButton = document.getElementById('send')
const clearButton = document.getElementById('clear')



connectButton.addEventListener('click', e => {
    clickConnect();
});

disconnectButton.addEventListener('click', e => {
    disconnect();
})

ctrlAButton.addEventListener('click', e => {
    writeToStream('\01');
})

ctrlBButton.addEventListener('click', e => {
    writeToStream('\02');
})

ctrlCButton.addEventListener('click', e => {
    writeToStream('\03\03');
})

ctrlDButton.addEventListener('click', e => {
    writeToStream('\04');
})

ctrlEButton.addEventListener('click',e => {
    writeToStream('\05')
} )


sendButton.addEventListener('click', e => {
    var inputText = document.getElementById('multiLineInput')
    it = inputText.value
    console.log(it);
    ait = it.split('\n');
    console.log(ait);
    for (i = 0; i < ait.length; i++) {
        writeToStream(ait[i]);
      }
    
})

clearButton.addEventListener('click', e => {
    document.getElementById('multiLineInput').value = "";
})



enterRawREPLButton.addEventListener('click',e => {
   
    console.log("entering Raw REPL");
    writeToStream('\01\05A\x01');
    inRawRepl = true;
} )

leaveRawREPLButton.addEventListener('click',e => {
    console.log("leaving Raw REPL");
    writeToStream('\04\02')
    inRawRepl = false;
} )


//Connect to the Serial Port
const connect = async () => {

    var baudrate = document.getElementById('baudrate').value;
    var databits = document.getElementById('databits').value;
    var stopbits = document.getElementById('stopbits').value;
    var parity = document.getElementById('parity').value;

    console.log('baudrate: '+baudrate+' databits: '+databits+' parity: '+parity+ ' stopbits: '+stopbits)
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: baudrate, dataBits: databits, parity: parity, stopBits: stopbits })  // Permission issues caused by this


    //Creating an Input Stream 
    let decoder = new TextDecoderStream();
    inputDone = port.readable.pipeTo(decoder.writable);
    inputStream = decoder.readable;

    reader = inputStream.getReader();


    const encoder = new TextEncoderStream();
    outputDone = encoder.readable.pipeTo(port.writable);
    outputStream = encoder.writable;

    document.getElementById("connectButton").disabled = true;
    document.getElementById('databits').disabled = true;
    document.getElementById('baudrate').disabled = true;
    document.getElementById('stopbits').disabled = true;
    document.getElementById('parity').disabled = true;
    document.getElementById("disconnectButton").disabled = false;

    writeToStream('\n');
    await readOne();
}

//disconnect from the serial port
const disconnect = async () => {
    if (reader) {
        await reader.cancel();
        await inputDone.catch(() => { });
        reader = null;
        inputDone = null;
    }

    if (outputStream) {
        await outputStream.getWriter().close();
        await outputDone;
        outputStream = null;
        outputDone = null;
    }

    await port.close();
    port = null;
    document.getElementById("connectButton").disabled = false;
    document.getElementById('databits').disabled = false;
    document.getElementById('parity').disabled = false;
    document.getElementById('stopbits').disabled = false;
    document.getElementById('baudrate').disabled = false;
    document.getElementById("disconnectButton").disabled = true;
}

const clickConnect = async () => {
    await connect()
}

const readLoop = async () => {


    while (true) {
        const { value, done } = await reader.read();
        if (value) {
            console.log(value);

        }
        if (done) {
            console.log('[readLoop] DONE', done);
            reader.releaseLock();
            console.log('disconnected')
            break;
        }
    }
}

const readOne = async () => {

    for (let i = 0; i < 20; i++) {
        const { value, done } = await reader.read();
        if (value) {
            console.log(value);
            document.getElementById('multiLineOutput').textContent += value;   
            document.getElementById("multiLineOutput").scrollTop = document.getElementById("multiLineOutput").scrollHeight
        }
    }
}

/*
function findTextInBuffer(textList,textToFind) {
    let wordArrayPosition = 0;
    textList.some((el, idx) => {
        let innerIndex = el.indexOf(textToFind);
        if (innerIndex !== -1) {
            wordArrayPosition = idx;
            return;
        }


    })
    return wordArrayPosition
}
*/


const writeToStream = (...lines) => {
    const writer = outputStream.getWriter();
    lines.forEach((line) => {
        console.log('[SEND]', line);
        if (inRawRepl == false) { 
            console.log("sending normal string");
            writer.write(line + '\r');
        } else {
            console.log("sending raw repl string");
            writer.write(line + '\04');
        }
    });
    writer.releaseLock();
}