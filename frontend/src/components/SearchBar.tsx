import React, { useEffect, useState } from 'react';
import { ChromeMessage, Sender } from "../types";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { DateRangePicker, CustomProvider } from 'rsuite';
import FilterToggle from './FilterToggle';


interface SearchBarProp {
    userEmail: string;
    error: string| undefined;
    setError:  React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const SearchBar: React.FC<SearchBarProp> = ({ userEmail, error, setError }) => {
    const [searchInput, setSearchInput] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [date, setDate] = useState<number[] | null>([])
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false)

    const handleChange = (e: any) => {
        e.preventDefault();
        setSearchInput(e.target.value);
      };

    function epoch(val: Date): number   {
        return val?.getTime()
    }

    function searchHistory(keyword: string, date: number[]| null) {

        const message: ChromeMessage = {
            from: Sender.FlaskSearch,
            message: { keyword, userEmail, date },
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
        if (!showDatePicker) {
            setDate([])
        }
    }, [showDatePicker])

    useEffect(() => {
        if (searchInput.length > 0) {
            //make api call to search
            searchHistory(searchInput, date)
        }else{
            setSearchResult([])
        }
    },[searchInput, date])
    
    if (error)
        return <div>{error}</div>
    
    return (
            <>
            <Box
                sx={{
                    width: 400,
                    maxWidth: '100%',
                    marginBottom: 2,
                    display: 'flex',
                }}
            >
                <TextField 
                fullWidth 
                label="Search..." 
                id="fullWidth" 
                color="primary"
                onChange={handleChange}
                value={searchInput}
                sx={{ input: { color: "white", }, marginRight: 2}}
                />

                <FilterToggle setShowDatePicker={setShowDatePicker}/>

            </Box>
                {showDatePicker && (
                    <Box
                    sx={{
                        width: 400,
                        maxWidth: '100%',
                        display: 'flex',

                    }}
                    >
                    <CustomProvider theme="dark">
                        <DateRangePicker
                        className=''
                        format="yyyy-MM-dd hh:mm aa"
                        showMeridian
                        defaultCalendarValue={[new Date(), new Date()]}
                        onChange={(displyedDate) => setDate(displyedDate && displyedDate?.map(epoch))}
                        />
                    </CustomProvider>
                </Box>
            )}
            
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