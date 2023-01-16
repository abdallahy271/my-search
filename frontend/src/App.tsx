import { useEffect, useState } from 'react';
import { ChromeMessage, Sender } from "./types";
import { SearchBar } from "./components/SearchBar"
import './App.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const App = () => {
    const [error, setError] = useState<string| undefined>('');
    const [userEmail, setUserEmail] = useState("");

    async function getUserAuth() {
        const message: ChromeMessage = {
            from: Sender.GetUserAuth,
            // @ts-ignore
            message: {}
        }
        chrome.runtime.sendMessage(
            message, ({type, response}) => {
                switch (type){
                    case "Success":
                        setUserEmail(response)
                        break
                    case "Failure":
                        setError(response)
                        break
                    default:
                }
            })
      }

   
    useEffect(() => {
        getUserAuth()
    }, [])


    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <div className="App">
                <div className="content">
                    <h6>mysearch</h6>
                    <h6>mysearch</h6>
                </div>
                <div></div>
                <SearchBar userEmail={userEmail} error={error} setError={setError}/>
            </div>
        </ThemeProvider>

    );
};

export default App;
