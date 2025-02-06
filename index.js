import {CreateWebWorkerMLCEngine} from 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/+esm';

const $=el=>document.querySelector(el);
const $input=$('input');
const $template=$('#message-template');
const $messagesui=$('ul');
const $container=$('main');
const $button=$('button');
const $small=$('div');
const SELECTED_MODEL="RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC";

const engine=await CreateWebWorkerMLCEngine(
    new Worker('./worker.js',{type:'module'}),
    SELECTED_MODEL,
    {
        initProgressCallback:info=>{
            $small.textContent='Cargando modelo: '+Math.round(info.progress*100)+'%';
            if (info.progress===1) {
                $button.removeAttribute('disabled');
                $small.style.display='none';
                $input.focus();
            }
        }
    }
);

let messages=[];

$button.addEventListener('click',async e=>{
    e.preventDefault();
    const messageText=$input.value.trim();

    if (messageText!=='') {
        $input.value='';
    }

    addMsgToDom(messageText,'user');
    $button.setAttribute('disabled','');

    const userMessage={
        role:'user',
        content:messageText
    };

    messages.push(userMessage);

    const msgIaParts =await engine.chat.completions.create({
        messages,
        stream:true //generar las partes del mensage
    });

    let reply='';

    const $iaText=addMsgToDom('','bot');

    for await(const msgPart of msgIaParts){
        const choice=msgPart.choices[0];
        const content=choice?.delta?.content ?? "";
        reply+=content;

        $iaText.textContent=reply;
    }

    $button.removeAttribute('disabled');

    messages.push({
        role:'assistant',
        content:reply
    });

    $container.scrollTop=$container.scrollHeight;
});

function addMsgToDom(msgText,whoSend){
    const clonedTemplate=$template.content.cloneNode(true);
    const $newMessage=clonedTemplate.querySelector('.message');
    
    const $who=$newMessage.querySelector('span');
    const $msg=$newMessage.querySelector('p');

    $who.textContent=whoSend==='bot'?'IA':'Tu';
    $msg.textContent=msgText;
    $newMessage.classList.add(whoSend);

    $messagesui.appendChild($newMessage);

    $container.scrollTop=$container.scrollHeight;
    
    return $msg;
}
