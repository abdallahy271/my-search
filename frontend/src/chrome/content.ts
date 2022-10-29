import { ChromeMessage, Sender } from "../types";

type MessageResponse = (response?: any) => void

const SERVER_URL =  "http://localhost:5000"
const OAUTH2_URL =  "https://www.googleapis.com/oauth2/v3"

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
            'Content-Type': 'application/json'
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


  function searchFromFlask(
    request:ChromeMessage,
    sender: chrome.runtime.MessageSender, 
    sendResponse: MessageResponse
    ) {
    if (request.from === Sender.FlaskSearch && request.message.keyword.length > 0) {
      const { keyword, userEmail } = request.message
      console.log(keyword, userEmail)
      fetch(`${SERVER_URL}/search?query=${keyword}&user=${userEmail}`,
        {
            method: 'GET',
            mode: 'cors',
            headers: {
            'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(text => {
          return text
        })
        .then(historyStatus => sendResponse({type: "Success", response: historyStatus}))
        .catch(error => console.log(error))
      return true;  // Will respond asynchronously.
    }
  }

  function getUserAuth(
    request:ChromeMessage,
    sender: chrome.runtime.MessageSender, 
    sendResponse: MessageResponse
  ) {
    if (request.from === Sender.GetUserAuth) {

      chrome.identity.getAuthToken({'interactive': true}, async (token) => {
          if (!token && chrome.runtime.lastError){
            console.warn("Whoops.. " + chrome.runtime.lastError.message);
            sendResponse({type: 'Failure', response: "Please Sign In to your Google Account"})
            return true;
          }
          const response = await fetch(`${OAUTH2_URL}/userinfo?access_token=${token}`)
          const user_info = await response.json()
          console.log('user_info', user_info)

        
          let startTime = 0
          const endTime = Date.now()
          chrome.storage && chrome.storage.sync.get('last_updated', function(result) {
              
              if (result && Object.keys(result).length > 0){
                  startTime = result['last_updated'] + 1
              }
              chrome.storage && chrome.storage.sync.set({"last_updated": endTime}, function() {
              });

              console.log('historyTime', {startTime, endTime})
              const historyInfo = {text: '', startTime, endTime};
              chrome.history && chrome.history.search(historyInfo, async historyData => {

              const response = await fetch(`${SERVER_URL}/add`,
                  {
                      method: 'POST',
                      mode: 'cors',
                      body: JSON.stringify({
                          "history": historyData,
                          "user": user_info?.email
                      }),
                      headers: {
                      'Content-Type': 'application/json'
                      }
                  })
              const text = await response.text()
              return text
            })
            })
            sendResponse({type: 'Success', response: user_info?.email})
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

}

main();
