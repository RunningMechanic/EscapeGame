import { Autocomplete, AutocompleteProps, Box, Button, Combobox, ComboboxItem, Divider, Flex, Group, Input, InputBase, OptionsFilter, Pill, PillGroup, Space, Text, useCombobox } from "@mantine/core";
import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";
import { ReceptionData, searchKeys, SearchParameter } from "./search";


interface Props {
    onUpdate: (values: SearchParameter[], raw: string) => void,
    receptions: ReceptionData[]
}

export default (({ onUpdate, receptions }) => {
    const autocompleteBox = useCombobox()
    const [search, setSearch] = useState<SearchParameter[]>([])
    const [autocomplete, setAutoComplete] = useState<string>("")
    const [autocompleteError, setAutoCompleteError] = useState<string | null>(null)
    const [suggestions, setSuggestions] = useState<string[]>([])

    function validateValue(type: string, value: string): boolean {
        switch (type) {
            case "boolean":
                return value == ""
            case "number":
                return /^\d+$/.test(value)
            case "time":
                return DateTime.fromFormat(value, "H:m").isValid
        }
        return false
    }

    function cutInvertPrefix(d: string): string {
        if (d == "!") return d
        return d.startsWith("!") ? d.substring(1) : d
    }

    function parseAutocomplete(data: string, cb?: (value: SearchParameter) => void): boolean {
        const args = data.split(":")

        const inverted = args[0].startsWith("!")
        const keyName = cutInvertPrefix(args[0])
        const value = args.slice(1).join(":")
        const key = searchKeys.find(p => p.name == keyName)
        if (!keyName || !key) return false
        if (!validateValue(key.type, value)) return false
        
        if (cb) cb({ key: keyName, value: value || "", inverted })
        return true
    }

    useEffect(() => {
        setAutoCompleteError(null)
        if (parseAutocomplete(autocomplete.trimEnd())) {
            if (autocomplete.endsWith(" ")) {
                addParameter(autocomplete.trimEnd())
            }
        } else {
            if (autocomplete != "") setAutoCompleteError("エラー: 無効な検索フィルタです")
        }
        const addedMap = Array.from(search)
        parseAutocomplete(autocomplete, addedMap.push.bind(addedMap)) ? onUpdate(addedMap, "") : onUpdate(search, "")
        setSuggestions(createSuggestions(autocomplete))
    }, [autocomplete])

    function addParameter(data: string) {
        if (!parseAutocomplete(data)) {
            setAutoCompleteError("エラー: 無効な検索フィルタです")
            return
        }
        parseAutocomplete(data, search.push.bind(search))
        setSearch(Array.from(search))
        setAutoComplete("")
        onUpdate(search, "")
    }

    function handleBackspace(): boolean {
        if (autocomplete != "") return false
        
        let lastValue = search.pop()
        if (!lastValue) return false
        setSearch(Array.from(search))

        if (lastValue.value != "") lastValue.value = ":" + lastValue.value;

        setAutoComplete(`${lastValue.inverted ? "!" : ""}${lastValue.key}${lastValue.value}`)
        return true
    }

    function createValueSuggestions(searchText: string): string[] {
        const key = cutInvertPrefix(searchText).split(":")[0]
        const result = receptions.map(reception => {
            const searchKey = searchKeys.find(k => key.startsWith(k.name))
            if (!searchKey || !searchKey.receptionKey) return null
            switch (searchKey.type) {
                case "time":
                    return DateTime.fromISO(reception[searchKey.receptionKey]!.toString()).setZone("Asia/Tokyo").toFormat("HH:mm")
                case "number":
                    return reception[searchKey.receptionKey]?.toString()
            }
            return null
        }).filter(p => p != null).filter(p => p.startsWith(searchText.split(":").slice(1).join(":")))
        
        return result
    }

    function createKeySuggestions(searchText: string): string[] {
        let result = []
        if (!searchText.startsWith("!")) result.push("!")
        result.push(...searchKeys.map(p => `${p.name}${p.type == "boolean" ? "" : ":"}`).map(p => `${searchText.startsWith("!") ? "!" : ""}${p}`))
        return result
    }

    function removeParameter(index: number) {
        const ret = Array.from(search).filter((_, i) => i != index)
        setSearch(ret)
        onUpdate(ret, "")
    }


    function clearFilter() {
        setSearch([])
        setAutoComplete("")
        onUpdate([], "")
    }

    const createOption = (option: string) => {
        const searchKey = searchKeys.find(p => cutInvertPrefix(option).startsWith(p.name))
        let description = searchKey?.description || ""
        if (option == "!") description = "フィルタを反転する"
        return (
            <Combobox.Option value={cutInvertPrefix(option)} key={option}>
                <Group align="center" style={{width: "100%"}} >
                    <Text>{option}</Text>
                    <div style={{"flexGrow": "1"}}>
                        <Divider label={
                            `${autocomplete.startsWith("!") ? "(反転) " : ""}${description}`
                        } labelPosition="right" variant="dotted" />
                    </div>
                </Group>
            </Combobox.Option>
        )
    }

    function handleOptionSubmit(option: string) {
        let invert = "", key = "", value = ""
        if (autocomplete.startsWith("!")) invert = "!"
        
        if (cutInvertPrefix(autocomplete).split(":")[0] == option) {
            key = option
        } else {
            const searchKey = searchKeys.find(p => cutInvertPrefix(autocomplete).split(":")[0] == p.name)
            key = searchKey ? searchKey.name + ":" : ""
        }
       
        if (autocomplete.split(":").length >= 2 && cutInvertPrefix(autocomplete).split(":").slice(1).join(":") == option) {
            value = option
        } else if (key != cutInvertPrefix(option)) {
            value = option
        }

        setAutoComplete(invert + key + value)
    }

    function createSuggestions(searchText: string) {
        const result = searchText.includes(":") ? createValueSuggestions(searchText) : createKeySuggestions(searchText)
        return result
    }


    return (
        <InputBase component="div" style={{width: "100%"}} error={autocompleteError} rightSection={(
            <Input.ClearButton onClick={clearFilter}></Input.ClearButton>
        )}>
            <Flex align="center">
                <PillGroup>
                    {search.map((param, index) => (
                        <Pill key={`${param.key}-${index}`} withRemoveButton onRemove={() => removeParameter(index)}>{param.inverted ? "!" : ""}{param.key}{param.value != "" ? ": " + param.value : ""}</Pill>
                    ))}
                </PillGroup>
                <Combobox store={autocompleteBox} onOptionSubmit={handleOptionSubmit}>
                    <Combobox.Target>
                        <Input placeholder="検索... (!でフィルタを反転)" variant="unstyled" styles={{input: {border: "none"}}} value={autocomplete} onInput={
                            (event) => setAutoComplete(event.currentTarget.value)
                        } style={{flexGrow: "1"}} onKeyDown={(event) => {
                            if (event.key == "Enter" && autocomplete.includes(":")) {
                                addParameter(autocomplete);
                                setAutoComplete("")
                            } else if (event.key == "Backspace") {
                                handleBackspace() && event.preventDefault()
                            }
                        }} onFocus={() => autocompleteBox.openDropdown()} onClick={() => autocompleteBox.openDropdown()} onBlur={() => autocompleteBox.closeDropdown()}></Input>
                    </Combobox.Target>
                    <Combobox.Dropdown hidden={suggestions.length === 0}>
                        <Combobox.Options mah={200} style={{ overflowY: 'auto' }}>
                            {suggestions.map(createOption)}
                        </Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>
            </Flex>
        </InputBase>
    )
}) satisfies React.FC<Props>