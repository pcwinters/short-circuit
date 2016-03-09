// TODO maybe integer constants
export const INITIAL_LOADING = "INITIAL_LOADING";
export const INITIAL_ERROR = "INITIAL_ERROR";
export const LOADED = "LOADED";
export const LOADING = "LOADING";
export const ERROR = "ERROR";

function isAny(state, ...toTest){
    // TODO loop
    for(var i=0; i<toTest.length; i++){
        const item = toTest[i];
        if(state === item){
            return true;
        }
    }
    return false;
}


export function hasLoaded(readyState){
    return !isAny(readyState, INITIAL_LOADING, INITIAL_ERROR);
}

export function isLoading(readyState){
    return isAny(readyState, INITIAL_LOADING, LOADING);
}

export function isError(readyState){
    return isAny(readyState, INITIAL_ERROR, ERROR);
}
