export function validateClientId(clientId) {
    if(typeof clientId !== "string" || clientId.trim() === "") {
        return null;
    }
    const cleaned=clientId.trim();
    if(cleaned.length===0){
        return null;
    }
    if(cleaned.length>100){
        return null;
    }
    return cleaned;
}
