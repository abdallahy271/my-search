import React, { useEffect, useState } from 'react';
import { ChromeMessage, Sender } from "../types";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

interface SearchBarProp {
    userEmail: string;
    error: string| undefined;
    setError:  React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const SearchBar: React.FC<SearchBarProp> = ({ userEmail, error, setError }) => {
    const [searchInput, setSearchInput] = useState("");
    const [searchResult, setSearchResult] = useState([]);

    const handleChange = (e: any) => {
        e.preventDefault();
        setSearchInput(e.target.value);
      };


    function searchHistory(keyword: string) {

        const message: ChromeMessage = {
            from: Sender.FlaskSearch,
            message: { keyword, userEmail },
        }
        chrome?.runtime?.sendMessage(
            message,
            ({type, response}) => {
                switch (type){
                    case "Success":
                        setSearchResult(response)
                        break
                    case "Failure":
                        setError(response)
                        break
                    default:
                }
            })
      }

    useEffect(() => {
        if (searchInput.length > 0) {
            //make api call to search
            searchHistory(searchInput)
        }else{
            setSearchResult([])
        }
    },[searchInput])
    
    if (error)
        return <div>{error}</div>

    return (
            <>
            <Box
                sx={{
                    width: 300,
                    maxWidth: '100%',
                    marginBottom: 2
                }}
            >
                <TextField 
                fullWidth 
                label="Search..." 
                id="fullWidth" 
                color="primary"
                onChange={handleChange}
                value={searchInput}
                sx={{ input: { color: "white" } }}
                />

            </Box>
            <Box
                sx={{
                    width: 700,
                    maxWidth: '100%',
                }}
            >
                <List>
                    {searchResult?.map((search: any, i) => (
                        <ListItem disablePadding>
                        <ListItemButton component="a" target='_blank' href={`${search['url']}`} >
                          <ListItemText primary={search['title']} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                </List>
             </Box>
        </>
    )
}