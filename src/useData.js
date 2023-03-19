import { useState, useEffect, useCallback, useMemo } from 'react';

const MODIFICATIONS_KEY = 'modifications-cache';
const ls = window.localStorage;
const get = (key, defaultValue) => {
    const d = ls.getItem(key);
    return d ? JSON.parse(d) : defaultValue;
};
const set = (key, value) => {
    ls.setItem(key, JSON.stringify(value));
}

function save(filename, data) {
    const blob = new Blob([data], {type: 'text/csv'});
    if(window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else{
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
    }
}


export function useData() {


    const [data, setData] = useState(null);
    const [modifications, _setModifications] = useState(get(MODIFICATIONS_KEY, {}));
    const setModifications = useCallback((value) => {
        _setModifications(value);
        set(MODIFICATIONS_KEY, value);
    }, []);
    console.log('modifications', modifications);
    const [currentIndex, setCurrentIndex] = useState(null);

    const current = useMemo(() => {
        if (!data) {
            return null;
        }
        const e = data[currentIndex];
        if (modifications[e.id]) {
            return { ...e, ...modifications[e.id] };
        }
        return e;
    }, [data, currentIndex, modifications]);

    const currentIsModified = useMemo(() => {
        if (!current) {
            return false;
        }
        return Boolean(modifications[current.id]);
    }, [current, modifications]);

    const next = useCallback(() => {
        const history = get('history', []);
        console.log(history);
        set('history', [...history, current.id]);
        setCurrentIndex(Math.floor(Math.random() * data.length));
    }, [data, current?.id]);

    const previous = useCallback(() => {
        const history = get('history', []);
        if (history.length === 0) {
            return;
        }
        const id = history.pop();
        set('history', history);
        const index = data.findIndex(e => e.id === id);
        if (index === -1) {
            return;
        }
        setCurrentIndex(index);
    }, [data]);

    useEffect(() => {
        async function getFromCacheOrLoad() {
            const raw = await fetch('https://marekventur.github.io/better-instructions/instructions.json');
            const data = await raw.json();
            setData(data);
            setCurrentIndex(Math.floor(Math.random() * data.length));
        }
        getFromCacheOrLoad().catch(console.error);
    }, []);

    const setCurrentModifications = useCallback((key, value) => {
        const newModifications = { ...modifications }
        const prevModifications = newModifications[current.id] || {};
        let newModifiedArray = (prevModifications?.modified || [])
        newModifiedArray = newModifiedArray.indexOf('human') === -1
            ? [...newModifiedArray, 'human']
            : [...newModifiedArray];
        newModifications[current.id] = { ...prevModifications, modified: newModifiedArray, [key]: value };
        setModifications(newModifications);
    }, [current?.id, modifications, setModifications]);

    const setCurrentIsHumanVerified = useCallback((state) => {
        const newModifications = { ...modifications }
        const prevModifications = newModifications[current.id] || {};
        let newVerifiedArray = (prevModifications?.modified || [])
        if (state) {
            newVerifiedArray = newVerifiedArray.includes('human')
                ?[...newVerifiedArray] : [...newVerifiedArray, 'human'];
        } else {
            newVerifiedArray = newVerifiedArray.filter(e => e !== 'human');
        }
        newModifications[current.id] = { ...prevModifications, verified: newVerifiedArray };
        setModifications(newModifications);
    }, [current?.id, modifications, setModifications]);

    const undoModifications = useCallback(() => {
        const newModifications = Object.fromEntries(Object.entries(modifications).filter(([key]) => key !== current?.id));
        setModifications(newModifications);
    }, [current?.id, modifications, setModifications]);

    const currentIsHumanVerified = useMemo(() =>
        current?.verified?.includes('human'), 
    [current?.verified]);

    const download = useCallback(() => {
        const newData = [...data]
        for (const [id, modification] of Object.entries(modifications)) {
            const index = newData.findIndex(e => e.id === id);
            if (index === -1) {
                continue;
            }
            newData[index] = { ...newData[index], ...modification };
        }
        save('instructions.json', JSON.stringify(newData, null, 2));
    }, [data, modifications]);

    const deleteCurrent = useCallback((state) => {
        if (state) {
            setModifications({...modifications, [current.id]: {delete: true}});
        } else {
            undoModifications();
        }
    }, [current?.id, modifications, setModifications, undoModifications]);

    const clearModifications = useCallback(() => {
        setModifications({});
    }, []);

    return { 
        data, 
        current, 
        modifications, 
        setCurrentModifications, 
        setCurrentIsHumanVerified, 
        currentIsHumanVerified, 
        next, 
        previous,
        currentIsModified, 
        undoModifications, 
        download, 
        clearModifications,
        deleteCurrent,
    };
}