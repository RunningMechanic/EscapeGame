import { Autocomplete, ComboboxItem, ComboboxParsedItem, ComboboxProps, Flex, Grid, Group, InputBase, OptionsFilter, Pill, PillGroup } from "@mantine/core";
import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";
import { Reception } from "@prisma/client";


interface ReceptionData {
    id: number;
    time: string;
    number: number;
    name?: string;
    alignment: boolean;
    gameStartTime?: string;
    gameStarted?: boolean;
    timeTaken?: number | null;
    cancelled?: boolean
}

interface SearchKey {
    name: string,
    isBoolean: boolean,
    type: string
}

interface Props {
    onUpdate: (values: Map<string, string>, raw: string) => void
}

const keys: SearchKey[] = [
    {name: "id", isBoolean: false, type: "number"},
    {name: "time", isBoolean: false, type: "time"},
    {name: "gameStart", isBoolean: false, type: "time"},
    {name: "started", isBoolean: true, type: "boolean"},
    {name: "person", isBoolean: false, type: "number"}
]

export default (({ onUpdate }) => {
    const [search, setSearch] = useState<Map<string, string>>(new Map())
    const [autocomplete, setAutoComplete] = useState<string>("")
    const [autocompleteError, setAutoCompleteError] = useState<string | null>(null)


    function validateAutocomplete(input: string): boolean {
        if (input.includes(":")) {
            const arr = input.split(":")
            const key = keys.find(p => p.name == arr[0])
            if (arr.length >= 2 && key) {
                const value = arr.slice(1).join(":").trim()
                if (key.type == "boolean" && value == "") return true
                if (value == "") return false
                switch (key.type) {
                    case "number":
                        if (!Number.isNaN(value)) return true
                        break
                    case "time":
                        if (DateTime.fromFormat(value, "H:m").isValid) return true
                        break
                }
                return false
            }
        }
        return true
    }

    useEffect(() => {
        setAutoCompleteError(null)
        if (keys.map(p => p.name).includes(autocomplete) && keys.find(p => p.name == autocomplete)?.isBoolean && !autocomplete.includes(":")) {
            addParameter(autocomplete)
        }
        if (autocomplete.endsWith(" ") && validateAutocomplete(autocomplete)) {
            addParameter(autocomplete.trimEnd())
        }
        const addedMap = new Map(search)
        if (autocomplete.split(":").length >= 2) {
            addedMap.set(autocomplete.split(":")[0], autocomplete.split(":").slice(1).join(":"))
        }
        onUpdate(addedMap, autocomplete)
    }, [autocomplete])

    function addParameter(data: string) {
        if (!validateAutocomplete(data)) {
            setAutoCompleteError("エラー: 無効な検索フィルタです")
            return
        }
        const [key, ...param] = data.split(":")
        search.set(key, param.join(":") || "")
        setSearch(new Map(search))
        setAutoComplete("")
        
    }

    function handleBackspace(): boolean {
        if (autocomplete != "") return false
        const lastKey = Array.from(search.keys())[search.size - 1]
        if (!lastKey) return false
        let lastValue = search.get(lastKey)
        search.delete(lastKey)
        if (lastValue != "") lastValue = ":" + lastValue
        setAutoComplete(`${lastKey}${lastValue}`)
        return true
    }

    function removeParameter(key: string) {
        search.delete(key)
        setSearch(new Map(search))
    }

    const filterParameter: OptionsFilter = (({ options, search: searchText }) => {
        return (options as ComboboxItem[]).filter((option) => {
            return !Array.from(search.keys()).includes(option.label.split(":")[0])
        });
    })

    return (
        <InputBase style={{width: "100%"}} component="div" error={autocompleteError}>
            <Flex align="center">
                <PillGroup>
                    {Array.from(search.entries()).map(([key, value]) => (
                        <Pill key={key} withRemoveButton onRemove={() => removeParameter(key)}>{key}: {value != "" ? value : "true"}</Pill>
                    ))}
                </PillGroup>
                <Autocomplete style={{"flexGrow": "1"}} filter={filterParameter} variant="unstyled" value={autocomplete} placeholder="検索..." data={
                    keys.map(p => `${p.name}${p.isBoolean ? "" : ":"}`)
                } onChange={
                    (value) => setAutoComplete(value)
                } onKeyDown={(event) => {
                    if (event.key == "Enter" && autocomplete.includes(":")) {
                        addParameter(autocomplete);
                        setAutoComplete("")
                    } else if (event.key == "Backspace") {
                        handleBackspace() && event.preventDefault()
                    }
                }}
                ></Autocomplete>
                
            </Flex>
        </InputBase>
        
    )
}) satisfies React.FC<Props>