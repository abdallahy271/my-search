import { 
  ChromeMessage,
  Sender, 
  RemovedResult,
  MessageResponse 
} from "../types";
import jwt_decode, { JwtPayload } from 'jwt-decode';


// const SERVER_URL =  "https://history.world"
const SERVER_URL = "http://0.0.0.0:5000"
const OAUTH2_URL =  'https://accounts.google.com/o/oauth2/v2/auth'
let userEmail: string
let jwtToken: string
type TokenPayload = JwtPayload & { email: string };


const validateSender = (
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender
) => {
    return sender.id === chrome.runtime.id && message.from === Sender.React;
}

const messagesFromReactAppListener = (
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
    response: MessageResponse
) => {

    const isValidated = validateSender(message, sender);

    if (isValidated && message.message === 'Hello from React') {
        response('Hello from content.js');
    }

    if (isValidated && message.message === "delete logo") {
        const logo = document.getElementById('hplogo');
        logo?.parentElement?.removeChild(logo)
    }
}

function addWithFlask(
    request:ChromeMessage,
    sender: chrome.runtime.MessageSender, 
    sendResponse: MessageResponse
    ) {

    if (request.from === Sender.FlaskAdd && request.message.historyData.length > 0) {
      const { historyData, user } = request.message

      console.log('USER', user)
      console.log('allData', historyData)
      fetch(`${SERVER_URL}/add`,
        {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                "history": historyData,
                "user": user
            }),
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
            }
        }
        )
          .then(response => response.text())
          .then(text => {
            console.log(text)
            return text
          })
          .then(historyStatus => sendResponse(historyStatus))
          .catch(error => console.log(error))
      return true;  // Will respond asynchronously.
    }
  }

  function removeFromFlask(
    removed: RemovedResult
  ) {

    if (removed.urls && removed.urls.length > 0) {
      fetch(`${SERVER_URL}/delete`,
        {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                "removedSites": removed.urls,
                "user": userEmail
            }),
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
            }
        }
        )
          .then(response => response.text())
          .then(text => {
            console.log(text)
            return text
          })
          .catch(error => console.log(error))
      return true;  // Will respond asynchronously.
    }

      }


  function searchFromFlask(
    request:ChromeMessage,
    sender: chrome.runtime.MessageSender, 
    sendResponse: MessageResponse
    ) {
    if (request.from === Sender.FlaskSearch && request.message.keyword.length > 0) {
      const { keyword, userEmail, date } = request.message
      let after = 0, before = Date.now();
      if (date && date.length === 2){
        after = date[0]
        before = date[1]
      }
      
      fetch(`${SERVER_URL}/search?query=${keyword}&user=${userEmail}&after=${after}&before=${before}`,
      {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({
            "user": userEmail
        }),
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
        }
        })
        .then(response => response.json())
        .then(text => {
          console.log("Result", text)
          return text
        })
        .then(historyStatus => sendResponse({type: "Success", response: historyStatus}))
        .catch(error => console.log(error))
      return true;  // Will respond asynchronously.
    }
  }



  function sendData(jwtToken: string, userEmail: string) {
    let startTime = 0
    const endTime = Date.now()
    chrome.storage && chrome.storage.sync.get('last_updated', function(result) {
        
        if (result && Object.keys(result).length > 0){
            startTime = result['last_updated'] + 1
        }
        chrome.storage && chrome.storage.sync.set({"last_updated": endTime}, function() {
        });

        const historyInfo = {text: '', startTime, endTime};
        chrome.history && chrome.history.search(historyInfo, async historyData => {

        const response = await fetch(`${SERVER_URL}/add`,
            {
                method: 'POST',
                mode: 'cors',
                body: JSON.stringify({
                    "history": historyData,
                    "user": userEmail
                }),
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
                }
            })
        const text = await response.text()
        return text
      })
    })
  }

  function getUserAuth(
    request:ChromeMessage,
    sender: chrome.runtime.MessageSender, 
    sendResponse: MessageResponse
  ) {
    if (request.from === Sender.GetUserAuth) {
      // Using chrome.identity
          
      // @ts-ignore
      chrome.identity.getProfileUserInfo({'accountStatus': 'ANY'}, function(info){ console.log('INFOOO',info)})

      chrome.storage.sync.get('jwt_token', function(result) {

        let decodedToken = result['jwt_token'] && jwt_decode<TokenPayload>(result['jwt_token'])

        if(!result.hasOwnProperty('jwt_token') || !decodedToken?.exp || decodedToken?.exp * 1000 < Date.now()){

          const manifest = chrome.runtime.getManifest();
          const r = (Math.random() + 1).toString(36).substring(7);
          const CLIENT_ID = "1055552337084-2ut0l1cd1osq7j4d4uukdco9v8a6a2ml.apps.googleusercontent.com"
          const clientId = encodeURIComponent(CLIENT_ID);
          // @ts-ignore
          const scopes = encodeURIComponent(manifest?.oauth2.scopes.join(' '));
          const redirectUri = encodeURIComponent('https://' + chrome.runtime.id + '.chromiumapp.org');
          const nonce = encodeURIComponent(r)
    
          const URL = OAUTH2_URL + 
                    '?client_id=' + clientId + 
                    '&response_type=id_token' + 
                    '&access_type=offline' + 
                    '&redirect_uri=' + redirectUri + 
                    '&scope=' + scopes + 
                    '&nonce=' + nonce;
    
          chrome.identity.launchWebAuthFlow(
              {
                  'url': URL, 
                  'interactive': true
              }, 
              function(redirectedTo) {
                  if (!redirectedTo && chrome.runtime.lastError){
                    console.warn("Whoops.. " + chrome.runtime.lastError.message);
                    sendResponse({type: 'Failure', response: "Please Sign In to your Google Account"})
                    return true;
                  } 
                  else {

                      let response = redirectedTo?.split('#', 2)[1];
    
                      // Example: id_token=<YOUR_BELOVED_ID_TOKEN>&authuser=0&hd=<SOME.DOMAIN.PL>&session_state=<SESSION_SATE>&prompt=<PROMPT>
                      let token = response?.split('&', 1)[0]
                      let tokenId = token?.split('=')[1]
                      
                      if (tokenId != null){
                        jwtToken = tokenId
                        let user_info = jwt_decode<TokenPayload>(tokenId);
                        userEmail = user_info?.email
                        console.log(user_info)
    
                        chrome.storage.sync.set({ 'jwt_token': tokenId }, function(){})
                      }
    
                      sendData(jwtToken, userEmail)
                  }
              }
          );
        } else {
          jwtToken = result['jwt_token']
          console.log(decodedToken)

          userEmail = decodedToken?.email
          sendData(jwtToken, userEmail)
        }

        sendResponse({type: 'Success', response: userEmail})

      })

      return true;
    }
  }
         






const main = () => {
    console.log('[content.ts] Main', chrome?.runtime?.id)
    /**
     * Fired when a message is sent from either an extension process or a content script.
     */

    chrome.runtime.onMessage.addListener(addWithFlask);
    chrome.runtime.onMessage.addListener(searchFromFlask);
    chrome.runtime.onMessage.addListener(messagesFromReactAppListener);
    chrome.runtime.onMessage.addListener(getUserAuth);
    chrome.history.onVisitRemoved.addListener(removeFromFlask);
}

main();
